-- ============================================================================
-- auth.users を指している列の棚卸し（★読むだけ。1行も変えません）
--
--   ★何のためか
--     退会の掃除から漏れている列が無いかを見ます。
--     同じ壊れ方を3回やりました。3回とも、
--     ★「auth.users を指している列の全体像」がどこにも無かったのが原因です。
--       ① lessons / entry_comments … 一覧にあるのに user_id 列が無かった
--       ② organizations.created_by … NOT NULL で null にできなかった
--       ③ events … ★そもそも一覧に無く、掃除から丸ごと漏れていた
--
--   ★1つめの表の結果を、lib/authUserReferences.js と突き合わせてください。
--     ★DBにあって台帳に無い列が、次の事故です。
--
--   ★information_schema ではなく pg_catalog を使います。
--     information_schema は権限で結果が絞られ、★見えない列が
--     「無い」ように見えます。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- 1つめ：auth.users を指している列と、親を消したときの動き
--
--   ★「NO ACTION」の列は、先に自分で消すか null にしないと、
--     auth.users の削除が失敗します（＝退会できません）。
--   ★「CASCADE」の列は、auth.users を消せば一緒に消えます。
--     ただし★行動ログのように、本人のデータとして
--     先に消すべきものは、CASCADE でも一覧に入れてください。
-- ---------------------------------------------------------------------------
select c.conrelid::regclass::text as "表",
       a.attname                  as "列",
       case c.confdeltype
         when 'c' then 'CASCADE'
         when 'a' then '★NO ACTION（先に片付けないと退会できない）'
         when 'n' then 'SET NULL'
         when 'r' then '★RESTRICT（先に片付けないと退会できない）'
         when 'd' then 'SET DEFAULT'
         else c.confdeltype::text
       end                        as "auth.users を消したときの動き",
       c.conname                  as "制約の名前"
  from pg_constraint c
  join unnest(c.conkey) with ordinality k(attnum, ord) on true
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
 where c.contype = 'f'
   and c.confrelid = 'auth.users'::regclass
   and c.connamespace::regnamespace::text <> 'auth'
 order by 3, 1, 2;

-- ---------------------------------------------------------------------------
-- 2つめ：★NO ACTION / RESTRICT だけを抜き出す
--
--   ★ここに出た列は、すべて lib/accountDeletion.js の
--     USER_OWNED_TABLES / SPECIAL_DELETES / NULLED_REFERENCES の
--     どれかに入っていなければなりません。
--     1つでも入っていなければ、★その列を持つ人は退会できません。
-- ---------------------------------------------------------------------------
select c.conrelid::regclass::text as "表",
       a.attname                  as "列",
       '★これが一覧に無ければ、退会が失敗します' as "確認すること"
  from pg_constraint c
  join unnest(c.conkey) with ordinality k(attnum, ord) on true
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
 where c.contype = 'f'
   and c.confrelid = 'auth.users'::regclass
   and c.connamespace::regnamespace::text <> 'auth'
   and c.confdeltype in ('a', 'r')
 order by 1, 2;

-- ---------------------------------------------------------------------------
-- 3つめ：events の制約を、名指しで確かめる
--
--   ★supabase/migration_events.sql には on delete cascade と書いてあります。
--     ですが、その create は「create table if not exists」です。
--     ★表が先に手で作られていれば、その行は一度も適用されていません。
--     ファイルではなく、ここの結果が事実です。
-- ---------------------------------------------------------------------------
select c.conname as "制約の名前",
       case c.confdeltype
         when 'c' then 'CASCADE（ファイルの記載どおり）'
         when 'a' then '★NO ACTION（ファイルと食い違っている）'
         when 'r' then '★RESTRICT（ファイルと食い違っている）'
         else c.confdeltype::text
       end as "実物の動き"
  from pg_constraint c
 where c.contype = 'f'
   and c.conrelid = 'public.events'::regclass
   and c.confrelid = 'auth.users'::regclass;

-- ---------------------------------------------------------------------------
-- 4つめ：いま何人が「退会できない」状態か
--
--   ★events に行がある人の数です。この人たちは、2026-09-01 の修正が
--     本番に出るまで、退会しようとすると失敗していました。
--     （3つめが CASCADE なら、events は原因ではありません）
-- ---------------------------------------------------------------------------
select count(distinct user_id) as "events に行がある人数",
       count(*)                as "events の行数"
  from public.events;
