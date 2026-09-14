# ★役割に 寄る 決まり ── ★1本ずつ

★この 紙は tools/policy_inventory.py が 書き出します。★手で 書いて いません。

★★台帳に **実際に 立って いる** 決まりです（★pg_policies）。
　★★帳面の 字の ほうは 別の 紙です ──
　★docs/reports/2026-09-13-役割に寄る-帳面の字.md

★★**決めて いません。** ★添えた 鍵は lib/opsPerms.js の 名前です。
　★★お決めは Opus と 坂本さんの ものです。

## ★数

- 決まり　**12 本**
- 表　　　**6**　（assignments／enrollments／memberships／org_events／org_invitations／org_messages）

★★この 2つが、★安全管理の 書類に 書く 母数です。

## ★1本ずつ

| 表 | 決まり | 何に | あたりそうな 鍵 | 見立て |
|---|---|---|---|---|
| assignments | `assignments_all_owner_admin` | ALL | meibo | ★★できことへ 移す 候補 |
| assignments | `assignments_select` | SELECT | meibo | ★★できことへ 移す 候補 |
| enrollments | `enrollments_all_owner_admin` | ALL | meibo | ★★できことへ 移す 候補 |
| memberships | `memberships_delete_admin` | DELETE | post | ★★できことへ 移す 候補 |
| memberships | `memberships_insert_bootstrap_owner` | INSERT | post | ★★できことへ 移す 候補 |
| memberships | `memberships_select` | SELECT | meibo | ★★できことへ 移す 候補 |
| memberships | `memberships_update_role_management` | UPDATE | post | ★そのまま |
| org_events | `org_events_write_admin` | ALL | gyoji | ★★できことへ 移す 候補 |
| org_invitations | `org_invitations_insert` | INSERT | meibo | ★★できことへ 移す 候補 |
| org_invitations | `org_invitations_select` | SELECT | meibo | ★★できことへ 移す 候補 |
| org_messages | `org_messages_insert` | INSERT | renraku_all | ★★できことへ 移す 候補 |
| org_messages | `org_messages_select` | SELECT | renraku_all | ★★できことへ 移す 候補 |

★★できことへ 移す 候補　**11 本**

★★★「候補」の 中にも、★自分の 行を 見る 枝が **一緒に 入って います**。
　★★例 `memberships_select` ── `auth.uid() = user_id OR is_org_owner_or_admin(...)`
　★★直すのは **右の 枝だけ** です。★左の 枝（★自分の 行）は 触りません。
　★★まるごと 置き換えると、★ご自分の 行が 読めなく なります。

## ★条件の 本文（★1本ずつ）

### `assignments_all_owner_admin`　（assignments ／ ALL）

```
読める 条件　is_org_owner_or_admin(auth.uid(), org_id)
書ける 条件　(is_org_owner_or_admin(auth.uid(), org_id) AND (COALESCE(( SELECT o.org_id FROM assignments_old_identity(assignments.id) o(org_id, teacher_id, student_id)), org_id) = org_id) AND (COALESCE(( SELECT o.teacher_id FROM assignments_old_identity(assignments.id) o(org_id, teacher_id, student_id)), teacher_id) = teacher_id) AND (COALESCE(( SELECT o.student_id FROM assignments_old_identity(assignments.id) o(org_id, teacher_id, student_id)), student_id) = student_id))
```

### `assignments_select`　（assignments ／ SELECT）

```
読める 条件　((auth.uid() = teacher_id) OR (auth.uid() = student_id) OR is_org_owner_or_admin(auth.uid(), org_id))
書ける 条件　（無し）
```

### `enrollments_all_owner_admin`　（enrollments ／ ALL）

```
読める 条件　is_org_owner_or_admin(auth.uid(), org_id)
書ける 条件　is_org_owner_or_admin(auth.uid(), org_id)
```

### `memberships_delete_admin`　（memberships ／ DELETE）

```
読める 条件　(is_org_owner_or_admin(auth.uid(), org_id) AND (role <> 'owner'::text))
書ける 条件　（無し）
```

### `memberships_insert_bootstrap_owner`　（memberships ／ INSERT）

```
読める 条件　（無し）
書ける 条件　((user_id = auth.uid()) AND (role = 'owner'::text) AND (EXISTS ( SELECT 1 FROM organizations o WHERE ((o.id = memberships.org_id) AND (o.created_by = auth.uid())))) AND (NOT (EXISTS ( SELECT 1 FROM memberships m WHERE (m.org_id = memberships.org_id)))))
```

