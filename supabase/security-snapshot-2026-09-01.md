# 権限まわりの写し（2026-09-01〜02）

> **2026-09-02 時点：見つかった2件は、どちらも直って、確かめ終わっています。**
>
> | | 直す前 | 直したあと | 確認 |
> |---|---|---|---|
> | lessons（他人のレッスンが見える） | 自分のものでない行 **1** | **0** | +s1 のセッション |
> | entries（先生が生徒の記録を読める） | 見える生徒の記録行数 **1** | **0** | +t5 のセッション |
>
> どちらも `service_role` ではなく、**ふつうの利用者のセッション**で数えました。

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

## ③ entries — ★直りました（2026-09-02 確認ずみ）

**+t5（+s1 とつながっている先生）のセッションで実行した結果：**

| | 直す前 | 直したあと |
|---|---|---|
| 見える生徒の記録行数 | **1** | **0** |

**生徒の記録が、先生から直接読めていました。いまは読めません。**

直し：`supabase/migration_drop_teacher_entries_policy.sql`（コミット `74842f5`）

残っていたポリシー：

```
"Teachers can view active students entries" | SELECT |
EXISTS (SELECT 1 FROM teacher_student_links l
         WHERE l.teacher_id = auth.uid() AND l.student_id = entries.user_id
           AND l.status = 'active')
```

★2026-09-01 の「共有の廃止は構造として済んでいる」という私の発言は、
　**誤りでした**。`get_student_entries` を消したのは
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

★2026-09-02、実行して **0 になることを確認しました**。

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

## ④-2 org_events / org_event_participants（2026-09-02 に作成）

本番から写したもの。**正はデータベース側です。**

| tablename | policyname | cmd | qual | with_check |
|---|---|---|---|---|
| org_event_participants | org_event_participants_own | ALL | `auth.uid() = user_id` | `auth.uid() = user_id` |
| org_events | org_events_write_admin | ALL | `EXISTS(memberships m WHERE m.org_id=org_events.org_id AND m.user_id=auth.uid() AND m.role = ANY('{owner,admin}'))` | **null** |
| org_events | org_events_select_member | SELECT | `EXISTS(memberships …) OR EXISTS(enrollments … status='active')` | null |

### ★確かめたこと・確かめていないこと

- `org_events.org_id` は **NOT NULL**。①の「(列 IS NULL) OR …」の形は**入りようがありません**。
- `org_events_select_member` の `OR` は、**どちらも所属を確かめる式**です。
  ①のように、片方が無条件に真になることはありません。
- `org_event_participants` は**本人の行だけ**。
  ★誰が出ると印をつけたかは、**同じ組織の人にも見えません**。
- ★`org_events_write_admin` は `FOR ALL` で `with_check` が **null** です。
  PostgreSQL は「WITH CHECK を省くと USING を使う」とされていますが、
  **今日2件、ポリシーの挙動についての思い込みが外れています**。
  → 下の手順で、**実地に確かめること**。

### ★INSERT が本当に止まるかの確かめ方

```sql
begin;
-- ★claims を先、role をあとに。逆にすると auth.uid() が null になり、
--   「止まった」ように見えて実は別の理由、という誤診になります（今日1回やりました）。
select set_config('request.jwt.claims',
  '{"sub":"<+s1 の uuid>","role":"authenticated"}', true);
set local role authenticated;

select auth.uid() as "★+s1 になっているか";

-- ★これは失敗するはずです（+s1 は membership を持たない在籍者）
insert into public.org_events (org_id, event_date, kind, title)
values ('<その教室の uuid>', current_date, 'その他', '権限の確認');
rollback;
```

**期待：`new row violates row-level security policy`（42501）。**
成功してしまったら、`with_check` を明示する必要があります。

---

## ④-3 memberships と、役割の書き換え（2026-09-02・★2件確認ずみ／6件未確認）

### 実地で確かめたこと（2026-09-02・最終）

| 場面 | 結果 |
|---|---|
| ⑥ オーナーが講師を「教室の責任者」にする | **通った** |
| ② 責任者がオーナーの役割を変える | **止まった** |

**この2つは、確かめ終わっています。**
攻撃の道は塞がり、ふつうの教室運営は動く、という状態です。

### 何が起きていたのか（解けました）

止めていたのは `memberships_update_self_only` でした。
リポジトリのどこにも無い、手で当てられたポリシーです。

★この1本で、今日の2つの観察が**同時に**説明できます。

- 責任者がオーナーを降格できなかった（＝攻撃が止まった、ように見えた）
- オーナーが責任者を任命できなかった（＝そのあと出た不具合）

つまり**権限の昇格は、DB では起きていなかった**可能性が高いです。
UPDATE は最初から「自分の行だけ」で、
★危なかったのは**画面のほうだけ**だった、ということになります。
役割の選択欄がオーナーの行にも出ていたので、できるように見えていました。

