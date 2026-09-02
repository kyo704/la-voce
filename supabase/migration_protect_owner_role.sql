-- ============================================================================
-- オーナーの役割を、他人が触れないようにする（2026-09-02・G4 ゲート #14）
--
--   ★私はまだ memberships のポリシー本文を見ていません。
--     supabase/check_admin_can_demote_owner.sql は、まだ実行されていません。
--     ですから「いま穴が開いている」ことは★確認できていません。
--     確認できているのは画面の側だけです（役割の選択欄がオーナーの行にも出る、
--     handleChangeRole は「最後のオーナー」しか守っていない）。
--
--   ★だからこのファイルは、既存のポリシーを1本も消しません。
--     消すには本文を読む必要があり、読まずに消すと教室が動かなくなります。
--     代わりに★RESTRICTIVE のポリシーを足します。
--
--   ★なぜ RESTRICTIVE なのか（ここが肝心です）
--     PERMISSIVE のポリシーは★OR で足し合わされます。
--     ですから、いくら足しても★何も禁止できません。
--     今日 lessons で見た穴は、まさにこれでした。
--     RESTRICTIVE は★AND で結ばれます。既存のポリシーが何を許していても、
--     ★こちらが許さないものは通りません。
--     → 本文を知らないまま、安全に締められる唯一の方法です。
--
--   ★service_role には効きません（RLS を素通りします）。
--     教室を閉じる処理・退会の処理は管理者クライアントなので、影響しません。
--
--   ★決めごと（4つ）
--     ① オーナーの行を変えられるのは、★本人だけ。
--        他のオーナーでも、責任者でも、触れません。
--        （★共同オーナーが互いを降格し合う経路を塞ぎます）
--     ② owner / admin を★書き込めるのは、その教室のオーナーだけ。
--        責任者も講師も、自分にも他人にも書けません。
--     ③ オーナーが自分で降りるのは可。★自分の行のときだけ。
--     ④ 譲渡の仕組みは作りません。1人のオーナーが抜けたいときは、
--        いまある「教室を閉じる」を使います。
--
--   ★何度実行しても同じ結果になります。行は1つも変えません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 実行前の状態（★記録として残してください）
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", permissive as "種別",
       qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'memberships'
 order by permissive, cmd, policyname;

-- ---------------------------------------------------------------------------
-- ② 補助：その人が、その教室のオーナーか
--
--   ★is_org_owner_or_admin は使いません。あれは「オーナー★または責任者」で、
--     いま分けたいのは、まさにその2つだからです。
--
--   ★SECURITY DEFINER にしている理由は、権限を借りるためではありません。
--     memberships のポリシーの中から memberships を読むので、
--     ふつうに書くと★ポリシーが自分を呼び続けます（無限再帰）。
--     定義者の権限で走らせると、その問い合わせには RLS が掛かりません。
--     既存の can_view_ops / is_org_owner_or_admin と同じ作りです。
-- ---------------------------------------------------------------------------
create or replace function public.is_org_owner(p_user_id uuid, p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.memberships m
     where m.org_id = p_org_id
       and m.user_id = p_user_id
       and m.role = 'owner'
  );
$$;
revoke all on function public.is_org_owner(uuid, uuid) from public, anon;
grant execute on function public.is_org_owner(uuid, uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ③ UPDATE：オーナーの行は本人だけ／owner・admin を書けるのはオーナーだけ
--
--   ★USING は「変える前の行」に、WITH CHECK は「変えたあとの行」に効きます。
--     ①は変える前を見るので USING、②は変えたあとを見るので WITH CHECK です。
-- ---------------------------------------------------------------------------
drop policy if exists "memberships_restrict_owner_row_update" on public.memberships;
create policy "memberships_restrict_owner_row_update"
  on public.memberships
  as restrictive
  for update
  to authenticated
  using (
    -- ① 変える前の行が owner なら、★本人でなければ触れない
    role <> 'owner' or user_id = auth.uid()
  )
  with check (
    -- ② owner / admin を書き込むなら、★その教室のオーナーであること
    role not in ('owner', 'admin')
    or public.is_org_owner(auth.uid(), org_id)
  );

-- ---------------------------------------------------------------------------
-- ④ DELETE：オーナーの行を消せるのは本人だけ
--
--   ★消すことも「触る」ことです。降格を塞いで削除を空けると、
--     消してから入れ直す、という同じ結果への回り道が残ります。
-- ---------------------------------------------------------------------------
drop policy if exists "memberships_restrict_owner_row_delete" on public.memberships;
create policy "memberships_restrict_owner_row_delete"
  on public.memberships
  as restrictive
  for delete
  to authenticated
  using (
    role <> 'owner' or user_id = auth.uid()
  );

-- ---------------------------------------------------------------------------
-- ⑤ INSERT：owner / admin として入れられるのはオーナーだけ
--
--   ★ただし、最初の1人（教室を作った本人）だけは通します。
--     ここを塞ぐと、★誰も教室を作れなくなります。
--     条件は既存の memberships_insert_bootstrap_owner と同じものを書きます。
--     （RESTRICTIVE なので、既存の PERMISSIVE と AND で結ばれます）
-- ---------------------------------------------------------------------------
drop policy if exists "memberships_restrict_role_insert" on public.memberships;
create policy "memberships_restrict_role_insert"
  on public.memberships
  as restrictive
  for insert
  to authenticated
  with check (
    role not in ('owner', 'admin')
    or public.is_org_owner(auth.uid(), org_id)
    or (
      -- ★最初の1人（bootstrap）。自分自身・owner・自分が作った教室・まだ誰も居ない
      user_id = auth.uid()
      and role = 'owner'
      and exists (select 1 from public.organizations o
                   where o.id = org_id and o.created_by = auth.uid())
      and not exists (select 1 from public.memberships m where m.org_id = org_id)
    )
  );

-- ---------------------------------------------------------------------------
-- ⑥ 入ったことの確認
-- ---------------------------------------------------------------------------
select policyname as "足したポリシー", cmd as "操作", permissive as "種別"
  from pg_policies
 where schemaname = 'public' and tablename = 'memberships'
   and permissive = 'RESTRICTIVE'
 order by cmd;
-- ★3行（INSERT / UPDATE / DELETE）返ること。
