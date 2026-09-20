-- ============================================================================
-- La Voce / Woolsong ── ★さがす（マッチング）の 段5（★最後）
--   ★通報（`matching_reports`）── ★裁定 その94 §6「L4_REPORT」／その121 Q2
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
-- ★先に 段0〜段4 の 4枚を。
--
-- ★★★1件で すぐ 止まります（★§6 `why_immediate`）。
--   ★★人が 見てから 止めると、★時差の ぶん 被害が 続きます。
--   ★★3回 待ちません。★被害を 受けた 方の 8割は 通報しません。
--   ★★★期限つきの 停止を 作りません（★§6 `do_not`）。★1か月後に 戻って きません。
--
-- ★★★通報した 方を 守ります（★§6 `protect_reporter`）。
--   ★★誰が 通報したかを、★相手に 伝えません。★相手は この 表を 1行も 読めません。
--   ★★通報した その ときから、★相手から あなたが 見えなく なります。
--     ★★これは `matching_visible()` に 足しました。★別の 仕掛けを 作りません。
--
-- ★★★切った 後も、★通報の 口は 残ります（★§5 `separation_from_report`）。
--   ★★切る ことと 通報は 別 です。★切ったら 通報できない、に しません。
--   ★★`matching_cuts` に 行が あっても、★この 表に 入れられます。
-- ============================================================================

create table if not exists public.matching_reports (
  id uuid primary key default gen_random_uuid(),
  reporter_user_id uuid not null references auth.users on delete cascade,
  target_user_id uuid not null references auth.users on delete cascade,
  org_id uuid not null references public.organizations on delete cascade,
  -- ★6つ（★見本 `SC['こまったこと']`）。
  reason text not null,
  -- ★「よろしければ、もう少し」──「書かなくても かまいません」。
  --   ★★ここは **運営へ** の ことば です。★相手には 渡りません。
  --   ★★自由に 書ける のは、★この 家で ここ だけ です。
  detail text,
  created_at timestamptz not null default now(),
  -- ★拝見した あと（★§6 `after_review`）。★3つ です。★中を 作りません。
  --   ★null …… ★まだ 見て いません。★止まって います
  --   ★`restored` …… ★行き違い でした。★戻します。★記録は 残します
  --   ★`banned` …… ★度を 越して います。★ずっと 止めます
  --   ★`holding` …… ★決められません。★止めた まま、★双方に 伺います
  outcome text,
  reviewed_at timestamptz,
  review_note text,
  constraint matching_reports_reason_check check (reason in (
    'shitsukoku', 'kankei_nai_hanashi', 'hoka_de_renraku',
    'okane', 'kowai', 'sonohoka')),
  constraint matching_reports_outcome_check
    check (outcome is null or outcome in ('restored', 'banned', 'holding')),
  constraint matching_reports_not_self check (reporter_user_id <> target_user_id)
);

create index if not exists matching_reports_target_idx
  on public.matching_reports (target_user_id, outcome);
create index if not exists matching_reports_reporter_idx
  on public.matching_reports (reporter_user_id, created_at desc);

alter table public.matching_reports enable row level security;

-- ----------------------------------------------------------------------------
-- ★門 ── ★通報した ご本人 だけ。
--   ★★★通報された 方には、★門が ありません。★1行も 読めません。
--     ★★誰が 通報したかを 伝えない、とは ★そういう こと です。
--   ★★運営にも 門を 作りません。★拝見するのは 坂本さん の 手（service_role）です。
--   ★★`update` / `delete` の 門を 作りません。
--     ★★出した 通報を、★あとから 消したり 書き換えたり しません。
-- ----------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_policies where schemaname='public'
    and tablename='matching_reports' and policyname='matching_reports_select_own') then
    create policy "matching_reports_select_own" on public.matching_reports
      for select using (auth.uid() = reporter_user_id);
  end if;
  if not exists (select 1 from pg_policies where schemaname='public'
    and tablename='matching_reports' and policyname='matching_reports_insert_own') then
    create policy "matching_reports_insert_own" on public.matching_reports
      for insert with check (auth.uid() = reporter_user_id);
  end if;
end $$;

