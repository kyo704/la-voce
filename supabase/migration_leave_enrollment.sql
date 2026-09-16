-- ===========================================================================
-- ★教室を やめる ── ★持ち主の 力で 動く 関数（★Opus の 裁定・2026-09-16）
--
--   ★★はじめ 私は「UPDATE の 決まり（policy）を 足す」と 書きました。
--     ★★誤り でした。★Opus の ご指摘 ──
--       「RLS は **行**に 効きます。★**列**には 効きません。
--         ★決まりを 足すと、★在籍行の **ぜんぶの 列**が 書けます
--         （grade_label・org_id・student_id も）」
--     ★★つまり「やめる」だけ を 許す つもりが、★名簿の 書き換えまで 開きます。
--   ★★だから、★書ける ことを **関数の 中**に 閉じます。
--     ★★`admin_entry_stats` / `accept_teacher_invitation` と 同じ 形 です。
--
--   ★★★1つ、★裁定の 字を 直して います。
--     ★★いただいた 仕様は `where user_id = auth.uid()` でした。
--     ★★`enrollments` に `user_id` の 列は **ありません**。
--       ★★正しくは `student_id` です（★台帳の 列の 一覧・2026-09-16）。
--     ★★そのままだと、★この 関数は 作れません（★列が 無い と 言われます）。
--     ★★黙って 直さず、★ここに 書き残します。
--
--   ★★`org_id` で 受けます（★在籍の id では なく）。
--     ★★在籍の id を 受けると、★他人の 在籍の id を 当てられた とき
--       ★`student_id` の 照らし合わせが 要ります。★どちらでも 守れますが、
--       ★★「自分の ＋ その教室の」で 引く ほうが、★読んで すぐ 分かります。
--
--   ★何度 走らせても 同じに なります。
-- ===========================================================================

create or replace function public.leave_enrollment(p_org_id uuid)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  n integer;
begin
  -- ★★ログインして いない 人は、★何も できません。
  if auth.uid() is null then
    return 0;
  end if;

  update public.enrollments
     set status = 'left',
         left_at = now()
   where student_id = auth.uid()
     and org_id = p_org_id
     and status = 'active';

  -- ★★★何行 直したかを 返します。
  --   ★★`void` では、★呼ぶ 側が「できたか」を 知れません。
  --   ★★2026-09-16、★まさに それで しくじりました ──
  --     ★0行 直しても 成功に 見え、★一覧に 残って いました。
  --   ★★数を 返せば、★画面が 確かめられます。
  get diagnostics n = row_count;
  return n;
end;
$$;

revoke all on function public.leave_enrollment(uuid) from public, anon;
grant execute on function public.leave_enrollment(uuid) to authenticated;

comment on function public.leave_enrollment(uuid) is
  '生徒が自分の在籍を left にする。列を絞るため policy ではなく関数で行う。直した行数を返す。';

-- ★★`enrollments` に UPDATE の 決まりを **足しません**（★裁定）。
--   ★★足すと、★行ごと ぜんぶの 列が 書けて しまいます。

-- ★確かめ（★読むだけ）
select p.proname as 関数,
       p.prosecdef as 持ち主の力で動くか,
       pg_get_function_identity_arguments(p.oid) as ひきすう,
       pg_get_function_result(p.oid) as かえり
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'leave_enrollment';
