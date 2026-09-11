-- ============================================================================
-- ★至急　enrollments（在籍）から、★anon の 権限を 剥がす
--
--   ★見つかった こと（★2026-09-11・坂本さん）
--     ★enrollments の **すべての 列**に、★anon（★ログインして いない 人）へ
--     ★INSERT・REFERENCES・SELECT・UPDATE が 付いて いました。
--
--   ★★はじめに、★はっきり させて おきたい ことが 1つ あります。
--     ★★「権限が 付いて いる」ことと、★「実際に 読める」ことは 別です。
--       ★★行の 決まり（RLS）が 効いて いて、
--         ★決まりが auth.uid() を 見て いれば、
--         ★anon は auth.uid() が 空なので、★1行も 当たりません。
--       ★★RLS が 切れて いれば、★丸ごと 読めます。★入れられます。
--     ★★だから、★②で まず RLS を 確かめます。
--       ★★私に 台帳を 読む 手が ありません。★結果を お送りください。
--     ★★どちらでも、★anon の 権限は 要りません。★①で 剥がします。
--
--   ★★なぜ 付いて いたか（★調べた こと）
--     ★① この 帳面の どの SQL にも、★anon へ 与える 1行は ありません。
--        （★supabase/*.sql を ぜんぶ 探しました。★0件）
--     ★② アプリに、★ログインせずに この 表へ 行く 道は ありません。
--     ★③ Supabase は、★はじめから こう 設定されて います ──
--          alter default privileges in schema public
--            grant all on tables to anon, authenticated;
--        ★★だから、★SQL Editor で 手で 作った 表には、
--          ★★作った 瞬間に anon の 権限が 付きます。
--   ★★つまり、★意図した ものでは なく、★既定の まま だった、と 見ます。
--     ★★裏づけは ⑤で 取ります ── ★ほかの 表にも 同じ ものが あれば、
--       ★1つの 手落ちでは なく、★既定が 効いて いた、と 分かります。
--
--   ★★アプリが 壊れないか（★調べた こと）
--     ★画面（ログイン済み＝authenticated）が 読み書きして います ──
--       components/VocalTracker.jsx:11525　select
--       components/VocalTracker.jsx:11567　update
--       components/VocalTracker.jsx:11803　select
--     ★入れるのは 裏口（service role）だけです ──
--       app/api/enrollment/accept/route.js:114
--       ★★裏口は 権限も RLS も 飛び越えます。★①②で 止まりません。
--     ★★だから、★anon を 剥がしても、★1つも 壊れません。
--
--   ★実行　Supabase の SQL Editor に、★このまま 貼って ください。
--   ★★①→②→③→④→⑤ の 順に、★上から 流して ください。
-- ============================================================================


-- ===========================================================================
-- ① ★まず 剥がす（★いちばん 大事）
--
--   ★★revoke を 先に 書きます。★あとに 回すと、★その 間 空いた ままです。
--   ★★列ごとの 権限も 剥がします。★表ごとの revoke だけでは 残ります
--     （★2026-09-11 までの 学び ── 列の 権限は 別に 立って います）。
-- ===========================================================================
revoke all privileges on public.enrollments from anon;

-- ★★念のため、★列ごとの ぶんも 名指しで 剥がします。
do $$
declare c record;
begin
  for c in
    select column_name from information_schema.columns
    where table_schema='public' and table_name='enrollments'
  loop
    execute format(
      'revoke all (%I) on public.enrollments from anon', c.column_name);
  end loop;
end $$;


-- ===========================================================================
-- ② ★行の 決まり（RLS）が 効いて いるか
--
--   ★★ここが「どれだけ 危なかったか」を 決めます。
--     ★t（効いて いる）… ★決まりが auth.uid() を 見て いれば、
--       ★anon は 1行も 当たりません。★権限は 余計でしたが、★漏れては いません。
--     ★f（切れて いる）… ★丸ごと 読めて いました。★入れられて いました。
--   ★★結果を そのまま お送りください。
-- ===========================================================================
select
  c.relname              as "表",
  c.relrowsecurity       as "行の 決まりが 効いて いるか",
  c.relforcerowsecurity  as "持ち主にも 効かせて いるか"
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname='public' and c.relname='enrollments';

select
  policyname as "決まりの 名前",
  cmd        as "いつ",
  roles      as "だれに",
  qual       as "読むときの 条件",
  with_check as "書くときの 条件"
from pg_policies
where schemaname='public' and tablename='enrollments'
order by cmd, policyname;


-- ===========================================================================
-- ③ ★決まりが 1つも 無ければ、★ここで 作る
--
--   ★★決まりが 0件 だった ときだけ 効きます。
--     ★★すでに ある ものを、★上書きしません。
--   ★★在籍は、★ご本人（生徒）と、★その 教室の 側が 見る ものです。
--     ★★ここでは いちばん 狭い ところだけ 作ります ── ★ご本人。
--     ★★教室の 側の 決まりは、★いまの 形を ②で 見てから 決めます。
--       ★勝手に 広げません。
-- ===========================================================================
do $$
begin
  if not exists (
    select 1 from pg_policies where schemaname='public' and tablename='enrollments'
  ) then
    execute 'alter table public.enrollments enable row level security';
    execute 'create policy enrollments_own on public.enrollments
               for select using (auth.uid() = student_id)';
    raise notice '★決まりが 1つも 無かったので、★ご本人だけの 決まりを 作りました。';
  else
    raise notice '★決まりが すでに あります。★触って いません。';
  end if;
end $$;


-- ===========================================================================
-- ④ ★剥がせたかの 確かめ（★0行で あること）
-- ===========================================================================
select
  grantee        as "だれに",
  privilege_type as "できること",
  coalesce(column_name, '（表 ぜんぶ）') as "列"
from information_schema.column_privileges
where table_schema='public' and table_name='enrollments' and grantee='anon'
union all
select grantee, privilege_type, '（表 ぜんぶ）'
from information_schema.table_privileges
where table_schema='public' and table_name='enrollments' and grantee='anon';


-- ===========================================================================
-- ⑤ ★ほかの 表にも 同じ ものが ないか（★読むだけ）
--
--   ★★1つの 手落ちか、★既定が 効いて いたのか。★ここで 分かります。
--   ★★結果を そのまま お送りください。
--     ★★まとめて 剥がす SQL を、★見てから 作ります。
--       ★★先に 全部 剥がしません。★anon が 要る 表が 1つでも あれば、
--         ★そこで 止まります。★止まる ところを 知らずに 触りません。
-- ===========================================================================
select
  table_name     as "表",
  privilege_type as "できること",
  count(*)       as "列の 数"
from information_schema.column_privileges
where table_schema='public' and grantee='anon'
group by table_name, privilege_type
order by table_name, privilege_type;

select table_name as "表", privilege_type as "できること"
from information_schema.table_privileges
where table_schema='public' and grantee='anon'
order by table_name, privilege_type;


-- ===========================================================================
-- ⑥ ★これから 作る 表に、★また 付かない ように する（★根の 直し）
--
--   ★★★まだ 流さないで ください。★⑤の 結果を 見てからです。
--     ★★これを 流すと、★これから 作る 表に anon が 付かなく なります。
--     ★★すでに ある 表には 効きません。★①の ように 名指しで 剥がします。
--
--   ★★いま 流さない 理由 ── ★anon が 要る 表が 1つでも あるなら、
--     ★その 表を 作り直す ときに 困ります。★先に ⑤で 数えます。
--
-- alter default privileges in schema public revoke all on tables from anon;
-- alter default privileges in schema public revoke all on sequences from anon;
-- alter default privileges in schema public revoke all on functions from anon;
