# 記録 ── lessons の UPDATE は、決まりではなく「列の権限」で狭めてあります
全95行 / 末尾は「片方だけ拾うと、個人指導だけの方には何も出ません。」

- 日付 … 2026-09-15
- 出どころ … Opus（本番の `pg_policy` と `role_table_grants` を直接照会）
- なぜ書くか … ★決まりだけを見た人が、必ず驚くからです

## 1. 決まりだけを見ると、危なく見えます

`lessons` には、こういう決まりがあります。

```
[UPDATE] lessons_student_notice
  using:      auth.uid() = student_id
  with check: auth.uid() = student_id
```

読むと、こう見えます ──
「生徒は、自分のレッスンの行を**どの列でも**書き換えられる」。
日時も、先生も、教室も。

**そうではありません。**

## 2. 実際は、5列しか書けません

`authenticated` が持っている UPDATE の権限は、この5列だけです。

```
attendance / attendance_at / attendance_by / student_notice / student_notice_at
```

`date` にも `time` にも `teacher_id` にも `org_id` にも、
**UPDATE の権限がありません**。

だから、日時を書き換えようとすると
`42501 permission denied` で止まります。
★RLS の決まりに届く前に、権限の段で止まります。

## 3. ★なぜこの順番が効くのか

列ごとの GRANT は、**先に表ごとの権限を取り上げてから**でなければ効きません。
広いほうが黙って勝つからです。

`supabase/2026-09-08-レッスンの出欠.sql` は、その順で書いてあります。

```sql
revoke update on public.lessons from authenticated;
grant update (attendance, attendance_at, attendance_by) on public.lessons to authenticated;
```

`migration_identity_columns_immutable.sql` も同じ形です
（`revoke update` → `grant update (held)`）。

## 4. 同じ形が、ほかにもあります

`memberships.post_id` と `memberships.display_title` です。
「その人について、他人が付けた値」なので、本人には書かせません。
決まりではなく、列の権限で止めています。

★この蔵の決めです ──「書ける道は絞る」。

## 5. ★未来の読み手へ

`lessons_student_notice` の決まりだけを見て、「穴がある」と報告しないでください。
**必ず、列ごとの権限も一緒に見てください。**

```sql
select table_name as "表", grantee as "誰が", column_name as "列", privilege_type as "何を"
from information_schema.column_privileges
where table_schema = 'public' and table_name = 'lessons' and privilege_type = 'UPDATE'
order by grantee, column_name;
```

★そして、紙（`supabase/*.sql`）だけで結ばないでください。
同じ日に、`lessons` の SELECT で一度まちがえています
（`docs/records/訂正-2026-09-15-lessonsの決まりを紙だけで結んだ.md`）。

## 6. 教室の殻をつくるときの注意（★Opus より）

`lessons` の SELECT の決まりは**2つ**あります。

| 決まり | 生徒への届き方 |
|---|---|
| `Ops-visible lessons (org-based)` | `org_id is not null` かつ `auth.uid() = student_id` |
| `Teacher and student can view lessons` | `teacher_student_links` 経由（`link_id`）。★`org_id` の条件なし |

★2つ目は `link_id` で当たります。`student_id` で直接ではありません。

つまり ──

- 個人指導のレッスン（`org_id` が null）… 2つ目の決まりで届きます
- 教室のレッスン … どちらでも届きます

★「次のレッスン」をつくるとき、**両方を拾うか、どちらを出しているか書く**こと。
片方だけ拾うと、個人指導だけの方には何も出ません。
