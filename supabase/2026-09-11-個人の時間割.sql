-- ============================================================================
-- ⑦ 時間割（★個人の もの）── ★自分の コマと、★自分の 授業
--
--   ★出どころ Opus の 裁定（★2026-09-11・その15）⑦
--     「時間割：個人のものとして、作ってください。「重なり◯件」は、後回しで
--       構いません。」
--   ★見本　00-動く見本（さわれる・全画面）.html
--     ★3295行　SC['時間割']　　　　★曜日 × コマ の 表に、★授業を 入れる
--     ★3913行　SC['自分のコマ']　 ★学校の コマの 中で、★自分の コマを 決める
--     ★3330行　SC['授業を入れる']　★1つの マスに 入れる もの
--
--   ★★★これは まだ 実装して いません。★先に お見せする ための ものです。
--     ★坂本さんの お決め（★2026-09-11）──「SQLを、先に、見せてから 着手する」
--
--   ★★どうして 表が 要るか
--     ★★見本は、★授業の 名前・先生・教室・備考を 持ちます。
--       ★★けれど、★先生に 伝わるのは「★空いて いる 時間だけ」です。
--         ★見本 3301行「授業の 名前・先生・教室・備考は 送られません」
--     ★★だから、★中身は ご本人の ものとして しまい、
--       ★★外に 出るのは「空いて いるか どうか」だけに します。
--
--   ★★この 表は、★ご本人だけの ものです。
--     ★★先生にも、★学校にも、★運営にも 渡しません。
--     ★★lib/shareScope.js は entries の 表です。★こちらは 別の 表で、
--       ★先生へ 渡す 道を 1本も 作りません。
--
--   ★★教室（D＋E＋F＋G＋H）には 触れません。
--     ★★学校の コマ（org の 側）は、★この SQL に 出て きません。
--     ★引き金（★B13 の 4条件）に 触れない よう、★個人の ぶんだけです。
--
--   ★実行　★★まだ 流さないで ください。★お決めを いただいてからです。
-- ============================================================================


-- ===========================================================================
-- ① 自分の コマ（★見本 SC['自分のコマ']）
--
--   ★★「コマ」は、★1日を 区切る 時間の 単位です。
--     ★れい　1限 9:00〜10:30 ／ 2限 10:40〜12:10
--   ★★学校の コマと 別に、★ご自分の コマを 持てます。
--     ★★見本「あなたは、その 中で 自分の レッスンの コマを 決められます」
--   ★★個人の ぶんなので、★org を 参照しません。
-- ===========================================================================
create table if not exists public.my_periods (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- ★並び（1限・2限…）。★名前は ご本人が 付けます。
  ord         smallint not null,
  name        text not null,
  -- ★★時刻は「分」で 持ちます（★0〜1439）。
  --   ★★time 型に しないのは、★端末の 時間帯で ずれない ためです。
  --     ★コマは「その 学校の 時計」で 決まります。★世界標準時では ありません。
  start_min   smallint not null,
  end_min     smallint not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint my_periods_ord_ok    check (ord between 1 and 20),
  constraint my_periods_name_len  check (char_length(name) between 1 and 12),
  constraint my_periods_start_ok  check (start_min between 0 and 1439),
  constraint my_periods_end_ok    check (end_min between 1 and 1440),
  -- ★★終わりが 始まりより あと。★逆を 入れられません。
  constraint my_periods_order_ok  check (end_min > start_min),
  -- ★同じ 並びを 2つ 作りません。
  constraint my_periods_uniq      unique (user_id, ord)
);

create index if not exists my_periods_user on public.my_periods (user_id, ord);


