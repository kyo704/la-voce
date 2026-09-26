-- 20260925_86 下見リンク（裁定198 §4 で「よい」と した もの）
-- Fable の 試作に「下見リンク」が あります。★台帳に ありませんでした
-- ★7日で 切れる・★1本だけ・★公開では ない
-- ★82 のあと

alter table public.portfolios add column if not exists preview_token text;
alter table public.portfolios add column if not exists preview_expires_at timestamptz;
create unique index if not exists portfolios_preview_token_idx
  on public.portfolios(preview_token) where preview_token is not null;

create or replace function public.make_preview_link()
returns text language plpgsql security definer set search_path to 'public' as $$
declare v_token text;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  v_token := encode(extensions.gen_random_bytes(16),'hex');
  update public.portfolios
     set preview_token = v_token, preview_expires_at = now() + interval '7 days'
   where user_id = auth.uid();
  if not found then raise exception 'NO_PORTFOLIO'; end if;
  return v_token;   -- ★1本だけ（★作り直すと 前のは 使えなくなる）
end $$;
revoke all on function public.make_preview_link() from public, anon;
grant execute on function public.make_preview_link() to authenticated;

create or replace function public.drop_preview_link()
returns void language plpgsql security definer set search_path to 'public' as $$
begin
  update public.portfolios set preview_token = null, preview_expires_at = null
   where user_id = auth.uid();
end $$;
revoke all on function public.drop_preview_link() from public, anon;
grant execute on function public.drop_preview_link() to authenticated;

-- ★下見は ★公開では ありません:
--   ★visibility は 変えません（★self のまま）
--   ★検索にも 出しません（★noindex は true のまま）
--   ★7日で 切れます（★期限の あとは 読めない）
--   ★読む道は ★サーバ側（★token で 引く）。★この表を 直に 開かせません

-- 確かめ（試しの環境で）
-- 作る → token が 入る／期限が 7日後
-- もう一度 作る → ★前の token は 使えない（★1本だけ）
-- 外す → null に なる
-- ★visibility は self のまま／★noindex は true のまま
