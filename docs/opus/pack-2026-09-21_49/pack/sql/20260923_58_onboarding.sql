-- 20260923_58 導入の点検（P4・裁定183）
-- ★学校が 自分だけで終えられる点検。★終わると消える。★催促しない
-- ★12（学校）のあと

create table if not exists public.org_onboarding_checks (
  org_id   uuid not null references public.organizations(id) on delete cascade,
  item     text not null check (item in ('roster','teacher_stamp','ics','event')),
  done_at  timestamptz,
  primary key (org_id, item)
);
alter table public.org_onboarding_checks enable row level security;
revoke all on public.org_onboarding_checks from anon, authenticated;
grant select on public.org_onboarding_checks to authenticated;
drop policy if exists org_onboarding_read on public.org_onboarding_checks;
create policy org_onboarding_read on public.org_onboarding_checks for select to authenticated
  using (public.has_can(org_id,'master') or public.has_can(org_id,'meibo'));
-- ★書くのは 下の関数だけ（人が「済んだことにする」を押せない＝事実だけが済みにする）

-- ★済んだかどうかは ★事実から数える（押させない）
create or replace function public.onboarding_state(p_org uuid)
returns table(item text, done boolean, hint text)
language sql stable security definer set search_path to 'public' as $$
  select 'roster', exists (select 1 from public.enrollments e where e.org_id = p_org),
         '名簿を 入れる（CSV でも 画面でも）'
  union all
  select 'teacher_stamp', exists (select 1 from public.lessons l where l.org_id = p_org and l.attendance is not null),
         '先生が レッスンを 1件 打刻する'
  union all
  select 'ics', false, 'カレンダーに つなぐ（★購読の記録は いまの台帳に ありません）'
  union all
  select 'event', exists (select 1 from public.org_events e where e.org_id = p_org and e.withdrawn_at is null),
         '行事を 1件 出す';
$$;
revoke all on function public.onboarding_state(uuid) from public, anon;
grant execute on function public.onboarding_state(uuid) to authenticated;
-- ★4つとも済んだら 画面から消す（判定は画面。台帳に「消した」を持たない）

-- ★足りないもの（§2）: ICS の購読の記録が 台帳に無い → P1 と一緒に決める
