-- ============================================================================
-- repertoire_tessitura に、★消す ための 決まりを 足す
--
--   ★出どころ 2026-09-14、★修正の記録 No.014
--
--   ★★見つけた こと
--     ★この 表には、★読む・入れる・直す の 決まりは ありますが、
--       ★**消す 決まりが ありません**。
--     ★★RLS は、★決まりが 無い ときは 黙って 0行に します。
--       ★誤りを 返しません。★HTTP は 200 の ままです。
--     ★★だから 画面は「消した」と 思い込み、★読み直すと 戻って いました。
--
--   ★★実際に 測った 結果（★試し用の 企画・本人の 鍵で）
--     ★SELECT … 通る
--     ★INSERT … 通る
--     ★UPDATE … 通る
--     ★DELETE … **0行**（★HTTP 200／返り値 []）
--
--   ★★何度 流しても 安全です（★あれば 作りません）。
-- ============================================================================

-- ★★まず、★いま ある 決まりを 見ます。
--   ★流す 前と 後で くらべて ください。
select policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public' and tablename = 'repertoire_tessitura'
order by cmd, policyname;

-- ★★消す 決まり。★自分の 行だけ です。
do $$
begin
  if not exists (
    select 1 from pg_policies
    where schemaname = 'public'
      and tablename = 'repertoire_tessitura'
      and cmd = 'DELETE'
  ) then
    create policy "repertoire_tessitura_delete_own"
      on public.repertoire_tessitura
      for delete
      using (auth.uid() = user_id);
  end if;
end $$;

-- ★★同じ 形が ほかにも ないかを 見ます。
--   ★★「本人の 表 なのに、★消す 決まりが 無い」ものを 並べます。
--   ★★見るだけ です。★何も 変えません。
select c.relname as 表,
       bool_or(p.cmd = 'SELECT') as 読む,
       bool_or(p.cmd = 'INSERT') as 入れる,
       bool_or(p.cmd = 'UPDATE') as 直す,
       bool_or(p.cmd = 'DELETE') as 消す,
       bool_or(p.cmd = 'ALL')    as 全部
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
left join pg_policies p
  on p.schemaname = n.nspname and p.tablename = c.relname
where n.nspname = 'public'
  and c.relkind = 'r'
  and c.relrowsecurity
group by c.relname
having not (bool_or(p.cmd = 'DELETE') or bool_or(p.cmd = 'ALL'))
order by c.relname;

-- ★★試しの 行を 片づけます（★試し用の 企画だけ）。
--   ★★本番では 流さないで ください。
-- delete from public.repertoire_tessitura where repertoire_name = 'テスト曲B';
