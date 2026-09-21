-- ★本番の 台帳から 写しました（no019_5_admin_entry_stats）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。

create or replace function public.admin_entry_stats()
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
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
  );
$$;

revoke all on function public.admin_entry_stats() from public, anon, authenticated;
grant execute on function public.admin_entry_stats() to service_role;

comment on function public.admin_entry_stats() is
  '管理画面の入力率と人ごとの件数。数だけを返します。記録の中身は返しません。service_role だけが呼べます（No.019.5・裁定その61）。';
