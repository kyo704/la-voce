-- ============================================================================
-- ★録画（★URL だけ）── ★裁定 その94 §4f（★2026-09-19 の 追補）
--
--   ★★★預かりません。★アプリの 中で 再生しません。
--     ★★ご本人が すでに 公開して いる ところ（YouTube 等）への 道しるべ です。
--     ★★★Woolsong が 新しく 晒すのでは ありません。
--     ★★だから 置き場（Storage）が 要りません。★字の 表 1つ で 足ります。
--
--   ★★★`portfolio_entries` に 混ぜません。
--     ★★あちらの `detail` は「年」です。★ここに URL を 入れると、
--       ★★列の 名と 中身が 食い違います（★この 蔵の 持病 です）。
--     ★★だから 別の 表に します。
--
--   ★★許しは ご本人 だけ です。★学校の 枝は まだ 足しません（★③ は これから）。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create table if not exists public.portfolio_recordings (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  -- ★何の 録画か（★曲名・役名など）。
  title      text not null,
  -- ★行き先。★`https://` だけ を 通します（★画面でも 台帳でも 見ます）。
  url        text not null check (url ~ '^https://[^\s]+$'),
  -- ★そえがき（★いつ・どこで。★書かなくて かまいません）。
  detail     text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists portfolio_recordings_user_idx
  on public.portfolio_recordings (user_id, sort_order);

alter table public.portfolio_recordings enable row level security;

revoke all on public.portfolio_recordings from anon, authenticated;
grant select, insert, update, delete on public.portfolio_recordings to authenticated;

drop policy if exists portfolio_recordings_own on public.portfolio_recordings;
create policy portfolio_recordings_own on public.portfolio_recordings
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- ★確かめ
-- ---------------------------------------------------------------------------
--   select conname, pg_get_constraintdef(oid) from pg_constraint
--   where conrelid = 'public.portfolio_recordings'::regclass;
--
--   ★`url ~ '^https://…'` の 縛りが ある ことを ご覧ください。
--   ★`http://`（s なし）は 入りません。
