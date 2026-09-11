-- ============================================================================
-- 修正 No.002 ★出席は、★出席の できことで 守る（★㋑）
--
--   ★お決め（★坂本さん・2026-09-11）
--     ★★㋑で 進める ── ★lessons の UPDATE に、★止める 決まりを 1本 足す。
--     ★★B14（★あとから 日程を 直す）は B13 の 条件待ちなので、
--       ★★いま「列を 見分けられない」ことと ぶつかる 働きは ありません。
--
--   ★何が 起きて いたか（★記録 No.002）
--     ★★出席（lessons.attendance）に、★見張りが 1つも ありません。
--       ★① 行の 決まり　lessons 9本、★has_can を 呼ぶ ものは 0本
--       ★② 列の 許し　　attendance と scheduled_at が 同じ
--       ★③ アプリ　　　 shukketsu という 字が components/ にも app/ にも 無い
--     ★★**10役職 とも 素通り** です。★3役職 では ありません。
--       ★★総当たりで「ちがう」が 3つ だけ だったのは、
--         ★期待表で 書けない と 決まって いる 役職が 3つ しか 無い ため。
--
--   ★★この SQL で 分かる こと・分からない こと
--     ★分かる　 ★決まりが `shukketsu` を 見る ように なった こと
--     ★分からない ★画面で どう 見えるか。★実機で ご確認ください。
--
--   ★★1つずつ 流して ください。★③の 前に、★必ず ②を 見て ください。
-- ============================================================================


-- ────────────────────────────────────────────────────────────────
-- ① ★いま どうなって いるか（★読むだけ）
-- ────────────────────────────────────────────────────────────────
select policyname as "決まりの 名前", permissive as "または/かつ", cmd as "何に",
       coalesce(qual, '（無し）') as "読める 条件",
       coalesce(with_check, '（無し）') as "書ける 条件"
from pg_policies
where schemaname = 'public' and tablename = 'lessons'
order by permissive desc, cmd, policyname;

-- ★★期待（★直す 前）── 9本。★どれにも has_can が 出て こない。


-- ────────────────────────────────────────────────────────────────
-- ② ★★誰を 締め出す ことに なるか（★読むだけ・★いちばん 大事）
--
--    ★★いま 出席を 付けて いる 方の うち、
--      ★`shukketsu` を 持つ 役職を お持ちで ない 方が いれば、
--      ★★その方は 明日から 付けられなく なります。
--
--    ★★§7-3 の ⑤ と 同じ 確かめ です。
--    ★★1人でも 出たら、★③を 流さないで ください。★お知らせ ください。
-- ────────────────────────────────────────────────────────────────
select o.name                                   as "学校",
       coalesce(q.name, '（役職 なし）')          as "役職",
       m.role                                   as "名前の ちから",
       count(*)                                 as "付けた 出席の 数",
       coalesce((q.perms ->> 'shukketsu')::boolean, false) as "出席の できこと"
from public.lessons l
join public.memberships m on m.user_id = l.attendance_by and m.org_id = l.org_id
join public.organizations o on o.id = l.org_id
left join public.org_posts q on q.id = m.post_id
where l.attendance is not null
  and l.attendance_by is not null
  and o.name not like '★50通り-%'
group by o.name, q.name, m.role, q.perms
order by (coalesce((q.perms ->> 'shukketsu')::boolean, false)) asc, o.name;

-- ★★「出席の できこと」が false の 行が 1つでも あれば、
--   ★★その 役職の 方は 締め出されます。★③を 流さないで ください。

-- ★★1対1の レッスン（org_id が 空）は、★上に 出て きません。
--   ★★下で 数えます。★こちらは この 決まりの 外です
--     （★決まりは org_id を 見ます。★空の 行には かかりません）。
select count(*) as "教室に 属さない レッスンで 付けた 出席"
from public.lessons
where attendance is not null and org_id is null;


-- ────────────────────────────────────────────────────────────────
-- ③ ★止める 決まりを 1本 足す
--
--    ★★`as restrictive` です。★**かつ** で つながります。
--      ★★いまの 9本は そのまま。★その うえに「出席の できことも 要る」を 重ねます。
--    ★★`org_id` が 空の 行（★1対1の レッスン）は、★これまでどおりに します。
--      ★★学校の 話では ない ためです。
-- ────────────────────────────────────────────────────────────────
drop policy if exists "lessons_update_needs_can_shukketsu" on public.lessons;

create policy "lessons_update_needs_can_shukketsu"
  on public.lessons
  as restrictive
  for update
  to authenticated
  using (org_id is null or public.has_can(org_id, 'shukketsu'))
  with check (org_id is null or public.has_can(org_id, 'shukketsu'));


-- ────────────────────────────────────────────────────────────────
-- ④ ★確かめ（★読むだけ）── ★No.002 の 決め手は これです
-- ────────────────────────────────────────────────────────────────
select policyname as "決まりの 名前", permissive as "または/かつ", cmd as "何に"
from pg_policies
where schemaname = 'public' and tablename = 'lessons'
  and (coalesce(qual, '') like '%has_can%'
    or coalesce(with_check, '') like '%has_can%');

-- ★★期待（★直した あと）── 1行 以上。
--   ★`lessons_update_needs_can_shukketsu`／`かつ（RESTRICTIVE）`／`UPDATE`


-- ────────────────────────────────────────────────────────────────
-- ⑤ ★`shukketsu` が 中に 入って いる ことを 見る（★読むだけ）
-- ────────────────────────────────────────────────────────────────
select policyname as "決まりの 名前",
       coalesce(qual, '') as "読める 条件",
       coalesce(with_check, '') as "書ける 条件"
from pg_policies
where schemaname = 'public' and tablename = 'lessons'
  and (coalesce(qual, '') like '%shukketsu%'
    or coalesce(with_check, '') like '%shukketsu%');

-- ★★期待 ── 1行。★条件の 中に 'shukketsu' の 字が 見える こと。


-- ────────────────────────────────────────────────────────────────
-- ⑥ ★戻し方（★もし 何か あった とき）
-- ────────────────────────────────────────────────────────────────
-- drop policy if exists "lessons_update_needs_can_shukketsu" on public.lessons;
