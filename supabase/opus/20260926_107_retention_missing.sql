-- 20260926_107 掃除が ★呼ばれて いません（★90日の 約束が 守られません）
-- ★★2026-09-26 に 見つけました
--   ★run_retention() が 呼ぶ もの ── ★4つ:
--     ops_audit_log／code_attempts／closed_school_logs／evaluation_reviews
--   ★★入って いない もの:
--     ★★purge_page_inquiries ── ★★関数は ある のに ★呼ばれて いません
--        ★★見本:「★90日で 消えます」── ★★守られません
--     ★sweep_referrals（sql/102）★sweep_invite_attempts（sql/103）
--        ★私が 作って ★足すのを 忘れました
-- ★106 のあと

create or replace function public.run_retention()
returns table(job text, removed integer)
language plpgsql security definer set search_path to 'public' as $$
declare n integer; v_job text;
        -- ★★2026-09-26: ★page_inquiries・referrals・invite_attempts を 足しました
        v_jobs text[] := array['ops_audit_log','code_attempts','closed_school_logs',
                               'evaluation_reviews','page_inquiries',
                               'page_referrals','invite_attempts'];
begin
  foreach v_job in array v_jobs loop
    begin
      n := case v_job
             when 'ops_audit_log'      then public.purge_ops_audit_log()
             when 'code_attempts'      then public.purge_code_attempts()
             when 'closed_school_logs' then public.purge_closed_school_logs()
             when 'evaluation_reviews' then public.purge_evaluation_reviews()
             when 'page_inquiries'     then public.purge_page_inquiries()
             when 'page_referrals'     then public.sweep_referrals()
             when 'invite_attempts'    then public.sweep_invite_attempts()
           end;
      insert into public.retention_runs(job, removed) values (v_job, coalesce(n,0));
      job := v_job; removed := coalesce(n,0); return next;
    exception when others then
      -- ★★1つ 失敗しても ★ほかを 続けます（★もとの 形の まま）
      insert into public.retention_runs(job, ok, note) values (v_job, false, sqlerrm);
    end;
  end loop;
  if extract(day from (now() at time zone 'Asia/Tokyo')) = 1 then
    begin
      n := public.make_monthly_stats();
      insert into public.retention_runs(job, removed) values ('monthly_stats', coalesce(n,0));
      job := 'monthly_stats'; removed := coalesce(n,0); return next;
    exception when others then
      insert into public.retention_runs(job, ok, note) values ('monthly_stats', false, sqlerrm);
    end;
  end if;
end $$;
revoke all on function public.run_retention() from public, anon, authenticated;

-- ★★これで ★見本の 約束が 守られます:
--   「★届いたもの ── ★90日で 消えます」
--   「★ページの 印 ── ★90日で 消えます」
--   「★打ち間違いの 記録 ── ★90日で 消えます」

-- ★★呼ぶ 仕組み（★Code へ）:
--   ★★run_retention() を ★1日1回 呼んで ください
--   ★Supabase の cron か、★外から 叩く
--   ★★呼ばれて いないと ★★消えません（★関数が あるだけ では 消えません）
--   ★★retention_health() で ★動いて いるか 見られます

-- 確かめ（試しの環境で）
-- ★run_retention() が ★7行 返す（★前は 4行）
-- ★page_inquiries・page_referrals・invite_attempts が 入って いる
-- ★1つ 失敗しても ほかが 続く
