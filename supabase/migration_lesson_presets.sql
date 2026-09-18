-- ===========================================================================
-- ★授業の 型（★裁定 その90 §5・2026-09-18）
--
--   ★★★なぜ 要る か
--     ★★音大では、★1つの 授業名を ★何人もの 先生が 持ちます。
--       ★★「声楽実技」を 6人の 先生が 持つ。★年30回・週1回 は 全部 同じ。
--     ★★★1つ 作って、★6つの 門下に 当てます。
--       ★★無いと、★同じ ことを 6回 打ちます。
--
--   ★★★誰が 作るか（★裁定 その90 §5-4）
--     ★★作る・消す … ★事務（`meibo`）
--     ★★見る …… ★先生（`monka_write`）も 見られます
--     ★★年間の 回数は **学校が 決める もの** です。
--
--   ★★★型を 消しても、★出席の 記録は 消えません（★裁定 その90 Q5）。
--     ★★この 2つの 表は、★`lessons` を **1つも 指しません**。
--     ★★指して いない ので、★消しても 何も 連れて 行きません。
--     ★★★`lesson_preset_targets` だけ、★型を 消すと 一緒に 消えます
--       （★`on delete cascade`）。★あれは「当てて いる」という 結びつき だけ です。
--
--   ★★この 蔵の 決まりに 合わせて います ──
--     ★`enable` に 加えて `force`（★`org_billing` / `monka_read_log` と 同じ）
--     ★`to authenticated`（★匿名に 開けません）
--     ★`using` と `with check` の 両方
--     ★`using (true)` を 書きません
--     ★`org_id` を 必ず 持ちます
--     ★★取り上げ（revoke）を 先、★渡し（grant）を あと（★2026-09-13 の 決まり）
--
--   ★★何度 走らせても 同じに なります。★`BEGIN`／`ROLLBACK` を 使って いません。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【一】★型
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_presets (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  name text not null,
  -- ★★年間の 回数。★0 や 負の 数を 入れません。
  --   ★★★上限も 置きます。★打ち間違いを 台帳に 残さない ため です。
  total_count int not null check (total_count > 0 and total_count <= 400),
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

comment on table public.lesson_presets is
  '授業の型。年間の回数を決める。作る・消すのは meibo、見るのは monka_write も。裁定その90・2026-09-18。';

-- ★★同じ 学校の 中で、★同じ 名前を 2つ 作らせません。
create unique index if not exists lesson_presets_org_name_idx
  on public.lesson_presets (org_id, name);

-- ---------------------------------------------------------------------------
-- 【二】★どの 門下に 当てるか
--
--   ★★1つの 型を、★いくつの 門下に 当てても かまいません。
--   ★★★`org_id` を ここにも 持ちます。★決まりが 1つの 表だけ を 見て 済みます。
--     ★★持たないと、★決まりの 中で 毎回 `lesson_presets` を 引きます。
-- ---------------------------------------------------------------------------
create table if not exists public.lesson_preset_targets (
  preset_id uuid not null references public.lesson_presets(id) on delete cascade,
  teacher_id uuid not null references auth.users(id) on delete cascade,
  org_id uuid not null references public.organizations(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (preset_id, teacher_id)
);

comment on table public.lesson_preset_targets is
  '授業の型を当てている門下（先生）。裁定その90・2026-09-18。';

create index if not exists lesson_preset_targets_teacher_idx
  on public.lesson_preset_targets (org_id, teacher_id);

-- ---------------------------------------------------------------------------
-- 【三】★決まり（RLS）
--
--   ★★★取り上げてから、★渡します（★2026-09-13 の 決まり）。
--     ★★逆に すると、★古い 渡しが 決まりの 無い まま 残る 隙が できます。
-- ---------------------------------------------------------------------------
alter table public.lesson_presets enable row level security;
alter table public.lesson_presets force row level security;
alter table public.lesson_preset_targets enable row level security;
alter table public.lesson_preset_targets force row level security;

revoke all on table public.lesson_presets from public, anon;
revoke all on table public.lesson_preset_targets from public, anon;

grant select, insert, update, delete on table public.lesson_presets to authenticated;
grant select, insert, update, delete on table public.lesson_preset_targets to authenticated;

-- ★★見る ── ★事務（meibo）と 先生（monka_write）。
drop policy if exists lesson_presets_select on public.lesson_presets;
create policy lesson_presets_select on public.lesson_presets
  for select to authenticated
  using (has_can(org_id, 'meibo') or has_can(org_id, 'monka_write'));

-- ★★書く ── ★事務（meibo）だけ。★`using` と `with check` の 両方に 置きます。
--   ★★`with check` が 無いと、★よその 学校の `org_id` で 作れます。
drop policy if exists lesson_presets_write on public.lesson_presets;
create policy lesson_presets_write on public.lesson_presets
  for all to authenticated
  using (has_can(org_id, 'meibo'))
  with check (has_can(org_id, 'meibo'));

drop policy if exists lesson_preset_targets_select on public.lesson_preset_targets;
create policy lesson_preset_targets_select on public.lesson_preset_targets
  for select to authenticated
  using (has_can(org_id, 'meibo') or has_can(org_id, 'monka_write'));

drop policy if exists lesson_preset_targets_write on public.lesson_preset_targets;
create policy lesson_preset_targets_write on public.lesson_preset_targets
  for all to authenticated
  using (has_can(org_id, 'meibo'))
  with check (has_can(org_id, 'meibo'));

-- ---------------------------------------------------------------------------
-- 【四】★確かめ
-- ---------------------------------------------------------------------------

-- ★① 表が でき、★決まりが 効いて いるか
select c.relname as tbl, c.relrowsecurity as rls, c.relforcerowsecurity as force_rls
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname in ('lesson_presets', 'lesson_preset_targets')
order by c.relname;

-- ★② 決まりの 中身。★`using (true)` が 無いこと
select c.relname as tbl, p.polname, p.polcmd::text as cmd,
       p.polroles::regrole[]::text as roles,
       pg_get_expr(p.polqual, p.polrelid) as using_expr,
       pg_get_expr(p.polwithcheck, p.polrelid) as check_expr
from pg_policy p join pg_class c on c.oid = p.polrelid
where c.relname in ('lesson_presets', 'lesson_preset_targets')
order by c.relname, p.polname;

-- ★③ 匿名に 渡って いないこと
select grantee, table_name, string_agg(privilege_type, ',') as p
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('lesson_presets', 'lesson_preset_targets')
group by grantee, table_name
order by table_name, grantee;

-- ★④ ★型が `lessons` を 指して いないこと（★消しても 出席は 消えません）
select tc.table_name, kcu.column_name, ccu.table_name as sasu_saki
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name
join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY'
  and tc.table_name in ('lesson_presets', 'lesson_preset_targets')
order by tc.table_name, kcu.column_name;
-- ★★★2026-09-18、★作った 直後の 確かめで 見つけました。
--   ★★`authenticated` に TRUNCATE / TRIGGER / REFERENCES まで 渡って いました。
--   ★★★`create table` の とき、★この 台帳の 既定が **ぜんぶ 渡す** 形 だから です。
--     ★★私の `revoke` は `public` と `anon` だけ を 相手に して いました。
--     ★★`authenticated` は そのまま でした。
--   ★★★TRUNCATE は 決まり（RLS）を **通りません**。
--     ★★入って いる 方なら、★表を まるごと 空に できて いました。
--   ★★ほかの 表は そう なって いません（★org_billing など・確かめました）。
--     ★★この 2つ だけ が 外れて いました。
--   ★★★取り上げてから、★要る ものだけ 渡し直します。
revoke all on table public.lesson_presets from authenticated;
revoke all on table public.lesson_preset_targets from authenticated;

grant select, insert, update, delete on table public.lesson_presets to authenticated;
grant select, insert, update, delete on table public.lesson_preset_targets to authenticated;

select grantee, table_name, string_agg(privilege_type, ',' order by privilege_type) as p
from information_schema.role_table_grants
where table_schema = 'public'
  and table_name in ('lesson_presets', 'lesson_preset_targets')
  and grantee in ('authenticated', 'anon')
group by grantee, table_name
order by table_name, grantee;
