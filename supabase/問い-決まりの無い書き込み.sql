-- ===========================================================================
-- ★問い ── ★「権利は ある のに、決まりが 無い 表」を 見つける
--
--   ★★2026-09-16、★教室を やめる が **黙って** 失敗しました。
--     ★★`authenticated` に 表の UPDATE の 権利が あり、
--       ★けれど それに 合う RLS の 決まりが ありませんでした。
--     ★★PostgREST は 誤りを 返しません。★0行 直した、と 返します。
--     ★★呼ぶ 側は「できた」と 読みます。
--
--   ★★同じ 形が ほかにも 無いか、★台帳に お尋ねします。
--
--   ★★★読むだけ です。★1文字も 書きません。
--     ★★BEGIN も ROLLBACK も 使って いません（★2026-09-15 の 一件の ため）。
--   ★★そのまま 貼って、★結果の 表を そのまま お戻しください。
-- ===========================================================================

-- ---------------------------------------------------------------------------
-- 【一】★権利と 決まりの 突き合わせ ── ★これが 本体 です
--
--   ★★左が「できる こと」、★右が「その 決まりが あるか」。
--   ★★`決まり` が 0 の 行が、★黙って 0行に なる ところ です。
-- ---------------------------------------------------------------------------
with 表 as (
  select c.oid, c.relname, c.relrowsecurity as 決まりを使うか
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind = 'r'
),
権利 as (
  -- ★★★`polcmd` は **記号** です ── r=SELECT / a=INSERT / w=UPDATE / d=DELETE / *=ALL。
  --   ★★はじめ 私は `left('UPDATE',1)` = 'U' と 突き合わせて いました。
  --     ★★どれにも 当たりません。★だから「決まりが 無い」と 出ます。
  --     ★★entries・notes・lessons・profiles まで 誤って 並びました。
  --   ★★記号を 先に 決めて から、★突き合わせます。
  select t.oid, t.relname, v.動き, v.記号
  from 表 t
  cross join (values
    ('SELECT', 'r'::"char"),
    ('INSERT', 'a'::"char"),
    ('UPDATE', 'w'::"char"),
    ('DELETE', 'd'::"char")
  ) as v(動き, 記号)
  where has_table_privilege('authenticated', t.oid, v.動き)
),
決まり as (
  select c.relname, p.polcmd,
         count(*) as 数
  from pg_policy p
  join pg_class c on c.oid = p.polrelid
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public'
  group by c.relname, p.polcmd
)
select k.relname            as 表,
       k.動き,
       t.決まりを使うか,
       coalesce(d.数, 0)    as 決まり,
       case
         when not t.決まりを使うか then '★★決まりを 使って いません（★素通し）'
         when coalesce(d.数, 0) = 0 then '★★権利は ある／決まりが 無い ── ★黙って 0行'
         else 'ok'
       end as 見立て
from 権利 k
join 表 t on t.oid = k.oid
left join 決まり d
       on d.relname = k.relname
      -- ★★`*`（ALL）は どの 動きにも 当たります。★ここは そのまま です。
      and (d.polcmd = k.記号 or d.polcmd = '*'::"char")
order by
  case
    when not t.決まりを使うか then 0
    when coalesce(d.数, 0) = 0 then 1
    else 2
  end,
  k.relname,
  k.動き;

-- ---------------------------------------------------------------------------
-- 【二】★在籍（enrollments）だけ、★念のため もう一度
--
--   ★★UPDATE の 決まりを 足して いない ことの 確かめ です。
-- ---------------------------------------------------------------------------
select polname as 決まりの名, polcmd as 動き, polpermissive as 許す形
from pg_policy p
join pg_class c on c.oid = p.polrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'enrollments'
order by polcmd, polname;

-- ---------------------------------------------------------------------------
-- 【三】★★Q2 ── ★同じ方が 同じ教室に 戻れるか
--
--   ★★画面の 道は `on conflict (org_id, student_id)` で 書いて います。
--     ★★その 束ねが **本当に ある か**を、★台帳に 尋ねます。
--     ★★無ければ、★入り直しの とき 行が 2本に なります。
-- ---------------------------------------------------------------------------
select con.conname as 束ねの名,
       con.contype as 種類,
       pg_get_constraintdef(con.oid) as 中身
from pg_constraint con
join pg_class c on c.oid = con.conrelid
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public' and c.relname = 'enrollments'
order by con.contype, con.conname;

-- ---------------------------------------------------------------------------
-- 【四】★★Q3 ── ★やめた方が、★いま 何人 いるか
--
--   ★★数だけ です。★お名前も、★どなたかも 出しません。
-- ---------------------------------------------------------------------------
select status, count(*) as 人数, count(left_at) as やめた日あり
from public.enrollments
group by status
order by status;

-- ---------------------------------------------------------------------------
-- 【五】★★やめた あとも 受け持ちが 開いた まま の 行
--
--   ★★ここが いちばん 知りたい ところ です。
--     ★★`org_messages` の 決まりは `assignments`（ended_at is null）で 見ます。
--     ★★在籍を やめても 受け持ちが 開いた ままだ と、
--       ★★やめた 方に、★先生からの 連絡が **届き 続けます**。
--     ★★見本は「この教室から、あなたが 見えなくなります」と 書いて います。
--   ★★0 なら、★いまは 誰も その 目に 遭って いません。
--     ★★1以上 なら、★お直しが 要ります。
-- ---------------------------------------------------------------------------
select count(*) as やめたのに受け持ちが開いている数
from public.assignments a
join public.enrollments e
  on e.org_id = a.org_id and e.student_id = a.student_id
where e.status = 'left' and a.ended_at is null;
