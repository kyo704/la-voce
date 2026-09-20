-- ============================================================================
-- La Voce / Woolsong ── ★さがす（マッチング）の 段2
--   ★募集（`postings`）と、★募集を 取り出す 関数（★裁定 その121・その122）
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
-- ★先に `migration_matching_cuts.sql` を 走らせて ください（★段0）。
--
-- ★★★門は **狭く** 閉じます（★裁定 その122 RLS_ON_POSTINGS）。
--   ★★`select` は「自分の 募集 だけ」。★よその 募集は 関数 を 通します。
--   ★★画面は `postings` を 直に 引きません。★必ず `get_postings()` です。
--
-- ★★★載せない もの（★裁定 その94 §4g `never_show`）。
--   ★★時間 ／ 本番の 会場 ／ 合わせの 場所 ── ★**列を 作りません**。
--     ★★日にち＋時間＋場所が 揃うと、★「いつ どこに いるか」が 判ります。
--     ★★無い ものは 漏れません。★出し分けでは なく、★持ちません。
--   ★★決めるのは 成立の 後。★ご本人どうし です。★この 台帳は 関わりません。
-- ============================================================================

create table if not exists public.postings (
  id uuid primary key default gen_random_uuid(),
  -- ★学校の 中だけ（★裁定 その94 §3「L1_SCOPE」）。
  org_id uuid not null references public.organizations on delete cascade,
  owner_user_id uuid not null references auth.users on delete cascade,
  -- ★募集の 名（★見本 `P_boshu` の 1行目）。
  title text,
  -- ★内容（★裁定 その94 §4g `kind`）。★4つ です。
  kind text not null,
  -- ★曲目（★§4g `piece`）。
  piece text,
  -- ★日にち（★§4g `date`）。★時間は 持ちません。
  --   ★★複数の 日を 1つの 募集に 置けます（★見本の「すべての 日」）。
  days date[] not null,
  -- ★すべての 日に 来られる 方を さがすか（★§4e「この日、すべてに 来られる方」）。
  need_all_days boolean not null default false,
  -- ★お礼（★§4g `fee`）。★金額は 自由に 打てます。★単位は 選びます。
  fee_amount integer,
  fee_unit text,
  -- ★「相談に 応じます」の チェック 1つ（★§4g `sodan`）。
  --   ★★これが 無い 募集に「相談させて ください」を 出しません。
  --     ★★値切りの 道具に なります（★§4g `sodan_template`）。
  sodan boolean not null default false,
  status text not null default 'open',
  created_at timestamptz not null default now(),
  constraint postings_kind_check
    check (kind in ('実技試験', 'コンクール', '演奏会', '録音')),
  constraint postings_fee_unit_check
    check (fee_unit is null
           or fee_unit in ('1回の本番', '1回の練習', '時給', 'まとめて')),
  constraint postings_status_check check (status in ('open', 'closed')),
  constraint postings_days_not_empty check (array_length(days, 1) >= 1),
  constraint postings_fee_amount_check check (fee_amount is null or fee_amount >= 0)
);

create index if not exists postings_org_status_idx
  on public.postings (org_id, status, created_at desc);
create index if not exists postings_owner_idx
  on public.postings (owner_user_id);

alter table public.postings enable row level security;

-- ----------------------------------------------------------------------------
-- ★門 ── ★自分の 募集 だけ（★裁定 その122 RLS_ON_POSTINGS）。
--   ★★よその 募集は、★この 門からは 1行も 出ません。
--   ★★書く 2本は `using` と `with check` の 両方（★変えない原則）。
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public'
    and tablename='postings' and policyname='postings_select_own') then
    create policy "postings_select_own" on public.postings
      for select using (auth.uid() = owner_user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public'
    and tablename='postings' and policyname='postings_insert_own') then
    create policy "postings_insert_own" on public.postings
      for insert with check (auth.uid() = owner_user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public'
    and tablename='postings' and policyname='postings_update_own') then
    create policy "postings_update_own" on public.postings
      for update using (auth.uid() = owner_user_id)
      with check (auth.uid() = owner_user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public'
    and tablename='postings' and policyname='postings_delete_own') then
    create policy "postings_delete_own" on public.postings
      for delete using (auth.uid() = owner_user_id);
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- ★権限 ── ★先に 取り上げ、★その 後で 名指し（★2026-09-19 の 学び）。
-- ----------------------------------------------------------------------------
revoke all on public.postings from anon, authenticated;
grant select (id, org_id, owner_user_id, title, kind, piece, days,
              need_all_days, fee_amount, fee_unit, sodan, status, created_at)
  on public.postings to authenticated;
grant insert (org_id, owner_user_id, title, kind, piece, days,
              need_all_days, fee_amount, fee_unit, sodan, status)
  on public.postings to authenticated;
