-- 実機で見るために、坂本さんのご自身の口座へ、品物を入れます（2026年9月6日）
--
--   ★入れる先 user_id = 99b695d8-ae90-43a5-9767-a8d073a4003d
--     ★kyo0703opera@gmail.com（★ご自身の口座だけです）
--
--   ★★ポイントは減りません。
--     ★character_points_spent には触れていません。
--     ★お店では「持っている」表示になり、★残りポイントは今のままです。
--
--   ★★何度でも流して大丈夫です。
--     ★すでにお持ちのものは、★もう1行作りません（where not exists）。
--     ★★unique 制約が有っても無くても、★正しく動く書き方にしています。
--       ★受けとった表の形： id uuid ／ user_id uuid ／ item_key text
--         ／ purchased_at timestamptz
--       ★where not exists と on conflict do nothing の、★二重にしています。
--         ★where not exists は、★unique 制約が無くても効きます。
--         ★on conflict do nothing は、★同時に流したときの取りこぼしを防ぎます。
--
--   ★★消しません。★1行も消しません。

-- ===========================================================================
-- ★はじめに：表の形を見せてください（読むだけ）
-- ===========================================================================
select column_name as 列, data_type as 型, is_nullable as 空を許すか,
       column_default as 既定値
from information_schema.columns
where table_schema = 'public' and table_name = 'character_inventory'
order by ordinal_position;

-- ★★ここで見ていただきたいのは、★id と purchased_at の「既定値」です。
--   ★id に gen_random_uuid() などの既定値が入っていれば、そのまま流せます。
--   ★もし空欄なら、★insert に id を足す必要があります。お知らせください。

