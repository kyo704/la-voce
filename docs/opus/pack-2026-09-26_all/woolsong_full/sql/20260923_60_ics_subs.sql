-- 20260923_60 ICS の購読の記録（P1・P3・P4／坂本さんの決定 2026-09-23）
-- 決めたこと:
--   ① ★ICS の購読を記録する（日付だけ・★中身は持たない・★履歴も持たない）
--   ② くばりものの配布数は ★数えない（印刷したかは こちらから分からない）
--   ③ 学生の登録率は ★やめる（分母と分子の区別が 台帳に無い）
-- ★持つのは「その人のフィードが 取りに来られた最後の日」だけ。
--   ★何回・どの端末・いつ何度は 持たない（見張りの材料にしない）
-- ★12 のあと

create table if not exists public.ics_subscriptions (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  org_id     uuid references public.organizations(id) on delete set null,
  last_seen  date not null,            -- ★日付だけ（時刻も回数も持たない）
  first_seen date not null
);
alter table public.ics_subscriptions enable row level security;
revoke all on public.ics_subscriptions from anon, authenticated;
grant select on public.ics_subscriptions to authenticated;
drop policy if exists ics_subscriptions_own on public.ics_subscriptions;
create policy ics_subscriptions_own on public.ics_subscriptions for select to authenticated
  using (user_id = auth.uid());     -- ★本人だけ。★先生・学校は 1人ずつは見られない
-- ★学校が見るのは「何人が繋いだか」の数だけ（org_monthly_stats 経由）

-- フィードが取りに来られたときに サーバが呼ぶ（★1日1回だけ書く）
create or replace function public.note_ics_seen(p_user uuid, p_org uuid default null)
returns void language plpgsql security definer set search_path to 'public' as $$
declare v_today date := (now() at time zone 'Asia/Tokyo')::date;
begin
  insert into public.ics_subscriptions(user_id, org_id, last_seen, first_seen)
  values (p_user, p_org, v_today, v_today)
  on conflict (user_id) do update
    set last_seen = v_today,
        org_id = coalesce(excluded.org_id, public.ics_subscriptions.org_id)
   where public.ics_subscriptions.last_seen <> v_today;   -- ★同じ日は書かない
end $$;
revoke all on function public.note_ics_seen(uuid, uuid) from public, anon, authenticated;
-- ★サーバだけ（画面からは呼べない）

-- 数えるだけの関数（P3・P4 が使う）
create or replace function public.ics_subs_count(p_org uuid, p_since date default null)
returns integer language sql stable security definer set search_path to 'public' as $$
  select count(*)::int from public.ics_subscriptions s
   where s.org_id = p_org
     and s.last_seen >= coalesce(p_since, (now() at time zone 'Asia/Tokyo')::date - 30);
$$;
revoke all on function public.ics_subs_count(uuid, date) from public, anon, authenticated;

-- 確かめ（試しの環境で）
-- note_ics_seen を同じ日に2回 → ★行は1つ・last_seen は同じ（★回数を持たない）
-- 翌日に呼ぶ → last_seen だけ変わる／first_seen は 最初の日のまま
-- 本人が読む → 自分の1行だけ／★ほかの人の行は0行
-- 画面から note_ics_seen を呼ぶ → 権限エラー
-- 退会 → ★行ごと消える
