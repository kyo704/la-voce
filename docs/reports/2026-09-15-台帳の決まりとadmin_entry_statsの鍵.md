# 台帳の 決まりと、admin_entry_stats の 鍵（★答え）
全281行 / 末尾は「★★この 1枚が ある かぎり、★問い ② は 省けません。」

- 日付 … 2026-09-15
- 出どころ … [ACTION] Opus → Code（付録A の 便）
- ★私は 台帳を 引けません。★SQL を 流すのは 坂本さん です。

## 1. admin_entry_stats ── ★答えは ㋐（service key）

```
app/admin/page.js:63   const admin = createAdminClient();   // ★service_role
app/admin/page.js:137  const { data: entryStats } = await admin.rpc("admin_entry_stats");
```

 は `SUPABASE_SERVICE_ROLE_KEY` です（`lib/supabase/admin.js`）。
利用者の 鍵では ありません。

★だから Opus の 言われる とおり、`auth.uid()` は null です。
関数の 中で 本人を 見る には、★呼ぶ側が user_id を 渡す 形に なります。

★★ただし、★1つ 申し上げたい ことが あります。

呼ぶ側が 渡す user_id を 関数が 確かめる 形は、★「呼ぶ側が 嘘を つかない」
ことに 頼って います。★service_role を 持って いる 側は、★どの id でも 渡せます。

それでも いまより 良い です ── ★門が 経路の 外へ 出ます。
経路の 早い return を 誰かが 消しても、★関数が「admin の id を 名乗れ」と 言います。
`get_student_entries` と 同じ 形の 事故は 防げます。

★★もう1つ、★もっと 堅い 道が あります ── ㋑ に 変える ことです。

| | ㋐ いまの まま（service key ＋ p_user_id） | ㋑ 利用者の 鍵に 変える |
|---|---|---|
| `auth.uid()` | null。渡された id を 信じる | ★本物。偽れません |
| 関数の 引数 | `p_user_id uuid` が 要る | ★要りません |
| 権限 | service_role だけ | authenticated に execute |
| 人を またいで 数える | SECURITY DEFINER が RLS を 越える | 同じ |
| 経路が 嘘を つけるか | ★つけます | ★つけません |

★どちらに するかは、★私が 決める ことでは ありません。
紙は、★お決めの あとに 書きます。

## 2. ★同じ 形が もう1つ あります

```
app/api/character/unlock/route.js:73
  await admin.rpc("character_unlock_summary", { p_user_id: user.id })
```

こちらは 既に `p_user_id` を 受け取って います。★けれど 関数の 中に
「その id が 呼び手 本人か」を 見る ところは ありません。
`service_role` だけに 渡して あり、★経路が `user.id` を 渡して いる ── それだけ です。

★admin_entry_stats を 直す なら、★こちらも 一緒に お考え ください。

## 3. ★紙が 流れて いるか、★私には 分かりません

`supabase/migration_no019_5_entry_stats.sql` は 書いて あります。
★流れたか どうかは、★台帳に 尋ねる ほか ありません。

`app/admin/page.js:139-145` に、★流れて いない ときの 古い 道が 残って います。
そこは `entries` から 12列（`voice_memo`／`mental_reason`／`medication_tags` を 含む）を
取ります。★流れて いれば 使われません。★流れて いなければ 毎回 使われます。

★★下の 問い ① で 確かめて ください。

## 4. lessons / org_messages / org_events の 決まり（★紙の うえ）

★★これは 紙です。★台帳では ありません。

