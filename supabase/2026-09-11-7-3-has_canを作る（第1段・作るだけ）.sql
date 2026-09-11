-- ============================================================================
-- §7-3　★見張りを 1本に する ── ★第1段　★**関数を 作るだけ**
--
--   ★出どころ docs/opus/作業指示-権限の事故を直し、記録を残す（9月11日）.md §7-3
--     「★③ ★★サーバに 関数を 1つ 作る　──　has_can(org_id, 'meibo')」
--     「★④ ★★すべての 決まりが、★その 1つの 関数を 呼ぶ」
--     「★→ ★★決まりごとに 条件を 書かないでください。
--       ★→ ★★1か所に しないと、★また どこかが 取り残されます」
--
--   ★★★この 台本は、★**まだ 何も 切り替えません**。
--     ★★作るのは 関数 1つ だけです。★決まりは 1つも 触りません。
--     ★★いまの 動きは、★1つも 変わりません。
--
--   ★★なぜ 分けるか（★坂本さんの お決め）
--     「見えないものを 先に 作る → 入口を 増やす → 権限を 最後に」
--     ★★作って、★確かめて、★食い違いを 見てから、★切り替えます。
--     ★★いっぺんに やると、★どこで ずれたか 分からなく なります。
--
--   ★★第2段（★別の 台本）で、★決まりを 1つずつ 移します。
--     ★★その 前に、★⑤の 突き合わせを 必ず 見て ください。
--       ★★どこが 食い違うかが、★そこに 出ます。
-- ============================================================================


-- ===========================================================================
-- ① ★関数を 作る
--
--   ★★security definer に します。★理由が あります。
--     ★★この 関数は memberships を 読みます。
--     ★★けれど、★memberships の 決まりの 中から 呼ばれます。
--     ★★そのままだと、★決まりの 中で 決まりを 引いて、★ぐるぐる 回ります。
--     ★★だから、★決まりを 飛び越えて 読みます。
--
--   ★★飛び越える ので、★中で 見るのは **auth.uid() 自身の 行だけ** です。
--     ★★ほかの 方の 行を 1度も 見ません。★見る 道を 作りません。
--
--   ★★search_path を 固定します。
--     ★★書かないと、★呼ぶ 側が 道を すり替えられます。
--     ★★security definer の 関数で いちばん 多い 事故の 形です。
--
--   ★★stable に します。★同じ 問い合わせの 中で 何度 呼んでも 同じ です。
--     ★★決まりは 行ごとに 呼びます。★毎回 台帳を 引かせません。
-- ===========================================================================
create or replace function public.has_can(p_org_id uuid, p_perm text)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.memberships m
    join public.org_posts p on p.id = m.post_id
    where m.org_id = p_org_id
      and m.user_id = auth.uid()
      -- ★★できことは jsonb です。★true の ものだけ 入って います。
      --   ★出どころ supabase/2026-09-11-役職とできることの器.sql:62
      and coalesce((p.perms -> p_perm)::text, 'false') = 'true'
  );
$$;

comment on function public.has_can(uuid, text) is
  '★その方が、その教室で、その「できること」を持っているか。★役職（org_posts.perms）だけを見る。★role は見ない。★2026-09-11・作業指示 §7-3。';


-- ===========================================================================
-- ② ★誰が 呼べるか
--
--   ★★revoke を 先に 書きます。
--   ★★anon には 渡しません。★ログインして いない 人が 呼ぶ 理由が ありません。
-- ===========================================================================
revoke all on function public.has_can(uuid, text) from public;
revoke all on function public.has_can(uuid, text) from anon;
grant execute on function public.has_can(uuid, text) to authenticated;


-- ===========================================================================
-- ③ ★作れたかの 確かめ
-- ===========================================================================
select
  p.proname                                 as "関数",
  pg_get_function_identity_arguments(p.oid) as "引数",
  p.prosecdef                               as "決まりを 飛び越えるか（★true）",
  p.provolatile                             as "s＝stable",
  p.proconfig                               as "道の 固定（★search_path）"
from pg_proc p join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'has_can';

select grantee as "だれに", privilege_type as "できること"
from information_schema.routine_privileges
where routine_schema = 'public' and routine_name = 'has_can'
order by grantee;


-- ===========================================================================
-- ④ ★ためしに 呼んでみる（★読むだけ）
--
--   ★★いま ログインして いる 方（★SQL Editor では 持ち主）で 呼びます。
--   ★★持ち主は memberships に 行が 無い ことが 多いので、
--     ★false が 返って くるのが ふつうです。★それで 正しいです。
-- ===========================================================================
select
  public.has_can('00000000-0000-0000-0000-000000000000'::uuid, 'meibo') as "知らない 教室（★false）",
  public.has_can('00000000-0000-0000-0000-000000000000'::uuid, 'しらない') as "知らない できこと（★false）";


