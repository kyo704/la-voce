# 修正の記録 No.017 ── 招待コードが、誰にでも 見える

★見つけた日 2026-09-14（★Opus・本番の 台帳で）
★直した日 ────（★まだ 直して いません）

## 何が 起きて いるか

★★`org_invitations_select` の 条件が こうです ──

```
(has_can(org_id, 'meibo') OR (used_at IS NULL AND expires_at > now()))
```

★★右の 枝に、★**`org_id` の しばりが ありません**。

★★だから、★ログインして いる 人なら **誰でも**、
　★**どの 学校の 招待コードでも** 読めます。
　★★生きて いる（★未使用・期限内の）ものは 全部 です。

★★この 表には `code` の 列が あります。

## なぜ いま 重いか

★★裁定 その52／その56 で、★**招待コードが 入口に なりました**。
　★★学校は 名簿を 渡しません。★コードを 配ります。
　★★その コードが 外から 一覧できる なら、★入口が 開いた ままです。

## ★これは 片づけ残しでは ありません

★★9月14日に 片づけた `get_student_entries` の 紙は、
　★**台帳に 無い もの**でした。

★★こちらは **いま 効いて いる 決まり**です。★開いて います。

## 何が この 表を 読んで いるか（★調べました）

### ★画面から 直に 読む ところ ── ★**1つも ありません**

```
grep 'from("org_invitations").select' components lib → 0件
```

### 画面から **書く** ところ ── 1つ

```js
// components/VocalTracker.jsx:12078
const { error } = await supabase.from("org_invitations")
  .insert({ code, org_id: orgId, invited_by: userId, expires_at: expiresAt });
```

★★`.select()` を 付けて いません。★返り値を 求めません。
　★★だから、★**読む 権限が 無くても 動きます**。

### サーバから 読む ところ ── 2本。★どちらも **裏方の 鍵**

| 場所 | 何に |
|---|---|
| `app/api/org/invitation/lookup/route.js:46` | コードを 確かめる |
| `app/api/org/invitation/accept/route.js:55, 110, 130` | 参加する／使い済みに する |

★★どちらも `createAdminClient()`（★service role）です。
　★★**RLS を 越えます。**★決まりを 締めても 影響を 受けません。

★★`lookup` が 返すのは これだけ です ──

```js
{ ok: true, code, orgId, orgName, alreadyMember }
```

★★一覧は 返しません。★誰が 招待したかも 返しません。

## ★答え ── ★締めても 壊れません

★★お尋ねの「★画面から コードで 読んで いるか」── ★**読んで いません**。

★★すでに 2026-09-02 に、★サーバへ 移して あります。
　★`app/api/org/invitation/lookup/route.js:10` に わけが 書いて あります ──
　「★これまでは画面から org_invitations を直接読んでいました。…
　　★エラーではなく0行が返り、…★コードは正しいのに、です。」

★★つまり、★**`SECURITY DEFINER` の 関数を 新しく 作る 必要も ありません**。
　★★サーバの 道が すでに その 役を しています。

## ご提案

```sql
-- ★右の 枝を 落とすだけ です。
drop policy org_invitations_select on public.org_invitations;
create policy org_invitations_select on public.org_invitations
  for select to authenticated
  using ( has_can(org_id, 'meibo') );
```

★★`meibo` を 持つ 人だけが、★**自分の 学校の** 招待を 見られます。
★★招待される 人は、★サーバの 道を 通ります。★変わりません。

## ★流す 前に 見て いただきたい こと

★★いまの 条件文の **全文**を、★もう一度 出して ください。
　★★私は `pg_policies` を 読めません。

```sql
select policyname, qual, with_check, roles, permissive
from pg_policies
where schemaname='public' and policyname='org_invitations_select';
```

★★`roles` が `authenticated` 以外を 含む なら、★そこも 合わせます。

## ★確かめ方（★流した あと）

| 試す こと | 期待 |
|---|---|
| `meibo` を 持つ 人が 自分の 学校の 招待を 読む | 見える |
| `meibo` を 持たない 人が 読む | ★0行 |
| ほかの 学校の 招待を 読む | ★0行 |
| コードを 入れて 参加する | ★これまでどおり できる |

★★いちばん 下が 大事です。★入口を 塞いで いない ことを 確かめます。

## この 調べが 見て いない こと

- 試し用の 企画に 招待が 1件も 無く、★**穴を 実際に 見せられて いません**。
  ★構造から 言って います。★1件 置いて いただければ 実地で 示せます。
- `org_invitations` の INSERT／UPDATE の 決まりは 見て いません。

---

## ★★1つだけ、★わざと 通して います（★2026-09-14・No.020 ④）

★`can_view_organization` は、★いまも 生きて いる 招待を 読みます ──

```sql
OR EXISTS (select 1 from org_invitations
           where org_id = p_org_id and used_at is null
             and expires_at > now())
```

★★`SECURITY DEFINER` なので、★ここで 締めた 決まりは **効きません**。

★★★これは 見落としでは ありません。★関数の 中に そう 書いて あります ──
　「★招待コードを 確認中の 人にも、★教室名 だけは 見せる」

★★お裁き（★Opus・2026-09-14）── **このまま 残します。**
　★漏れるのは 教室の **名前 だけ**。★しかも 生きて いる 招待の ある 教室 だけ。

> ★No.017 で 決まりは 閉じたが、★`can_view_organization` **だけは 意図的に 通す**。

★★あとから 読んだ 方が「★見落とし だ」と 思わない ため、★ここに 置きます。