```
★紙の うえの 決まり（RLS）
　★見た 紙: supabase/*.sql　192 枚
　★★これは **紙** です。★台帳では ありません（★下の §末尾）。

==================================================================
■ lessons
　RLS: ★この 紙たちには 書いて ありません
　決まり: 13 件（★紙に 出て くる 順）
　　・[ALL] lessons_attendance_teacher_update　drop policy　to (既定)　（2026-09-08-レッスンの出欠-直し2.sql）
　　・[UPDATE] lessons_attendance_teacher_update　create policy　to (既定)　（2026-09-08-レッスンの出欠.sql）
　　　　using: auth.uid() = teacher_id or exists ( select 1 from public.teacher_student_links l where l.id = lessons.link_id and l.teacher_id = auth.uid() )
　　　　with check: auth.uid() = teacher_id or exists ( select 1 from public.teacher_student_links l where l.id = lessons.link_id and l.teacher_id = auth.uid() )
　　・[UPDATE] lessons_student_notice　create policy　to (既定)　（2026-09-10-先生に伝える.sql）
　　　　using: auth.uid() = student_id
　　　　with check: auth.uid() = student_id
　　・[ALL] lessons_update_needs_can_shukketsu　drop policy　to (既定)　（2026-09-11-No002-出席は出席のできことで守る.sql）
　　・[UPDATE] lessons_update_needs_can_shukketsu　create policy　to authenticated　（2026-09-11-No002-出席は出席のできことで守る.sql）
　　　　using: org_id is null or public.has_can(org_id, 'shukketsu')
　　　　with check: org_id is null or public.has_can(org_id, 'shukketsu')
　　・[ALL] Ops-visible lessons (org-based)　drop policy　to (既定)　（migration_fix_lessons_org_null_policies.sql）
　　・[SELECT] Ops-visible lessons (org-based)　create policy　to (既定)　（migration_fix_lessons_org_null_policies.sql）
　　　　using: org_id is not null and ( auth.uid() = student_id or can_view_ops(auth.uid(), org_id, student_id) )
　　・[ALL] Teachers can create org lessons　drop policy　to (既定)　（migration_fix_lessons_org_null_policies.sql）
　　・[INSERT] Teachers can create org lessons　create policy　to (既定)　（migration_fix_lessons_org_null_policies.sql）
　　　　with check: org_id is not null and can_view_ops(auth.uid(), org_id, student_id)
　　・[ALL] Teachers can update or delete org lessons　drop policy　to (既定)　（migration_fix_lessons_org_null_policies.sql）
　　・[UPDATE] Teachers can update or delete org lessons　create policy　to (既定)　（migration_fix_lessons_org_null_policies.sql）
　　　　using: org_id is not null and can_view_ops(auth.uid(), org_id, student_id)
　　・[ALL] Teachers can delete org lessons　drop policy　to (既定)　（migration_fix_lessons_org_null_policies.sql）
　　・[DELETE] Teachers can delete org lessons　create policy　to (既定)　（migration_fix_lessons_org_null_policies.sql）
　　　　using: org_id is not null and can_view_ops(auth.uid(), org_id, student_id)
　権限: 9 件
　　・revoke all → anon　（2026-09-04-org-events-grants-cleanup.sql）
　　・revoke truncate, trigger, references → authenticated　（2026-09-04-org-events-grants-cleanup.sql）
　　・revoke update → authenticated　（2026-09-08-レッスンの出欠.sql）
　　・grant update (attendance, attendance_at, attendance_by) → authenticated　（2026-09-08-レッスンの出欠.sql）
　　・revoke all → anon　（2026-09-10-先生に伝える.sql）
　　・revoke truncate, trigger, references → authenticated　（2026-09-10-先生に伝える.sql）
　　・revoke update → authenticated　（migration_identity_columns_immutable.sql）
　　・revoke update → anon　（migration_identity_columns_immutable.sql）
　　・grant update (held) → authenticated　（migration_identity_columns_immutable.sql）

==================================================================
■ org_messages
　RLS: enable　（2026-09-10-連絡と、読んだ記録.sql）
　決まり: 3 件（★紙に 出て くる 順）
　　・[SELECT] org_messages_select　create policy　to (既定)　（2026-09-10-連絡と、読んだ記録.sql）
　　　　using: auth.uid() = teacher_id or exists ( select 1 from public.assignments a where a.org_id = org_messages.org_id and a.student_id = auth.uid() and a.ended_at is null and (org_messages.teacher_id is null or a.teacher_id = org_messages.teacher_id) ) or exists ( select 1 from public.memberships m where m.org_id = org_messages.org_id and m.user_id = auth.uid() and m.role in ('owner', 'admin') )
　　・[INSERT] org_messages_insert　create policy　to (既定)　（2026-09-10-連絡と、読んだ記録.sql）
　　　　with check: auth.uid() = author_id and ( (teacher_id is not null and ( auth.uid() = teacher_id or exists ( select 1 from public.assignments a where a.org_id = org_messages.org_id and a.student_id = auth.uid() and a.teacher_id = org_messages.teacher_id and a.ended_at is null ) )) or (teacher_id is null and exists ( select 1 from public.memberships m where m.org_id = org_messages.org_id and m.user_id = auth.uid() and m.role in ('owner', 'admin') )) )
　　・[UPDATE] org_messages_withdraw　create policy　to (既定)　（2026-09-10-連絡と、読んだ記録.sql）
　　　　using: auth.uid() = author_id
　　　　with check: auth.uid() = author_id
　権限: 4 件
　　・revoke all → anon　（2026-09-10-連絡と、読んだ記録.sql）
　　・revoke truncate, trigger, references → authenticated　（2026-09-10-連絡と、読んだ記録.sql）
　　・revoke delete → authenticated　（2026-09-10-連絡と、読んだ記録.sql）
　　・grant select, insert, update → authenticated　（2026-09-10-連絡と、読んだ記録.sql）

==================================================================
■ org_events
　RLS: enable　（migration_org_events.sql）
　決まり: 8 件（★紙に 出て くる 順）
　　・[ALL] org_events_insert_needs_can_gyoji　drop policy　to (既定)　（2026-09-11-7-3-第3段の本体（できことを かつ で 足す）.sql）
　　・[INSERT] org_events_insert_needs_can_gyoji　create policy　to authenticated　（2026-09-11-7-3-第3段の本体（できことを かつ で 足す）.sql）
　　　　with check: public.has_can(org_id, 'gyoji')
　　・[ALL] org_events_update_needs_can_gyoji　drop policy　to (既定)　（2026-09-11-7-3-第3段の本体（できことを かつ で 足す）.sql）
　　・[UPDATE] org_events_update_needs_can_gyoji　create policy　to authenticated　（2026-09-11-7-3-第3段の本体（できことを かつ で 足す）.sql）
　　　　using: public.has_can(org_id, 'gyoji')
　　　　with check: public.has_can(org_id, 'gyoji')
　　・[ALL] org_events_delete_needs_can_gyoji　drop policy　to (既定)　（2026-09-11-7-3-第3段の本体（できことを かつ で 足す）.sql）
　　・[DELETE] org_events_delete_needs_can_gyoji　create policy　to authenticated　（2026-09-11-7-3-第3段の本体（できことを かつ で 足す）.sql）
　　　　using: public.has_can(org_id, 'gyoji')
　　・[SELECT] org_events_select_member　create policy　to (既定)　（migration_org_events.sql）
　　　　using: exists (select 1 from public.memberships m where m.org_id = org_events.org_id and m.user_id = auth.uid()) or exists (select 1 from public.enrollments e where e.org_id = org_events.org_id and e.student_id = auth.uid() and e.status = 'active')
　　・[ALL] org_events_write_admin　create policy　to (既定)　（migration_org_events.sql）
　　　　using: exists (select 1 from public.memberships m where m.org_id = org_events.org_id and m.user_id = auth.uid() and m.role in ('owner','admin'))
　権限: 8 件
　　・revoke all → anon　（2026-09-04-org-events-grants-cleanup.sql）
　　・revoke truncate, trigger, references → authenticated　（2026-09-04-org-events-grants-cleanup.sql）
　　・revoke delete → authenticated　（2026-09-04-org-events-grants-cleanup.sql）
　　・revoke insert → authenticated　（URGENT_containment_and_diagnosis.sql）
　　・revoke insert → anon　（URGENT_containment_and_diagnosis.sql）
　　・revoke update → authenticated　（migration_identity_columns_immutable.sql）
　　・revoke update → anon　（migration_identity_columns_immutable.sql）
　　・grant update (event_date, previous_date, withdrawn_at, updated_at) → authenticated　（migration_identity_columns_immutable.sql）

==================================================================
★この 数え 自身の 検算
　✓ `create policy` の 文 90 件を、★すべて 読み取れました

★★この 道具が 見て いない こと
　★台帳（Supabase）の 中身は 見て いません。★紙だけ です。
　★SQLエディタで 直に 打った ものは、★どの 紙にも ありません。
　★★下の 問いを 流して、★台帳に 直に 尋ねて ください。

------------------------------------------------------------------
-- ★台帳に 直に 尋ねる（★読むだけ・書きません）
select
  c.relname                            as "表",
  c.relrowsecurity                     as "RLS",
  c.relforcerowsecurity                as "所有者にも かける",
  coalesce(p.polname, '(決まり なし)') as "決まり",
  case p.polcmd when 'r' then 'SELECT' when 'a' then 'INSERT'
                when 'w' then 'UPDATE' when 'd' then 'DELETE'
                else 'ALL' end        as "何に",
  coalesce(array_to_string(p.polroles::regrole[], ', '), '(既定)') as "誰に",
  pg_get_expr(p.polqual,      c.oid)   as "using",
  pg_get_expr(p.polwithcheck, c.oid)   as "with check"
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policy p on p.polrelid = c.oid
where n.nspname = 'public'
  and c.relname in ('lessons', 'org_messages', 'org_events')
order by c.relname, p.polname;

-- ★誰が 何を できるか（★表ごとの 権限）
select
  table_name as "表", grantee as "誰が", string_agg(privilege_type, ', ') as "何を"
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('lessons', 'org_messages', 'org_events')
group by table_name, grantee
order by table_name, grantee;
```

