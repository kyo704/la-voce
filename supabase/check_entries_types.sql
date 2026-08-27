-- ============================================================================
-- 保存の400、続き。①②が空だったので、残るのは「型」と「制約」です。
--
--   ★これも確認だけです。表も行も変更しません。
--   ⑥がいちばん重要です。⑥→③→⑤の順に結果を貼ってください。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ⑥ 数値の列が、整数（integer）か小数（numeric）か  ★本命
--
--   声の出来スライダーは 0〜10 を 0.5 刻みで動きます。
--   保存時、その値から旧列を逆算しています（deriveLegacyVoiceFieldsFromEntries）。
--     resonance_score  ← 声の出来そのもの        （例 7.5）
--     voice_quality    ← 声の出来を1〜5に換算     （例 3.8）
--     throat_condition ← 喉の身体感覚の中央値     （2件なら 3.5 など）
--
--   コード側で丸めていません。列が integer なら、Postgres は
--   「invalid input syntax for type integer: "3.8"」で弾き、400 になります。
--
--   ★21段階のうち18段階で voice_quality が小数になることを、手元で確認済みです。
--     整数になるのは 0 / 5 / 10 の3つだけ。既定値が5なので、
--     スライダーに触らなければ保存でき、動かすと落ちます。
--     「ときどき落ちる」という現象と一致します。
--
--   下の "型" が integer になっている列があれば、それが原因です。
-- ---------------------------------------------------------------------------
select column_name as "列",
       data_type   as "型",
       numeric_precision as "桁", numeric_scale as "小数桁"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'entries'
   and column_name in (
     'resonance_score','voice_quality','throat_condition','performance_quality','ease',
     'sleep_hours','sleep_quality','water_intake','weight_kg','body_fat_pct',
     'temperature','humidity','activity_duration','cpps_value','ambient_noise_db',
     'speaking_level','exercise_level','calorie_level','protein_level',
     'carbs_g','protein_g','fat_g','fiber_g','exercise_minutes',
     'longest_speech_block_minutes','non_performance_speech_minutes',
     'flight_hours','jetlag_hours'
   )
 order by data_type, column_name;

-- ---------------------------------------------------------------------------
-- ⑦ 実際に弾かれるかを、その場で確かめる
--
--   ★行は作りません。ロールバックします。
--   ここで 22P02 が出れば、⑥の読みで確定です。
-- ---------------------------------------------------------------------------
do $$
begin
  begin
    execute 'create temp table _t (voice_quality int) on commit drop';
    execute 'insert into _t values (3.8::text::int)';
    raise notice '整数列に 3.8 を入れられました（想定外）';
  exception when others then
    raise notice '整数列に 3.8 を入れると: % (%)', sqlerrm, sqlstate;
  end;
end $$;

-- ---------------------------------------------------------------------------
-- ③ upsert が使う一意制約（user_id, date）が生きているか
--   1行返れば正常です。
-- ---------------------------------------------------------------------------
select conname as "制約名", pg_get_constraintdef(oid) as "定義"
  from pg_constraint
 where conrelid = 'public.entries'::regclass and contype in ('u','p');

-- ---------------------------------------------------------------------------
-- ③-2 check制約・トリガーが増えていないか
--   ①②が空だったので、こちらも見ておきます。
-- ---------------------------------------------------------------------------
select conname as "check制約", pg_get_constraintdef(oid) as "定義"
  from pg_constraint
 where conrelid = 'public.entries'::regclass and contype = 'c';

select tgname as "トリガー", pg_get_triggerdef(oid) as "定義"
  from pg_trigger
 where tgrelid = 'public.entries'::regclass and not tgisinternal;

-- ---------------------------------------------------------------------------
-- ⑤ entries / events の RLS ポリシー
--   ★RLS で弾かれた場合は 403 です。400 なら原因ではありませんが、一応。
-- ---------------------------------------------------------------------------
select tablename as "表", policyname as "ポリシー名", cmd as "対象",
       qual as "using", with_check as "with check"
  from pg_policies
 where schemaname = 'public' and tablename in ('entries','events')
 order by tablename, policyname;
