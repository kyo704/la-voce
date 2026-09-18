-- ===========================================================================
-- ★post_change_log ── ★役職を 変えた 記録（★誰が・いつ・誰を）
--
--   ★出どころ 坂本さんの お決め（★2026-09-18）
--     ★「お金の 宛先の 変更（`atesaki_changed_at` / `atesaki_changed_by`）と
--       ★同じ 考え方で、★誰が・いつ・誰の 役職を 変えたかを 記録する」
--
--   ★★★これを 作る まで、★見本の 注の 1行が 書けません でした ──
--     ★「変えた記録は 残ります（誰が・いつ・誰を）」
--     ★★台帳に 記録が 無い のに そう 書けば、★嘘に なります。
--     ★★★先に 記録を 作り、★それから 書きます。★順を 変えません。
--
--   ★★何度 走らせても 同じに なります。
--   ★★`BEGIN` も `ROLLBACK` も 使って いません（★2026-09-15 の 一件）。
--   ★★決まりを、★表と 同じ 紙に 書いて います（★裁定 その72 §13）。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【一】★表
--
--   ★★★役職の **名** も 一緒に 残します。
--     ★★番号（`post_id`）だけ だと、★その 役職が 消えた とき
--       ★★何から 何に 変わったのかが 読めなく なります。
--     ★★記録は、★あとから 読む ため の もの です。
--       ★★読めなく なる 記録は、★記録では ありません。
--   ★★`null` は「役職なし」です。★空の 字に しません。
--     ★★「外した」と「はじめから 無い」は、★どちらも `null` です。
--       ★★それは 同じ こと です（★結果として 役職が 無い）。
--       ★★★どちらから 来たかは `from_post_id` が 語ります。
-- ---------------------------------------------------------------------------
create table if not exists public.post_change_log (
  id             uuid primary key default gen_random_uuid(),
  org_id         uuid not null references public.organizations(id) on delete cascade,
  target_user_id uuid not null references auth.users(id) on delete cascade,
  from_post_id   uuid,
  from_post_name text,
  to_post_id     uuid,
  to_post_name   text,
  changed_at     timestamptz not null default now(),
  changed_by     uuid not null references auth.users(id) on delete set null
);

comment on table public.post_change_log is
  '役職を変えた記録（誰が・いつ・誰を）。坂本さんのお決め・2026-09-18。名も残します（役職が消えても読めるように）。';

create index if not exists post_change_log_org_at_idx
  on public.post_change_log (org_id, changed_at desc);
create index if not exists post_change_log_target_idx
  on public.post_change_log (target_user_id, changed_at desc);

-- ---------------------------------------------------------------------------
-- 【二】★権利 ── ★先に 取り上げ、★それから 渡します
--
--   ★★`update` も `delete` も 渡しません。★記録は 直せません。
-- ---------------------------------------------------------------------------
revoke all on public.post_change_log from public;
revoke all on public.post_change_log from anon;
revoke all on public.post_change_log from authenticated;

alter table public.post_change_log enable row level security;
alter table public.post_change_log force row level security;

grant select, insert on public.post_change_log to authenticated;

-- ---------------------------------------------------------------------------
-- 【三】★決まり（RLS）
--
--   ★★読める のは 2とおり ──
--     ★① `post`（ひとの 役職を 変える）を 持つ 方
--     ★② ★**変えられた ご本人**
--       ★★★ここが `monka_read_log` と ちがいます。
--         ★★あちらは、★見られた 方に 誰が 見たかを 出しません（★報復を 避ける）。
--         ★★こちらは、★ご自分の 役職が 変わった こと です。
--           ★★誰が 変えたかを 知るのは、★当たり前の こと です。
--           ★★黙って 変えられて、★誰が やったか 分からない ── ★それは いけません。
--
--   ★★書ける のは 1とおり ──
--     ★`post` を 持つ 方が、★**自分の 名で** 書く ときだけ。
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'post_change_log' and p.polname = 'post_change_log_select'
  ) then
    create policy post_change_log_select on public.post_change_log
      for select to authenticated
      using (
        target_user_id = auth.uid()
        or public.has_can(org_id, 'post')
      );
  end if;

  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'post_change_log' and p.polname = 'post_change_log_insert'
  ) then
    create policy post_change_log_insert on public.post_change_log
      for insert to authenticated
      with check (
        changed_by = auth.uid()
        and public.has_can(org_id, 'post')
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 【四】★確かめ
-- ---------------------------------------------------------------------------
select c.relrowsecurity as 決まりを使う, c.relforcerowsecurity as 持ち主にもかける
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'post_change_log';

select p.polname as 決まりの名, p.polcmd as 動き,
       coalesce(pg_get_expr(p.polqual, p.polrelid), '')      as 読む条件,
       coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') as 書く条件
from pg_policy p join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'post_change_log'
order by p.polcmd;

select grantee as 相手, privilege_type as 権利
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'post_change_log'
order by grantee, privilege_type;
