-- 20260923_16 学校を閉じても記録を消さない（裁定172）
-- 事故の型: 束0 は「人が退会するとき」だけを直し、「学校が閉じるとき」を見落としていた
-- ★データは動かさない。外部キーの設定と、名前を写す列を足すだけ

-- ① 学校名を写す列（学校が消えても読めるように）
alter table public.monka_read_log    add column if not exists org_name_at text;
alter table public.score_log         add column if not exists org_name_at text;
alter table public.org_billing_log   add column if not exists org_name_at text;
alter table public.export_log        add column if not exists org_name_at text;
alter table public.contract_owner_log add column if not exists org_name_at text;

-- ② いまある行に、学校名を入れておく（学校がまだ残っているうちに）
update public.monka_read_log    l set org_name_at = o.name from public.organizations o where o.id = l.org_id and l.org_name_at is null;
update public.score_log         l set org_name_at = o.name from public.organizations o where o.id = l.org_id and l.org_name_at is null;
update public.org_billing_log   l set org_name_at = o.name from public.organizations o where o.id = l.org_id and l.org_name_at is null;
update public.export_log        l set org_name_at = o.name from public.organizations o where o.id = l.org_id and l.org_name_at is null;
update public.contract_owner_log l set org_name_at = o.name from public.organizations o where o.id = l.org_id and l.org_name_at is null;

-- ③ 学校が消えても行を消さない（null にする）
alter table public.monka_read_log    alter column org_id drop not null;
alter table public.score_log         alter column org_id drop not null;
alter table public.org_billing_log   alter column org_id drop not null;
alter table public.export_log        alter column org_id drop not null;
alter table public.contract_owner_log alter column org_id drop not null;

alter table public.monka_read_log     drop constraint if exists monka_read_log_org_id_fkey;
alter table public.monka_read_log     add  constraint monka_read_log_org_id_fkey
  foreign key (org_id) references public.organizations(id) on delete set null;
alter table public.score_log          drop constraint if exists score_log_org_id_fkey;
alter table public.score_log          add  constraint score_log_org_id_fkey
  foreign key (org_id) references public.organizations(id) on delete set null;
alter table public.org_billing_log    drop constraint if exists org_billing_log_org_id_fkey;
alter table public.org_billing_log    add  constraint org_billing_log_org_id_fkey
  foreign key (org_id) references public.organizations(id) on delete set null;
alter table public.export_log         drop constraint if exists export_log_org_id_fkey;
alter table public.export_log         add  constraint export_log_org_id_fkey
  foreign key (org_id) references public.organizations(id) on delete set null;
alter table public.contract_owner_log drop constraint if exists contract_owner_log_org_id_fkey;
alter table public.contract_owner_log add  constraint contract_owner_log_org_id_fkey
  foreign key (org_id) references public.organizations(id) on delete set null;

-- ④ 書くときに学校名も写す（これから増える行のため）
create or replace function public.stamp_org_name()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.org_name_at is null and new.org_id is not null then
    select o.name into new.org_name_at from public.organizations o where o.id = new.org_id;
  end if;
  return new;
end $$;
revoke all on function public.stamp_org_name() from public, anon, authenticated;
do $$
declare t text;
begin
  foreach t in array array['monka_read_log','score_log','org_billing_log','export_log','contract_owner_log'] loop
    execute format('drop trigger if exists %I_stamp_org on public.%I', t, t);
    execute format('create trigger %I_stamp_org before insert on public.%I for each row execute function public.stamp_org_name()', t, t);
  end loop;
end $$;

-- ⑤ 無期限には持たない（裁定172）。閉校の日を持たないので、行の日付で数える
create or replace function public.purge_closed_school_logs()
returns integer language plpgsql security definer set search_path to 'public' as $$
declare n integer := 0; m integer;
begin
  delete from public.score_log          where org_id is null and edited_at  < now() - interval '1 year'; get diagnostics m = row_count; n := n + m;   -- ★score_log の日付の列は edited_at（本番で確認）
  delete from public.org_billing_log    where org_id is null and created_at < now() - interval '1 year'; get diagnostics m = row_count; n := n + m;
  delete from public.export_log         where org_id is null and created_at < now() - interval '1 year'; get diagnostics m = row_count; n := n + m;
  delete from public.contract_owner_log where org_id is null and changed_at  < now() - interval '1 year'; get diagnostics m = row_count; n := n + m;
  -- ★門下を開いた記録だけ 3年（開示の求めが遅れて来ることがある）
  delete from public.monka_read_log     where org_id is null and viewed_at   < now() - interval '3 years'; get diagnostics m = row_count; n := n + m;
  return n;
end $$;
revoke all on function public.purge_closed_school_logs() from public, anon, authenticated;

-- 確かめ（実在の試しの利用者で）
-- ① 試しの学校で 門下を開く・点を直す・請求の宛名を変える・書き出す → 各1行、org_name_at に学校名
-- ② その学校を閉じる（closeOrg と、organizations の直接の delete の両方）→ 5つの表の行が残り、org_id が null
-- ③ 閉じたあと、学生が自分の「門下を開いた記録」を見る → 残っている
-- ④ purge_closed_school_logs：1年より古い（門下は3年）org_id が null の行だけ消える。学校が生きている行は消えない
-- ★列の名前は本番の実物に合わせてある（2026-09-23 Opus 確認）: monka_read_log=viewed_at ／ score_log=edited_at ／ org_billing_log・export_log=created_at ／ contract_owner_log=changed_at
