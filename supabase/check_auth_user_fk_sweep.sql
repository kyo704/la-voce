-- ============================================================================
-- ★auth.users を指す外部キーを、全部数える（2026-09-02・調べるだけ）
--
--   ★書き込みは1つもありません。
--
--   ★なぜもう一度やるのか
--     2026-09-01 の棚卸しは「NO ACTION / RESTRICT の一覧」を見ただけでした。
--     出てこなかった列を★「CASCADE だろう」と書いて、確かめていません。
--     assignments.teacher_id が、まさにそれです。台帳には
--     「cascade・確認ずみ」と書いてありながら、注記自身が
--     ★「CASCADE か SET NULL かは見ていない」と述べていました。
--
--   ★今回は、全部の列について★実際の規則（confdeltype）を出します。
--     「出てこなかった」ではなく「これだった」を記録します。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① auth.users を指す外部キーの全部（★これを台帳と突き合わせます）
--
--   confdeltype:  a=NO ACTION  r=RESTRICT  c=CASCADE  n=SET NULL  d=SET DEFAULT
-- ---------------------------------------------------------------------------
select c.conrelid::regclass::text            as "表",
       a.attname                             as "列",
       c.conname                             as "制約名",
       c.confdeltype                          as "削除時",
       case c.confdeltype
         when 'a' then '★NO ACTION（退会を止めます）'
         when 'r' then '★RESTRICT（退会を止めます）'
         when 'c' then 'CASCADE（行ごと消えます）'
         when 'n' then 'SET NULL（行は残り、名前だけ外れます）'
         when 'd' then 'SET DEFAULT'
       end                                    as "意味",
       col.is_nullable                        as "null にできるか"
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  join unnest(c.conkey) with ordinality as k(attnum, ord) on true
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
  left join information_schema.columns col
         on col.table_schema = n.nspname
        and col.table_name = t.relname
        and col.column_name = a.attname
 where c.contype = 'f'
   and c.confrelid = 'auth.users'::regclass
   and n.nspname = 'public'
 order by 1, 2;

-- ---------------------------------------------------------------------------
-- ② ★退会を止める側だけ（a か r）
--     ここに出た列は、すべて USER_OWNED_TABLES / SPECIAL_DELETES /
--     NULLED_REFERENCES のどれかに入っていなければなりません。
-- ---------------------------------------------------------------------------
select c.conrelid::regclass::text as "表", a.attname as "列",
       case c.confdeltype when 'a' then 'NO ACTION' else 'RESTRICT' end as "規則",
       col.is_nullable as "★null にできるか（nulled にするなら YES が要る）"
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join pg_namespace n on n.oid = t.relnamespace
  join unnest(c.conkey) with ordinality as k(attnum, ord) on true
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
  left join information_schema.columns col
         on col.table_schema = n.nspname and col.table_name = t.relname
        and col.column_name = a.attname
 where c.contype = 'f' and c.confrelid = 'auth.users'::regclass
   and n.nspname = 'public' and c.confdeltype in ('a','r')
 order by 1, 2;

-- ---------------------------------------------------------------------------
-- ③ ★今日足した表を、名指しで確かめる
--     org_events / org_event_participants / link_consents / assignments
-- ---------------------------------------------------------------------------
select c.conrelid::regclass::text as "表", a.attname as "列",
       c.confrelid::regclass::text as "参照先", c.confdeltype as "削除時",
       pg_get_constraintdef(c.oid) as "定義"
  from pg_constraint c
  join pg_class t on t.oid = c.conrelid
  join unnest(c.conkey) with ordinality as k(attnum, ord) on true
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
 where c.contype = 'f'
   and t.relname in ('org_events','org_event_participants','link_consents',
                     'assignments','enrollments','memberships','organizations')
 order by 1, 2;

-- ---------------------------------------------------------------------------
-- ④ ★assignments.teacher_id を名指しで（+g4t3 の退会を止めている行）
-- ---------------------------------------------------------------------------
select conname as "制約名", confrelid::regclass as "参照先",
       confdeltype as "削除時", pg_get_constraintdef(oid) as "定義"
  from pg_constraint
 where conrelid = 'public.assignments'::regclass and contype = 'f';

select column_name, is_nullable, data_type
  from information_schema.columns
 where table_schema = 'public' and table_name = 'assignments'
 order by ordinal_position;
-- ★teacher_id が is_nullable = NO なら、null にできません。
--   そのときは NULLED_REFERENCES では直りません（更新が失敗します）。
--   列を nullable にする移行が要ります。
