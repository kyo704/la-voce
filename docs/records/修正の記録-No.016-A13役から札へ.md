# 修正の記録 No.016 ── 決まりを、役から 札へ

★2026-09-14　★裁定 その53（★Opus・坂本さん 承認）

## 何を するか

★★11本の 決まり（RLS ポリシー）が、★いま「**役**」で 判じて います。

```
is_org_owner_or_admin(auth.uid(), org_id)
EXISTS ( ... m.role = ANY (ARRAY['owner','admin']) )
```

★★これを「**できること（札）**」で 判じる ように 移します。

```
has_can(org_id, 'meibo')
```

## 札の 割り当て

| # | 表 | 決まり | 何に | 札 |
|---|---|---|---|---|
| 1 | assignments | assignments_all_owner_admin | ALL | meibo |
| 2 | assignments | assignments_select | SELECT | meibo ★自分の枝 |
| 3 | enrollments | enrollments_all_owner_admin | ALL | meibo |
| 4 | memberships | memberships_delete_admin | DELETE | post |
| 5 | memberships | memberships_insert_bootstrap_owner | INSERT | post |
| 6 | memberships | memberships_select | SELECT | **post** ★自分の枝 |
| 7 | memberships | memberships_update_role_management | UPDATE | ★**触りません** |
| 8 | org_events | org_events_write_admin | ALL | gyoji |
| 9 | org_invitations | org_invitations_insert | INSERT | meibo |
| 10 | org_invitations | org_invitations_select | SELECT | meibo |
| 11 | org_messages | org_messages_insert | INSERT | renraku_all ★自分の枝 |
| 12 | org_messages | org_messages_select | SELECT | renraku_all ★自分の枝 |

## ★6番が `meibo` から `post` に 変わりました

★出どころ 裁定 その53。

★★この 表に **書く** 決まり（4・5・7）は ぜんぶ `post` です。
　★★`meibo` の 人が すべての 役を 読めると、
　　★名簿の 札が「権限の しくみを 覗く 窓」に なります。
★★自分の 行は、★左の 枝（`auth.uid() = user_id`）で これまでどおり 読めます。

## ★7番を 触らない わけ

★★`role_rank` が すでに 守って います（★裁定 その19）。
★★自分より 上の 役に 上げられない、という 守りです。★そのままに します。

## ★どうやって 移すか ── ★**字だけ 置き換えます**

★★まるごと 書き換えません。

```
いま  (auth.uid() = user_id OR is_org_owner_or_admin(auth.uid(), org_id))
あと  (auth.uid() = user_id OR has_can(org_id, 'post'))
                  ↑ ここは 1文字も 変わりません
```

★★台帳から いまの 条件文を 読み、★
　`is_org_owner_or_admin(auth.uid(), org_id)` という **字だけ** を
　`has_can(org_id, '札')` に 差し替えて、★作り直します。

★★だから「左の 枝を 落とす」ことが **構造として 起きません**。
　★★手で 書き写すと、★必ず どこかで 枝を 落とします。

## ★1部だけ、★別の 紙に します

★★8・11・12（`org_events` ／ `org_messages`）は、
　★関数では なく **字**で 判じて います ──
　`EXISTS ( ... m.role = ANY (ARRAY['owner','admin']) )`

★★置き換える 相手が ちがいます。
★★条件文の 全文を 見てから、★別の 紙で 直します。
　★★報告の 中では 長すぎて 切れて いました。
　★★紙の 第1部が、★全文を 出します。

## 流す 順番

1. **第1部**を 流す（★何も 変わりません）。★全文が 出ます
2. 出た ものを 見て、★8・11・12 の 形を 確かめる
3. **第2部**を 流す（★8本が 移ります）
4. **第3部**を 流す（★確かめ）
5. 8・11・12 は、★別の 紙で

## 実機で 確かめる こと（★坂本さん）

- 課長（`meibo` を 持つ）… 名簿が 見える
- オーナー（`meibo` を 持たない）… 名簿が **見えない**
- 学部長… 役職を 触れない
- **ご自分の 行**… どの 立場でも 見える（★左の 枝）

## ぐるぐる回り（42P17）に ついて

★★`has_can` は `SECURITY DEFINER` です。★RLS を 越えて 読みます。
★★だから `memberships` の 決まりの 中で 呼んでも 回りません。

## 権限（GRANT）

★★触りません。★決まり（POLICY）だけ です。

## 紙

`supabase/migration_A13_has_can_policies.sql`
