-- 20260926_99 チケットの 席種（★F-M2b・裁定209 §2 F）
-- Fable の 指摘（2026-09-26）:
--   ★「席種の 列と 有効席数の 計算が 無い。
--     ★動く見本の 画面は 席種を 出している ので、★関数を 合わせる」
-- ★★そのとおりです。★見本が 正 です
--   ★見本: S 1.4／A 1.0／B 0.7／学生 0.5／早割 0.85 を ★加重平均
--   ★sql/88: ★席種を 見ていません
-- ★★これは ★数字を 1.5倍 多く 見せます:
--   ★席種なし 手元 314,000 ／ ★★席種あり 211,700
-- ★88 のあと

alter table public.koen_ticket_plan add column if not exists seat_types jsonb
  default '[{"k":"S","w":1.4,"on":true},{"k":"A","w":1.0,"on":true},
             {"k":"B","w":0.7,"on":true},{"k":"student","w":0.5,"on":true},
             {"k":"early","w":0.85,"on":false}]'::jsonb;
alter table public.koen_ticket_plan drop constraint if exists koen_ticket_seat_types_ok;
alter table public.koen_ticket_plan add constraint koen_ticket_seat_types_ok
  check (seat_types is null or jsonb_typeof(seat_types) = 'array');

-- ★★席種を 見た 計算に 直します
create or replace function public.ticket_plans(p_koen uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare t record; v_margin numeric; v_base numeric; v_seats numeric;
        v_w numeric; v_on int; f_break numeric; f_sustain numeric;
begin
  if not public.koen_can_manage(p_koen) then raise exception 'NOT_STAFF'; end if;
  select * into t from public.koen_ticket_plan where koen_id = p_koen;
  if t.koen_id is null or coalesce(t.expense_yen,0) = 0 then
    return jsonb_build_object('ready', false,
      'why', '支出を 入れると、値段の 案が 出ます');
  end if;
  v_seats := coalesce(t.seats,0) * coalesce(t.occupancy,0.7) * coalesce(t.shows,1);
  if v_seats <= 0 then
    return jsonb_build_object('ready', false, 'why', '席数を 入れると、値段の 案が 出ます');
  end if;

  -- ★★使う 席種の 係数の 平均（★見本と 同じ 数え方）
  select coalesce(avg((e->>'w')::numeric),1), count(*)
    into v_w, v_on
    from jsonb_array_elements(coalesce(t.seat_types,'[]'::jsonb)) e
   where coalesce((e->>'on')::boolean, false);
  if v_on = 0 then v_w := 1; end if;          -- ★1つも 選ばなければ 1.0
  -- ★★有効席数 ＝ 席数 × 入場率 × 回数 × 係数の 平均
  v_seats := v_seats * v_w;

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
    'weight', round(v_w, 3),                   -- ★係数の 平均（★画面が 説明に 使えます）
    'effective_seats', round(v_seats)::int,    -- ★有効席数
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

-- ★★これで ★見本と 台帳が 揃います
--   ★★見本の 数字（★手元 211,700・★224人）が ★正 です
--   ★★Fable の F-M2 の 期待値は ★席種の 条件を 書いてから 固定して ください

-- 確かめ（試しの環境で）
-- ★5種 すべて on（★早割 off）→ ★係数の 平均 0.9（S1.4・A1.0・B0.7・学生0.5）
-- ★A席だけ on → ★係数 1.0（★席種なしと 同じ）
-- ★1つも on で なければ → ★係数 1.0（★止まらない）
