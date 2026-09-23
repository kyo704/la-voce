-- ★★★引き金の 関数を、★画面・未ログインから 呼べなく します（★A4・2026-09-23）。
--
--   ★★目録の 見張り（ledger_inventory audit）が 見つけました ──
--       A4 | log_post_change() | security definer を anon が実行できる
--
--   ★★★わけ ── ★`create or replace` は 権限を 残しますが、
--     ★いちど 落として 作り直すと、★既定（PUBLIC に EXECUTE）に 戻ります。
--     ★きょう この 関数は 何度か 作り直されました。★取り上げが 1回 抜けました。
--
--   ★★実の 害は 小さい です ── ★plpgsql の 引き金の 関数は、
--     ★引き金の 外から 呼ぶと「trigger functions can only be called as triggers」で 落ちます。
--   ★★★けれど 決めは「security definer を anon に 渡さない」です。★戻します。
--
--   ★★★ついでに、★同じ 形の 引き金の 関数も ぜんぶ 閉じます。
--     ★1つずつ 名指しに すると、★次に 増えた ものを また 見落とします。
--     ★★`pg_trigger` が 使って いる 関数 だけ を 選びます。★狙いを 外しません。

do $$
declare f record; n integer := 0;
begin
  for f in
    select distinct p.oid, p.proname,
           pg_get_function_identity_arguments(p.oid) args
      from pg_proc p
      join pg_namespace ns on ns.oid = p.pronamespace
     where ns.nspname = 'public'
       and p.prorettype = 'trigger'::regtype           -- ★引き金の 関数 だけ
       and (has_function_privilege('anon', p.oid, 'EXECUTE')
         or has_function_privilege('authenticated', p.oid, 'EXECUTE'))
  loop
    execute format('revoke all on function public.%I(%s) from public, anon, authenticated',
                   f.proname, f.args);
    n := n + 1;
  end loop;
  raise notice '★閉じた 引き金の 関数 …… %', n;
end $$;
