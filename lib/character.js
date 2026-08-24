// 羊のキャラクター育成・カスタマイズのロジック。
// ポイントは「記録を続けたかどうか」だけで貯まります（体調の良し悪しでは変化しません）。
// 貯まったポイントは、服・部屋・庭のアイテムと自由に交換（購入）できます。

export function computeEntryPoints(entry) {
  if (!entry) return 0;
  let points = 1; // その日「記録した」こと自体への基礎ポイント
  if (typeof entry.sleepHours === "number" && entry.sleepHours > 0) points += 1;
  if (Object.values(entry.waterBySlot || {}).some((v) => Number(v) > 0)) points += 1;
  if ((entry.meals || []).length > 0) points += 1;
  if ((entry.exercises || []).length > 0) points += 1;
  if (entry.weightKg) points += 1;
  if ((entry.notes || "").trim() || (entry.voiceMemo || "").trim() || (entry.mentalReason || "").trim()) points += 1;
  // ここから声楽ならではの記録（他の健康アプリには無い、La Voce独自の項目）にボーナスを追加。
  // 「文字数」や「項目数」ではなく、あくまで「その項目を使ったかどうか」だけで判定するので、
  // 水増しのインセンティブにはならない。
  if ((entry.wakeNote || "").trim() || (entry.routineNote || "").trim()) points += 1; // 起き抜け・発声後の声の高さのメモ
  if (entry.resonanceScore !== "" && entry.resonanceScore != null) points += 1; // 響きスコア
  if ((entry.throatSymptoms || []).length > 0) points += 1; // 具体的な喉の症状の記録
  return points;
}

// 「初めてその項目を使った日」に、毎日のポイントとは別枠で一度だけ加算されるボーナス。
// 新しい機能に気づいて試してもらうためのもので、書けば書くほど増える仕組みとは別軸。
const FIRST_USE_TRACKS = [
  { key: "sleepHours", test: (e) => typeof e.sleepHours === "number" && e.sleepHours > 0 },
  { key: "waterBySlot", test: (e) => Object.values(e.waterBySlot || {}).some((v) => Number(v) > 0) },
  { key: "meals", test: (e) => (e.meals || []).length > 0 },
  { key: "exercises", test: (e) => (e.exercises || []).length > 0 },
  { key: "weightKg", test: (e) => !!e.weightKg },
  { key: "notes", test: (e) => (e.notes || "").trim() || (e.voiceMemo || "").trim() || (e.mentalReason || "").trim() },
  { key: "pitchNote", test: (e) => (e.wakeNote || "").trim() || (e.routineNote || "").trim() },
  { key: "resonanceScore", test: (e) => e.resonanceScore !== "" && e.resonanceScore != null },
  { key: "throatSymptoms", test: (e) => (e.throatSymptoms || []).length > 0 }
];
const FIRST_USE_BONUS = 3;

export function computeFirstUseBonus(entries) {
  const dates = Object.keys(entries || {}).sort();
  let bonus = 0;
  for (const track of FIRST_USE_TRACKS) {
    if (dates.some((d) => track.test(entries[d]))) bonus += FIRST_USE_BONUS;
  }
  return bonus;
}