grant update (title, kind, piece, days, need_all_days,
              fee_amount, fee_unit, sodan, status)
  on public.postings to authenticated;
grant delete on public.postings to authenticated;

-- ----------------------------------------------------------------------------
-- ★募集の 一覧（★裁定 その122 IMPLEMENT_B）。
--
--   ★★★`security definer` です。★よその 募集を 返す ため です。
--     ★★門は「自分の 募集 だけ」に 閉じて あります。
--     ★★よそを 見せるのは **この 1本 だけ** です。
--
--   ★★絞りは 3つ 重ねます（★裁定 その122 CAUTION_SECURITY_DEFINER）──
--     ★① `auth.uid()` …… ★呼んで いる ご本人
--     ★② `org_id` …… ★その 学校に 在籍して いる こと
--     ★③ `matching_visible()` …… ★切れて いない こと（★双方向）
--   ★★列は 名指しします。★`select *` を 書きません。
--   ★★`search_path` を 留めます。
--
--   ★★★`enrollments` の 列は `student_id` です（★2026-09-21 に 台帳で 確かめました）。
--     ★★裁定の 下書きは `e.user_id` でした。★その 列は ありません。
--   ★★★`profiles` の 鍵は `id` です。★`user_id` では ありません。
--     ★★裁定の 下書きは `pr.user_id` でした。★同じく ありません。
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
    -- ★★★自分の 募集は 返しません（★裁定 その123・2026-09-21）。
    --   ★★見本は 2つの 節に 分けて います ──
    --     ★「出ている 募集」…… ★応募する もの
    --     ★「自分が 出した 募集」…… ★応募を 受ける もの
    --   ★★性質が ちがいます。★返す 列も ちがいます。
    --   ★★★画面で 絞りません。★絞り忘れると、
    --     ★★「自分の 募集に 応募できる」姿が、★一瞬でも 作れて しまいます。
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

-- ★画面から 呼びます。★`matching_visible` は 渡しません（★裁定 その122 WHY_NOT_A）。
revoke all on function public.get_postings(uuid) from public, anon;
grant execute on function public.get_postings(uuid) to authenticated;

comment on function public.get_postings(uuid) is
  '★募集の 一覧（★裁定 その122）。★在籍と 切れて いない ことで 絞ります。'
  '★時間・会場・合わせの 場所は 返しません（★裁定 その94 §4g never_show）。';

-- ----------------------------------------------------------------------------
-- ★自分が 出した 募集（★裁定 その123）。
--
--   ★★★こちらには `matching_visible()` を 通しません。
--     ★★自分を 切る ことは ありません。★通す 意味が ありません。
--   ★★門（`postings_select_own`）だけでも 引けます。
--     ★★それでも 関数に するのは、★見本が「応募が #件 あります」を
--       ★★出して いる から です。★数は 門だけでは 出せません。
--
--   ★★★いまは 数を 返して いません（★NOT_YET）。
--     ★★`applications` の 表が まだ ありません。★数える もとが ありません。
--     ★★★0 を 返しません。「応募が 0件 あります」は **嘘** です。
--       ★★無い ものを、★在る ように 見せません。
--     ★★★when（外す 条件）── ★`applications` を 作る とき。
--       ★★そのとき `application_count integer` を この 返りに 足します。
--       ★★画面の 呼び口は 変わりません。★列が 1つ 増える だけ です。
-- ----------------------------------------------------------------------------
create or replace function public.get_my_postings()
returns table (
  id uuid,
  title text,
  kind text,
  days text[],
  status text,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select p.id, p.title, p.kind, p.days::text[], p.status, p.created_at
  from public.postings p
  where p.owner_user_id = auth.uid()
  order by p.created_at desc
$$;

revoke all on function public.get_my_postings() from public, anon;
grant execute on function public.get_my_postings() to authenticated;

comment on function public.get_my_postings() is
  '★自分が 出した 募集（★裁定 その123）。★matching_visible は 通しません。'
  '★応募の 数は まだ 返しません（★applications が 無い ため）。';

-- ============================================================================
-- ★NOT_YET ── ★まだ 列に して いない もの
--
--   ★「募集を 出す」の 見本には、★ほかに 6つの 入れ口が あります ──
--     ★だれを さがしますか ／ 何人 ／ 楽器・パート ／ 何のために
--     ★／ 希望の 時期 ／ 回数
--   ★★裁定 その94 §4g（★募集に 何を 載せるか・2026-09-19 確定）に、
--     ★★これらは 入って いません。★載せる 列を 先に 作りません。
--   ★★★when（外す 条件）── ★「募集を 出す」の 画面を 作る とき。
--     ★★そのとき、★どれを 台帳に 置くかを 裁定で 決めて いただきます。
-- ============================================================================
