-- ★★★Opus の sql/24 の ①〜④（★2026-09-23）。
--
--   ★★★⑤（記録の 表への 書き込みを 閉じる）は **入れて いません**。
--     ★Opus の 書いた 前提が、★本番で まだ 揃って いない ため です ──
--       「⑤ 記録の表への直接の書き込みを閉じる（裁定161 FX8。★06 の record_export を当ててから）」
--     ★★本番に `record_export` は ありません（2026-09-23 に 数えました）。
--     ★★さらに `org_billing_log` は、★画面から 直に 書いて います
--       （components/VocalTracker.jsx:12222）。★いま 閉じると、
--       ★★ご請求の 宛先の 引き継ぎが 止まります。
--     ★★★⑤ は supabase/pending/ に 分けて 置きました。★お言葉を お待ちします。
--
--   ★①〜④ は Opus の 字の まま です。★変えて いません。

-- ① 「誰が」を1か所で決める
create or replace function public.actor_id()
returns uuid language plpgsql stable security definer set search_path to 'public' as $$
declare v uuid;
begin
  v := auth.uid();
  if v is not null then return v; end if;                 -- ★画面からの操作は これが勝つ（偽れない）
  begin
    v := nullif(current_setting('app.actor_id', true), '')::uuid;   -- サーバが代わりに行うとき
  exception when others then
    v := null;                                            -- 形が違えば null（処理は止めない）
  end;
  return v;
end $$;
revoke all on function public.actor_id() from public, anon, authenticated;

-- ② 役職の変更の引き金を、actor_id() を使う形に（06 の差し替え）
create or replace function public.log_post_change()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_actor uuid := public.actor_id();
begin
  if new.post_id is not distinct from old.post_id then return new; end if;
  insert into public.post_change_log(org_id, target_user_id, from_post_id, from_post_name, to_post_id, to_post_name,
                                     changed_at, changed_by, changed_by_kind)
  values (new.org_id, new.user_id,
          old.post_id, (select name from public.org_posts where id = old.post_id),
          new.post_id, (select name from public.org_posts where id = new.post_id),
          now(), v_actor, case when v_actor is null then 'system' else 'person' end);
  return new;
end $$;
-- 種類の列（無ければ足す）
alter table public.post_change_log add column if not exists changed_by_kind text
  check (changed_by_kind in ('person','system'));

-- ③ 役職の「できること」の記録も同じ形に（本番にある log_org_post_perm を差し替え）
create or replace function public.log_org_post_perm()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_before jsonb; v_after jsonb; v_added text[]; v_removed text[]; v_who uuid := public.actor_id();
begin
  if tg_op = 'INSERT' then v_before := null; v_after := new.perms;
  elsif tg_op = 'DELETE' then v_before := old.perms; v_after := null;
  else
    if old.perms is not distinct from new.perms and old.name is not distinct from new.name then return new; end if;
    v_before := old.perms; v_after := new.perms;
  end if;
  select coalesce(array_agg(k order by k), '{}') into v_added
    from jsonb_object_keys(coalesce(v_after, '{}'::jsonb)) k
   where coalesce((v_after ->> k)::boolean, false) and not coalesce((v_before ->> k)::boolean, false);
  select coalesce(array_agg(k order by k), '{}') into v_removed
    from jsonb_object_keys(coalesce(v_before, '{}'::jsonb)) k
   where coalesce((v_before ->> k)::boolean, false) and not coalesce((v_after ->> k)::boolean, false);
  insert into public.org_post_perm_log
    (changed_by, changed_by_kind, org_id, post_id, post_name_at, perms_before, perms_after, added, removed, op)
  values (v_who, case when v_who is null then 'system' else 'person' end,
          coalesce(new.org_id, old.org_id), coalesce(new.id, old.id), coalesce(new.name, old.name),
          v_before, v_after, v_added, v_removed, lower(tg_op));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

-- ④ 管理の操作の記録も同じ形に（14 の差し替え）
create or replace function public.audit_row()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_org uuid; v_id text; v_cols jsonb; v_post text; v_actor uuid := public.actor_id();
begin
  v_org := case when tg_op = 'DELETE' then (to_jsonb(old) ->> 'org_id')::uuid else (to_jsonb(new) ->> 'org_id')::uuid end;
  v_id  := case when tg_op = 'DELETE' then to_jsonb(old) ->> 'id' else to_jsonb(new) ->> 'id' end;
  if tg_op = 'DELETE' and v_org is not null and not exists (select 1 from public.organizations o where o.id = v_org) then
    return old;     -- 学校ごと消えるときは残さない
  end if;
  if tg_op = 'UPDATE' then
    select jsonb_agg(key) into v_cols
      from jsonb_each(to_jsonb(new)) n where n.value is distinct from (to_jsonb(old) -> n.key);
    if v_cols is null then return new; end if;
  end if;
  select q.name into v_post from public.memberships m left join public.org_posts q on q.id = m.post_id
   where m.org_id = v_org and m.user_id = v_actor;
  insert into public.ops_audit_log(org_id, org_name_at, actor_id, actor_post_at, action, target_kind, target_id, detail)
  values (v_org, (select o.name from public.organizations o where o.id = v_org),
          v_actor, v_post, lower(tg_op), tg_table_name, v_id, jsonb_build_object('columns', v_cols));
  if tg_op = 'DELETE' then return old; end if;
  return new;
end $$;

