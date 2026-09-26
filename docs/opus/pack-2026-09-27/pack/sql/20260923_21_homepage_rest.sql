-- 20260923_21 ホームページの残り（裁定128・129・146）
-- 型の鍵の縛りは 19 で入れる。ここは「公開する・並べる・日付を持つ」の3つ

-- ① 公開のときの住所（slug）の形。推測されにくく、読める形に
alter table public.portfolios drop constraint if exists portfolios_slug_check;
alter table public.portfolios add constraint portfolios_slug_check check (
  public_slug is null or public_slug ~ '^[a-z0-9][a-z0-9-]{2,39}$');   -- 小文字・数字・ハイフン、3〜40文字
create unique index if not exists portfolios_slug_unique on public.portfolios(public_slug) where public_slug is not null;

-- ② 節に「日付」と「並び」を足す（お知らせ・批評・出演歴を日付で並べるため。裁定128 の kind を使う）
alter table public.portfolio_entries add column if not exists on_date date;     -- その出来事の日
alter table public.portfolio_entries add column if not exists url text;         -- 批評・リンク（外に出す先）
alter table public.portfolio_entries add column if not exists is_hidden boolean not null default false;  -- 下書き（公開ページに出さない）
create index if not exists portfolio_entries_user_kind_idx on public.portfolio_entries(user_id, kind, sort_order);
alter table public.portfolio_entries drop constraint if exists portfolio_entries_url_check;
alter table public.portfolio_entries add constraint portfolio_entries_url_check check (
  url is null or url ~* '^https://');                                            -- http は不可

-- ③ 公開・非公開の切り替え（関数だけ。★公開の前に、出す中身がそろっているかを確かめる）
create or replace function public.publish_portfolio(p_on boolean)
returns text language plpgsql security definer set search_path to 'public' as $$
declare v_p public.portfolios; v_n integer;
begin
  if auth.uid() is null then raise exception 'NOT_AUTHENTICATED'; end if;
  select * into v_p from public.portfolios where user_id = auth.uid();
  if v_p.user_id is null then raise exception 'NO_PORTFOLIO'; end if;

  if not p_on then
    update public.portfolios set visibility = 'self', published_at = null, updated_at = now() where user_id = auth.uid();
    return 'closed';
  end if;

  if v_p.public_slug is null then return 'need_slug'; end if;
  if v_p.web_type is null then return 'need_type'; end if;
  if not exists (select 1 from public.page_types_owned o where o.user_id = auth.uid() and o.type_key = v_p.web_type) then
    return 'need_payment';                      -- 持っていない形では公開しない（裁定146）
  end if;
  select count(*) into v_n from public.portfolio_entries e where e.user_id = auth.uid() and not e.is_hidden;
  if v_n = 0 then return 'need_content'; end if;   -- 中身が無いページを公開しない
  if public.matching_suspended(auth.uid()) then return 'suspended'; end if;

  update public.portfolios set visibility = 'public', published_at = now(), updated_at = now() where user_id = auth.uid();
  return 'published';
end $$;
revoke all on function public.publish_portfolio(boolean) from public, anon;
grant execute on function public.publish_portfolio(boolean) to authenticated;

