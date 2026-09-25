-- ============================================================================
-- ★読んだ印を 台帳から 外します（★2026-09-25・坂本さんの お決め）
--
--   ★★見本 `記事` の 下の 字 ──
--     「★読んだ印（✓）は、ご自分の 端末にだけ 残ります。
--       ★誰が 読んだかは 記録しません（数だけ 数えます）。」
--   ★★見本 `もっと深く` の 下の 字 ──
--     「★読んだ印は、ご自分の 端末にだけ 残ります。
--       ★誰が 読んだかは 記録しません。どこまで 読んだかも 数えません。」
--
--   ★★★台帳は そう なって いませんでした ──
--     ★`article_progress` に `read_at`・`first_read_at` を、★人の 番号と 一緒に
--     ★書いて いました。★決まり（RLS）は 本人だけ なので 誰にも 見えませんが、
--     ★★それでも「★記録しません」とは 言えません。★書いて あるから です。
--
--   ★坂本さんの お決め（★2026-09-25）──
--     「誰が読んだかを記録しない形に実装を修正してください」
--
--   ★★★外す 3列は、★どれも **読む 人が いません** でした（★2026-09-25 に 数えました）──
--     ★`read_at`        …… ✓の しるし だけ。★端末へ 移します
--     ★`first_read_at`  …… 書いて いるだけ。★読む ところが 1つも ありません
--     ★`bookmarked`     …… 書く ところも 読む ところも ありません。★8行 とも false
--   ★★だから、★外しても 誰の 手元からも 何も 減りません。
--
--   ★★★残す 3列 ── `box`・`next_due_at`・`last_answered_at`。
--     ★これは「★間を あけて 出し直す」ための 予定 です。★その方の 持ちもの です。
--     ★端末だけに すると、★端末を 替えた ときに 消えます。★消しません。
--     ★★だから「どこまで 読んだかも 数えません」は、★まだ 字の とおりでは ありません。
--       ★そこは 坂本さんに お尋ねして います。
--
--   ★★数える ほうは `article_read_counts` に します ── ★人の 列を 持ちません。
--     ★★持たない ので、★あとから 誰が 読んだかを 出す ことが できません。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

-- ★① 数える 表（★人の 列を 持ちません）
create table if not exists public.article_read_counts (
  article_id text primary key,
  n bigint not null default 0,
  updated_at timestamptz not null default now()
);

alter table public.article_read_counts enable row level security;

-- ★★読めるのは 運営だけ です（★裁定176 の 考え）。
--   ★★書くのは 下の 関数 だけ です。★誰も 直に 書けません。
do $$
begin
  if not exists (
    select 1 from pg_policy pol join pg_class c on c.oid = pol.polrelid
    where c.relname = 'article_read_counts' and pol.polname = 'article_read_counts_select_admin'
  ) then
    create policy article_read_counts_select_admin
      on public.article_read_counts for select
      using (exists (
        select 1 from public.profiles p
        where p.id = auth.uid() and p.is_admin = true
      ));
  end if;
end $$;

revoke insert, update, delete on public.article_read_counts from authenticated;
revoke insert, update, delete on public.article_read_counts from anon;

-- ★② 1つ 足す 関数。★誰が 呼んだかを 書きません。
--   ★★`security definer` ですが、★入れるのは 数 だけ です。
--     ★引数に 人の 番号を 取りません。★取れない ように して あります。
create or replace function public.bump_article_read(p_article_id text)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
begin
  if p_article_id is null or length(p_article_id) = 0 or length(p_article_id) > 200 then
    return;
  end if;
  -- ★★入るのは 数 だけ です。★`auth.uid()` を 1度も 使いません。
  insert into public.article_read_counts (article_id, n, updated_at)
  values (p_article_id, 1, now())
  on conflict (article_id) do update
    set n = public.article_read_counts.n + 1, updated_at = now();
end $$;

grant execute on function public.bump_article_read(text) to authenticated;

-- ★③ 人と 結びつく 3列を 外します。
--   ★★`if exists` なので 2度 流しても 落ちません。
alter table public.article_progress drop column if exists read_at;
alter table public.article_progress drop column if exists first_read_at;
alter table public.article_progress drop column if exists bookmarked;
