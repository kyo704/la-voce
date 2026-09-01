-- ============================================================================
-- ★ポリシーが本当に効くかを、その場で確かめる（読むだけ・最後に巻き戻します）
--
--   Supabase の SQL エディタは postgres ロールで動くので、RLS を迂回します。
--   ★それでは試験になりません。authenticated になりすまして試します。
--
--   ★全体を1つのトランザクションにし、最後に rollback します。
--     何も残りません。
-- ============================================================================

begin;

-- 先生役の UUID を取る
create temporary table _t as
select id from auth.users where email = 'kyosakamoto0703+t1@gmail.com';

-- ★ログインしている状態を作る
--   ★順序が大事です。claims を先に、role をあとに。
--     逆にすると auth.uid() が null になり、正しいポリシーでも 42501 になります。
--     （2026-09-01、この順序を逆に書いて、ポリシーのせいだと誤診しました）
--   ★auth.users を読むのは role を切り替える前に済ませます。
--     authenticated は auth.users を読めません。
select set_config('request.jwt.claims',
       json_build_object('sub', (select id::text from _t), 'role', 'authenticated')::text,
       true);
set local role authenticated;

-- ---------------------------------------------------------------------------
-- ① 自分を作成者として教室を作れるか（★通るはず）
--    ★returning を付けています。アプリも .select() を付けるので、
--      INSERT のポリシーだけでなく★SELECT のポリシーも通る必要があります。
--      ここが 42501 になるなら、SELECT 側が足りていません。
-- ---------------------------------------------------------------------------
insert into public.organizations (name, kind, created_by)
values ('試験用マイ教室', 'solo', (select id from _t))
returning id, name, kind, created_by;

-- ---------------------------------------------------------------------------
-- ② いま作った教室に、自分をオーナーとして入れるか（★通るはず）
-- ---------------------------------------------------------------------------
insert into public.memberships (org_id, user_id, role)
select o.id, (select id from _t), 'owner'
  from public.organizations o
 where o.created_by = (select id from _t)
 order by o.created_at desc limit 1
returning org_id, user_id, role;

-- ---------------------------------------------------------------------------
-- ③ ★他人になりすまして作れないこと（ここで失敗するのが★正しい）
--    エラー 42501 が出れば合格です。
-- ---------------------------------------------------------------------------
-- insert into public.organizations (name, kind, created_by)
-- values ('乗っ取り', 'solo', '00000000-0000-0000-0000-000000000000');

-- ---------------------------------------------------------------------------
-- ④ ★2人目を bootstrap の道から入れられないこと（失敗するのが★正しい）
--    （既存の memberships_all_owner_admin なら通ります。それは正しい動きです）
-- ---------------------------------------------------------------------------

reset role;
rollback;

-- ★rollback したので、①②で作った行は残っていません。
select count(*) as "試験用マイ教室（★0であること）"
  from public.organizations where name = '試験用マイ教室';
