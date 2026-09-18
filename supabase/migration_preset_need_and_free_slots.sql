-- ===========================================================================
-- ★① 足りると される 回数（★裁定 その90 の あと・坂本さんの お決め Q1）
-- ★② 空いて いる ところ **だけ** を 先生に（★お決め Q2）
--     （★2026-09-19）
--
--   ★★★① なぜ 型に 持たせる か
--     ★★「年30回の うち 20回で 足りる」── ★これは **授業ごと** の 決め です。
--     ★★学校 全体で 1つ では ありません。★型は すでに 授業ごと です。
--     ★★空の まま に できます。★決めて いない 学校も あります。
--       ★★★空なら ★印は 1つも 出ません。★勝手な 線を 引きません。
--
--   ★★★② 何を 見せ、★何を 見せないか
--     ★★見せる …… ★「その 時間が 空いて いるか どうか」だけ ── ★**2値** です
--     ★★見せない … ★授業の 名前・担当の 先生・教室・備考・来られない わけ
--     ★★★2026-09-19、★見本も 2値に そろいました（★4本 とも）──
--       ★★「サーバへ 送るのは『空いているか どうか』の 2値のみ」
--       ★★★はじめ 見本は 3値（あき／来られない／授業あり）でした。
--         ★★3値だと「来られない」＝ ★本人の 都合 が 先生に 伝わります。
--         ★★2値なら、★理由の 別は 伝わりません。★見本の 注も
--           ★「理由は 聞きません」と 書いて います。★2値の ほうが 揃います。
--     ★★もとから ある 約束と 同じ です ──
--       ★`lib/myTimetable.js` ──「先生に 見えるのは 空いている 時間だけです。
--         ★授業の 名前・先生・教室・備考は 送られません。」
--       ★`lib/todayPlan.js` ──「時間割の あいている ところが、先生に 伝わります
--         ★（中身は 伝わりません）。」
--
--   ★★★決まり（RLS）は **足しません**。★`my_timetable` は 自分の ぶん だけ の まま。
--     ★★列を 見せない ために、★行ごと 返さない 関数を 作ります。
--     ★★★決まりは 行の 単位 です。★列は 隠せません（★この 蔵の 覚え）。
--     ★★返すのは **曜日と 時限と 空きか どうか** の 3つ だけ です。
--
--   ★★★門は 受け持ち だけ です。★役職では ありません。
--     ★★`assignments`（`ended_at is null`）を 見ます。
--     ★★学校の 主・副でも、★受け持って いなければ 返しません。
--       ★★★`get_student_entries` と 同じ 考え方 です。
--
--   ★★何度 走らせても 同じに なります。★`BEGIN`／`ROLLBACK` を 使って いません。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【一】★足りると される 回数
-- ---------------------------------------------------------------------------
alter table public.lesson_presets
  add column if not exists need_count int;

-- ★★0 や 負の 数、★年間の 回数より 多い 数を 入れません。
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'lesson_presets_need_count_check'
  ) then
    alter table public.lesson_presets
      add constraint lesson_presets_need_count_check
      check (need_count is null or (need_count > 0 and need_count <= total_count));
  end if;
end $$;

comment on column public.lesson_presets.need_count is
  '足りるとされる回数。空なら★印を出さない（勝手な線を引かない）。裁定その90のあと・2026-09-19。';

-- ---------------------------------------------------------------------------
-- 【二】★空いて いる ところ だけ を 返す
--
--   ★★返すのは 3つ だけ ── ★曜日・時限・空きか どうか。
--   ★★★中身（授業の 名前・先生・教室・備考）は **1つも** 返しません。
--     ★★返さない ので、★網で 見ても 出ません。
--   ★★`unavailable`（来られない）も「空いて いない」に 含めます。
--     ★★★わけは 返しません。★見本 ──「理由は 聞きません」。
-- ---------------------------------------------------------------------------
create or replace function public.get_student_free_slots(
  p_student_id uuid
) returns table (weekday smallint, period_ord smallint, is_free boolean)
language sql stable security definer set search_path to 'public'
as $$
  select d.weekday::smallint,
         p.ord::smallint,
         not exists (
           select 1 from my_timetable t
           where t.user_id = p_student_id
             and t.weekday = d.weekday
             and t.period_id = p.id
         ) as is_free
  from my_periods p
  cross join (select generate_series(0, 6) as weekday) d
  where p.user_id = p_student_id
    -- ★★★受け持って いる 先生 だけ。★役職では ありません。
    and exists (
      select 1 from assignments a
      where a.student_id = p_student_id
        and a.teacher_id = auth.uid()
        and a.ended_at is null
    )
  order by d.weekday, p.ord
$$;

comment on function public.get_student_free_slots(uuid) is
  '生徒の時間割の「空いているかどうか」だけを返す。中身は返さない。受け持ちの先生だけ。2026-09-19。';

revoke all on function public.get_student_free_slots(uuid) from public, anon;
grant execute on function public.get_student_free_slots(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- 【三】★確かめ
-- ---------------------------------------------------------------------------

-- ★① 列が 付いたか
select column_name, data_type, is_nullable
from information_schema.columns
where table_schema = 'public' and table_name = 'lesson_presets'
  and column_name in ('total_count', 'need_count')
order by column_name;

-- ★② 関数が 返す もの（★3つ だけ である こと）
select p.proname, pg_get_function_result(p.oid) as kaesu
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'get_student_free_slots';

-- ★③ `my_timetable` の 決まりが 増えて いない こと（★1つの まま）
select p.polname, p.polcmd::text as cmd
from pg_policy p join pg_class c on c.oid = p.polrelid
where c.relname = 'my_timetable';
-- ★★★門下 ぜんぶ の「空き コマの 数」を、★1度で 返します（★2026-09-19）。
--   ★★1人ずつ 呼ぶと、★20人で 20回 尋ねる ことに なります。
--   ★★★返すのは 番号と **数** だけ です。★どの 時間が 空いて いるかも 返しません。
--     ★★一覧に 要るのは 数 だけ です。★要らない ものを 渡しません。
--   ★★門は 受け持ち だけ。★役職では ありません。
create or replace function public.get_monka_free_counts()
returns table (student_id uuid, free_count int)
language sql stable security definer set search_path to 'public'
as $$
  select a.student_id,
         (
           select count(*)::int
           from my_periods p
           cross join (select generate_series(0, 6) as weekday) d
           where p.user_id = a.student_id
             and not exists (
               select 1 from my_timetable t
               where t.user_id = a.student_id
                 and t.weekday = d.weekday
                 and t.period_id = p.id
             )
         ) as free_count
  from assignments a
  where a.teacher_id = auth.uid()
    and a.ended_at is null
$$;

comment on function public.get_monka_free_counts() is
  '自分の門下の「空きコマの数」だけを返す。どの時間かは返さない。2026-09-19。';

revoke all on function public.get_monka_free_counts() from public, anon;
grant execute on function public.get_monka_free_counts() to authenticated;

select p.proname, pg_get_function_result(p.oid) as kaesu
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname in ('get_student_free_slots', 'get_monka_free_counts')
order by p.proname;
