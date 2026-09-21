-- ★本番の 台帳から 写しました（place_test_furniture_for_room_drift_measurement）。
--   ★★出どころ …… supabase_migrations.schema_migrations
--   ★★手で 書いた ものでは ありません。★2026-09-22 に 読み出しました。
--   ★★★この 置き場は FX7（試しを 本番の 移行から 作り直す）が 見ます。


update public.profiles
   set character_equipped = coalesce(character_equipped, '{}'::jsonb)
     || jsonb_build_object(
          'furniture', jsonb_build_array('furniture_rug', 'furniture_chair', 'furniture_plant'),
          'furniturePositions', jsonb_build_object(
            'furniture_bed',   jsonb_build_object('top', 99,   'left', 29.2),
            'furniture_rug',   jsonb_build_object('top', 82,   'left', 54.2),
            'furniture_chair', jsonb_build_object('top', 75,   'left', 87.5),
            'furniture_plant', jsonb_build_object('top', 75.2, 'left', 20.8),
            'furniture_shelf', jsonb_build_object('top', 70.1, 'left', 91.7)
          )
        )
 where id = (select id from auth.users where email = 'kyo0703opera+forcode@gmail.com');

