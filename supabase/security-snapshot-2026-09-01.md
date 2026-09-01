# 権限まわりの写し（2026-09-01〜02）

**なぜこのファイルがあるのか。**
このリポジトリには、RLS のポリシーがほとんど書かれていません。
`supabase/schema.sql` にあるのは `profiles`・`subscriptions`・`entries` の3つだけで、
残りおよそ20の表は、Supabase の画面から手で当てられたものです。

★読めないものは、検査できません。
2026-09-02 に、その結果として**実際の情報漏れ**が見つかりました（下の①）。
検査（`components/tests/rls-null-bypass.test.js`）はリポジトリの中しか見られないので、
本番のポリシーをここに写しておかないと、同じことがまた起きます。

★このファイルは、本番の写しです。**正はデータベース側**です。
　変えたら、ここも更新してください。

---

## ① lessons の「org_id が null なら誰でも」 — ★直りました

### 何が起きていたか

4つのポリシーが、すべてこの形で始まっていました。

```
(org_id IS NULL) OR can_view_ops(auth.uid(), org_id, student_id)
```

PERMISSIVE のポリシーは OR で足し合わされます。`org_id` が null の行では
**左側が真になり、`can_view_ops` は一度も呼ばれません**。

紐付け経由で作ったレッスンは `org_id` が null です
（`handleCreateLesson` は `link_id`・`scheduled_at`・`note`・`created_by` しか入れません）。
つまり**先生と生徒の1対1のレッスンが、認証さえ通れば誰にでも見えていました**。

### 実地の確認（+s1 でログインして実行）

| | 直す前 | 直したあと |
|---|---|---|
| 見える行数 | 3 | **2** |
| ★自分のものでない行 | **1** | **0** |

★`service_role` では RLS を素通りするため、確かめになりません。
　必ず**ふつうの利用者のセッション**で実行してください。

### 直したもの

`supabase/migration_fix_lessons_org_null_policies.sql`（コミット `c3e8ec5`）

変えたのは1か所だけです。

```
(org_id IS NULL) OR …   →   (org_id IS NOT NULL) AND …
```

`org_id` が null の行は、**もともとある紐付けのポリシーに任せます**。

- `Teacher and student can view lessons`（SELECT）
- `Teacher can create lessons`（INSERT）
- `Teacher can update or delete lessons`（UPDATE）
- `Teacher can delete lessons`（DELETE）

★紐付けの判定を書き写していません。同じ判定が2か所になると、
　片方だけ直る日が来ます（この repo で何度も起きている壊れ方です）。

### can_view_ops は悪くありませんでした

```sql
CREATE OR REPLACE FUNCTION public.can_view_ops(viewer_id uuid, p_org_id uuid, p_student_id uuid)
 RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path TO 'public'
AS $$
  SELECT
    EXISTS (SELECT 1 FROM enrollments
             WHERE org_id = p_org_id AND student_id = p_student_id AND status = 'active')
    AND (
      is_org_owner_or_admin(viewer_id, p_org_id)
      OR EXISTS (SELECT 1 FROM assignments
                  WHERE org_id = p_org_id AND teacher_id = viewer_id
                    AND student_id = p_student_id AND ended_at IS NULL)
    )
$$;
```

「在籍していて、かつ（教室の管理者 または 担当の先生）」。正しく書かれています。
**手前の `(org_id IS NULL) OR` が、関数を呼ぶ前に素通りさせていた**だけです。

★ついでに分かったこと：`is_org_owner_or_admin` が入っているので、
　**教室の管理者は、すでに教室のレッスンを作れます**。
　「org 管理者にレッスンを作らせる」機能は、権限の面ではもう存在します。

---

## ② lessons のポリシー（2026-09-02 時点・直したあと）

| cmd | policyname | 条件 |
|---|---|---|
| SELECT | Teacher and student can view lessons | `teacher_student_links` で teacher か student |
| SELECT | Ops-visible lessons (org-based) | `org_id is not null AND (自分が生徒 OR can_view_ops)` |
| INSERT | Teacher can create lessons | `teacher_student_links` で teacher |
| INSERT | Teachers can create org lessons | `org_id is not null AND can_view_ops` |
| UPDATE | Teacher can update or delete lessons | `teacher_student_links` で teacher |
| UPDATE | Teachers can update or delete org lessons | `org_id is not null AND can_view_ops` |
| DELETE | Teacher can delete lessons | `teacher_student_links` で teacher |
| DELETE | Teachers can delete org lessons | `org_id is not null AND can_view_ops` |

---

## ③ entries — ★未確認（次の最優先）

報告されている内容（**まだ実地で確かめていません**）：

```
"Teachers can view active students entries" | SELECT |
EXISTS (SELECT 1 FROM teacher_student_links l
         WHERE l.teacher_id = auth.uid() AND l.student_id = entries.user_id
           AND l.status = 'active')
```

★もし本当なら、2026-09-01 の「共有の廃止は構造として済んでいる」という
　私の発言は**誤り**です。`get_student_entries` を消したのは
　**列を絞る入口**を消しただけで、**行そのものを読む道**が別に残っていた、
　ということになります。しかも `select("*")` はすべての列を返すので、
　**「先生に決して渡さない11列」も渡ります**。

`supabase/schema.sql` に書かれている `entries` のポリシーは1つだけです。

```sql
create policy "Users can manage own entries"
  using (auth.uid() = user_id) with check (auth.uid() = user_id);
```

つまり、報告されているポリシーが本当なら**手で当てられたもの**です。

### 確かめ方（★先生のセッションで。service_role では意味がありません）

```sql
select count(*) as "見える行数", count(distinct user_id) as "見えている人数"
  from public.entries;
```

「見えている人数」が 2 以上なら、確定です。

★`+t4` のアカウントが確認でき次第、いちばんに実行してください。

### 消しても、壊れるものはありません（コードは確認ずみ）

`from("entries")` を呼んでいる箇所は、すべて自分の行か、サーバ側です。

| 場所 | 範囲 |
|---|---|
| `VocalTracker.jsx:2203, 5282, 10620, 10630` | すべて `.eq("user_id", userId)` |
| `app/admin/page.js:102` | service_role（RLS を素通り） |
| `app/api/advice/route.js:57`、`cron/line-reminder:67` | サーバ側 |

`fetchStudentEntries` と `studentEntriesCache` は 2026-09-01 に削除ずみです。

---

## ④ account_deletions — ★これは正しい状態です

`rls_enabled = true` / `policy_count = 0`。
「誰も読めない」ように見えますが、**そう作ってあります**。

- 書くのは `purgeAccount`（`lib/accountDeletion.js:243`）— 管理者クライアント
- 読むのは `app/admin/page.js:161` — 同じく管理者クライアント（Server Component）
- **画面側のコードからは、1か所も触っていません**

この表は**時刻しか持ちません**。誰が消したかを知る手立てを作らない、という
決めごとが先にあります。ポリシーが0本なのは、その決めごとと合っています。

---

## ⑤ まだ集めていないもの

- [ ] すべての表のポリシー一覧（`pg_policies` 全件）
- [ ] `SECURITY DEFINER` の関数一覧と、その中身
- [ ] `anon` / `authenticated` へのテーブル権限（`information_schema.role_table_grants`）
- [ ] RLS が有効なのにポリシーが0本の表（`account_deletions` 以外にあるか）

★とくに最後の1つは、①と同じ性質の穴を探すためのものです。
