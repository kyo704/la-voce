-- 20260923_53 講評の90日が 効いていない ＋ 掃除を 自分の引き金が止める
-- 見つけたもの（2026-09-23）:
--   ① 裁定その50「★講評90日」に対して、★講評を消す掃除が どこにも無い
--      掃除の関数は3本あるが、どれも evaluation_reviews を見ていない
--   ② ★sql/48 で私が入れた引き金（確定した講評は消せない）が、★掃除も止める
--      → 90日で消す決まりが、永久に実行できない形になっていた（今日2回目の同じ型の誤り）
-- ★48・42 のあと

-- ① 掃除のときだけ 引き金を通す（org_contacts・koen と同じ考え・裁定173）
create or replace function public.evaluation_reviews_no_delete()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  -- ★保存期間の掃除は通す（印は 掃除の関数の中でだけ立つ）
  if coalesce(current_setting('app.retention', true),'') = 'on' then return old; end if;
  if old.confirmed_at is not null then
    raise exception '確定の あとは、消せません（直すことは できます）';
  end if;
  return old;
end $$;
revoke all on function public.evaluation_reviews_no_delete() from public, anon, authenticated;

-- ② 講評の90日（裁定その50）
create or replace function public.purge_evaluation_reviews()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer;
begin
  perform set_config('app.retention','on',true);          -- ★この取引の中だけ
  delete from public.evaluation_reviews
   where coalesce(confirmed_at, created_at) < now() - interval '90 days';
  get diagnostics n = row_count;
  perform set_config('app.retention','off',true);
  return n;
end $$;
revoke all on function public.purge_evaluation_reviews() from public, anon, authenticated;

-- ③ まとめて走らせるものに足す（sql/42 の run_retention を置き換える）
create or replace function public.run_retention()
returns table(job text, removed integer)
language plpgsql security definer set search_path to 'public' as $$
declare n integer; v_jobs text[] := array['ops_audit_log','code_attempts','closed_school_logs','evaluation_reviews'];
        v_job text;
begin
  foreach v_job in array v_jobs loop
    begin
      n := case v_job
             when 'ops_audit_log'       then public.purge_ops_audit_log()
             when 'code_attempts'       then public.purge_code_attempts()
             when 'closed_school_logs'  then public.purge_closed_school_logs()
             when 'evaluation_reviews'  then public.purge_evaluation_reviews()
           end;
      insert into public.retention_runs(job, removed) values (v_job, coalesce(n,0));
      job := v_job; removed := coalesce(n,0); return next;
    exception when others then
      insert into public.retention_runs(job, ok, note) values (v_job, false, sqlerrm);
      -- ★1つ失敗しても 残りは走らせる
    end;
  end loop;
end $$;
revoke all on function public.run_retention() from public, anon, authenticated;

-- 確かめ（試しの環境で）
-- 91日前の確定した講評を置く → run_retention() で ★消える（引き金に止められない）
-- 89日前の講評 → 残る
-- ★人が 確定した講評を消そうとする → いままでどおり 止まる（印が立たないため）
-- 掃除の1つをわざと失敗させる → ★その行は ok=false・ほかの3つは走る
-- retention_runs に4行／retention_health() に4つの仕事が出る

-- ★決まりにすること（今日2回目の同じ型の誤り）
--   「書けなくする・消せなくする」仕組みを入れたら、★保存期間の掃除が通るかを 必ず確かめる
--   （①退会 ②親を消す ③連鎖の SET NULL ④★保存期間の掃除）
