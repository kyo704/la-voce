-- ★★★Opus の sql/54 を、★順番だけ 入れ替えた もの（★2026-09-23・坂本さんの ご承認 ㋐）。
--
--   ★★もとの 順 …… ⓪記録 → ①確かめ → ②列を 消す → ③決まりを 作り直す
--     ★★①の 確かめは「★どの 決まりも share_scope を 見て いない こと」です。
--       ★★ところが その とき、★**sql/49 の 決まりが まだ 見て います**。
--       ★★★だから いつも ここで 止まります ──
--           STILL_USED_IN_POLICY: ポリシーが share_scope を見ています
--
--   ★★★入れ替えた 順 …… ⓪記録 → ★③決まりを 作り直す → ①確かめ → ②列を 消す
--     ★見なく してから、★見て いない ことを 確かめ、★それから 消します。
--
--   ★★中身は 1字も 変えて いません。★並べ替えただけ です。
--
--   ★★★坂本さんの ご承認（2026-09-23）──
--     「画面が share_scope を 一切 読んで いない ため、★列が 消えれば
--       保護すべき 対象 自体が 存在しなく なる」
--     ★本番の 11行の 中身は これで 消えます。★戻せません。

-- ⓪ ★消える中身を、形だけ 記録に残す（値は残さない）
-- ★本番で確かめた列: action・target_kind は必須、detail は jsonb（note・target という列は無い）
-- ★★★2026-09-23（Code）── ★列が もう 無い ときは 飛ばします。
--   ★★この 塊は `where share_scope is not null` を 書きます。
--     ★★列を 消した あとに もう 一度 流すと、★42703 で 落ちます。
--     ★★★`apply_migration` は「何度 流しても 同じ」を 求めます。★包みます。
do $$
begin
  if exists (select 1 from information_schema.columns
              where table_schema = 'public' and table_name = 'teacher_student_links'
                and column_name = 'share_scope') then
    execute $q$
      insert into public.ops_audit_log(actor_id, action, target_kind, detail)
      select null, 'share_scope_dropped', 'teacher_student_links',
             jsonb_build_object(
               'rows', count(*),
               'why', '一度も効いていない共有の設定を 列ごと消した（裁定138／182）',
               'note', '値は残さない')
        from public.teacher_student_links
       where share_scope is not null
    $q$;
  end if;
end $$;

-- ③ 49 で作った「先生は share_scope を変えない更新だけ通す」ポリシーを、列が無い形に作り直す
drop policy if exists teacher_student_links_revoke_by_teacher on public.teacher_student_links;
create policy teacher_student_links_revoke_by_teacher on public.teacher_student_links
  for update to authenticated
  using (auth.uid() = teacher_id)
  with check (auth.uid() = teacher_id);
-- ★身元（先生・生徒）が変わらないことは 引き金（assert_link_identity_unchanged）が見ている

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

-- 確かめ（試しの環境で）
-- 列が消えている（information_schema に share_scope が無い）
-- つながりの一覧・書き出しが いままでどおり動く（★画面が選んでいないこと が前提）
-- 先生が つながりを切る → 通る／生徒が切る → 通る
-- 身元を変える → LINK_IDENTITY_IMMUTABLE
-- ★本番の11行にあった中身は、この操作で 消えます（戻せません）
--   → 当てる前に、★その11行が要るかを 坂本さんに1度確かめること（使っていないので 不要の見込み）
