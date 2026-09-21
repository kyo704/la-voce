-- ============================================================================
-- 役職の「できること」を変えた履歴（裁定160・2026-09-21）
--
--   なぜ引き金（trigger）にするか
--     役職の「できること」を1つ入れると、その役職の人 **全員** の権限が変わります。
--     人に役職を渡すより影響が大きいのに、変わったことがどこにも残りません。
--     呼ぶ側に任せると、裁定159 と同じく「呼ばれなければ残らない」になります。
--     だから台帳の側で、必ず1行残します。
--
--   門下を読む（monka_read）は「普段は切ってある」前提の できこと です。
--   入れた・切ったの記録が無いと、その前提を確かめられません。
--     ★2026-09-21、実際に確かめられませんでした（STEP_2）。
--
--   *_log の決まり: update・delete のポリシーを作りません。
--   何度流しても同じです。
-- ============================================================================

create table if not exists public.org_post_perm_log (
  id uuid primary key default gen_random_uuid(),
  changed_at timestamptz not null default now(),
  -- ★誰が。台帳の処理（引き金だけで動いたとき）は null です。
  changed_by uuid,
  -- ★null のときに「誰も分からない」と「仕組みがした」を言い分けます。
  changed_by_kind text not null default 'person'
    check (changed_by_kind in ('person', 'system')),
  org_id uuid not null,
  -- ★役職が消えても記録は残します（連鎖削除にしません）。消せない記録です。
  post_id uuid,
  post_name_at text,
  perms_before jsonb,
  perms_after jsonb,
  -- ★増えたもの・減ったもの。読む人が差を数えずに済みます。
  added text[] not null default '{}',
  removed text[] not null default '{}',
  op text not null check (op in ('insert', 'update', 'delete'))
);

comment on table public.org_post_perm_log is
  '役職の できること が変わった記録。引き金で残す。update・delete のポリシーを作らない（裁定160）。';

create index if not exists org_post_perm_log_org_idx
  on public.org_post_perm_log (org_id, changed_at desc);
create index if not exists org_post_perm_log_post_idx
  on public.org_post_perm_log (post_id, changed_at desc);

-- ---------------------------------------------------------------------------
-- 決まり ── 読むのは post か master を持つ人だけ。
--   ★利用者が直に insert する道を作りません。入れるのは引き金だけです。
-- ---------------------------------------------------------------------------
alter table public.org_post_perm_log enable row level security;

drop policy if exists org_post_perm_log_select on public.org_post_perm_log;
create policy org_post_perm_log_select on public.org_post_perm_log
  for select using (
    public.has_can(org_id, 'post') or public.has_can(org_id, 'master')
  );

-- ★みなに渡しません。insert は引き金（security definer）だけが通ります。
revoke insert, update, delete on public.org_post_perm_log from anon;
revoke insert, update, delete on public.org_post_perm_log from authenticated;
grant select on public.org_post_perm_log to authenticated;

-- ---------------------------------------------------------------------------
-- 引き金
--   ★perms か 名前 が変わったときだけ1行。ほかの列だけの変更では残しません。
--     （sort_order を並べ替えただけで履歴が埋まると、読めなくなります）
-- ---------------------------------------------------------------------------
create or replace function public.log_org_post_perm()
returns trigger
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_before jsonb;
  v_after jsonb;
  v_added text[];
  v_removed text[];
  v_who uuid;
begin
  v_who := auth.uid();

  if tg_op = 'INSERT' then
    v_before := null; v_after := new.perms;
  elsif tg_op = 'DELETE' then
    v_before := old.perms; v_after := null;
  else
    -- ★perms も 名前も 変わって いなければ、★何も 残しません。
    if old.perms is not distinct from new.perms
       and old.name is not distinct from new.name then
      return new;
    end if;
    v_before := old.perms; v_after := new.perms;
  end if;

  -- ★増えた もの ── ★後に true で、★前に true で ない もの。
  select coalesce(array_agg(k order by k), '{}')
    into v_added
    from jsonb_object_keys(coalesce(v_after, '{}'::jsonb)) k
   where coalesce((v_after ->> k)::boolean, false)
     and not coalesce((v_before ->> k)::boolean, false);

  select coalesce(array_agg(k order by k), '{}')
    into v_removed
    from jsonb_object_keys(coalesce(v_before, '{}'::jsonb)) k
   where coalesce((v_before ->> k)::boolean, false)
     and not coalesce((v_after ->> k)::boolean, false);

  insert into public.org_post_perm_log
    (changed_by, changed_by_kind, org_id, post_id, post_name_at,
     perms_before, perms_after, added, removed, op)
  values
    (v_who,
     case when v_who is null then 'system' else 'person' end,
     coalesce(new.org_id, old.org_id),
     coalesce(new.id, old.id),
     coalesce(new.name, old.name),
     v_before, v_after, v_added, v_removed, lower(tg_op));

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

comment on function public.log_org_post_perm() is
  'org_posts の perms・名前が変わったときに1行残す。裁定160。呼ぶ側に任せない。';

revoke all on function public.log_org_post_perm() from public;
revoke all on function public.log_org_post_perm() from anon;
revoke all on function public.log_org_post_perm() from authenticated;

drop trigger if exists trg_log_org_post_perm on public.org_posts;
create trigger trg_log_org_post_perm
  after insert or update or delete on public.org_posts
  for each row execute function public.log_org_post_perm();
