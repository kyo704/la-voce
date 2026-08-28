-- ============================================================================
-- 職業を「声の使い方の型」で切り直す — 型と配合の定義／既存ユーザーの移行
--
--   出典 docs/lavoce-作業指示-職業を声の型で切り直す.md §7・§8
--   対応 lib/occupation.js（★呼び名と配合の唯一の正）
--
--   ★何度実行しても同じ結果になります。
--   ★古い列 profiles.vocal_profession は消しません。まだ数えていません（§10-9）。
--     この移行では、新しい列に値を「足す」だけです。
--   ★日々の記録（entries）には一切触れません。過去の分析結果は動きません（§8②④）。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 移行の前に数える（★実行の記録として残してください）
-- ---------------------------------------------------------------------------
select coalesce(vocal_profession, '(未設定)') as "いまの職業",
       count(*) as "人数"
  from public.profiles
 group by 1
 order by 2 desc;

-- ---------------------------------------------------------------------------
-- ② 列を足す
-- ---------------------------------------------------------------------------
alter table public.profiles
  add column if not exists occupation text;

-- 配合（歌う/話す/張る、合計10）。★プロフィールに1つだけ。日々の記録には持たせません。
alter table public.profiles
  add column if not exists voice_mix jsonb;

-- 本人が配合を動かした時刻。null なら既定値のまま。
-- ★職業を変えたときに勝手に既定値へ戻さないための目印です。
alter table public.profiles
  add column if not exists voice_mix_edited_at timestamptz;

-- 「呼び方をお仕事に合わせました」の知らせを出した時刻。★1回だけ出します（§8③）。
alter table public.profiles
  add column if not exists occupation_notice_shown_at timestamptz;

-- 知らない職業が入らないようにする（11個だけ）
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
-- ③ 既存ユーザーの移行（§8①）
--
--   ★すでに occupation が入っている人には触れません（本人が選び直した値を
--     上書きしないため）。何度実行しても安全です。
--
--   singer      → classical    ラベルが最初から「声楽家」でした
--   pop_musical → pops         3つの呼び名のうち2つが「ポップス」を指し、
--                              歌の比重も高いため（7対6）
--   announcer   → announcer    narrator と配合が同一（0/10/0）。数字は動きません
--   voice_actor → voiceActor
--   other       → other
--   未設定      → classical    アプリ側の既定値が singer だったため
--
--   ★1回きりの既定値です。本人が設定から選び直せます。
-- ---------------------------------------------------------------------------
update public.profiles
   set occupation = case coalesce(vocal_profession, 'singer')
                      when 'singer'      then 'classical'
                      when 'pop_musical' then 'pops'
                      when 'announcer'   then 'announcer'
                      when 'voice_actor' then 'voiceActor'
                      when 'other'       then 'other'
                      else 'classical'
                    end
 where occupation is null;

-- ---------------------------------------------------------------------------
-- ④ 列の説明
-- ---------------------------------------------------------------------------
comment on column public.profiles.occupation is
  '職業（11種）。★呼び名と配合の正は lib/occupation.js。v1では分析の説明変数に使わないこと。';
comment on column public.profiles.voice_mix is
  '声の使い方の配合 {sing,speak,project} 合計10。★v1では負荷の計算に掛けないこと。nullなら職業の既定値。';
comment on column public.profiles.voice_mix_edited_at is
  '本人が配合を動かした時刻。★nullでないときに既定値へ戻さないこと。';
comment on column public.profiles.occupation_notice_shown_at is
  '呼び方が変わったことを知らせた時刻。★1回だけ出すこと。';

-- ---------------------------------------------------------------------------
-- ⑤ 移行の結果を確かめる（★人数が①と合っていることを見てください）
-- ---------------------------------------------------------------------------
select coalesce(vocal_profession, '(未設定)') as "いままでの職業",
       occupation as "これからの職業",
       count(*) as "人数"
  from public.profiles
 group by 1, 2
 order by 3 desc;

-- 取りこぼしが無いこと（0行なら成功）
select count(*) as "職業が入っていない人（0であること）"
  from public.profiles
 where occupation is null;
