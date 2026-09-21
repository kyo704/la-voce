-- ============================================================================
-- 裁定162 ── 引数の人と、呼んでいる本人が ちがうときは 返さない
--            （2026-09-21・★まだ どこにも 当てて いません）
--
--   ★★★裁定162 の 直しの 案を、★そのまま 当てられません。
--     ★★案 …… `when p_user_id is distinct from auth.uid() then null`
--     ★★★service_role の 下では `auth.uid()` は **null** です。
--       ★★`'…'::uuid is distinct from null` は **true** です。
--       ★★だから、★いまの 呼び手 2つが どちらも null を 受け取ります。
--         ★`app/admin/page.js:167`（管理の 画面の 数）
--         ★`app/api/character/unlock/route.js:87`（ひつじの 開き）
--     ★★台帳で 測りました（2026-09-21）── ★案の 式 …… true（塞ぐ）
--
--   ★★★だから 1語 足します ── 「呼び手が 居る ときだけ 見る」。
--     `auth.uid() is not null and p_user_id is distinct from auth.uid()`
--     ★★service_role（呼び手が 居ない）…… 素通り。★いままで どおり 動きます。
--     ★★入って いる 人 …… ★よその id を 渡せません。
--     ★★台帳で 測りました ── ★この 式 …… false（素通り）
--
--   ★★★いま 本番に 穴は ありません（★実測）。
--     ★★渡しが `postgres` と `service_role` だけ です。
--     ★★ふつうの 利用者からは 42501 で 断られます（3件 とも 確かめました）。
--     ★★★穴が あるのは **試しの 台帳** です。★そちらは 誰でも 呼べます。
--   ★★この 紙は「渡しを 1つ 足した 日」に 効きます。★備え です。
--
--   ★★何度 流しても 同じ です。
-- ============================================================================

-- ---------------------------------------------------------------------------
-- ① admin_entry_stats ── 管理の 画面の 数
-- ---------------------------------------------------------------------------
create or replace function public.admin_entry_stats(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select case
    -- ★呼び手が 居る ときだけ、★その 人と 引数が 同じかを 見ます。
    when auth.uid() is not null and p_user_id is distinct from auth.uid() then null
    when not exists (
      select 1 from public.profiles where id = p_user_id and is_admin is true
    ) then null
    else jsonb_build_object(
      'total', (select count(*) from public.entries),
      'per_user', (
        select coalesce(jsonb_object_agg(t.user_id, t.n), '{}'::jsonb)
          from (select user_id, count(*) as n from public.entries group by user_id) t
      ),
      'fill', (
        select coalesce(jsonb_object_agg(k.key, k.n), '{}'::jsonb)
          from (
            select kv.key, count(*) as n
              from public.entries e,
                   lateral jsonb_each(to_jsonb(e.*)) as kv(key, value)
             where jsonb_typeof(kv.value) <> 'null'
             group by kv.key
          ) k
      )
    )
  end;
$$;

comment on function public.admin_entry_stats(uuid) is
  '管理の画面の数。呼び手が居るときは、引数の人と一致しないと返さない（裁定162）。service_role からは素通り（auth.uid() が null のため）。';

-- ---------------------------------------------------------------------------
-- ② character_unlock_summary ── ひつじの 開き
--     ★中身（3つの数）は 1文字も 変えません。★門を 1枚 足す だけ です。
-- ---------------------------------------------------------------------------
-- ★★★この紙は 中身を 写しません。★写すと、★もとの 式と ずれた 日に 気づけません。
--   ★★当てる 前に、★本番の 定義を そのまま 引いて、★頭の `case` に
--     ★下の 1行を 足した ものを 作ります（★Code が 当てる 日に 作ります）。
--
--     when auth.uid() is not null and p_user_id is distinct from auth.uid() then null
--
--   ★★★ここに 写し書きを 置かない のは、★その ほうが 安全 だから です。
--     ★★`character_unlock_summary` は 40行ほど の 長い 式 です。
--     ★★写し間違えると、★ひつじの 開きが 静かに ずれます。

-- ---------------------------------------------------------------------------
-- ③ 試しの 台帳の 渡しを 閉じる（★本番に 合わせます）
--     ★★本番は もとから `service_role` だけ です。★ここは 変わりません。
--     ★★試しだけ PUBLIC・anon・authenticated に 開いて います。
-- ---------------------------------------------------------------------------
revoke execute on function public.admin_entry_stats(uuid) from public;
revoke execute on function public.admin_entry_stats(uuid) from anon;
revoke execute on function public.admin_entry_stats(uuid) from authenticated;
revoke execute on function public.character_unlock_summary(uuid) from public;
revoke execute on function public.character_unlock_summary(uuid) from anon;
revoke execute on function public.character_unlock_summary(uuid) from authenticated;
