-- ============================================================================
-- ★ご自分の 予定を、★まとめて 外す（★裁定 その142・2026-09-21）
--
--   ★★★なぜ 道（関数）に するか
--     ★★`my_timetable` を 直に 触るのは `components/MyTimetable.jsx` だけ、と
--       ★決めて あります（★`lib/opsShell.js` の 註）。
--     ★★運営の 画面は、★読む ときも 道を 通って います
--       （★`get_my_busy_slots`）。★外す ときも 同じ 形に します。
--
--   ★★★外すのは **ご自分の 行 だけ** です。
--     ★★`auth.uid()` 以外の 行に 触れません。★引数で 人を 指せません。
--     ★★だから 運営の 方が、★よその 先生の 予定を 消す ことは できません。
--
--   ★★★消すのは 「来られない」の 印 だけ です（`unavailable = true`）。
--     ★★コマそのもの（`my_periods`）は 消しません。★時間割は 残ります。
--
--   ★★何度 走らせても 同じ です。★2度目は 0件 返ります。
--   ★★画面は 押す 前に 一度 お尋ねして います（★戻せない ため）。
-- ============================================================================

drop function if exists public.clear_my_busy_slots();

create function public.clear_my_busy_slots()
returns table (removed integer)
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  n integer;
begin
  if auth.uid() is null then
    raise exception 'NOT_AUTHENTICATED';
  end if;

  delete from public.my_timetable t
   where t.user_id = auth.uid()
     and t.unavailable = true;

  get diagnostics n = row_count;
  return query select n;
end;
$$;

comment on function public.clear_my_busy_slots() is
  '★ご自分の「来られない」の 印を まとめて 外す（裁定142）。★auth.uid() の 行 だけ。★人を 引数で 指せない。';

-- ★★★みなに 渡さない（★既定では PUBLIC に 渡ります）。
revoke all on function public.clear_my_busy_slots() from public;
revoke all on function public.clear_my_busy_slots() from anon;
grant execute on function public.clear_my_busy_slots() to authenticated;
