-- ★★★sql/06 の ①（引き金だけ）と ②（★2026-09-23・坂本さんの お決め「A 承認」）。
--
--   ★★①の **関数**は 入れて いません。★本番には すでに 新しい 形が あります ──
--     本番 …… declare v_actor uuid := public.actor_id();   （sql/24 ②）
--     sql/06 … now(), auth.uid()
--   ★★★sql/06 の 字を そのまま 当てると、★裁定173 の 直しが 消えます。
--     ★★だから ここでは **引き金だけ** を 付けます。★関数は 触りません。
--     ★★お尋ね B（①の 字を actor_id() に 変えて よいか）は、★まだ お返事 待ち です。
--       ★この 形なら、★どちらの お返事でも やり直しが 要りません。
--
--   ★②は Opus の 字の まま です。★`auth.uid()` の まま で よい です ──
--     ★ご請求の 宛先を 変えるのは 画面（browser）だけ です。★そこでは `auth.uid()` が あります。
--
--   ★★★当てる 順 …… ★引き金を 先、★画面の 直しを あと。
--     ★逆に すると、★記録が **1件も 残らない** あいだが できます。
--     ★この 順だと、★配りが 届くまで **2行** 残る あいだが できます。
--       ★★消えるより 増える ほうが 直せます。

-- ① 役職を変えたら、台帳が1行書く（★関数は 本番の ものを そのまま 使います）
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

