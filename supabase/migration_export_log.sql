-- ============================================================================
-- ★書き出した 記録（★見本 `stExport` の 注・2026-09-20）
--
--   ★★★見本の 字 ──「誰が・いつ・何を 書き出したかが 残ります」。
--     ★★個人の ことを 外へ 出す 行い です。★残さない わけには いきません。
--
--   ★★★4列 だけ です。★中身は 1文字も しまいません。
--     ★`org_id` ／ `user_id` ／ `what`（出した ものの 名）／ `rows`（行の 数）
--     ★★出した ファイルそのものは 残しません。★二重に 持ちません。
--
--   ★★★消せません・書き換えられません（★`score_log` と 同じ 形）。
--     ★★渡すのは `insert` と `select` だけ です。
--     ★★★調べる ための 記録が 消えるのでは、★筋が 通りません。
--
--   ★★見えるのは、★その 学校の `master` を 持つ 方 と、★ご自分の 行 だけ です。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create table if not exists public.export_log (
  id uuid primary key default gen_random_uuid(),
  org_id uuid not null references public.organizations(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  what text not null,
  rows integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists export_log_org_idx on public.export_log (org_id, created_at desc);

alter table public.export_log enable row level security;

do $$
begin
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='export_log' and p.polname='export_log_select') then
    create policy export_log_select on public.export_log
      for select using (
        user_id = auth.uid() or public.has_can(org_id, 'master')
      );
  end if;
  -- ★★★書くのは ご本人 だけ。★よその 名で 残せません。
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='export_log' and p.polname='export_log_insert') then
    create policy export_log_insert on public.export_log
      for insert with check (
        user_id = auth.uid()
        and exists (select 1 from public.memberships m
                    where m.org_id = export_log.org_id and m.user_id = auth.uid())
      );
  end if;
end $$;

-- ★★★先に 取り上げます。★そのあと、要る ぶん だけ を 渡します。
--   ★★`update` と `delete` は 渡しません。★消せない 記録 です。
revoke all on table public.export_log from public, anon, authenticated;
grant select, insert on table public.export_log to authenticated;
