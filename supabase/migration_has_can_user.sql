-- ★★★`has_can` は `auth.uid()` を 中で 使います（★viewer を 受け取りません）。
--   ★★`can_view_ops_perm(viewer, …)` の 中で 呼ぶと、★viewer と 食い違います。
--   ★★★2026-09-18、★確かめの ときに 出ました ──
--     ★★編集の 窓では `auth.uid()` が 空 です。★学長でも False に なりました。
--     ★★決まりの 中では たまたま 同じ なので、★気づけません。
--   ★★★「誰か」を 2通りで 数える 形 です。★1つに します。
create or replace function public.has_can_user(
  p_user_id uuid, p_org_id uuid, p_perm text
) returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select exists (
    select 1
    from public.memberships m
    join public.org_posts p on p.id = m.post_id
    where m.org_id = p_org_id
      and m.user_id = p_user_id
      and coalesce((p.perms -> p_perm)::text, 'false') = 'true'
  );
$$;

comment on function public.has_can_user(uuid, uuid, text) is
  'その人がそのできことを持つか。has_can は auth.uid() 版。裁定その86・2026-09-18。';

revoke all on function public.has_can_user(uuid, uuid, text) from public, anon;
grant execute on function public.has_can_user(uuid, uuid, text) to authenticated;

-- ★★`has_can` は、★この 1本に 委ねます。★同じ 決めを 2か所に 置きません。
create or replace function public.has_can(p_org_id uuid, p_perm text)
returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select public.has_can_user(auth.uid(), p_org_id, p_perm);
$$;

-- ★★門も、★その 1本を 呼びます。
create or replace function public.can_view_ops_perm(
  viewer_id uuid, p_org_id uuid, p_student_id uuid, p_perm text
) returns boolean
language sql stable security definer set search_path to 'public'
as $$
  select
    exists (
      select 1 from enrollments
      where org_id = p_org_id and student_id = p_student_id and status = 'active'
    )
    and (
      public.has_can_user(viewer_id, p_org_id, p_perm)
      or exists (
        select 1 from assignments
        where org_id = p_org_id and teacher_id = viewer_id
          and student_id = p_student_id and ended_at is null
      )
    )
$$;
