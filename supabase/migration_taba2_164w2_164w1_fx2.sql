-- ★束2 ── 裁定164 W2・W1 と 裁定161 FX2（2026-09-22）
--
--   ★W2 …… `org_messages` の update を `withdrawn_at` だけに します。
--            いまは 全部の 列が 書けます。★出した あとに 中身を 書き換えられます。
--   ★W1 …… `applications` の 応募者は `status` を 'chosen' に できません。
--            'chosen' を 付けるのは `choose_applicant`（SECURITY DEFINER）だけ です。
--   ★FX2 … `monka_read_log` に 直に insert できなく します。
--            書くのは `open_monka_thread`（SECURITY DEFINER・所有者 postgres）だけ です。
--
--   ★★何度 流しても 同じに なります。
--   ★★REVOKE を 先に 書きます（★列の GRANT は、表の GRANT を 狭められません）。

begin;

-- ────────────────────────────────────────────────
-- W2 ── org_messages ── 取り下げ だけ
-- ────────────────────────────────────────────────
-- ★先に 全部 外します。★試しの 台帳には TRUNCATE・DELETE まで 付いて いました（2026-09-22 に 見ました）。
revoke all on table public.org_messages from public, anon, authenticated;

grant select, insert on table public.org_messages to authenticated;
-- ★書ける 列は 1つ だけ です。
grant update (withdrawn_at) on table public.org_messages to authenticated;

drop policy if exists org_messages_withdraw on public.org_messages;
create policy org_messages_withdraw on public.org_messages
  for update
  using  (auth.uid() = author_id)
  -- ★`withdrawn_at is not null` …… 取り下げる 向きだけ 通します。
  --   ★★戻す（null に する）ことは できません。★裁定164 W2。
  with check (auth.uid() = author_id and withdrawn_at is not null);

-- ────────────────────────────────────────────────
-- W1 ── applications ── 自分で「決まり」に できない
-- ────────────────────────────────────────────────
drop policy if exists applications_update_own on public.applications;
create policy applications_update_own on public.applications
  for update
  using  (auth.uid() = applicant_user_id)
  -- ★'chosen' は `choose_applicant` だけ が 付けます。
  --   ★★決まった あとに 辞退する（'withdrawn'）ことは できます。★わざと です。
  with check (auth.uid() = applicant_user_id
              and status = any (array['sent'::text, 'withdrawn'::text]));

-- ────────────────────────────────────────────────
-- A1（裁定167）── character_inventory ── 払わずに 付けられない
-- ────────────────────────────────────────────────
--   ★★★いま …… authenticated に 表ごとの INSERT・UPDATE・DELETE が あります。
--     ★★画面は `character_inventory` を 見て「持って いる」を 決めます
--       （`components/VocalTracker.jsx:6773`）。
--     ★★だから、★`item_key` を 好きに 書けば 有料の 品が 手に 入ります。
--     ★★UPDATE で 無料の 品を 有料の 品に 書き換える ことも できます。
--   ★★★買う 道・贈る 道は `service_role` です（`app/api/character/buy|gift/route.js`）。
--     ★★RLS を 通り抜ける 鍵 なので、★外しても 買えなく なりません。
--   ★★★退会の 消し込みも `service_role` です（`purgeAccount(admin, …)`）。
--     ★★DELETE を 外しても 退会は 通ります。
--   ★★読むのは そのまま です。★画面も 書き出しも SELECT だけ です。
--   ★★★`revoke all` に します（★`insert, update, delete` では 足りません）。
--     ★★試しの 台帳には TRUNCATE・TRIGGER・REFERENCES も 付いて いました
--       （2026-09-22 に 見ました）。★TRUNCATE は 表を まるごと 空に します。
--     ★★本番には 付いて いません。★けれど 同じ SQL を 両方に 流します。
revoke all on table public.character_inventory from public, anon, authenticated;
grant select on table public.character_inventory to authenticated;

-- ────────────────────────────────────────────────
-- FX2 ── monka_read_log ── 直に 書けない
-- ────────────────────────────────────────────────
-- ★読むのは そのまま です（本人と master）。
drop policy if exists monka_read_log_insert_self_monka_read on public.monka_read_log;
revoke insert on table public.monka_read_log from public, anon, authenticated;

commit;

-- ★★★確かめ（当てた あとに 流して ください）
--   select polname, polcmd, pg_get_expr(polqual,polrelid), pg_get_expr(polwithcheck,polrelid)
--     from pg_policy p join pg_class c on c.oid=p.polrelid
--    where c.relname in ('org_messages','applications','monka_read_log');
--   select table_name, privilege_type from information_schema.role_table_grants
--    where table_schema='public' and grantee='authenticated'
--      and table_name in ('org_messages','applications','monka_read_log');
