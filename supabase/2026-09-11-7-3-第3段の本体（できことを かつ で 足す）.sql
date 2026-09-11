-- ============================================================================
-- §7-3／§7-4　★第3段の 本体 ── ★できことを「かつ」で 足す
--
--   ★出どころ 作業指示 §7-3・§7-4
--   ★★下ごしらえ（has_can ／ school_wide_perms ／ can_grant_post）は 済みです。
--   ★★第2段（役職を 付ける）も 済み、★食い違いは 0行 でした。
--
-- ============================================================================
-- ★★★作り方を 1つ 変えました。★理由を 書きます。
--
--   ★★はじめの 案　★いまの 決まりを **書き換える**
--     ★memberships_update_role_management の 中の
--     ★is_org_owner_or_admin(…) を has_can(org_id,'post') に 差し替える。
--
--   ★★やめました。★2つ 危ないからです。
--     ★① 私は、★いまの 式を **そのままの 字**で 持って いません。
--        ★★坂本さんの お知らせは、★読みやすく まとめた ものです。
--        ★★書き換えると、★いま 守って いる ほかの 条件を 落とします。
--        ★★とくに role_rank（★自分を 昇格できない）は、★落として は いけません。
--     ★② 書き換えは、★**広げる** ことも できて しまいます。
--        ★★1文字 まちがえると、★穴が 開きます。★気づけません。
--
--   ★★いまの 案　★**止める 決まりを 1つ 足す**（restrictive）
--     ★★止める 決まりは、★ほかの 決まりと **かつ（AND）**で つながります。
--     ★★★だから、★**狭める ことしか できません**。★絶対に 広がりません。
--     ★★いまの 決まりには 1文字も 触れません。
--     ★★効き目　★これまでの 条件 **かつ** できこと。
--       ★→ ★role だけで 通って いた 道が、★できことも 要る ように なります。
--       ★→ ★§7 の「職員が 課長の できことを 通せる」が 閉じます。
--     ★★戻すのも かんたんです。★drop policy 1行 です。
--
--   ★★「決まりごとに 条件を 書かない」（★§7-3）は 守れて います。
--     ★★条件は 書いて いません。★has_can を **呼ぶ**だけ です。
--     ★★決めは has_can 1か所に あります。
--
--   ★★このあと（★別の 日に）
--     ★★しばらく 動かして、★困りごとが 出ない ことを 確かめてから、
--     ★★ゆるい ほうの 決まりから role を 外します。★字の 片づけです。
--
-- ============================================================================
--   ★★★流す 前に、★1つ お確かめ ください。
--     ★第2段の ⑥が **0行** で あった こと。★これは 済んで います。
--   ★★ほかの 台本と 同時に 流さないで ください。
-- ============================================================================


-- ===========================================================================
-- ① ★いまの 決まり（★流す 前の 記録）
-- ===========================================================================
select
  tablename  as "表",
  policyname as "決まり",
  cmd        as "いつ",
  permissive as "ゆるい か",
  qual       as "読むとき",
  with_check as "書くとき"
from pg_policies
where schemaname='public' and tablename in ('memberships','org_events')
order by tablename, permissive, cmd, policyname;


-- ===========================================================================
-- ② ★memberships ── ★役職を 変えるには、★できことが 要る
--
--   ★★これが §7 の 本体です。
--     ★★「職員が 自分を 学長に できる」を、★台帳の 側で 閉じます。
--
--   ★★2つ 足します。
--     ★㋐ 役職を 変える には post を 持つ こと（★または 自分の 行）
--     ★㋑ 渡す 役職は、★自分が 持って いる ものだけ（★§7-4）
--
--   ★★自分の 行は これまでどおり です。
--     ★★教室を 抜ける、★自分の ことを 直す ── ★塞ぎません。
--     ★★ただし ㋑は かかります。★自分に、★自分が 持って いない
--       ★できことの 役職を 付ける ことは できません。
--       ★★これが「自分を 学長に する」道 そのもの です。
-- ===========================================================================
set lock_timeout = '5s';

drop policy if exists "memberships_update_needs_can_post" on public.memberships;

create policy "memberships_update_needs_can_post"
  on public.memberships
  as restrictive
  for update
  to authenticated
  using (
    -- ★自分の 行か、★「ひとの 役職を 変える」を 持って いる こと
    auth.uid() = user_id
    or public.has_can(org_id, 'post')
  )
  with check (
    (auth.uid() = user_id or public.has_can(org_id, 'post'))
    -- ★★§7-4　★自分が 持って いない できことは 渡せません。
    --   ★★自分の 行にも かかります。★そこが 大事です。
    and public.can_grant_post(org_id, post_id)
  );


