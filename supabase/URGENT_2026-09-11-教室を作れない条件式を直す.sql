-- ============================================================================
-- ★至急　memberships_insert_bootstrap_owner の 条件式を 直す
--
--   ★見つかった こと（★2026-09-11・坂本さん）
--     NOT (EXISTS (SELECT 1 FROM memberships m WHERE (m.org_id = m.org_id)))
--
--   ★★坂本さんの お読みが 正しいです。★これは 誤りです。
--
--   ★★もとの 字（supabase/migration_org_insert_policies.sql:108-111）
--       and not exists (
--         select 1 from public.memberships m
--          where m.org_id = org_id
--       )
--     ★★`org_id` に、★表の 名前を 付けて いませんでした。
--     ★★中の 問い合わせには m（＝memberships）が 居ます。
--       ★★m にも org_id の 列が あります。
--       ★★だから `org_id` は、★**近い ほう**＝ m.org_id と 読まれます。
--     ★★結果　m.org_id = m.org_id　★＝ いつでも 真。
--
--   ★★何が 起きるか
--     ★memberships に **1行でも** あれば、★EXISTS が 真に なります。
--     ★→ NOT EXISTS が 偽。★→ この 決まりは **1度も 通りません**。
--     ★★つまり、★**誰も 新しい 教室の owner に なれません**。
--       ★★同じ 教室か どうかも 見て いません。★どこの 行でも 止めます。
--     ★★これは 漏れでは ありません。★**締まりすぎ**です。
--       ★★機能が 静かに 止まって います。★しくじりに 見えません。
--
--   ★★すぐ上の EXISTS は 正しいです。★くらべて ください。
--       and exists (
--         select 1 from public.organizations o
--          where o.id = org_id and o.created_by = auth.uid()
--       )
--     ★★こちらの 中には organizations しか 居ません。
--       ★organizations に org_id の 列は ありません。
--       ★だから `org_id` は 外の 行（★入れようと して いる 行）を 指します。
--     ★★つまり、★誤りは「同じ 表を 中でも 使った」ところ だけ です。
--
--   ★★直し方
--     ★外の 行を、★表の 名前で はっきり 指します ── memberships.org_id
--     ★★別名（m）と ぶつからなく なります。
--
--   ★★もとの 狙い（★覚え書きの まま）
--     「その 教室に まだ 誰も 居ない ときだけ、★作った 人が owner に なれる」
--     ★★2人目からは、★この 道では 入れません。★招きが 要ります。
--
--   ★実行　Supabase の SQL Editor に、★このまま 貼って ください。
--   ★★ほかの 台本と 同時に 流さないで ください。
-- ============================================================================


-- ── ① いまの 条件式（★流す 前の 記録）
select
  policyname as "決まり",
  cmd        as "いつ",
  with_check as "書ける条件"
from pg_policies
where schemaname='public' and tablename='memberships'
  and policyname='memberships_insert_bootstrap_owner';


-- ── ② 直す
--    ★★消してから 作り直します。★式は 1か所だけ 変えます。
--      ★変えるのは、★最後の not exists の 中の `org_id` → `memberships.org_id`。
--    ★★ほかの 3つの 条件は、★1文字も 変えて いません。
set lock_timeout = '5s';

drop policy if exists "memberships_insert_bootstrap_owner" on public.memberships;

create policy "memberships_insert_bootstrap_owner"
  on public.memberships for insert
  to authenticated
  with check (
    user_id = auth.uid()
    and role = 'owner'
    and exists (
      select 1 from public.organizations o
       where o.id = org_id
         and o.created_by = auth.uid()
    )
    and not exists (
      -- ★★ここが 直した ところ。★外の 行を 表の 名前で 指します。
      select 1 from public.memberships m
       where m.org_id = memberships.org_id
    )
  );


-- ── ③ 直ったかの 確かめ
--    ★★「書ける条件」に memberships.org_id が 出て いること。
--    ★★m.org_id = m.org_id が 消えて いること。
select
  policyname as "決まり",
  cmd        as "いつ",
  with_check as "書ける条件"
from pg_policies
where schemaname='public' and tablename='memberships'
  and policyname='memberships_insert_bootstrap_owner';


-- ── ④ ★本当に 直ったかを、★台帳に 聞く
--
--   ★★式を 読むだけでは 足りません。★動かして 確かめます。
--   ★★下は **数えるだけ** です。★1行も 書きません。
--
--   ★★㋐ いま、★誰も 居ない 教室が ありますか。
--     ★★あれば、★その 教室の 作り主は owner に なれる はずです。
select
  o.id          as "教室",
  o.name        as "名前",
  (o.created_by = auth.uid()) as "自分が 作った か",
  (select count(*) from public.memberships m where m.org_id = o.id) as "居る 人の 数"
from public.organizations o
where not exists (select 1 from public.memberships m where m.org_id = o.id)
order by o.name;

--   ★★㋑ 直す 前は、★ここが 0件でも 入れませんでした。
--     ★★memberships に どこかに 1行でも あれば、★止まって いたからです。
select count(*) as "memberships の 行の 数（★1以上なら、直す前は 全部 止まって いました）"
from public.memberships;