→ `supabase/migration_fix_memberships_update_policy.sql` で、
　 その1本を置き換えました（許すほうと止めるほうを、別々の2本に分けています）。

### ★まだ確かめていない6つ

★「止まった」ことだけを数えると、**締めすぎ**を見落とします。
　実際、①〜⑤だけを見て済ませたために、
　⑥（任命できない）を一度見落としました。

| | 場面 | 期待 |
|---|---|---|
| ① | 責任者が自分を owner に | 0行 |
| ③ | ★共同オーナーAがBを降格 | 0行 |
| ④ | オーナーが自分で降りる | **1行** |
| ⑤ | ★最初の1人（教室を作る） | **1行** |
| ⑦ | 責任者を講師に戻す | **1行** |
| ⑧ | 講師が自分を責任者に | 0行 |

★とくに⑤です。
　最後の移行で、INSERT のポリシーを**書き換えています**
　（「オーナーが2人目のオーナーを足す」道を外しました）。
　bootstrap の条件はそのまま残したつもりですが、**確かめていません**。
　★ここが壊れていると、**誰も新しい教室を作れません**。
　いちばん重い壊れ方で、しかも試さないと分かりません。

→ `supabase/check_owner_role_protection.sql`（8場面・すべて rollback）

### ポリシー名の食い違いについて（★解決しました）

報告に出てきたポリシー名は `memberships_update_self_only` でした。
★これは私が書いたものではありません。
私が用意した3本は、名前がこうです。

```
memberships_restrict_owner_row_update
memberships_restrict_owner_row_delete
memberships_restrict_role_insert
```

つまり、次の2つのどちらかです。

1. `supabase/migration_protect_owner_role.sql` は★まだ実行されていない。
   止めたのは★もともと本番にあった別のポリシーである。
2. 名前を言い換えただけで、実際には実行されている。

★1 だとすると、話が変わります。
`memberships_update_self_only` という名前が本当なら、UPDATE は
**もとから本人の行だけ**だったことになります。それなら権限の昇格は
最初から存在せず、危なかったのは画面だけ、ということになります。

★ただし、そのときは別の疑問が出ます。
UPDATE が本人の行だけなら、★オーナーが講師を「教室の責任者」に
任命することもできないはずです。最初の報告では任命できています。
**この2つは、両方は成り立ちません。** どちらかの前提が違っています。

→ `supabase/check_admin_can_demote_owner.sql` の①（ポリシー一覧）が要ります。

### ★確かめられていない場面

実地で試したのは「責任者 → オーナー」の1件だけです。残り4つは未確認です。

| | 場面 | 期待 |
|---|---|---|
| ① | 責任者が自分を owner に | 0行 |
| ② | 責任者がオーナーを降格 | 0行（★これだけ確認ずみ） |
| ③ | ★共同オーナーAがBを降格 | 0行 |
| ④ | ★オーナーが自分で降りる | **1行**（0行なら締めすぎ） |
| ⑤ | ★最初の1人（教室を作る） | **1行**（0行なら誰も作れない） |

★④と⑤は「守れているか」ではなく「壊していないか」を見るものです。
　⑤が0行なら、★新しい教室を誰も作れません。いちばん重い壊れ方です。
　止まったことだけを確かめて終わりにすると、これを見落とします。

→ `supabase/check_owner_role_protection.sql`（5場面ぶん・すべて rollback）

---

## ⑤ ★2回とも、同じ形でした

| | lessons | entries |
|---|---|---|
| 手で当てたポリシー | ✓ | ✓ |
| リポジトリから見えたか | **見えない** | **見えない** |
| 検査で捕まえられたか | **できない** | **できない** |
| 見つけ方 | 実地の数え上げ | 実地の数え上げ |

**どちらも、ソースを読んでいるかぎり永久に見つかりません。**
見つけたのは、実際のセッションで**行を数えた**からです。

★だからこのファイルがあります。写しが無いかぎり、3回目も同じ見つかり方をします。

★入れた見張り
- `components/tests/rls-null-bypass.test.js` … 「(列 IS NULL) OR …」の形
- `components/tests/no-teacher-entries-access.test.js` … entries への先生向けの道

★どちらもリポジトリの中しか見られません。**本番の確認の代わりにはなりません。**

---

## ⑥ まだ集めていないもの

- [ ] すべての表のポリシー一覧（`pg_policies` 全件）
- [ ] `SECURITY DEFINER` の関数一覧と、その中身
- [ ] `anon` / `authenticated` へのテーブル権限（`information_schema.role_table_grants`）
- [ ] RLS が有効なのにポリシーが0本の表（`account_deletions` 以外にあるか）

★とくに最後の1つは、①と同じ性質の穴を探すためのものです。
