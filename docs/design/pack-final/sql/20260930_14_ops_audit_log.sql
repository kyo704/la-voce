-- 20260930_14 管理の操作の記録（裁定169 #8）。大学の確認票の「操作の記録」に答えるため
-- 何を残すか: 学校の管理の操作（名簿・役職・招待・請求・レッスン割の確定）。中身（体調の記録）は残さない
--
-- ★★org_id に 外部キーを 付けてはいけない（2026-09-23 の事故。Opus の誤り）
--   PostgreSQL は 親（organizations）の行を 先に 消し、そのあとで 子（org_events ほか）を 連鎖で消す。
--   子が消えるときに この引き金が動き、すでに 消えた 学校の id で 1行 書こうとするため、外部キー違反で
--   ★「学校を閉じる」処理そのものが 失敗する。
--   記録は 親より 長生きするもの（学校が消えても、誰が何をしたかは残す）。だから 外部キーを 持たせない。
--   ※連鎖で消えてよい 他の記録の表（monka_read_log ほか）とは 考え方が違う。ここは 消さない側

create table if not exists public.ops_audit_log (
  id            uuid primary key default gen_random_uuid(),
  org_id        uuid,                       -- ★外部キーを付けない（記録は 親より 長生きする）。理由は下の注記
  org_name_at   text,                        -- そのときの学校の名前（学校が消えても読めるように）
  actor_id      uuid references auth.users(id) on delete set null,
  actor_post_at text,
  action        text not null,                 -- 'insert' | 'update' | 'delete'
  target_kind   text not null,                 -- 表の名前
  target_id     text,
  detail        jsonb,                         -- 変わった列の名前だけ（値は入れない）
  created_at    timestamptz not null default now()
);
create index if not exists ops_audit_org_idx on public.ops_audit_log(org_id, created_at desc);
alter table public.ops_audit_log enable row level security;
revoke all on public.ops_audit_log from anon, authenticated;
grant select on public.ops_audit_log to authenticated;
drop policy if exists ops_audit_select on public.ops_audit_log;
create policy ops_audit_select on public.ops_audit_log for select to authenticated
  using (org_id is not null and (has_can(org_id,'master') or has_can(org_id,'post')));
-- 書くのは引き金だけ（利用者の insert のポリシーは作らない）

create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_org uuid; v_id text; v_cols jsonb; v_post text;
begin
  v_org := case when tg_op = 'DELETE' then (to_jsonb(old) ->> 'org_id')::uuid else (to_jsonb(new) ->> 'org_id')::uuid end;
  v_id  := case when tg_op = 'DELETE' then to_jsonb(old) ->> 'id' else to_jsonb(new) ->> 'id' end;
  -- ★学校ごと消えるとき（organizations が既に無い DELETE）は残さない。
  --   1つの学校を閉じるだけで数百〜数千行になり、読めない記録になるため。閉じたこと自体は closeOrg の側で1行残す
  if tg_op = 'DELETE' and v_org is not null and not exists (select 1 from public.organizations o where o.id = v_org) then
    return old;
  end if;
  if tg_op = 'UPDATE' then
    select jsonb_agg(key) into v_cols
      from jsonb_each(to_jsonb(new)) n where n.value is distinct from (to_jsonb(old) -> n.key);
    if v_cols is null then return new; end if;     -- 何も変わっていなければ残さない
  end if;
  select q.name into v_post from public.memberships m left join public.org_posts q on q.id = m.post_id
   where m.org_id = v_org and m.user_id = auth.uid();
  insert into public.ops_audit_log(org_id, org_name_at, actor_id, actor_post_at, action, target_kind, target_id, detail)
  -- 学校が消えていれば org_name_at は null になる
  values (v_org, (select o.name from public.organizations o where o.id = v_org),
          auth.uid(), v_post, lower(tg_op), tg_table_name, v_id, jsonb_build_object('columns', v_cols));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;
revoke all on function public.audit_row() from public, anon, authenticated;

-- 付ける表（org_id と id を持つ、学校の管理の表だけ。★entries など本人の記録には付けない）
do $$
declare t text;
begin
  foreach t in array array['enrollments','memberships','org_posts','org_invitations','org_billing','org_events','org_places','lesson_rounds'] loop
    if exists (select 1 from information_schema.tables where table_schema='public' and table_name=t) then
      execute format('drop trigger if exists %I_audit on public.%I', t, t);
      execute format('create trigger %I_audit after insert or update or delete on public.%I for each row execute function public.audit_row()', t, t);
    end if;
  end loop;
end $$;

-- 保存の期間: ★90日（坂本さんの決定・2026-09-23）。古い行は毎日、運営が消す（サーバの仕事）
-- ★消す処理は「90日より古い行だけ」。それ以外は消さない
-- ※門下を開いた記録（monka_read_log）・役職の変更（org_post_perm_log）など「消せない」記録は、この対象外（消さない）
create or replace function public.purge_ops_audit_log()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer;
begin
  delete from public.ops_audit_log where created_at < now() - interval '90 days';
  get diagnostics n = row_count; return n;
end $$;
revoke all on function public.purge_ops_audit_log() from public, anon, authenticated;

-- 確かめ
-- 事務が名簿に1人足す → ops_audit_log に1行（誰が・そのときの役職・どの表・列の名前だけ）
-- detail に値（名前・メール）が入っていないこと
-- master も post も持たない人 → 0行／別の学校の行は見えない
-- 体調の記録（entries）には引き金が付いていないこと
-- purge_ops_audit_log: 91日前の行が消え、89日前の行は残る
-- ★学校を閉じる（organizations の delete）が 最後まで通ること。閉じたあとも ops_audit_log の行が残ること
