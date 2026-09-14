-- ============================================================================
-- No.019.5 ── 数えるだけの ために、値を 国外へ 運ばない（2026-09-14）
--
-- ★出どころ 裁定 その61（★Opus・2026-09-14）
--
-- ★★なぜ 要るのか
--   `app/admin/page.js:102` は、★全38人の entries から 12列を 取って いました。
--     weight_kg / body_fat_pct / meals / exercises / temperature / humidity /
--     medication_tags / mental_tags / mental_reason / cpps_value / voice_memo
--   ★★この うち `mental_reason` と `voice_memo` は ★自由記述、
--     `medication_tags` は ★お薬の 記録です。
--   ★★そして、★値は ★1つも 使われて いません。
--     :180-188 が して いるのは `typeof` と `.length` と `.trim()` だけ ──
--     ★「埋まって いるか」の 判定だけ です。
--
--   ★★2026-09-14、★本番の x-vercel-id を 測りました。
--     静的 hnd1（東京）／★関数 iad1（米国バージニア）。
--   ★★保管は 東京でも、★関数は 米国で 動いて います。
--     ★つまり この 12列は、★毎回 米国へ 運ばれて、★数えられて、捨てられて いました。
--
--   ★★数えるのは、★台帳の 中で できます。★出るのは 数だけに なります。
--
-- ★★画面に 出る 数字は、★1つも 変えません。
--   ★下の 条件は、★JavaScript の 判定を ★1つずつ 書き写した ものです。
--     JS `typeof x === "number"`            → `jsonb_typeof(to_jsonb(x)) = 'number'`
--     JS `Array.isArray(x) && x.length > 0` → `jsonb_typeof(...)='array' and jsonb_array_length(...) > 0`
--     JS `(x || "").trim()`                 → `coalesce(trim(x),'') <> ''`
--   ★★`to_jsonb` を 挟んで いるのは、★列が jsonb でも 配列でも 同じに 読むため です。
--     ★列の 型を 決め打ちしません。★型が 違って いても 落ちません。
--
-- ★★誰が 呼べるか
--   ★これは ★人を またいで 数える ものです。★利用者には 渡しません。
--   ★`service_role` だけに 渡します。★anon にも authenticated にも 渡しません。
--   ★呼ぶのは `app/admin/page.js` だけで、★そこは 既に 本人の
--     `profiles.is_admin` で 門を 通って います。
--
-- ★★BEGIN / ROLLBACK は 使いません（SQLエディタが 効かせない ため）。
-- ============================================================================


-- ----------------------------------------------------------------------------
-- ★第1部 ── 作る
-- ----------------------------------------------------------------------------

create or replace function public.admin_entry_stats()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    -- ★総数（★画面の 分母。JS の `entryRows.length`）
    'total', (select count(*) from public.entries),

    -- ★人ごとの 件数（★JS の entryCountByUser）
    --   ★返すのは user_id と 数だけ です。★記録の 中身は 1つも ありません。
    'per_user', coalesce((
      select jsonb_agg(jsonb_build_object('user_id', e.user_id, 'n', e.n))
      from (
        select user_id, count(*) as n
        from public.entries
        group by user_id
      ) e
    ), '[]'::jsonb),

    -- ★項目ごとの 入力率（★JS の inputRateRows）
    --   ★並びも 画面と 同じに します。★画面側で 並べ替えません。
    'fill', (
      select jsonb_build_object(
        'weight_kg',
          count(*) filter (where jsonb_typeof(to_jsonb(weight_kg)) = 'number'),
        'body_fat_pct',
          count(*) filter (where jsonb_typeof(to_jsonb(body_fat_pct)) = 'number'),
        'meals',
          count(*) filter (where jsonb_typeof(to_jsonb(meals)) = 'array'
                             and jsonb_array_length(to_jsonb(meals)) > 0),
        'exercises',
          count(*) filter (where jsonb_typeof(to_jsonb(exercises)) = 'array'
                             and jsonb_array_length(to_jsonb(exercises)) > 0),
        'environment',
          count(*) filter (where jsonb_typeof(to_jsonb(temperature)) = 'number'
                              or jsonb_typeof(to_jsonb(humidity))    = 'number'),
        'medication_tags',
          count(*) filter (where jsonb_typeof(to_jsonb(medication_tags)) = 'array'
                             and jsonb_array_length(to_jsonb(medication_tags)) > 0),
        'mental',
          count(*) filter (where (jsonb_typeof(to_jsonb(mental_tags)) = 'array'
                                  and jsonb_array_length(to_jsonb(mental_tags)) > 0)
                              or coalesce(trim(mental_reason), '') <> ''),
        'cpps_value',
          count(*) filter (where jsonb_typeof(to_jsonb(cpps_value)) = 'number'),
        'voice_memo',
          count(*) filter (where coalesce(trim(voice_memo), '') <> '')
      )
      from public.entries
    )
  );
$$;


-- ----------------------------------------------------------------------------
-- ★第2部 ── 権限。★先に 取り上げてから、★1つだけ 渡します
--
--   ★列の GRANT と 同じ 考えです。★広い ほうが 黙って 勝ちます。
-- ----------------------------------------------------------------------------

revoke all on function public.admin_entry_stats() from public, anon, authenticated;
grant execute on function public.admin_entry_stats() to service_role;

comment on function public.admin_entry_stats() is
  '★管理画面の 入力率と 人ごとの 件数。★数だけを 返します。記録の 中身は 返しません。'
  '★service_role だけが 呼べます（No.019.5・裁定 その61）。';