-- ===========================================================================
-- ⑤ ★★★いちばん 大事な ところ ── ★役割と できことの 食い違いを 数える
--
--   ★★いま、★決まりは role を 見て います。
--   ★★これから、★has_can（＝できこと）に 移します。
--   ★★★移した とき、★誰の 何が 変わるのか。★先に 数えます。
--
--   ★★§7-2 の 表が 言って いたのは、★こう いう ことです ──
--     role='staff' の 中に、★課長（bill・post あり）と 職員（なし）が 居る。
--     role='admin' の 中に、★学部長（master あり）と 学科長（なし）が 居る。
--
--   ★★下の 表で、★「★ちがう」が 出た 行が、★移した とき 変わる ところです。
--     ★★「★狭くなる」… ★いままで 通って いたのに、★通らなく なります
--       ★★＝ ★穴が 1つ 閉じます。
--     ★★「★広くなる」… ★いままで 通らなかったのに、★通る ように なります
--       ★★＝ ★★これは 危ない。★1つずつ 見て ください。
--
--   ★★★1つ、★はっきり させて おきます。
--     ★★「いま 通る か」の 列は、★**私が 役割の 名前から 組み立てた もの**です。
--       ★★決まりの 式を そのまま 読んだ ものでは ありません。
--     ★★ほんとうの 突き合わせは、★決まりの 式の ほうです ──
--       supabase/2026-09-11-A3-権限の総当たり-台帳の側.sql ③
--     ★★だから この 表は「当たりを つける」ため の ものです。
--       ★★ここで 出た ところを、★決まりの 式で 1つずつ 確かめて ください。
-- ===========================================================================
with 人 as (
  select
    m.org_id,
    m.user_id,
    m.role,
    p.name  as post_name,
    p.perms as perms
  from public.memberships m
  left join public.org_posts p on p.id = m.post_id
),
くらべ as (
  select
    人.org_id, 人.role, 人.post_name,
    k.perm,
    -- ★いまの 決まりが 見て いる もの（★role）
    case k.perm
      when 'meibo'       then 人.role in ('owner','admin')
      when 'sched_all'   then 人.role in ('owner','admin','staff')
      when 'gyoji'       then 人.role in ('owner','admin')
      when 'renraku_all' then 人.role in ('owner','admin')
      when 'bill'        then 人.role = 'owner'
      when 'bill_pay'    then 人.role = 'owner'
      when 'master'      then 人.role in ('owner','admin')
      when 'post'        then 人.role = 'owner'
      -- ★★学校の 時間の 割り方。★ひな型では 職員まで 持って います。
      when 'koma'        then 人.role in ('owner','admin','staff')
      -- ★★事故の ときだけ。★ひな型の 10役職は、★どれも 持って いません。
      when 'monka_read'  then false
      else false
    end as いまの判じ,
    -- ★これから 見る もの（★できこと）
    coalesce((人.perms -> k.perm)::text, 'false') = 'true' as これからの判じ
  from 人
  cross join (values ('meibo'),('sched_all'),('gyoji'),('renraku_all'),
                     ('bill'),('bill_pay'),('master'),('post'),
                     ('koma'),('monka_read')) as k(perm)
)
select
  role        as "役割",
  post_name   as "役職",
  perm        as "できこと",
  いまの判じ    as "いま 通る か",
  これからの判じ as "これから 通る か",
  case
    when いまの判じ and not これからの判じ then '★狭くなる（穴が 閉じる）'
    when not いまの判じ and これからの判じ then '★★広くなる（要 確認）'
    else ''
  end as "★ちがい"
from くらべ
where いまの判じ <> これからの判じ
order by
  case when not いまの判じ and これからの判じ then 0 else 1 end,
  role, post_name, perm;


-- ===========================================================================
-- ⑥ ★役職を 持たない 方が どれだけ 居るか
--
--   ★★has_can は、★役職（post_id）が 無い 方に false を 返します。
--   ★★いま role で 通って いる 方が、★役職を 持って いないと、
--     ★★移した とたん 通らなく なります。
--   ★★★切り替える 前に、★その 方に 役職を 付けて いただく 要が あります。
-- ===========================================================================
select
  m.role                                   as "役割",
  count(*)                                 as "人数",
  count(*) filter (where m.post_id is null) as "★役職が 無い 方",
  count(*) filter (where m.post_id is not null) as "役職が ある 方"
from public.memberships m
group by m.role
order by m.role;
