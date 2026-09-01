-- ============================================================================
-- オーナーが退会するときの教室の扱い（判断 2026-09-01）
--
--   判断A  organizations.created_by を null 可にする  → このファイル
--   判断B  ほかに誰もいない教室は、行ごと消す         → lib/orgClosure.js
--   判断C  自動で別の人に引き継ぐ                     → ★却下（作りません）
--
--   ★なぜ null 可にするのか
--     created_by は「誰が作ったか」という★過ぎた事実の記録です。
--     lessons.created_by と同じ扱いにします。人が居なくなっても、
--     教室そのものは他の人が使っているので、行は残します。
--     監査は created_at（いつ作られたか）で辿ります。
--
--   ★なぜ自動で引き継がないのか（判断C＝却下）
--     owner は契約者です。自動で移すと、承諾していない人に
--     ★支払いの義務を負わせることになります。
--     引き継ぎは、知らせる→承諾を得る→移す、の順で公開後に作ります。
--     それまでは運営者が手で入れ替えます（画面から連絡できます）。
--
--   ★何度実行しても同じ結果になります。
--   ★データは1行も書き換えません。制約をゆるめるだけです。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① 実行前の状態（★記録として残してください）
-- ---------------------------------------------------------------------------
select is_nullable as "いま null を許すか"
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'organizations'
   and column_name = 'created_by';

-- ---------------------------------------------------------------------------
-- ② null 可にする
--
--   ★drop not null は、すでに外れていても失敗しません。
--     そのまま何度でも流せます。
-- ---------------------------------------------------------------------------
alter table public.organizations
  alter column created_by drop not null;

comment on column public.organizations.created_by is
  '誰が作ったか（過ぎた事実）。★null 可。退会した人の教室では null になる。'
  '★ここを見て権限を決めないこと。権限は memberships.role で判定する。';

-- ---------------------------------------------------------------------------
-- ③ 確かめる（"YES" になっていること）
-- ---------------------------------------------------------------------------
select is_nullable as "null を許すか（YESであること）"
  from information_schema.columns
 where table_schema = 'public'
   and table_name = 'organizations'
   and column_name = 'created_by';

-- ---------------------------------------------------------------------------
-- ④ 教室を閉じるときに消す表の、外部キーの実際の向き
--
--   ★lib/orgClosure.js の CLOSE_ORG_DELETE_ORDER と突き合わせてください。
--     コードの一覧は、この結果に合わせて書いてあります。
--     ずれていたら、★コードのほうを直します（実装が事実、ではなく
--     ここでは DB が事実です。コードは DB を追いかける側です）。
-- ---------------------------------------------------------------------------
select c.conrelid::regclass::text as "参照している表",
       a.attname                  as "列",
       case c.confdeltype
         when 'c' then 'CASCADE（親を消すと一緒に消える）'
         when 'a' then 'NO ACTION（★先に消さないと失敗する）'
         when 'n' then 'SET NULL'
         when 'r' then 'RESTRICT'
         else c.confdeltype::text
       end                        as "親を消したときの動き"
  from pg_constraint c
  join unnest(c.conkey) with ordinality k(attnum, ord) on true
  join pg_attribute a on a.attrelid = c.conrelid and a.attnum = k.attnum
 where c.contype = 'f'
   and c.confrelid = 'public.organizations'::regclass
 order by 1, 2;
