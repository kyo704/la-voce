-- ============================================================================
-- 教室（organizations）を、アプリから作れるようにする
--
--   ★2026-09-01 に判明。organizations には SELECT のポリシーしか無く、
--     INSERT のポリシーが1つもありませんでした。
--     RLS が有効な表に INSERT ポリシーが無いと、service_role 以外からの
--     INSERT は★すべて拒否されます（42501）。
--
--   ★つまり、アプリから教室が作られたことは一度もありません。
--     いまある1行は、SQL エディタ（postgres ロール＝RLS を迂回）で
--     作られたものです。
--
--   ★これは試験用アカウント固有の問題ではありません。
--     teacher_beta_access を付けた★すべての先生が、招待コードを
--     1つも発行できません（発行の前に ensureOwnOrg() が走るため）。
--
--   ★鶏と卵：memberships の既存ポリシーは
--       WITH CHECK is_org_owner_or_admin(auth.uid(), org_id)
--     ですが、できたばかりの教室には membership が1行も無いので、
--     この条件は★決して真になりません。最初の1行だけ、別の道が要ります。
--
--   ★何度実行しても同じ結果になります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 実行前の確認（★INSERT のポリシーが無いことを、記録として残す）
-- ---------------------------------------------------------------------------
select tablename as "テーブル", policyname as "ポリシー", cmd as "操作"
  from pg_policies
 where schemaname = 'public' and tablename in ('organizations', 'memberships')
 order by tablename, cmd, policyname;

-- ---------------------------------------------------------------------------
-- ② 教室を作れるようにする
--
--   ★条件は「自分を作成者として作ること」だけです。
--     ログインしている人が、自分の名前で教室を作る。それ以外は作れません。
--
--   ★他人を created_by にした行は作れません（なりすまし防止）。
--   ★UPDATE と DELETE のポリシーは作りません。
--     教室の名前を変える／消す仕組みは、まだ作っていないためです。
--     必要になったときに、そのとき考えて足します。
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'organizations'
                   and policyname = 'organizations_insert_own') then
    create policy "organizations_insert_own"
      on public.organizations for insert
      to authenticated
      with check (auth.uid() = created_by);
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ③ 最初の1人（作成者＝オーナー）だけを通す道
--
--   ★既存の memberships_all_owner_admin は残します。2人目以降は
--     これまでどおり、オーナーか責任者だけが足せます。
--
--   ★この道は、次の3つを全部満たすときだけ開きます。
--       ・足すのが★自分自身であること
--       ・役割が★owner であること
--       ・その教室を★自分が作ったこと
--       ・その教室に★まだ誰も居ないこと
--     最後の条件が「最初の1行だけ」を保証します。
--     いちど誰かが入った教室に、この道からは入れません。
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (select 1 from pg_policies
                 where schemaname = 'public' and tablename = 'memberships'
                   and policyname = 'memberships_insert_bootstrap_owner') then
    create policy "memberships_insert_bootstrap_owner"
      on public.memberships for insert
      to authenticated
      with check (
        user_id = auth.uid()
        and role = 'owner'
        and exists (
          select 1 from public.organizations o
           where o.id = org_id
             and o.created_by = auth.uid()
        )
        and not exists (
          select 1 from public.memberships m
           where m.org_id = org_id
        )
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- ④ 確認（★INSERT のポリシーが両方に付いたこと）
-- ---------------------------------------------------------------------------
select tablename as "テーブル", policyname as "ポリシー", cmd as "操作",
       with_check as "書ける条件"
  from pg_policies
 where schemaname = 'public' and tablename in ('organizations', 'memberships')
   and cmd in ('INSERT', 'ALL')
 order by tablename, policyname;
