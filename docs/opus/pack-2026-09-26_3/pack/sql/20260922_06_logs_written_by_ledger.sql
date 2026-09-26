-- 20260922_06 記録の表を「利用者が直接書く」から「台帳が書く」へ（裁定161 FX8）
-- ★当てる順（CHECK_FIRST）: ①画面・サーバから post_change_log・org_billing_log・export_log への insert を消す（または record_export に置き換える）
--   → ②この移行。①より先に当てると、画面の insert が権限エラーになる
-- 本番の行数: post_change_log 0（2026-09-22）

-- ★見つけた穴（ついでに直す）: post_change_log.changed_by は NOT NULL なのに、外部キーは ON DELETE SET NULL
--   → 役職を変えた人が退会しようとすると、NULL を入れられず退会が止まる（裁定168 ★1 と同じ型）
alter table public.post_change_log alter column changed_by drop not null;
alter table public.post_change_log alter column target_user_id drop not null;   -- FX1（退会で消さない）の前提。外部キーを SET NULL にするのは束0

-- ① 役職を変えたら、台帳が1行書く
create or replace function public.log_post_change()
returns trigger language plpgsql security definer set search_path to 'public' as $$
begin
  if new.post_id is not distinct from old.post_id then return new; end if;
  insert into public.post_change_log(org_id, target_user_id, from_post_id, from_post_name, to_post_id, to_post_name, changed_at, changed_by)
  values (new.org_id, new.user_id,
          old.post_id, (select name from public.org_posts where id = old.post_id),
          new.post_id, (select name from public.org_posts where id = new.post_id),
          now(), auth.uid());   -- サーバ（service role）の変更は null
  return new;
end $$;
revoke all on function public.log_post_change() from public, anon, authenticated;
drop trigger if exists memberships_log_post_change on public.memberships;
create trigger memberships_log_post_change after update of post_id on public.memberships
  for each row execute function public.log_post_change();

-- ② 請求の宛先・方法を変えたら、台帳が1行書く（何の列が変わったか）
create or replace function public.log_org_billing_change()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_what text;
begin
  select string_agg(k, '・' order by k) into v_what
  from (values
    ('宛名', old.atesaki_name is distinct from new.atesaki_name),
    ('宛先のメール', old.atesaki_email is distinct from new.atesaki_email),
    ('宛先の人', old.atesaki_user_id is distinct from new.atesaki_user_id),
    ('支払い方法', old.method is distinct from new.method),
    ('部署', old.bill_dept is distinct from new.bill_dept),
    ('ご担当', old.bill_contact is distinct from new.bill_contact),
    ('インボイス', old.invoice_no is distinct from new.invoice_no or old.invoice_issuer is distinct from new.invoice_issuer)
  ) t(k, changed) where changed;
  if v_what is null then return new; end if;
  insert into public.org_billing_log(org_id, actor_id, what, created_at)
  values (new.org_id, auth.uid(), v_what || ' を変えました', now());
  return new;
end $$;
revoke all on function public.log_org_billing_change() from public, anon, authenticated;
drop trigger if exists org_billing_log_change on public.org_billing;
create trigger org_billing_log_change after update on public.org_billing
  for each row execute function public.log_org_billing_change();

-- ③ 書き出しは表の変化ではないので、関数で記録する（画面はこれを呼ぶ）
create or replace function public.record_export(p_org_id uuid, p_what text, p_rows integer)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  if not exists (select 1 from public.memberships m where m.org_id = p_org_id and m.user_id = auth.uid()) then
    raise exception 'NOT_A_MEMBER';
  end if;
  if p_what is null or btrim(p_what) = '' or p_rows is null or p_rows < 0 then raise exception 'BAD_ARGS'; end if;
  insert into public.export_log(org_id, user_id, what, rows, created_at) values (p_org_id, auth.uid(), left(p_what, 200), p_rows, now());
end $$;
revoke all on function public.record_export(uuid, text, integer) from public, anon;
grant execute on function public.record_export(uuid, text, integer) to authenticated;

-- ④ 利用者の直接の insert をやめる
drop policy if exists post_change_log_insert on public.post_change_log;
drop policy if exists org_billing_log_insert on public.org_billing_log;
drop policy if exists export_log_insert on public.export_log;
revoke insert, update, delete, truncate on public.post_change_log, public.org_billing_log, public.export_log from anon, authenticated;

-- 確かめ（実在の試しの利用者で）
-- post を持つ事務が他人の役職を変える → post_change_log に1行（changed_by=その事務）
-- 同じ事務が post_change_log に直接 insert → 権限エラー
-- bill_pay を持つ人が宛名を変える → org_billing_log に「宛名 を変えました」
-- 学校の人が record_export(学校, '名簿', 216) → export_log に1行／学校の外の人 → NOT_A_MEMBER
