-- ============================================================================
-- La Voce / Woolsong ── ★募集を 出す ときの 門を 締めます（★2026-09-21）
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
--
-- ★★★見つけた こと
--   ★★`postings_insert_own` は `auth.uid() = owner_user_id` だけ を 見て いました。
--   ★★★`org_id` を 自由に 書けます。
--     ★★在籍して いない 学校にも、★募集を 出せて しまいます。
--     ★★出した 募集は `get_postings()` で、★その 学校の 方に 見えます。
--   ★★★これは L1（★学校の 中だけ・裁定 その94 §3）の 抜け です。
--
--   ★★同じ 形を 一度 塞いで います ── ★`create_org_event`（2026-09-04・#007）。
--     ★★「`org_id` を 自由に できて、★どの 学校にも 予定を 作れて いました」。
--     ★★同じ 穴を、★同じ 家に もう一度 開けて いました。
--
-- ★★直し ── ★書く ときも 在籍を 見ます。★読む ときと 同じ 条件 です。
-- ============================================================================

do $$
begin
  if exists (select 1 from pg_policies where schemaname='public'
    and tablename='postings' and policyname='postings_insert_own') then
    drop policy "postings_insert_own" on public.postings;
  end if;
  create policy "postings_insert_own" on public.postings
    for insert with check (
      auth.uid() = owner_user_id
      and exists (
        select 1 from public.enrollments e
        where e.org_id = postings.org_id
          and e.student_id = auth.uid()
          and e.status = 'active'
      )
    );
end $$;

-- ★★★`update` でも 学校を 移せません。
--   ★★出した あとで `org_id` を 書き換えると、★同じ ことが 起きます。
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public'
    and tablename='postings' and policyname='postings_update_own') then
    drop policy "postings_update_own" on public.postings;
  end if;
  create policy "postings_update_own" on public.postings
    for update using (auth.uid() = owner_user_id)
    with check (
      auth.uid() = owner_user_id
      and exists (
        select 1 from public.enrollments e
        where e.org_id = postings.org_id
          and e.student_id = auth.uid()
          and e.status = 'active'
      )
    );
end $$;

-- ★★`org_id` を 書き換える 道を、★列の 渡しからも 外します。
revoke update (org_id) on public.postings from authenticated;

-- ============================================================================
-- ★応募も 同じ 形です。★`org_id` を 自由に できません。
-- ============================================================================
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public'
    and tablename='applications' and policyname='applications_insert_own') then
    drop policy "applications_insert_own" on public.applications;
  end if;
  create policy "applications_insert_own" on public.applications
    for insert with check (
      auth.uid() = applicant_user_id
      and exists (
        select 1 from public.postings p
        where p.id = applications.posting_id
          and p.org_id = applications.org_id
          and p.status = 'open'
      )
      and exists (
        select 1 from public.enrollments e
        where e.org_id = applications.org_id
          and e.student_id = auth.uid()
          and e.status = 'active'
      )
    );
end $$;
