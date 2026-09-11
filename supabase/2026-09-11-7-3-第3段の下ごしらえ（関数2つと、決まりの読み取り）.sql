-- ============================================================================
-- §7-3／§7-4　★第3段の 下ごしらえ
--   ★★関数を もう 2つ 作り、★★いまの 決まりの 式を そのまま 読みます
--
--   ★★★この 台本も、★決まりを 1つも 切り替えません。
--     ★★作るのは 関数 2つ。★あとは 読むだけ です。
--     ★★いまの 動きは 1つも 変わりません。
--
--   ★★なぜ また 分けるか
--     ★★切り替える 決まりの **いまの 式**を、★私は 見て いません。
--     ★★見ずに 書き換えると、★いま 守って いる ほかの 条件を 落とします。
--       ★★決まりは 1本で、★更新の ぜんぶを 見張って います。
--       ★★役職の ことだけ 考えて 書き直すと、
--         ★★たとえば「教室を 抜ける」道まで 塞ぐ ことが あります。
--     ★★だから、★②で 式を そのまま 出して いただきます。
--       ★★それを 読んでから、★第3段の 本体を 書きます。
--
--   ★★★③④は、★第2段の ⑥が **0行**に なってから 流して ください。
--     ★★0行に ならない うちに 切り替えると、★誰かが 締め出されます。
-- ============================================================================


-- ===========================================================================
-- ① ★学校ぜんぶに かかる できこと の 一覧（★関数に します）
--
--   ★★lib/opsPerms.js の schoolWide: true と 同じ もの です。
--   ★★2か所に 同じ ものが 住みます。★ずれると 事故に なります。
--     ★★だから、★components/tests/has-can.test.js が 突き合わせます。
--     ★★ずれたら 落ちます。
--
--   ★★immutable に します。★中身が 変わらない からです。
-- ===========================================================================
create or replace function public.school_wide_perms()
returns text[]
language sql
immutable
as $$
  select array[
    'bill', 'bill_pay', 'meibo', 'sched_all', 'gyoji',
    'renraku_all', 'monka_read', 'master', 'post', 'koma'
  ]::text[];
$$;

comment on function public.school_wide_perms() is
  '★学校ぜんぶに かかる できこと。★lib/opsPerms.js の schoolWide:true と 同じ。★2026-09-11。';


-- ===========================================================================
-- ② ★「自分が 持って いる ものしか 渡せない」（★§7-4）
--
--   ★出どころ 作業指示 §7-4
--     「★仕様シート SPEC_SRV に、★もう 書いてあります ──
--       「★役職を 変える：post を 持ち、かつ ★自分が 持っている 全校権限しか 渡せない」
--      ★★これは ★画面だけでは 守れません。
--      ★★`memberships_update_role_management` の 中で 守ってください。」
--
--   ★★いま、★これは JS の 中だけに あります（lib/opsPerms.js の mayGrantPost）。
--     ★★裏口（service role）を 通る 道は、★それで 守れて います。
--     ★★けれど、★台帳に 直に 投げる 道には、★何も ありません。
--       ★★いまは 権限（GRANT）が 無くて 止まって いるだけ です。
--       ★★GRANT が 1行 足された 瞬間に、★守りが 無くなります。
--
--   ★★だから、★台帳の 側にも 置きます。
--
--   ★★security definer です。★理由は has_can と 同じ です。
--     ★見るのは auth.uid() 自身の できことと、★渡す 先の 役職 だけ です。
-- ===========================================================================
create or replace function public.can_grant_post(p_org_id uuid, p_post_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  -- ★★渡す 先が 無ければ（★役職を 外す）、★止めません。
  --   ★★外すのは「渡す」ことでは ないからです。
  --   ★★ただし、★いま 付いて いる ほうの 確かめは 別に 要ります（★下の 覚え書き）。
  select case
    when p_post_id is null then true
    else not exists (
      -- ★★渡す 先の 役職が 持って いる「学校ぜんぶに かかる もの」の うち、
      --   ★★自分が 持って いない ものが 1つでも あれば、★渡せません。
      select 1
      from public.org_posts t
      cross join lateral jsonb_object_keys(t.perms) as k(perm)
      where t.id = p_post_id
        and t.org_id = p_org_id
        and (t.perms -> k.perm)::text = 'true'
        and k.perm = any (public.school_wide_perms())
        and not public.has_can(p_org_id, k.perm)
    )
  end;
$$;

comment on function public.can_grant_post(uuid, uuid) is
  '★その役職を、いま自分が渡せるか。★自分が持っていない全校権限は渡せない（★§7-4）。★2026-09-11。';

-- ★★誰が 呼べるか。★revoke を 先に。
revoke all on function public.school_wide_perms() from public, anon;
revoke all on function public.can_grant_post(uuid, uuid) from public, anon;
grant execute on function public.school_wide_perms() to authenticated;
grant execute on function public.can_grant_post(uuid, uuid) to authenticated;


-- ===========================================================================
-- ③ ★作れたかの 確かめ
-- ===========================================================================
select
  p.proname                                 as "関数",
  pg_get_function_identity_arguments(p.oid) as "引数",
  p.prosecdef                               as "決まりを 飛び越えるか",
  p.provolatile                             as "i＝immutable ／ s＝stable",
  p.proconfig                               as "道の 固定"
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('has_can', 'school_wide_perms', 'can_grant_post')
order by p.proname;

select public.school_wide_perms() as "学校ぜんぶに かかる できこと（★10）";


-- ===========================================================================
-- ④ ★★★いまの 決まりの 式を、★そのまま 出して ください
--
--   ★★これを 読んでから、★第3段の 本体を 書きます。
--   ★★見ずに 書き換えると、★いま 守って いる ほかの 条件を 落とします。
--
--   ★★結果を そのまま お送り ください。★長くて かまいません。
-- ===========================================================================
select
  tablename  as "表",
  policyname as "決まりの 名前",
  cmd        as "いつ",
  roles      as "だれに",
  permissive as "ゆるい か",
  qual       as "読むときの 条件（using）",
  with_check as "書くときの 条件（with check）"
from pg_policies
where schemaname = 'public'
  and tablename in ('memberships', 'org_events', 'org_posts', 'organizations')
order by tablename, cmd, policyname;


-- ===========================================================================
-- ⑤ ★念のため ── ★いま、★誰が どの 決まりで 通って いるか
--
--   ★★切り替えた あとに くらべる ための、★いまの 姿の 記録です。
-- ===========================================================================
select
  o.name   as "教室",
  m.role   as "役割",
  p.name   as "役職",
  p.perms  as "できこと"
from public.memberships m
join public.organizations o on o.id = m.org_id
left join public.org_posts p on p.id = m.post_id
order by o.name, m.role, p.name;
