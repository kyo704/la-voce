-- ===========================================================================
-- ★monka_read_log ── ★門下の やりとりを 確かめた 記録
--
--   ★出どころ 裁定 その76 訂正版（★2026-09-18）
--     ★★`monka_read` は「門下の **やりとり**（連絡）を 読む」できこと です。
--       ★★健康の 記録では ありません（★前の 読み違いを 訂正した もの）。
--     ★★MUST_HAVE_WITH_IT ①「閲覧の 記録」── ★この 紙 です。
--
--   ★★★この 表は、★`monka_read` を 使える ように する ための **条件** です。
--     ★★記録が 残らない 閲覧を、★作らない ため に 先に 置きます。
--     ★★「見られる 仕組み」より 先に「見た ことが 残る 仕組み」を 立てます。
--
--   ★★何度 走らせても 同じに なります。
--   ★★`BEGIN` も `ROLLBACK` も 使って いません（★2026-09-15 の 一件）。
--   ★★決まりを、★表と 同じ 紙に 書いて います（★裁定 その72 §13）。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【一】★表
--
--   ★★`target_monka_id` ── ★裁定の 名を そのまま 使って います。
--     ★★中身は **先生の 番号**（`auth.users.id`）です。
--       ★★この 蔵では、★門下は `org_messages.teacher_id` で 決まります。
--       ★★門下そのものの 表は ありません。★先生が 門下を 決めて います。
--     ★★名と 中身が ずれて 見えるので、★ここに 書いて 残します。
--
--   ★★`reason` ── ★空では 書けません（★裁定 その76「理由の 入力を 省かない」）。
--     ★★`not null` だけ では 足りません。★空の 字（''）が 通ります。
--     ★★だから 長さも 見ます。
--
--   ★★★学校ぜんぶ 宛の お知らせ（`teacher_id is null`）は、★ここに 入れません。
--     ★★あれは `renraku_all` で 読む もの です。★門下の やりとり では ありません。
--     ★★だから `target_monka_id` は `not null` です。
-- ---------------------------------------------------------------------------
create table if not exists public.monka_read_log (
  id              uuid primary key default gen_random_uuid(),
  org_id          uuid not null references public.organizations(id) on delete cascade,
  viewer_user_id  uuid not null references auth.users(id) on delete cascade,
  target_monka_id uuid not null references auth.users(id) on delete cascade,
  viewed_at       timestamptz not null default now(),
  reason          text not null
);

do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'monka_read_log_reason_not_blank'
  ) then
    alter table public.monka_read_log
      add constraint monka_read_log_reason_not_blank
      check (char_length(btrim(reason)) >= 4);
  end if;
end $$;

comment on column public.monka_read_log.target_monka_id is
  '門下の先生の user id（この蔵では門下は org_messages.teacher_id で決まります）';
comment on column public.monka_read_log.reason is
  '確かめた理由。空では書けません（裁定その76）。4文字以上。';

create index if not exists monka_read_log_org_viewed_idx
  on public.monka_read_log (org_id, viewed_at desc);
create index if not exists monka_read_log_target_idx
  on public.monka_read_log (target_monka_id, viewed_at desc);

-- ---------------------------------------------------------------------------
-- 【二】★権利 ── ★先に 取り上げ、★それから 渡します
--
--   ★★`update` も `delete` も 渡しません。
--     ★★★記録は 直せません。★直せる 記録は、★記録では ありません。
--     ★★見た ことを 消せる なら、★この 表を 作る 意味が ありません。
-- ---------------------------------------------------------------------------
revoke all on public.monka_read_log from public;
revoke all on public.monka_read_log from anon;
revoke all on public.monka_read_log from authenticated;

alter table public.monka_read_log enable row level security;
alter table public.monka_read_log force row level security;

grant select, insert on public.monka_read_log to authenticated;

-- ---------------------------------------------------------------------------
-- 【三】★決まり（RLS）
--
--   ★★読める のは 2とおり（★裁定 その76）──
--     ★① `master` を 持つ 方（★学校の 中を 確かめる 側）
--     ★② ★自分が 見た ぶん（`viewer_user_id = auth.uid()`）
--
--   ★★★門下の 先生 本人は、★ここを 読めません。
--     ★★裁定 その76「誰が 見たかは 出さない（報復を 避ける）」。
--     ★★本人には **別の 道**で、★見られた ことだけ を お伝えします（★③ 通知）。
--     ★★この 表を 開けると、★誰が 見たかが 分かって しまいます。
--
--   ★★書ける のは 1とおり ──
--     ★`monka_read` を 持つ 方が、★**自分の 名で** 書く ときだけ。
--     ★★他人の 名で 書けません（`viewer_user_id = auth.uid()`）。
--     ★★★ここを 緩めると、★記録の 名前を すり替えられます。
-- ---------------------------------------------------------------------------
do $$
begin
  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'monka_read_log' and p.polname = 'monka_read_log_select_master_or_self'
  ) then
    create policy monka_read_log_select_master_or_self on public.monka_read_log
      for select to authenticated
      using (
        viewer_user_id = auth.uid()
        or public.has_can(org_id, 'master')
      );
  end if;

  if not exists (
    select 1 from pg_policy p join pg_class c on c.oid = p.polrelid
    where c.relname = 'monka_read_log' and p.polname = 'monka_read_log_insert_self_monka_read'
  ) then
    create policy monka_read_log_insert_self_monka_read on public.monka_read_log
      for insert to authenticated
      with check (
        viewer_user_id = auth.uid()
        and public.has_can(org_id, 'monka_read')
      );
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 【四】★確かめ
-- ---------------------------------------------------------------------------

-- ★① 決まりを 使うか／持ち主にも かけるか … ★どちらも true
select c.relrowsecurity as 決まりを使う, c.relforcerowsecurity as 持ち主にもかける
from pg_class c join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'monka_read_log';

-- ★② 決まり … ★2（select / insert）。★update も delete も ありません。
select p.polname as 決まりの名, p.polcmd as 動き,
       coalesce(pg_get_expr(p.polqual, p.polrelid), '')      as 読む条件,
       coalesce(pg_get_expr(p.polwithcheck, p.polrelid), '') as 書く条件
from pg_policy p join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'monka_read_log'
order by p.polcmd;

-- ★③ 権利 … ★authenticated に SELECT と INSERT だけ。★anon は 0行。
select grantee as 相手, privilege_type as 権利
from information_schema.role_table_grants
where table_schema = 'public' and table_name = 'monka_read_log'
order by grantee, privilege_type;
