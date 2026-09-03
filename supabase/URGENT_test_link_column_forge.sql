-- ============================================================================
-- ★つながりの行の、どの列まで書き換えられるか（2026-09-03・実地の確認）
--
--   ★調べる対象
--     ポリシー "Students can update share scope"（UPDATE）
--       USING      : (auth.uid() = teacher_id) OR (auth.uid() = student_id)
--       WITH CHECK : ★なし
--
--   ★名前と中身が食い違っています（今日の根本原因と同じ形）
--     ・名前は「Students can update」ですが、★先生も更新できます。
--     ・「share scope」とありますが、★share_scope は 2026-09-01 に廃止しました。
--       アプリは、もうこの列に1文字も書きません（VocalTracker.jsx:9557）。
--
--   ★WITH CHECK が無いことの意味
--     USING を通れば、★どの列でも書き換えられます。
--     teacher_id / student_id / status / revoked_at / revoked_by ―― 全部です。
--     ★USING は「更新前の行」を見ます。更新後の行は、誰も見ていません。
--
--   ★アプリが実際に送っているもの（コードで確認済み）
--     更新は1か所だけです（VocalTracker.jsx:9641-9642）。
--       .update({ status: "revoked", revoked_at: …, revoked_by: asRole })
--       .eq("id", linkId)
--     ★つまり「アプリは3列しか送っていない」。
--     ★ですが、それは呼ぶ側の作法であって、守りではありません。
--     ★今日、まったく同じ形で誤りました（profiles の2列は呼ぶ側の作法でした）。
--
--   ★心配していること
--     生徒が自分の行の teacher_id を★自分の id に書き換えられるなら、
--     その人は「その紐付けの先生」になります。
--     lessons のポリシーは teacher_student_links.teacher_id = auth.uid() で
--     絞っているので、★レッスンを読む・作る・消す側に回れます。
--     student_id を他人に書き換えられるなら、★同意していない人との
--     つながりを作れることになります。
--
--   ★begin/rollback は守りとして数えません（今日の 7-4）。
--     ★元に戻す文を、同じ出力の中に入れてあります。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① いまのつながり（★読むだけ）
-- ---------------------------------------------------------------------------
select l.id, l.status,
       tu.email as "先生側", coalesce(tp.is_internal,false) as "先生は試験用か",
       su.email as "生徒側", coalesce(sp.is_internal,false) as "生徒は試験用か",
       l.invited_at
  from public.teacher_student_links l
  left join auth.users tu on tu.id = l.teacher_id
  left join auth.users su on su.id = l.student_id
  left join public.profiles tp on tp.id = l.teacher_id
  left join public.profiles sp on sp.id = l.student_id
 order by l.invited_at nulls last;

-- ---------------------------------------------------------------------------
-- ② ★試験の SQL を、照会に作らせる（★両側が試験用の行だけを選びます）
--
--   ★実在の方の行では試しません。壊れたときに戻せない相手がいるためです。
--   ★出てきた文字列を、そのままコピーして流してください。
--     ★元に戻す文も、同じ文字列の中に入っています。
-- ---------------------------------------------------------------------------
with 対象 as (
  select l.id, l.teacher_id, l.student_id
    from public.teacher_student_links l
    join public.profiles tp on tp.id = l.teacher_id
    join public.profiles sp on sp.id = l.student_id
   where tp.is_internal = true and sp.is_internal = true
   order by l.invited_at nulls last
   limit 1
)
select
  case when (select id from 対象) is null
    then '★両側が試験用のつながりがありません。実在の方の行では試さないでください。'
    else concat(
      E'-- ★生徒として、自分の行の teacher_id を自分に書き換えてみます。\n',
      E'select set_config(''request.jwt.claims'',\n',
      E'  ''{"sub":"', (select student_id from 対象), E'","role":"authenticated"}'', true);\n',
      E'set local role authenticated;\n\n',
      E'update public.teacher_student_links\n',
      E'   set teacher_id = auth.uid()\n',
      E' where id = ''', (select id from 対象), E'''\n',
      E'returning id, teacher_id as "★書き換えられてしまった（0行であること）";\n\n',
      E'reset role;\n\n',
      E'-- ★★ 上が1行でも返ったら、すぐこれを流して元に戻してください ★★\n',
      E'update public.teacher_student_links\n',
      E'   set teacher_id = ''', (select teacher_id from 対象), E''',\n',
      E'       student_id = ''', (select student_id from 対象), E'''\n',
      E' where id = ''', (select id from 対象), E''';\n\n',
      E'-- ★確かめ（元に戻ったこと）\n',
      E'select id, teacher_id, student_id from public.teacher_student_links\n',
      E' where id = ''', (select id from 対象), E''';'
    )
  end as "★これをコピーして流してください（teacher_id を書き換える道）";

-- ---------------------------------------------------------------------------
-- ③ ★もう一方の道：student_id を他人に書き換えられるか
-- ---------------------------------------------------------------------------
with 対象 as (
  select l.id, l.teacher_id, l.student_id
    from public.teacher_student_links l
    join public.profiles tp on tp.id = l.teacher_id
    join public.profiles sp on sp.id = l.student_id
   where tp.is_internal = true and sp.is_internal = true
   order by l.invited_at nulls last limit 1
),
他人 as (
  select u.id from auth.users u join public.profiles p on p.id = u.id
   where p.is_internal = true
     and u.id <> (select teacher_id from 対象)
     and u.id <> (select student_id from 対象)
   order by u.created_at limit 1
)
select
  case when (select id from 対象) is null or (select id from 他人) is null
    then '★試せる組み合わせがありません。'
    else concat(
      E'-- ★先生として、student_id を別の人に書き換えてみます。\n',
      E'select set_config(''request.jwt.claims'',\n',
      E'  ''{"sub":"', (select teacher_id from 対象), E'","role":"authenticated"}'', true);\n',
      E'set local role authenticated;\n\n',
      E'update public.teacher_student_links\n',
      E'   set student_id = ''', (select id from 他人), E'''\n',
      E' where id = ''', (select id from 対象), E'''\n',
      E'returning id, student_id as "★書き換えられてしまった（0行であること）";\n\n',
      E'reset role;\n\n',
      E'-- ★★ 上が1行でも返ったら、すぐこれを流して元に戻してください ★★\n',
      E'update public.teacher_student_links\n',
      E'   set student_id = ''', (select student_id from 対象), E'''\n',
      E' where id = ''', (select id from 対象), E''';'
    )
  end as "★これをコピーして流してください（student_id を書き換える道）";
