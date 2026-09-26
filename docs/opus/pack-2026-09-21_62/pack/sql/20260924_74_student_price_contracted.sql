-- 20260924_74 学生価格は「★契約している学校の 名簿にいる学生」に限る（裁定180）
-- 見つけたもの（2026-09-24）:
--   student_price_eligible は ★「どこかの学校に 在籍していれば よい」形でした
--   → ★無料の枠（先生1人＋生徒5人まで）の 教室に 入れてもらうだけで ★半額に なります
--   ★先生の 知り合いに 1行 足してもらえば 誰でも 半額 ＝ ★抜け道です
--   裁定180 の ことばは「★契約している 学校の 名簿にいる学生」。★契約が 要ります
-- ★12・73 のあと
-- ★本番で 確かめた（2026-09-24）: org_contracts は 全列 not null ＋ paid_from = free_until+1
--   → 行が あること ＝ 契約している（導入期間中も 含む）

-- ① 学校が 契約しているか（★導入期間の 学校も「契約している」に 入れる）
create or replace function public.org_is_contracted(p_org uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  select exists (
    -- ㋐ ★契約の表に 行が あること ＝ 契約している
    --   （2026-09-24 に 本番で 確かめた: contract_start・free_until・paid_from・cycle は
    --    すべて not null で、★paid_from = free_until + 1 の 縛りも ある。
    --    ★つまり 行が ある時点で「契約した」ことが 決まっています。
    --    ★導入期間中（paid_from が 先）も 契約している に 入れます）
    select 1 from public.org_contracts c where c.org_id = p_org
  ) or exists (
    -- ㋑ 学校・教室の 買い切り（年払い）が 生きている
    select 1 from public.purchases p
     where p.status = 'active' and p.ends_at > now()
       and p.lookup_key in ('kyo_y','gakko_y')
       and p.user_id in (select m.user_id from public.memberships m
                          where m.org_id = p_org and m.role in ('owner','admin'))
  ) or exists (
    -- ㋒ 学校・教室の 月払いが 生きている
    select 1 from public.subscriptions s
     join public.subscription_items i on i.user_id = s.user_id
      and i.stripe_subscription_id = s.stripe_subscription_id and i.removed_at is null
    where s.status in ('active','trialing')
      and coalesce(s.current_period_end, s.period_end) > now()
      and i.lookup_key in ('kyo_m','gakko_m')
      and s.user_id in (select m.user_id from public.memberships m
                         where m.org_id = p_org and m.role in ('owner','admin'))
  );
$$;
revoke all on function public.org_is_contracted(uuid) from public, anon;
grant execute on function public.org_is_contracted(uuid) to authenticated;

-- ② 学生価格の 判定を 締める
create or replace function public._is_enrolled_somewhere(p_user uuid)
returns boolean language sql stable security definer set search_path to 'public' as $$
  -- ★「どこかの学校」ではなく「★契約している 学校」（裁定180・2026-09-24 に 締めた）
  select exists (
    select 1 from public.enrollments e
     where e.student_id = p_user and e.status = 'active'
       and public.org_is_contracted(e.org_id)
  );
$$;
revoke all on function public._is_enrolled_somewhere(uuid) from public, anon;
-- ★student_price_eligible は そのまま（同意 ＋ この関数）

-- ③ 運営が 見られるように（★いま 何人が 学生価格に 当たるか）
create or replace function public.student_price_count()
returns table(org_id uuid, org_name text, students integer)
language sql stable security definer set search_path to 'public' as $$
  select o.id, o.name, count(*)::int
    from public.enrollments e
    join public.organizations o on o.id = e.org_id
   where e.status = 'active' and public.org_is_contracted(e.org_id)
   group by o.id, o.name
   order by 3 desc;
$$;
revoke all on function public.student_price_count() from public, anon, authenticated;

-- 確かめ（試しの環境で）
-- 契約していない学校の 学生 → ★false（半額に ならない）
-- 導入期間（free_until が 先）の 学校の 学生 → ★true
-- 月払いが 生きている 学校の 学生 → true／止まった学校 → false
-- ★同意が 無い人 → false（いままでどおり）
-- ★卒業（status が active でない）→ false