-- ===========================================================================
-- A：新しい着せかえ 217点
-- ===========================================================================
insert into public.character_inventory (user_id, item_key)
select '99b695d8-ae90-43a5-9767-a8d073a4003d'::uuid, k
from (values
    ('coatSpringCardigan'),
    ('coatSummerVest'),
    ('coatAutumnCamel'),
    ('coatWinterDuffle'),
    ('kimonoRedSakura'),
    ('kimonoYellowYagasuri'),
    ('kimonoBlueSeigaiha'),
    ('kimonoManNavyHaori'),
    ('hatBeret'),
    ('hatKnit'),
    ('hatStraw'),
    ('hatTop'),
    ('hatCasquette'),
    ('hatFlowerCrown'),
    ('scarfWine'),
    ('scarfCheck'),
    ('snoodCream'),
    ('ribbonTie'),
    ('propScore'),
    ('propMetronome'),
    ('propBottle'),
    ('propBouquet'),
    ('propTeacup'),
    ('shoesBoots'),
    ('shoesGeta'),
    ('shoesZori'),
    ('shoesSneakers'),
    ('shoesMaryJane'),
    ('shoesRainBoots'),
    ('shoesStagePumps'),
    ('shoesWaraji'),
    ('jomonKantoui'),
    ('jomonFur'),
    ('yayoiKantoui'),
    ('yayoiKesa'),
    ('kofunKinuHakama'),
    ('kofunKinuMo'),
    ('asukaChofuku'),
    ('asukaHire'),
    ('naraHoueki'),
    ('naraKarniginu'),
    ('heianJunihitoe'),
    ('heianNoushi'),
    ('kamakuraHitatare'),
    ('kamakuraTsubo'),
    ('muromachiSuou'),
    ('muromachiKosode'),
    ('momoyamaDoufuku'),
    ('momoyamaUchikake'),
    ('edoShima'),
    ('edoFurisode'),
    ('meijiShosei'),
    ('meijiRokumeikan'),
    ('taishoModanBoy'),
    ('taishoJogakusei'),
    ('showaGakuran'),
    ('showaOnepiece'),
    ('heiseiShibukaji'),
    ('heiseiSeifuku'),
    ('reiwaOversize'),
    ('reiwaEarth'),
    ('hatJomonBeads'),
    ('hatYayoiHachimaki'),
    ('hatKofunBoushi'),
    ('hatAsukaKanmuri'),
    ('hatNaraZukin'),
    ('hatHeianEboshi'),
    ('hatIchimegasa'),
    ('hatSamuraiEboshi'),
    ('hatNanban'),
    ('hatSugegasa'),
    ('hatBowler'),
    ('hatHunting'),
    ('hatGakubo'),
    ('hatCap'),
    ('hatBucket'),
    ('propJomonPot'),
    ('propYayoiRice'),
    ('propKofunMagatama'),
    ('propAsukaShaku'),
    ('propNaraBiwa'),
    ('propHeianOugi'),
    ('propKamakuraMakimono'),
    ('propMuromachiNohmen'),
    ('propMomoyamaChawan'),
    ('propEdoChochin'),
    ('propMeijiStick'),
    ('propTaishoGramophone'),
    ('propShowaCamera'),
    ('propHeiseiKeitai'),
    ('propReiwaSmartphone'),
    ('wearUSAWestern'),
    ('wearHawaiiAloha'),
    ('wearItalyCarnival'),
    ('wearGermanyLederhosen'),
    ('wearFranceMariniere'),
    ('wearNetherlandsVolendam'),
    ('wearSwissAppenzell'),
    ('wearSpainFlamenco'),
    ('wearChinaHanfu'),
    ('wearKoreaHanbok'),
    ('wearRussiaSarafan'),
    ('wearAustriaCourt'),
    ('wearUKKilt'),
    ('hatUSACowboy'),
    ('hatHawaiiHibiscus'),
    ('hatItalyTricorno'),
    ('hatGermanyTirol'),
    ('hatFranceBeret'),
    ('hatNetherlandsCap'),
    ('hatSwissEdelweiss'),
    ('hatSpainMantilla'),
    ('hatChinaOrnament'),
    ('hatKoreaJokduri'),
    ('hatRussiaKokoshnik'),
    ('hatAustriaWig'),
    ('hatUKDeerstalker'),
    ('propUSAGuitar'),
    ('propHawaiiUkulele'),
    ('propItalyMask'),
    ('propGermanyPretzel'),
    ('propFranceBaguette'),
    ('propNetherlandsTulip'),
    ('propSwissCheese'),
    ('propSpainAbanico'),
    ('propChinaUchiwa'),
    ('propKoreaJanggu'),
    ('propRussiaMatryoshka'),
    ('propAustriaTorte'),
    ('propUKTea'),
    ('suitNavy'),
    ('suitLadyGray'),
    ('tuxedo'),
    ('tailcoat'),
    ('hatFedora'),
    ('propBriefcase'),
    ('propMusicBag'),
    ('propNewspaper'),
    ('propUmbrella'),
    ('propCoffee'),
    ('wearOyoroi'),
    ('wearGusoku'),
    ('wearJinbaori'),
    ('hatKabuto'),
    ('hatJingasa'),
    ('propTachi'),
    ('propYumiya'),
    ('propGunbai'),
    ('wearMasamune'),
    ('wearYukimura'),
    ('wearIeyasu'),
    ('wearShingen'),
    ('wearKenshin'),
    ('wearKanetsugu'),
    ('wearNobunaga'),
    ('wearNaomasa'),
    ('hatKabutoMasamune'),
    ('hatKabutoYukimura'),
    ('hatKabutoIeyasu'),
    ('hatKabutoShingen'),
    ('hatKabutoKenshin'),
    ('hatKabutoKanetsugu'),
    ('hatKabutoNobunaga'),
    ('hatKabutoNaomasa'),
    ('gownBlackLong'),
    ('gownWineMermaid'),
    ('gownGreenVelvet'),
    ('gownGoldALine'),
    ('operaQueenNight'),
    ('operaVioletta'),
    ('operaPapageno'),
    ('operaBruennhilde'),
    ('operaTurandot'),
    ('operaAida'),
    ('operaNorma'),
    ('operaLucia'),
    ('operaButterfly'),
    ('operaMimi'),
    ('operaMusetta'),
    ('operaCherubino'),
    ('operaOlympia'),
    ('operaGilda'),
    ('operaCarmen2'),
    ('gownCoutureFifties'),
    ('gownTulleBall'),
    ('gownBeadColumn'),
    ('gownVelvetCape'),
    ('hatValkyrie'),
    ('hatTurandotCrown'),
    ('hatNormaWreath'),
    ('hatMusettaHat'),
    ('hatCherubinoHat'),
    ('hatLuciaHair'),
    ('hatButterflyTsuno'),
    ('propSpear'),
    ('propFanLace'),
    ('operaFigaro'),
    ('operaDonGiovanni'),
    ('operaRodolfo'),
    ('operaEscamillo'),
    ('operaRigoletto'),
    ('operaTamino'),
    ('operaWotan'),
    ('operaCalaf'),
    ('hatMontera'),
    ('hatJester'),
    ('hatTricornBlack'),
    ('hatWotanHat'),
    ('hatHunterGreen'),
    ('propSword'),
    ('propBaton'),
    ('propRazorComb'),
    ('propManuscript'),
    ('hatCrownNight'),
    ('hatCamellia'),
    ('hatRose'),
    ('hatFeatherCap')
  ) as t(k)
where not exists (
  select 1 from public.character_inventory c
  where c.user_id = '99b695d8-ae90-43a5-9767-a8d073a4003d'::uuid and c.item_key = t.k
)
on conflict do nothing;

