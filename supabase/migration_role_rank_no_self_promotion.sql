-- ============================================================================
-- 役割は「自分より上」を書けない（2026-09-02・順位で見る）
--
--   ★いまの形でも、報告の場面は止まります
--     migration_fix_memberships_update_policy.sql の WITH CHECK：
--         role <> 'owner'
--         and (role <> 'admin' or public.is_org_owner_or_admin(auth.uid(), org_id))
--     講師が自分を admin にしようとすると、
--     is_org_owner_or_admin が偽なので★通りません。
--
--   ★それでも書き直す理由
--     この形は★役割の名前を並べて場合分けしています。
--     いま役割は3つ（owner / admin / teacher）で、
--     「上」に当たるのが owner と admin だけだから、たまたま塞がっています。
--     ★4つ目（たとえば teacher の上の役割）を足した日に、
--       その名前はどちらの条件にも当たらず、★誰でも自分に書けます。
--     憲章 §9 に書いたとおり、教室まわりで3回続けて起きた壊れ方が
--     「役割の名前で場合分けしていた」ことでした。
--
--   ★決めごと（順位で言い直す）
--     順位：owner(3) > admin(2) > teacher(1)、それ以外(0)
--     ① UPDATE で owner は誰も書けない（bootstrap だけ）
--     ② ★書ける役割は、自分がいま持っている順位まで
--        → 講師(1)は admin(2) を書けない。自分にも、他人にも。
--        → 責任者(2)は admin(2) までなら書ける。owner は①で止まる。
--        → 誰でも、自分の順位を★下げるのは通る。
--     ③ owner の行に触れるのは本人だけ（前のまま）
--
--   ★「自分の行か、他人の行か」で分けません。
--     分けると、また場合分けが増えます。
--     ★「持っている以上のものは渡せない」— これ1つで足ります。
--     自分に渡すのも、他人に渡すのも、同じ規則です。
--
--   ★何度実行しても同じ結果になります。行は1つも変えません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 順位
--     ★知らない役割は 0 です。★ただし「0 は最下位だから安全」ではありません。
--       0 <= どの順位 も真なので、★0 のままだと誰でも書けてしまいます。
--       （書いた直後に、自分の検査で見つけました）
--       だから条件のほうに「順位が 0 より大きいこと」を入れます。
--       ★知らない役割は、書けません。
-- ---------------------------------------------------------------------------
create or replace function public.org_role_rank(p_role text)
returns int
language sql
immutable
as $$
  select case p_role
           when 'owner'   then 3
           when 'admin'   then 2
           when 'teacher' then 1
           else 0
         end;
$$;

-- ---------------------------------------------------------------------------
-- ② 自分がいま持っている順位
--     ★SECURITY DEFINER なのは権限のためではなく、★無限再帰を避けるためです
--       （memberships のポリシーの中から memberships を読むため）。
-- ---------------------------------------------------------------------------
create or replace function public.my_org_role_rank(p_org_id uuid)
returns int
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(max(public.org_role_rank(m.role)), 0)
    from public.memberships m
   where m.org_id = p_org_id and m.user_id = auth.uid();
$$;
revoke all on function public.my_org_role_rank(uuid) from public, anon;
grant execute on function public.my_org_role_rank(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ③ 入れ替え
-- ---------------------------------------------------------------------------
drop policy if exists "memberships_restrict_owner_row_update" on public.memberships;
create policy "memberships_restrict_owner_row_update"
  on public.memberships
  as restrictive
  for update
  to authenticated
  using (
    -- ③ owner の行に触れるのは本人だけ（共同オーナー同士もここで止まる）
    role <> 'owner' or user_id = auth.uid()
  )
  with check (
    -- ① owner は UPDATE では誰も書けない
    role <> 'owner'
    -- ★知らない役割は書けない（0 <= どの順位 も真になるため、ここで弾く）
    and public.org_role_rank(role) > 0
    -- ② ★自分が持っている順位までしか書けない（自分にも、他人にも）
    and public.org_role_rank(role) <= public.my_org_role_rank(org_id)
  );

-- INSERT も同じ規則にします（bootstrap だけ例外）
drop policy if exists "memberships_restrict_role_insert" on public.memberships;
create policy "memberships_restrict_role_insert"
  on public.memberships
  as restrictive
  for insert
  to authenticated
  with check (
    (role <> 'owner'
     and public.org_role_rank(role) > 0
     and public.org_role_rank(role) <= public.my_org_role_rank(org_id))
    or (
      -- ★最初の1人だけ owner で入れる
      user_id = auth.uid()
      and role = 'owner'
      and exists (select 1 from public.organizations o
                   where o.id = org_id and o.created_by = auth.uid())
      and not exists (select 1 from public.memberships m where m.org_id = org_id)
    )
  );

-- ---------------------------------------------------------------------------
-- ④ 確かめ方（★ふつうの利用者のセッションで。すべて rollback します）
--
--   置き換え：<教室> <オーナー> <責任者> <講師> <別の講師>
-- ---------------------------------------------------------------------------

-- ④-1 ★講師が自分を責任者にする → 0行
-- begin;
-- select set_config('request.jwt.claims','{"sub":"<講師>","role":"authenticated"}', true);
-- set local role authenticated;
-- update public.memberships set role='admin'
--  where org_id='<教室>' and user_id=auth.uid()
-- returning id as "★0行であること";
-- rollback;

-- ④-2 ★講師が、別の講師を責任者にする → 0行
-- begin;
-- select set_config('request.jwt.claims','{"sub":"<講師>","role":"authenticated"}', true);
-- set local role authenticated;
-- update public.memberships set role='admin'
--  where org_id='<教室>' and user_id='<別の講師>'
-- returning id as "★0行であること";
-- rollback;

-- ④-3 ★責任者が自分を owner にする → 0行
-- begin;
-- select set_config('request.jwt.claims','{"sub":"<責任者>","role":"authenticated"}', true);
-- set local role authenticated;
-- update public.memberships set role='owner'
--  where org_id='<教室>' and user_id=auth.uid()
-- returning id as "★0行であること";
-- rollback;

-- ④-4 オーナーが講師を責任者にする → ★1行
-- begin;
-- select set_config('request.jwt.claims','{"sub":"<オーナー>","role":"authenticated"}', true);
-- set local role authenticated;
-- update public.memberships set role='admin'
--  where org_id='<教室>' and user_id='<講師>'
-- returning id as "★1行であること";
-- rollback;

-- ④-5 責任者が、別の講師を責任者にする → ★1行（同じ順位までは渡せる）
-- ④-6 責任者が自分を講師に下げる → ★1行
-- ④-7 オーナーが自分を講師に下げる → ★1行
