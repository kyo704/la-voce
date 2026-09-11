-- ============================================================================
-- ★★至急　notes の 門を 立てる ── ★1つずつ 流す ぶん
--
--   ★起きた こと（★2026-09-11）
--     ERROR: 40P01: deadlock detected
--     ★1831794 は 17179 の AccessExclusiveLock を 待って いる
--     ★1831793 は 19397 の AccessShareLock を 待って いる
--     CONTEXT: create policy "notes_select_own" …
--
--   ★★何が 起きたか
--     ★★決まりを 作る（create policy）には、
--       ★その 表の **いちばん 強い 鍵**（AccessExclusiveLock）が 要ります。
--       ★★そのあいだ、★誰も その 表を 読めません。
--     ★★AccessShareLock は「ただ 読むだけ」の いちばん 弱い 鍵です。
--       ★★これを 止められるのは、★いちばん 強い 鍵 だけです。
--     ★★つまり、★2つの 側が、★たがいに 相手の 表を 待ちました。
--       ★★私の 台本が、★2つの 表に またがって 強い 鍵を 取りに 行った、
--         ★という ことです。
--
--   ★★思い当たる 形は 2つ あります。★どちらかは、★私には 分かりません。
--     ★㋐ 2つの 台本を、★同時に 流して いた
--       ★★「anon の 権限を 全部 剥がす」は、
--         ★public の 表 ぜんぶに revoke を かけます。
--         ★★revoke も、★いちばん 強い 鍵を 取ります。
--       ★★あちらが 多くの 表を 押さえ、★こちらが notes を 待った ──
--         ★これで ぴったり 合います。
--     ★㋑ アプリが 動いて いて、★誰かが ノートを 読んで いた
--
--   ★★どちらでも、★直し方は 同じです。
--     ★① 台本は **1つずつ**。★同時に 流しません。
--     ★② 待ち時間に 上限を 置きます（lock_timeout）。
--        ★★待たずに 諦めれば、★相手を 巻き込みません。
--        ★★止まる ほうが、★ほかの 方を 止めるより ましです。
--     ★③ 1文ずつ 流します。★塊（do $$）に しません。
--        ★★塊は、★途中まで 進んで、★途中で 止まります。
--        ★★1文なら、★どこまで 進んだかが はっきり します。
--
--   ★★★流し方（★大事）
--     ★★ほかの SQL Editor の 画面を、★ぜんぶ 閉じて ください。
--     ★★下の ①〜⑦ を、★**1つずつ**、★上から 順に 流して ください。
--       ★1つ 流す → 結果を 見る → 次、です。
--     ★★しくじったら、★そこで 止めて、★そのまま お知らせ ください。
--       ★★「もう一度」を 繰り返すと、★また ぶつかります。
-- ============================================================================


-- ===========================================================================
-- ① ★いまの 姿を 見る（★読むだけ・鍵を 取りません）
--
--   ★★まず ここから。★門が もう 立って いるかも しれません。
-- ===========================================================================
select
  c.relrowsecurity as "門が 立って いるか",
  (select count(*) from pg_policies p
    where p.schemaname='public' and p.tablename='notes') as "決まりの 数"
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='notes';


-- ===========================================================================
-- ② ★いま、★誰かが 待たせて いないか（★読むだけ）
--
--   ★★ここに 行が 出たら、★その 人が 終わるまで 待って ください。
--   ★★0行なら、★③へ 進んで ください。
-- ===========================================================================
select
  a.pid              as "番号",
  a.state            as "いま",
  a.wait_event_type  as "何を 待って いるか",
  left(a.query, 80)  as "流して いる もの",
  now() - a.query_start as "どれだけ 経ったか"
from pg_stat_activity a
where a.datname = current_database()
  and a.pid <> pg_backend_pid()
  and a.state <> 'idle'
order by a.query_start;


-- ===========================================================================
-- ③ ★決まりを 1つめ（★読む ぶん）
--
--   ★★lock_timeout を 先に 置きます。
--     ★★5秒 取れなければ、★諦めます。★相手を 巻き込みません。
--   ★★しくじったら、★②へ 戻って、★空くのを 待って ください。
-- ===========================================================================
set lock_timeout = '5s';

create policy "notes_select_own" on public.notes
  for select using (auth.uid() = user_id);


-- ===========================================================================
-- ④ ★決まりを 2つめ（★入れる ぶん）
-- ===========================================================================
set lock_timeout = '5s';

create policy "notes_insert_own" on public.notes
  for insert with check (auth.uid() = user_id);


-- ===========================================================================
-- ⑤ ★決まりを 3つめ（★直す ぶん）
--
--   ★★with check を 必ず 付けます。
--     ★無いと、★using が 代わりに 使われ、
--     ★ほかの 方の user_id へ 書き換える 道が 開きます。
-- ===========================================================================
set lock_timeout = '5s';

create policy "notes_update_own" on public.notes
  for update using (auth.uid() = user_id)
          with check (auth.uid() = user_id);


-- ===========================================================================
-- ⑥ ★決まりを 4つめ（★消す ぶん）
--
--   ★★画面からは 消しません（deleted_at を 入れるだけ）。
--     ★退会の ときに、★台帳が まとめて 消せる ように しておきます。
-- ===========================================================================
set lock_timeout = '5s';

create policy "notes_delete_own" on public.notes
  for delete using (auth.uid() = user_id);


-- ===========================================================================
-- ⑦ ★そのあとで 門を 立てる（★ここが 効く 瞬間です）
--
--   ★★4つ そろってから 立てます。
--     ★★先に 立てると、★決まりの 無い あいだ、
--       ★ご本人すら ノートを 開けません。
-- ===========================================================================
set lock_timeout = '5s';

alter table public.notes enable row level security;


-- ===========================================================================
-- ⑧ ★立ったかの 確かめ（★読むだけ）
--
--   ★★見る ところは 3つ です。
--     ★㋐ 門が true
--     ★㋑ 決まりが 4つ
--     ★㋒ update の「書ける条件」が **空で ない**
-- ===========================================================================
select
  c.relrowsecurity as "門が 立って いるか",
  (select count(*) from pg_policies p
    where p.schemaname='public' and p.tablename='notes') as "決まりの 数"
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='notes';

select policyname as "決まり", cmd as "いつ",
       qual as "読める条件", with_check as "書ける条件"
from pg_policies
where schemaname='public' and tablename='notes'
order by cmd, policyname;

-- ★★ご自分の ノートが、★これまでどおり 読める ことの 確かめ。
--   ★★0行でも かまいません。★大事なのは、★しくじらない ことです。
select count(*) as "自分の ノートの 数"
from public.notes
where user_id = auth.uid();


-- ===========================================================================
-- ⑨ ★もし ③〜⑥ で「すでに あります」と 出たら
--
--   ★★それは しくじりでは ありません。★前の 回で 作られて います。
--   ★★その ぶんは 飛ばして、★次へ 進んで ください。
--   ★★⑧で 4つ そろって いれば、★それで 済んで います。
--
--   ★★下は、★作り直したい ときだけ 使う ものです。
--     ★★ふだんは 流さないで ください。
--
-- set lock_timeout = '5s';
-- drop policy if exists "notes_select_own" on public.notes;
-- drop policy if exists "notes_insert_own" on public.notes;
-- drop policy if exists "notes_update_own" on public.notes;
-- drop policy if exists "notes_delete_own" on public.notes;
