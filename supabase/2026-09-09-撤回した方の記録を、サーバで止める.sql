-- ============================================================================
-- 撤回した方の 記録の保存を、★サーバで 止めます（2026年9月9日）
--
--   ★★2026-09-03 の SQL は、★「撤回した時刻を 持つ列」を 足しました。
--     ★★止める仕掛けは、★まだ 画面側にしか ありません。
--       ★app/api/ の中に、★撤回を 見ている所は 1つも ありません。
--       ★記録の保存は、★画面から Supabase へ 直に 行きます。
--     ★★つまり、★画面を 通さずに 保存する道が、★塞がれていません。
--
--   ★★ここで 塞ぎます。★2枚に します。
--     ★① ポリシー（RLS）── 撤回している人は、書けない
--     ★② 権限（GRANT）── ★ポリシーの不在は 1枚の板です。
--       ★2026-09-08 の決め「★ポリシーの不在は1枚の板。
--       ★権限の剥奪と合わせて2枚にすること。」に 従います。
--
--   ★★読むのは 止めません。★書くのだけを 止めます。
--     ★★撤回された方も、★ご自分の記録を 見て、書き出して、消せます。
--     ★取り上げるのでは ありません。★これ以上 増やさないだけです。
--
--   ★★何度 実行しても 安全です。
--   ★★BEGIN / ROLLBACK で 包みません。
--     ★2026-09-08、★Supabase の SQL エディタが ROLLBACK を 効かせず、
--     ★★権限の変更が 残ってしまいました。★包まない、と 決めています。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ★① いまの ポリシーを 見ます（★読むだけ。★まだ 何も 変えません）
-- ---------------------------------------------------------------------------
select policyname as "いまのポリシー", cmd as "操作",
       qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'entries'
 order by cmd, policyname;

