-- ============================================================================
-- La Voce / Woolsong ── ★さがす（マッチング）の 段3
--   ★応募（`applications`）── ★裁定 その94 §4「L2_TEMPLATE」／その121・その122
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
-- ★先に `migration_matching_cuts.sql` と `migration_postings.sql` を。
--
-- ★★★自由文の 列を **持ちません**（★裁定 その94 §4）。
--   ★★送れる ことばは 3つ だけ です。★`template_key` に その 名を 置きます。
--     ★お受けできます ／ 曲目を もう少し 教えてください
--     ★／ お礼について 相談させてください（★「相談に 応じます」の 募集だけ）
--   ★★★台帳に 書く 欄が 無い ので、★API を 直に 叩いても 自由文は 通りません。
--     ★★画面で 止めて いるのでは ありません。★列が 無い のです（★VERIFY Q3）。
--
-- ★★★時間を 持ちません（★裁定 その94 §4g `never_show`）。
--   ★★来られる のは **日** だけ です。★時間は 成立の 後、★ご本人どうしで。
--
-- ★★★年齢・学年・入学年を 持ちません（★§7）。★列が ありません。
-- ============================================================================

create table if not exists public.applications (
  id uuid primary key default gen_random_uuid(),
  posting_id uuid not null references public.postings on delete cascade,
  applicant_user_id uuid not null references auth.users on delete cascade,
  -- ★学校の 中だけ（★§3「L1_SCOPE」）。★募集と 同じ 学校 です。
  org_id uuid not null references public.organizations on delete cascade,
  -- ★来られる 日（★§4g `applicant_side`「日にちだけ。時間を 出さない」）。
  available_days date[] not null,
  -- ★送る ことば。★3つ から 1つ（★見本 `TPL_B` ＋ `TPL_B_SODAN`）。
  template_key text not null,
  -- ★お見せする もの（★§4e `applicant_controls`）。
  --   ★★写真 だけ 既定で 出しません。★「見た目で 選ばれない」ため です。
  --   ★★録画は 既定で 出します。★もう 世に 出て いる リンク だから です。
  show_career boolean not null default true,
  show_recordings boolean not null default true,
  show_repertoire boolean not null default true,
  show_photo boolean not null default false,
  status text not null default 'sent',
  created_at timestamptz not null default now(),
  constraint applications_template_check
    check (template_key in ('ukeraremasu', 'kyokumoku_kikitai', 'orei_sodan')),
  constraint applications_status_check
    check (status in ('sent', 'chosen', 'withdrawn')),
  constraint applications_days_not_empty check (array_length(available_days, 1) >= 1),
  -- ★同じ 募集に 2度 応募しません。
  constraint applications_unique unique (posting_id, applicant_user_id)
);

create index if not exists applications_posting_idx
  on public.applications (posting_id, created_at);
create index if not exists applications_applicant_idx
  on public.applications (applicant_user_id, created_at desc);

alter table public.applications enable row level security;

-- ----------------------------------------------------------------------------
-- ★門 ── ★応募した ご本人 だけ（★裁定 その122 と 同じ 形）。
--   ★★募集を 出した 方は、★門からは 引けません。★関数を 通します。
--   ★★そうしないと、★切った 相手の 応募も 見えて しまいます。
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public'
    and tablename='applications' and policyname='applications_select_own') then
    create policy "applications_select_own" on public.applications
      for select using (auth.uid() = applicant_user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public'
    and tablename='applications' and policyname='applications_insert_own') then
    create policy "applications_insert_own" on public.applications
      for insert with check (auth.uid() = applicant_user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public'
    and tablename='applications' and policyname='applications_update_own') then
    create policy "applications_update_own" on public.applications
      for update using (auth.uid() = applicant_user_id)
      with check (auth.uid() = applicant_user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public'
    and tablename='applications' and policyname='applications_delete_own') then
    create policy "applications_delete_own" on public.applications
      for delete using (auth.uid() = applicant_user_id);
  end if;
end $$;

revoke all on public.applications from anon, authenticated;
grant select (id, posting_id, applicant_user_id, org_id, available_days,
              template_key, show_career, show_recordings, show_repertoire,
              show_photo, status, created_at)
  on public.applications to authenticated;
