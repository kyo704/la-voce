-- 20260922_02 学生の値段の同意（裁定166 R2）
-- 在籍を「値段を決めるためだけ」に確かめる。学校名・学年・コースは返さない・残さない。書くのは関数だけ

create table if not exists public.student_price_consents (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete set null,   -- 退会しても同意の事実は残す（名前は持たない）
  consented_at  timestamptz not null default now(),
  text_version  text not null,
  checked_at    timestamptz,
  enrolled      boolean,
  withdrawn_at  timestamptz
);
create index if not exists spc_user_active_idx on public.student_price_consents(user_id) where withdrawn_at is null;
alter table public.student_price_consents enable row level security;
revoke all on public.student_price_consents from anon, authenticated;
grant select on public.student_price_consents to authenticated;
drop policy if exists spc_select_own on public.student_price_consents;
create policy spc_select_own on public.student_price_consents for select to authenticated using (user_id = auth.uid());

-- 在籍しているか（どこの学校かは返さない）
create or replace function public._is_enrolled_somewhere(p_user uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.enrollments e where e.student_id = p_user and e.status = 'active');
$$;
revoke all on function public._is_enrolled_somewhere(uuid) from public, anon, authenticated;   -- 中の部品。直接は呼ばせない

create or replace function public.give_student_price_consent(p_text_version text)
returns boolean language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_enrolled boolean;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if p_text_version is null or btrim(p_text_version) = '' then raise exception 'TEXT_VERSION_REQUIRED'; end if;
  v_enrolled := public._is_enrolled_somewhere(v_uid);
  insert into public.student_price_consents(user_id, text_version, checked_at, enrolled)
  values (v_uid, p_text_version, now(), v_enrolled);
  return v_enrolled;
end $$;
revoke all on function public.give_student_price_consent(text) from public, anon;
grant execute on function public.give_student_price_consent(text) to authenticated;

create or replace function public.withdraw_student_price_consent()
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  update public.student_price_consents set withdrawn_at = now()
   where user_id = auth.uid() and withdrawn_at is null;
end $$;
revoke all on function public.withdraw_student_price_consent() from public, anon;
grant execute on function public.withdraw_student_price_consent() to authenticated;

-- 買うとき・更新のときにサーバ（service role）が呼ぶ。本人の id を渡す（サーバが本人を確かめてから）
create or replace function public.student_price_eligible(p_user uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (select 1 from public.student_price_consents c where c.user_id = p_user and c.withdrawn_at is null)
     and public._is_enrolled_somewhere(p_user);
$$;
revoke all on function public.student_price_eligible(uuid) from public, anon, authenticated;   -- service role だけ（No.024 の形）

-- 確かめ（実在の試しの利用者で）
-- 同意なし → student_price_eligible = false／同意して在籍 → true／在籍なし → false（enrolled=false の行が残る）
-- meibo を持つ事務から student_price_consents を select → 0行
