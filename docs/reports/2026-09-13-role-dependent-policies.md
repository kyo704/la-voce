# ★役割（role）に 寄りかかって いる ところ

★この 紙は tools/role_dependent.py が 書き出します。★手で 書いて いません。

★★決めて いません。★並べた だけ です。
　★★「どの 鍵に あたるか」は、★lib/opsPerms.js の 名前を 添えた だけ で、
　★★私の 見立てでは ありません。★お決めは Opus と 坂本さんの ものです。

★★この 紙は **帳面の 字**を 読んで います。
　★★台帳に 実際に 立って いる 決まりは、★別に 読む 必要が あります ──
　★supabase/2026-09-13-役割に寄る決まりを読む（読むだけ）.sql

## ★数　159 件

- **memberships.role を 直に** … 93 件
- **is_org_owner_or_admin** … 37 件
- **role in ('owner','admin')** … 21 件
- **role の 4値を 書いて いる** … 8 件

## ① 台帳の 側（SQL）　129 件

★決まり・関数。★ここが 権限そのものです。

| 場所 | たぐい | 関わる 表 | あたりそうな 鍵 | 行 |
|---|---|---|---|---|
| `supabase/2026-09-03-display-title.sql:141` | role in ('owner','admin') | memberships | post（ひとの 役職を 変える）／meibo | `and m.role in ('owner','admin')` |
| `supabase/2026-09-03-display-title.sql:213` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `m.role` |
| `supabase/2026-09-04-rpc-functions.sql:157` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `--   ★is_org_owner_or_admin が role in ('owner','admin') であることは、` |
| `supabase/2026-09-04-rpc-functions.sql:160` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `if not public.is_org_owner_or_admin(auth.uid(), p_org_id) then` |
| `supabase/2026-09-10-連絡と、読んだ記録.sql:181` | role in ('owner','admin') | memberships | post（ひとの 役職を 変える）／meibo | `and m.role in ('owner', 'admin')` |
| `supabase/2026-09-10-連絡と、読んだ記録.sql:212` | role in ('owner','admin') | memberships | post（ひとの 役職を 変える）／meibo | `and m.role in ('owner', 'admin')` |
| `supabase/2026-09-11-7-2-mayTouchPostsの3行目を確かめる.sql:11` | memberships.role を 直に | — | — | `--         return member.role === "owner";        ★← ★ここは 通って いません` |
| `supabase/2026-09-11-7-2-mayTouchPostsの3行目を確かめる.sql:67` | memberships.role を 直に | org_posts | post | `m.role   as "役割",` |
| `supabase/2026-09-11-7-2-いま何が通るかを確かめる.sql:112` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `select m.role as "役割", p.name as "役職"` |
| `supabase/2026-09-11-7-2-捨ててよい教室を作る（API経由の確かめ用）.sql:60` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `select m.role as "役割", p.name as "役職", p.perms as "できること"` |
| `supabase/2026-09-11-7-3-has_canを作る（第1段・作るだけ）.sql:137` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `m.role,` |
| `supabase/2026-09-11-7-3-has_canを作る（第1段・作るだけ）.sql:149` | role in ('owner','admin') | — | — | `when 'meibo'       then 人.role in ('owner','admin')` |
| `supabase/2026-09-11-7-3-has_canを作る（第1段・作るだけ）.sql:150` | role in ('owner','admin') | — | — | `when 'sched_all'   then 人.role in ('owner','admin','staff')` |
| `supabase/2026-09-11-7-3-has_canを作る（第1段・作るだけ）.sql:151` | role in ('owner','admin') | — | — | `when 'gyoji'       then 人.role in ('owner','admin')` |
| `supabase/2026-09-11-7-3-has_canを作る（第1段・作るだけ）.sql:152` | role in ('owner','admin') | — | — | `when 'renraku_all' then 人.role in ('owner','admin')` |
| `supabase/2026-09-11-7-3-has_canを作る（第1段・作るだけ）.sql:155` | role in ('owner','admin') | — | — | `when 'master'      then 人.role in ('owner','admin')` |
| `supabase/2026-09-11-7-3-has_canを作る（第1段・作るだけ）.sql:158` | role in ('owner','admin') | — | — | `when 'koma'        then 人.role in ('owner','admin','staff')` |
| `supabase/2026-09-11-7-3-has_canを作る（第1段・作るだけ）.sql:197` | memberships.role を 直に | — | — | `m.role                                   as "役割",` |
| `supabase/2026-09-11-7-3-has_canを作る（第1段・作るだけ）.sql:202` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `group by m.role` |
| `supabase/2026-09-11-7-3-has_canを作る（第1段・作るだけ）.sql:203` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `order by m.role;` |
| `supabase/2026-09-11-7-3-⑦-はじめの1人を確かめる.sql:36` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `m.role    as "役割",` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:29` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `m.role   as "役割",` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:34` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `group by o.name, m.role` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:35` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `order by o.name, m.role;` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:40` | memberships.role を 直に | — | — | `m.role as "いまの 役割",` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:41` | memberships.role を 直に | — | — | `case m.role` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:52` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `order by o.name, m.role;` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:119` | memberships.role を 直に | org_posts | post | `) as v(role, name, ord, perms) on v.role = m.role` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:138` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `and p.name = case m.role` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:150` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `m.role                                    as "役割",` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:154` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `group by m.role` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:155` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `order by m.role;` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:166` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `select m.org_id, m.user_id, m.role, p.name as post_name, p.perms as perms` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:174` | role in ('owner','admin') | org_posts | post | `when 'meibo'       then 人.role in ('owner','admin')` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:175` | role in ('owner','admin') | — | — | `when 'sched_all'   then 人.role in ('owner','admin','staff')` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:176` | role in ('owner','admin') | — | — | `when 'gyoji'       then 人.role in ('owner','admin')` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:177` | role in ('owner','admin') | — | — | `when 'renraku_all' then 人.role in ('owner','admin')` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:180` | role in ('owner','admin') | — | — | `when 'master'      then 人.role in ('owner','admin')` |
| `supabase/2026-09-11-7-3-第2段-役職の無い方に役職を付ける.sql:182` | role in ('owner','admin') | — | — | `when 'koma'        then 人.role in ('owner','admin','staff')` |
| `supabase/2026-09-11-7-3-第3段の下ごしらえ（関数2つと、決まりの読み取り）.sql:151` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `m.role   as "役割",` |
| `supabase/2026-09-11-7-3-第3段の下ごしらえ（関数2つと、決まりの読み取り）.sql:157` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `order by o.name, m.role, p.name;` |
| `supabase/2026-09-11-7-3-第3段の本体（できことを かつ で 足す）.sql:13` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `--     ★is_org_owner_or_admin(…) を has_can(org_id,'post') に 差し替える。` |
| `supabase/2026-09-11-7-3-第3段の本体（できことを かつ で 足す）.sql:103` | role in ('owner','admin') | org_events | gyoji | `--   ★★いま　org_events_write_admin　role = ANY(ARRAY['owner','admin'])` |
| `supabase/2026-09-11-7-3-第3段の本体（できことを かつ で 足す）.sql:163` | memberships.role を 直に | — | — | `m.role  as "役割",` |
| `supabase/2026-09-11-7-3-第3段の本体（できことを かつ で 足す）.sql:171` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `order by o.name, m.role, p.name;` |
| `supabase/2026-09-11-No002-出席は出席のできことで守る.sql:51` | memberships.role を 直に | lessons | sched_all ／ sched_mine ／ shukketsu | `m.role                                   as "名前の ちから",` |
| `supabase/2026-09-11-No002-出席は出席のできことで守る.sql:61` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `group by o.name, q.name, m.role, q.perms` |
| `supabase/2026-09-11-No004-本物の学校で締め出しが無いか.sql:22` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `select m.org_id, m.user_id, m.grade_label, m.role, m.post_id,` |
| `supabase/2026-09-11-No004-本物の学校で締め出しが無いか.sql:61` | memberships.role を 直に | — | — | `-- select m.role                          as "名前の ちから",` |
| `supabase/2026-09-11-§3-50通り-下ごしらえ.sql:122` | memberships.role を 直に | — | — | `select o.name as "学校", q.name as "役職", m.role as "名前の ちから",` |
| `supabase/2026-09-11-§3-50通り-台帳の側（読むだけ）.sql:85` | memberships.role を 直に | org_posts | post | `select o.name as "学校", q.name as "役職", m.role as "名前の ちから",` |
| `supabase/2026-09-13-⑥-c-課長に付け替える.sql:9` | memberships.role を 直に | — | — | `--     ★③ 運営モードの 入口は `mayEnterOps(mm.role)` ＝ 名前の ちから で 出ます。` |
| `supabase/2026-09-13-⑥-c-課長に付け替える.sql:10` | memberships.role を 直に | — | — | `--        ★`BY_ROLE['staff']` は `["schedule"]` で 空では ないので、★入口は 出ます。` |
| `supabase/2026-09-13-⑥-c-課長に付け替える.sql:33` | memberships.role を 直に | — | — | `select m.role                            as "名前の ちから",` |
| `supabase/2026-09-13-⑥-c-課長に付け替える.sql:82` | memberships.role を 直に | — | — | `select m.role                            as "名前の ちから",` |
| `supabase/2026-09-13-⑥実機の確かめ-使い捨ての学校.sql:104` | memberships.role を 直に | — | — | `m.role                            as "名前の ちから",` |
| `supabase/2026-09-13-名簿③-enrollmentsの決まりを読む（読むだけ）.sql:38` | is_org_owner_or_admin | — | — | `and p.proname in ('has_can', 'can_view_ops', 'is_org_owner_or_admin');` |
| `supabase/2026-09-13-役割に寄る決まりを読む（読むだけ）.sql:20` | is_org_owner_or_admin | — | — | `like '%is_org_owner_or_admin%') as "is_org_owner_or_admin",` |
| `supabase/2026-09-13-役割に寄る決まりを読む（読むだけ）.sql:29` | is_org_owner_or_admin | — | — | `like '%is_org_owner_or_admin%'` |
| `supabase/2026-09-13-役割に寄る決まりを読む（読むだけ）.sql:42` | is_org_owner_or_admin | — | — | `and (coalesce(qual,'')\|\|coalesce(with_check,'') like '%is_org_owner_or_admin%'` |
| `supabase/DRAFT_insert_functions.sql:117` | is_org_owner_or_admin | — | — | `--     is_org_owner_or_admin が正しく効いているかを、まだ確かめていないためです。` |
| `supabase/DRAFT_insert_functions.sql:145` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `--     is_org_owner_or_admin が role in ('owner','admin') である、という確認は` |
| `supabase/DRAFT_insert_functions.sql:149` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `if not public.is_org_owner_or_admin(auth.uid(), p_org_id) then` |
| `supabase/DRAFT_insert_functions.sql:167` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `-- ②-B ★変種B：is_org_owner_or_admin が壊れていた場合` |
| `supabase/DRAFT_insert_functions.sql:174` | role in ('owner','admin') | memberships | post（ひとの 役職を 変える）／meibo | `--     CHECK (role = ANY (ARRAY['owner','admin','teacher']))` |
| `supabase/DRAFT_insert_functions.sql:202` | role in ('owner','admin') | memberships | post（ひとの 役職を 変える）／meibo | `and m.role in ('owner', 'admin')` |
| `supabase/URGENT_2026-09-11-7-2の後片づけと切り分け.sql:54` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `m.role  as "役割",` |
| `supabase/URGENT_2026-09-11-同じバグが もう1か所（restrictive）.sql:83` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `(role <> 'owner' and (role <> 'admin' or public.is_org_owner_or_admin(auth.uid(), org_id)))` |
| `supabase/URGENT_containment_and_diagnosis.sql:10` | is_org_owner_or_admin | org_events | gyoji | `--     org_events の WITH CHECK は is_org_owner_or_admin(...) を呼んでいます。` |
| `supabase/URGENT_containment_and_diagnosis.sql:21` | is_org_owner_or_admin | — | — | `-- A-1 is_org_owner_or_admin の中身（★まだ受け取っていません）` |
| `supabase/URGENT_containment_and_diagnosis.sql:22` | is_org_owner_or_admin | — | — | `select pg_get_functiondef(p.oid) as "★is_org_owner_or_admin の中身"` |
| `supabase/URGENT_containment_and_diagnosis.sql:24` | is_org_owner_or_admin | — | — | `where n.nspname = 'public' and p.proname = 'is_org_owner_or_admin';` |
| `supabase/URGENT_containment_and_diagnosis.sql:34` | is_org_owner_or_admin | — | — | `-- select public.is_org_owner_or_admin(auth.uid(), '<教室の uuid>')` |
| `supabase/URGENT_fix_owner_self_promotion.sql:22` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `--         and (role <> 'admin' or public.is_org_owner_or_admin(auth.uid(), org_id))` |
| `supabase/URGENT_fix_owner_self_promotion.sql:67` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `where m.org_id = p_org_id and m.user_id = p_user_id and m.role = 'owner');` |
| `supabase/URGENT_fix_owner_self_promotion.sql:78` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `or public.is_org_owner_or_admin(auth.uid(), org_id)` |
| `supabase/URGENT_fix_owner_self_promotion.sql:90` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `and (role <> 'admin' or public.is_org_owner_or_admin(auth.uid(), org_id))` |
| `supabase/URGENT_fix_owner_self_promotion.sql:102` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `(role <> 'owner' and (role <> 'admin' or public.is_org_owner_or_admin(auth.uid(), org_id)))` |
| `supabase/URGENT_fix_owner_self_promotion.sql:129` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `join public.memberships m on m.org_id = o.id and m.role = 'owner'` |
| `supabase/URGENT_fix_owner_self_promotion.sql:135` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `select m.user_id as "誰", u.email as "メール", m.role as "役割",` |
| `supabase/URGENT_fix_owner_self_promotion.sql:142` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `order by m.role, m.created_at;` |
| `supabase/URGENT_fix_owner_self_promotion.sql:152` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `and m.role = 'owner'` |
| `supabase/URGENT_fix_owner_self_promotion.sql:162` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `where m.org_id = o.id and m.role = 'owner') > 1;` |
| `supabase/URGENT_fix_owner_self_promotion.sql:169` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `where m.role = 'owner' group by m.org_id having count(*) > 1) x;` |
| `supabase/URGENT_test_assignment_forge.sql:6` | is_org_owner_or_admin | — | — | `--     こちら … WITH CHECK は★ある。ただし is_org_owner_or_admin を` |
| `supabase/URGENT_test_assignment_forge.sql:37` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `select m.org_id as "教室", m.role as "役職", u.email as "メール", m.user_id,` |
| `supabase/URGENT_test_assignment_forge.sql:42` | role in ('owner','admin') | memberships | post（ひとの 役職を 変える）／meibo | `where m.role in ('owner','admin')` |
| `supabase/URGENT_test_assignment_forge.sql:43` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `order by m.org_id, m.role;` |
| `supabase/URGENT_test_assignment_forge.sql:70` | role in ('owner','admin') | memberships | post（ひとの 役職を 変える）／meibo | `and m.role in ('owner','admin')` |
| `supabase/URGENT_test_assignment_forge.sql:72` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `order by m.role` |
| `supabase/URGENT_test_self_promotion.sql:10` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `--           (SELECT m.role FROM memberships m WHERE m.id = memberships.id))` |
| `supabase/URGENT_test_self_promotion_v2.sql:20` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `m.role as "役職", u.email as "メール",` |
| `supabase/URGENT_test_self_promotion_v2.sql:26` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `order by o.name, m.role desc, u.email;` |
| `supabase/URGENT_test_self_promotion_v2.sql:33` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `where m.role = 'owner'` |
| `supabase/check_admin_can_demote_owner.sql:40` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `-- is_org_owner_or_admin の中身` |
| `supabase/check_admin_can_demote_owner.sql:41` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `select pg_get_functiondef(p.oid) as "is_org_owner_or_admin の定義"` |
| `supabase/check_admin_can_demote_owner.sql:43` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `where n.nspname = 'public' and p.proname = 'is_org_owner_or_admin';` |
| `supabase/check_admin_can_demote_owner.sql:49` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `select m.id as "membership の id", m.user_id as "誰", m.role as "役割"` |
| `supabase/check_admin_can_demote_owner.sql:52` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `order by m.role;` |
| `supabase/check_owner_role_protection.sql:54` | is_org_owner_or_admin | — | — | `--     is_org_owner_or_admin だけで守ると、ここが空いたままになります。` |
| `supabase/migration_backfill_orphan_org_memberships.sql:43` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `where m.org_id = o.id and m.role = 'owner'))` |
| `supabase/migration_backfill_orphan_org_memberships.sql:59` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `where m.org_id = o.id and m.role = 'owner')` |
| `supabase/migration_backfill_orphan_org_memberships.sql:69` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `where m.org_id = o.id and m.role = 'owner')` |
| `supabase/migration_backfill_orphan_org_memberships.sql:87` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `where m.org_id = o.id and m.role = 'owner')` |
| `supabase/migration_backfill_orphan_org_memberships.sql:98` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `where m.org_id = o.id and m.role = 'owner');` |
| `supabase/migration_backfill_orphan_org_memberships.sql:101` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `select m.role as "役割", m.user_id as "誰", m.created_at as "いつ入ったか"` |
| `supabase/migration_fix_link_update_columns.sql:137` | is_org_owner_or_admin | assignments | meibo ／ monka_write | `--     分かっているのは `assignments_all_owner_admin`（ALL・is_org_owner_or_admin）` |
| `supabase/migration_fix_link_update_columns.sql:172` | is_org_owner_or_admin | assignments | meibo ／ monka_write | `--                             is_org_owner_or_admin をもう一度確かめるだけで、` |
| `supabase/migration_fix_link_update_columns.sql:205` | is_org_owner_or_admin | assignments | meibo ／ monka_write | `--   ★いまの条件（is_org_owner_or_admin）は★消しません。足します。` |
| `supabase/migration_fix_memberships_update_policy.sql:8` | role の 4値を 書いて いる | memberships | post（ひとの 役職を 変える）／meibo | `--         role not in ('owner','admin') or public.is_org_owner(auth.uid(), org_id)` |
| `supabase/migration_fix_memberships_update_policy.sql:68` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `or public.is_org_owner_or_admin(auth.uid(), org_id)` |
| `supabase/migration_fix_memberships_update_policy.sql:75` | role の 4値を 書いて いる | — | — | `--       前： role not in ('owner','admin') or is_org_owner(...)` |
| `supabase/migration_fix_memberships_update_policy.sql:94` | is_org_owner_or_admin | — | — | `and (role <> 'admin' or public.is_org_owner_or_admin(auth.uid(), org_id))` |
| `supabase/migration_fix_memberships_update_policy.sql:112` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `(role <> 'owner' and (role <> 'admin' or public.is_org_owner_or_admin(auth.uid(), org_id)))` |
| `supabase/migration_org_events.sql:99` | role in ('owner','admin') | memberships | post（ひとの 役職を 変える）／meibo | `and m.role in ('owner','admin'))` |
| `supabase/migration_org_insert_policies.sql:18` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `--       WITH CHECK is_org_owner_or_admin(auth.uid(), org_id)` |
| `supabase/migration_org_owner_departure.sql:44` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `'★ここを見て権限を決めないこと。権限は memberships.role で判定する。';` |
| `supabase/migration_protect_owner_role.sql:50` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `--   ★is_org_owner_or_admin は使いません。あれは「オーナー★または責任者」で、` |
| `supabase/migration_protect_owner_role.sql:57` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `--     既存の can_view_ops / is_org_owner_or_admin と同じ作りです。` |
| `supabase/migration_protect_owner_role.sql:70` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `and m.role = 'owner'` |
| `supabase/migration_protect_owner_role.sql:94` | role の 4値を 書いて いる | — | — | `role not in ('owner', 'admin')` |
| `supabase/migration_protect_owner_role.sql:129` | role の 4値を 書いて いる | memberships | post（ひとの 役職を 変える）／meibo | `role not in ('owner', 'admin')` |
| `supabase/migration_role_rank_no_self_promotion.sql:7` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `--         and (role <> 'admin' or public.is_org_owner_or_admin(auth.uid(), org_id))` |
| `supabase/migration_role_rank_no_self_promotion.sql:9` | is_org_owner_or_admin | memberships | post（ひとの 役職を 変える）／meibo | `--     is_org_owner_or_admin が偽なので★通りません。` |
| `supabase/migration_role_rank_no_self_promotion.sql:70` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `select coalesce(max(public.org_role_rank(m.role)), 0)` |
| `supabase/restore_g4t3_membership.sql:35` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `select m.user_id as "誰", m.role as "役割"` |
| `supabase/restore_g4t3_membership.sql:38` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `order by m.role;` |
| `supabase/restore_g4t3_membership.sql:58` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `select m.user_id as "誰", m.role as "役割", m.created_at as "入った日時"` |
| `supabase/restore_g4t3_membership.sql:61` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `order by m.role, m.created_at;` |

## ② 画面・サーバの 側（JS）　30 件

★描画の 絞りと、★経路の 門。

| 場所 | たぐい | 関わる 表 | あたりそうな 鍵 | 行 |
|---|---|---|---|---|
| `app/api/org/posts/route.js:57` | memberships.role を 直に | — | — | `return member.role === "owner";` |
| `components/Renraku.jsx:71` | memberships.role を 直に | — | — | `{m.role_badge ? (` |
| `components/Renraku.jsx:76` | memberships.role を 直に | — | — | `}}>{m.role_badge}</span>` |
| `components/VocalTracker.jsx:12086` | role の 4値を 書いて いる | — | — | `const ORG_OPERATOR_ROLES = ["owner", "admin"];` |
| `components/VocalTracker.jsx:12089` | memberships.role を 直に | — | — | `const operators = members.filter((m) => ORG_OPERATOR_ROLES.includes(m.role));` |
| `components/VocalTracker.jsx:13210` | role の 4値を 書いて いる | — | — | `const SCHEDULE_ROLES = ["teacher", "owner", "admin"];` |
| `components/VocalTracker.jsx:13225` | memberships.role を 直に | — | — | `.filter((mm) => SCHEDULE_ROLES.includes(mm.role))` |
| `components/VocalTracker.jsx:13255` | memberships.role を 直に | lessons | sched_all ／ sched_mine ／ shukketsu | `teacherCount={opsMembers.filter((mm) => SCHEDULE_ROLES.includes(mm.role)).length}` |
| `components/VocalTracker.jsx:16301` | memberships.role を 直に | — | — | `{myOrgs.filter((mm) => mayEnterOps(mm.role)).map((mm) => (` |
| `components/VocalTracker.jsx:16668` | memberships.role を 直に | — | — | `{canSeeBetaFeatures(profile) && myOrgs.filter((m) => m.role === "owner" \|\| m.role === "admin").lengt` |
| `components/VocalTracker.jsx:16717` | memberships.role を 直に | assignments | meibo ／ monka_write | `{canSeeBetaFeatures(profile) && myOrgs.filter((m) => m.role === "teacher").map((m) => {` |
| `components/VocalTracker.jsx:16822` | memberships.role を 直に | — | — | `{canSeeBetaFeatures(profile) && myOrgs.filter((m) => m.role === "owner" \|\| m.role === "admin").map((` |
| `components/VocalTracker.jsx:16831` | memberships.role を 直に | enrollments | meibo（名簿を 見る・直す） | `<summary className="p-4 text-sm font-medium cursor-pointer">{m.org ? m.org.name : "（教室情報を読み込めませんでした）` |
| `components/VocalTracker.jsx:16903` | memberships.role を 直に | — | — | `<select value={mem.role} onChange={(e) => handleChangeRole(orgId, mem.id, mem.user_id, e.target.valu` |
| `components/VocalTracker.jsx:16935` | memberships.role を 直に | — | — | `<option key={mm.user_id} value={mm.user_id}>{orgDisplayName(mm.user_id)}（{mm.role}）</option>` |
| `components/VocalTracker.jsx:21625` | memberships.role を 直に | — | — | `hasOrgRole: myOrgs.some((mm) => mayEnterOps(mm.role))` |
| `components/VocalTracker.jsx:21632` | memberships.role を 直に | — | — | `? myOrgs.filter((mm) => mayEnterOps(mm.role)).map((mm, j, all) => (` |
| `components/VocalTracker.jsx:22077` | memberships.role を 直に | — | — | `{canSeeBetaFeatures(profile) && myOrgs.filter((m) => m.role === "owner" \|\| m.role === "admin").lengt` |
| `lib/displayTitle.js:132` | memberships.role を 直に | — | — | `return ROLE_FALLBACK_LABELS[m.role] \|\| null;` |
| `lib/opsShell.js:28` | role の 4値を 書いて いる | — | — | `export const ROLES = Object.freeze(["owner", "admin", "teacher", "staff"]);` |
| `lib/opsShell.js:49` | memberships.role を 直に | — | — | `const BY_ROLE = Object.freeze({` |
| `lib/opsShell.js:75` | memberships.role を 直に | — | — | `const keys = BY_ROLE[roleOrPerms] \|\| [];` |
| `lib/orgClosure.js:271` | role の 4値を 書いて いる | — | — | `export const ORG_OPERATOR_ROLES = ["owner", "admin"];` |
| `lib/orgClosure.js:349` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `if (mine && mine.role === "owner") {` |
| `lib/orgRoster.js:36` | memberships.role を 直に | enrollments | meibo（名簿を 見る・直す） | `export const NOT_COUNTED_ROLES = Object.freeze(["teacher", "staff", "owner", "admin"]);` |
| `lib/orgRoster.js:73` | memberships.role を 直に | memberships | post（ひとの 役職を 変える）／meibo | `if (member.role && NOT_COUNTED_ROLES.includes(member.role)) return false;` |
| `lib/orgRoster.js:93` | memberships.role を 直に | — | — | `if (m.role && NOT_COUNTED_ROLES.includes(m.role)) { out.notCounted += 1; return; }` |
| `lib/orgRoster.js:193` | memberships.role を 直に | enrollments | meibo（名簿を 見る・直す） | `if (member.role && NOT_COUNTED_ROLES.includes(member.role)) return false;` |
| `lib/orgRoster.js:217` | memberships.role を 直に | — | — | `if (!m \|\| NOT_COUNTED_ROLES.includes(m.role)) return;` |
| `lib/orgRoster.js:251` | memberships.role を 直に | — | — | `if (!m \|\| NOT_COUNTED_ROLES.includes(m.role)) return;` |

## ★この 紙が 見て いない こと

★★台帳に 立って いる 決まりの 本文は 読んで いません。
　★★帳面の SQL は「流した もの」と「流して いない もの」が 混ざります。
　★★実際に 何が 立って いるかは `pg_policies` でしか 分かりません。
★★`role` という 字が 別の 意味で 使われて いる ところも 拾います。
　★★1件ずつ、★触る 前に お確かめください。
