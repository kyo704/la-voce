-- ============================================================================
-- ★オーナーの居ない教室に、オーナーを戻す（2026-09-02）
--
--   ★何が起きているか
--     ensureOwnOrg は、こういう順で動きます。
--       ① 自分がオーナーの membership を探す
--       ② 無ければ、自分が created_by の organizations を探す（作りかけ）
--       ③ それも無ければ、organizations を作る
--       ④ そのあと memberships に owner として自分を入れる
--     ★④ だけが失敗すると、教室はあるのにオーナーが居ない行が残ります。
--     次に押したとき ② がその教室を拾い、また ④ で失敗します。
--     画面には「教室の準備に失敗しました」と出て、★永久に先へ進めません。
--
--   ★確かめられていること・いないこと
--     ・確かめた：0b186c11-4e6f-4b86-bf1e-be8fe55818ce（マイ教室）の
--       created_by は +t6 である（坂本さんが UUID で確認）
--     ・★確かめていない：その教室に memberships が本当に0行かどうか
--     ・★確かめていない：④ が 403 になる理由そのもの
--       （memberships の INSERT ポリシーを、まだ一度も見ていません）
--
--   ★だから、このファイルは「数えてから直す」形にしてあります。
--     ②で0件なら、直すものはありません。前提のほうが間違っていたことになります。
--
--   ★これはデータの手当てであって、原因の修理ではありません。
--     service_role は RLS を素通りするので、この INSERT は
--     ★ポリシーが壊れていても通ります。次に同じ道を通る人は、また詰まります。
--     ⑤のポリシー一覧を、必ず一緒に持ち帰ってください。
--
--   ★何度実行しても同じ結果になります（既にオーナーが居る教室には触れません）。
--   ★記録（entries）には一切触れません。1行も消しません。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① まず、数えます（★直す前に、これを報告してください）
-- ---------------------------------------------------------------------------
select
  (select count(*) from public.organizations) as "教室の総数",
  (select count(*) from public.organizations o
    where not exists (select 1 from public.memberships m where m.org_id = o.id))
    as "★誰も居ない教室",
  (select count(*) from public.organizations o
    where not exists (select 1 from public.memberships m
                       where m.org_id = o.id and m.role = 'owner'))
    as "★オーナーが居ない教室",
  (select count(*) from public.organizations o
    where o.created_by is null
      and not exists (select 1 from public.memberships m where m.org_id = o.id))
    as "★誰も居ない＋作った人も不明（直せない）";

-- ---------------------------------------------------------------------------
-- ②-1 直せるもの（作った人が分かっていて、オーナーが居ない）
-- ---------------------------------------------------------------------------
select o.id as "教室", o.name as "名前", o.created_by as "作った人",
       o.created_at as "作られた日時",
       (select count(*) from public.memberships m where m.org_id = o.id) as "いま居る人数"
  from public.organizations o
 where o.created_by is not null
   and not exists (select 1 from public.memberships m
                    where m.org_id = o.id and m.role = 'owner')
 order by o.created_at;

-- ②-2 直せないもの（作った人が分からない）
--     ★ここに行が出たら、勝手に誰かをオーナーにしないでください。
--       誰のものか分からない教室に、持ち主を作ってはいけません。
select o.id as "★作った人が不明な教室", o.name as "名前", o.created_at as "作られた日時"
  from public.organizations o
 where o.created_by is null
   and not exists (select 1 from public.memberships m
                    where m.org_id = o.id and m.role = 'owner')
 order by o.created_at;

-- ---------------------------------------------------------------------------
-- ③ 戻す
--
--   ★条件は3つとも必要です。
--     ・created_by が分かっている（誰のものか分かる）
--     ・その教室に owner が1人も居ない（居るなら触らない）
--     ・その人の membership がその教室にまだ無い（二重に入れない）
--   ★on conflict は書きません。一意制約の形が分からないためです。
--     代わりに not exists で防ぎます。
-- ---------------------------------------------------------------------------
insert into public.memberships (org_id, user_id, role)
select o.id, o.created_by, 'owner'
  from public.organizations o
 where o.created_by is not null
   and not exists (select 1 from public.memberships m
                    where m.org_id = o.id and m.role = 'owner')
   and not exists (select 1 from public.memberships m
                    where m.org_id = o.id and m.user_id = o.created_by);

-- ---------------------------------------------------------------------------
-- ④ 直ったことを確かめる（★0 になること）
-- ---------------------------------------------------------------------------
select count(*) as "★まだオーナーが居ない教室（作った人が分かっているもの・0であること）"
  from public.organizations o
 where o.created_by is not null
   and not exists (select 1 from public.memberships m
                    where m.org_id = o.id and m.role = 'owner');

-- +t6 の教室を名指しで確認
select m.role as "役割", m.user_id as "誰", m.created_at as "いつ入ったか"
  from public.memberships m
 where m.org_id = '0b186c11-4e6f-4b86-bf1e-be8fe55818ce';

-- ---------------------------------------------------------------------------
-- ⑤ ★原因のほう（これを持ち帰ってください）
--
--   ★データを直しても、④ が 403 になる理由は分かっていません。
--     memberships の INSERT ポリシーを、まだ一度も見ていないためです。
--     lessons と entries でも、手で当てられたポリシーが原因でした。
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", permissive as "種別",
       qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'memberships'
 order by cmd, policyname;

-- 招待の表も、同じく見えていません（今日サーバ側に移した経路が触ります）
select policyname as "ポリシー", cmd as "操作",
       qual as "USING", with_check as "WITH CHECK"
  from pg_policies
 where schemaname = 'public' and tablename = 'org_invitations'
 order by cmd, policyname;
