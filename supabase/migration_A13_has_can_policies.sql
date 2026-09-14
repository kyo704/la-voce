-- ============================================================================
-- A13 ── 決まりを、★役職（has_can）で 判じる ように 移す
--
--   ★出どころ 2026-09-14、★裁定 その53（★Opus・坂本さん 承認）／★修正の記録 No.016
--
--   ★★いま、★11本の 決まりが「★役（role）」で 判じて います。
--     ★`is_org_owner_or_admin(auth.uid(), org_id)`
--     ★`EXISTS (... m.role IN ('owner','admin'))`
--   ★★これを「★できること（札）」で 判じる ように 移します。
--     ★`has_can(org_id, '<札>')`
--
--   ★★★いちばん 大事な 決まり ──
--     ★★**右の 枝だけ を 直します。**
--     ★★`(auth.uid() = user_id OR is_org_owner_or_admin(...))` の
--       ★左（★自分の 行）は **触りません**。
--     ★★まるごと 書き換えると、★ご自分の 行が 読めなく なります。
--
--   ★★だから、★この 紙は **書き換えを 自分で 組み立てます**。
--     ★★いまの 条件文を 台帳から 読み、★その 中の
--       ★`is_org_owner_or_admin(auth.uid(), org_id)` という **字だけ** を
--       ★`has_can(org_id, '札')` に 置き換えます。
--     ★★ほかの 枝は 1文字も 変わりません。★構造で 守ります。
--
--   ★★7番（memberships_update_role_management）は **触りません**。
--     ★`role_rank` が すでに 守って います（★裁定 その19）。
--
--   ★★42P17（ぐるぐる回り）に ついて。
--     ★`has_can` は `SECURITY DEFINER` です。★RLS を 越えて 読みます。
--     ★★だから `memberships` の 決まりの 中で 呼んでも 回りません。
--
--   ★★権限（GRANT）は 触りません。★決まり（POLICY）だけ です。
--
--   ★★★この 紙は **2部** です。
--     ★第1部 … いまの 姿を 出すだけ（★何も 変えません）
--     ★第2部 … 置き換え（★第1部を 見てから 流して ください）
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════
-- 第1部　いまの 姿を 出す（★変えません）
-- ════════════════════════════════════════════════════════════════════════

-- ★★① 11本の 決まりの、★条件文を 丸ごと 出します。
--   ★★報告では 長くて 切れて いました。★ここで 全文が 出ます。
select
  p.tablename                       as 表,
  p.policyname                      as 決まり,
  p.cmd                             as 何に,
  coalesce(p.qual, '（無し）')        as 読める条件,
  coalesce(p.with_check, '（無し）')  as 書ける条件
from pg_policies p
where p.schemaname = 'public'
  and p.policyname in (
    'assignments_all_owner_admin',
    'assignments_select',
    'enrollments_all_owner_admin',
    'memberships_delete_admin',
    'memberships_insert_bootstrap_owner',
    'memberships_select',
    'org_events_write_admin',
    'org_invitations_insert',
    'org_invitations_select',
    'org_messages_insert',
    'org_messages_select'
  )
order by p.tablename, p.policyname;

-- ★★② どの 決まりが「役で 判じる 字」を 持って いるかを 数えます。
select
  p.policyname                                   as 決まり,
  (coalesce(p.qual,'') || ' ' || coalesce(p.with_check,'')) like '%is_org_owner_or_admin%'
                                                 as 関数で判じる,
  (coalesce(p.qual,'') || ' ' || coalesce(p.with_check,'')) like '%role%=%ANY%'
                                                 as 字で判じる,
  (coalesce(p.qual,'') || ' ' || coalesce(p.with_check,'')) like '%auth.uid() = %'
                                                 as 自分の枝あり
from pg_policies p
where p.schemaname = 'public'
  and p.policyname in (
    'assignments_all_owner_admin','assignments_select','enrollments_all_owner_admin',
    'memberships_delete_admin','memberships_insert_bootstrap_owner','memberships_select',
    'org_events_write_admin','org_invitations_insert','org_invitations_select',
    'org_messages_insert','org_messages_select')
order by p.policyname;

-- ★★③ has_can が ある ことを 確かめます。★無ければ 第2部は 流せません。
--
--   ★★★`SECURITY DEFINER` だけでは、★RLS を 越えません（★裁定・Opus）。
--     ★★越えるのは、★**関数の 持ち主が 表の 持ち主**だから です。
--     ★★だから 持ち主も 見ます。
select p.proname,
       p.prosecdef                  as 定義者の権限で動く,
       pg_get_userbyid(p.proowner)  as 持ち主
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'has_can';

