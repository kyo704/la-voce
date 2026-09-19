-- ============================================================================
-- ★保護者の 同意（★裁定 その107・2026-09-20）
--
--   ★★★15〜17歳の 方が、★学校に 入る ときだけ の 話 です。
--     ★★個人で 使う ぶんには、★同意は 要りません（★裁定 §2）。
--       ★★記録・ノート・レパートリー・羊・しらべる …… ★ぜんぶ 使えます。
--     ★★★止めるのは「学校に 入る こと」だけ です。
--       ★★学校に 入る ＝ ★よその 方に ことが 渡る。★そこだけ が 対象 です。
--
--   ★★★保護者に アカウントを 作らせません（★裁定 §1 の `do_not`）。
--     ★★メールを 1通。★押したら その場で 済みます。
--     ★★★保護者に 学生の 記録を 見せません。
--       ★★見えると、★学生が 書かなく なります。
--       ★★9月10日「健康の 記録は 誰も 見られない」に 反します。
--
--   ★★★保護者の メールアドレスは、★学校に 渡す ものでは ありません。
--     ★★決まりは ご本人 だけ。★事務も 先生も 1行も 引けません。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create table if not exists public.guardian_consents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  teacher_id uuid references auth.users(id) on delete set null,
  -- ★★保護者の メール。★学校には 渡しません（★決まりで 守ります）。
  guardian_email text not null,
  -- ★★合言葉。★推し当てられない 長さ。★1度 使ったら 終わり。
  token text not null unique,
  sent_at timestamptz not null default now(),
  consented_at timestamptz,
  -- ★★7日で 切れます。
  expires_at timestamptz not null default (now() + interval '7 days'),
  withdrawn_at timestamptz
);

create index if not exists guardian_consents_user_idx
  on public.guardian_consents (user_id, org_id);

alter table public.guardian_consents enable row level security;

-- ---------------------------------------------------------------------------
-- ★① 決まり ── ★ご本人 だけ が 読めます
-- ---------------------------------------------------------------------------
--   ★★書くのは 読み道 だけ です。★画面から 直に 入れられません。
--     ★★「同意が 在る」ことを、★ご自分で 作れては なりません。
do $$
begin
  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'guardian_consents' and p.polname = 'guardian_consents_select_own'
  ) then
    create policy guardian_consents_select_own on public.guardian_consents
      for select using (auth.uid() = user_id);
  end if;
end $$;

revoke all on table public.guardian_consents from public;
revoke all on table public.guardian_consents from anon;
revoke all on table public.guardian_consents from authenticated;
grant select on table public.guardian_consents to authenticated;

-- ---------------------------------------------------------------------------
-- ★② 同意が 済んで いるか
-- ---------------------------------------------------------------------------
--   ★★1行でも 済んで いれば よし と します（★学校ごと）。
--   ★★撤回した ものは 数えません。
create or replace function public.has_guardian_consent(p_user_id uuid, p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.guardian_consents g
    where g.user_id = p_user_id
      and g.org_id = p_org_id
      and g.consented_at is not null
      and g.withdrawn_at is null
  );
$$;

-- ---------------------------------------------------------------------------
-- ★③ 頼む（★合言葉を 作り、★行を 1つ 作ります）
-- ---------------------------------------------------------------------------
--   ★★合言葉は ここで 作ります。★画面で 作りません。
--     ★★画面で 作ると、★推し当てられる 作り方に なった 日に 気づけません。
--   ★★返すのは 合言葉 です。★メールを 送るのは 呼ぶ 側（道）です。
create or replace function public.request_guardian_consent(
  p_org_id uuid,
  p_teacher_id uuid,
  p_guardian_email text
) returns table (token text, expires_at timestamptz)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token text;
  v_exp timestamptz;
begin
  if auth.uid() is null then
    raise exception 'お入りに なって いません';
  end if;
  if coalesce(trim(p_guardian_email), '') = '' then
    raise exception '保護者の メールアドレスが ありません';
  end if;

  -- ★★32文字より 長く します（★裁定 §3）。
  v_token := encode(gen_random_bytes(32), 'hex');
  v_exp := now() + interval '7 days';

  insert into public.guardian_consents
    (user_id, org_id, teacher_id, guardian_email, token, expires_at)
  values
    (auth.uid(), p_org_id, p_teacher_id, trim(p_guardian_email), v_token, v_exp);

  return query select v_token, v_exp;
