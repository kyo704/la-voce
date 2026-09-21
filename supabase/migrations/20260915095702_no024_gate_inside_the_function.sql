-- ★本番の 台帳から 写しました（no024_gate_inside_the_function）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。

-- No.024 門を経路の外へ出す
-- 2026-09-15 裁定 ㋐（service_role のまま、関数の中にも門を1枚）
-- 呼べる人は増やさない。anon にも authenticated にも execute を渡さない。

create or replace function public.admin_entry_stats(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select case
    when not exists (
      select 1 from public.profiles
       where id = p_user_id and is_admin is true
    ) then null
    else jsonb_build_object(
      'total', (select count(*) from public.entries),
      'per_user', coalesce((
        select jsonb_agg(jsonb_build_object('user_id', e.user_id, 'n', e.n))
        from (select user_id, count(*) as n from public.entries group by user_id) e
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

-- 門の無い古いほうを落とす。2つ残すと、古いほうが静かに使われる。
drop function if exists public.admin_entry_stats();

revoke all on function public.admin_entry_stats(uuid) from public, anon, authenticated;
grant execute on function public.admin_entry_stats(uuid) to service_role;

comment on function public.admin_entry_stats(uuid) is
  '管理画面の入力率と人ごとの件数。数だけを返す。p_user_id が is_admin でなければ null。service_role のみ（No.024）。';

-- 居ない人には返さない
create or replace function public.character_unlock_summary(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select case
    when not exists (select 1 from public.profiles where id = p_user_id)
    then null
    else jsonb_build_object(
      'performances', (
        select count(*)
        from public.entries e
        where e.user_id = p_user_id
          and case
                when jsonb_typeof(to_jsonb(e.activities)) = 'array'
                 and jsonb_array_length(to_jsonb(e.activities)) > 0
                then exists (
                       select 1 from jsonb_array_elements(to_jsonb(e.activities)) a
                       where a ->> 'kind' = '本番')
                else e.activity_type = '本番'
              end
      ),
      'hasPianissimo', coalesce((
        select bool_or(
                 jsonb_typeof(to_jsonb(e.pianissimo_high_note)) <> 'null'
             and to_jsonb(e.pianissimo_high_note) <> '""'::jsonb
             and to_jsonb(e.pianissimo_high_note) <> 'false'::jsonb
             and to_jsonb(e.pianissimo_high_note) <> '0'::jsonb)
        from public.entries e where e.user_id = p_user_id
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
