-- ★本番の 台帳から 写しました（no019_5_character_unlock_summary）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。

create or replace function public.character_unlock_summary(p_user_id uuid)
returns jsonb
language sql
security definer
set search_path = public
stable
as $$
  select jsonb_build_object(
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
  );
$$;

revoke all on function public.character_unlock_summary(uuid) from public, anon, authenticated;
grant execute on function public.character_unlock_summary(uuid) to service_role;

comment on function public.character_unlock_summary(uuid) is
  'ごほうびの開き方を決める3つの数だけを返します。記録の中身は返しません。service_role だけが呼べます（No.019.5・裁定その61）。';
