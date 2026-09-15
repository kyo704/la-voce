-- ============================================================================
-- No.024 ── 門を、経路の外へ出す（2026-09-15）
--
-- ★出どころ [ACTION] Opus → Code（2026-09-15）
--   「★DECISION: ㋐. keep service_role. add p_user_id and check inside」
--   「route だけに門がある形をやめる。関数の中にも1枚置く」
--
-- ★★番号のこと。Opus は「RECORD BOTH as No.021」と書かれていますが、
--   No.021 は 2026-09-15 の「学ぶの画面に見本の5つを入れる」で
--   既に使っています。★次の空き番号 No.024 にしました。
--   番号を重ねると、あとで どちらの話か 分からなくなります。
--
-- ---------------------------------------------------------------------------
-- ★なぜ要るのか
--
--   いま、門は `app/admin/page.js` の早い return 1か所にしかありません。
--   経路が変われば、門も一緒に外れます。
--
--   ★get_student_entries と同じ形です。だから大事です。
--     あのときも「呼ぶ側が確かめているから」で済ませていました。
--
--   ★★㋑（authenticated に execute を渡して、中で弾く）は採られませんでした。
--     わけ ──「呼べる人を増やしてから、中で絞る」ことになるからです。
--     いまは サーバだけが呼べます。それを手放しません。
--     ㋐ は「呼べる人を増やさず、さらに中でも弾く」。向きが逆です。
--
-- ---------------------------------------------------------------------------
-- ★何をするか
--
--   ① admin_entry_stats  … 引数なし → p_user_id uuid。中で is_admin を見る
--   ② character_unlock_summary … p_user_id が profiles に居ることを見る
--   ③ 権限はどちらも service_role だけ。★変えません
--
-- ★★BEGIN / ROLLBACK は使いません（SQLエディタが効かせないため）。
-- ★★2度流しても同じ結果になります。
-- ============================================================================


-- ----------------------------------------------------------------------------
-- ★第1部 ── admin_entry_stats に門を1枚
--
--   ★★引数が変わるので、古いほうを先に落とします。
--     `create or replace` は、★引数のちがう関数を置き換えません。
--     落とさないと、★門のない古いほうが残って、service_role から呼べます。
-- ----------------------------------------------------------------------------

drop function if exists public.admin_entry_stats();

create or replace function public.admin_entry_stats(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select case
    -- ★★門。★管理者でなければ、★null を返します。
    --   ★★raise しません。★呼ぶ側は `if (!entryStats)` を既に持っています。
    --     ★例外にすると、★画面が白くなります。★出さないだけで足ります。
    --   ★★`is_admin is true` と書きます。★null は false 扱いです。
    when not exists (
      select 1 from public.profiles
      where id = p_user_id and is_admin is true
    ) then null
    else jsonb_build_object(
      'total', (select count(*) from public.entries),
      'per_user', coalesce((
        select jsonb_agg(jsonb_build_object('user_id', e.user_id, 'n', e.n))
        from (
          select user_id, count(*) as n
          from public.entries
          group by user_id
        ) e
      ), '[]'::jsonb),
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
    )
  end;
$$;

-- ★★先に取り上げてから、1つだけ渡します。広いほうが黙って勝つためです。
revoke all on function public.admin_entry_stats(uuid) from public, anon, authenticated;
grant execute on function public.admin_entry_stats(uuid) to service_role;

comment on function public.admin_entry_stats(uuid) is
  '★管理画面の入力率と人ごとの件数。★数だけを返します。記録の中身は返しません。'
  '★p_user_id が profiles.is_admin = true でなければ null を返します（No.024）。'
  '★service_role だけが呼べます（No.019.5・裁定 その61）。';


-- ----------------------------------------------------------------------------
-- ★第2部 ── character_unlock_summary に門を1枚
--
--   ★★こちらのほうが重い、と Opus は書かれています。その通りです。
--     あちらは「みんなを数えた数」ですが、
--     ★こちらは「ある1人に結びついた値」です。
--   ★★経路がまちがった p_user_id を渡せば、★よその方の数が返ります。
--
--   ★★関数は、★呼び手が誰かを確かめられません
--     （service_role の下では auth.uid() は null です）。
--   ★★できるのは「その人が居るか」を見ることだけです。
--     ★居ない id なら null を返します。
--
--   ★★もう半分は、★経路の側の約束です ──
--     「p_user_id には、★必ず その場のログインの id を渡す。
--       ★要求の 本文から 取った 値を 渡さない」。
--   ★★2026-09-15 に確かめました。
--     `app/api/character/unlock/route.js` の `POST()` は ★引数を持たず、
--     ★本文を1度も読みません。★渡しているのは
--     `getUserWithTimeout()` が返した `user.id` だけです。
--   ★★`components/tests/unlock-caller-session-id.test.js` が、★毎回 数えます。
-- ----------------------------------------------------------------------------

create or replace function public.character_unlock_summary(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select case
    -- ★★門。★居ない人なら、★何も返しません。
    --   ★★これで「誰のものでもない id」を渡された ときに、
    --     ★数が出てしまう ことが なくなります。
    when not exists (select 1 from public.profiles where id = p_user_id) then null
    else jsonb_build_object(
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
    )
  end;
$$;

revoke all on function public.character_unlock_summary(uuid) from public, anon, authenticated;
grant execute on function public.character_unlock_summary(uuid) to service_role;

comment on function public.character_unlock_summary(uuid) is
  '★ごほうびの開き方を決める3つの数だけを返します。★記録の中身は返しません。'
  '★p_user_id が profiles に居なければ null を返します（No.024）。'
  '★service_role だけが呼べます（No.019.5・裁定 その61）。';


-- ----------------------------------------------------------------------------
-- ★第3部 ── 確かめ（★見るだけ。★書きません）
-- ----------------------------------------------------------------------------

-- ① ★引数なしの古いほうが、消えていること。
--   ★★"件数" が 1 で、★"引数" が uuid であること。
--     2 なら、★門のない古いほうが残っています。
select
  p.proname                                           as "関数",
  pg_get_function_identity_arguments(p.oid)           as "引数",
  p.prosecdef                                         as "SECURITY DEFINER",
  pg_get_userbyid(p.proowner)                         as "所有者",
  coalesce(array_to_string(p.proacl, E'\n'), '(既定)') as "権限"
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and p.proname in ('admin_entry_stats', 'character_unlock_summary')
order by p.proname, "引数";
-- ★"権限" に anon=X / authenticated=X が ★出ないこと。

-- ② ★管理者でない id を渡すと、null が返ること。
--   ★★ご自身の id で試してください。is_admin が false なら null です。
--   ★★true にしたあとは、中身が返ります。そこが 門が効いている 証拠です。
-- select public.admin_entry_stats('ここに-ご自身の-user-id');

-- ③ ★居ない id を渡すと、null が返ること。
select public.admin_entry_stats('00000000-0000-0000-0000-000000000000')       as "居ない人（admin）",
       public.character_unlock_summary('00000000-0000-0000-0000-000000000000') as "居ない人（unlock）";
-- ★どちらも null であること。

-- ④ ★居る人なら、character_unlock_summary が数を返すこと。
--   ★★No.019.5 のときと同じ数であること。ずれていたら止めてください。
select
  u.id,
  public.character_unlock_summary(u.id) as "いまの数"
from (select distinct user_id as id from public.entries) u
order by u.id;