## 5. STEP 1 の 答え ──「生徒は もう 自分の 行を 読めるか」

★紙の うえでの 答えです。台帳では 確かめて いません。

| 表 | 生徒が 自分の 行を 読めるか（★紙の うえ） |
|---|---|
| `org_events` | ★**読めます**。`org_events_select_member` が `enrollments` で 在籍（status='active'）を 見ます |
| `org_messages` | ★**読めます**。`org_messages_select` が `assignments` で 受け持ち（ended_at is null）を 見ます |
| `lessons` | ★**条件つきで 読めます**。`Ops-visible lessons (org-based)` の using に `auth.uid() = student_id` が 入って います。★ただし `org_id is not null and (...)` なので、**`org_id` が null の レッスンは 読めません** |

### ★lessons に 見つかった 穴（★紙の うえ）

`lessons` の 決まりを 全部 並べると、★**SELECT の 決まりが 1つ**しか ありません。

```
[SELECT] Ops-visible lessons (org-based)
  using: org_id is not null and ( auth.uid() = student_id or can_view_ops(auth.uid(), org_id, student_id) )
```

`org_id is not null` が 頭に あります。

★つまり 紙の うえでは、★教室に 属さない レッスン（`org_id` が null）は、
★**生徒も 先生も 読めません**。