-- ===========================================================================
-- B：古い、身につけるもの 22点
--     ★いまは絵の羊に出ません。★まとめ（案1）が終わると出るようになります。
-- ===========================================================================
insert into public.character_inventory (user_id, item_key)
select '99b695d8-ae90-43a5-9767-a8d073a4003d'::uuid, k
from (values
    ('hat_straw'),
    ('hat_knit'),
    ('hat_ribbon'),
    ('hat_western'),
    ('hat_crown_king'),
    ('hat_tiara_princess'),
    ('outfit_scarf'),
    ('outfit_overall'),
    ('outfit_sweater'),
    ('outfit_western'),
    ('outfit_kimono_male'),
    ('outfit_kimono_female'),
    ('outfit_tuxedo'),
    ('outfit_tailcoat'),
    ('outfit_dress'),
    ('outfit_king_robe'),
    ('accessory_staff'),
    ('accessory_sword'),
    ('accessory_chopsticks'),
    ('accessory_fork'),
    ('accessory_bottle'),
    ('accessory_pet_bottle')
  ) as t(k)
where not exists (
  select 1 from public.character_inventory c
  where c.user_id = '99b695d8-ae90-43a5-9767-a8d073a4003d'::uuid and c.item_key = t.k
)
on conflict do nothing;

-- ===========================================================================
-- C：おうちの道具 79点（★壁と床の新しい17点を含みます）
--     ★★内装をご覧になるには、★これが要ります。
--       ★持っていない壁紙は、★お部屋に敷けません。
-- ===========================================================================
insert into public.character_inventory (user_id, item_key)
select '99b695d8-ae90-43a5-9767-a8d073a4003d'::uuid, k
from (values
    ('floor_tile'),
    ('floor_carpet'),
    ('floor_tatami'),
    ('floor_terracotta'),
    ('floor_indian'),
    ('floor_american'),
    ('floor_chinese'),
    ('floor_natural'),
    ('floor_modern'),
    ('floor_nordic'),
    ('floor_asian'),
    ('floor_industrial'),
    ('floor_country'),
    ('floor_hotel'),
    ('floor_mix'),
    ('wall_stripe'),
    ('wall_wood'),
    ('wall_washi'),
    ('wall_mediterranean'),
    ('wall_indian'),
    ('wall_american'),
    ('wall_chinese'),
    ('wall_wainscoting'),
    ('wall_natural'),
    ('wall_modern'),
    ('wall_nordic'),
    ('wall_asian'),
    ('wall_industrial'),
    ('wall_country'),
    ('wall_hotel'),
    ('wall_mix'),
    ('wall_industrialBrick'),
    ('window_wood'),
    ('window_blue'),
    ('window_shoji'),
    ('window_mediterranean'),
    ('window_indian'),
    ('window_american'),
    ('window_chinese'),
    ('window_stained_glass'),
    ('window_porthole'),
    ('window_bamboo_washi'),
    ('window_grand'),
    ('scenery_night'),
    ('scenery_sakura'),
    ('scenery_aurora'),
    ('scenery_ocean'),
    ('scenery_italy'),
    ('scenery_germany'),
    ('scenery_france'),
    ('backdrop_mountains_near'),
    ('backdrop_mountains_huge'),
    ('backdrop_room_expand'),
    ('backdrop_garden_expand'),
    ('backdrop_western_castle'),
    ('backdrop_japanese_castle'),
    ('backdrop_bamboo_grove'),
    ('backdrop_forest'),
    ('backdrop_sheep_pasture'),
    ('backdrop_big_man'),
    ('furniture_bed'),
    ('furniture_shelf'),
    ('furniture_plant'),
    ('furniture_rug'),
    ('furniture_chair'),
    ('furniture_piano'),
    ('garden_bench'),
    ('garden_fountain'),
    ('garden_lantern'),
    ('garden_flowerbed'),
    ('garden_field'),
    ('garden_gazebo'),
    ('garden_pond'),
    ('garden_hay_bale'),
    ('wallhang_painting'),
    ('wallhang_lamp'),
    ('wallhang_candle'),
    ('wallhang_hanger'),
    ('wallhang_clock')
  ) as t(k)
where not exists (
  select 1 from public.character_inventory c
  where c.user_id = '99b695d8-ae90-43a5-9767-a8d073a4003d'::uuid and c.item_key = t.k
)
on conflict do nothing;

-- ===========================================================================
-- ★おわりに：何点になったか（読むだけ）
-- ===========================================================================
select count(*) as 持っている点数
from public.character_inventory
where user_id = '99b695d8-ae90-43a5-9767-a8d073a4003d'::uuid;

-- ★A＋B＋C をぜんぶ流すと、318点になります。
