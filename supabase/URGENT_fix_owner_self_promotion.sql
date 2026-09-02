-- ============================================================================
-- ★緊急｜責任者が自分を owner にできた（2026-09-02）
--
--   ★確認された事実（坂本さんの直接照会）
--     教室 199704ee-4ff8-49a3-8f50-c51b77dcd336 で、
--     +g4t2 と +g4t3 の★両方が role='owner' になっている。
--     +g4t2 は降格されておらず、+g4t3 が★自分を owner に上げた。
--
--   ★原因は「ポリシーの設計」ではなく「入っていないこと」です
--     本番で効いているのは memberships_update_role_management で、
--     ★この名前はリポジトリのどこにもありません。手で当てられたものです。
--     その WITH CHECK は、報告どおりなら次の形です。
--         (role = 'owner' AND auth.uid() = user_id) OR (role <> 'owner')
--     ★「前が何だったか」を見ていないので、
--       ・オーナーが自分の行を owner のままにする      → 通る（正しい）
--       ・★責任者が自分の行を owner に書き換える      → ★通る（穴）
--       この2つが、同じ条件で通ります。読み方は、ご指摘のとおりです。
--
--   ★私が用意した migration_fix_memberships_update_policy.sql は、
--     この形では★ありません。WITH CHECK はこうです。
--         role <> 'owner'
--         and (role <> 'admin' or public.is_org_owner_or_admin(auth.uid(), org_id))
--     ★role <> 'owner' が AND の直下にあります。
--       UPDATE で owner を書く道は、★誰にも、自分にも、ありません。
--
--   ★そして RESTRICTIVE は AND で結ばれます。
--     もし私の3本が入っていれば、ほかのポリシーが何を許していても
--     ★この昇格は通りません。通ったということは、
--     ★migration_fix_memberships_update_policy.sql が入っていない、
--     ということです。設計の失敗ではなく、★未適用です。
--
--   ★手順は ①→②→③→④ の順に。②で穴を塞いでから、③で直します。
--     先に直すと、塞ぐ前にもう一度やられます。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① いま本番に何が入っているか（★これを控えてください）
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", permissive as "種別",
       qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'memberships'
 order by permissive, cmd, policyname;

-- ★私の3本が入っているか（0行なら、未適用が確定です）
select count(*) as "★私の RESTRICTIVE（3であること）"
  from pg_policies
 where schemaname = 'public' and tablename = 'memberships'
   and policyname in ('memberships_restrict_owner_row_update',
                      'memberships_restrict_owner_row_delete',
                      'memberships_restrict_role_insert');

-- ---------------------------------------------------------------------------
-- ② 穴を塞ぐ（★先にこれをやります）
--
--   ★手で当てられたほうを外し、許すほう／止めるほうを分けて入れ直します。
--     PERMISSIVE は OR で足されるので、残すと★足し算で通ってしまいます。
-- ---------------------------------------------------------------------------
drop policy if exists "memberships_update_role_management" on public.memberships;
drop policy if exists "memberships_update_self_only" on public.memberships;

-- 補助関数（無ければ作る）
create or replace function public.is_org_owner(p_user_id uuid, p_org_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.memberships m
                  where m.org_id = p_org_id and m.user_id = p_user_id and m.role = 'owner');
$$;
revoke all on function public.is_org_owner(uuid, uuid) from public, anon;
grant execute on function public.is_org_owner(uuid, uuid) to authenticated;

-- 許すほう：自分の行か、その教室のオーナー・責任者
drop policy if exists "memberships_update_allowed" on public.memberships;
create policy "memberships_update_allowed"
  on public.memberships for update to authenticated
  using (
    user_id = auth.uid()
    or public.is_org_owner_or_admin(auth.uid(), org_id)
  );

-- ★止めるほう：owner は UPDATE では誰も書けない
drop policy if exists "memberships_restrict_owner_row_update" on public.memberships;
create policy "memberships_restrict_owner_row_update"
  on public.memberships as restrictive for update to authenticated
  using (
    role <> 'owner' or user_id = auth.uid()
  )
  with check (
    role <> 'owner'
    and (role <> 'admin' or public.is_org_owner_or_admin(auth.uid(), org_id))
  );

