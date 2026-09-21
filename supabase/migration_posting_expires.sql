-- ============================================================================
-- La Voce / Woolsong ── ★募集の 期限（★裁定 その130・2026-09-21）
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
--
-- ★★★なぜ 要るか
--   ★★放って ある 募集が 残りつづけると、★応募しても 返事が 来ません。
--   ★★「動いて いない ところ」に 見えます。
--
-- ★★★けれど 期限を **強いません**（★裁定 その130）。
--   ★★出す ご本人が 決めます ── ★1か月 ／ 3か月 ／ 決めない。
--   ★★「決めない」を 選べます。★催促しません。
--
-- ★★★期限が 来ても **消しません**（★変えない原則「消すときは消す。隠して済ませない」の 裏）。
--   ★★一覧から 外れる だけ です。★ご本人の 画面には 残ります。
--   ★★もう一度 出せます。★書いた ものを 失いません。
--   ★★お知らせも 送りません（★裁定 その87）。
-- ============================================================================

alter table public.postings
  add column if not exists expires_at timestamptz;

comment on column public.postings.expires_at is
  '★期限（★裁定 その130）。★null は「決めない」。★過ぎても 消しません。'
  '★一覧（get_postings）から 外れる だけ です。';

create index if not exists postings_expires_idx
  on public.postings (org_id, status, expires_at);

-- ★出す ときと 直す ときに、★ご本人が 決められる ように します。
grant insert (expires_at) on public.postings to authenticated;
grant update (expires_at) on public.postings to authenticated;

-- ----------------------------------------------------------------------------
-- ★一覧 ── ★期限の 来た ものを 出しません。
--   ★★`null`（決めない）は ずっと 出ます。
-- ----------------------------------------------------------------------------
create or replace function public.get_postings(p_org_id uuid)
returns table (
  id uuid,
  title text,
  kind text,
  days text[],
  fee_amount integer,
  fee_unit text,
  sodan boolean,
  owner_display_name text
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.title, p.kind, p.days::text[],
         p.fee_amount, p.fee_unit, p.sodan,
         pr.display_name
  from public.postings p
  join public.profiles pr on pr.id = p.owner_user_id
  where p.org_id = p_org_id
    and p.status = 'open'
    and (p.expires_at is null or p.expires_at > now())
    and p.owner_user_id <> auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.org_id = p.org_id
        and e.student_id = auth.uid()
        and e.status = 'active'
    )
    and public.matching_visible(auth.uid(), p.owner_user_id)
  order by p.created_at desc
$$;

revoke all on function public.get_postings(uuid) from public, anon;
grant execute on function public.get_postings(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- ★1件 ── ★一覧と 同じ 条件に します。★片方だけ 開ける 道を 作りません。
-- ----------------------------------------------------------------------------
create or replace function public.get_posting_detail(p_posting_id uuid)
returns table (
  id uuid,
  title text,
  kind text,
  piece text,
  days text[],
  need_all_days boolean,
  fee_amount integer,
  fee_unit text,
  sodan boolean,
  owner_display_name text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.title, p.kind, p.piece, p.days::text[], p.need_all_days,
         p.fee_amount, p.fee_unit, p.sodan, pr.display_name, p.created_at
  from public.postings p
  join public.profiles pr on pr.id = p.owner_user_id
  where p.id = p_posting_id
    and p.status = 'open'
    and (p.expires_at is null or p.expires_at > now())
    and p.owner_user_id <> auth.uid()
    and exists (
      select 1 from public.enrollments e
      where e.org_id = p.org_id
        and e.student_id = auth.uid()
        and e.status = 'active'
    )
    and public.matching_visible(auth.uid(), p.owner_user_id)
$$;

revoke all on function public.get_posting_detail(uuid) from public, anon;
grant execute on function public.get_posting_detail(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- ★自分の 募集 ── ★期限が 来ても **出します**。★終わった ことが 判る ように します。
--   ★★返す 列が 増えます。★`create or replace` では 変えられません（★42P13）。
-- ----------------------------------------------------------------------------
drop function if exists public.get_my_postings();
create or replace function public.get_my_postings()
returns table (
  id uuid,
  title text,
  kind text,
  days text[],
  status text,
  application_count integer,
  expires_at timestamptz,
  ended boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.title, p.kind, p.days::text[], p.status,
         (select count(*)::integer from public.applications a
          where a.posting_id = p.id
            and a.status <> 'withdrawn'
            and public.matching_visible(auth.uid(), a.applicant_user_id)),
         p.expires_at,
         (p.expires_at is not null and p.expires_at <= now()),
         p.created_at
  from public.postings p
  where p.owner_user_id = auth.uid()
  order by p.created_at desc
$$;

revoke all on function public.get_my_postings() from public, anon;
grant execute on function public.get_my_postings() to authenticated;
