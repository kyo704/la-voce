-- ============================================================================
-- ★担当の行の身元を、教室の責任者が書き換えられるか（2026-09-03・実地）
--
--   ★teacher_student_links とは、形が違います
--     あちら … WITH CHECK が★無い
--     こちら … WITH CHECK は★ある。ただし is_org_owner_or_admin を
--              もう一度確かめるだけで、★teacher_id / student_id には触れていません。
--     ★「WITH CHECK があるから安全」ではありません。
--       ★何を確かめているかが問題です。
--
--   ★確かめること
--     教室の責任者が、担当の行の teacher_id / student_id を
--     ★任意の相手に書き換えられるか。
--     書き換えられるなら、★誰が誰を担当しているかを、勝手に作り替えられます。
--
--   ★begin/rollback は守りとして数えません（今日の 7-4）。
--     ★元に戻す文を、同じ出力の中に入れてあります。
--   ★両側が試験用の行だけを選びます。実在の方の行では試しません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① いまの担当（★読むだけ）
-- ---------------------------------------------------------------------------
select a.id, a.org_id, o.name as "教室",
       tu.email as "先生側", coalesce(tp.is_internal,false) as "先生は試験用か",
       su.email as "生徒側", coalesce(sp.is_internal,false) as "生徒は試験用か",
       a.started_at, a.ended_at
  from public.assignments a
  left join public.organizations o on o.id = a.org_id
  left join auth.users tu on tu.id = a.teacher_id
  left join auth.users su on su.id = a.student_id
  left join public.profiles tp on tp.id = a.teacher_id
  left join public.profiles sp on sp.id = a.student_id
 order by a.started_at nulls last;

-- ★その教室の責任者（なりすます人）
select m.org_id as "教室", m.role as "役職", u.email as "メール", m.user_id,
       coalesce(p.is_internal,false) as "試験用か"
  from public.memberships m
  left join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = m.user_id
 where m.role in ('owner','admin')
 order by m.org_id, m.role;

-- ---------------------------------------------------------------------------
-- ② ★試験の SQL を、照会に作らせる
--
--   ★選ぶ条件
--     ・担当の行：両側が試験用
--     ・なりすます人：その教室の owner か admin（★試験用の口座）
--     ・書き換える先：★その教室と無関係な、別の試験用の口座
--   ★出てきた文字列を、そのままコピーして流してください。
--     ★元に戻す文も、同じ文字列の中に入っています。
-- ---------------------------------------------------------------------------
with 対象 as (
  select a.id, a.org_id, a.teacher_id, a.student_id
    from public.assignments a
    join public.profiles tp on tp.id = a.teacher_id
    join public.profiles sp on sp.id = a.student_id
   where tp.is_internal = true and sp.is_internal = true
     and a.ended_at is null
   order by a.started_at nulls last
   limit 1
),
責任者 as (
  select m.user_id
    from public.memberships m
    join public.profiles p on p.id = m.user_id
   where m.org_id = (select org_id from 対象)
     and m.role in ('owner','admin')
     and p.is_internal = true
   order by m.role
   limit 1
),
別人 as (
  select u.id
    from auth.users u join public.profiles p on p.id = u.id
   where p.is_internal = true
     and u.id <> (select teacher_id from 対象)
     and u.id <> (select student_id from 対象)
   order by u.created_at
   limit 1
)
select
  case when (select id from 対象) is null
         or (select user_id from 責任者) is null
         or (select id from 別人) is null
    then '★試せる組み合わせがありません。①の結果を見て、条件を相談してください。'
    else concat(
      E'-- ★教室の責任者として、担当の teacher_id を別人に書き換えてみます。\n',
      E'select set_config(''request.jwt.claims'',\n',
      E'  ''{"sub":"', (select user_id from 責任者), E'","role":"authenticated"}'', true);\n',
      E'set local role authenticated;\n\n',
      E'update public.assignments\n',
      E'   set teacher_id = ''', (select id from 別人), E'''\n',
      E' where id = ''', (select id from 対象), E'''\n',
      E'returning id, teacher_id as "★書き換えられてしまった（0行であること）";\n\n',
      E'-- ★student_id のほうも\n',
      E'update public.assignments\n',
      E'   set student_id = ''', (select id from 別人), E'''\n',
      E' where id = ''', (select id from 対象), E'''\n',
      E'returning id, student_id as "★書き換えられてしまった（0行であること）";\n\n',
      E'reset role;\n\n',
      E'-- ★★ 上のどちらかが1行でも返ったら、すぐこれを流して元に戻してください ★★\n',
      E'update public.assignments\n',
      E'   set teacher_id = ''', (select teacher_id from 対象), E''',\n',
      E'       student_id = ''', (select student_id from 対象), E'''\n',
      E' where id = ''', (select id from 対象), E''';\n\n',
      E'-- ★確かめ（元に戻ったこと）\n',
      E'select id, org_id, teacher_id, student_id, ended_at\n',
      E'  from public.assignments where id = ''', (select id from 対象), E''';'
    )
  end as "★これをコピーして流してください";

-- ★判定
--   0行 または エラー → 塞がっています
--   1行返る           → ★穴です。返ってきた文字列の中の戻す文を、すぐ流してください