-- ----------------------------------------------------------------------------
-- ★第3部 ── 確かめ（★見るだけ）
-- ----------------------------------------------------------------------------

-- ①-1 ★誰が 呼べるか。★service_role だけで あること。
select
  p.proname                                   as "関数",
  p.prosecdef                                 as "SECURITY DEFINER",
  pg_get_userbyid(p.proowner)                 as "所有者",
  coalesce(array_to_string(p.proacl, E'\n'), '(既定)') as "権限"
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public' and p.proname = 'admin_entry_stats';
-- ★"権限" に `anon=X` や `authenticated=X` が ★出ない こと。

-- ①-2 ★中身。★画面の 数字と 見くらべて ください。
select public.admin_entry_stats();


-- ############################################################################
-- ★第4部 ── もう 1か所。`character/unlock` の `select("*")`
--
--   ★`app/api/character/unlock/route.js:55` は、★ご本人の entries を
--     ★全列 取って いました。
--   ★★使って いるのは `lib/character.js:277` の 3つだけ です ──
--       ・本番の 回数
--       ・ピアニッシモを 1度でも 書いたか
--       ・★何種類の 項目に 触れたか（★`v == null` の 判定だけ）
--   ★★値は 1つも 残りません。★けれど 全列が 米国の 関数へ 運ばれます。
--
--   ★★管理画面（第1部）とは、★重さが 違います。
--     ★あちらは ★全38人ぶん・★門なし。
--     ★こちらは ★ご本人ぶん・★ご本人が 押した ときだけ。
--     ★それでも、★運ぶ 必要が ない ことに 変わりは ありません。
--
-- ★★ここは 慎重に します。★数が ずれると、★ごほうびの 開き方が 変わります。
--   ★`fieldKinds >= 10` の しきい値の きわで ずれると、
--     ★開くはずの ものが 開きません。
--   ★★ただし この 経路は「足す」だけ です。★取り上げる ことは ありません
--     （★route.js が、既に 台帳に ある ものを 組み立て直さない ため）。
--   ★★だから、★ずれの 向きは「まだ 開かない」であって、
--     ★「持って いた ものが 消える」では ありません。
--   ★★第4部の 確かめで、★数を 見くらべて ください。
-- ############################################################################

create or replace function public.character_unlock_summary(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
    -- ★本番の 回数
    --   ★JS: activities が 空で なければ その 中の kind、無ければ activity_type
    'performances', (
      select count(*)
      from public.entries e
      where e.user_id = p_user_id
        and case
              when jsonb_typeof(to_jsonb(e.activities)) = 'array'
               and jsonb_array_length(to_jsonb(e.activities)) > 0
              then exists (
                     select 1
                     from jsonb_array_elements(to_jsonb(e.activities)) a
                     where a ->> 'kind' = '本番'
                   )
              else e.activity_type = '本番'
            end
    ),

    -- ★ピアニッシモを 1度でも 書いたか
    --   ★JS: `if (row && row.pianissimo_high_note)` ── ★真と なる ものだけ。
    --     ★空文字・false・0 は 真では ありません。
    'hasPianissimo', coalesce((
      select bool_or(
               jsonb_typeof(to_jsonb(e.pianissimo_high_note)) <> 'null'
           and to_jsonb(e.pianissimo_high_note) <> '""'::jsonb
           and to_jsonb(e.pianissimo_high_note) <> 'false'::jsonb
           and to_jsonb(e.pianissimo_high_note) <> '0'::jsonb
             )
      from public.entries e
      where e.user_id = p_user_id
    ), false),

    -- ★何種類の 項目に 触れたか
    --   ★JS: 行の すべての 鍵を まわして、
    --     `v == null || v === "" || (Array.isArray(v) && v.length === 0)` なら 飛ばす。
    --     `date` `user_id` `id` も 飛ばす。★残った 鍵の 種類を 数える。
    'fieldKinds', (
      select count(distinct kv.key)
      from public.entries e,
           lateral jsonb_each(to_jsonb(e.*)) as kv(key, value)
      where e.user_id = p_user_id
        and kv.key not in ('date', 'user_id', 'id')
        and jsonb_typeof(kv.value) <> 'null'
        and not (jsonb_typeof(kv.value) = 'string' and kv.value = '""'::jsonb)
        and not (jsonb_typeof(kv.value) = 'array'  and jsonb_array_length(kv.value) = 0)
    )
  );
$$;

revoke all on function public.character_unlock_summary(uuid) from public, anon, authenticated;
grant execute on function public.character_unlock_summary(uuid) to service_role;

comment on function public.character_unlock_summary(uuid) is
  '★ごほうびの 開き方を 決める 3つの 数だけを 返します。★記録の 中身は 返しません。'
  '★service_role だけが 呼べます（No.019.5・裁定 その61）。';


-- ----------------------------------------------------------------------------
-- ★第4部の 確かめ（★見るだけ）
--
--   ★ご自身の id を 入れて、★いまの 画面と 見くらべて ください。
--   ★★`fieldKinds` が 10 の きわ なら、★とくに よく ご覧ください。
-- ----------------------------------------------------------------------------

-- select public.character_unlock_summary('ここに-ご自身の-user-id');

-- ★全員ぶんを 一度に 見くらべる（★数だけ です）
select
  u.id,
  public.character_unlock_summary(u.id) as "いまの数"
from (select distinct user_id as id from public.entries) u
order by u.id;