-- ===========================================================================
-- ③ ★org_events ── ★行事を 書くには、★できことが 要る
--
--   ★★いま　org_events_write_admin　role = ANY(ARRAY['owner','admin'])
--   ★★これに「かつ gyoji を 持って いる」を 足します。
--
--   ★★★読む ほうには かけません。
--     ★★org_events_select_member は、★教室の 人が 読める ように して います。
--     ★★読む ほうにも かけると、★行事が 誰にも 見えなく なります。
--     ★★だから、★書く 3つ（insert／update／delete）だけ に します。
-- ===========================================================================
drop policy if exists "org_events_insert_needs_can_gyoji" on public.org_events;
create policy "org_events_insert_needs_can_gyoji"
  on public.org_events as restrictive for insert to authenticated
  with check (public.has_can(org_id, 'gyoji'));

drop policy if exists "org_events_update_needs_can_gyoji" on public.org_events;
create policy "org_events_update_needs_can_gyoji"
  on public.org_events as restrictive for update to authenticated
  using (public.has_can(org_id, 'gyoji'))
  with check (public.has_can(org_id, 'gyoji'));

drop policy if exists "org_events_delete_needs_can_gyoji" on public.org_events;
create policy "org_events_delete_needs_can_gyoji"
  on public.org_events as restrictive for delete to authenticated
  using (public.has_can(org_id, 'gyoji'));


-- ===========================================================================
-- ④ ★立ったかの 確かめ
--
--   ★★止める 決まりが 4つ 出る こと。
--   ★★ゆるい ほうは、★1つも 減って いない こと。
-- ===========================================================================
select
  tablename  as "表",
  policyname as "決まり",
  cmd        as "いつ",
  permissive as "ゆるい か",
  qual       as "読むとき",
  with_check as "書くとき"
from pg_policies
where schemaname='public' and tablename in ('memberships','org_events')
order by tablename, permissive, cmd, policyname;

select
  tablename as "表",
  count(*) filter (where permissive = 'PERMISSIVE')  as "ゆるい 決まり",
  count(*) filter (where permissive = 'RESTRICTIVE') as "止める 決まり"
from pg_policies
where schemaname='public' and tablename in ('memberships','org_events')
group by tablename
order by tablename;


-- ===========================================================================
-- ⑤ ★★誰も 締め出されて いない ことの 確かめ
--
--   ★★いま 役職を 持って いる 方が、★その できことを 通せる か。
--   ★★「★通らない」が 1行でも 出たら、★⑥で 戻して ください。
-- ===========================================================================
select
  o.name  as "教室",
  m.role  as "役割",
  p.name  as "役職",
  (p.perms -> 'post')::text  = 'true' as "役職を 変えられる か",
  (p.perms -> 'gyoji')::text = 'true' as "行事を 書ける か",
  (p.perms -> 'meibo')::text = 'true' as "名簿を 見られる か"
from public.memberships m
join public.organizations o on o.id = m.org_id
left join public.org_posts p on p.id = m.post_id
order by o.name, m.role, p.name;


-- ===========================================================================
-- ⑥ ★戻し方（★流しません。★要る ときだけ）
--
--   ★★止める 決まりを 外すだけ です。
--   ★★いまの 決まりには 1文字も 触って いないので、★もとに 戻ります。
--
-- drop policy if exists "memberships_update_needs_can_post" on public.memberships;
-- drop policy if exists "org_events_insert_needs_can_gyoji" on public.org_events;
-- drop policy if exists "org_events_update_needs_can_gyoji" on public.org_events;
-- drop policy if exists "org_events_delete_needs_can_gyoji" on public.org_events;
-- ===========================================================================


-- ===========================================================================
-- ⑦ ★★1つ、★はっきり させて おきます ── ★新しい 教室の はじめの 1人
--
--   ★★can_grant_post は、★役職を 持って いない 方に false を 返します。
--     ★★だから、★役職の 無い 方が 自分に 役職を 付ける ことは できません。
--     ★★これは わざと です。★それが「自分を 学長に する」道 だからです。
--
--   ★★では、★新しい 教室の はじめの 1人は どう するか。
--     ★★画面から 台帳に 直に 書く 道では ありません。
--     ★★app/api/org/posts の action:"template" が 作ります。
--       ★★あちらは 裏口（service role）で 動きます。
--       ★★決まりも 権限も 飛び越えます。★この 決まりは かかりません。
--     ★★つまり、★はじめの 1人は これまでどおり 作れます。
--
--   ★★もし 作れなく なったら、★それは ここでは なく、
--     ★app/api/org/posts の mayTouchPosts の ほうです。★お知らせ ください。
-- ===========================================================================
