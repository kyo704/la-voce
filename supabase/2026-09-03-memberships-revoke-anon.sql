-- ============================================================================
-- memberships：anon から書く権限を剥がす（2026-09-03）
--
--   ★見つかったこと（運営者の照会）
--     memberships の★列ごとの UPDATE 権限に、★role が入っており、
--     ★それが anon にも出ていました。
--
--   ★いま止めているのは、ポリシーだけです。
--     ★ポリシーは4本とも `to authenticated` で書かれています
--       （supabase/URGENT_fix_owner_self_promotion.sql）。
--     ★役割を名指ししたポリシーは、anon には当たりません。
--     ★当たるポリシーが1本も無ければ、RLS は既定で拒みます。
--     ★★つまり、いまは「拒まれているはず」です。
--
--   ★★ですが、それは板が1枚だということです。
--     ★2026-09-04 の決まり
--       「ポリシーの不在は1枚の板。権限の剥奪と合わせて2枚にすること。」
--     ★#005 では、★リポジトリに無いポリシーが本番に在りました
--       （memberships_update_role_management）。
--     ★同じことがまた起きたとき、★権限が残っていれば通ります。
--
--   ★anon は、ログインしていない人です。
--     ★この表に書く用が、1つもありません。
--     ★読む用もありません。
--
--   ★★authenticated からは剥がしません。
--     ★教室のオーナー・責任者が、役割を変えます
--       （VocalTracker.jsx:10377 handleChangeRole）。
--     ★止めているのは RESTRICTIVE のポリシーです。★そちらは別に確かめます。
--
--   ★何度実行しても同じ結果になります。★行には一切触れません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ⓪ 実行前の記録
-- ---------------------------------------------------------------------------
select grantee as "相手", privilege_type as "権限",
       coalesce(column_name, '（表ぜんぶ）') as "列"
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'memberships'
   and grantee in ('anon','authenticated')
union all
select grantee, privilege_type, '（表ぜんぶ）'
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'memberships'
   and grantee in ('anon','authenticated')
 order by 1, 2, 3;

-- ---------------------------------------------------------------------------
-- ① anon から、すべて剥がします
--   ★列ごとの権限も、まとめて落ちます。
-- ---------------------------------------------------------------------------
revoke all on public.memberships from anon;

-- ---------------------------------------------------------------------------
-- ② authenticated から、要らないものだけ剥がします
--   ★TRUNCATE は RLS が効きません。1文で表が空になります。
--   ★TRIGGER と REFERENCES は、アプリが使いません。
--   ★★UPDATE と SELECT と INSERT と DELETE は、剥がしません。
--     ★アプリが使っています。★止めるのはポリシーの役目です。
-- ---------------------------------------------------------------------------
revoke truncate, trigger, references on public.memberships from authenticated;

-- ---------------------------------------------------------------------------
-- ③ 確かめ
-- ---------------------------------------------------------------------------

-- ③-1 ★anon に、何も残っていないこと（0行）
select grantee as "★anon にまだ残っている権限", privilege_type, column_name
  from information_schema.column_privileges
 where table_schema = 'public' and table_name = 'memberships' and grantee = 'anon'
union all
select grantee, privilege_type, null
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'memberships' and grantee = 'anon';

-- ③-2 ★RLS が有効であること（true であること）
select relname as "表", relrowsecurity as "★RLS が有効か",
       relforcerowsecurity as "所有者にも効くか"
  from pg_class
 where oid = 'public.memberships'::regclass;

-- ③-3 ★ポリシーの本文（★名前ではなく、条件を読んでください）
--   ★見るところ
--     ・roles の欄に ★{public} や ★{anon} が入っていないか
--       （★入っていれば、ログインしていない人にも当たります）
--     ・permissive が ★PERMISSIVE のものは OR で足されます
--       ★止めるほうは、必ず ★RESTRICTIVE であること
--     ・★with_check が空の UPDATE が無いか
--       （for update で with_check が空なら、using が検査にも使われます。
--         ★それでよい場合もありますが、意図してそうしたのか確かめること）
select policyname as "ポリシー", cmd as "操作", permissive as "種類",
       roles as "誰に", qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'memberships'
 order by permissive desc, cmd, policyname;

-- ---------------------------------------------------------------------------
-- ④ ★実地の確かめ（★これが本当の答えです）
--
--   ★講師の役の人になりすまして、自分を admin にできないことを見ます。
--   ★service_role では RLS を素通りするので、確かめになりません。
--
--   begin;
--     -- ★先に claims、それから role の順です。逆だと効きません。
--     select set_config('request.jwt.claims',
--       json_build_object('sub', '★講師の役の人の uuid', 'role', 'authenticated')::text, true);
--     set local role authenticated;
--
--     update public.memberships set role = 'admin'
--      where user_id = '★同じ uuid' returning id, role;
--     -- ★0行であること。★1行返ったら、★穴です。
--   rollback;
--
--   ★★begin/rollback は、この編集画面では守りになりません。
--     ★1文ずつ確定します。★0行が返ることを見たら、それで終わりです。
--     ★1行返ってしまった場合は、★すぐに元の役割へ戻してください。
-- ---------------------------------------------------------------------------
