-- 20260925_94 ホームページの 型 18種（★坂本さんの 決定・2026-09-25）
-- ★採る型: t1〜t15 ＋ t49〜t51
-- ★★追加の お支払いが 要る もの: ★t4・t6・t49・t50・t51
-- ★★2026-09-25: ★列の 名前は ★web_type です（★template では ありません）
--   ★紙の 型は ★paper_type（★別の 列）
-- ★82・87 のあと

create table if not exists public.page_types (
  type_key   text primary key,               -- t1 … t51
  label      text not null,                  -- 舞台の夜／楽譜 …
  group_name text,                           -- 声・舞台／器楽・指揮／高級
  paid       boolean not null default false, -- ★★追加の お支払いが 要るか
  sort_order integer not null default 0,
  active     boolean not null default true   -- ★採らない型は false（★消しません）
);
alter table public.page_types enable row level security;
revoke all on public.page_types from anon, authenticated;
grant select on public.page_types to authenticated;
drop policy if exists page_types_read on public.page_types;
create policy page_types_read on public.page_types for select to authenticated using (true);
-- ★型の 表です。★誰の ものでも ありません（★値段表と 同じ）

-- ★★2026-09-26: ★t1〜t3 の 見本は ★あります（★坂本さんの ご指摘で 見つけました）
--   ★★data-t の 名前が ★t1・t2・t3 では ありません:
--     ★t1 ＝ gA:stage（舞台の夜）
--     ★t2 ＝ gA:score（楽譜）
--     ★t3 ＝ gA:studio（稽古場）
--   ★★t4 以降は gB:t4 の ように ★番号が 入っています
--   → ★★私も Code も「t1」で 探して 見つけられません でした
--   ★ファイル: Woolsong_ホームページ15型_t14-15作り直し_2026-09-21.html
--     ★★この 1本に ★15種 すべて 入っています
insert into public.page_types(type_key,label,group_name,paid,sort_order) values
  ('t1','舞台の夜',   null,      false, 1),   -- ★見本の data-t = gA:stage
  ('t2','楽譜',       null,      false, 2),   -- ★gA:score
  ('t3','稽古場',     null,      false, 3),   -- ★gA:studio
  ('t4','大劇場',     null,      true , 4),
  ('t5','エージェント', null,      false, 5),
  ('t6','ギャラリー',  null,      true , 6),
  ('t7','プログラム冊子',null,     false, 7),
  ('t8','新聞',       null,      false, 8),
  ('t9','教室',       null,      false, 9),
  ('t10','ミニマル',   null,      false,10),
  ('t11','ボイス',     '声・舞台', false,11),
  ('t12','収録',       '声・舞台', false,12),
  ('t13','宣材',       '声・舞台', false,13),
  ('t14','器楽',       '器楽・指揮',false,14),
  ('t15','指揮・作曲', '器楽・指揮',false,15),
  ('t49','Maison',    '高級',    true ,49),
  ('t50','Atelier',   '高級',    true ,50),
  ('t51','Salon',     '高級',    true ,51)
on conflict (type_key) do update
  set label=excluded.label, group_name=excluded.group_name,
      paid=excluded.paid, sort_order=excluded.sort_order, active=true;

-- ★★使える型を 返す（★画面が 読む）
-- ★★2026-09-26（Code の 指摘）: ★drop が 要ります
--   ★sql/95 で ★price_yen を 返す 形に 変えます
--   ★★create or replace は ★戻り値の 形を 変えられません（42P13）
--   → ★★先に 落とします。★★94 を 2度 当てても 通ります
drop function if exists public.my_page_types();
create function public.my_page_types()
returns table(type_key text, label text, group_name text, paid boolean, owned boolean)
language sql stable security definer set search_path to 'public' as $$
  select t.type_key, t.label, t.group_name, t.paid,
         (not t.paid)                                    -- ★無料の 型は はじめから 使えます
         or exists (select 1 from public.page_types_owned o
                     where o.user_id = auth.uid() and o.type_key = t.type_key)
    from public.page_types t
   where t.active
   order by t.sort_order;
$$;
revoke all on function public.my_page_types() from public, anon;
grant execute on function public.my_page_types() to authenticated;

-- ★★お支払いの 要る 型を 選ぼうとした ときに 止める
-- guard-ok: ★掃除・退会・親の 削除では 詰まりません
--   ★update of template だけに かかる 引き金 です（★insert と 型を 変えた とき だけ）
--   ★★退会（delete）・ほかの 列の 更新では ★動きません
create or replace function public.assert_type_allowed()
returns trigger language plpgsql security definer set search_path to 'public' as $$
declare v_paid boolean;
begin
  -- ★★掃除・移行の ときは 通します（★詰まらせない）
  if current_setting('app.bypass_guards', true) = 'on' then return new; end if;
  if new.web_type is null then return new; end if;
  if TG_OP = 'UPDATE' and new.web_type is not distinct from old.web_type then return new; end if;
  select paid into v_paid from public.page_types where type_key = new.web_type;
  if coalesce(v_paid,false)
     and not exists (select 1 from public.page_types_owned o
                      where o.user_id = new.user_id and o.type_key = new.web_type)
  then raise exception 'TYPE_NOT_OWNED: この 型は、お手元に ありません'; end if;
  return new;
end $$;
drop trigger if exists trg_portfolios_type on public.portfolios;
create trigger trg_portfolios_type before insert or update of web_type on public.portfolios
  for each row execute function public.assert_type_allowed();

-- ★★手に入れた型は ★取り上げません（裁定146）
--   ★page_types_owned は ★消しません。★解約後も 残ります
--   ★active を false に しても、★すでに お持ちの方は 使えます

-- 確かめ（試しの環境で・★なりきって）
-- ★無料の 型（t1）→ そのまま 使える
-- ★★お支払いの 要る 型（t4）→ ★持っていなければ TYPE_NOT_OWNED
-- ★持っていれば 使える
-- ★my_page_types() → 18行・★paid と owned が 返る