`migration_fix_lessons_org_null_policies.sql` という 名前の 紙が、
その 前の 決まりを drop して この 形に して います。
「org null を 直す」という 名前ですが、★SELECT からは org null を 外して います。

★★これが いまの 台帳の 姿かは、★分かりません。
　★ほかの 決まりが SQLエディタから 入って いるかも しれません。
　★★下の 問い ② で 確かめて ください。

### ★RLS そのもの

- `org_messages` … enable と 書いた 紙が あります
- `org_events` … enable と 書いた 紙が あります
- `lessons` … ★**enable と 書いた 紙が どこにも ありません**

　★★`lessons` に RLS が 掛かって いない なら、★決まりは 1つも 効きません。
　★掛かって いる と 思います（★列ごとの GRANT が 丁寧に 書かれて いるので）。
　★★けれど「思う」で 済ませる ところでは ありません。★問い ② で 見て ください。

## 6. ★「生徒の 教室の 殻」の 指示は、★届いて いません

`docs/opus/` の 中で いちばん 新しい 教室まわりの 文書は 2026-09-11 です。
9月12日 以降に 届いた 文書は 3通で、★どれも 教室の 殻の 指示では ありません。

- `設計書_付録A_追加される画面の一覧_2026-09-15.md`（412行・★今日 保存）
- `未決機能の設計書_第3版_2026-09-14.md`（822行・★保存されて いません でした）
- `進捗の共有_Opusから_2026-09-14.md`（213行・★保存されて いません でした）

★あとの 2通は、★Downloads に 置かれた まま でした。★いま 保存しました。
★★中継の 落としと いうより、★私の 取り込み漏れ かも しれません。

## 7. ★流して いただきたい 問い（★読むだけ・書きません）

### ① No.019.5 の 紙が 流れて いるか

```sql
select
  p.proname                                           as "関数",
  p.prosecdef                                         as "SECURITY DEFINER",
  pg_get_userbyid(p.proowner)                         as "所有者",
  coalesce(array_to_string(p.proacl, E'\n'), '(既定)') as "権限"
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('admin_entry_stats', 'character_unlock_summary')
order by p.proname;
```

★0行なら、★紙は まだ 流れて いません（★古い 12列の 道が 毎回 使われて います）。
★出た なら、★"権限" に `anon=X` や `authenticated=X` が **無い** ことを ご確認ください。

### ② 3つの 表の、いまの 決まり

`docs/reports/` の この 紙の いちばん 下に、★そのまま 流せる 形で 置いて あります。
`lessons` の `relrowsecurity` が **true** で あること、
`lessons` に **SELECT の 決まりが いくつ** あるかを、とくに ご覧ください。

★★動いて 作る 紙が 1枚 あります
（`URGENT_2026-09-11-updateのwith-checkを明示する.sql`）。
★表の 名前が 変数 なので、★何を 作ったかは 紙から 読めません。
★★この 1枚が ある かぎり、★問い ② は 省けません。
