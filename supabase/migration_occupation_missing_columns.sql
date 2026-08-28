-- ============================================================================
-- 足りない列だけを足す（本番の現状に合わせた差分）
--
--   2026-08-28 に本番を調べたところ、こうなっていました。
--       occupation                  あり
--       voice_mix                   あり
--       voice_mix_edited_at         あり  ★この名前が正です
--       occupation_notice_shown_at  ★ありません
--
--   migration_occupation.sql が途中までしか実行されていなかったためです。
--   ★このファイルは、足りないものだけを足します。
--     すでに成功している列には一切触れません。
--   ★何度実行しても同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 足りない列（知らせを1回だけ出すための目印）
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists occupation_notice_shown_at timestamptz;

comment on column public.profiles.occupation_notice_shown_at is
  '呼び方が変わったことを知らせた時刻。★1回だけ出すこと。';

-- ---------------------------------------------------------------------------
-- ② 知らない職業が入らないようにする制約
--
--   ★列と同じく、これも作られていない可能性があります（同じ実行で
--     止まっているため）。無ければ作り、あれば何もしません。
--     制約が無いと、綴りを間違えた職業がそのまま保存されます。
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'profiles_occupation_check') then
    alter table public.profiles
      add constraint profiles_occupation_check
      check (occupation is null or occupation in (
        'classical','musical','pops','voiceActor','narrator',
        'announcer','actorStage','actorScreen','rakugo','mc','other'));
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ★ここには、職業を埋める update を入れていません。
--   本人が選ぶまで occupation は null のまま、という坂本さんの判断
--   （「自分で選んだ」と「既定で入った」を区別する）に従っています。
--   表示に使う職業は、null のとき vocal_profession から読み替わります。
-- ---------------------------------------------------------------------------

-- ---------------------------------------------------------------------------
-- ③ 確認（★4列そろっていること）
-- ---------------------------------------------------------------------------
select column_name as "列", data_type as "型"
  from information_schema.columns
 where table_schema = 'public' and table_name = 'profiles'
   and column_name in ('occupation','voice_mix','voice_mix_edited_at',
                       'occupation_notice_shown_at')
 order by 1;