drop policy if exists "memberships_restrict_owner_row_delete" on public.memberships;
create policy "memberships_restrict_owner_row_delete"
  on public.memberships as restrictive for delete to authenticated
  using (role <> 'owner' or user_id = auth.uid());

drop policy if exists "memberships_restrict_role_insert" on public.memberships;
create policy "memberships_restrict_role_insert"
  on public.memberships as restrictive for insert to authenticated
  with check (
    (role <> 'owner' and (role <> 'admin' or public.is_org_owner_or_admin(auth.uid(), org_id)))
    or (
      user_id = auth.uid()
      and role = 'owner'
      and exists (select 1 from public.organizations o
                   where o.id = org_id and o.created_by = auth.uid())
      and not exists (select 1 from public.memberships m where m.org_id = org_id)
    )
  );

-- ---------------------------------------------------------------------------
-- ③ 壊れた状態を直す
--
--   ★どの教室が壊れているかを、先に全部見ます。
--     1件だけとは限りません。
-- ---------------------------------------------------------------------------
select o.id as "教室", o.name as "名前", o.created_by as "作った人",
       count(*) as "★オーナーの数"
  from public.organizations o
  join public.memberships m on m.org_id = o.id and m.role = 'owner'
 group by o.id, o.name, o.created_by
having count(*) > 1
 order by count(*) desc;

-- ★誰が本来のオーナーかを見ます（created_by と突き合わせる）
select m.user_id as "誰", u.email as "メール", m.role as "役割",
       (m.user_id = o.created_by) as "★教室を作った人か",
       m.created_at as "入った日時"
  from public.memberships m
  join public.organizations o on o.id = m.org_id
  left join auth.users u on u.id = m.user_id
 where m.org_id = '199704ee-4ff8-49a3-8f50-c51b77dcd336'
 order by m.role, m.created_at;

-- ★戻します。「教室を作った人ではないオーナー」を responsable（admin）に。
--   ★created_by の人は触りません。
--   ★1つの教室に、そのまま当てます。②で塞いだあとに実行してください。
update public.memberships m
   set role = 'admin'
  from public.organizations o
 where o.id = m.org_id
   and m.org_id = '199704ee-4ff8-49a3-8f50-c51b77dcd336'
   and m.role = 'owner'
   and m.user_id <> o.created_by;

-- ★ほかの教室も同じ形なら、上の where から org_id の行を外して実行します。
--   ★created_by が null の教室は、誰が本来かが分かりません。
--     その場合は当てないでください（下で0行であることを確かめます）。
select count(*) as "★created_by が null で、オーナーが2人以上の教室（0であること）"
  from public.organizations o
 where o.created_by is null
   and (select count(*) from public.memberships m
         where m.org_id = o.id and m.role = 'owner') > 1;

-- ---------------------------------------------------------------------------
-- ④ 直ったことを確かめる
-- ---------------------------------------------------------------------------
select count(*) as "★オーナーが2人以上の教室（0であること）"
  from (select m.org_id from public.memberships m
         where m.role = 'owner' group by m.org_id having count(*) > 1) x;

select policyname as "ポリシー", cmd as "操作", permissive as "種別"
  from pg_policies
 where schemaname = 'public' and tablename = 'memberships'
 order by permissive, cmd;
-- ★RESTRICTIVE が3本あること。
-- ★memberships_update_role_management が消えていること。

-- ---------------------------------------------------------------------------
-- ⑤ ★実地でもう一度（+g4t3 のセッション）
-- ---------------------------------------------------------------------------
begin;
select set_config('request.jwt.claims',
  '{"sub":"<+g4t3 の uuid>","role":"authenticated"}', true);
set local role authenticated;
select auth.uid() as "★+g4t3 になっているか";

update public.memberships set role = 'owner'
 where org_id = '199704ee-4ff8-49a3-8f50-c51b77dcd336' and user_id = auth.uid()
returning id as "★自分を owner にできてしまった行（0行であること）", role;
rollback;
