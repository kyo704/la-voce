-- 20260923_15 ★急ぎの直し：ops_audit_log の外部キーが「学校を閉じる」を止めていた
-- 事故: 2026-09-23。sql/14 を当てたあと、organizations の削除が ops_audit_log_org_id_fkey 違反で失敗
-- 原因（Opus の誤り）: PostgreSQL は 親の行を先に消し、そのあと子を連鎖で消す。
--   子（org_events ほか）が消えるときに引き金が動き、すでに消えた学校の id で1行 書こうとして 外部キー違反になる
-- 直し: 記録は 親より 長生きする → 外部キーを外す。学校の名前は そのときの値を写して残す
-- ★本番に sql/14 を当てたあとなら、この1本で直る（冪等）

alter table public.ops_audit_log drop constraint if exists ops_audit_log_org_id_fkey;
alter table public.ops_audit_log add column if not exists org_name_at text;

create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_org uuid; v_id text; v_cols jsonb; v_post text;
begin
  v_org := case when tg_op = 'DELETE' then (to_jsonb(old) ->> 'org_id')::uuid else (to_jsonb(new) ->> 'org_id')::uuid end;
  v_id  := case when tg_op = 'DELETE' then to_jsonb(old) ->> 'id' else to_jsonb(new) ->> 'id' end;
  if tg_op = 'UPDATE' then
    select jsonb_agg(key) into v_cols
      from jsonb_each(to_jsonb(new)) n where n.value is distinct from (to_jsonb(old) -> n.key);
    if v_cols is null then return new; end if;
  end if;
  select q.name into v_post from public.memberships m left join public.org_posts q on q.id = m.post_id
   where m.org_id = v_org and m.user_id = auth.uid();
  insert into public.ops_audit_log(org_id, org_name_at, actor_id, actor_post_at, action, target_kind, target_id, detail)
  values (v_org, (select o.name from public.organizations o where o.id = v_org),   -- 学校が消えていれば null
          auth.uid(), v_post, lower(tg_op), tg_table_name, v_id, jsonb_build_object('columns', v_cols));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.audit_row() from public, anon, authenticated;

-- 確かめ（試しの環境で・実在の試しの利用者で）
-- ① 行事・役職・場所・請求を持つ試しの学校を作る → closeOrg（教室を閉じる）→ 最後まで通る
-- ② organizations を直接 delete → 通る。ops_audit_log の行が残り、org_name_at にそのときの名前が入っている
-- ③ 閉じたあと、その学校の行は has_can が効かないので誰にも見えない（master・post を持つ人がいないため）
--    ★運営（Woolsong）は service role で読める。大学からの問い合わせにはそこから答える
-- ④ 90日より古い行が purge_ops_audit_log で消える
