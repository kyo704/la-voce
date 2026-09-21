# DECISION_NEEDED ── 裁定162（引数の人と 呼び手の 一致）

## DECISION_NEEDED

## 何を変えるか

裁定162。`admin_entry_stats` と `character_unlock_summary` に、
「呼び手が 居る ときは、引数の人と 一致しないと 返さない」門を1枚足します。
あわせて、**試しの台帳** の渡しを本番に合わせて閉じます。

★裁定162 の直しの案は、**そのままでは 当てられません**。下に測った結果を書きます。

## SQL全文

```sql
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
```

## 戻すSQL

```sql
-- 裁定162 の門を戻す。★中身は変えていないので、門の1行を外すだけです。
-- ★本番の定義をそのまま引き、`when auth.uid() is not null …` の1行を外して
--   create or replace し直します（写し書きを置かないのと同じ理由です）。
-- 試しの渡しを戻すなら（★本番には当てません）:
--   grant execute on function public.admin_entry_stats(uuid) to anon, authenticated;
--   grant execute on function public.character_unlock_summary(uuid) to anon, authenticated;
```

## 変える前のポリシー

この2つは関数です。決まり（RLS）ではありません。渡し（grant）を書きます。

```
本番
  admin_entry_stats(uuid)         postgres=X / service_role=X
  character_unlock_summary(uuid)  postgres=X / service_role=X
  ★anon にも authenticated にも 渡して いません

試し
  admin_entry_stats(uuid)         =X（PUBLIC）/ postgres=X / anon=X / authenticated=X / service_role=X
  character_unlock_summary(uuid)  同じ
```

## 変えた後のポリシー

```
本番   変わりません（もとから service_role だけ）
試し   PUBLIC・anon・authenticated から revoke → 本番と同じ形
関数   どちらも頭に1行増えます（呼び手が居るときだけ一致を見る）
```

## USINGとWITH CHECK

該当なし。決まり（RLS）ではなく関数の渡しと本文です。
★`USING(true)` に当たるもの ── 「誰でも呼べる」状態は、試しの PUBLIC 渡しです。これを外します。

## 試験

★まず、裁定162 の案が当てられないことを台帳で測りました。service_role の下では auth.uid() が null です。

```
裁定162 の案の式 → 期待 塞がない → 結果 塞ぐ（true）★これでは 当てられません
この紙の式       → 期待 塞がない → 結果 素通り（false）
```

★案のままだと、いまの呼び手2つが null を受け取ります。
app/admin/page.js:167 と app/api/character/unlock/route.js:87 です。

★いまの 本番と試しの 実測（読むだけ）

```
本番・入らずに: admin_entry_stats（他人の UUID） → 期待 0行 → 結果 0行（42501）
本番・入って:   admin_entry_stats（他人の UUID） → 期待 0行 → 結果 0行（42501）
本番・入って:   character_unlock_summary（他人の UUID） → 期待 0行 → 結果 0行（42501）
試し・入らずに: admin_entry_stats（他人の UUID） → 期待 0行 → 結果 ★1行以上（通った）
試し・入って:   character_unlock_summary（他人の UUID） → 期待 0行 → 結果 ★1行以上（通った）
```

★較正 …… 本番で3件とも0行、試しで2件とも1行以上。両の側があります。

★当てたあとの試験（★当てる日に走らせます）

```
試し・入って: 自分の UUID で character_unlock_summary → 期待 1行以上
試し・入って: 他人の UUID で character_unlock_summary → 期待 0行
本番・service_role: admin_entry_stats（自分の id） → 期待 1行以上（いままでどおり）
```

## なりすまし

**使っていない。** BEGIN／set role／set_config／ROLLBACK を1つも使っていません。
実在の試しの利用者と、本番の E2E_TEACHER で、読むだけの呼び出しをしました。

## fail closed

該当なし。記録を書く処理ではありません。
★ただし「返さない」側に倒しています。呼び手が分からないときは素通り、
分かっていて一致しないときは null です。

## 本番の影響

| 見たこと | 数 |
|---|---|
| admin_entry_stats を呼べる役 | service_role のみ |
| いま読めている人が読めなくなるか | ★いいえ（service_role は素通り） |
| 管理の画面 | 変わりません |
| ひつじの開き | 変わりません |
| 試しで anon から叩いている道具 | ★私の道具にはありません（数えました） |

★★★ここだけ 要注意 …… 試しの渡しを閉じると、試しで anon のまま
これらを叩いている道具があれば止まります。

## 承認

（空のまま出します）
