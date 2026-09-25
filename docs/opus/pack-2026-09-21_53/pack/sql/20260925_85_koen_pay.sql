-- 20260925_85 出演料の 台帳（裁定141 Q6）── ★C群に 入れる（2026-09-25）
-- 裁定141 Q6:「★入れる。★記録だけ。★見えるのは 制作と 本人だけ」
--   do_not:「★源泉徴収の 計算・決済」
-- ★★この線は 守ります:
--   ★計算しない（★源泉・消費税・インボイスの 判定を しない）
--   ★払わない（★決済の 仕組みを 持たない）
--   ★「いくらと 決めたか」「渡したか」だけ 記録します
--   ★理由: ★計算を 始めると ★税の 書類を 作る 道具に なります
--         ★間違えたときに ★責めを 負うのは 利用者です
-- ★81・84 のあと

create table if not exists public.koen_pay (
  id         uuid primary key default gen_random_uuid(),
  koen_id    uuid not null references public.koen(id) on delete cascade,
  member_id  uuid not null references public.koen_members(id) on delete cascade,
  amount_yen integer,                       -- ★決めた額（★空でも よい＝まだ 決めていない）
  note       text,                          -- ★「本番1回＋稽古3回 まとめて」など
  paid_on    date,                          -- ★渡した日（★空＝まだ）
  name_at    text,                          -- ★そのときの 名前（★抜けても 残る）
  created_by uuid,
  created_at timestamptz not null default now(),
  constraint koen_pay_amount_ok check (amount_yen is null or (amount_yen >= 0 and amount_yen <= 10000000)),
  constraint koen_pay_note_len check (note is null or char_length(note) <= 60)
);
create unique index if not exists koen_pay_one_per_member on public.koen_pay(koen_id, member_id);
alter table public.koen_pay enable row level security;
revoke all on public.koen_pay from anon, authenticated;
grant select on public.koen_pay to authenticated;

-- ★制作（運営）は 全部／★本人は 自分の分だけ（裁定141 Q6）
drop policy if exists koen_pay_staff on public.koen_pay;
create policy koen_pay_staff on public.koen_pay for all to authenticated
  using (public.koen_can_manage(koen_id)) with check (public.koen_can_manage(koen_id));
drop policy if exists koen_pay_mine on public.koen_pay;
create policy koen_pay_mine on public.koen_pay for select to authenticated
  using (exists (select 1 from public.koen_members m
                  where m.id = member_id and m.user_id = auth.uid() and m.left_at is null));
-- ★★ほかの 出演者の 額は ★見えません（★いちばん 大事な点）

create or replace function public.set_koen_pay(p_koen uuid, p_member uuid,
                                               p_amount integer default null,
                                               p_note text default null,
                                               p_paid_on date default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid;
begin
  if not public.koen_can_manage(p_koen) then raise exception 'NOT_STAFF'; end if;
  insert into public.koen_pay(koen_id, member_id, amount_yen, note, paid_on, name_at, created_by)
  values (p_koen, p_member, p_amount, left(btrim(coalesce(p_note,'')),60), p_paid_on,
          (select m.name_at from public.koen_members m where m.id = p_member), public.actor_id())
  on conflict (koen_id, member_id) do update
     set amount_yen = excluded.amount_yen, note = excluded.note, paid_on = excluded.paid_on
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.set_koen_pay(uuid, uuid, integer, text, date) from public, anon;
grant execute on function public.set_koen_pay(uuid, uuid, integer, text, date) to authenticated;

-- ★★作らないもの（★裁定141 の do_not）:
--   ★源泉徴収の 計算／消費税の 判定／インボイスの 番号／支払調書
--   ★決済（★Stripe へ つながない）
--   ★合計を 返す 関数（★「いくら 使ったか」は 運営が 自分で 足す）
--     ★理由: ★合計を 出すと ★次は「税の 計算も」と なります

-- 確かめ（試しの環境で・★なりきって）
-- 運営 → 全部 見える・書ける
-- ★本人 → ★自分の分だけ（★ほかの 出演者の 額は 見えない）
-- ★よその公演の人 → 0行
-- 出演者が 書く → NOT_STAFF
-- ★1人1行（★同じ人に 2行 作れない）
-- ★源泉・消費税・インボイスの 列は ★ありません