end;
$$;

-- ---------------------------------------------------------------------------
-- ★④ 承知しました（★保護者が 押した とき）
-- ---------------------------------------------------------------------------
--   ★★★お入りに なって いない 方が 押します。★`auth.uid()` は ありません。
--     ★★だから 合言葉 だけ で 決めます。★長さと 期限で 守ります。
--   ★★1度 使ったら 終わり です（★すでに 済んで いれば 何も しません）。
create or replace function public.accept_guardian_consent(p_token text)
returns table (ok boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_id uuid;
begin
  select g.id into v_id
  from public.guardian_consents g
  where g.token = p_token
    and g.consented_at is null
    and g.withdrawn_at is null
    and g.expires_at > now()
  limit 1;

  if v_id is null then
    -- ★★★無い ときと、★切れた ときと、★済んだ ときを 分けません。
    --   ★★分けると、★合言葉を 総当たりして 中が 分かります（★裁定 その77）。
    return query select false;
    return;
  end if;

  update public.guardian_consents
  set consented_at = now()
  where id = v_id;

  return query select true;
end;
$$;

-- ---------------------------------------------------------------------------
-- ★⑤ 取り消す（★学生 ご本人の 画面から）
-- ---------------------------------------------------------------------------
--   ★★記録は 1行も 消しません（★裁定 §4）。
--     ★★消すのは「学校に 入って いる」ことだけ です。
--   ★★`enrollments` を 閉じるのは 呼ぶ 側（道）です。★ここでは 印だけ。
create or replace function public.withdraw_guardian_consent(p_org_id uuid)
returns table (withdrawn integer, guardian_email text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_n integer := 0;
  v_mail text;
begin
  if auth.uid() is null then
    raise exception 'お入りに なって いません';
  end if;

  select g.guardian_email into v_mail
  from public.guardian_consents g
  where g.user_id = auth.uid() and g.org_id = p_org_id
    and g.consented_at is not null and g.withdrawn_at is null
  order by g.consented_at desc
  limit 1;

  with 閉 as (
    update public.guardian_consents g
    set withdrawn_at = now()
    where g.user_id = auth.uid() and g.org_id = p_org_id
      and g.withdrawn_at is null
    returning 1
  )
  select count(*) into v_n from 閉;

  return query select v_n, v_mail;
end;
$$;

-- ---------------------------------------------------------------------------
-- ★⑥ 誰が 呼べるか
-- ---------------------------------------------------------------------------
revoke all on function public.has_guardian_consent(uuid, uuid) from public;
revoke all on function public.request_guardian_consent(uuid, uuid, text) from public;
revoke all on function public.request_guardian_consent(uuid, uuid, text) from anon;
revoke all on function public.withdraw_guardian_consent(uuid) from public;
revoke all on function public.withdraw_guardian_consent(uuid) from anon;
grant execute on function public.has_guardian_consent(uuid, uuid) to authenticated;
grant execute on function public.request_guardian_consent(uuid, uuid, text) to authenticated;
grant execute on function public.withdraw_guardian_consent(uuid) to authenticated;
-- ★★★承知の 道 だけ は、★お入りで ない 方も 呼びます（★保護者）。
--   ★★守るのは 合言葉の 長さ（32バイト）と 期限（7日）と 1度きり です。
revoke all on function public.accept_guardian_consent(text) from public;
grant execute on function public.accept_guardian_consent(text) to anon;
grant execute on function public.accept_guardian_consent(text) to authenticated;

-- ---------------------------------------------------------------------------
-- ★確かめ（★流した あとに、★別に 流して ください）
-- ---------------------------------------------------------------------------
--   select relrowsecurity from pg_class where relname = 'guardian_consents';
--   select polname, polcmd from pg_policy p join pg_class c on c.oid = p.polrelid
--   where c.relname = 'guardian_consents';
--   ★★1つ だけ（読む だけ）で ある こと。
