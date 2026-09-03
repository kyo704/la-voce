-- ============================================================================
-- ★自分で自分の役職を上げられるか（2026-09-03・実地の確認・v2）
--
--   ★v1 との違い：★IDを人が選びません。照会が選びます。
--     私は本番のデータを見られないので、IDを推測できません。
--     ★推測して間違った口座で試すと、「塞がっている」と誤って結論しかねません。
--
--   ★段取り
--     ① 試験に使える組み合わせを、照会に選ばせる
--     ② その結果から、★実行できる SQL がそのまま出てくる
--     ③ 出てきた SQL を、そのまま貼って流す
--
--   ★すべて begin 〜 rollback です。データは1行も残りません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① いまの姿を見る（★読むだけ）
-- ---------------------------------------------------------------------------
select m.org_id as "教室", o.name as "教室の名前",
       m.role as "役職", u.email as "メール",
       coalesce(p.is_internal, false) as "試験用か"
  from public.memberships m
  join public.organizations o on o.id = m.org_id
  left join auth.users u on u.id = m.user_id
  left join public.profiles p on p.id = m.user_id
 order by o.name, m.role desc, u.email;

-- ★owner が2人以上いる教室（★9/2 の跡が残っていないか）
select org_id as "教室", count(*) as "owner の数",
       string_agg(coalesce(u.email, m.user_id::text), ', ') as "誰"
  from public.memberships m
  left join auth.users u on u.id = m.user_id
 where m.role = 'owner'
 group by org_id having count(*) > 1;

-- ---------------------------------------------------------------------------
-- ② ★試験の SQL を、照会に作らせる
--
--   ★条件
--     ・教室は、いちばんメンバーの多いもの（試験のじゃまをしないもの）
--     ・使う人は、★試験用の口座（is_internal = true）
--     ・★その教室にまだ入っていない人（一意制約に当たらないように）
--   ★出てきた文字列を、そのままコピーして流してください。
-- ---------------------------------------------------------------------------
with 教室 as (
  select o.id
    from public.organizations o
    join public.memberships m on m.org_id = o.id
   group by o.id
   order by count(*) desc
   limit 1
),
使う人 as (
  select u.id
    from auth.users u
    join public.profiles p on p.id = u.id
   where p.is_internal = true
     and not exists (select 1 from public.memberships m
                      where m.user_id = u.id and m.org_id = (select id from 教室))
   order by u.created_at
   limit 1
)
select
  case when (select id from 使う人) is null
    then '★試験に使える口座がありません。is_internal = true で、その教室に入っていない人が要ります。'
    else concat(
      E'begin;\n',
      E'  insert into public.memberships (org_id, user_id, role)\n',
      E'  values (''', (select id from 教室), E''', ''', (select id from 使う人), E''', ''teacher'')\n',
      E'  returning id, role as "作った行（teacher）";\n\n',
      E'  select set_config(''request.jwt.claims'',\n',
      E'    ''{"sub":"', (select id from 使う人), E'","role":"authenticated"}'', true);\n',
      E'  set local role authenticated;\n\n',
      E'  update public.memberships set role = ''admin''\n',
      E'   where user_id = auth.uid() and org_id = ''', (select id from 教室), E'''\n',
      E'  returning id, role as "★admin に上がってしまった行（0行であること）";\n\n',
      E'  update public.memberships set role = ''owner''\n',
      E'   where user_id = auth.uid() and org_id = ''', (select id from 教室), E'''\n',
      E'  returning id, role as "★owner に上がってしまった行（0行であること）";\n\n',
      E'  select role as "★いまの役職（teacher のままであること）"\n',
      E'    from public.memberships\n',
      E'   where user_id = auth.uid() and org_id = ''', (select id from 教室), E''';\n',
      E'rollback;'
    )
  end as "★これをコピーして流してください";

-- ---------------------------------------------------------------------------
-- ③ ★別の道：はじめから高い役職で入れるか
--
--   ★②は「上げる」道、③は「最初から高く入る」道です。★別物です。
--   ★②が塞がっていても、③が開いていれば同じことができます。
--
--   ★memberships_insert_bootstrap_owner の WITH CHECK は
--       user_id = auth.uid() AND role = 'owner'
--       AND EXISTS(自分が created_by の教室) AND NOT EXISTS(その教室に誰か居る)
--     ★最後の条件が効いているなら、人が居る教室には入れません。
--     ★ですが「効いているはず」です。確かめます。
-- ---------------------------------------------------------------------------
with 教室 as (
  select o.id from public.organizations o
    join public.memberships m on m.org_id = o.id
   group by o.id order by count(*) desc limit 1
),
使う人 as (
  select u.id from auth.users u join public.profiles p on p.id = u.id
   where p.is_internal = true
     and not exists (select 1 from public.memberships m
                      where m.user_id = u.id and m.org_id = (select id from 教室))
   order by u.created_at limit 1
)
select concat(
  E'begin;\n',
  E'  select set_config(''request.jwt.claims'',\n',
  E'    ''{"sub":"', (select id from 使う人), E'","role":"authenticated"}'', true);\n',
  E'  set local role authenticated;\n',
  E'  insert into public.memberships (org_id, user_id, role)\n',
  E'  values (''', (select id from 教室), E''', auth.uid(), ''owner'')\n',
  E'  returning id, role as "★owner として入れてしまった行（エラーになるのが正しい）";\n',
  E'rollback;'
) as "★これをコピーして流してください（owner として入る道）";

-- ★③はポリシーに弾かれれば、0行ではなく★エラーで止まります。
--   ★エラーが出ることが、正しい姿です。行が返ったら、★穴です。

-- ---------------------------------------------------------------------------
-- ④ ★書き込まずに確かめる（2026-09-03 追記）
--
--   ★begin 〜 rollback は、守りとして数えません。
--     SQL エディタが1文ずつ流していると、囲みが効きません。
--     ★実際に、②の insert が本番に残りました（id = 64a84bcd-…）。
--     ★「エラーだから何も起きていない」とは考えません。
--
--   ★下は1行も書き込みません。ポリシーの式だけを評価します。
-- ---------------------------------------------------------------------------
select
  public.role_rank('owner')   as "owner の順位",
  public.role_rank('admin')   as "admin の順位",
  public.role_rank('teacher') as "teacher の順位",
  (public.role_rank('owner') <= public.role_rank('teacher'))
    as "★teacher が owner へ上げられる条件（false であること）",
  (public.role_rank('admin') <= public.role_rank('teacher'))
    as "★teacher が admin へ上げられる条件（false であること）",
  (public.role_rank('teacher') <= public.role_rank('teacher'))
    as "同じ役職への更新（true でよい）";

-- ★これは「式が正しいこと」を示すだけです。
--   ★WITH CHECK の副問い合わせが元の値を見るかどうかは、これでは分かりません。
--   そこは実際の update でしか確かめられません（②で確認済み・弾かれました）。
