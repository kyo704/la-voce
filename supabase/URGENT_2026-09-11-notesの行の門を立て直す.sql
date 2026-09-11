-- ============================================================================
-- ★★至急　notes（ノート）に、★行の 門（RLS）を 立て直す
--
--   ★見つかった こと（★2026-09-11・坂本さん）
--     ★notes だけ、★RLS が false、★決まりの 数 0件。
--     ★ほかの 46表は true。
--
--   ★★どれだけ 危ないか（★正直に 書きます）
--     ★★anon は、★もう 剥がして あります。★外の 人からは 見えません。
--     ★★けれど authenticated には
--         select, insert, update, delete が 付いて います
--         （★2026-09-09-ノートの表.sql ③）。
--       ★★RLS が 無いので、★**ログインして いる どなたでも**、
--         ★★ほかの 方の ノートを 読み・書き・消せる 状態です。
--       ★★アプリの 画面は いつも user_id で 絞って います。
--         ★★だから 画面からは 起きません。
--         ★★けれど、★台帳の 入口（REST）を 直に 叩けば できます。
--     ★★ノートは、★ご本人が 書いた 文章です。★いちばん 私的な ものの 1つです。
--
--   ★★なぜ こうなったか（★調べた こと）
--     ★① もとの SQL は 正しいです。
--        supabase/2026-09-09-ノートの表.sql ④ が、
--        ★enable row level security と、★4つの 決まりを 作ります。
--     ★② そのあとの SQL（2026-09-11-ノートと曲の台帳に欄を足す.sql）は、
--        ★列を 足すだけです。★RLS を 切る 1行も、★決まりを 消す 1行も ありません。
--     ★③ 表も 列も あります。★だから ②（表を 作る）は 流れました。
--     ★④ notes に anon の 権限は 付いて いませんでした
--        （★坂本さんの 一覧の 5表に notes は ありません）。
--        ★★もとの SQL の ③（revoke）は 流れた、と 分かります。
--     ★★つまり、★③までは 流れ、★④（RLS の 塊）だけが 流れて いません。
--
--   ★★どうして ④だけ 流れなかったか ── ★私には 分かりません。
--     ★★台帳を 読む 手が ないので、★これ以上は 突き止められません。
--     ★★思い当たる 形は 2つ あります。★どちらかは 分かりません。
--       ★㋐ SQL Editor は、★字を 選んで いると **選んだ ぶんだけ** 流します。
--       ★㋑ 途中で 1つでも しくじると、★そこから 下は 流れません。
--     ★★どちらでも、★同じ ことが また 起きます。
--       ★だから ⑤で、★ほかに 同じ 形が 無いかを 数えます。
--
--   ★★流す 順（★大事）
--     ★★決まりを **先に** 作り、★そのあとで RLS を 立てます。
--       ★★逆に すると、★決まりの 無い まま RLS が 立つ 一瞬が できます。
--         ★その あいだ、★ご本人すら ノートを 開けません。
--       ★★RLS が 切れて いる あいだに 決まりを 作っても、★何も 起きません。
--         ★決まりは、★RLS が 立って はじめて 効きます。★安全です。
--
--   ★実行　Supabase の SQL Editor に、★**このまま ぜんぶ** 貼って ください。
--   ★★途中で 選ばずに、★全部 選んで 流して ください（★㋐の ため）。
-- ============================================================================


-- ===========================================================================
-- ① いまの 姿（★流す 前の 記録）
-- ===========================================================================
select
  c.relrowsecurity as "行の 門が 立って いるか",
  (select count(*) from pg_policies p
    where p.schemaname='public' and p.tablename='notes') as "決まりの 数"
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='notes';

select grantee as "だれに", privilege_type as "できること"
from information_schema.table_privileges
where table_schema='public' and table_name='notes'
order by grantee, privilege_type;


-- ===========================================================================
-- ② ★決まりを 先に 作る（★4つ）
--
--   ★出どころ supabase/2026-09-09-ノートの表.sql ④ の まま です。
--     ★1文字も 変えて いません。★新しい 決まりを 作って いません。
--   ★★ご本人だけです。★先生の 決まりは 1つも ありません。
--   ★★update には with check を 必ず 付けます。
--     ★無いと、★using が 代わりに 使われ、
--     ★ほかの 方の user_id へ 書き換える 道が 開きます。
-- ===========================================================================
do $$
begin
  if not exists (select 1 from pg_policies
                  where schemaname='public' and tablename='notes'
                    and policyname='notes_select_own') then
    create policy "notes_select_own" on public.notes
      for select using (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies
                  where schemaname='public' and tablename='notes'
                    and policyname='notes_insert_own') then
    create policy "notes_insert_own" on public.notes
      for insert with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies
                  where schemaname='public' and tablename='notes'
                    and policyname='notes_update_own') then
    create policy "notes_update_own" on public.notes
      for update using (auth.uid() = user_id)
              with check (auth.uid() = user_id);
  end if;

  if not exists (select 1 from pg_policies
                  where schemaname='public' and tablename='notes'
                    and policyname='notes_delete_own') then
    create policy "notes_delete_own" on public.notes
      for delete using (auth.uid() = user_id);
  end if;
end $$;


-- ===========================================================================
-- ③ ★そのあとで 門を 立てる
-- ===========================================================================
alter table public.notes enable row level security;


-- ===========================================================================
-- ④ ★権限も 締め直す（★念のため）
--
--   ★★もとの SQL の ③と 同じです。★何度 流しても 同じです。
-- ===========================================================================
revoke all on public.notes from anon;
revoke truncate, trigger, references on public.notes from authenticated;
grant select, insert, update, delete on public.notes to authenticated;


-- ===========================================================================
-- ⑤ ★ほかに 同じ 形が 無いか（★読むだけ）
--
--   ★★見るのは 2つ です。
--     ★㋐ 門が 立って いない 表　★＝ notes と 同じ 形
--     ★㋑ 門は 立って いるが、★決まりが 0件の 表
--        ★★これは 漏れでは ありません。★逆に、★誰も 読めません。
--          ★機能が 静かに 止まって いる かも しれません。
--   ★★結果を そのまま お送りください。
-- ===========================================================================
select
  c.relname        as "表",
  c.relrowsecurity as "門が 立って いるか",
  (select count(*) from pg_policies p
    where p.schemaname='public' and p.tablename=c.relname) as "決まりの 数"
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relkind='r'
  and (
    c.relrowsecurity = false
    or (select count(*) from pg_policies p
         where p.schemaname='public' and p.tablename=c.relname) = 0
  )
order by c.relrowsecurity, c.relname;


-- ===========================================================================
-- ⑥ ★立ったかの 確かめ
-- ===========================================================================
select
  c.relrowsecurity as "行の 門が 立って いるか",
  (select count(*) from pg_policies p
    where p.schemaname='public' and p.tablename='notes') as "決まりの 数"
from pg_class c join pg_namespace n on n.oid=c.relnamespace
where n.nspname='public' and c.relname='notes';

-- ★★4つ 出る こと。★update の「書ける条件」が 空で ないこと。
select policyname as "決まり", cmd as "いつ",
       qual as "読める条件", with_check as "書ける条件"
from pg_policies
where schemaname='public' and tablename='notes'
order by cmd, policyname;

-- ★★ご自分の ノートが、★これまでどおり 読める ことの 確かめ。
--   ★★0行でも かまいません（★まだ 書いて いなければ）。
--   ★★大事なのは、★しくじらない ことです。
select count(*) as "自分の ノートの 数"
from public.notes
where user_id = auth.uid();
