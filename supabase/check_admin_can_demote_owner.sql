-- ============================================================================
-- ★責任者（admin）が、オーナーの役割を変えられるか（2026-09-02）
--
--   ★これは調べるだけのファイルです。最後に rollback します。
--     ポリシーは1つも作りません。行も1つも残しません。
--
--   ★なぜ実地で確かめるのか
--     画面の側は、坂本さんの報告どおりでした（下の「分かっていること」）。
--     ですが画面を直しても、★要求を直接投げれば同じことができます。
--     止まるかどうかを決めるのは RLS だけです。
--     ★memberships のポリシーは、まだ一度も見ていません。
--       リポジトリにあるのは名前への言及だけで、本文は手で当てられています
--       （supabase/migration_org_insert_policies.sql:82 が
--         「既存の memberships_all_owner_admin は残します」と書いています）。
--     lessons と entries も、同じく手で当てられたものが原因でした。
--
--   ★分かっていること（コードを読んで確かめた範囲）
--     ・役割の選択欄は★全員の行に出ます（VocalTracker.jsx:13301）。
--       見ている人が誰かを見ていません。オーナーの行にも出ます。
--     ・handleChangeRole（9937）が見ているのは1つだけです。
--         「オーナーが1人だけ、かつ その人を降格しようとしている」なら止める
--       ★これは「最後のオーナーを消さない」ための番人であって、
--         「誰が変えてよいか」の番人ではありません。
--     ・つまり、オーナーが2人以上いる教室では、責任者が
--       ★片方のオーナーを降格できます（画面から）。
--     ・さらに、責任者が★自分の行を owner に変えれば、オーナーは2人になります。
--       そのあと元のオーナーを降格できます。★2手で乗っ取れます。
--     ・これは全部★画面側の話です。本当の答えは下のテストです。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① まず、ポリシーの本文を見ます（★これを報告してください）
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", permissive as "種別",
       roles as "対象", qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'memberships'
 order by cmd, policyname;

-- is_org_owner_or_admin の中身
select pg_get_functiondef(p.oid) as "is_org_owner_or_admin の定義"
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
 where n.nspname = 'public' and p.proname = 'is_org_owner_or_admin';

-- ---------------------------------------------------------------------------
-- ② 使う値を確かめます
--     ★<教室の uuid> を、オーナーと責任者が両方いる教室に置き換えてください。
-- ---------------------------------------------------------------------------
select m.id as "membership の id", m.user_id as "誰", m.role as "役割"
  from public.memberships m
 where m.org_id = '<教室の uuid>'
 order by m.role;

-- ---------------------------------------------------------------------------
-- ③ ★本番のテスト（責任者になりすまして、オーナーを降格してみる）
--
--   ★claims を先、role をあとに。逆にすると auth.uid() が null になり、
--     「止まった」ように見えて実は別の理由、という誤診になります。
--     今日1回やりました。
--
--   ★service_role では意味がありません。RLS を素通りするためです。
-- ---------------------------------------------------------------------------
begin;

select set_config('request.jwt.claims',
  '{"sub":"<責任者(admin)の uuid>","role":"authenticated"}', true);
set local role authenticated;

select auth.uid() as "★責任者になっているか（責任者の uuid と一致すること）";

-- ③-1 オーナーの行が、そもそも見えるか
select count(*) as "責任者から見えるオーナーの行数"
  from public.memberships
 where org_id = '<教室の uuid>' and role = 'owner';

-- ③-2 ★オーナーを「講師」に降格してみる
--      ★returning が1行返ったら、★通ってしまっています（重大）。
--        0行なら、RLS が止めています（正しい状態）。
--        42501 が出ても、止まっているということです。
update public.memberships
   set role = 'teacher'
 where org_id = '<教室の uuid>' and role = 'owner'
returning id as "★降格できてしまった行（0行であること）", user_id, role;

-- ③-3 ★自分を owner に格上げできるか
update public.memberships
   set role = 'owner'
 where org_id = '<教室の uuid>' and user_id = auth.uid()
returning id as "★自分を owner にできてしまった行（0行であること）", role;

-- ③-4 ★オーナーの行を消せるか
delete from public.memberships
 where org_id = '<教室の uuid>' and role = 'owner'
returning id as "★オーナーを消せてしまった行（0行であること）";

rollback;   -- ★必ず rollback。何も残しません。

-- ---------------------------------------------------------------------------
-- ④ 読み方
--
--   ③-2・③-3・③-4 が★すべて0行なら、RLS は止めています。
--     そのときは画面側だけの問題なので、選択欄の出し方を直せば済みます。
--
--   ★どれか1つでも行が返ったら、権限の昇格が実在します。
--     その場合は、ポリシーを
--       「owner の行を変えられるのは owner だけ」
--       「自分の役割は自分で上げられない」
--     の2つに分ける必要があります。①の本文を見てから書きます。
--     ★本文を見ずにポリシーを書き換えないでください。
--       いま何があるのか分からないまま drop すると、教室が動かなくなります。
-- ---------------------------------------------------------------------------
