-- ============================================================================
-- La Voce / Woolsong ── ★さがす（マッチング）の 段0
--   ★切る（裁定 その94 §5「L3_CUT」／裁定 その121 STEP0）
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
--
-- ★★★なぜ これが **いちばん 最初** か（★裁定 その121 Q1）。
--   ★★裁定 その94 §10 の 順（3: 切る）は、★**画面を 出す** 順 です。
--   ★★★式を 置く 順は 別 です。
--     ★★`postings` を 作った 後で 除外を 足すと、★読む ところ ぜんぶ を
--       ★★探して 回る ことに なります。★1か所でも 漏れると 見えて しまいます。
--     ★★だから、★募集の 表より 先に、★除外の 式を 1本 置きます。
--
-- ★★★双方向 です（★裁定 その94 §5-2）。
--   ★★切った 側からも、★切られた 側からも 見えません。
--   ★★片方向だと「切られた」と 判ります。★判ると 別の 道で 近づいて きます。
--
-- ★★★運営も 引けません（★裁定 その94 §5「visible_to: 本人のみ」）。
--   ★★「切った わけ」を 訊かれる 不安を 作りません。
-- ============================================================================

create table if not exists public.matching_cuts (
  id uuid primary key default gen_random_uuid(),
  -- ★切った ご本人。
  user_id uuid not null references auth.users on delete cascade,
  -- ★切られた 相手。
  --   ★★こちらにも cascade を 付けます（★裁定 その116 の 学び）。
  --     ★★相手が 退会した とき、★この 行が 宙に 浮きます。
  --     ★★1つの 表でも、★2人の 退会を 別々に 考えます。
  target_user_id uuid not null references auth.users on delete cascade,
  -- ★3つ（★裁定 その94 §5）。★どれも 1押し。★わけを 訊きません。
  --   ★withdraw … 応募を 取り下げる
  --   ★mute     … この人からの 連絡を 止める
  --   ★hide     … この人に 自分を 見せない
  kind text not null,
  -- ★学校の 中だけ（★裁定 その94 §3「L1_SCOPE」）。
  org_id uuid not null references public.organizations on delete cascade,
  created_at timestamptz not null default now(),
  constraint matching_cuts_kind_check check (kind in ('withdraw', 'mute', 'hide')),
  -- ★同じ 相手に、★同じ 切り方を 2つ 持ちません。
  constraint matching_cuts_unique unique (user_id, target_user_id, kind),
  -- ★自分を 切れません。
  constraint matching_cuts_not_self check (user_id <> target_user_id)
);

create index if not exists matching_cuts_user_idx
  on public.matching_cuts (user_id, target_user_id);
create index if not exists matching_cuts_target_idx
  on public.matching_cuts (target_user_id, user_id);

alter table public.matching_cuts enable row level security;

-- ----------------------------------------------------------------------------
-- ★門（RLS）── ★ご本人 だけ。★相手側からは 1行も 引けません。
--
--   ★★`using` と `with check` の 両方を 書きます（★変えない原則）。
--   ★★`update` の 門を 作りません。★切り方を 書き換える 道は 要りません。
--     ★★やめる ときは 消します（`delete`）。★書き換えでは ありません。
--   ★★教師・運営・学長の 門を 1つも 作りません。
--     ★★裁定 その94 §5 ──「visible_to: 本人のみ（運営も 見ない）」。
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'matching_cuts'
      and policyname = 'matching_cuts_select_own') then
    create policy "matching_cuts_select_own" on public.matching_cuts
      for select using (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'matching_cuts'
      and policyname = 'matching_cuts_insert_own') then
    create policy "matching_cuts_insert_own" on public.matching_cuts
      for insert with check (auth.uid() = user_id);
  end if;
  if not exists (select 1 from pg_policies
    where schemaname = 'public' and tablename = 'matching_cuts'
      and policyname = 'matching_cuts_delete_own') then
    create policy "matching_cuts_delete_own" on public.matching_cuts
      for delete using (auth.uid() = user_id);
  end if;
end $$;

-- ----------------------------------------------------------------------------
-- ★権限 ── ★先に 取り上げ、★その 後で 名指しします（★2026-09-19 の 学び）。
--   ★★列の grant は、★表の grant が 残って いると 効きません。
-- ----------------------------------------------------------------------------
revoke all on public.matching_cuts from anon, authenticated;
grant select (id, user_id, target_user_id, kind, org_id, created_at)
  on public.matching_cuts to authenticated;
grant insert (user_id, target_user_id, kind, org_id)
  on public.matching_cuts to authenticated;
grant delete on public.matching_cuts to authenticated;
-- ★`update` は 渡しません。★門も ありません。

-- ----------------------------------------------------------------------------
-- ★除外は この 1本 だけ（★裁定 その121 Q1 do_not）。
--
--   ★★★`security definer` です。★理由を 書き残します ──
--     ★★門（RLS）は「ご本人の 行 だけ」です。
--     ★★相手が 切った 行は、★こちらからは 1行も 引けません。
--     ★★★だから、★呼ぶ 人の ままでは **片方しか 見えません**。
--       ★★片方しか 見ないと、★「切られた」側に 相手が 出て しまいます。
--   ★★`search_path` を 留めます。★`security definer` の 決まり です。
--   ★★返すのは 真偽 1つ だけ です。★行を 1つも 返しません。
--
--   ★★★使う 人を まだ 決めて いません（★段0 では 誰も 呼びません）。
--     ★★`execute` を 誰にも 渡して いません。
--     ★★理由 ── ★画面から 直に 呼べると、★これじたいが 覗き穴に なります。
--       ★★`matching_visible(自分, 相手)` が false を 返した とき、
--         ★★自分が 切って いなければ、★相手が 切った と 判ります。
--       ★★裁定 その94 §5「相手に 通知しない」と 食い違います。
--     ★★★どこから 呼ぶか（★門の 中 か、★列を 絞る 関数の 中 か）は、
--       ★★`postings` を 作る 段2 で 決めます。★そのとき `execute` を 渡します。
-- ----------------------------------------------------------------------------
create or replace function public.matching_visible(p_viewer uuid, p_target uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select not exists (
    select 1 from public.matching_cuts
    where (user_id = p_viewer and target_user_id = p_target)
       or (user_id = p_target and target_user_id = p_viewer)
  )
$$;

revoke all on function public.matching_visible(uuid, uuid) from public, anon, authenticated;

comment on function public.matching_visible(uuid, uuid) is
  '★切れて いないか（★双方向）。★裁定 その121 STEP0。'
  '★execute は まだ 誰にも 渡して いません（★覗き穴に なる ため）。'
  '★段2（postings）で、★呼ぶ ところを 決めて から 渡します。';