-- ★★④ ★★FORCE RLS を 確かめます。
--
--   ★★`relforcerowsecurity` が true なら、★**持ち主にも RLS が かかります**。
--   ★★その ときは `memberships_select` の 中で `has_can` を 呼ぶと、
--     ★`memberships` を 読む → 決まりが 走る → また `has_can` …と 回ります。
--   ★★★1つでも true が 出たら、★**第2部を 流さないで ください**。
--     ★そのまま お知らせください。
select relname                as 表,
       relrowsecurity         as RLSが入っている,
       relforcerowsecurity    as ★持ち主にもかかる
from pg_class
where relname in ('memberships', 'enrollments', 'assignments',
                  'org_invitations');


-- ★★下の 表が、★置き換える 決まりと 札です。
--
--   ★★下の かたまりは、★`is_org_owner_or_admin(auth.uid(), org_id)` という
--     ★**字だけ** を `has_can(org_id, '札')` に 置き換えます。
--   ★★置き換える 決まりと 札は、★この 表の とおりです。
--
--     | # | 表 | 決まり | 何に | 札 |
--     |---|---|---|---|---|
--     | 1 | assignments     | assignments_all_owner_admin        | ALL    | meibo |
--     | 2 | assignments     | assignments_select                 | SELECT | meibo |
--     | 3 | enrollments     | enrollments_all_owner_admin        | ALL    | meibo |
--     | 4 | memberships     | memberships_delete_admin           | DELETE | post |
--     | 5 | memberships     | memberships_insert_bootstrap_owner | INSERT | post |
--     | 6 | memberships     | memberships_select                 | SELECT | post |
--     | 9 | org_invitations | org_invitations_insert             | INSERT | meibo |
--     |10 | org_invitations | org_invitations_select             | SELECT | meibo |
--
--   ★★8・11・12（org_events／org_messages）は **この かたまりに 入れて いません**。
--     ★★あの 3本は 関数では なく、★`EXISTS (... m.role IN ('owner','admin'))` の
--       ★**字**で 判じて います。★置き換える 相手が ちがいます。
--     ★★第1部の 全文を 見てから、★別の 紙で 直します。
--       ★★見ないまま 書き換えると、★ほかの 枝を 落とします。
--
--   ★★2・6 は「自分の 枝」を 持ちます。
--     ★★この やり方なら、★左の 枝は 1文字も 変わりません。

-- ════════════════════════════════════════════════════════════════════════
-- 第2部の 前に　── ★もとの 姿を 控えます
-- ════════════════════════════════════════════════════════════════════════
--
--   ★★第1部は **出すだけ** です。★出した 紙は 戻す 道では ありません。
--   ★★だから、★台帳の 中に 控えを 作ります。
--   ★★何度 流しても 増えません（★同じ 表に 足すだけ です）。

create table if not exists public._a13_policy_backup (
  saved_at    timestamptz,
  schemaname  text,
  tablename   text,
  policyname  text,
  cmd         text,
  permissive  text,
  roles       name[],
  qual        text,
  with_check  text
);

insert into public._a13_policy_backup
select now(), p.schemaname, p.tablename, p.policyname, p.cmd,
       p.permissive, p.roles, p.qual, p.with_check
from pg_policies p
where p.schemaname = 'public'
  and p.policyname in (
    'assignments_all_owner_admin','assignments_select','enrollments_all_owner_admin',
    'memberships_delete_admin','memberships_insert_bootstrap_owner','memberships_select',
    'memberships_update_role_management',
    'org_events_write_admin','org_invitations_insert','org_invitations_select',
    'org_messages_insert','org_messages_select');

-- ★★控えが 取れたかを 見ます。★12行 ある はずです。
select count(*) as 控えた本数, max(saved_at) as いつ
from public._a13_policy_backup;


-- ════════════════════════════════════════════════════════════════════════
-- 第2部　置き換え（★★1つの かたまりとして 流して ください）
-- ════════════════════════════════════════════════════════════════════════
--
--   ★★★流す 前に、★第1部の ①の 出力を 読んで ください。
--     ★★台帳は 条件文を 書き直して 返す ことが あります。
--       ★例 `is_org_owner_or_admin(auth.uid(), assignments.org_id)`
--         ★（★表の 名前が 付く）
--     ★★その ときは、★下の 置き換えは **何も 起きず 飛ばします**。
--       ★「飛ばしました」と 出ます。★それは 誤りでは なく 合図です。
--     ★★★字を 当てずっぽうで 直さないで ください。
--       ★出た 字を そのまま お知らせください。★こちらで 直します。
--
--   ★★このまま 1回で 流して ください。★途中で 切ると 戻りません。

