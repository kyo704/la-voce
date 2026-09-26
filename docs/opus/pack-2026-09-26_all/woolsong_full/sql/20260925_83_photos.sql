-- 20260925_83 写真の 置き場（★裁定199）
-- Code の指摘（2026-09-25）:
--   ★写真の 列も Storage も 無い／★Exif の 位置情報を 消す処理が 無い
--   ★このまま 実装すると ★自宅・稽古場・会場の 座標が 公開ページに 載ります
--   ★見本は「★撮った 場所の 情報は、こちらで 消します」と ★すでに 約束しています
--   → ★止めた Code の 判断は 正しい
-- ★82 のあと

-- ① 写真の 台帳（★ファイルそのものは Storage に 置きます）
create table if not exists public.portfolio_photos (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  path       text not null,                    -- ★Storage の 中の 道（★user_id/uuid.webp）
  w          integer, h integer,
  tone       text default 'none' check (tone in ('none','mono','sepia')),
  shape      text default 'square' check (shape in ('circle','rounded','square')),
  sort_order integer not null default 0,       -- ★いちばん 上が 顔の写真（見本の ことば）
  exif_cleared_at timestamptz,                 -- ★★消した 時刻。★null の ものは 出さない
  created_at timestamptz not null default now()
);
create index if not exists portfolio_photos_user_idx on public.portfolio_photos(user_id, sort_order);
alter table public.portfolio_photos enable row level security;
revoke all on public.portfolio_photos from anon, authenticated;
grant select, insert, update, delete on public.portfolio_photos to authenticated;

-- ★本人は 全部／★公開の 範囲に 合わせて 他人も（★sql/78・80 と 同じ考え）
drop policy if exists portfolio_photos_own on public.portfolio_photos;
create policy portfolio_photos_own on public.portfolio_photos for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
drop policy if exists portfolio_photos_read on public.portfolio_photos;
create policy portfolio_photos_read on public.portfolio_photos for select to authenticated
  using (
    user_id = auth.uid()
    or (exif_cleared_at is not null                       -- ★★消していない 写真は 他人に 出さない
        and exists (select 1 from public.portfolios p
                     where p.user_id = portfolio_photos.user_id
                       and (p.visibility = 'public'
                            or (p.visibility = 'org' and public.same_org_as(p.user_id)))))
  );

-- ② ★20枚まで（★見本・裁定145）
create or replace function public.assert_photo_limit()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare n integer;
begin
  select count(*) into n from public.portfolio_photos where user_id = new.user_id;
  if n >= 20 then raise exception 'TOO_MANY_PHOTOS: 写真は 20枚までです'; end if;
  return new;
end $$;
drop trigger if exists trg_photo_limit on public.portfolio_photos;
create trigger trg_photo_limit before insert on public.portfolio_photos
  for each row execute function public.assert_photo_limit();

-- ③ ★消したことを 立てる（★実装が Exif を 落としたあとに 呼ぶ）
create or replace function public.mark_exif_cleared(p_photo uuid)
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  update public.portfolio_photos
     set exif_cleared_at = now()
   where id = p_photo and user_id = auth.uid();
  if not found then raise exception 'NOT_YOURS'; end if;
end $$;
revoke all on function public.mark_exif_cleared(uuid) from public, anon;
grant execute on function public.mark_exif_cleared(uuid) to authenticated;

-- ④ ★見張り（★消していない 写真が 残っていないか）
create or replace function public.photos_without_exif_clear()
returns table(user_id uuid, n integer, oldest timestamptz)
language sql stable security definer set search_path to 'public' as $$
  select p.user_id, count(*)::int, min(p.created_at)
    from public.portfolio_photos p
   where p.exif_cleared_at is null
   group by p.user_id;
$$;
revoke all on function public.photos_without_exif_clear() from public, anon, authenticated;
-- ★毎日の 見張りから 呼ぶ。★0件でないときは ★消し忘れが あります

-- ★肖像の 問い（裁定145）: ★答えは 記録しません → ★列を 作りません

-- 確かめ（試しの環境で・★なりきって）
-- 20枚まで／21枚目 → TOO_MANY_PHOTOS
-- ★exif_cleared_at が null の 写真 → ★他人からは 見えない
-- ★立てたあと → 公開の 範囲に 従って 見える
-- 他人が 立てようとする → NOT_YOURS
-- ★「肖像の 問いの 答え」を しまう列は ★ありません
