-- 20260924_81 公演の くばりもの（★「誰に 届いたか」の 置き場が 無かった）
-- Code の指摘（2026-09-24）:
--   ★見本の 一覧は 3列。★3列目が「誰に 届いたか」（例:「第3幕に 出る方」）
--   ★export_log には その列が ありません（rows は 件数だけ）
--   ★しまう場所が 無いまま 出すと ★次に 開いたとき 消えます
--   → ★Code が 出さなかったのは ★正しい判断です
--
-- ★どちらに するか（判断）:
--   ✕ export_log に 列を 足す ── ★org_id が 必須です（★市民オペラには org が ありません）
--      ★export_log は「★学校が 名簿を 書き出した」記録。★別の ものです
--   ○ ★専用の表を 作る ── ★下の koen_handouts
-- ★12・18・45 のあと

create table if not exists public.koen_handouts (
  id          uuid primary key default gen_random_uuid(),
  koen_id     uuid not null references public.koen(id) on delete cascade,
  title       text not null,                    -- ★何を（香盤表・稽古予定・演出ノート 第2幕）
  audience    text not null,                    -- ★誰に（全員／第2幕に 出る方／スタッフ）
  handed_on   date not null,                    -- ★いつ 配ったか
  slot_id     uuid references public.koen_slots(id) on delete set null,  -- ★枠で 絞ったとき
  row_id      uuid references public.koen_rows(id) on delete set null,   -- ★場面で 絞ったとき
  created_by  uuid,
  created_at  timestamptz not null default now()
);
create index if not exists koen_handouts_koen_idx on public.koen_handouts(koen_id, handed_on desc);
alter table public.koen_handouts enable row level security;
revoke all on public.koen_handouts from anon, authenticated;
grant select on public.koen_handouts to authenticated;

-- ★運営が 書く／★公演に いる人は 読める（★自分に 配られたかを 見る ため）
drop policy if exists koen_handouts_staff on public.koen_handouts;
create policy koen_handouts_staff on public.koen_handouts for all to authenticated
  using (public.koen_can_manage(koen_id)) with check (public.koen_can_manage(koen_id));
drop policy if exists koen_handouts_read on public.koen_handouts;
create policy koen_handouts_read on public.koen_handouts for select to authenticated
  using (public.koen_can_see(koen_id));

-- ★★読んだかどうかは ★持ちません（★見本の 約束のとおり）
--   「★読んだかどうか、読んだ 数は 出しません」
--   → ★開いた・読んだ の 列を 作らない。★作れば いつか 出したくなります

create or replace function public.hand_out(p_koen uuid, p_title text, p_audience text,
                                           p_on date default null, p_slot uuid default null, p_row uuid default null)
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid;
begin
  if not public.koen_can_manage(p_koen) then raise exception 'NOT_STAFF'; end if;
  if btrim(coalesce(p_title,'')) = '' then raise exception 'NO_TITLE'; end if;
  if btrim(coalesce(p_audience,'')) = '' then raise exception 'NO_AUDIENCE'; end if;
  insert into public.koen_handouts(koen_id, title, audience, handed_on, slot_id, row_id, created_by)
  values (p_koen, left(btrim(p_title),80), left(btrim(p_audience),40),
          coalesce(p_on, (now() at time zone 'Asia/Tokyo')::date), p_slot, p_row, public.actor_id())
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.hand_out(uuid, text, text, date, uuid, uuid) from public, anon;
grant execute on function public.hand_out(uuid, text, text, date, uuid, uuid) to authenticated;

-- 確かめ（試しの環境で・★なりきって）
-- 運営が 配る → 1行／★一覧に 何を・誰に・いつ が 残る
-- 出演者が 読む → ★見える（★自分の 公演のもの）
-- ★よその公演の人 → 0行
-- ★出演者が 配ろうとする → NOT_STAFF
-- ★「読んだ」の 列は ありません（★作りません）
-- ★楽譜は 配りません（★これは 画面の ことばで 止める。★台帳では 止めません）
