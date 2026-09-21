-- ============================================================================
-- La Voce / Woolsong ── ★応募を 選ぶ（★見本 `SC['応募を選ぶ']`・裁定 その94 §4e）
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
--
-- ★★★足す のは 1つ だけ です ── ★学んだ ところ（★§4e `list_view`）。
--   ★★`portfolio_entries` の `kind='school'` の 1つ目 です。
--   ★★★応募の ときに ご本人が「経歴を 見せる」を 選んで いる ときだけ 返します。
--     ★★選ばなかった 方の ぶんは 空 です。★台帳の 側で 止めます。
--
-- ★★★並びは **応募の 順** の まま です（★見本の 断り）。
--   ★★「実績の 順には しません。」★数の 多い 方を 上に しません。
--   ★★裁定 その95 ── ★人間関係上 有利に なる 設計を 作りません。
--
-- ★★★この学校で #回 は **まだ 返しません**。
--   ★★数える もとが ありません（★成立の 記録を 持って いません）。
--   ★★0 を 返しません。★「0回」は 新しい 方を 不利に します（★§4e `done_count`）。
--   ★★★when …… ★成立（`chosen`）の 後の 姿を 作る とき。
-- ============================================================================

drop function if exists public.get_applications(uuid);
create or replace function public.get_applications(p_posting_id uuid)
returns table (
  id uuid,
  applicant_display_name text,
  applicant_school text,
  template_key text,
  available_days text[],
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select a.id, pr.display_name,
         case when a.show_career then (
           select e.title from public.portfolio_entries e
           where e.user_id = a.applicant_user_id and e.kind = 'school'
           order by e.sort_order limit 1
         ) else null end,
         a.template_key, a.available_days::text[], a.status, a.created_at
  from public.applications a
  join public.postings p on p.id = a.posting_id
  join public.profiles pr on pr.id = a.applicant_user_id
  where a.posting_id = p_posting_id
    and p.owner_user_id = auth.uid()
    and a.status <> 'withdrawn'
    and public.matching_visible(auth.uid(), a.applicant_user_id)
  order by a.created_at
$$;

revoke all on function public.get_applications(uuid) from public, anon;
grant execute on function public.get_applications(uuid) to authenticated;

comment on function public.get_applications(uuid) is
  '★応募の 一覧（★見本 SC[応募を選ぶ]）。★応募の 順。★実績の 順に しません。'
  '★学んだ ところは、★ご本人が 見せると 選んだ ときだけ。';
