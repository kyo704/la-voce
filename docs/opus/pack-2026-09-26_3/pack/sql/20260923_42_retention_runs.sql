-- 20260923_42 掃除が「走ったこと」を記録する（裁定169 #8・172・安全管理措置 1-3）
-- ★本番を見たところ、掃除の関数はあるが pg_cron が無く、★誰も呼んでいない（2026-09-23 Opus 確認）
--   → 呼ぶ仕組みは Code が選ぶ。ここでは「走ったことを確かめられる形」を用意する

create table if not exists public.retention_runs (
  id        uuid primary key default gen_random_uuid(),
  job       text not null,                 -- 'ops_audit_log' ほか
  ran_at    timestamptz not null default now(),
  removed   integer not null default 0,
  ok        boolean not null default true,
  note      text
);
create index if not exists retention_runs_job_idx on public.retention_runs(job, ran_at desc);
alter table public.retention_runs enable row level security;
revoke all on public.retention_runs from anon, authenticated;   -- ★運営だけ

-- まとめて走らせる（サーバから1日1回呼ぶ）
create or replace function public.run_retention()
returns table(job text, removed integer)
language plpgsql security definer set search_path to 'public' as $$
declare n integer;
begin
  begin n := public.purge_ops_audit_log();
    insert into public.retention_runs(job, removed) values ('ops_audit_log', coalesce(n,0));
    job := 'ops_audit_log'; removed := coalesce(n,0); return next;
  exception when others then
    insert into public.retention_runs(job, ok, note) values ('ops_audit_log', false, sqlerrm);
  end;
  begin n := public.purge_code_attempts();
    insert into public.retention_runs(job, removed) values ('code_attempts', coalesce(n,0));
    job := 'code_attempts'; removed := coalesce(n,0); return next;
  exception when others then
    insert into public.retention_runs(job, ok, note) values ('code_attempts', false, sqlerrm);
  end;
  begin n := public.purge_closed_school_logs();
    insert into public.retention_runs(job, removed) values ('closed_school_logs', coalesce(n,0));
    job := 'closed_school_logs'; removed := coalesce(n,0); return next;
  exception when others then
    insert into public.retention_runs(job, ok, note) values ('closed_school_logs', false, sqlerrm);
  end;
end $$;
revoke all on function public.run_retention() from public, anon, authenticated;   -- ★サーバだけ

-- ★出発の朝の確認に使う: 掃除が最近走っているか
create or replace function public.retention_health()
returns table(job text, last_ran timestamptz, days_ago numeric, last_ok boolean)
language sql stable security definer set search_path to 'public' as $$
  select r.job, max(r.ran_at),
         round(extract(epoch from (now() - max(r.ran_at)))/86400.0, 1),
         (array_agg(r.ok order by r.ran_at desc))[1]
    from public.retention_runs r group by r.job;
$$;
revoke all on function public.retention_health() from public, anon, authenticated;

-- 確かめ（試しの環境で）
-- run_retention() を呼ぶ → 3行返り、retention_runs に3行入る
-- 掃除の関数の1つをわざと失敗させる → ★その行は ok=false で残り、★ほかの2つは走る（全部止まらない）
-- retention_health() → 最後に走った日と、何日前かが出る
-- ★出発の朝: どれかが 2日以上 走っていなければ、呼ぶ仕組みが動いていない