### `memberships_select`　（memberships ／ SELECT）

```
読める 条件　((auth.uid() = user_id) OR is_org_owner_or_admin(auth.uid(), org_id))
書ける 条件　（無し）
```

### `memberships_update_role_management`　（memberships ／ UPDATE）

```
読める 条件　((auth.uid() = user_id) OR (is_org_owner_or_admin(auth.uid(), org_id) AND (role <> 'owner'::text)))
書ける 条件　CASE WHEN (auth.uid() = user_id) THEN (role_rank(role) <= role_rank(( SELECT m.role FROM memberships m WHERE (m.id = memberships.id)))) ELSE (role <> 'owner'::text) END
```

### `org_events_write_admin`　（org_events ／ ALL）

```
読める 条件　(EXISTS ( SELECT 1 FROM memberships m WHERE ((m.org_id = org_events.org_id) AND (m.user_id = auth.uid()) AND (m.role = ANY (ARRAY['owner'::text, 'admin'::text])))))
書ける 条件　(EXISTS ( SELECT 1 FROM memberships m WHERE ((m.org_id = org_events.org_id) AND (m.user_id = auth.uid()) AND (m.role = ANY (ARRAY['owner'::text, 'admin'::text])))))
```

### `org_invitations_insert`　（org_invitations ／ INSERT）

```
読める 条件　（無し）
書ける 条件　is_org_owner_or_admin(auth.uid(), org_id)
```

### `org_invitations_select`　（org_invitations ／ SELECT）

```
読める 条件　(is_org_owner_or_admin(auth.uid(), org_id) OR ((used_at IS NULL) AND (expires_at > now())))
書ける 条件　（無し）
```

### `org_messages_insert`　（org_messages ／ INSERT）

```
読める 条件　（無し）
書ける 条件　((auth.uid() = author_id) AND (((teacher_id IS NOT NULL) AND ((auth.uid() = teacher_id) OR (EXISTS ( SELECT 1 FROM assignments a WHERE ((a.org_id = org_messages.org_id) AND (a.student_id = auth.uid()) AND (a.teacher_id = org_messages.teacher_id) AND (a.ended_at IS NULL)))))) OR ((teacher_id IS NULL) AND (EXISTS ( SELECT 1 FROM memberships m WHERE ((m.org_id = org_messages.org_id) AND (m.user_id = auth.uid()) AND (m.role = ANY (ARRAY['owner'::text, 'admin'::text]))))))))
```

### `org_messages_select`　（org_messages ／ SELECT）

```
読める 条件　((auth.uid() = teacher_id) OR (EXISTS ( SELECT 1 FROM assignments a WHERE ((a.org_id = org_messages.org_id) AND (a.student_id = auth.uid()) AND (a.ended_at IS NULL) AND ((org_messages.teacher_id IS NULL) OR (a.teacher_id = org_messages.teacher_id))))) OR (EXISTS ( SELECT 1 FROM memberships m WHERE ((m.org_id = org_messages.org_id) AND (m.user_id = auth.uid()) AND (m.role = ANY (ARRAY['owner'::text, 'admin'::text]))))))
書ける 条件　（無し）
```

## ★そのまま に する もの と、★その わけ

- `memberships_update_role_management`
  ★自分の 役割を 自分で 下げる 道。★role_rank の 階で 守られて いる。★実地で 10役職 とも owner へ 上げられない ことを 確かめた（2026-09-11）。★役割の 話なので、★できことに 移す ものでは ない。

## ★身元を 固める 形（★assignments に すでに ある）

★★`assignments_all_owner_admin` の WITH CHECK が、
　★`assignments_old_identity()` で org_id／teacher_id／student_id を
　★**書き換えられない** ように して います。

★★裁定 その23 の ② ──「org_id は 動かせない ように」は、
　★★この 形を そのまま 使えます。
　★★`has_can` で 通す／通さないを 決め、
　★★そのうえで **身元の 列は 前の まま**を かつ で 足します。
　★★2つを 1つの 条件に 混ぜません。★1つの ことに 1つの しるし。

★★中身を 読んで いません。★次の 1問で 読めます ──

```sql
select pg_get_functiondef(p.oid)
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'assignments_old_identity';
```

## ★この 紙が 見て いない こと

★★条件の 本文は 並べて いません（★長い ため）。
　★★docs/reports/_policies.tsv に そのまま 入って います。
★★どの 鍵に 移すかは、★表と cmd から 添えた だけ です。
　★★1本ずつ、★条件の 本文を 読んで お決めください。
