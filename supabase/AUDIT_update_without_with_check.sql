-- ============================================================================
-- ★WITH CHECK の無い UPDATE を、全部の表で探す（2026-09-03・読むだけ）
--
--   ★なぜ全部を見るのか
--     この形は、今日★2回出ました。
--       memberships                … 9/2 に自己昇格が起きた。手当てされ、いまは塞がっている
--       teacher_student_links      … ★2026-09-03、実地で書き換えに成功（#006）
--     ★2回出たものは、3回目があります。1つずつ当てずっぽうに見ません。
--
--   ★なぜ危ないのか
--     USING は「更新前の行」を見ます。★更新後の行は、誰も見ていません。
--     だから USING を通れば、★どの列でも書き換えられます。
--     ★身元を決める列（user_id / teacher_id / student_id / org_id）が
--       書き換えられると、★その人は別人になれます。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① WITH CHECK の無い UPDATE / ALL のポリシー（★これが本体）
-- ---------------------------------------------------------------------------
select
  p.tablename  as "表",
  p.policyname as "ポリシー",
  p.cmd        as "操作",
  p.permissive as "種別",
  p.qual       as "USING",
  '★WITH CHECK なし' as "★"
  from pg_policies p
 where p.schemaname = 'public'
   and p.cmd in ('UPDATE', 'ALL')
   and p.with_check is null
 order by p.tablename, p.policyname;

-- ---------------------------------------------------------------------------
-- ② ★その表に、身元を決める列があるか
--
--   ★①で出た表について、これを見てください。
--     身元の列があれば、★その列を書き換えて別人になれる可能性があります。
--     status や *_at しか無い表なら、被害は小さくなります。
-- ---------------------------------------------------------------------------
with 穴 as (
  select distinct p.tablename
    from pg_policies p
   where p.schemaname = 'public'
     and p.cmd in ('UPDATE', 'ALL')
     and p.with_check is null
)
select c.table_name as "表",
       string_agg(c.column_name, ', ' order by c.ordinal_position)
         filter (where c.column_name ~ '(^|_)(user_id|teacher_id|student_id|org_id|owner|created_by|invited_by|used_by|id)$')
         as "★身元を決めうる列",
       string_agg(c.column_name, ', ' order by c.ordinal_position)
         filter (where c.column_name ~ '(role|status|scope|level|rank|is_|_at$)')
         as "権限や状態に関わる列",
       count(*) as "列の総数"
  from information_schema.columns c
  join 穴 on 穴.tablename = c.table_name
 where c.table_schema = 'public'
 group by c.table_name
 order by 1;

-- ---------------------------------------------------------------------------
-- ③ ★逆も見ます：WITH CHECK はあるが、身元の列を守っていないもの
--
--   ★WITH CHECK があっても、身元の列に触れていなければ同じことが起きます。
--     ★「WITH CHECK がある」だけでは、安心の理由になりません。
-- ---------------------------------------------------------------------------
select p.tablename as "表", p.policyname as "ポリシー", p.cmd as "操作",
       p.with_check as "WITH CHECK",
       case
         when p.with_check::text ~ '(user_id|teacher_id|student_id|org_id)' then '身元の列に触れています'
         else '★身元の列に触れていません（要確認）'
       end as "★見立て"
  from pg_policies p
 where p.schemaname = 'public'
   and p.cmd in ('UPDATE', 'ALL')
   and p.with_check is not null
 order by 5 desc, 1, 2;

-- ---------------------------------------------------------------------------
-- ④ ★名前と中身が食い違っていそうなポリシー（今日の根本原因の形）
--
--   ★名前に列の名前や「◯◯だけ」と読める語が入っているもの。
--     RLS は列を絞れません。★名前がそう読めるなら、そこが疑いどころです。
-- ---------------------------------------------------------------------------
select tablename as "表", policyname as "★名前が範囲を示唆するポリシー",
       cmd as "操作", qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public'
   and policyname ~* 'scope|name|display|only|column|field|note|body|public|visible|shared'
 order by 1, 2;
-- ★今日の2件は、どちらもここに出ます。
--     profiles_connected_display_name（削除済み）
--     Students can update share scope（★これから直します）