-- ---------------------------------------------------------------------------
-- ★② 撤回しているかどうかを 返す、小さな関数
--
--   ★★ポリシーの中に 副問い合わせを 直に 書くと、★読みにくくなります。
--   ★★security definer に しません。★呼ぶ人の 権限で 動けば 足ります。
--     ★★profiles は 本人しか 読めませんが、★見るのは 自分の行だけです。
--   ★★stable です。★1文の中で 何度 呼ばれても、★同じ答えです。
-- ---------------------------------------------------------------------------
create or replace function public.consent_withdrawn(p_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(
    (select consent_health_data_withdrawn_at is not null
       from public.profiles where id = p_user),
    false)
$$;

comment on function public.consent_withdrawn(uuid) is
  '★健康の記録の同意を 撤回しているか。★null は「撤回していない」＝ false。'
  '★security definer は、★ポリシーの中から 自分以外の行を 見ないために'
  '★search_path を 固定したうえで 使っています。★見るのは 渡された1人ぶんだけです。';

revoke all on function public.consent_withdrawn(uuid) from public;
revoke all on function public.consent_withdrawn(uuid) from anon;
grant execute on function public.consent_withdrawn(uuid) to authenticated;

-- ---------------------------------------------------------------------------
-- ★③ 2枚目 ── 権限（★先に 剥がします）
--
--   ★★ポリシーだけでは 1枚です。★権限も 見ます。
--
--   ★★2026-09-09、★坂本さんから ご報告をいただきました。
--     ★「実行の順の 都合で、★一時的に anon に entries の 全権限が
--       ★★残ってしまう ことが あった」。★④を 単独で 流し直して 解消。
--   ★★だから、★剥がすほうを 先に します。
--     ★SQL エディタは、★途中で 止まっても 巻き戻しません。
--     ★★途中の どの姿も、★最後の姿より ゆるく しないこと。
--   ★anon には、そもそも 用が ありません。★まとめて 剥がします。
--   ★TRUNCATE は RLS が 効きません。★1文で 表が 空になります。
-- ---------------------------------------------------------------------------
revoke all on public.entries from anon;
revoke truncate, trigger, references on public.entries from authenticated;

-- ---------------------------------------------------------------------------
-- ★④ 書き込みの ポリシーを、★入れ直します
--
--   ★★もとは 1枚で「for all」でした。★読み書き まとめてです。
--     ★★これを 分けます。★読むのは そのまま、★書くのだけ 条件を 足します。
--   ★★WITH CHECK の 無い UPDATE の ポリシーは、★欠陥です（★2026-09-08 の決め）。
--     ★だから UPDATE には、★USING と WITH CHECK の 両方を 書きます。
--   ★★permissive な ポリシーは OR で つながります。
--     ★★だから 古い「for all」を、★必ず 消します。★残すと、そちらが 通ります。
-- ---------------------------------------------------------------------------
drop policy if exists "Users can manage own entries" on public.entries;

-- ★読む ── これまでどおり。★撤回しても、ご自分の記録は 見られます。
create policy "entries_select_own"
  on public.entries for select
  using (auth.uid() = user_id);

-- ★書き足す ── ★撤回していない方だけ。
create policy "entries_insert_own_not_withdrawn"
  on public.entries for insert
  with check (auth.uid() = user_id and not public.consent_withdrawn(auth.uid()));

-- ★書き替える ── ★撤回していない方だけ。★USING と WITH CHECK の 両方。
create policy "entries_update_own_not_withdrawn"
  on public.entries for update
  using (auth.uid() = user_id and not public.consent_withdrawn(auth.uid()))
  with check (auth.uid() = user_id and not public.consent_withdrawn(auth.uid()));

-- ★消す ── ★撤回した方も 消せます。★取り上げないためです。
create policy "entries_delete_own"
  on public.entries for delete
  using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- ★⑤ 確かめ（★読むだけです）
-- ---------------------------------------------------------------------------

-- ⑤-1 ★古い「for all」が 残っていないこと（★0行）
select policyname as "★残っている for all"
  from pg_policies
 where schemaname = 'public' and tablename = 'entries' and cmd = 'ALL';

-- ⑤-2 ★4枚 そろっていること（select / insert / update / delete）
select cmd as "操作", policyname as "ポリシー",
       (with_check is not null) as "WITH CHECK あり"
  from pg_policies
 where schemaname = 'public' and tablename = 'entries'
 order by cmd;

-- ⑤-3 ★UPDATE に WITH CHECK が あること（★true が 出ること）
select policyname as "ポリシー", with_check is not null as "WITH CHECK あり"
  from pg_policies
 where schemaname = 'public' and tablename = 'entries' and cmd = 'UPDATE';

-- ⑤-4 ★権限（★anon は 0行。★authenticated は SELECT/INSERT/UPDATE/DELETE だけ）
select grantee as "相手", privilege_type as "権限"
  from information_schema.table_privileges
 where table_schema = 'public' and table_name = 'entries'
   and grantee in ('anon','authenticated')
 order by 1, 2;

-- ⑤-5 ★関数が できていること（★1行）
select proname as "関数", provolatile as "stable(s)", prosecdef as "security definer"
  from pg_proc where proname = 'consent_withdrawn';

-- ============================================================================
-- ★このあと ── ★実機で 確かめていただきたいこと
--
--   ★★撤回していない ふだんの方が、★これまでどおり 記録できること。
--     ★★ここが いちばん 大事です。★止めすぎては いけません。
--   ★★撤回した方が、★記録を 見られること・書き出せること・消せること。
--   ★★撤回した方が、★保存しようとすると 0行で 返ること。
--     ★画面は「保存できませんでした」と 出ます。★黙って 失敗しません。
--
--   ★★まだ 無いもの
--     ★health.record 以外の目的（周期・食事と就寝・研究）の 撤回。
--       ★2026-09-03 の SQL の 末尾にも、そう 書いてあります。
-- ============================================================================
