-- 20260925_89 公演の 収支（★裁定201・見本 design-v69）
-- ★見本に 作った 5画面の うち、★台帳が 無かった もの:
--   ★収支（見込み × 実績）／★支払いの 予定／★精算の 1枚
-- ★チケットの 値段は sql/88（koen_ticket_plan）
-- ★★お金は 動かしません（★記録だけ）
-- ★81・88 のあと

-- ① 収支の 行（★見込みと 実績を 同じ行に）
create table if not exists public.koen_budget (
  id         uuid primary key default gen_random_uuid(),
  koen_id    uuid not null references public.koen(id) on delete cascade,
  side       text not null check (side in ('income','expense')),
  category   text not null,                  -- ★会場／出演／助成 …
  planned    integer,                        -- ★見込み
  actual     integer,                        -- ★実績（★空＝まだ）
  sort_order integer not null default 0,
  note       text,
  created_at timestamptz not null default now(),
  constraint koen_budget_amt check ((planned is null or planned between 0 and 1000000000)
                               and (actual  is null or actual  between 0 and 1000000000)),
  constraint koen_budget_note_len check (note is null or char_length(note) <= 80)
);
create index if not exists koen_budget_koen_idx on public.koen_budget(koen_id, side, sort_order);
alter table public.koen_budget enable row level security;
revoke all on public.koen_budget from anon, authenticated;
grant select, insert, update, delete on public.koen_budget to authenticated;
drop policy if exists koen_budget_staff on public.koen_budget;
create policy koen_budget_staff on public.koen_budget for all to authenticated
  using (public.koen_can_manage(koen_id)) with check (public.koen_can_manage(koen_id));
-- ★★出演者には 見せません（★お金の 内訳は 制作の もの・裁定201 ⑤）

-- ② 支払いの 予定
create table if not exists public.koen_payments_due (
  id          uuid primary key default gen_random_uuid(),
  koen_id     uuid not null references public.koen(id) on delete cascade,
  due_on      date not null,
  counterparty text not null,                -- ★相手（会場・印刷・出演者 …）
  category    text,
  amount_yen  integer not null,
  state       text not null default 'planned' check (state in ('planned','paid','received')),
  member_id   uuid references public.koen_members(id) on delete set null,
  note        text,
  created_at  timestamptz not null default now(),
  constraint koen_pay_due_amt check (amount_yen between 0 and 1000000000),
  constraint koen_pay_due_name check (char_length(btrim(counterparty)) between 1 and 60)
);
create index if not exists koen_payments_due_idx on public.koen_payments_due(koen_id, due_on);
alter table public.koen_payments_due enable row level security;
revoke all on public.koen_payments_due from anon, authenticated;
grant select, insert, update, delete on public.koen_payments_due to authenticated;
drop policy if exists koen_payments_due_staff on public.koen_payments_due;
create policy koen_payments_due_staff on public.koen_payments_due for all to authenticated
  using (public.koen_can_manage(koen_id)) with check (public.koen_can_manage(koen_id));
-- ★★催促の 仕組みは 作りません（★お知らせの 列も・裁定201）

-- ③ 精算の 1枚（★差額の 理由と 入場者数）
alter table public.koen add column if not exists settled_at timestamptz;
alter table public.koen add column if not exists settle_note text;
alter table public.koen add column if not exists audience integer;
-- ★★差額の 理由は ★本人が 書きます。★こちらでは 書きません

-- ④ まとめ（★画面が 読む）
create or replace function public.koen_budget_sum(p_koen uuid)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare v jsonb;
begin
  if not public.koen_can_manage(p_koen) then raise exception 'NOT_STAFF'; end if;
  select jsonb_build_object(
    'income_planned',  coalesce(sum(planned) filter (where side='income'),0),
    'income_actual',   coalesce(sum(actual)  filter (where side='income'),0),
    'expense_planned', coalesce(sum(planned) filter (where side='expense'),0),
    'expense_actual',  coalesce(sum(actual)  filter (where side='expense'),0))
    into v from public.koen_budget where koen_id = p_koen;
  return v;
end $$;
revoke all on function public.koen_budget_sum(uuid) from public, anon;
grant execute on function public.koen_budget_sum(uuid) to authenticated;

-- ★★作らないもの（裁定201）:
--   ★領収書の 写真（★会計ソフトの 仕事）
--   ★源泉徴収・消費税・インボイスの 計算
--   ★決済・送金・チケットの 販売
--   ★ほかの 公演との 比べ（★相場の 集計）

-- 確かめ（試しの環境で・★なりきって）
-- 制作 → 読める・書ける
-- ★出演者 → NOT_STAFF（★お金の 内訳は 見えない）
-- ★よその公演の 人 → 0行
-- ★金額の 上限・相手の 名前の 長さで 止まる
-- ★「読んだ」「催促」の 列は ★ありません
