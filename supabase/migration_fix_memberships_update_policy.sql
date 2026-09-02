-- ============================================================================
-- 役割の変更を、正しく通す／正しく止める（2026-09-02・G4 #14 の続き）
--
--   ★止めているのは、私が入れたポリシーではありません
--     私が用意した3本は RESTRICTIVE です。RESTRICTIVE は★AND で結ばれます。
--     ですから★何かを新たに「許す」ことはできません。減らすだけです。
--     しかも私の WITH CHECK には、こう書いてあります。
--         role not in ('owner','admin') or public.is_org_owner(auth.uid(), org_id)
--     ★オーナーが講師を「教室の責任者」にするのは、通ります。
--
--   ★止めているのは memberships_update_self_only です
--     この名前は★リポジトリのどこにもありません。本番に手で当てられたものです。
--     名前のとおり「自分の行だけ」なら、次の2つが同時に説明できます。
--       ・責任者がオーナーを降格できなかった（＝攻撃が止まった、ように見えた）
--       ・オーナーが責任者を任命できない（＝今回の不具合）
--     ★1本のポリシーで、両方が起きています。
--     つまり権限の昇格は、そもそも★DB では起きていなかった可能性が高いです。
--     危なかったのは画面だけ、ということになります。
--
--   ★大事なこと：足しても直りません
--     いま効きすぎているのは PERMISSIVE のほうです。
--     PERMISSIVE は OR で足されるので、★もう1本足せば緩められますが、
--     それでは「自分の行だけ」の意図も一緒に消えます。
--     ですから★この1本を置き換えます。消す前に、①で本文を控えてください。
--
--   ★守る形（Opus の裁定）
--     ① role = 'owner' の行に触れるのは、★その本人だけ
--        （他のオーナーも、責任者も、触れない）
--     ② オーナー・責任者は、owner でない人どうしの役割を変えてよい
--        （講師 ↔ 教室の責任者）
--     ③ ★UPDATE で role = 'owner' を書くことは、誰にもできない
--        オーナーになる道は、教室を作るとき（bootstrap）だけ
--     ④ 譲渡の仕組みは作らない
--
--   ★③の副作用（承知の上）
--     オーナーの行に、もう一度「オーナー」を選ぶ操作は★失敗します。
--     値が変わらない更新でも、WITH CHECK は新しい行を見るためです。
--     実害は「押しても何も起きない」ことで、権限は動きません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① ★消す前に、本文を控えてください（リポジトリに無いものです）
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", permissive as "種別",
       roles as "対象", qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'memberships'
 order by permissive, cmd, policyname;

-- ---------------------------------------------------------------------------
-- ② 許すほう（PERMISSIVE）を置き換える
--
--   ★自分の行 か、その教室のオーナー・責任者であること。
--     ここは「誰が触れてよいか」だけを決めます。
--     「何を書いてよいか」は、③の RESTRICTIVE が決めます。
--     ★2つを1本に混ぜないこと。混ぜると、どちらを直しているのか
--       分からなくなります（今日それで2回まわりました）。
-- ---------------------------------------------------------------------------
drop policy if exists "memberships_update_self_only" on public.memberships;

drop policy if exists "memberships_update_allowed" on public.memberships;
create policy "memberships_update_allowed"
  on public.memberships
  for update
  to authenticated
  using (
    user_id = auth.uid()
    or public.is_org_owner_or_admin(auth.uid(), org_id)
  );

-- ---------------------------------------------------------------------------
-- ③ 止めるほう（RESTRICTIVE）を、③の規則に合わせて入れ直す
--
--   ★前の版との違いは1か所だけです。
--       前： role not in ('owner','admin') or is_org_owner(...)
--       今： role <> 'owner'  かつ  admin を書くならオーナーか責任者
--     ★UPDATE で owner を書く道を、完全に閉じました。
-- ---------------------------------------------------------------------------
drop policy if exists "memberships_restrict_owner_row_update" on public.memberships;
create policy "memberships_restrict_owner_row_update"
  on public.memberships
  as restrictive
  for update
  to authenticated
  using (
    -- ① 変える前の行が owner なら、★本人でなければ触れない
    --    ★共同オーナー同士も、ここで止まります（役割ではなく user_id で見る）
    role <> 'owner' or user_id = auth.uid()
  )
  with check (
    -- ③ ★owner は、UPDATE では誰も書けない
    role <> 'owner'
    -- ② admin を書けるのは、オーナーか責任者だけ
    and (role <> 'admin' or public.is_org_owner_or_admin(auth.uid(), org_id))
  );

-- ---------------------------------------------------------------------------
-- ④ INSERT も、③に合わせます
--
--   ★オーナーが2人目のオーナーを足す道も閉じます（譲渡を作らないため）。
--     残すのは bootstrap（教室を作った最初の1人）だけです。
--   ★サーバ側の処理（招待の受け入れ・教室を閉じる・退会）は
--     service_role なので、RLS を素通りします。影響しません。
-- ---------------------------------------------------------------------------
drop policy if exists "memberships_restrict_role_insert" on public.memberships;
create policy "memberships_restrict_role_insert"
  on public.memberships
  as restrictive
  for insert
  to authenticated
  with check (
    (role <> 'owner' and (role <> 'admin' or public.is_org_owner_or_admin(auth.uid(), org_id)))
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
-- ⑤ DELETE はそのままです（オーナーの行を消せるのは本人だけ）
--     ★既に入っていれば、何も変わりません。
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
-- ⑥ 入ったことの確認
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", permissive as "種別"
  from pg_policies
 where schemaname = 'public' and tablename = 'memberships'
 order by permissive, cmd, policyname;
-- ★memberships_update_self_only が★消えていること。
-- ★RESTRICTIVE が3本（insert / update / delete）あること。
