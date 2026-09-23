-- 20260923_11 ポートフォリオ／ホームページ（裁定127・128・129・146・167 B）
-- ★128：ホームページは別の機能にしない。portfolio_entries の kind を増やすだけ
-- ★本番の今: portfolios は visibility='self' のみ・portfolio_entries の kind は school/award/teacher の3つに制限されている

-- ① 節（kind）を増やす（裁定128 §2）
alter table public.portfolio_entries drop constraint if exists portfolio_entries_kind_check;
alter table public.portfolio_entries add constraint portfolio_entries_kind_check check (kind in (
  -- いままで
  'school','award','teacher',
  -- ポートフォリオ（裁定127 §7）
  'education','performance','repertoire','recording','role','skill','physical',
  -- ホームページで増える節（裁定128 §2）
  'news','press','lesson','faq','management','link'
));

-- ② 形（型）を「持つ」（裁定146）
alter table public.portfolios add column if not exists paper_type    text;               -- 紙の12型。いつでも無料で変えられる
alter table public.portfolios add column if not exists web_type      text;               -- いま使っている Web の型
alter table public.portfolios add column if not exists field         text;               -- 分野（声楽・声優・教える など）。変えたら1型 無料
alter table public.portfolios add column if not exists trial_until   timestamptz;        -- 選び直しが無料の期限（はじめの14日）
alter table public.portfolios add column if not exists published_at  timestamptz;
alter table public.portfolios drop constraint if exists portfolios_visibility_check;
alter table public.portfolios add constraint portfolios_visibility_check check (visibility in ('self','public'));

create table if not exists public.page_types_owned (
  user_id     uuid not null references auth.users(id) on delete cascade,
  type_key    text not null,
  source      text not null check (source in ('included','trial','bought','field_free')),  -- included=Woolsong に含まれる1型
  acquired_at timestamptz not null default now(),
  primary key (user_id, type_key)
);
alter table public.page_types_owned enable row level security;
revoke all on public.page_types_owned from anon, authenticated;
grant select on public.page_types_owned to authenticated;
drop policy if exists page_types_owned_select_own on public.page_types_owned;
create policy page_types_owned_select_own on public.page_types_owned for select to authenticated using (user_id = auth.uid());
-- 足すのはサーバ（支払いの後）と、下の関数だけ

-- 選び直し：14日のあいだ・持っている形へ・分野を変えた1回 は無料。それ以外は 480円（サーバが Checkout へ）
create or replace function public.set_web_type(p_type_key text)
returns text language plpgsql security definer set search_path to 'public' as $$
declare v_uid uuid := auth.uid(); v_p public.portfolios; v_owned boolean; v_field_used boolean;
begin
  if v_uid is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into v_p from public.portfolios where user_id = v_uid;
  if v_p.user_id is null then raise exception 'NO_PORTFOLIO'; end if;
  select exists (select 1 from public.page_types_owned o where o.user_id = v_uid and o.type_key = p_type_key) into v_owned;

  if v_owned then
    update public.portfolios set web_type = p_type_key, updated_at = now() where user_id = v_uid;
    return 'ok_owned';
  end if;

  if v_p.trial_until is not null and now() <= v_p.trial_until then      -- はじめの14日
    insert into public.page_types_owned(user_id, type_key, source) values (v_uid, p_type_key, 'trial')
      on conflict (user_id, type_key) do nothing;
    update public.portfolios set web_type = p_type_key, updated_at = now() where user_id = v_uid;
    return 'ok_trial';
  end if;

  select exists (select 1 from public.page_types_owned o where o.user_id = v_uid and o.source = 'field_free') into v_field_used;
  if not v_field_used and v_p.field is not null then                    -- 分野ごとに1つ無料
    insert into public.page_types_owned(user_id, type_key, source) values (v_uid, p_type_key, 'field_free');
    update public.portfolios set web_type = p_type_key, updated_at = now() where user_id = v_uid;
    return 'ok_field_free';
  end if;

  return 'need_payment';      -- 画面は 480円 の板を出す。買えたらサーバが page_types_owned に 'bought' を足す
end $$;
revoke all on function public.set_web_type(text) from public, anon;
grant execute on function public.set_web_type(text) to authenticated;
-- ★紙の型（paper_type）はいつでも無料（裁定146 PAPER）→ 画面から直接 update（portfolios の own のポリシーのまま）

-- ③ お問い合わせ（裁定128 CONTACT）。本人のメールはページに出さず、台帳に受けてサーバが転送する
create table if not exists public.page_inquiries (
  id            uuid primary key default gen_random_uuid(),
  owner_user_id uuid not null references auth.users(id) on delete cascade,
  from_name     text not null check (length(from_name) between 1 and 60),
  from_email    text not null check (from_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$' and length(from_email) <= 120),
  body          text not null check (length(body) between 1 and 2000),
  created_at    timestamptz not null default now(),
  forwarded_at  timestamptz
);
create index if not exists page_inquiries_owner_idx on public.page_inquiries(owner_user_id, created_at desc);
alter table public.page_inquiries enable row level security;
revoke all on public.page_inquiries from anon, authenticated;
grant select on public.page_inquiries to authenticated;
drop policy if exists page_inquiries_owner_select on public.page_inquiries;
create policy page_inquiries_owner_select on public.page_inquiries for select to authenticated using (owner_user_id = auth.uid());

create or replace function public.submit_inquiry(p_slug text, p_name text, p_email text, p_body text)
returns boolean language plpgsql security definer set search_path to 'public' as $$
declare v_owner uuid; v_today integer;
begin
  select p.user_id into v_owner from public.portfolios p where p.public_slug = p_slug and p.visibility = 'public';
  if v_owner is null or public.matching_suspended(v_owner) then return false; end if;      -- 理由は返さない
  select count(*) into v_today from public.page_inquiries q
   where q.owner_user_id = v_owner and q.created_at > now() - interval '1 day';
  if v_today >= 50 then return false; end if;                                              -- 送りすぎを止める
  insert into public.page_inquiries(owner_user_id, from_name, from_email, body)
  values (v_owner, left(btrim(p_name),60), left(btrim(p_email),120), left(btrim(p_body),2000));
  return true;
end $$;
revoke all on function public.submit_inquiry(text, text, text, text) from public;
grant execute on function public.submit_inquiry(text, text, text, text) to anon, authenticated;   -- 公開ページのフォーム（未ログインでも送れる）

-- 確かめ（実在の試しの利用者で）
-- kind に 'news' の行を入れられる／'nonsense' は check 違反
-- set_web_type: 14日以内は何度でも ok_trial／期限後の持っていない形は need_payment／持っている形へは ok_owned（請求が出ない）
-- 紙の型は期限に関わらず update できる
-- submit_inquiry: 公開していない slug → false（理由を返さない）／1日50通を超えると false
-- ほかの人の page_inquiries は0行／anon は page_inquiries を select できない
