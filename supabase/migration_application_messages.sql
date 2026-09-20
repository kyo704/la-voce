-- ============================================================================
-- La Voce / Woolsong ── ★さがす（マッチング）の 段4
--   ★ことばの 往復（`application_messages`）と、★残り 3本の 関数
--   ★裁定 その94 §4c「REPLY_ROUND_TRIP」／その121 TABLE_ORDER 4／その122
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
-- ★先に `migration_matching_cuts` → `migration_postings` → `migration_applications`。
--
-- ★★★ここでも 自由文の 列を 持ちません。
--   ★★返せる ことばは 3つ です（★見本 `SC['曲目を答える']`）──
--     ★レパートリーから 選ぶ（★曲の 名の 並び）
--     ★曲目は これから 決めます
--     ★当日までに お伝えします
--   ★★★曲の 名は **データ** です。★書いた 文では ありません（★§4c `why_safe`）。
--     ★★だから `pieces text[]` を 持ちます。★`body text` は 持ちません。
-- ============================================================================

create table if not exists public.application_messages (
  id uuid primary key default gen_random_uuid(),
  application_id uuid not null references public.applications on delete cascade,
  sender_user_id uuid not null references auth.users on delete cascade,
  template_key text not null,
  -- ★曲の 名の 並び（★`kyokumoku_kotae` の ときだけ）。
  pieces text[],
  created_at timestamptz not null default now(),
  constraint application_messages_template_check
    check (template_key in ('kyokumoku_kotae', 'kyokumoku_kore_kara', 'toujitsu_made_ni')),
  -- ★曲の 名を 返す ときは、★1つ 以上。★そのほかの ときは 持ちません。
  constraint application_messages_pieces_check
    check ((template_key = 'kyokumoku_kotae' and array_length(pieces, 1) >= 1)
           or (template_key <> 'kyokumoku_kotae' and pieces is null))
);

create index if not exists application_messages_app_idx
  on public.application_messages (application_id, created_at);

alter table public.application_messages enable row level security;

-- ----------------------------------------------------------------------------
-- ★門 ── ★送った ご本人 だけ（★applications と 同じ 形）。
--   ★★相手の ぶんは 関数を 通します。★切れて いる 相手の ことばを 出さない ため です。
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public'
    and tablename='application_messages' and policyname='application_messages_select_own') then
    create policy "application_messages_select_own" on public.application_messages
      for select using (auth.uid() = sender_user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public'
    and tablename='application_messages' and policyname='application_messages_insert_own') then
    create policy "application_messages_insert_own" on public.application_messages
      for insert with check (auth.uid() = sender_user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public'
    and tablename='application_messages' and policyname='application_messages_delete_own') then
    create policy "application_messages_delete_own" on public.application_messages
      for delete using (auth.uid() = sender_user_id);
  end if;
end $$;

-- ★★`update` の 門を 作りません。★送った ことばを 書き換えません。
revoke all on public.application_messages from anon, authenticated;
grant select (id, application_id, sender_user_id, template_key, pieces, created_at)
  on public.application_messages to authenticated;
grant insert (application_id, sender_user_id, template_key, pieces)
  on public.application_messages to authenticated;
grant delete on public.application_messages to authenticated;

-- ----------------------------------------------------------------------------
-- ★その 応募に 関われる 人か（★2人 だけ）。
--   ★★応募した ご本人 と、★募集を 出した 方。★ほかは 1人も 通しません。
--   ★★切れて いる なら、★どちらからも 通しません。
--   ★★この 判じを 3本の 関数で 使い回します。★2か所に 書きません。
-- ----------------------------------------------------------------------------
create or replace function public.application_party(p_application_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.applications a
    join public.postings p on p.id = a.posting_id
    where a.id = p_application_id
      and (a.applicant_user_id = auth.uid() or p.owner_user_id = auth.uid())
      and public.matching_visible(a.applicant_user_id, p.owner_user_id)
  )
$$;

