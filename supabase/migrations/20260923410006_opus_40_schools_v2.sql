-- 20260923_40 流派（能・狂言・歌舞伎・日本舞踊ほか）
-- ★坂本さんの指摘（2026-09-23）: 日本の古典を入れたが、流派で分けていなかった
-- なぜ要るか（洋物と違うところ）:
--   ① 同じ曲名でも ★流派で曲名の表記・場面の切り方・小書（特別な演出）が違う
--   ② ★1つの公演に、複数の流派が同時に関わる
--      例: シテ方＝観世流／ワキ方＝高安流／大鼓＝葛野流／狂言方＝大蔵流 が同じ舞台に乗る
--      → ★流派は「作品」だけでなく「その人」に付く。香盤表・番組に出る
--   ③ 歌舞伎は「家の芸」「型」（音羽屋型・成田屋型 など）で 演出が変わる
-- ★26・27・12 のあと

-- ① 作品の側（どの流派の伝承で書いたか）
alter table public.works add column if not exists school text;        -- 観世流／大蔵流／市川宗家 ほか
alter table public.works add column if not exists variant text;       -- 小書・型（道成寺「赤頭」／音羽屋型 ほか）

-- ② 人の側（★こちらが香盤表に出る）
alter table public.koen_members add column if not exists school text; -- その人の流派
alter table public.koen_members add column if not exists school_role text;
-- school_role の例: 'シテ方','ワキ方','狂言方','笛方','小鼓方','大鼓方','太鼓方','地謡','後見','人形遣い','太夫','三味線'

-- ③ 流派の一覧（画面の選択肢。★台帳に持つと綴り違いが起きない）
create table if not exists public.art_schools (
  id         text primary key,          -- 'noh-kanze' ほか
  genre      text not null check (genre in ('noh','kyogen','kabuki','bunraku','nihon-buyo','gagaku','other')),
  role_kind  text,                      -- どの役の流派か（シテ方・ワキ方・囃子方 ほか）
  name       text not null,             -- 観世流
  note       text,
  sort_order integer not null default 0
);
alter table public.art_schools enable row level security;
revoke all on public.art_schools from anon, authenticated;
grant select on public.art_schools to authenticated;
drop policy if exists art_schools_read on public.art_schools;
create policy art_schools_read on public.art_schools for select to authenticated using (true);

insert into public.art_schools(id, genre, role_kind, name, sort_order) values
 -- 能：シテ方
 ('noh-kanze','noh','シテ方','観世流',10),
 ('noh-hosho','noh','シテ方','宝生流',11),
 ('noh-konparu','noh','シテ方','金春流',12),
 ('noh-kongo','noh','シテ方','金剛流',13),
 ('noh-kita','noh','シテ方','喜多流',14),
 -- 能：ワキ方
 ('noh-waki-takayasu','noh','ワキ方','高安流',20),
 ('noh-waki-fukuo','noh','ワキ方','福王流',21),
 ('noh-waki-shimogakari','noh','ワキ方','下掛宝生流',22),
 -- 能：囃子方
 ('noh-fue-issou','noh','笛方','一噌流',30),
 ('noh-fue-morita','noh','笛方','森田流',31),
 ('noh-fue-fujita','noh','笛方','藤田流',32),
 ('noh-kotsuzumi-ko','noh','小鼓方','幸流',40),
 ('noh-kotsuzumi-kosei','noh','小鼓方','幸清流',41),
 ('noh-kotsuzumi-okura','noh','小鼓方','大倉流',42),
 ('noh-kotsuzumi-kanze','noh','小鼓方','観世流',43),
 ('noh-otsuzumi-kadono','noh','大鼓方','葛野流',50),
 ('noh-otsuzumi-takayasu','noh','大鼓方','高安流',51),
 ('noh-otsuzumi-ishii','noh','大鼓方','石井流',52),
 ('noh-otsuzumi-okura','noh','大鼓方','大倉流',53),
 ('noh-otsuzumi-kanze','noh','大鼓方','観世流',54),
 ('noh-taiko-kanze','noh','太鼓方','観世流',60),
 ('noh-taiko-konparu','noh','太鼓方','金春流',61),
 -- 狂言
 ('kyogen-okura','kyogen','狂言方','大蔵流',70),
 ('kyogen-izumi','kyogen','狂言方','和泉流',71),
 -- 歌舞伎（家の芸・屋号）
 ('kabuki-naritaya','kabuki',null,'成田屋（市川宗家）',80),
 ('kabuki-otowaya','kabuki',null,'音羽屋',81),
 ('kabuki-takashimaya','kabuki',null,'高島屋',82),
 ('kabuki-nakamuraya','kabuki',null,'中村屋',83),
 -- 文楽
 ('bunraku-gidayu','bunraku','太夫','義太夫節',90),
 -- 日本舞踊
 ('buyo-hanayagi','nihon-buyo',null,'花柳流',100),
 ('buyo-fujima','nihon-buyo',null,'藤間流',101),
 ('buyo-wakayagi','nihon-buyo',null,'若柳流',102),
 ('buyo-nishikawa','nihon-buyo',null,'西川流',103),
 ('buyo-bando','nihon-buyo',null,'坂東流',104)
on conflict (id) do update set name=excluded.name, role_kind=excluded.role_kind, sort_order=excluded.sort_order;

-- ④ 番組（香盤表）に流派を出す
create or replace function public.koen_members_with_school(p_koen uuid)
returns table(member_id uuid, name_at text, part text, school_role text, school text)
language sql stable security definer set search_path to 'public' as $$
  select m.id, m.name_at, m.part, m.school_role, m.school
    from public.koen_members m
   where m.koen_id = p_koen and m.left_at is null and public.koen_can_see(p_koen)
   order by m.school_role nulls last, m.name_at;
$$;
revoke all on function public.koen_members_with_school(uuid) from public, anon;
grant execute on function public.koen_members_with_school(uuid) to authenticated;

-- 確かめ（試しの環境で）
-- 1つの公演に「シテ方＝観世流」「ワキ方＝高安流」「大鼓＝葛野流」「狂言方＝大蔵流」を入れられる
-- 流派を入れない公演（洋物）は、いままでどおり動く（列は任意）
-- art_schools: 画面から読める／書けない（運営だけ）
-- ★同じ曲名で流派が違う作品を2つ入れられる（works.school が違えば別の行）
--   ただし source + source_id は一意なので、★source_id に流派を含める（例 'noh-dojoji-kanze'）
