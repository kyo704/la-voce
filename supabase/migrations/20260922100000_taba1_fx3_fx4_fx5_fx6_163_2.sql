-- ★★★2026-09-22 に 本番へ（坂本さんの ご承認）。
--   ★★2026-09-23 06:50 に `schema_migrations` へ 記録しました。
--   ★★時刻（ファイル名の 下6桁）は 分かりません。★順だけ 正しい です。

-- ★束1 ── 裁定161 FX3・FX4・FX5・FX6 ＋ 裁定163 §2（2026-09-22）
--
--   ★FX3 …… 役職の 変更の 記録を 空に できる（TRUNCATE）
--   ★FX4 …… 書きかけを 全部 消せる（TRUNCATE）
--   ★FX5 …… 公開の 鍵で「この 人は この 学校の 人か」を 問い合わせられる
--   ★FX6 …… 招待を 出して いる あいだ、★誰にでも その 学校が 見える
--   ★163 §2 … RLS の 無い 控えの 表に、★誰でも 読み書きできる
--
--   ★★何度 流しても 同じに なります。

begin;

-- ===========================================================================
-- FX3 ── org_post_perm_log ── 記録は 空に できません
-- ===========================================================================
--   ★★いま …… authenticated に TRUNCATE・TRIGGER・REFERENCES・SELECT。
--     ★★REST から TRUNCATE は 出せません。★けれど 権限として 持って います。
--     ★★「消せません」の 約束を、★権限の 側でも 守ります。
--   ★★絞りは 決まり（RLS）が します …… `post` と `master` だけ。
revoke all on table public.org_post_perm_log from public, anon, authenticated;
grant select on table public.org_post_perm_log to authenticated;

-- ===========================================================================
-- FX4 ── org_message_drafts ── 書きかけは 消えません
-- ===========================================================================
--   ★★いま …… TRUNCATE・TRIGGER・REFERENCES まで 付いて います。
--   ★★ご本人が 1つずつ 消すのは そのまま です（DELETE は 残します）。
revoke all on table public.org_message_drafts from public, anon, authenticated;
grant select, insert, update, delete on table public.org_message_drafts to authenticated;

-- ===========================================================================
-- FX5 ── 公開の 鍵で 人の 関わりを 問い合わせられない
-- ===========================================================================
--   ★★4つとも `security definer` です。★中で 台帳を 素通りします。
--   ★★`anon`（公開の 鍵）で 呼べると、★UUID さえ あれば
--     ★「この 人は この 学校の 人か」「この 2人は つながって いるか」が 分かります。
--   ★★★`authenticated` は 残します。★決まり（`organizations_select`）が 使って います。
revoke execute on function public.are_connected(uuid, uuid) from public, anon;
revoke execute on function public.is_org_member(uuid, uuid) from public, anon;
revoke execute on function public.can_view_organization(uuid, uuid) from public, anon;

-- ★★`is_org_owner_or_admin` は **使われて いません**。★消します。
--   ★確かめた こと（2026-09-22）──
--     ・決まり（RLS）で 使って いる ところ …… 0本
--     ・ほかの 関数の 中 …………………………… `create_org_event` に 1か所。
--       ★★★ただし **註（`--`）の 中** でした。★処理では ありません。
--       ★★`prosrc like '%…%'` は 註も 拾います。★行を 読んで 確かめました。
--     ・画面の コード ………………………………… 0か所（`lib/opsAttendance.js` の 註 だけ）
drop function if exists public.is_org_owner_or_admin(uuid, uuid);

-- ===========================================================================
-- FX6 ── 招待を 出して いる あいだ、★誰にでも 見える 枝を 消します
-- ===========================================================================
--   ★★いまの 3つ目の 枝 ──
--     `or exists (select 1 from org_invitations
--                  where org_id = p_org_id and used_at is null and expires_at > now())`
--   ★★★註には「コード自体を 知って いる ことが 前提」と 書いて あります。
--     ★★けれど **条件に コードが ありません**。★知らない 人にも 当たります。
--   ★★合言葉での 参加は、★2026-09-02 から サーバの 側の 処理 です。
--     ★★だから この 枝が 無くても、★参加は 通ります。
create or replace function public.can_view_organization(viewer_id uuid, p_org_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select
    exists (select 1 from memberships where org_id = p_org_id and user_id = viewer_id)
    or exists (select 1 from enrollments
                where org_id = p_org_id and student_id = viewer_id and status = 'active')
$function$;

-- ★作り直した ので、★渡し先を もう 一度 決めます（★`anon` には 渡しません）。
revoke execute on function public.can_view_organization(uuid, uuid) from public, anon;
grant execute on function public.can_view_organization(uuid, uuid) to authenticated;

-- ===========================================================================
-- 裁定163 §2 ── 控えの 表を 消します
-- ===========================================================================
--   ★★`_a13_policy_backup` …… 2026-09-14 の 移行で 使った、★古い 決まりの 控え 12行。
--   ★★RLS が 無く、★authenticated に SELECT・INSERT・UPDATE・DELETE が あります。
--   ★★★中身は 12行 とも、★ファイルに 写して あります ──
--     `docs/records/2026-09-22-_a13_policy_backup-の控え.json`
--   ★★写して から 消します。★黙って 消しません。
drop table if exists public._a13_policy_backup;

commit;

-- ★★★確かめ（当てた あとに 流して ください）
--   select table_name, privilege_type from information_schema.role_table_grants
--    where table_schema='public' and grantee in ('anon','authenticated')
--      and table_name in ('org_post_perm_log','org_message_drafts');
--   select p.proname, r.rolname from pg_proc p
--     cross join lateral aclexplode(p.proacl) a join pg_roles r on r.oid = a.grantee
--    where p.proname in ('are_connected','is_org_member','can_view_organization');