do $$
declare
  r         record;
  v_new_q   text;
  v_new_w   text;
  v_key     text;
  v_map     jsonb := jsonb_build_object(
    'assignments_all_owner_admin',        'meibo',
    'assignments_select',                 'meibo',
    'enrollments_all_owner_admin',        'meibo',
    'memberships_delete_admin',           'post',
    'memberships_insert_bootstrap_owner', 'post',
    'memberships_select',                 'post',
    'org_invitations_insert',             'meibo',
    'org_invitations_select',             'meibo'
  );
begin
  -- ★★has_can が 無ければ、★ここで 止めます。
  if not exists (
    select 1 from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'has_can'
  ) then
    raise exception '★has_can が ありません。★先に 作って ください。';
  end if;

  for r in
    select p.schemaname, p.tablename, p.policyname, p.cmd, p.permissive,
           p.roles, p.qual, p.with_check
    from pg_policies p
    where p.schemaname = 'public'
      and v_map ? p.policyname
  loop
    v_key := v_map ->> r.policyname;

    -- ★★字だけ を 置き換えます。★ほかの 枝は 触りません。
    v_new_q := replace(coalesce(r.qual, ''),
                       'is_org_owner_or_admin(auth.uid(), org_id)',
                       'has_can(org_id, ''' || v_key || ''')');
    v_new_w := replace(coalesce(r.with_check, ''),
                       'is_org_owner_or_admin(auth.uid(), org_id)',
                       'has_can(org_id, ''' || v_key || ''')');

    -- ★★置き換えが 1つも 起きなかった なら、★その 決まりは 飛ばします。
    --   ★★形が ちがう ということです。★黙って 作り直しません。
    if v_new_q = coalesce(r.qual, '') and v_new_w = coalesce(r.with_check, '') then
      raise notice '★飛ばしました（字が 見つかりません）: %', r.policyname;
      continue;
    end if;

    execute format('drop policy %I on public.%I', r.policyname, r.tablename);

    execute
      'create policy ' || quote_ident(r.policyname)
      || ' on public.' || quote_ident(r.tablename)
      || ' as ' || case when r.permissive = 'PERMISSIVE'
                        then 'permissive' else 'restrictive' end
      || ' for ' || case r.cmd
                      when 'ALL' then 'all'
                      when 'SELECT' then 'select'
                      when 'INSERT' then 'insert'
                      when 'UPDATE' then 'update'
                      when 'DELETE' then 'delete'
                    end
      -- ★★役の 名前は、★1つずつ 引用符で 包みます。
      --   ★★包まないと、★引用が 要る 名前が あった ときに 壊れます。
      || ' to ' || (select string_agg(quote_ident(x), ', ') from unnest(r.roles) x)
      || case when coalesce(v_new_q, '') <> '' then ' using (' || v_new_q || ')' else '' end
      || case when coalesce(v_new_w, '') <> '' then ' with check (' || v_new_w || ')' else '' end;

    raise notice '★移しました: % → has_can(org_id, ''%'')', r.policyname, v_key;
  end loop;
end $$;


-- ════════════════════════════════════════════════════════════════════════
-- 第3部　確かめる（★流したあと）
-- ════════════════════════════════════════════════════════════════════════

-- ★★① 8本 とも has_can に なったか。★自分の 枝が 残って いるか。
select
  p.tablename  as 表,
  p.policyname as 決まり,
  (coalesce(p.qual,'') || ' ' || coalesce(p.with_check,'')) like '%has_can%'
               as 札で判じる,
  (coalesce(p.qual,'') || ' ' || coalesce(p.with_check,'')) like '%is_org_owner_or_admin%'
               as 役がまだ残る,
  (coalesce(p.qual,'') || ' ' || coalesce(p.with_check,'')) like '%auth.uid() = %'
               as 自分の枝
from pg_policies p
where p.schemaname = 'public'
  and p.policyname in (
    'assignments_all_owner_admin','assignments_select','enrollments_all_owner_admin',
    'memberships_delete_admin','memberships_insert_bootstrap_owner','memberships_select',
    'org_invitations_insert','org_invitations_select')
order by p.tablename, p.policyname;

-- ★★② 7番は 触って いない こと。
select policyname, qual
from pg_policies
where schemaname = 'public'
  and policyname = 'memberships_update_role_management';

-- ★★③ まだ「役で 判じる」決まりが 残って いないか（★8・11・12 が 出る はずです）。
select tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and (coalesce(qual,'') || ' ' || coalesce(with_check,'')) like '%role%'
  and (coalesce(qual,'') || ' ' || coalesce(with_check,'')) not like '%has_can%'
order by tablename, policyname;
