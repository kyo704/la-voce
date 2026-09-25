-- ============================================================================
-- ★写真の 入れもの（★裁定199 ③・坂本さんの お決め 2026-09-25）
--
--   ★★★「署名つき URL 方式で 確定。他人が 直接ファイル URL を 知っていても、
--     ★正規の 手続きを 経ないと 取得できない 仕組みに する」
--
--   ★★だから `public = false` です。★★これが いちばん 大事な 1行 です。
--     ★`true` に すると、★道を 知って いれば 誰でも 取れます。
--     ★★台帳の `portfolio_photos_read`（★印の 無い 写真を 出さない）は
--       ★**行** を 守ります。★ファイルは 守りません。★別の 守り です。
--
--   ★★決まり（RLS）を 1つも 作りません。
--     ★★`storage.objects` は 既定で RLS が 入って います。
--       ★決まりが 無い ＝ ★みなの 鍵でも 運営でもない 鍵でも **触れません**。
--     ★★触るのは 管理の 鍵（service_role）だけ です ──
--       ★`app/api/portfolio-photo/route.js` が 置き、★署名つきの 道を 作ります。
--     ★★★だから 直の URL は 通りません。★署名の 無い 道は 断られます。
--
--   ★★大きさの 上限 …… 8MB。★長い辺 1,200px に して から 送るので 足ります。
--     ★★★端末を 飛ばして 大きい ものを 送られた とき、★ここで 止まります。
--
--   ★受け取る 形 …… jpeg ／ png ／ webp（★`lib/photoExif.js` の `ACCEPT_TYPES`）。
--
--   ★何度 流しても 同じに なります。
-- ============================================================================

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('portfolio-photos', 'portfolio-photos', false, 8388608,
        array['image/jpeg','image/png','image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = 8388608,
      allowed_mime_types = array['image/jpeg','image/png','image/webp'];

-- ★★確かめ ── ★公開に なって いない こと。
do $$
declare v_public boolean;
begin
  select public into v_public from storage.buckets where id = 'portfolio-photos';
  if v_public is null then
    raise exception '★入れものが できて いません';
  end if;
  if v_public then
    raise exception '★入れものが 公開に なって います（★署名つきで ない と 通ります）';
  end if;
  raise notice '★入れもの …… 公開では ありません';
end $$;