revoke all on public.matching_reports from anon, authenticated;
-- ★自分が 出した ぶん だけ。★`outcome` と `review_note` は 渡しません。
--   ★★拝見の 中身は、★通報した 方にも お見せしません。
grant select (id, target_user_id, org_id, reason, detail, created_at)
  on public.matching_reports to authenticated;
grant insert (reporter_user_id, target_user_id, org_id, reason, detail)
  on public.matching_reports to authenticated;

-- ----------------------------------------------------------------------------
-- ★止まって いるか（★§6 1件で すぐ）。
--
--   ★★★別の 表を 作りません。★通報の 行 そのものが 状態 です。
--     ★★2つ 持つと、★片方だけ 直る 日が 来ます。
--   ★★止まって いる …… ★まだ 見て いない（null）／`banned`／`holding`
--   ★★戻って いる …… ★`restored` だけ
-- ----------------------------------------------------------------------------
create or replace function public.matching_suspended(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1 from public.matching_reports r
    where r.target_user_id = p_user
      and (r.outcome is null or r.outcome in ('banned', 'holding'))
  )
$$;

revoke all on function public.matching_suspended(uuid) from public, anon, authenticated;

-- ----------------------------------------------------------------------------
-- ★除外の 式に、★通報を 足します（★§6 `protect_reporter`・VERIFY Q9）。
--
--   ★★★通報した その ときから、★相手から あなたが 見えなく なります。
--     ★★別の 仕掛けを 作りません。★除外は この 1本 です（★裁定 その121 Q1）。
--   ★★★止まって いる 方も、★誰にも 見えません（★VERIFY Q8）。
--     ★★募集の 一覧・詳細・応募の 一覧、★どこにも 出ません。
--     ★★ここに 1行 足すだけで、★すべての 道に かかります。
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
  and not exists (
    -- ★★★この 組は、★拝見の 結果に よらず 見えません。
    --   ★★§6「通報した ことで その 相手から 見えなく なる」に、★期限が ありません。
    --   ★★★`restored`（行き違い でした）でも、★組は 戻しません。
    --     ★★止まって いた 方は 戻ります。★けれど **この 2人だけ** は 離れた まま です。
    --     ★★怖い 思いを した 方に、★「行き違いでした」と 言って
    --       ★★相手を 目の前に 戻すのは、★守りに なりません。
    --   ★★★ここは 私の 判じ です。★裁定に 書かれて いません。
    --     ★★戻す べき なら、★`and (outcome is null or outcome in …)` を 足します。
    select 1 from public.matching_reports
    where (reporter_user_id = p_viewer and target_user_id = p_target)
       or (reporter_user_id = p_target and target_user_id = p_viewer)
  )
  and not public.matching_suspended(p_target)
$$;

-- ★★`execute` は これまで どおり 誰にも 渡しません（★裁定 その122 WHY_NOT_A）。
revoke all on function public.matching_visible(uuid, uuid) from public, anon, authenticated;

-- ============================================================================
-- ★拝見の しかた（★§6 `flow` 2・3）
--
--   ★★画面は 作りません。★Supabase の 表で 直に ご覧に なります。
--     ★★`profiles.is_admin` と 同じ 考え です ── ★アプリの 中に 口を 作りません。
--   ★★見る  … select id, reporter_user_id, target_user_id, reason, detail,
--                     created_at, outcome from public.matching_reports
--                where outcome is null order by created_at;
--   ★★戻す  … update public.matching_reports
--                set outcome='restored', reviewed_at=now(), review_note='…'
--                where id='…';
--   ★★止める … 同じ 形で `outcome='banned'`。
--   ★★決められない … `outcome='holding'`。★止まった まま です。
--   ★★★期限つきの 停止を 作りません。★1か月後に 戻す 仕掛けは ありません。
--
-- ★NOT_YET
--   ★① 通報の 画面（★見本 `SC['こまったこと']`）は まだ です。
--     ★★when …… ★さがすの 画面を 作る とき。★「この人との やりとりについて」の 板から。
--   ★② 止まった 方への お知らせは ありません。
--     ★★§6 に 書かれて いません。★決まって いない ものを 作りません。
--     ★★when …… ★裁定で 決まった とき。
-- ============================================================================
