-- 20260923_54 share_scope の列を消す（裁定182 のB・Code の調べの結果を受けて）
-- Code の調べ（2026-09-23）:
--   画面は 1か所で ★選んではいる（書き出しの経路・自分の行だけ）が、
--   そのあと ★捨てている（sanitizeShareHistory が落とす）。書き込みは どこにも無い
--   → ★運ばれて 捨てられていた。RLS では 列を隠せないので、★選ばないようにするしかない
--   Code は 列の一覧から 外した（済）
-- 裁定138 の決まり:「shareScope は 権限で隠すのではなく ★列ごと消す」
--   → 個人どうしのつながり（teacher_student_links）にも 同じ決まりを 当てる
-- ★49 のあと。★Code が 列の一覧から外した版を 配ってから 当てる
-- ★坂本さんの承認（2026-09-23）: ㋐（sql/49 のポリシーを先に落としてから 列を消す）
--
-- ★本番の中身を見た（2026-09-23 Opus）:
--   11行すべてに 値が入っている。形は {"body":false,"meal":false,"notes":false,"sleep":true,…}
--   ＝ ★生徒が「何を見せるか」を選んだ記録（実際に選んだ人がいる）
--   ★ただし この選択は 一度も効いていない（読むポリシーも関数も0本。画面は選んで捨てていた）
--   → ★消してよい、と判断する理由:
--     ① いまの決まりは「★先生は生徒の記録を見られない」。この選択を 生かす道は もう無い
--     ② 効いていない選択を 残すと、★「見せる設定がある」と誤解させる（見せられると思わせる）
--     ③ 個人の選択の記録を、使わないのに 持ち続けない（持つものを減らす）
--   ★消すと 戻せません。当てる前に 坂本さんに1度 伝えること（下の⓪）

-- ⓪ ★消える中身を、形だけ 記録に残す（値は残さない）
-- ★本番で確かめた列: action・target_kind は必須、detail は jsonb（note・target という列は無い）
-- ★何度当ててもよい形にする（Code の指摘 2026-09-23）:
--   列を消したあとに もう一度当てると、share_scope が無くて 42703 で落ちていた
do $$
declare v_rows integer := 0;
begin
  if exists (select 1 from information_schema.columns
              where table_schema='public' and table_name='teacher_student_links'
                and column_name='share_scope') then
    execute 'select count(*) from public.teacher_student_links where share_scope is not null'
      into v_rows;
    insert into public.ops_audit_log(actor_id, action, target_kind, detail)
    values (null, 'share_scope_dropped', 'teacher_student_links',
            jsonb_build_object('rows', v_rows,
              'why','一度も効いていない共有の設定を 列ごと消した（裁定138／182）',
              'note','値は残さない'));
  end if;   -- ★列がもう無ければ 何もしない（2回目以降）
end $$;

-- ② ★順番が大事（2026-09-23 に 試しの環境で確かめた）
--    sql/49 で作ったポリシーは with_check の中で share_scope を見ている。
--    ★ポリシーが列に依りかかっていると、DROP COLUMN は止まる（実際に止まることを確かめた）
--    → ★先にポリシーを落としてから 列を消す（坂本さんの承認：㋐）
drop policy if exists teacher_student_links_revoke_by_teacher on public.teacher_student_links;

-- ★② のあとに 確かめる（★Code の指摘 2026-09-23）:
--   私は 確かめを ポリシーを落とす ★前 に置いていた。
--   → まだ立っている sql/49 のポリシーに 引っかかり、★列を消す前に止まる
--   ★Code が 試しの台帳を sql/49 の直後まで巻き戻して 確かめて 見つけてくれた
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public'
              and (coalesce(qual,'')||coalesce(with_check,'')) like '%share_scope%') then
    raise exception 'STILL_USED_IN_POLICY: まだ share_scope を見ているポリシーがあります';
  end if;
end $$;

-- ③ 列を消す
alter table public.teacher_student_links drop column if exists share_scope;

-- ④ 先生の「つながりを切る」だけの道を 作り直す（★列が無い形）
create policy teacher_student_links_revoke_by_teacher on public.teacher_student_links
  for update to authenticated
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);
-- ★身元（先生・生徒）が変わらないことは 引き金（assert_link_identity_unchanged）が見ている
-- ★列が無くなったので、「先生が生徒の共有を書き換える」形そのものが 台帳から消える

-- 確かめ（試しの環境で）
-- ★ポリシーを落とさずに 列を消そうとすると 止まる（試しの環境で確認済み）
-- 列が消えている（information_schema に share_scope が無い）
-- つながりの一覧・書き出しが いままでどおり動く（★画面が選んでいないこと が前提）
-- 先生が つながりを切る → 通る／生徒が切る → 通る
-- 身元を変える → LINK_IDENTITY_IMMUTABLE
-- ★本番の11行にあった中身は、この操作で 消えます（戻せません）
--   → 当てる前に、★その11行が要るかを 坂本さんに1度確かめること（使っていないので 不要の見込み）
