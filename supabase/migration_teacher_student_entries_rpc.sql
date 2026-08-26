-- ============================================================================
-- La Voce: 先生が生徒の記録を読むための、列単位の絞り込みつき取得関数
--
-- Supabase の SQL Editor でこの内容をそのまま実行してください（何度実行しても安全です）。
--
-- 【なぜ必要か】
--   PostgreSQL の RLS は「行」単位の制御であり、「列」単位ではありません。
--   これまでクライアントは entries に対して select("*") をしており、生徒が
--   共有を許可していない項目（睡眠・心の余裕・稽古ノート等）まで、先生の
--   ブラウザに届いていました。画面に描画していなかっただけです。
--   統合実行ルートv4 §11「RLS だけで守らない。サーバー側の canView() と二重にする」
--   に従い、列の絞り込みをここで行います。
--
-- 【★重要な設計】
--   健康データの共有は、教室（organizations / memberships / assignments）とは
--   完全に独立した、1対1の連携（teacher_student_links）だけで判定します。
--   オーナー・管理者・担当講師という「教室での役割」は一切参照しません。
--   したがって、担当していない生徒の健康データを管理者が見る経路はありません。
--   （この関数は他テーブルのポリシーを参照しないため、RLSの再帰も起こしません）
--
-- 【対応表の同期】
--   列と共有範囲の対応は lib/shareScope.js と1対1です。
--   components/tests/share-scope.test.js が、この2つのズレを検出します。
--   entries に列を足したときは、両方に足してください。足し忘れた列は
--   ここに現れないため、自動的に「共有しない」側に倒れます（fail closed）。
-- ============================================================================

create or replace function public.get_student_entries(p_student_id uuid, p_limit int default 60)
returns setof jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_scope   jsonb;
  v_allowed text[] := array[]::text[];
  v_denied  text[];
  -- 対応表に載っている全列。ここに無い列は、値も null も返しません。
  v_known   text[] := array[
    'throat_condition', 'voice_quality', 'voice_checkins', 'voice_entries',
    'voice_memo', 'wake_note', 'routine_note', 'resonance_score',
    'pianissimo_high_note', 'pianissimo_onset_delay', 'cpps_value', 'throat_symptoms',
    'throat_symptoms_other', 'sleep_hours', 'sleep_quality', 'bedtime',
    'activity_type', 'activity_duration', 'activity_detail', 'repertoire',
    'performance_quality', 'recovery', 'load_detail', 'exercise_minutes', 'exercises',
    'exercise_level', 'speaking_level', 'non_performance_speech_minutes',
    'longest_speech_block_minutes', 'water_intake', 'water_by_slot', 'meal_notes',
    'meals', 'carbs_g', 'protein_g', 'fat_g', 'fiber_g', 'protein_level',
    'calorie_level', 'dinner_time', 'dinner_tags', 'weight_kg', 'body_fat_pct', 'ease',
    'mental_reason', 'mental_tags', 'notes', 'medication_tags', 'cycle_start',
    'location', 'temperature', 'humidity', 'weather', 'environment_tags',
    'ambient_noise_db', 'noisy_environment', 'flight_hours', 'jetlag_hours'
  ];
begin
  -- 呼び出した本人（auth.uid()）が、この生徒と「いま有効に」つながっているかを確認する。
  -- 解除された瞬間に、過去の期間も含めて見えなくなる（canViewHealth と同じ挙動）。
  -- revoked_at 列がまだ無い環境でも動くように、to_jsonb 経由で参照している。
  select l.share_scope into v_scope
    from public.teacher_student_links l
   where l.teacher_id = auth.uid()
     and l.student_id = p_student_id
     and l.status = 'active'
     and (to_jsonb(l) ->> 'revoked_at') is null
   limit 1;

  -- つながりが無い・解除済みなら、1行も返さない。
  if v_scope is null then
    return;
  end if;

  -- voice: 声・喉の記録
  if coalesce((v_scope->>'voice')::boolean, false) then
    v_allowed := v_allowed || array['throat_condition', 'voice_quality', 'voice_checkins', 'voice_entries',
      'voice_memo', 'wake_note', 'routine_note', 'resonance_score',
      'pianissimo_high_note', 'pianissimo_onset_delay', 'cpps_value'];
  end if;
  -- symptoms: 症状
  if coalesce((v_scope->>'symptoms')::boolean, false) then
    v_allowed := v_allowed || array['throat_symptoms', 'throat_symptoms_other'];
  end if;
  -- sleep: 睡眠
  if coalesce((v_scope->>'sleep')::boolean, false) then
    v_allowed := v_allowed || array['sleep_hours', 'sleep_quality', 'bedtime'];
  end if;
  -- activity: 活動・練習量
  if coalesce((v_scope->>'activity')::boolean, false) then
    v_allowed := v_allowed || array['activity_type', 'activity_duration', 'activity_detail', 'repertoire',
      'performance_quality', 'recovery', 'load_detail', 'exercise_minutes', 'exercises',
      'exercise_level', 'speaking_level', 'non_performance_speech_minutes',
      'longest_speech_block_minutes'];
  end if;
  -- hydration: 水分
  if coalesce((v_scope->>'hydration')::boolean, false) then
    v_allowed := v_allowed || array['water_intake', 'water_by_slot'];
  end if;
  -- meal: 食事
  if coalesce((v_scope->>'meal')::boolean, false) then
    v_allowed := v_allowed || array['meal_notes', 'meals', 'carbs_g', 'protein_g', 'fat_g', 'fiber_g', 'protein_level',
      'calorie_level', 'dinner_time', 'dinner_tags'];
  end if;
  -- body: 体重・身体データ
  if coalesce((v_scope->>'body')::boolean, false) then
    v_allowed := v_allowed || array['weight_kg', 'body_fat_pct'];
  end if;
  -- mental: 心の余裕・日記
  if coalesce((v_scope->>'mental')::boolean, false) then
    v_allowed := v_allowed || array['ease', 'mental_reason', 'mental_tags'];
  end if;
  -- notes: 稽古ノート
  if coalesce((v_scope->>'notes')::boolean, false) then
    v_allowed := v_allowed || array['notes'];
  end if;

  -- どの共有範囲にも属さない列は、生徒が見るチェックボックスで説明されていないため、
  -- 常に共有しません。共有したい場合は、生徒側の選択肢を先に増やしてから追加すること。
  --   medication_tags, cycle_start, location, temperature, humidity, weather, environment_tags, ambient_noise_db, noisy_environment, flight_hours, jetlag_hours

  select array_agg(c) into v_denied
    from unnest(v_known) c
   where not (c = any(v_allowed));

  return query
  select
    -- 許可された列は値をそのまま、許可されていない列は明示的に null を返す。
    -- 対応表に無い列は、どちらにも現れない（＝キーごと存在しない）。
    coalesce((select jsonb_object_agg(key, value)
                from jsonb_each(to_jsonb(e))
               where key = any(v_allowed || array['date'])), '{}'::jsonb)
    || coalesce((select jsonb_object_agg(c, 'null'::jsonb)
                   from unnest(v_denied) c), '{}'::jsonb)
    from public.entries e
   where e.user_id = p_student_id
   order by e.date desc
   limit least(coalesce(p_limit, 60), 400);
end;
$$;

-- 匿名からは呼べないようにし、ログイン済みのユーザーだけに実行を許す。
revoke all on function public.get_student_entries(uuid, int) from public, anon;
grant execute on function public.get_student_entries(uuid, int) to authenticated;
