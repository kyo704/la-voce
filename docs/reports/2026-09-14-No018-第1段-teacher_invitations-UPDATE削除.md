# No.018 第1段 ── `teacher_invitations` の UPDATE の 決まりを 落とす
全64行 / 末尾は「★③が 0行 なら、★落ちて います。」
全43行 / 末尾は「★③が 0行 なら、★落ちて います。」

★2026-09-14　★裁定（★Opus・坂本さん 承認）

★★落とす もの … `Students can mark invitation as used`（UPDATE ／ `{public}`）

★★わけ。★この 決まりを 通って 使用済みに する ことは **できません**。
　★名前は「使用済みに する」。★`with_check` は `used_at IS NULL`。
★★`used_at` を 立てて いるのは `accept_teacher_invitation`（`SECURITY DEFINER`）です。
★★画面からの update は、★2026-09-04 に すでに 消して あります（★#004）。

---

## ① 流す 前に 見る（★読むだけ。★何も 変わりません）

```sql
select policyname, cmd, roles, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'teacher_invitations'
order by cmd, policyname;
```

★★`Students can mark invitation as used` が **1行 出る** はずです。

## ② 流す

```sql
drop policy if exists "Students can mark invitation as used"
  on public.teacher_invitations;
```

## ③ 流した あとに 見る

```sql
-- ★★(1) 落ちたか
select policyname, cmd, roles
from pg_policies
where schemaname = 'public' and tablename = 'teacher_invitations'
order by cmd, policyname;

-- ★★(2) 使用済みに する 道が 残って いるか
--   ★`accept_teacher_invitation` が `SECURITY DEFINER` で あること
select p.proname, p.prosecdef as 定義者の権限で動く,
       pg_get_userbyid(p.proowner) as 持ち主
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'accept_teacher_invitation';

-- ★★(3) その 関数が いまも used_at を 立てて いるか
select position('used_at = now()' in pg_get_functiondef(p.oid)) > 0
         as used_atを立てている
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'accept_teacher_invitation';

-- ★★(4) UPDATE の 決まりが 1本も 無い こと
select count(*) as UPDATEの決まり
from pg_policies
where schemaname = 'public' and tablename = 'teacher_invitations'
  and cmd = 'UPDATE';
```

★★(2) が `true` ／ 持ち主が `postgres`、★(3) が `true`、
★③が 0行 なら、★落ちて います。
