-- ============================================================================
-- 職業（11分類）を、専用の列に作り直す
--
--   ★profiles.occupation には触れません。
--     あれは登録画面の自由記述です（schema.sql の当初からある列で、
--     SignupForm.jsx と handle_new_user が書き込み、管理画面が表示し、
--     本人の書き出しにも含まれます）。
--     「学生」「声楽家」「会社員のものまね」などの実データが入っています。
--     11分類の機能が、この列を奪ってはいけません。
--
--   ★このファイルが足すのは voice_occupation だけです。
--     すでにある occupation / voice_mix / voice_mix_edited_at /
--     occupation_notice_shown_at には、一切触れません。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 実行前の確認（★occupation の自由記述が無事であること）
-- ---------------------------------------------------------------------------
select 'occupation（自由記述・触りません）' as "列",
       count(*) filter (where occupation is not null) as "値が入っている人数"
  from public.profiles;

-- ---------------------------------------------------------------------------
-- ② 11分類の職業。★本人が選ぶまで null のままにします。
--    null のときは vocal_profession から読み替えて表示します。
--    「自分で選んだ」と「既定で表示している」を区別するためです。
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists voice_occupation text;

-- 知らない職業が入らないようにする（11個だけ）
-- ★対象は voice_occupation です。occupation ではありません。
--   occupation に掛けると、自由記述の実データが制約違反で弾かれます。
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_voice_occupation_check') then
    alter table public.profiles
      add constraint profiles_voice_occupation_check
      check (voice_occupation is null or voice_occupation in (
        'classical','musical','pops','voiceActor','narrator',
        'announcer','actorStage','actorScreen','rakugo','mc','other'));
  end if;
end $$;

comment on column public.profiles.voice_occupation is
  '声の使い方で分けた職業（11種）。★呼び名と配合の正は lib/occupation.js。
   ★登録画面の自由記述 profiles.occupation とは別の列です。混同しないこと。
   ★v1では分析の説明変数に使わないこと。本人が選ぶまで null。';

-- ---------------------------------------------------------------------------
-- ★ここに、職業を埋める update は入れていません。
--   本人が選ぶまで null のまま、という判断に従っています。
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ③ 確認
-- ---------------------------------------------------------------------------
select column_name as "列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name in ('occupation','voice_occupation','voice_mix',
                       'voice_mix_edited_at','occupation_notice_shown_at')
 order by 1;

-- ★occupation の自由記述が、①と同じ人数のまま残っていること
select coalesce(occupation, '(未入力)') as "登録時の職業（自由記述）",
       count(*) as "人数"
  from public.profiles
 group by 1
 order by 2 desc;
