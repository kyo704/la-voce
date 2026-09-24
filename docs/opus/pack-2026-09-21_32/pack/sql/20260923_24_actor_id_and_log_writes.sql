-- 20260923_24 「誰が」を残す（裁定173）＋ 記録の表への直接の書き込みを閉じる（裁定161 FX8）
-- ★06 と入れ替えではなく、06 を当てたあと（または一緒）に当てる

-- ★印（app.actor_id）は 取引の中だけ有効。サーバから別々に呼ぶと消える（2026-09-23 Code が発見）
--   → 印を置くのは「サーバ」ではなく「関数の中」。例: set_member_post（役職を変える関数）が
--     同じ取引の中で set_config してから update する。本番の edit_confirmed_score が同じ正しい形

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

-- ⑤ 記録の表への直接の書き込みを閉じる（裁定161 FX8。★06 の record_export を当ててから）
--    2026-09-23 に本番で確かめた「まだ開いている所」
drop policy if exists post_change_log_insert  on public.post_change_log;
drop policy if exists org_billing_log_insert  on public.org_billing_log;
drop policy if exists export_log_insert       on public.export_log;
revoke insert, update, delete, truncate on public.post_change_log, public.org_billing_log, public.export_log from anon, authenticated;
-- 記録ではないが、同じ形で開いていた表
revoke insert, update, delete, truncate on public.koen_session_changes from anon, authenticated;   -- 履歴は引き金だけが書く
revoke insert, update, delete, truncate on public.cohort_changes        from anon, authenticated;   -- ポリシーが無く、書ける権限だけ残っていた

-- 確かめ（実在の試しの利用者で）
-- 画面から役職を変える → post_change_log に person で「誰が」が残る
-- サーバが set_config('app.actor_id', <id>, true) のあとに変える → 同じく person
-- サーバが入れ忘れ → system・null（処理は通る）
-- 画面が app.actor_id に他人の id を入れる → 記録は auth.uid() の本人（偽れない）
-- 3つの記録の表に画面から insert → 権限エラー
-- koen_session_changes・cohort_changes に画面から insert → 権限エラー
