-- ============================================================================
-- ★自分で自分の役職を上げられるか（2026-09-03・実地の確認）
--
--   ★すべて begin 〜 rollback の中です。データは1行も残りません。
--
--   ★何を確かめるのか
--     本番のポリシー memberships_update_role_management の WITH CHECK：
--       WHEN (auth.uid() = user_id) THEN
--         role_rank(role) <= role_rank(
--           (SELECT m.role FROM memberships m WHERE m.id = memberships.id))
--
--     ★「新しい役職の順位 ≦ 元の役職の順位」なら通す、という形です。
--     ★問題は、この副問い合わせが★元の値を見るのか、新しい値を見るのかです。
--
--   ★私の読み（★確かめるまで採用しないでください）
--     PostgreSQL では、1つの文は★自分自身の変更を見られません（command id の規則）。
--     副問い合わせは文の開始時点の姿を読むので、★元の値を見るはずです。
--     つまり teacher（1）が owner（3）へ上げようとすると 3 <= 1 が偽で、★弾かれるはず。
--     ★ですが「はず」です。今日、読みで4回外しました。
--     ★下の②③が本当の答えです。
--
--   ★9/2 に、これは実際に起きています
--     +g4t3 が自分を owner に上げました
--     （supabase/URGENT_fix_owner_self_promotion.sql:1-30）。
--     ★あのときの原因は「未適用」でした。いま塞がっているかは、確かめないと分かりません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 下ごしらえ（★読むだけ。試す組み合わせを選びます）
-- ---------------------------------------------------------------------------
select o.id as "教室", o.name as "教室の名前",
       (select count(*) from public.memberships m where m.org_id = o.id) as "いる人数"
  from public.organizations o order by o.created_at;

-- ★いま owner が2人以上いる教室（9/2 の跡が残っていないか）
select org_id as "教室", count(*) as "owner の数",
       string_agg(user_id::text, ', ') as "誰"
  from public.memberships where role = 'owner'
 group by org_id having count(*) > 1;

-- ★試験に使える利用者（その教室にまだ入っていない人）
select u.id, u.email, coalesce(p.is_internal, false) as "試験用か"
  from auth.users u
  left join public.profiles p on p.id = u.id
 where coalesce(p.is_internal, false) = true
   and not exists (select 1 from public.memberships m
                    where m.user_id = u.id and m.org_id = '<教室の uuid>')
 order by u.email;

-- ---------------------------------------------------------------------------
-- ② ★本体：自分で自分を上げられるか
--
--   ★<教室の uuid> と <利用者の uuid> を、①で選んだものに置き換えてください。
--   ★利用者は、試験用の口座（is_internal = true）を使ってください。
--   ★rollback するので、何も残りません。
-- ---------------------------------------------------------------------------
begin;

  -- ②-1 service_role のまま、試験用の membership を作ります（RLS を素通り）
  insert into public.memberships (org_id, user_id, role)
  values ('<教室の uuid>', '<利用者の uuid>', 'teacher')
  returning id, role as "作った行（teacher）";

  -- ②-2 その人になりすまします。★claims を先、role をあとに
  select set_config('request.jwt.claims',
    '{"sub":"<利用者の uuid>","role":"authenticated"}', true);
  set local role authenticated;

  -- ②-3 ★自分を admin に上げてみる
  update public.memberships set role = 'admin'
   where user_id = auth.uid() and org_id = '<教室の uuid>'
  returning id, role as "★admin に上がってしまった行（0行であること）";

  -- ②-4 ★自分を owner に上げてみる
  update public.memberships set role = 'owner'
   where user_id = auth.uid() and org_id = '<教室の uuid>'
  returning id, role as "★owner に上がってしまった行（0行であること）";

  -- ②-5 ★いまの姿（teacher のままであること）
  select role as "★いまの役職（teacher のままであること）"
    from public.memberships
   where user_id = auth.uid() and org_id = '<教室の uuid>';

rollback;

-- ★②-3 と ②-4 が★どちらも0行なら、塞がっています。
-- ★1行でも返ったら、★インシデント #005 です。すぐ塞ぐ判断へ。

-- ---------------------------------------------------------------------------
-- ③ ★別の道：はじめから owner として自分を入れられるか
--
--   ★②は「上げる」道です。こちらは「最初から高い役職で入る」道で、別物です。
--   ★②が塞がっていても、こちらが開いていれば同じことができます。
-- ---------------------------------------------------------------------------
begin;

  select set_config('request.jwt.claims',
    '{"sub":"<利用者の uuid>","role":"authenticated"}', true);
  set local role authenticated;

  -- ③-1 ★自分を owner として入れてみる
  insert into public.memberships (org_id, user_id, role)
  values ('<教室の uuid>', auth.uid(), 'owner')
  returning id, role as "★owner として入れてしまった行（エラーになること）";

rollback;

begin;
  select set_config('request.jwt.claims',
    '{"sub":"<利用者の uuid>","role":"authenticated"}', true);
  set local role authenticated;

  -- ③-2 ★自分を admin として入れてみる
  insert into public.memberships (org_id, user_id, role)
  values ('<教室の uuid>', auth.uid(), 'admin')
  returning id, role as "★admin として入れてしまった行（エラーになること）";

rollback;

-- ★③-1 ③-2 は、ポリシーに弾かれれば★エラーで止まります
--   （insert は0行ではなく、エラーになります）。
--   ★エラーが出ることが、正しい姿です。行が返ったら、★穴です。

-- ---------------------------------------------------------------------------
-- ④ ★参考：いま memberships にあるポリシー全部
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", permissive as "種別",
       qual as "USING", with_check as "★WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'memberships'
 order by permissive, cmd, policyname;
