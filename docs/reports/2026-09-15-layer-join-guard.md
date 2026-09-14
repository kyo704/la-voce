# 2つの 層を 混ぜない ための 見張り
全128行 / 末尾は「  ★★これは 字では 追えません。★作る ときの 決めで 守ります。」

★出どころ 2026-09-14、★裁定 その55／その57（★Opus・坂本さん 承認）

## なぜ 要るか

★★弁護士の 確認を **取らない** と お決めに なりました。
★★だから、★分けて ある ことを **機械で** 守ります。★気持ちでは 守りません。

★★裁定 その55 の 言葉 ──
　★★もし 突合の 読み方が 誤って いても、
　　★「1つの 鍵で しまって いた」までで 留まります。
　　★「混ぜた」には なりません。
　★★直せる 指摘と、★形が 壊れて いる ことの ちがいです。

## 何を 禁じるか

★★`entries`（★体調の 層）と、★学校の 層を、
　★**1つの 問い・1つの 関数**で 一緒に 読む こと。

| | 表 |
|---|---|
| 体調の 層 | `entries` ／ `cycle_periods` |
| 学校の 層 | `enrollments` ／ `memberships` ／ `assignments` ／ `organizations` ／ `org_events` ／ `org_invitations` ／ `org_messages` ／ `org_posts` ／ `org_message_reads` ／ `teacher_student_links` ／ `teacher_invitations` ／ `lessons` ／ `attendance` ／ `notice_targets` |

★★★`cycle_periods` を 体調の 層に 入れました。
　★★裁定は `entries` と 書いて います。★けれど 周期の 記録も 体調です。
　★★狭く するより 広く します。★外す なら お決めを ください。

★★だめな 例
- `JOIN entries ON enrollments`
- 学年別／門下別／先生別 の 体調の 数
- 「3年生の 記録率」── ★これも つなぎ合わせ です

★★よい 例
- 学校の 層どうしを つなぐ（★名簿と 出欠、名簿と 日程）
- ★1人の 方が ご自分の ものを 書き出す

## ★名前では なく 表で 見ます

★★名前で 見ると、★別の 名前の 関数が 素通りします。
★★だから、★**どの 表を 読むか** で 判じます。

## いまの 数え

```
★体調の 層: entries, cycle_periods
★学校の 層: enrollments, memberships, assignments, organizations, org_events, org_invitations, org_messages, org_posts, org_message_reads, teacher_student_links, teacher_invitations, lessons, attendance, notice_targets, org_master

① 台帳の 関数・ビュー
　★生きて いる 紙で 混ざって いる: 0
  ✓ ありません
　★片づけた 紙: 1
  （get_student_entries  supabase/retired/DO_NOT_RUN_2026-09-01_teacher_student_entries_rpc.sql）

② 画面・サーバの 1つの 問い
　★混ざって いる: 0
  ✓ ありません

★★のけて いる ファイル（★1人の 方の ものを 集める ところ）
  ・lib/exportData.js
  ・lib/accountDeletion.js
  ・lib/backupTables.js
  ・lib/authUserReferences.js
  ・lib/orgClosure.js

★★通りました。★層は 分かれて います。

★★この 見張りが 見て いない こと
　★字の 並びだけ を 見ます。★台帳に 直に 作った 関数は 見えません。
　★1つの 問いの 終わりを、★`;` か 次の `.from(` で 決めて います。
　★2つの 問いの 結果を、★あとで JavaScript で つなぐ ことは 見えません。
```

## ★のけて いる ファイル（★5つ）

| ファイル | わけ |
|---|---|
| `lib/exportData.js` | ご自分の 書き出し |
| `lib/accountDeletion.js` | 退会の ときに 消す 表の 並び |
| `lib/backupTables.js` | 控えの 表の 並び |
| `lib/authUserReferences.js` | 人の id を 持つ 列の 並び |
| `lib/orgClosure.js` | 教室を 閉じる ときの 表の 並び |

★★どれも「★その 方 1人の ものを 集める」ところです。
　★★つなぎ合わせでは ありません。★同じ 人の ものを 並べるだけ です。

## ★道具を 校正しました

★★通る ことだけを 見ると、★**何も 見て いない 道具でも 通ります**。

★★だから、★わざと 混ぜた ものを 置いて、★見つけられるかを 確かめました。

```js
s.from("entries").select("date, enrollments(grade_label)")
```

```sql
select 1 from public.entries e join public.memberships m on m.user_id = e.user_id;
```

★★どちらも **名指しで 出ました**。★落ちました。
★★片づけると、★また 通りました。

★★見張り `components/tests/layer-join.test.js` が、★毎回 この 校正を します。

## この 見張りが 見て いない こと

- ★台帳に **直に 作った** 関数は 見えません。★紙だけ です。
  ★★台帳の ほうは、★`SECURITY DEFINER` の 棚おろしと 同じ 問いで 見ます ──

```sql
select p.proname,
       pg_get_functiondef(p.oid) like '%entries%'      as 体調を読む,
       pg_get_functiondef(p.oid) like '%enrollments%'
       or pg_get_functiondef(p.oid) like '%memberships%'
       or pg_get_functiondef(p.oid) like '%org\_%'      as 学校を読む
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public'
 order by p.proname;
```

★★**両方 true の 行が 出たら**、★その 場で お知らせください。

- 1つの 問いの 終わりを、★`;` か 次の `.from(` で 決めて います。
- 2つの 問いの 結果を、★あとで JavaScript で つなぐ ことは 見えません。
  ★★これは 字では 追えません。★作る ときの 決めで 守ります。
