-- ============================================================================
-- ★enrollments の 決まりを 読む（★読むだけ・1行も 書きません）
-- ============================================================================

-- ① UPDATE の 決まり（★USING と WITH CHECK の 中身）
select policyname                      as "決まりの 名前",
       permissive                      as "または/かつ",
       cmd                             as "何に",
       roles::text                     as "誰に",
       coalesce(qual, '（無し）')       as "読める 条件",
       coalesce(with_check, '（無し）') as "書ける 条件"
from pg_policies
where schemaname = 'public' and tablename = 'enrollments'
order by permissive desc, cmd, policyname;

-- ★★見どころ
--   ★UPDATE の 行が 1本も 無ければ … ★誰も 書けません（★いまの 姿）。
--   ★あれば … ★その 条件が「名簿を 預かる 方」を 通すか どうか。
--   ★`has_can` が 出て くるか、★`role` だけを 見て いるか。

-- ② 引き金が 立って いるか（★学年の 札の 守り）
select tgname as "引き金", tgenabled as "生きて いるか"
from pg_trigger
where tgrelid = 'public.enrollments'::regclass and not tgisinternal;
-- ★★期待 ── guard_enrollment_grade_label が 1行。O。

-- ③ RLS が 有効か
select relname as "表", relrowsecurity as "決まりを 使う",
       relforcerowsecurity as "所有者にも かける"
from pg_class
where oid = 'public.enrollments'::regclass;
-- ★★期待 ── 使う = true。

-- ④ 決まりの 中で 呼ばれて いる 関数の 中身
select p.proname as "関数", pg_get_functiondef(p.oid) as "中身"
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('has_can', 'can_view_ops', 'is_org_owner_or_admin');
