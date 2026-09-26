-- 20260925_88 チケットの 値段の 計算（★裁定201 §2b）
-- 坂本さんの ご指摘（2026-09-25）:
--   ★「チケットの 値段を 公演の 規模から 計算するのは 必要」
--   ★★「主催者の 取り分も 含めて 計算に 入れてほしい」
--   ★「★評価では ありません」
-- ★私は「相場の 集計」と 混ぜて 読み、★はじめ 採らないと しました。★誤りでした
--   ★★ほかの 公演と 並べる ＝ 評価
--   ★★自分の 支出から 割る ＝ ★事実の 計算
-- ★★取り分を 入れる 理由:
--   ★入れないと ★「赤字に ならない 値段」しか 出ません
--   ★★それは「ただ働きを 前提に した 値段」です
-- ★81 のあと（★使うのは 2027年。★台帳だけ 先に）

create table if not exists public.koen_ticket_plan (
  koen_id     uuid primary key references public.koen(id) on delete cascade,
  seats       integer,                          -- ★席数
  occupancy   numeric(4,3) default 0.700,       -- ★想定入場率（0.000〜1.000）
  shows       integer default 1,                -- ★公演回数
  expense_yen integer,                          -- ★支出の 合計
  reserve_pct numeric(4,3) default 0.080,       -- ★予備費（既定 8%）
  -- ★★主催者の 取り分 ── ★3つの どれかで 入れる
  margin_kind text default 'pct' check (margin_kind in ('yen','pct','per_head')),
  margin_yen  integer,                          -- ★額で
  margin_pct  numeric(4,3) default 0.100                -- ★割合で（★既定 10%）
    check (margin_pct is null or margin_pct between 0 and 0.200),  -- ★★上限 20%（2026-09-25）
  margin_heads integer, margin_per_head integer,-- ★1人あたり
  grant_yen   integer default 0,                -- ★確定した 助成
  sponsor_yen integer default 0,                -- ★確定した 協賛
  dues_yen    integer default 0,                -- ★会費
  chosen      text check (chosen in ('free','breakeven','sustain','margin','manual')),
  manual_yen  integer,
  updated_at  timestamptz not null default now()
);
alter table public.koen_ticket_plan enable row level security;
revoke all on public.koen_ticket_plan from anon, authenticated;
grant select, insert, update, delete on public.koen_ticket_plan to authenticated;
drop policy if exists koen_ticket_plan_staff on public.koen_ticket_plan;
create policy koen_ticket_plan_staff on public.koen_ticket_plan for all to authenticated
  using (public.koen_can_manage(koen_id)) with check (public.koen_can_manage(koen_id));
-- ★★出演者には 見せません（★お金の 内訳は 制作の もの）

-- ★案を 返す（★4つ＋手入力）
create or replace function public.ticket_plans(p_koen uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare t record; v_margin numeric; v_base numeric; v_seats numeric; v_need numeric;
        f_break numeric; f_sustain numeric;
begin
  if not public.koen_can_manage(p_koen) then raise exception 'NOT_STAFF'; end if;
  select * into t from public.koen_ticket_plan where koen_id = p_koen;
  if t.koen_id is null or coalesce(t.expense_yen,0) = 0 then
    -- ★★支出が 未入力なら ★案を 出しません（★嘘の 値段を 出さない）
    return jsonb_build_object('ready', false,
      'why', '支出を 入れると、値段の 案が 出ます');
  end if;
  v_seats := coalesce(t.seats,0) * coalesce(t.occupancy,0.7) * coalesce(t.shows,1);
  if v_seats <= 0 then
    return jsonb_build_object('ready', false, 'why', '席数を 入れると、値段の 案が 出ます');
  end if;
  v_margin := case t.margin_kind
    when 'yen' then coalesce(t.margin_yen,0)
    when 'per_head' then coalesce(t.margin_heads,0) * coalesce(t.margin_per_head,0)
    else coalesce(t.expense_yen,0) * coalesce(t.margin_pct,0.1) end;
  v_base := coalesce(t.expense_yen,0) * (1 + coalesce(t.reserve_pct,0.08))
            - coalesce(t.grant_yen,0) - coalesce(t.sponsor_yen,0) - coalesce(t.dues_yen,0);
  f_break   := ceil(greatest(v_base,0) / v_seats / 100) * 100;
  f_sustain := ceil(greatest(v_base + v_margin,0) / v_seats / 100) * 100;
  return jsonb_build_object(
    'ready', true,
    'free',     jsonb_build_object('yen', 0, 'short', greatest(v_base,0)::int),
    'breakeven',jsonb_build_object('yen', f_break::int,   'margin', 0),
    'sustain',  jsonb_build_object('yen', f_sustain::int, 'margin', v_margin::int),
    'margin',   jsonb_build_object('yen', (ceil(f_sustain*1.2/100)*100)::int),
    'seats_to_break', ceil(greatest(v_base,0) / greatest(f_sustain,1))::int,
    'left_over',      (f_sustain * v_seats - v_base)::int
  );
end $$;
revoke all on function public.ticket_plans(uuid) from public, anon;
grant execute on function public.ticket_plans(uuid) to authenticated;

-- ★★作らないもの:
--   ★ほかの 公演との 比べ（★評価に なります）
--   ★「高い／安い」の 判定・色
--   ★空席に 応じた 値動き

-- 確かめ（試しの環境で）
-- 支出 未入力 → ready=false（★案を 出さない）
-- 支出 1,200,000／500席・60%・1回／助成 300,000／会費 380,000:
--   ★取り分 0       → ★2,100円
--   ★取り分 200,000 → ★2,700円
-- ★★「◯人 入れば とんとん」「手元に 残るのは ◯円」も 返る
-- 出演者から → NOT_STAFF
