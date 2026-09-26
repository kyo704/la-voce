-- 20260923_72 公演に「作品」を結ぶ（★Code の指摘①への答え）
-- Code の指摘:「見本は5項目 聞くのに、koen には 3列しか ない。
--   ★このまま実装すると『入力できて、保存時に 消える』── いちばん 危ない不具合になる」
--   ★入力欄を 出さない対応にした ── ★正しい判断です。ありがとうございます
--
-- ★台帳を 調べた答え（2026-09-23）:
--   ・題名 → koen.title ／ 種類 → koen.kind ／ 会場 → koen.venue ★あります
--   ・★稽古の始まり → ★koen.opens_on が それです（列は あります）
--       ※ koen_compute_valid_until が「本番が まだ無いとき」の 保険に 使っています
--   ・★本番の日 → ★列は ありません。★正しくは koen_sessions(kind='show') の 行です
--       公演を作るときに ★本番の稽古（show）を 1行 作るのが 正しい形
--       （そうすれば 使える期限＝本番の最後の日＋30日 が すぐ 正しく出ます）
--   ・★作品・曲目 → ★列が ありません。★これは 足すべきです（下の①）
-- ★26・27・33 のあと

-- ① 公演に 作品を結ぶ（★1つの主な作品。ガラのように 複数のときは 行（koen_rows）に 書く）
alter table public.koen add column if not exists work_id uuid references public.works(id) on delete set null;
alter table public.koen add column if not exists work_title_at text;   -- ★そのときの 題名（作品を消しても 残る）

-- ② 作品から 下書きを作ったら、★使われた回数を 1つ増やす（★さがすの「よく使う順」の元）
create or replace function public.koen_set_work(p_koen uuid, p_work uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_title text;
begin
  if not public.koen_can_manage(p_koen) then raise exception 'NOT_STAFF'; end if;
  if p_work is null then
    update public.koen set work_id = null where id = p_koen;   -- ★外すのも できる
    return;
  end if;
  select w.title into v_title from public.works w where w.id = p_work;
  if v_title is null then raise exception 'NO_SUCH_WORK'; end if;
  update public.koen set work_id = p_work, work_title_at = v_title where id = p_koen;
  update public.works set used_count = coalesce(used_count,0) + 1 where id = p_work;
end $$;
revoke all on function public.koen_set_work(uuid, uuid) from public, anon;
grant execute on function public.koen_set_work(uuid, uuid) to authenticated;

-- ③ 本番の日は「本番の稽古」を 作る（★列を 足さない）
create or replace function public.koen_set_show_date(p_koen uuid, p_on date, p_at time default '18:00')
returns uuid language plpgsql security definer set search_path to 'public' as $$
declare v_id uuid;
begin
  if not public.koen_can_manage(p_koen) then raise exception 'NOT_STAFF'; end if;
  if p_on is null then raise exception 'NO_DATE'; end if;
  insert into public.koen_sessions(koen_id, kind, starts_at, place)
  values (p_koen, 'show', (p_on + coalesce(p_at,'18:00'::time)) at time zone 'Asia/Tokyo',
          (select k.venue from public.koen k where k.id = p_koen))
  returning id into v_id;
  return v_id;
end $$;
revoke all on function public.koen_set_show_date(uuid, date, time) from public, anon;
grant execute on function public.koen_set_show_date(uuid, date, time) to authenticated;

-- 確かめ（試しの環境で）
-- 作品を結ぶ → koen.work_id と work_title_at が 入る／works.used_count が 1増える
-- 作品を 消しても（is_public=false にしてから）→ ★work_title_at は 残る
-- 本番の日を 入れる → koen_sessions に kind='show' が 1行
--   → ★koen_compute_valid_until が その日＋30日 を 返す
-- 札の無い人 → NOT_STAFF
