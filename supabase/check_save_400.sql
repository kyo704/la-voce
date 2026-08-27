-- ============================================================================
-- 保存が 400 で落ちる原因を、1回で切り分けるための確認用SQL
--
--   ★これは確認だけです。表も行も変更しません。
--   Supabase の SQL Editor に貼って、上から順に実行してください。
--   ①〜⑤の結果をそのまま貼っていただければ、原因を特定できます。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① entries に、アプリが書こうとしている列が揃っているか
--
--   アプリ（entryToRow）は、保存のたびに次の61列を1回のupsertで送ります。
--   このうち1つでも表に無ければ、PostgREST は 400 を返します
--   （code: PGRST204 / message: Could not find the '◯◯' column ...）。
--   ここに行が出たら、その列が原因です。
-- ---------------------------------------------------------------------------
with sent(col) as (
  select unnest(array[
    'user_id','date','throat_condition','voice_quality','throat_symptoms','throat_symptoms_other',
    'sleep_hours','sleep_quality','water_intake','water_by_slot','meal_notes','meals',
    'location','temperature','humidity','weather','environment_tags',
    'activity_type','activity_duration','activity_detail','activities','recovery','repertoire',
    'performance_quality','ease','notes','exercises','exercise_level','exercise_minutes',
    'carbs_g','protein_g','fat_g','fiber_g','calorie_level','protein_level',
    'weight_kg','body_fat_pct','bedtime','dinner_time','dinner_tags',
    'mental_reason','mental_tags','medication_tags','cycle_start',
    'voice_entries','voice_checkins','voice_memo','wake_note','routine_note','resonance_score',
    'pianissimo_high_note','pianissimo_onset_delay','cpps_value',
    'speaking_level','noisy_environment','ambient_noise_db',
    'longest_speech_block_minutes','non_performance_speech_minutes',
    'flight_hours','jetlag_hours','load_detail'
  ])
)
select sent.col as "★entriesに無い列（これが400の原因）"
  from sent
  left join information_schema.columns c
    on c.table_schema = 'public' and c.table_name = 'entries' and c.column_name = sent.col
 where c.column_name is null
 order by 1;

-- ---------------------------------------------------------------------------
-- ② entries に、アプリが送っていない「NOT NULL かつ既定値なし」の列が無いか
--
--   こういう列があると、upsert のたびに 23502（not-null violation）で
--   400 になります。①が空だったときは、こちらを疑ってください。
-- ---------------------------------------------------------------------------
select column_name as "列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'entries'
   and is_nullable = 'NO' and column_default is null
   and column_name not in ('id','user_id','date')
 order by ordinal_position;

-- ---------------------------------------------------------------------------
-- ③ upsert が使う一意制約（user_id, date）が生きているか
--
--   on_conflict=user_id,date は、この制約が無いと 42P10 で 400 になります。
--   1行返れば正常です。
-- ---------------------------------------------------------------------------
select conname as "制約名", pg_get_constraintdef(oid) as "定義"
  from pg_constraint
 where conrelid = 'public.entries'::regclass and contype in ('u','p');

-- ---------------------------------------------------------------------------
-- ④ events の古い列が、まだ NOT NULL のまま残っていないか
--
--   ★これは events の400の、いちばん有力な原因です。
--   migration_events.sql は、戻せるように古い列（event_type / payload）を
--   わざと残しました。ただし NOT NULL を外していません。
--   アプリは name / props しか送らないので、event_type が NOT NULL なら
--   毎回 23502 で落ちます。is_nullable が NO なら、それが原因です。
-- ---------------------------------------------------------------------------
select column_name as "列", is_nullable as "NULL可", column_default as "既定値"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'events'
 order by ordinal_position;

-- ---------------------------------------------------------------------------
-- ⑤ entries / events の RLS ポリシー
--
--   ★RLS で弾かれた場合は 400 ではなく 403 になります。
--   403 でないなら RLS は原因ではありませんが、念のため一覧を見ておきます。
-- ---------------------------------------------------------------------------
select tablename as "表", policyname as "ポリシー名", cmd as "対象",
       qual as "using", with_check as "with check"
  from pg_policies
 where schemaname = 'public' and tablename in ('entries','events')
 order by tablename, policyname;
