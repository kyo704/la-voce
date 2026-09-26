-- 20260926_109 掃除の 一つが 欠けると ★★全部 止まる 形を なおします
-- ★★2026-09-26 に 本番で 起きました（★Code が 見つけました）
--
-- ★何が 起きたか（★本番の retention_runs に 残って います）
--   ★2026-09-26 03:44:33 UTC ── ★★7つ 全部 ok=false
--     note ＝「function public.sweep_referrals() does not exist」
--     ★それまで 動いて いた 4つ（ops_audit_log・code_attempts・
--       closed_school_logs・evaluation_reviews）も ★★一緒に 止まりました
--   ★03:45:37 UTC ── ★102・103 を 当てたら ★7つ 全部 ok=true
--   ★止まって いたのは ★約1分。★毎日の cron は 18:22 UTC なので
--     ★★掃除の 回は ★1回も 落ちて いません
--
-- ★★原因は「当てる 順番」だけでは ありません
--   ★sql/107 の 中身:
--     n := case v_job
--            when 'ops_audit_log'  then public.purge_ops_audit_log()
--            ...
--            when 'page_referrals' then public.sweep_referrals()   ← ★無い
--          end;
--   ★★case は ★1つの 式です。★式は ★通る 枝だけでなく
--     ★★全部の 枝を まとめて 組み立てます。
--   ★★だから 1つ 欠けると ★★どの 枝も 通りません。
--
--   ★確かめ（★本番で 読み取りだけ・42883 が 返ります）:
--     select case 'a' when 'a' then 1
--                     when 'b' then public.no_such_function_xyz() end;
--     → ERROR 42883。★★通る 枝は 'a' なのに ★式ごと 落ちます
--
--   ★★create の ときには 落ちません（★plpgsql の 中の 式は
--     ★呼ばれた ときに 組み立てます）。★だから 107 は ★当たって しまい、
--     ★その晩から 掃除が 止まります。★★当てる 前より 悪く なります
--
-- ★★直し方 ── ★式を 1つに まとめるのを やめます
--   ★呼ぶ 名前を 文字で 持ち、★1つずつ 組み立てて 呼びます。
--   ★★こうすると ★欠けた 1つだけが 止まり、★ほかの 6つは 通ります。
--
-- ★107 の あと（★102・103 の 前でも 後でも 当てられます）

create or replace function public.run_retention()
returns table(job text, removed integer)
language plpgsql security definer set search_path to 'public' as $$
declare
  n integer;
  i integer;
  v_job text;
  v_fn  text;
  -- ★★左＝記録に 残す 名前 ／ 右＝呼ぶ 関数の 名前
  v_jobs text[][] := array[
    ['ops_audit_log',      'purge_ops_audit_log'],
    ['code_attempts',      'purge_code_attempts'],
    ['closed_school_logs', 'purge_closed_school_logs'],
    ['evaluation_reviews', 'purge_evaluation_reviews'],
    ['page_inquiries',     'purge_page_inquiries'],
    ['page_referrals',     'sweep_referrals'],
    ['invite_attempts',    'sweep_invite_attempts']
  ];
begin
  for i in 1 .. array_length(v_jobs, 1) loop
    v_job := v_jobs[i][1];
    v_fn  := v_jobs[i][2];
    begin
      -- ★★1つずつ 組み立てて 呼びます（★ほかの 枝に 引きずられません）
      -- ★名前は この 関数の 中の 文字だけ。★外から 来ません
      execute format('select public.%I()', v_fn) into n;

      insert into public.retention_runs(job, removed) values (v_job, coalesce(n, 0));
      job := v_job; removed := coalesce(n, 0); return next;
    exception when others then
      -- ★★欠けて いたら ★その1つだけ ok=false。★ほかは 続きます
      -- ★note に「function public.… does not exist」が そのまま 残ります
      insert into public.retention_runs(job, ok, note) values (v_job, false, sqlerrm);
    end;
  end loop;

  -- ★月の 1日だけ（★前の 月を 数えます）
  if extract(day from (now() at time zone 'Asia/Tokyo')) = 1 then
    begin
      n := public.make_monthly_stats();   -- ★p_ym は 既定 NULL＝前の 月
      insert into public.retention_runs(job, removed) values ('monthly_stats', coalesce(n, 0));
      job := 'monthly_stats'; removed := coalesce(n, 0); return next;
    exception when others then
      insert into public.retention_runs(job, ok, note) values ('monthly_stats', false, sqlerrm);
    end;
  end if;
end $$;

revoke all on function public.run_retention() from public, anon, authenticated;

-- ★★to_regprocedure で「関数が あるか」を 先に 見るのは ★やめました
--   ★make_monthly_stats(p_ym date default null) は
--     to_regprocedure('public.make_monthly_stats()') が ★★null を 返します
--     （★既定値を 見ません）。★あるのに 無いと 言う 罠です
--   ★sqlerrm が「function public.… does not exist」と そのまま 書くので
--     ★見張りには それで 足ります

-- ★★確かめ（★試しの 環境で）
-- ★① run_retention() が 7行 返す
-- ★② わざと 1つ 落として みる:
--      alter function public.sweep_referrals() rename to sweep_referrals_x;
--      select * from public.run_retention();
--      → ★★6行 返る（★page_referrals だけ 欠ける）
--      → retention_runs に page_referrals ok=false が 1行
--      → ★ほかの 6つは ok=true
--      alter function public.sweep_referrals_x() rename to sweep_referrals;
-- ★③ retention_health() が ★止まって いる ものを 名前で 出す
