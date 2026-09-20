-- ============================================================================
-- La Voce / Woolsong ── ★裁定 その125（2026-09-21）
--   ★通報した 2人の 組は、★`restored` の 後も 離れた まま
--
-- ★Supabase の SQL Editor で 実行してください（★何度 実行しても 安全です）。
-- ★先に 段0〜段5 の 5枚を。
--
-- ★★★何が 変わるか
--   ★★これまで …… ★`matching_visible()` が `matching_reports` を 見て いました。
--   ★★これから …… ★通報した その ときに `matching_cuts` に 1行 作ります（`reported`）。
--     ★★`matching_visible()` は 切りだけ を 見ます。★元の 姿に 戻ります。
--
--   ★★★なぜ そのほうが よいか（★裁定 その125）
--     ★★① 通報した ご本人が **消せます**。★気が 変わった ときの ため です。
--       ★★拝見の 結果では 消えません。★消せるのは ご本人 だけ です。
--     ★★② 除外の 決めが 1つの 表に 集まります（★`matching_cuts`）。
--       ★★`matching_visible()` が 2つの 表を 見ない で 済みます。
--
--   ★★★`restored` が 意味する こと
--     ★★ほかの 方からは 見える ように なります（★募集・応募が 戻ります）。
--     ★★通報した 方からは、★引き続き 見えません。
-- ============================================================================

-- ----------------------------------------------------------------------------
-- ★① 切りの 種に `reported` を 足します。
-- ----------------------------------------------------------------------------
alter table public.matching_cuts
  drop constraint if exists matching_cuts_kind_check;
alter table public.matching_cuts
  add constraint matching_cuts_kind_check
  check (kind in ('withdraw', 'mute', 'hide', 'reported'));

-- ----------------------------------------------------------------------------
-- ★② 通報したら、★その場で 1行 作ります。
--
--   ★★★引き金（trigger）で 作ります。★画面に 任せません。
--     ★★画面が 2度 呼ばない とも、★呼び忘れない とも 限りません。
--     ★★台帳の 側で 必ず 作れば、★どの 道から 来ても 同じに なります。
--   ★★すでに 同じ 組の `reported` が あれば、★何も しません。
-- ----------------------------------------------------------------------------
create or replace function public.matching_report_makes_cut()
returns trigger
language plpgsql
security definer
set search_path = public, pg_temp
as $$
begin
  insert into public.matching_cuts (user_id, target_user_id, kind, org_id)
  values (new.reporter_user_id, new.target_user_id, 'reported', new.org_id)
  on conflict (user_id, target_user_id, kind) do nothing;
  return new;
end;
$$;

drop trigger if exists matching_report_cut on public.matching_reports;
create trigger matching_report_cut
  after insert on public.matching_reports
  for each row execute function public.matching_report_makes_cut();

-- ----------------------------------------------------------------------------
-- ★③ 除外の 式を 戻します ── ★切りと、★止まって いるか だけ。
--
--   ★★通報の 表を 見なく なります。★組は `matching_cuts` が 持ちます。
--   ★★止まって いる 方を 外すのは、★そのまま 残します（★VERIFY Q8）。
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
  and not public.matching_suspended(p_target)
$$;

revoke all on function public.matching_visible(uuid, uuid) from public, anon, authenticated;

comment on function public.matching_visible(uuid, uuid) is
  '★切れて いないか（★双方向）＋ ★止まって いないか。★裁定 その121・その125。'
  '★通報の 組は matching_cuts の kind=reported が 持ちます。';
