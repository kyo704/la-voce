-- ============================================================================
-- オーナー保護が効いているかを、5つの場面で確かめる（2026-09-02・G4 #14）
--
--   ★すべて rollback します。行は1つも残りません。
--   ★ふつうの利用者のセッションで実行してください。
--     service_role は RLS を素通りするので、確かめになりません。
--
--   ★claims を先、role をあとに。逆にすると auth.uid() が null になり、
--     「止まった」ように見えて実は別の理由、という誤診になります。
--
--   ★先に supabase/migration_protect_owner_role.sql を実行してください。
--     ①〜③が「通ってしまう」なら、移行が入っていないか、
--     RESTRICTIVE になっていない可能性があります（⑥の確認へ）。
--
--   置き換えるもの：
--     <教室>        オーナーと責任者が両方いる教室の uuid
--     <オーナーA>   その教室のオーナーの uuid
--     <責任者>      その教室の admin の uuid
--     <オーナーB>   ③でだけ使う。2人目のオーナーの uuid
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① ★責任者が、自分を owner に格上げする → 通ってはいけない
-- ---------------------------------------------------------------------------
begin;
select set_config('request.jwt.claims',
  '{"sub":"<責任者>","role":"authenticated"}', true);
set local role authenticated;
select auth.uid() as "★責任者になっているか";

update public.memberships set role = 'owner'
 where org_id = '<教室>' and user_id = auth.uid()
returning id as "★格上げできてしまった行（0行であること）", role;
rollback;

-- ---------------------------------------------------------------------------
-- ② ★責任者が、オーナーを降格する → 通ってはいけない
-- ---------------------------------------------------------------------------
begin;
select set_config('request.jwt.claims',
  '{"sub":"<責任者>","role":"authenticated"}', true);
set local role authenticated;

update public.memberships set role = 'teacher'
 where org_id = '<教室>' and role = 'owner'
returning id as "★降格できてしまった行（0行であること）", user_id;
rollback;

-- ---------------------------------------------------------------------------
-- ③ ★共同オーナーAが、共同オーナーBを降格する → 通ってはいけない
--
--   ★Opus が見つけた場面です。①②は「責任者 対 オーナー」でしたが、
--     こちらは「オーナー 対 オーナー」です。
--     is_org_owner_or_admin だけで守ると、ここが空いたままになります。
--
--   ★オーナーが1人しかいない教室では、この試験はできません。
--     その場合は、下の準備で一時的に2人にしてから試し、rollback します。
-- ---------------------------------------------------------------------------
begin;
-- 準備（★オーナーAとして、Bをオーナーにする。rollback するので残りません）
select set_config('request.jwt.claims',
  '{"sub":"<オーナーA>","role":"authenticated"}', true);
set local role authenticated;
update public.memberships set role = 'owner'
 where org_id = '<教室>' and user_id = '<オーナーB>'
returning id as "準備：Bをオーナーにできたか（1行のはず）";

-- ★ここからが本番。AがBを降格しようとする
update public.memberships set role = 'teacher'
 where org_id = '<教室>' and user_id = '<オーナーB>'
returning id as "★AがBを降格できてしまった行（0行であること）", role;
rollback;

-- ---------------------------------------------------------------------------
-- ④ ★オーナーが、自分で降りる → ★通らなければいけない
--
--   ★ここが0行なら、締めすぎです。降りる手段が無くなっています。
-- ---------------------------------------------------------------------------
begin;
select set_config('request.jwt.claims',
  '{"sub":"<オーナーA>","role":"authenticated"}', true);
set local role authenticated;

update public.memberships set role = 'teacher'
 where org_id = '<教室>' and user_id = auth.uid()
returning id as "★自分で降りられた行（★1行であること）", role;
rollback;

-- ---------------------------------------------------------------------------
-- ⑤ ★最初の1人（教室を作る）→ ★通らなければいけない
--
--   ★ここが0行なら、★誰も新しい教室を作れなくなっています。
--     いちばん壊してはいけないところです。
-- ---------------------------------------------------------------------------
begin;
select set_config('request.jwt.claims',
  '{"sub":"<責任者>","role":"authenticated"}', true);
set local role authenticated;

with o as (
  insert into public.organizations (name, kind, created_by)
  values ('★確認用（rollback します）', 'solo', auth.uid())
  returning id
)
insert into public.memberships (org_id, user_id, role)
select o.id, auth.uid(), 'owner' from o
returning id as "★最初の1人として入れた行（★1行であること）", role;
rollback;

-- ---------------------------------------------------------------------------
-- ⑥ 読み方
--
--   ①②③ … 0行 なら守れています。1行返ったら★穴が開いています。
--   ④⑤   … 1行 でなければいけません。0行なら★締めすぎです。
--
--   ★①〜③が通ってしまう場合、まず RESTRICTIVE が入っているかを見ます。
--     PERMISSIVE のままだと、OR で足されるだけで★何も禁止できません。
-- ---------------------------------------------------------------------------
select policyname as "ポリシー", cmd as "操作", permissive as "種別"
  from pg_policies
 where schemaname = 'public' and tablename = 'memberships'
 order by permissive, cmd;
