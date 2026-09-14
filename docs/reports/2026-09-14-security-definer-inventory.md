# SECURITY DEFINER の 関数 ── 棚おろし
全141行 / 末尾は「  ★組み立てて 作る 問い（動的SQL）は 見えません。」

★出どころ 2026-09-14、★裁定 その51 CONDITION_2（★Opus・坂本さん 承認）

## なぜ 要るか

★★`SECURITY DEFINER` の 関数は、★**RLS を 越えます**。
　★呼んだ 人の 権限では なく、★作った 人の 権限で 動きます。
★★だから「名前で 見張る」のでは 足りません。
　★★別の 名前で 同じ ことを する 関数が 足されたら、★素通りします。
★★見るべきは **どの 表を 読むか** です。

## 本番で 確かめた こと（★2026-09-14・REST）

| 試した こと | 結果 |
|---|---|
| `rpc/get_student_entries`（本番） | **PGRST202**（★関数が ありません） |
| 匿名で `entries` を 読む | **42501**（★anon に 権限が ありません） |
| 本人の `entries` を 読む | 3行（★読めます） |
| **本人以外の `entries` を 読む** | **0行**（★RLS が 効いて います） |

★★④が 大事です。★**本物の RLS で 0行**です。
　★★台帳の 強い 権限で 見た 0行では ありません。
　★★使ったのは、★捨ててよい 試しの アカウントです（`.env.e2e`）。

## 数え

```
★この 倉庫の SQL に ある 関数: 36
　★うち SECURITY DEFINER: 24（★生きて いる 紙 23 ／ 片づけた 紙 1）

★生きて いる 紙の SECURITY DEFINER
  set_member_display_title　読む 表: memberships
      supabase/2026-09-03-display-title.sql
  get_org_member_names　読む 表: memberships, profiles
      supabase/2026-09-03-display-title.sql
  bump_onboarding_count　読む 表: （読み取れません）
      supabase/2026-09-04-onboarding-counts.sql
  accept_teacher_invitation　読む 表: teacher_student_links
      supabase/2026-09-04-rpc-functions.sql
  create_org_event　読む 表: org_events
      supabase/2026-09-04-rpc-functions.sql
  profiles_guard_server_only_columns　読む 表: （読み取れません）
      supabase/2026-09-05-profiles-server-only-columns.sql
  consent_withdrawn　読む 表: profiles
      supabase/2026-09-09-撤回した方の記録を、サーバで止める.sql
  has_can　読む 表: memberships, org_posts
      supabase/2026-09-11-7-3-has_canを作る（第1段・作るだけ）.sql
  can_grant_post　読む 表: org_posts
      supabase/2026-09-11-7-3-第3段の下ごしらえ（関数2つと、決まりの読み取り）.sql
  accept_teacher_invitation　読む 表: teacher_student_links
      supabase/DRAFT_accept_invitation_function.sql
  revoke_teacher_link　読む 表: teacher_student_links
      supabase/DRAFT_fix_link_update_policy.sql
  accept_teacher_invitation　読む 表: teacher_student_links
      supabase/DRAFT_insert_functions.sql
  create_org_event　読む 表: org_events
      supabase/DRAFT_insert_functions.sql
  create_org_event　読む 表: memberships, org_events
      supabase/DRAFT_insert_functions.sql
  is_org_owner　読む 表: memberships
      supabase/URGENT_fix_owner_self_promotion.sql
  assert_student_is_adult　読む 表: profiles
      supabase/migration_block_minor_teacher_link.sql
  get_connected_names　読む 表: profiles
      supabase/migration_get_connected_names.sql
  get_invitation_teacher　読む 表: profiles
      supabase/migration_invitation_teacher_name.sql
  get_my_teacher_names　読む 表: profiles, teacher_student_links
      supabase/migration_invitation_teacher_name.sql
  get_org_member_names　読む 表: enrollments, memberships, profiles
      supabase/migration_org_member_names.sql
  is_org_owner　読む 表: memberships
      supabase/migration_protect_owner_role.sql
  my_org_role_rank　読む 表: memberships
      supabase/migration_role_rank_no_self_promotion.sql
  handle_new_user　読む 表: profiles, subscriptions
      supabase/schema.sql

★片づけた 紙の SECURITY DEFINER（★流して いません）
  get_student_entries　読む 表: entries, teacher_student_links
      supabase/retired/DO_NOT_RUN_2026-09-01_teacher_student_entries_rpc.sql

★★`entries` を 読む SECURITY DEFINER（★生きて いる 紙）: 0
  ✓ ありません

★★この 数えが 見て いない こと
　★この 倉庫の SQL だけ です。★台帳に 直に 作った ものは 見えません。
　★だから、★下の 問いを 台帳で 流して いただく 必要が あります。

-- ★台帳で 流す 問い（★SQL Editor）
select p.proname, p.prosecdef,
       pg_get_functiondef(p.oid) like '%entries%' as entries_を読む
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prosecdef
 order by p.proname;
```

## ★いちばん 大事な 1行

★★**`entries` を 読む `SECURITY DEFINER` は、★生きて いる 紙に 0本 です。**

★★1本 だけ ありますが、★それは 片づけた 紙の 中です ──
　`supabase/retired/DO_NOT_RUN_2026-09-01_teacher_student_entries_rpc.sql`

## ★この 数えの 限り

★★私が 読めるのは、★**この 倉庫の SQL だけ** です。
　★★台帳に 直に 作った 関数は 見えません。
　★★この 製品は、★紙を 手で 貼って 流す やり方です（★CLAUDE.md）。
　　★★だから「紙に 無い ＝ 台帳に 無い」とは 言えません。

★★**台帳で 流して いただく 問い** ──

```sql
select p.proname, p.prosecdef,
       pg_get_functiondef(p.oid) like '%entries%' as entries_を読む
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.prosecdef
 order by p.proname;
```

★★`entries_を読む` が `true` の 行が あれば、★その 場で お知らせください。

## 見張りに ついて（★ご提案）

★★名前では なく **表**で 見張ります。
　★`tools/security_definer_inventory.py` が、★紙の 側を 数えます。
　★★台帳の 側は、★上の 問いを ときどき 流して いただく ほか ありません。

★★見張りに する なら、★次の 1行です ──
　「生きて いる 紙に、★`entries` を 読む `SECURITY DEFINER` が 1本も 無い こと」。

## この 数えが 見て いない こと

- `entries` の 決まり（RLS）そのものは 読んで いません。
  ★0行 だった、という 事実だけ です。★A13 の 見直しに 入れて ください。
- 関数の 中身は、★`$$` までの 6000字だけ 読んで います。
- 読む 表の 見分けは、★`from` `join` `update` などの 字で 探します。
  ★組み立てて 作る 問い（動的SQL）は 見えません。
