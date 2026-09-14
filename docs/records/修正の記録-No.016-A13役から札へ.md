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

---

## ★2026-09-14 追記 ── 流す 前の 4つ（★Opus の 見直し）

### ① `SECURITY DEFINER` だけでは、★RLS を 越えません

★★越えるのは、★**関数の 持ち主が 表の 持ち主**だから です。

★★`memberships` に `relforcerowsecurity = true` が 立って いると、
　★**持ち主にも RLS が かかります**。
　★★その ときは `memberships_select` の 中で `has_can` を 呼ぶと、
　　★`memberships` を 読む → 決まりが 走る → また `has_can` …と 回ります（★42P17）。

★★★1つでも `true` が 出たら、★**第2部を 流さないで ください**。

### ② 出すだけでは 戻せません

★★第1部は **出すだけ** です。★紙に 出た ものは 戻す 道では ありません。
★★だから、★台帳の 中に 控えの 表を 作ります ── `public._a13_policy_backup`。
　★★12本 ぜんぶ 控えます（★触らない 7番も 含めて）。

### ③ 字が ちがう ことが あります

★★台帳は 条件文を 書き直して 返す ことが あります ──
　`is_org_owner_or_admin(auth.uid(), assignments.org_id)`（★表の 名前が 付く）

★★その ときは 置き換えが 起きず、★「飛ばしました」と 出ます。
　★★**それは 誤りでは なく 合図です。**
★★★字を 当てずっぽうで 直さないで ください。
　★出た 字を そのまま お知らせください。

### ④ 役の 名前を 包みます

★★`to` の あとの 役の 名前を、★1つずつ 引用符で 包む ように しました。
　★★包まないと、★引用が 要る 名前が あった ときに 壊れます。

## ★流した あと（★確かめ）

- `tools/perm-matrix.js` を 流す。★食いちがい **33 → いくつ** かを 報告
- 第3部③は **8・11・12 だけ** が 出る はず。★ほかが 出たら 報告
- 実機
  - 課長（`meibo` あり・staff）… 通る
  - オーナー（`meibo` なし）… 通らない
  - 学部長… 役職を 触れない
  - ★**ご自分の 行**は どの 立場でも 見える

## ★★6番が いちばん 危ない ところ

★★`memberships_select` を `meibo` から `post` に 変えました。

★★**`meibo` だけ 持って いて `post` を 持たない 人**が、
　★職員の 一覧を 見る 画面が あるかも しれません。
　★例 … 事務が 職員を 見る／名簿の 画面に 先生が 並ぶ

★★**白くなったら、★戻さずに 報告して ください。**
　★★Opus が 判じ直します。

---

## ★2026-09-14 ── `org_messages_select` の 事故

### 起きた こと（★坂本さんの ご報告）

★★`org_messages_select` の 読める条件が、★丸ごと
　`has_can(org_id, 'renraku_all')` に 置き換わりました。

★★消えた 枝が 2つ ──
- 自分の 分　　　`auth.uid() = teacher_id`
- 担当の 生徒の 分　`EXISTS (... assignments ...)`

★★すぐ 気づいて、★控えから 戻され、★手で 直されました。
★★いまの 本番は 正しい 形です。

### ★この 紙が 原因では ありません

★★確かめました。★**この 紙の 第2部は `org_messages` を 1度も 触りません。**

```
第2部に org_messages の 字: 0
第2部の 置き換えは replace() だけか: True
第2部に regexp_replace: 0
```

★★第2部が 触るのは、★`v_map` に 名前の ある **8本だけ** です ──
`assignments_all_owner_admin` ／ `assignments_select` ／
`enrollments_all_owner_admin` ／ `memberships_delete_admin` ／
`memberships_insert_bootstrap_owner` ／ `memberships_select` ／
`org_invitations_insert` ／ `org_invitations_select`

★★`org_messages` の 2本（11・12）は、★**わざと 外して あります**。
　★★あの 2本は 関数では なく `EXISTS (... role IN ...)` の 字で 判じます。
　★★置き換える 相手が ちがう ので、★別の 紙で、と 書いて ありました。

★★また、★この 紙は `replace()`（★字の 部分置き換え）しか 使いません。
　★条件文を 丸ごと 入れ替える 書き方は、★1か所も ありません。

★★★つまり、★流されたのは **別の SQL** です。

### それでも、★見張りを 中に 入れました

★★原因が ちがっても、★同じ ことが 二度と 起きない ように します。

★★作り直す 前に、★`auth.uid()` の **回数**を 数えます。
　★★1つでも 減って いたら、★**その場で 止めます**。

```sql
if (新しい条件文の auth.uid() の数) < (もとの条件文の auth.uid() の数) then
  raise exception '★止めました：% の 読める条件から auth.uid() が 減ります。';
end if;
```

★★読める条件・書ける条件の 両方で 見ます。

★★これで、★どんな 置き換え方を しても、
　★**自分の 枝が 減る 作り直しは 通りません**。

### いまの 進み具合

| # | 決まり | 状態 |
|---|---|---|
| 1〜6, 9, 10 | 8本 | ★第2部で 移し済み |
| 7 | memberships_update_role_management | ★触りません（`role_rank` が 守る） |
| 8 | org_events_write_admin | ★まだ（`EXISTS` の 形） |
| 11 | org_messages_insert | ★まだ（`EXISTS` の 形） |
| 12 | org_messages_select | ★**手で 移し済み**（★事故の あと） |

★★12番は、★坂本さんが 手で 直された 形が 正です ──

```
((auth.uid() = teacher_id) OR (EXISTS ( ... assignments ... ))
  OR has_can(org_id, 'renraku_all'::text))
```

★★残るのは **8番と 11番** です。★別の 紙で 直します。

### 試し用の 企画への 適用

★★直した 紙が できてから、と 伺って います。
★★`tools/perm-matrix.js` も、★それまで 止めます。