-- ===========================================================================
-- ② 自分の 授業（★見本 SC['時間割']・SC['授業を入れる']）
--
--   ★★曜日 × コマ の 1マスに、★1つ 入ります。
--   ★★入れなかった ところが「空きコマ」に なります（★見本 3300行）。
--     ★★だから、★「空き」を 別に 持ちません。★無い ことが 空きです。
--       ★2つ 持つと、★片方だけ 直ります。
-- ===========================================================================
create table if not exists public.my_timetable (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  -- ★曜日。★0＝月 … 6＝日（★見本の DAYS の 並び）。
  weekday     smallint not null,
  -- ★★どの コマか。★自分の コマを 指します。
  --   ★★コマを 消したら、★その マスも 消えます（cascade）。
  --     ★★残すと、★どこの 予定か 分からない ものが 残ります。
  period_id   uuid not null references public.my_periods(id) on delete cascade,
  -- ★★中身。★どれも ご本人の ものです。★外に 出ません。
  --   ★見本 3301行「授業の 名前・先生・教室・備考は 送られません」
  title       text,
  teacher     text,
  room        text,
  memo        text,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  constraint my_timetable_weekday_ok check (weekday between 0 and 6),
  constraint my_timetable_title_len  check (title   is null or char_length(title)   <= 40),
  constraint my_timetable_teacher_len check (teacher is null or char_length(teacher) <= 20),
  constraint my_timetable_room_len   check (room    is null or char_length(room)    <= 20),
  constraint my_timetable_memo_len   check (memo    is null or char_length(memo)    <= 200),
  -- ★1つの マスに 1つだけ。
  constraint my_timetable_uniq       unique (user_id, weekday, period_id)
);

create index if not exists my_timetable_user on public.my_timetable (user_id, weekday);


-- ===========================================================================
-- ③ 行の 決まり（RLS）── ★ご本人だけ
--
--   ★★先生の 決まりを 1つも 作りません。
--   ★★SECURITY DEFINER の 関数も 作りません。
--     ★★cycle_periods と 同じ 考え方です ──
--       「ほかの方の 行へ 行く 道が、★そもそも 無い」ように します。
--       ★道が 無ければ、★あとで 設定を まちがえる ことも できません。
-- ===========================================================================
alter table public.my_periods   enable row level security;
alter table public.my_timetable enable row level security;

do $$
begin
  if not exists (select 1 from pg_policies
    where schemaname='public' and tablename='my_periods' and policyname='my_periods_own') then
    create policy my_periods_own on public.my_periods
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies
    where schemaname='public' and tablename='my_timetable' and policyname='my_timetable_own') then
    create policy my_timetable_own on public.my_timetable
      for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
  end if;
end $$;


-- ===========================================================================
-- ④ 権限
--
--   ★★revoke を 先に 書きます（★2026-09-11 までの 学び）。
--     ★あとに 書くと、★古い 権限が 残った ままの 時間が できます。
--   ★★anon（★ログインして いない 人）には 1つも 渡しません。
-- ===========================================================================
revoke all on public.my_periods   from anon, authenticated;
revoke all on public.my_timetable from anon, authenticated;

grant select, insert, update, delete on public.my_periods   to authenticated;
grant select, insert, update, delete on public.my_timetable to authenticated;


-- ===========================================================================
-- ⑤ 確かめ
-- ===========================================================================
select table_name as "表", column_name as "列", data_type as "型"
from information_schema.columns
where table_schema='public' and table_name in ('my_periods','my_timetable')
order by table_name, ordinal_position;

select tablename as "表", policyname as "決まり", cmd as "いつ",
       qual as "読むとき", with_check as "書くとき"
from pg_policies
where schemaname='public' and tablename in ('my_periods','my_timetable')
order by tablename, policyname;

select c.relname as "表", c.relrowsecurity as "行の 決まりが 効いて いるか"
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname in ('my_periods','my_timetable');

-- ★★anon に 何も 無い ことの 確かめ（★0行で あること）
select table_name as "表", grantee as "だれに", privilege_type as "できること"
from information_schema.table_privileges
where table_schema='public' and table_name in ('my_periods','my_timetable')
  and grantee = 'anon';
