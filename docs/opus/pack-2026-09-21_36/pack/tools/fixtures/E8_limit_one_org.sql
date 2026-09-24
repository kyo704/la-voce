select m.org_id into v_org from public.memberships m where m.user_id = auth.uid() limit 1;
