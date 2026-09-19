-- ============================================================================
-- ★まだ 済んで いない 同意は「取り消す」もの では ありません（★2026-09-20）
--
--   ★★★坂本さんの ご指摘 ──
--     「同意が まだ 成立して いない（`consented_at` が null）状態で、
--      ★学生の 画面に『保護者の 同意を 取り消す』の 札が 出て、
--      ★実際に 押せて しまいました。★これは 意図した 動作ですか」
--
--   ★★★意図して いません。★誤り です。
--     ★★まだ ひとことを いただいて いない ものを「取り消す」とは 言えません。
--     ★★★さらに 悪い ことに ── ★学校から 出て しまいました。
--       ★★その 学校には、★同意の 仕組みが できる 前から 在籍して いました。
--       ★★同意が 作った ものでは ない ものを、★取り消しが 壊しました。
--
--   ★★★直す ところ（台帳）──
--     ★`withdraw_guardian_consent` が「済んだ 同意が 在ったか」を 返します。
--     ★★呼ぶ 側は、★**在った ときだけ** 学校から 出します。
--     ★★まだの ものは「お願いを 取り下げる」だけ です。★在籍に 触りません。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ★★★返す ものが 変わるので、★一度 落とします（★`create or replace` では 直せません）。
--   ★★落としてから 作るまでの あいだ、★取り消しの 道は ありません。
--   ★★その あいだに 押した 方には、★「取り消せませんでした」と 出ます。
--   ★★★1本の 問いの 中で 続けて 流します。
drop function if exists public.withdraw_guardian_consent(uuid);

create or replace function public.withdraw_guardian_consent(p_org_id uuid)
returns table (withdrawn integer, had_consent boolean, guardian_email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n integer := 0;
  v_had boolean := false;
  v_mail text;
begin
  if auth.uid() is null then
    raise exception 'お入りに なって いません';
  end if;

  -- ★★済んだ 同意が 在ったか（★在籍を 閉じて よいかの 分かれ目）。
  select true, g.guardian_email into v_had, v_mail
  from public.guardian_consents g
  where g.user_id = auth.uid() and g.org_id = p_org_id
    and g.consented_at is not null and g.withdrawn_at is null
  order by g.consented_at desc
  limit 1;
  v_had := coalesce(v_had, false);

  with 閉 as (
    update public.guardian_consents g
    set withdrawn_at = now()
    where g.user_id = auth.uid() and g.org_id = p_org_id
      and g.withdrawn_at is null
    returning 1
  )
  select count(*) into v_n from 閉;

  return query select v_n, v_had, v_mail;
end;
$$;

revoke all on function public.withdraw_guardian_consent(uuid) from public;
revoke all on function public.withdraw_guardian_consent(uuid) from anon;
grant execute on function public.withdraw_guardian_consent(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ
-- ---------------------------------------------------------------------------
--   select pg_get_function_result(p.oid)
--   from pg_proc p join pg_namespace n on n.oid = p.pronamespace
--   where n.nspname = 'public' and p.proname = 'withdraw_guardian_consent';
--   ★★`had_consent` が 入って いる こと。
