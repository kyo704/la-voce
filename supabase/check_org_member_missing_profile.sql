-- ============================================================================
-- その教室の中で、profiles の行が無いのは誰か（2026-09-02・調べるだけ）
--
--   ★書き込みは1つもありません。
--
--   ★「3人」は memberships の3人とは限りません。
--     コンソールに出た 2/3 の「3」は、fetchOrgDetail が組み立てた
--     ★次の3つの合併です（components/VocalTracker.jsx）。
--         memberships.user_id
--       ∪ enrollments.student_id（status = 'active' のみ）
--       ∪ assignments.teacher_id と assignments.student_id（ended_at is null のみ）
--     ★memberships だけを見ると、在籍や担当から入ってきた人を取り落とします。
--     だから、下では★同じ合併をそのまま作ります。
--
--   置き換えるもの：<教室> … +t5 の「マイ教室」など、試している教室の uuid
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 教室の当たりをつける（uuid が手元に無いとき）
--     ★ここで名前と、関わっている人数を見てから②へ進んでください。
-- ---------------------------------------------------------------------------
select o.id as "教室の uuid", o.name as "名前", o.created_by as "作った人",
       (select count(*) from public.memberships m where m.org_id = o.id) as "職員",
       (select count(*) from public.enrollments e
         where e.org_id = o.id and e.status = 'active') as "在籍している生徒",
       (select count(*) from public.assignments a
         where a.org_id = o.id and a.ended_at is null) as "担当"
  from public.organizations o
 order by o.created_at;

-- ---------------------------------------------------------------------------
-- ② ★アプリと同じ合併を作り、profiles の有無を並べる
--
--   ★「関わり方」の列で、その人がどこから入ってきたかが分かります。
--     memberships に居ないのに出てくる人は、在籍か担当から来ています。
-- ---------------------------------------------------------------------------
with ids as (
  select m.user_id as uid, '職員（memberships）' as src
    from public.memberships m where m.org_id = '<教室>'
  union all
  select e.student_id, '生徒（enrollments）'
    from public.enrollments e
   where e.org_id = '<教室>' and e.status = 'active'
  union all
  select a.teacher_id, '担当の先生（assignments）'
    from public.assignments a
   where a.org_id = '<教室>' and a.ended_at is null
  union all
  select a.student_id, '担当されている生徒（assignments）'
    from public.assignments a
   where a.org_id = '<教室>' and a.ended_at is null
),
uniq as (
  select uid, string_agg(distinct src, ' / ') as srcs from ids group by uid
)
select u.uid as "利用者",
       u.srcs as "関わり方",
       (p.id is not null) as "profiles の行があるか",
       nullif(trim(coalesce(p.display_name, '')), '') as "表示名",
       au.email as "メール",
       au.created_at as "auth に作られた日時",
       au.last_sign_in_at as "最後のログイン",
       (au.id is null) as "★auth.users にも居ないか"
  from uniq u
  left join public.profiles p on p.id = u.uid
  left join auth.users au on au.id = u.uid
 order by (p.id is not null), u.uid;

-- ★「profiles の行があるか」が false の行が、探している人です。
-- ★もし「auth.users にも居ないか」が true なら、話が変わります。
--   その場合、memberships や enrollments が★存在しない利用者を指しています
--   （外部キーが効いていない、ということです）。⑤で確かめます。

-- ---------------------------------------------------------------------------
-- ③ 数を合わせる（コンソールの 2/3 と突き合わせる）
-- ---------------------------------------------------------------------------
with ids as (
  select m.user_id as uid from public.memberships m where m.org_id = '<教室>'
  union
  select e.student_id from public.enrollments e
   where e.org_id = '<教室>' and e.status = 'active'
  union
  select a.teacher_id from public.assignments a
   where a.org_id = '<教室>' and a.ended_at is null
  union
  select a.student_id from public.assignments a
   where a.org_id = '<教室>' and a.ended_at is null
)
select count(*) as "★関わっている人数（画面の分母）",
       count(p.id) as "★profiles がある人数（画面の分子）",
       count(*) - count(p.id) as "★足りない人数"
  from ids i left join public.profiles p on p.id = i.uid;

-- ---------------------------------------------------------------------------
-- ④ その人が、ほかの教室にも居るか（影響の広さ）
-- ---------------------------------------------------------------------------
-- ②で見つかった uuid を入れてください
-- select o.name as "教室", 'memberships' as "どこに" from public.memberships m
--   join public.organizations o on o.id = m.org_id where m.user_id = '<見つかった uuid>'
-- union all
-- select o.name, 'enrollments' from public.enrollments e
--   join public.organizations o on o.id = e.org_id where e.student_id = '<見つかった uuid>';

-- ---------------------------------------------------------------------------
-- ⑤ 外部キーが効いているか（②で「auth.users にも居ない」が出たときだけ）
-- ---------------------------------------------------------------------------
select conname as "制約名",
       conrelid::regclass as "表",
       pg_get_constraintdef(oid) as "定義"
  from pg_constraint
 where conrelid in ('public.memberships'::regclass,
                    'public.enrollments'::regclass,
                    'public.assignments'::regclass)
   and contype = 'f'
 order by 2, 1;