-- ④ 公開ページの読み出しに、節の日付と並びを載せる（08 の関数を差し替え）
create or replace function public.get_public_portfolio(p_slug text)
returns jsonb language plpgsql stable security definer set search_path to 'public' as $$
declare v_owner uuid; v_viewer uuid := auth.uid();
begin
  select p.user_id into v_owner from public.portfolios p where p.public_slug = p_slug and p.visibility = 'public';
  if v_owner is null then return null; end if;
  if public.matching_suspended(v_owner) then return null; end if;
  if v_viewer is not null and v_viewer <> v_owner and not public.matching_visible(v_viewer, v_owner) then return null; end if;
  return (
    select jsonb_build_object(
      'display_name', p.display_name, 'instrument', p.instrument, 'bio', p.bio, 'regions', p.regions,
      'web_type', p.web_type, 'published_at', p.published_at,
      'entries', coalesce((select jsonb_agg(jsonb_build_object('kind', e.kind, 'title', e.title, 'detail', e.detail,
                                                               'on_date', e.on_date, 'url', e.url)
                                            order by e.kind, e.sort_order, e.on_date desc nulls last)
                             from public.portfolio_entries e where e.user_id = v_owner and not e.is_hidden), '[]'::jsonb),
      'recordings', coalesce((select jsonb_agg(jsonb_build_object('title', r.title, 'url', r.url, 'detail', r.detail)
                                               order by r.sort_order)
                               from public.portfolio_recordings r where r.user_id = v_owner), '[]'::jsonb))
    from public.portfolios p where p.user_id = v_owner);
end $$;
revoke all on function public.get_public_portfolio(text) from public;
grant execute on function public.get_public_portfolio(text) to anon, authenticated;

-- ⑤ 型の鍵の一覧を台帳にも置く（画面と実装で食い違わないように。値は型キーの一覧_2026-09-23.md と同じ）
create table if not exists public.page_type_catalog (
  type_key   text primary key check (type_key ~ '^t[0-9]{2}$'),
  name       text not null,
  note       text,
  fields     text[] not null default '{}',     -- music / voice / stage / teacher
  sort_order integer not null default 0
);
alter table public.page_type_catalog enable row level security;
revoke all on public.page_type_catalog from anon, authenticated;
grant select on public.page_type_catalog to anon, authenticated;     -- 型の一覧は未ログインでも見せてよい（お試し）
drop policy if exists page_type_catalog_read on public.page_type_catalog;
create policy page_type_catalog_read on public.page_type_catalog for select to anon, authenticated using (true);
insert into public.page_type_catalog(type_key, name, note, fields, sort_order) values
 ('t01','舞台の夜','歌手 一般。Woolsong の 既定の 顔','{music}',1),
 ('t02','楽譜','白黒・紙の 質感。歌曲・古楽','{music}',2),
 ('t03','稽古場','木の 色・丸み。教える方','{teacher}',3),
 ('t04','大劇場','全面の 写真・大きな 欧文の 名前','{music}',4),
 ('t05','エージェント','左に 顔と 所属。事務所・海外向け','{music,voice}',5),
 ('t06','ギャラリー','写真が 先。言葉は 少なく','{voice,stage}',6),
 ('t07','プログラム冊子','演奏会の 冊子の 作法','{music}',7),
 ('t08','新聞','大見出し・批評が 主役','{music,stage}',8),
 ('t09','教室','レッスン案内が 先・体験申込','{teacher}',9),
 ('t10','ミニマル','縦書きの 名前・余白','{music,voice,stage}',10),
 ('t11','ボイス','声の サンプルが 最上部','{voice}',11),
 ('t12','収録','持ち役を 作品ごとに','{voice}',12),
 ('t13','宣材','写真が 主役・身長と できること','{stage}',13),
 ('t14','器楽','使っている 楽器の 札・協奏曲／室内楽／リサイタル','{music}',14),
 ('t15','指揮・作曲','作品目録と 指揮した 団体','{music}',15)
on conflict (type_key) do update set name = excluded.name, note = excluded.note, fields = excluded.fields, sort_order = excluded.sort_order;

-- 確かめ（実在の試しの利用者で）
-- slug: 'Abc' → check 違反／'ab' → 違反／'a-b-c' → 通る／同じ slug を2人 → unique 違反
-- publish_portfolio(true): slug が無い→need_slug／形が無い→need_type／持っていない形→need_payment／中身0→need_content／止められている→suspended
-- publish_portfolio(false): いつでも閉じられる（中身は消えない）
-- 公開ページ: 下書き（is_hidden）の節が出ない／http の URL は保存できない
-- page_type_catalog: 未ログインで15行 読める／書けない
