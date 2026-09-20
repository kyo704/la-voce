-- ============================================================================
-- ★ご自分の 予定が 入って いる 枠（★裁定 その108・2026-09-20）
--
--   ★★★見本 `P_okeru` の 断り ──
--     「あなたの 予定が 入って いる 枠は 出しません」。
--   ★★その ために、★先生 ご自分の 時間割を 見ます。
--
--   ★★★表を 直に 引きません。★この 道を 通します。
--     ★★見張り（`components/tests/ops-monka.test.js`）が、
--       ★運営の 画面から `my_timetable` を 引く ことを 禁じて います。
--     ★★★わけは「よその 方の 時間割に 手が 届く 形を 作らない」ため です。
--       ★いまは ご自分の 行 だけ 読めますが、★1行 足すと 変わって しまいます。
--       ★★だから 表に 触らない 形に します。
--
--   ★★★返すのは **2つ だけ** です ── ★曜日と コマ。
--     ★授業の 名前・教室・備考は 1つも 返しません。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create or replace function public.get_my_busy_slots()
returns table (weekday smallint, period_id uuid)
language sql
stable
security invoker
set search_path = public
as $$
  select t.weekday, t.period_id
  from public.my_timetable t
  where t.user_id = auth.uid()
    and t.unavailable = true;
$$;

revoke all on function public.get_my_busy_slots() from public, anon;
grant execute on function public.get_my_busy_slots() to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ
-- ---------------------------------------------------------------------------
--   select pg_get_function_result(p.oid), p.prosecdef
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname = 'get_my_busy_slots';
--   ★★`prosecdef` は **false**（★決まりを 通します。★読み道では ありません）。
--     ★★ご自分の 行 しか 読めない ことは、★決まりが 守ります。