-- ★画面から 直に 呼ばせません（★`matching_visible` と 同じ わけ・裁定 その122）。
revoke all on function public.application_party(uuid) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- ★① 募集 1件（★見本 `SC['応募する']` の 上の 札）。
--
--   ★★`get_postings` と 同じ 絞り です ── ★在籍・公開中・切れて いない・自分以外。
--   ★★時間・会場・合わせの 場所は 返しません（★§4g `never_show`）。★列も ありません。
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
-- ★② 応募者の 詳細（★裁定 その94 §4e）。
--
--   ★★★見るのは、★その 募集を 出した 方 だけ です。
--   ★★★出す のは、★応募する ときに ご本人が 選んだ ものだけ です。
--     ★`show_career` …… ★学んだところ・師事・賞（`portfolio_entries`）
--     ★`show_recordings` …… ★録画の 道しるべ（`portfolio_recordings`）
--     ★`show_repertoire` …… ★持って いる 曲（`repertoire_tessitura`）
--     ★★選ばなかった ものは、★**空の 並び** を 返します。★行が 出ません。
--   ★★★年齢・学年・入学年・門下・担当の 先生は 返しません（★§7）。
--     ★★台帳に あっても、★この 道には 載せません。
--   ★★`jsonb` で 返します（★`get_student_entries` と 同じ 形）。
--     ★★許した 列 だけ から 組み立てます。★`select *` を 書きません。
-- ----------------------------------------------------------------------------
create or replace function public.get_applicant_detail(p_application_id uuid)
returns jsonb
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select jsonb_build_object(
    'application_id', a.id,
    'display_name', pr.display_name,
    'instrument', pf.instrument,
    'bio', case when a.show_career then pf.bio else null end,
    'template_key', a.template_key,
    'available_days', to_jsonb(a.available_days::text[]),
    'status', a.status,
    'career', case when a.show_career then coalesce((
      select jsonb_agg(jsonb_build_object('kind', e.kind, 'title', e.title,
                                          'detail', e.detail)
                       order by e.sort_order)
      from public.portfolio_entries e where e.user_id = a.applicant_user_id
    ), '[]'::jsonb) else '[]'::jsonb end,
    'recordings', case when a.show_recordings then coalesce((
      select jsonb_agg(jsonb_build_object('title', r.title, 'url', r.url,
                                          'detail', r.detail)
                       order by r.sort_order)
      from public.portfolio_recordings r where r.user_id = a.applicant_user_id
    ), '[]'::jsonb) else '[]'::jsonb end,
    'repertoire', case when a.show_repertoire then coalesce((
      select jsonb_agg(t.repertoire_name order by t.repertoire_name)
      from public.repertoire_tessitura t where t.user_id = a.applicant_user_id
    ), '[]'::jsonb) else '[]'::jsonb end
  )
  from public.applications a
  join public.postings p on p.id = a.posting_id
  join public.profiles pr on pr.id = a.applicant_user_id
  left join public.portfolios pf on pf.user_id = a.applicant_user_id
  where a.id = p_application_id
    and p.owner_user_id = auth.uid()
    and a.status <> 'withdrawn'
    and public.matching_visible(auth.uid(), a.applicant_user_id)
$$;

revoke all on function public.get_applicant_detail(uuid) from public, anon;
grant execute on function public.get_applicant_detail(uuid) to authenticated;

-- ----------------------------------------------------------------------------
-- ★③ やりとり（★§4c）。
--
--   ★★★はじめの 1つは `applications` が 持って います。★写しません。
--     ★★2か所に 置くと、★片方だけ 直る 日が 来ます。
--     ★★ここで 1つに 束ねて お見せします。
--   ★★どちらの 側からも 読めます。★切れて いれば、★どちらからも 読めません。
-- ----------------------------------------------------------------------------
create or replace function public.get_messages(p_application_id uuid)
returns table (
  sender_display_name text,
  template_key text,
  pieces text[],
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select pr.display_name, a.template_key, null::text[], a.created_at
  from public.applications a
  join public.profiles pr on pr.id = a.applicant_user_id
  where a.id = p_application_id
    and public.application_party(p_application_id)
  union all
  select pr.display_name, m.template_key, m.pieces, m.created_at
  from public.application_messages m
  join public.profiles pr on pr.id = m.sender_user_id
  where m.application_id = p_application_id
    and public.application_party(p_application_id)
  order by 4
$$;

revoke all on function public.get_messages(uuid) from public, anon;
grant execute on function public.get_messages(uuid) to authenticated;

-- ============================================================================
-- ★NOT_YET
--
--   ★① 写真（★§4e `applicant_controls` の 4つ目）。
--     ★★置き場が ありません。★`show_photo` の 列だけ 在ります。
--     ★★★when …… ★写真を 預かる ところを 決める とき。
--
--   ★② この学校で #回（★§4e `done_count`）。
--     ★★数える もとが ありません。★成立の 記録を まだ 持って いません。
--     ★★★when …… ★成立（`chosen`）の 後の 姿を 作る とき。
--
--   ★③ `application_messages` に 書き込む 道（関数）は まだ です。
--     ★★いまは 門（RLS）から 直に 入れます。★送り手の 取り違えは 起きません。
--     ★★けれど「相手が たずねて いる ときだけ 答えられる」は 見て いません。
--     ★★★when …… ★「曲目を答える」の 画面を 作る とき。
-- ============================================================================
