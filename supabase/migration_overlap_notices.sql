-- ============================================================================
-- ★重なりの しるし（★見本 `P_kasa` ／ `P_kasaT` ／ `P_kasaFix`・2026-09-20）
--
--   ★★★重なり そのものは、★しまいません。
--     ★★`lessons` の 時刻・先生・場所 から、★そのつど 数えます。
--     ★★しまうと、★コマを 動かした あとも 古い 重なりが 残ります。
--
--   ★★★しまうのは、★**人が 決めた こと** だけ です ── ★3つの 姿。
--     ★`まだ` …… ★まだ 知らせて いません
--     ★`知らせた` … ★先生の 画面に 出して います
--     ★`解決` …… ★このままで よい、と 事務が 片づけました
--
--   ★★★3列 だけ です（★裁定 その108 ③・2026-09-20）。
--     ★★`lesson_id` ／ `status` ／ `updated_at`。
--     ★★★だから 書けない ことが あります ── ★lib/opsKasa.js の
--       ★★`KASA_NOT_YET` を ご覧ください。★無い ものを 出しません。
--
--   ★★★1つの 重なりは 2コマ です。★行も 2つ 置きます。
--     ★★片方 だけ 動く ことが あるからです（★先生は ご自分の ぶん だけ 動かせます）。
--     ★★先生は ご自分の コマの 行 だけ を 読みます（★下の 決まり）。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

create table if not exists public.overlap_notices (
  lesson_id uuid primary key references public.lessons(id) on delete cascade,
  status text not null default 'まだ',
  updated_at timestamptz not null default now(),
  constraint overlap_notices_status_check check (status in ('まだ', '知らせた', '解決'))
);

alter table public.overlap_notices enable row level security;

do $$
begin
  -- ★読む ── ★ご自分の コマ（先生）★または `sched_all` を 持つ 方（事務）。
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='overlap_notices' and p.polname='overlap_notices_select') then
    create policy overlap_notices_select on public.overlap_notices
      for select using (
        exists (
          select 1 from public.lessons l
          where l.id = overlap_notices.lesson_id
            and (l.teacher_id = auth.uid() or public.has_can(l.org_id, 'sched_all'))
        )
      );
  end if;

  -- ★書く ── ★同じ 門 です。
  --   ★★事務は「知らせた」「解決」を つけます。
  --   ★★先生は ご自分の コマを 動かした とき に「解決」を つけます。
  if not exists (select 1 from pg_policy p join pg_class c on c.oid=p.polrelid
                 where c.relname='overlap_notices' and p.polname='overlap_notices_write') then
    create policy overlap_notices_write on public.overlap_notices
      for all using (
        exists (
          select 1 from public.lessons l
          where l.id = overlap_notices.lesson_id
            and (l.teacher_id = auth.uid() or public.has_can(l.org_id, 'sched_all'))
        )
      )
      with check (
        exists (
          select 1 from public.lessons l
          where l.id = overlap_notices.lesson_id
            and (l.teacher_id = auth.uid() or public.has_can(l.org_id, 'sched_all'))
        )
      );
  end if;
end $$;

-- ★★★先に 取り上げてから、★要る ぶん だけ を お渡しします。
revoke all on table public.overlap_notices from public, anon, authenticated;
grant select, insert, update, delete on table public.overlap_notices to authenticated;
