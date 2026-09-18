-- ===========================================================================
-- ★`authenticated` から TRUNCATE を 取り上げます（★2026-09-18・見つけもの）
--
--   ★★★何が 起きて いるか
--     ★★`create table` の とき、★この 台帳の 既定が
--       ★★`authenticated` に **ぜんぶ** 渡します（TRUNCATE / TRIGGER / REFERENCES を 含む）。
--     ★★★TRUNCATE は 決まり（RLS）を **通りません**。
--       ★★入って いる 方なら、★表を まるごと 空に できます。
--     ★★いま そう なって いる 表 …… **25**（★2026-09-18 に 数えました）。
--
--   ★★★どれだけ 危ない か ── ★正直に 書きます
--     ★★画面（PostgREST）からは TRUNCATE を 呼べません。
--       ★★読む・足す・直す・消す と 手続き だけ です。
--     ★★だから いま すぐ 誰かが 消せる、という 話では ありません。
--     ★★★けれど「決まりを 通らない 道」が 25本 開いて います。
--       ★★重ねの 1枚 です。★閉じて おきます。
--
--   ★★★TRIGGER と REFERENCES も 一緒に 外します。
--     ★★どちらも 画面からは 使いません。
--     ★★REFERENCES は「よその 表を 指す 鍵を 作れる」権です。
--
--   ★★消す（DELETE）は 外しません。★画面が 使って います。★決まりが 効きます。
--
--   ★★何度 走らせても 同じに なります。★`BEGIN`／`ROLLBACK` を 使って いません。
-- ===========================================================================

do $$
declare
  r record;
  n int := 0;
begin
  for r in
    select distinct table_name
    from information_schema.role_table_grants
    where table_schema = 'public'
      and grantee = 'authenticated'
      and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES')
  loop
    execute format(
      'revoke truncate, trigger, references on table public.%I from authenticated', r.table_name);
    n := n + 1;
  end loop;
  raise notice '★% の 表から 取り上げました', n;
end $$;

-- ---------------------------------------------------------------------------
-- ★確かめ ── ★0件に なる はず です
-- ---------------------------------------------------------------------------
select count(*) as nokori
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'authenticated'
  and privilege_type in ('TRUNCATE', 'TRIGGER', 'REFERENCES');

-- ★★読む・足す・直す・消す が 残って いる こと（★画面が 使います）
select table_name, string_agg(privilege_type, ',' order by privilege_type) as p
from information_schema.role_table_grants
where table_schema = 'public' and grantee = 'authenticated'
  and table_name in ('entries', 'lessons', 'org_billing', 'lesson_presets', 'cycle_periods')
group by table_name
order by table_name;
