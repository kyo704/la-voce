-- ============================================================================
-- ★★至急　★同じ 誤りが、★もう 1か所 ありました
--
--   ★★先に 直したのは `memberships_insert_bootstrap_owner`（★ゆるい 決まり）でした。
--   ★★けれど、★**止める ほうの 決まり**（restrictive）にも、
--     ★★★まったく 同じ 式が 入って います。
--
--   supabase/URGENT_fix_owner_self_promotion.sql:106
--     and not exists (select 1 from public.memberships m where m.org_id = org_id)
--
--   ★★中に m（＝memberships）が 居ます。★m にも org_id の 列が あります。
--     ★だから `org_id` は 近い ほう＝ m.org_id と 読まれます。
--     ★★m.org_id = m.org_id ＝ いつでも 真。
--
--   ★★★これが 効いて いる かぎり、★先の 直しは **意味を 持ちません**。
--     ★★ゆるい 決まりと 止める 決まりは、★**かつ（AND）**で つながります。
--     ★★ゆるい ほうを 直しても、★止める ほうが 止め続けます。
--     ★★つまり、★教室を 作る 道は、★まだ 塞がった まま です。
--
--   ★★私の 落ち度です。
--     ★★1か所 見つけた とき、★同じ 形を 探す べきでした。
--     ★★「同じ形が ほかに ないか grep」は、★作業指示 §6 に 書いて あります。
--     ★★今回は、★坂本さんが 式を 出して くださって、★はじめて 見えました。
--
--   ★★ついでに 数えました ── ★この 帳面の SQL に、★同じ 形は もう ありません。
--     ★2か所 だけ でした。★どちらも これで 直ります。
--
--   ★実行　Supabase の SQL Editor に、★このまま 貼って ください。
-- ============================================================================


-- ── ① いまの 式（★流す 前の 記録）
select
  policyname as "決まり",
  cmd        as "いつ",
  permissive as "ゆるい か",
  qual       as "読むときの 条件",
  with_check as "書くときの 条件"
from pg_policies
where schemaname='public' and tablename='memberships'
order by permissive, cmd, policyname;


-- ============================================================================
-- ★★★★ 2026-09-11 ── ★★②は 流さないで ください。★訂正します。
--
--   ★★坂本さんが ①を 流して くださいました。★結果 ──
--     ★memberships の 決まりは 4つ。★どれも ゆるい（PERMISSIVE）。
--     ★★`memberships_restrict_role_insert` は、★**台帳に ありません**。
--
--   ★★つまり、★止める ほうの 決まりは、★はじめから 作られて いません。
--     ★URGENT_fix_owner_self_promotion.sql は、★流れて いない ようです。
--
--   ★★★だから、★②を 流すと「直す」ことに なりません。
--     ★★**いま 無い 決まりを、★新しく 作る**ことに なります。
--     ★★止める 決まりは、★ほかの 決まりと かつ（AND）で つながります。
--     ★★いま 通って いる 道が、★1つ 塞がる かも しれません。
--
--   ★★私の 早とちりでした。
--     ★★帳面の SQL に 5か所 ある ことと、
--       ★★台帳で 5か所 効いて いる ことを、★取りちがえて いました。
--     ★★台帳で 効いて いたのは、★ゆるい ほうの 1つ だけ。
--       ★★それは もう 直して いただきました。
--     ★★★つまり、★**教室を 作る 道は、★すでに 開いて います**。
--
--   ★★帳面の 5か所を 直した ことには、★まだ 意味が あります。
--     ★★どれかを もう一度 流した とき、★誤りが 戻って こない ためです。
--
--   ★★②を 流すのは、★「止める 決まりを 立てる」と 決めた ときだけ です。
--     ★★それは 別の お決めです。★§7-3 の 切り替えと 一緒に 考えます。
-- ============================================================================

-- ── ② ★★流さないで ください（★上の 訂正）
--    ★★式は 1か所だけ 変えて あります ── `org_id` → `memberships.org_id`。
--    ★★立てる と 決めた ときに、★この まま 使えます。
set lock_timeout = '5s';

drop policy if exists "memberships_restrict_role_insert" on public.memberships;

create policy "memberships_restrict_role_insert"
  on public.memberships as restrictive for insert to authenticated
  with check (
    (role <> 'owner' and (role <> 'admin' or public.is_org_owner_or_admin(auth.uid(), org_id)))
    or (
      user_id = auth.uid()
      and role = 'owner'
      and exists (select 1 from public.organizations o
                   where o.id = org_id and o.created_by = auth.uid())
      -- ★★ここが 直した ところ。★外の 行を 表の 名前で 指します。
      and not exists (select 1 from public.memberships m
                       where m.org_id = memberships.org_id)
    )
  );


-- ── ③ 直ったかの 確かめ
--    ★★「書ける条件」に memberships.org_id が 出て いること。
--    ★★m.org_id = m.org_id が 消えて いること。
select
  policyname as "決まり",
  permissive as "ゆるい か",
  with_check as "書ける条件"
from pg_policies
where schemaname='public' and tablename='memberships'
  and policyname in ('memberships_restrict_role_insert',
                     'memberships_insert_bootstrap_owner')
order by policyname;


-- ── ④ ★ほかに 同じ 形が 残って いないか（★読むだけ）
--    ★★決まりの 式ぜんぶを 見て、★「x.列 = 列」の 形を 探します。
--    ★★機械では 読み切れないので、★目で 見て いただく ための 一覧です。
select
  tablename  as "表",
  policyname as "決まり",
  cmd        as "いつ",
  qual       as "読むときの 条件",
  with_check as "書くときの 条件"
from pg_policies
where schemaname='public'
  and (coalesce(qual,'') like '%exists%' or coalesce(with_check,'') like '%exists%')
order by tablename, policyname;