export function computeTotalEarned(entries) {
  const daily = Object.values(entries).reduce((sum, e) => sum + computeEntryPoints(e), 0);
  return daily + computeFirstUseBonus(entries);
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function computeStreaks(entries) {
  const dates = Object.keys(entries).sort();
  const dateSet = new Set(dates);
  let longestStreak = 0;
  let running = 0;
  let prevDate = null;
  dates.forEach((d) => {
    if (prevDate) {
      const diffDays = Math.round((new Date(d + "T00:00:00") - new Date(prevDate + "T00:00:00")) / 86400000);
      running = diffDays === 1 ? running + 1 : 1;
    } else {
      running = 1;
    }
    longestStreak = Math.max(longestStreak, running);
    prevDate = d;
  });
  let currentStreak = 0;
  const cursor = new Date();
  if (!dateSet.has(toISODate(cursor))) cursor.setDate(cursor.getDate() - 1);
  while (dateSet.has(toISODate(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return { currentStreak, longestStreak };
}

// ===== ショップカタログ =====
// category: hat | outfit | accessory | floor | wall | window | scenery | backdrop | furniture | garden | wallhang
// slot持ちのカテゴリ（hat/outfit/accessory/floor/wall/window/scenery/backdrop）は1つだけ装備、
// furniture / garden / wallhang は複数同時に配置可能。
//
// 価格は「1日の記録で平均5pt貯まる」という想定を基準に設計。
// 5pt=1日、15pt=3日、35pt=1週間、70pt=2週間、150pt=1ヶ月、300pt=2ヶ月、450pt=3ヶ月、900pt=半年、1800pt=ほぼ1年。
// 安いものは数日、豪華なものは1ヶ月〜数ヶ月、部屋・庭の拡張は1年近く毎日続けないと届かない設計にしてある。

export const SHOP_ITEMS = [
  // 帽子（頭）
  { key: "hat_straw", category: "hat", cost: 5, origCost: 5, nameKey: "itemHatStraw" },
  { key: "hat_knit", category: "hat", cost: 30, origCost: 30, nameKey: "itemHatKnit" },
  { key: "hat_ribbon", category: "hat", cost: 40, origCost: 40, nameKey: "itemHatRibbon" },
  { key: "hat_western", category: "hat", cost: 60, origCost: 60, nameKey: "itemHatWestern" },
  { key: "hat_crown_king", category: "hat", cost: 400, origCost: 400, nameKey: "itemHatCrownKing" },
  { key: "hat_tiara_princess", category: "hat", cost: 400, origCost: 400, nameKey: "itemHatTiaraPrincess" },

  // 服（体）
  { key: "outfit_scarf", category: "outfit", cost: 20, origCost: 20, nameKey: "itemOutfitScarf" },
  { key: "outfit_overall", category: "outfit", cost: 60, origCost: 60, nameKey: "itemOutfitOverall" },
  { key: "outfit_sweater", category: "outfit", cost: 50, origCost: 50, nameKey: "itemOutfitSweater" },
  { key: "outfit_western", category: "outfit", cost: 150, origCost: 150, nameKey: "itemOutfitWestern" },
  { key: "outfit_kimono_male", category: "outfit", cost: 130, origCost: 130, nameKey: "itemOutfitKimonoMale" },
  { key: "outfit_kimono_female", category: "outfit", cost: 130, origCost: 130, nameKey: "itemOutfitKimonoFemale" },
  { key: "outfit_tuxedo", category: "outfit", cost: 140, origCost: 140, nameKey: "itemOutfitTuxedo" },
  { key: "outfit_tailcoat", category: "outfit", cost: 180, origCost: 180, nameKey: "itemOutfitTailcoat" },
  { key: "outfit_dress", category: "outfit", cost: 180, origCost: 180, nameKey: "itemOutfitDress" },
  { key: "outfit_king_robe", category: "outfit", cost: 500, origCost: 500, nameKey: "itemOutfitKingRobe" },

  // 持ち物（手に持つアクセサリー）
  { key: "accessory_staff", category: "accessory", cost: 200, origCost: 200, nameKey: "itemAccessoryStaff" },
  { key: "accessory_sword", category: "accessory", cost: 220, origCost: 220, nameKey: "itemAccessorySword" },
  { key: "accessory_chopsticks", category: "accessory", cost: 8, origCost: 8, nameKey: "itemAccessoryChopsticks" },
  { key: "accessory_fork", category: "accessory", cost: 8, origCost: 8, nameKey: "itemAccessoryFork" },
  { key: "accessory_bottle", category: "accessory", cost: 15, origCost: 15, nameKey: "itemAccessoryBottle" },
  { key: "accessory_pet_bottle", category: "accessory", cost: 8, origCost: 8, nameKey: "itemAccessoryPetBottle" },

  // 床（大物なので高め）
  { key: "floor_tile", category: "floor", cost: 70, origCost: 70, nameKey: "itemFloorTile" },
  { key: "floor_carpet", category: "floor", cost: 70, origCost: 70, nameKey: "itemFloorCarpet" },
  { key: "floor_tatami", category: "floor", cost: 80, origCost: 80, nameKey: "itemFloorTatami" },
  { key: "floor_terracotta", category: "floor", cost: 80, origCost: 80, nameKey: "itemFloorTerracotta" },
  { key: "floor_indian", category: "floor", cost: 80, origCost: 80, nameKey: "itemFloorIndian" },
  { key: "floor_american", category: "floor", cost: 80, origCost: 80, nameKey: "itemFloorAmerican" },
  { key: "floor_chinese", category: "floor", cost: 80, origCost: 80, nameKey: "itemFloorChinese" },

  // 壁（大物なので高め）
  { key: "wall_stripe", category: "wall", cost: 70, origCost: 70, nameKey: "itemWallStripe" },
  { key: "wall_wood", category: "wall", cost: 70, origCost: 70, nameKey: "itemWallWood" },
  { key: "wall_washi", category: "wall", cost: 80, origCost: 80, nameKey: "itemWallWashi" },
  { key: "wall_mediterranean", category: "wall", cost: 80, origCost: 80, nameKey: "itemWallMediterranean" },
  { key: "wall_indian", category: "wall", cost: 80, origCost: 80, nameKey: "itemWallIndian" },
  { key: "wall_american", category: "wall", cost: 80, origCost: 80, nameKey: "itemWallAmerican" },
  { key: "wall_chinese", category: "wall", cost: 80, origCost: 80, nameKey: "itemWallChinese" },
  { key: "wall_wainscoting", category: "wall", cost: 90, origCost: 90, nameKey: "itemWallWainscoting" },

  // 窓枠
  { key: "window_wood", category: "window", cost: 20, origCost: 20, nameKey: "itemWindowWood" },
  { key: "window_blue", category: "window", cost: 20, origCost: 20, nameKey: "itemWindowBlue" },
  { key: "window_shoji", category: "window", cost: 50, origCost: 50, nameKey: "itemWindowShoji" },
  { key: "window_mediterranean", category: "window", cost: 50, origCost: 50, nameKey: "itemWindowMediterranean" },
  { key: "window_indian", category: "window", cost: 50, origCost: 50, nameKey: "itemWindowIndian" },
  { key: "window_american", category: "window", cost: 50, origCost: 50, nameKey: "itemWindowAmerican" },
  { key: "window_chinese", category: "window", cost: 50, origCost: 50, nameKey: "itemWindowChinese" },
  { key: "window_stained_glass", category: "window", cost: 90, origCost: 90, nameKey: "itemWindowStainedGlass" },
  { key: "window_porthole", category: "window", cost: 60, origCost: 60, nameKey: "itemWindowPorthole" },
  { key: "window_bamboo_washi", category: "window", cost: 70, origCost: 70, nameKey: "itemWindowBambooWashi" },
  { key: "window_grand", category: "window", cost: 150, origCost: 150, nameKey: "itemWindowGrand" },

  // 窓の外の景色
  { key: "scenery_night", category: "scenery", cost: 50, origCost: 50, nameKey: "itemSceneryNight" },
  { key: "scenery_sakura", category: "scenery", cost: 60, origCost: 60, nameKey: "itemScenerySakura" },
  { key: "scenery_aurora", category: "scenery", cost: 90, origCost: 90, nameKey: "itemSceneryAurora" },
  { key: "scenery_ocean", category: "scenery", cost: 70, origCost: 70, nameKey: "itemSceneryOcean" },
  { key: "scenery_italy", category: "scenery", cost: 80, origCost: 80, nameKey: "itemSceneryItaly" },
  { key: "scenery_germany", category: "scenery", cost: 80, origCost: 80, nameKey: "itemSceneryGermany" },
  { key: "scenery_france", category: "scenery", cost: 80, origCost: 80, nameKey: "itemSceneryFrance" },

  // 庭の背景（山並みの見え方）／部屋の空間拡張
  { key: "backdrop_mountains_near", category: "backdrop", cost: 100, origCost: 100, nameKey: "itemBackdropMountainsNear" },
  { key: "backdrop_mountains_huge", category: "backdrop", cost: 300, origCost: 300, nameKey: "itemBackdropMountainsHuge" },
  { key: "backdrop_room_expand", category: "backdrop", cost: 1800, origCost: 1800, nameKey: "itemBackdropRoomExpand" },
  { key: "backdrop_garden_expand", category: "backdrop", cost: 1800, origCost: 1800, nameKey: "itemBackdropGardenExpand" },
  { key: "backdrop_western_castle", category: "backdrop", cost: 250, origCost: 250, nameKey: "itemBackdropWesternCastle" },
  { key: "backdrop_japanese_castle", category: "backdrop", cost: 250, origCost: 250, nameKey: "itemBackdropJapaneseCastle" },
  { key: "backdrop_bamboo_grove", category: "backdrop", cost: 180, origCost: 180, nameKey: "itemBackdropBambooGrove" },
  { key: "backdrop_forest", category: "backdrop", cost: 180, origCost: 180, nameKey: "itemBackdropForest" },
  { key: "backdrop_sheep_pasture", category: "backdrop", cost: 220, origCost: 220, nameKey: "itemBackdropSheepPasture" },
  { key: "backdrop_big_man", category: "backdrop", cost: 200, origCost: 200, nameKey: "itemBackdropBigMan" },

  // 部屋の家具（複数設置可・sizeで一度に置ける数を制限）
  { key: "furniture_bed", category: "furniture", size: "large", cost: 60, origCost: 60, nameKey: "itemFurnitureBed" },
  { key: "furniture_shelf", category: "furniture", size: "small", cost: 50, origCost: 50, nameKey: "itemFurnitureShelf" },
  { key: "furniture_plant", category: "furniture", size: "small", cost: 25, origCost: 25, nameKey: "itemFurniturePlant" },
  { key: "furniture_rug", category: "furniture", size: "small", cost: 30, origCost: 30, nameKey: "itemFurnitureRug" },
  { key: "furniture_chair", category: "furniture", size: "small", cost: 45, origCost: 45, nameKey: "itemFurnitureChair" },
  { key: "furniture_piano", category: "furniture", size: "large", cost: 200, origCost: 200, nameKey: "itemFurniturePiano" },

  // 庭の置物（複数設置可・sizeで一度に置ける数を制限）
  { key: "garden_bench", category: "garden", size: "small", cost: 35, origCost: 35, nameKey: "itemGardenBench" },
  { key: "garden_fountain", category: "garden", size: "small", cost: 70, origCost: 70, nameKey: "itemGardenFountain" },
  { key: "garden_lantern", category: "garden", size: "small", cost: 25, origCost: 25, nameKey: "itemGardenLantern" },
  { key: "garden_flowerbed", category: "garden", size: "small", cost: 35, origCost: 35, nameKey: "itemGardenFlowerbed" },
  { key: "garden_field", category: "garden", size: "small", cost: 100, origCost: 100, nameKey: "itemGardenField" },
  { key: "garden_gazebo", category: "garden", size: "large", cost: 150, origCost: 150, nameKey: "itemGardenGazebo" },
  { key: "garden_pond", category: "garden", size: "large", cost: 130, origCost: 130, nameKey: "itemGardenPond" },
  { key: "garden_hay_bale", category: "garden", size: "small", cost: 20, origCost: 20, nameKey: "itemGardenHayBale" },

  // 壁掛けアイテム（複数設置可・床ではなく壁のエリアにのみ置ける）
  { key: "wallhang_painting", category: "wallhang", size: "small", cost: 60, origCost: 60, nameKey: "itemWallhangPainting" },
  { key: "wallhang_lamp", category: "wallhang", size: "small", cost: 45, origCost: 45, nameKey: "itemWallhangLamp" },
  { key: "wallhang_candle", category: "wallhang", size: "small", cost: 20, origCost: 20, nameKey: "itemWallhangCandle" },
  { key: "wallhang_hanger", category: "wallhang", size: "small", cost: 25, origCost: 25, nameKey: "itemWallhangHanger" },
  { key: "wallhang_clock", category: "wallhang", size: "small", cost: 60, origCost: 60, nameKey: "itemWallhangClock" }
];

export const SINGLE_SLOT_CATEGORIES = ["hat", "outfit", "accessory", "floor", "wall", "window", "scenery", "backdrop"];
export const MULTI_SLOT_CATEGORIES = ["furniture", "garden", "wallhang"];

// 一度に配置できる数の上限(sizeカテゴリごと)。大きいアイテムは同時に2つまで、小さいアイテムは4つまで。
export const PLACEMENT_LIMITS = { large: 2, small: 4 };

export function computeBalance(entries, pointsSpent) {
  return computeTotalEarned(entries) - (pointsSpent || 0);
}
