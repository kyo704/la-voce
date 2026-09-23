-- 20260922_07 壊れたときに気づく（裁定168 ★5）・契約者の移し替えの知らせの失敗を見えるように（F2）
-- system_alerts は既存（kind×sent_on で1日1回の「送った印」）。意味を変えないため、起きたことを全部残す表を別に作る

create table if not exists public.ops_alerts (
  id           uuid primary key default gen_random_uuid(),
  kind         text not null,
  detail       text,
  created_at   timestamptz not null default now(),
  notified_at  timestamptz          -- サーバが坂本さんにメールを送ったら入れる
);
create index if not exists ops_alerts_unnotified on public.ops_alerts(created_at) where notified_at is null;
alter table public.ops_alerts enable row level security;
revoke all on public.ops_alerts from anon, authenticated;   -- サーバと台帳の関数だけ

create or replace function public.raise_alert(p_kind text, p_detail text)
returns void language sql security definer set search_path to 'public' as $$
  insert into public.ops_alerts(kind, detail) values (left(coalesce(p_kind,'unknown'), 100), left(p_detail, 1000));
$$;
revoke all on function public.raise_alert(text, text) from public, anon, authenticated;   -- 台帳の関数と service role から

-- 契約者の移し替え：知らせの失敗を warning で消さず、ops_alerts に残す（移し替えそのものは巻き戻さない）
create or replace function public.transfer_contract_owner(p_org_id uuid, p_to_user_id uuid)
 returns table(ok boolean, reason text)
 language plpgsql security definer set search_path to 'public' as $function$
declare
  v_now uuid;
begin
  if auth.uid() is null then
    return query select false, 'NOT_AUTHENTICATED'; return;
  end if;
  select o.contract_owner_user_id into v_now from organizations o where o.id = p_org_id;
  if v_now is null or v_now <> auth.uid() then
    return query select false, 'NOT_CONTRACT_OWNER'; return;
  end if;
  if not exists (select 1 from memberships m where m.org_id = p_org_id and m.user_id = p_to_user_id) then
    return query select false, 'NOT_A_MEMBER'; return;
  end if;
  if not public.has_can_user(p_to_user_id, p_org_id, 'master') then
    return query select false, 'NO_MASTER'; return;
  end if;

  update organizations set contract_owner_user_id = p_to_user_id where id = p_org_id;
  insert into contract_owner_log (org_id, from_user_id, to_user_id, changed_by) values (p_org_id, v_now, p_to_user_id, auth.uid());

  begin
    insert into user_notices (user_id, notice_key) values (p_to_user_id, 'contract_owner:' || p_org_id::text);
  exception when others then
    perform public.raise_alert('contract_owner_notice_failed', 'org=' || p_org_id::text || ' to=' || p_to_user_id::text || ' err=' || sqlerrm);
  end;

  return query select true, ''::text;
end;
$function$;

-- 確かめ
-- select has_function_privilege('authenticated','public.raise_alert(text,text)','EXECUTE') → f
-- user_notices の insert を試しで失敗させて移し替え → 移し替えは成功・ops_alerts に1行
-- サーバの見張り: ops_alerts の notified_at が null の行 → 坂本さんにメール（同じ kind は1時間に1通）→ notified_at を入れる
