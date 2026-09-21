-- ★本番の 台帳から 写しました（a13_replace_has_can_policies）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


do $$
declare
  r record;
  new_qual text;
  new_check text;
  roles_str text;
  ddl text;
  hit_count int := 0;
begin
  for r in
    select schemaname, tablename, policyname, permissive, cmd, roles, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and policyname in (
        'assignments_all_owner_admin','assignments_select',
        'enrollments_all_owner_admin',
        'memberships_delete_admin','memberships_insert_bootstrap_owner',
        'memberships_select','memberships_update_role_management',
        'org_events_write_admin',
        'org_invitations_insert','org_invitations_select',
        'org_messages_insert','org_messages_select'
      )
  loop
    new_qual := r.qual;
    new_check := r.with_check;

    if r.policyname = 'memberships_select' then
      new_qual := replace(new_qual, 'is_org_owner_or_admin(auth.uid(), org_id)', 'has_can(org_id, ''post''::text)');
    elsif r.tablename = 'memberships' then
      if new_qual is not null then
        new_qual := replace(new_qual, 'is_org_owner_or_admin(auth.uid(), org_id)', 'has_can(org_id, ''post''::text)');
      end if;
      if new_check is not null then
        new_check := replace(new_check, 'is_org_owner_or_admin(auth.uid(), org_id)', 'has_can(org_id, ''post''::text)');
      end if;
    elsif r.tablename in ('assignments','enrollments') then
      if new_qual is not null then
        new_qual := replace(new_qual, 'is_org_owner_or_admin(auth.uid(), org_id)', 'has_can(org_id, ''meibo''::text)');
      end if;
      if new_check is not null then
        new_check := replace(new_check, 'is_org_owner_or_admin(auth.uid(), org_id)', 'has_can(org_id, ''meibo''::text)');
      end if;
    elsif r.policyname = 'org_events_write_admin' then
      new_qual := 'has_can(org_id, ''gyoji''::text)';
      new_check := 'has_can(org_id, ''gyoji''::text)';
    elsif r.tablename = 'org_invitations' then
      if new_qual is not null then
        new_qual := replace(new_qual, 'is_org_owner_or_admin(auth.uid(), org_id)', 'has_can(org_id, ''meibo''::text)');
      end if;
      if new_check is not null then
        new_check := replace(new_check, 'is_org_owner_or_admin(auth.uid(), org_id)', 'has_can(org_id, ''meibo''::text)');
      end if;
    elsif r.tablename = 'org_messages' then
      if new_qual is not null then
        new_qual := 'has_can(org_id, ''renraku_all''::text)';
      end if;
      if new_check is not null then
        new_check := regexp_replace(new_check,
          'EXISTS \( SELECT 1\s+FROM memberships m\s+WHERE \(\(m\.org_id = org_messages\.org_id\) AND \(m\.user_id = auth\.uid\(\)\) AND \(m\.role = ANY \(ARRAY\[''owner''::text, ''admin''::text\]\)\)\)\)',
          'has_can(org_id, ''renraku_all''::text)', 'g');
      end if;
    end if;

    if new_qual is not distinct from r.qual and new_check is not distinct from r.with_check then
      raise notice '飛ばしました（一致なし）: % / %', r.tablename, r.policyname;
      continue;
    end if;

    execute format('drop policy %I on public.%I', r.policyname, r.tablename);

    select string_agg(quote_ident(x), ', ') into roles_str from unnest(r.roles) x;

    ddl := format('create policy %I on public.%I as %s for %s to %s',
                   r.policyname, r.tablename, r.permissive, r.cmd, roles_str);
    if new_qual is not null then
      ddl := ddl || format(' using (%s)', new_qual);
    end if;
    if new_check is not null then
      ddl := ddl || format(' with check (%s)', new_check);
    end if;

    execute ddl;
    hit_count := hit_count + 1;
    raise notice '直しました: % / %', r.tablename, r.policyname;
  end loop;

  raise notice '直した本数: %', hit_count;
end $$;

