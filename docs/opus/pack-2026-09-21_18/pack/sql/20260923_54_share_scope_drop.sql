-- 20260923_54 share_scope の列を消す（裁定182 のB・Code の調べの結果を受けて）
-- Code の調べ（2026-09-23）:
--   画面は 1か所で ★選んではいる（書き出しの経路・自分の行だけ）が、
--   そのあと ★捨てている（sanitizeShareHistory が落とす）。書き込みは どこにも無い
--   → ★運ばれて 捨てられていた。RLS では 列を隠せないので、★選ばないようにするしかない
--   Code は 列の一覧から 外した（済）
-- 裁定138 の決まり:「shareScope は 権限で隠すのではなく ★列ごと消す」
--   → 個人どうしのつながり（teacher_student_links）にも 同じ決まりを 当てる
-- ★49 のあと。★Code が 列の一覧から外した版を 配ってから 当てる
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
insert into public.ops_audit_log(actor_id, action, target_kind, detail)
select null, 'share_scope_dropped', 'teacher_student_links',
       jsonb_build_object(
         'rows', count(*),
         'why', '一度も効いていない共有の設定を 列ごと消した（裁定138／182）',
         'note', '値は残さない')
  from public.teacher_student_links
 where share_scope is not null;

-- ① 念のため: 画面がまだ選んでいたら 当てたあとに落ちる。★先に確かめる
do $$
begin
  if exists (select 1 from pg_policies where schemaname='public'
              and (coalesce(qual,'')||coalesce(with_check,'')) like '%share_scope%') then
    raise exception 'STILL_USED_IN_POLICY: ポリシーが share_scope を見ています。先にそちらを直してください';
  end if;
end $$;

-- ② 先生からは触れない形（sql/49）を 保ったまま、★列を消す
--    → 消えれば「先生が書き換えられる」形そのものが 台帳から無くなる
alter table public.teacher_student_links drop column if exists share_scope;

-- ③ 49 で作った「先生は share_scope を変えない更新だけ通す」ポリシーを、列が無い形に作り直す
drop policy if exists teacher_student_links_revoke_by_teacher on public.teacher_student_links;
create policy teacher_student_links_revoke_by_teacher on public.teacher_student_links
  for update to authenticated
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);
-- ★身元（先生・生徒）が変わらないことは 引き金（assert_link_identity_unchanged）が見ている

-- 確かめ（試しの環境で）
-- 列が消えている（information_schema に share_scope が無い）
-- つながりの一覧・書き出しが いままでどおり動く（★画面が選んでいないこと が前提）
-- 先生が つながりを切る → 通る／生徒が切る → 通る
-- 身元を変える → LINK_IDENTITY_IMMUTABLE
-- ★本番の11行にあった中身は、この操作で 消えます（戻せません）
--   → 当てる前に、★その11行が要るかを 坂本さんに1度確かめること（使っていないので 不要の見込み）