grant insert (posting_id, applicant_user_id, org_id, available_days,
              template_key, show_career, show_recordings, show_repertoire,
              show_photo)
  on public.applications to authenticated;
-- ★取り下げる ため の update（★§5 `withdraw`）。★ことばは 変えられません。
grant update (status, available_days, show_career, show_recordings,
              show_repertoire, show_photo)
  on public.applications to authenticated;
grant delete on public.applications to authenticated;

-- ----------------------------------------------------------------------------
-- ★応募を 選ぶ（★募集を 出した 方が 見ます）。
--
--   ★★絞りは 3つ ── ★その 募集の 持ち主 ／ 取り下げて いない ／ 切れて いない。
--   ★★出す のは §4e `list_view` の ぶん だけ です。
--     ★★年齢・学年・門下は **返しません**（★§7）。★列を 名指しします。
-- ----------------------------------------------------------------------------
create or replace function public.get_applications(p_posting_id uuid)
returns table (
  id uuid,
  applicant_display_name text,
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
  select a.id, pr.display_name, a.template_key, a.available_days::text[],
         a.status, a.created_at
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

-- ----------------------------------------------------------------------------
-- ★応募した 募集（★応募した ご本人が 見ます）。
--
--   ★★こちらも 切れて いる 相手の ものは 返しません。
--     ★★切った 後に、★その 人の 募集が 控えに 残ると、★切れて いません。
-- ----------------------------------------------------------------------------
create or replace function public.get_my_applications()
returns table (
  id uuid,
  posting_id uuid,
  posting_title text,
  posting_kind text,
  posting_days text[],
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
  select a.id, p.id, p.title, p.kind, p.days::text[],
         a.template_key, a.available_days::text[], a.status, a.created_at
  from public.applications a
  join public.postings p on p.id = a.posting_id
  where a.applicant_user_id = auth.uid()
    and public.matching_visible(auth.uid(), p.owner_user_id)
  order by a.created_at desc
$$;

revoke all on function public.get_my_applications() from public, anon;
grant execute on function public.get_my_applications() to authenticated;

-- ----------------------------------------------------------------------------
-- ★自分が 出した 募集 ── ★応募の 数を 足します（★裁定 その123 の NOT_YET を 外します）。
--
--   ★★数える もとが できました。★0 を 埋めて いた わけでは ありません。
--   ★★★切れて いる 相手の 応募は 数えません。
--     ★★見えない ものを 数に 入れると、★開いた とき 数が 合いません。
--   ★★取り下げた ものも 数えません。
-- ----------------------------------------------------------------------------
-- ★★返す 列が 増えます。★`create or replace` では 変えられません（★42P13）。
--   ★★先に 落としてから 作り直します。★中身の ある 表では ありません。
drop function if exists public.get_my_postings();
create or replace function public.get_my_postings()
returns table (
  id uuid,
  title text,
  kind text,
  days text[],
  status text,
  application_count integer,
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
         p.created_at
  from public.postings p
  where p.owner_user_id = auth.uid()
  order by p.created_at desc
$$;

revoke all on function public.get_my_postings() from public, anon;
grant execute on function public.get_my_postings() to authenticated;

-- ============================================================================
-- ★NOT_YET
--
--   ★① ことばの 往復（★裁定 その94 §4c）。★`application_messages` は まだ です。
--     ★★「曲目を もう少し 教えてください」に 答える 道 です。
--     ★★答えは **曲の 名の 並び** です（★書いた 文では ありません）。
--     ★★★when …… ★「曲目を答える」の 画面を 作る とき。
--
--   ★② `orei_sodan` は「相談に 応じます」の 募集に だけ 出せます（★§4g）。
--     ★★いま、★台帳では 止めて いません。★列を またぐ ため です。
--     ★★★when …… ★応募を 書き込む 道（関数）を 作る とき。★そこで 見ます。
--
--   ★③ 取り下げ（`status='withdrawn'`）と、★`matching_cuts` の `withdraw` の
--     ★★関わりが、★まだ 決まって いません。
--     ★★★when …… ★「この人との やりとりについて」の 板を 作る とき。
-- ============================================================================
