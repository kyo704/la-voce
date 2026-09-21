-- ★本番の 台帳から 写しました（place_interior_furniture_for_drift_measurement）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


update public.profiles
   set character_equipped = coalesce(character_equipped, '{}'::jsonb)
     || jsonb_build_object(
          'interior', coalesce(character_equipped -> 'interior', '{}'::jsonb)
            || jsonb_build_object(
                 'furniture', jsonb_build_array('furniture_01', 'furniture_04', 'furniture_02')
               ),
          'interiorPositions',
            coalesce(character_equipped -> 'interiorPositions', '{}'::jsonb)
            || jsonb_build_object(
                 'furniture_01', jsonb_build_object('left', 20.8, 'top', 75.2),
                 'furniture_04', jsonb_build_object('left', 54.2, 'top', 82.0),
                 'furniture_02', jsonb_build_object('left', 87.5, 'top', 75.0)
               )
        )
 where id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com');

