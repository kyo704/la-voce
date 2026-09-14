# 修正の記録 No.018 ── 先生の 招待コードが、誰にでも 見える

★見つけた日 2026-09-14（★Opus・本番の 台帳で）
★直した日 ────（★まだ 直して いません）

## 何が 起きて いるか

★★`teacher_invitations` に、★No.017 と **同じ 形**の 決まりが 2本 あります。

| 決まり | 何に | 誰に | 条件 |
|---|---|---|---|
| Anyone can look up an unused invitation by code | SELECT | `{public}` | `used_at IS NULL AND expires_at > now()` |
| Students can mark invitation as used | UPDATE | `{public}` | 同上 |

★★どちらも **`teacher_id` の しばりも `org_id` の しばりも ありません**。
★★いま 17行、★生きて いる ものは **0行** です。

## ★★Q1 の 答え ── ★**画面が 直に 読んで います**

★★`components/VocalTracker.jsx:11149`

```js
const { data, error } = await supabase.from("teacher_invitations")
  .select("code, teacher_id, expires_at, used_at")
  .eq("code", code).maybeSingle();
```

★★これは **コードを 確かめる 段**です。★同意の 前に 走ります。

★★`org_invitations` は 2026-09-02 に サーバへ 移りました。
★★**`teacher_invitations` は 移って いません。**
　★★移ったのは **在籍を 作る 段**だけ です（★2026-09-01・`/api/enrollment/accept`）。

### ★だから、★SELECT を いま 締めると 入口が 塞がります

★★生徒は まだ その 先生の 誰でも ありません。
　★★`has_can` でも `teacher_id = auth.uid()` でも、★生徒は 通りません。
　★★**0行が 返り**、★画面は「コードが 見つかりませんでした。」と 出します。
　★★コードは 正しいのに、です。

★★これは 一度 起きて います。★`app/api/org/invitation/lookup/route.js:10` に
　★その ときの 記録が 書いて あります。

## ★★Q2 の 答え ── ★UPDATE の 道は **死んで います**

★★`used_at` を 立てて いるのは、★**関数の ほう**です。

```sql
-- supabase/2026-09-04-rpc-functions.sql:105
-- accept_teacher_invitation(p_code text)  ★SECURITY DEFINER
update public.teacher_invitations
   set used_at = now(), used_by_student_id = auth.uid()
```

★★`SECURITY DEFINER` です。★決まりを 越えます。★この 決まりは 要りません。

★★画面からの update は、★**すでに 消して あります** ──
　★`components/VocalTracker.jsx:11278`

```
・used_at … ここからの update は★0行に当たっていました（#004）。
            生徒が、先生の行を更新しようとしていたためです。
            ★PostgREST では0行の更新はエラーになりません。無音でした。
```

★★おまけに、★Opus の ご指摘の とおり **自分で 自分を 否定して います** ──
　★名前は「使用済みに する」。★`with_check` は「`used_at IS NULL`」。
　★★この 決まりを 通って 使用済みに する ことは できません。

★★★**そのまま 落として 差し支え ありません。**

## ご提案 ── ★2段に 分けます

### 第1段（★いま すぐ できます）── UPDATE を 落とす

```sql
drop policy "Students can mark invitation as used" on public.teacher_invitations;
```

★★`accept_teacher_invitation` が 立てるので、★何も 壊れません。

### 第2段（★先に 道を 作ってから）── SELECT を 締める

★★先に、★`org_invitations` と 同じ **サーバの 道**を 作ります。

```
app/api/teacher/invitation/lookup/route.js
```

★★返す もの … `{ ok, code, teacherName, alreadyLinked }`
★★一覧は 返しません。★`teacher_id` も 返しません。

★★★`get_invitation_teacher` が すでに 半分 やって います。
　★`SECURITY DEFINER` で、★コードから 先生の 名前を 返します。
　★★これに `used_at` ／ `expires_at` の 判定を 足せば、
　　★**画面は この 表を 1度も 読まなく なります**。
　★★新しい 関数を 作らず、★あの 関数を 広げる 手も あります。

★★画面が 読まなく なってから、★決まりを 締めます ──

```sql
drop policy "Anyone can look up an unused invitation by code"
  on public.teacher_invitations;
create policy teacher_invitations_select on public.teacher_invitations
  for select to authenticated
  using ( auth.uid() = teacher_id );
```

## ★順番を まちがえると

★★決まりを 先に 締めると、★**招待が 使えなく なります**。
　★★しかも「コードが 見つかりません」と 出るので、
　　★先生も 生徒も 何が 起きたか 分かりません。

★★2026-09-01 に、★在籍で まったく 同じ ことが 起きました。
　★★`enrollments` が 全体で 0行の ままでした。

## この 調べが 見て いない こと

- 台帳の 決まりの 全文は 読めません。★Opus の ご報告に 拠って います。
- `teacher_invitations` の INSERT の 決まりは 見て いません。
  ★先生が コードを 作る 道です（★`components/VocalTracker.jsx:11132`）。
