-- ============================================================================
-- ★誰が、誰の profiles を読めた状態だったか（2026-09-03・読むだけ）
--
--   ★ログを追うのをやめて、データから出します。
--     ログは直近24時間しか見られず、ポリシーが在った期間には届きません。
--     ★「誰が読めた状態だったか」は、つながりの表から★いま出せます。
--
--   ★過去のつながりも入れます。
--     いま解除されていても、★解除されるまでのあいだは読めていました。
--     「いま有効なもの」だけを数えると、★実際より狭く見えます。
--
--   ★列の名前は、本番のダンプの COPY 行から取りました。推測ではありません。
--     teacher_student_links … id, teacher_id, student_id, status, share_scope,
--                             invited_at, accepted_at, revoked_at, revoked_by
--     assignments           … id, org_id, teacher_id, student_id,
--                             started_at, ended_at
--   ★どちらにも created_at はありません。
--     いちばん早い時刻は invited_at と started_at です。そちらを使います。
--
--   ★何も書き換えません。
--   ★出るのは id と時刻とメールアドレスだけです。記録の中身は1件も出ません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 先に、使える道具を確かめます
--
--   ★is_internal は、まだ本番に無いかもしれません
--     （supabase/migration_profiles_is_internal.sql が未実行の場合）。
--   ★無くても②③は動きます。④⑤だけが is_internal を使います。
-- ---------------------------------------------------------------------------
select
  (select count(*) from information_schema.columns
    where table_schema='public' and table_name='profiles' and column_name='is_internal')
    as "is_internal の列（1なら④⑤が使えます）",
  (select count(*) from information_schema.tables
    where table_schema='public' and table_name='link_consents')
    as "link_consents の表（are_connected が見ているかもしれません）";

-- ---------------------------------------------------------------------------
-- ② ★つながりの全部（過去のものも含めて）― is_internal が無くても動きます
--
--   ★メールアドレスを出します。運営者が「これは試験用」と目で分けるためです。
--   ★記録の中身は1件も出しません。
-- ---------------------------------------------------------------------------
select
  '先生と生徒のつながり' as "種類",
  l.teacher_id, tu.email as "先生のメール",
  l.student_id, su.email as "生徒のメール",
  l.status      as "状態",
  l.invited_at  as "★はじまり（招待）",
  l.accepted_at as "受けた日時",
  l.revoked_at  as "終わり（解除）"
  from public.teacher_student_links l
  left join auth.users tu on tu.id = l.teacher_id
  left join auth.users su on su.id = l.student_id
union all
select
  '教室の担当',
  a.teacher_id, tu.email,
  a.student_id, su.email,
  case when a.ended_at is null then 'active' else 'ended' end,
  a.started_at,
  null,
  a.ended_at
  from public.assignments a
  left join auth.users tu on tu.id = a.teacher_id
  left join auth.users su on su.id = a.student_id
 order by 7 asc nulls last;   -- ★はじまりの早い順。いちばん古い露出が先頭に出ます。

-- ---------------------------------------------------------------------------
-- ③ 種類ごとの数（is_internal が無くても動きます）
-- ---------------------------------------------------------------------------
select '先生と生徒のつながり' as "種類", l.status as "状態", count(*) as "組の数"
  from public.teacher_student_links l group by 1, 2
union all
select '教室の担当',
       case when a.ended_at is null then 'active' else 'ended' end,
       count(*)
  from public.assignments a group by 1, 2
 order by 1, 2;

-- ---------------------------------------------------------------------------
-- ④ ★実在の方どうしの組だけ（★is_internal が必要です）
--
--   ★①で「1」が返ったときだけ実行してください。
--   ★試験用の器どうしの組は、実際の露出ではありません。外します。
--   ★片方だけが試験用の組は、★残します。
--     実在の方の行が、試験用の器から読めていたなら、それは露出です。
-- ---------------------------------------------------------------------------
with 組 as (
  select l.teacher_id, l.student_id, l.status,
         l.invited_at as 始まり, l.revoked_at as 終わり,
         '先生と生徒のつながり' as 種類
    from public.teacher_student_links l
  union all
  select a.teacher_id, a.student_id,
         case when a.ended_at is null then 'active' else 'ended' end,
         a.started_at, a.ended_at, '教室の担当'
    from public.assignments a
)
select c.種類, c.teacher_id, tu.email as "先生のメール",
       c.student_id, su.email as "生徒のメール",
       c.status as "状態",
       c.始まり as "★はじまり", c.終わり as "終わり"
  from 組 c
  join public.profiles tp on tp.id = c.teacher_id
  join public.profiles sp on sp.id = c.student_id
  left join auth.users tu on tu.id = c.teacher_id
  left join auth.users su on su.id = c.student_id
 where coalesce(tp.is_internal, false) = false
   and coalesce(sp.is_internal, false) = false
 order by c.始まり asc nulls last;

-- ---------------------------------------------------------------------------
-- ⑤ ★実在どうし ／ 全体（★is_internal が必要です）
--
--   ★「露出の面」のうち、どれだけが試験用だったかが分かります。
-- ---------------------------------------------------------------------------
with 組 as (
  select l.teacher_id, l.student_id from public.teacher_student_links l
  union all
  select a.teacher_id, a.student_id from public.assignments a
)
select
  count(*) as "組の総数",
  count(*) filter (
    where coalesce(tp.is_internal, false) = false
      and coalesce(sp.is_internal, false) = false) as "★実在の方どうし",
  count(*) filter (
    where coalesce(tp.is_internal, false) <> coalesce(sp.is_internal, false))
    as "片方だけ試験用",
  count(*) filter (
    where coalesce(tp.is_internal, false) and coalesce(sp.is_internal, false))
    as "どちらも試験用",
  count(*) filter (where tp.id is null or sp.id is null)
    as "★profiles の行が無い（数えられない）"
  from 組 c
  left join public.profiles tp on tp.id = c.teacher_id
  left join public.profiles sp on sp.id = c.student_id;

-- ---------------------------------------------------------------------------
-- ⑥ ★are_connected が、ほかの表も見ているかもしれません
--
--   ★中身をまだ見ていないので、②〜⑤が「全部」だとは言えません。
--     関数の中身を貼っていただければ、抜けがないか確かめます。
-- ---------------------------------------------------------------------------
select pg_get_functiondef(p.oid) as "are_connected の中身（★これが要ります）"
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'are_connected';
