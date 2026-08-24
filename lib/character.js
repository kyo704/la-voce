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
  return points;
}

export function computeTotalEarned(entries) {
  return Object.values(entries).reduce((sum, e) => sum + computeEntryPoints(e), 0);
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
// category: hat | outfit | accessory | floor | wall | window | scenery | furniture | garden
// slot持ちのカテゴリ（hat/outfit/accessory/floor/wall/window/scenery）は1つだけ装備、
// furniture / garden は複数同時に配置可能。
//
// ★現在、動作確認のため全アイテムを cost: 0（無料）にしています。
// 本来の価格は origCost に保持してあるので、有料に戻す際は cost: item.origCost とすればOKです。

export const SHOP_ITEMS = [
  // 帽子（頭）
  { key: "hat_straw", category: "hat", cost: 0, origCost: 5, nameKey: "itemHatStraw" },
  { key: "hat_knit", category: "hat", cost: 0, origCost: 30, nameKey: "itemHatKnit" },
  { key: "hat_ribbon", category: "hat", cost: 0, origCost: 40, nameKey: "itemHatRibbon" },
  { key: "hat_western", category: "hat", cost: 0, origCost: 60, nameKey: "itemHatWestern" },
  { key: "hat_crown_king", category: "hat", cost: 0, origCost: 350, nameKey: "itemHatCrownKing" },
  { key: "hat_tiara_princess", category: "hat", cost: 0, origCost: 350, nameKey: "itemHatTiaraPrincess" },

  // 服（体）
  { key: "outfit_scarf", category: "outfit", cost: 0, origCost: 20, nameKey: "itemOutfitScarf" },
  { key: "outfit_overall", category: "outfit", cost: 0, origCost: 60, nameKey: "itemOutfitOverall" },
  { key: "outfit_sweater", category: "outfit", cost: 0, origCost: 50, nameKey: "itemOutfitSweater" },
  { key: "outfit_western", category: "outfit", cost: 0, origCost: 150, nameKey: "itemOutfitWestern" },
  { key: "outfit_kimono", category: "outfit", cost: 0, origCost: 130, nameKey: "itemOutfitKimono" },
  { key: "outfit_tuxedo", category: "outfit", cost: 0, origCost: 140, nameKey: "itemOutfitTuxedo" },

  // 持ち物（手に持つアクセサリー）
  { key: "accessory_staff", category: "accessory", cost: 0, origCost: 200, nameKey: "itemAccessoryStaff" },
  { key: "accessory_sword", category: "accessory", cost: 0, origCost: 220, nameKey: "itemAccessorySword" },

  // 床（大物なので高め）
  { key: "floor_tile", category: "floor", cost: 0, origCost: 70, nameKey: "itemFloorTile" },
  { key: "floor_carpet", category: "floor", cost: 0, origCost: 70, nameKey: "itemFloorCarpet" },
  { key: "floor_tatami", category: "floor", cost: 0, origCost: 80, nameKey: "itemFloorTatami" },
  { key: "floor_terracotta", category: "floor", cost: 0, origCost: 80, nameKey: "itemFloorTerracotta" },
  { key: "floor_indian", category: "floor", cost: 0, origCost: 80, nameKey: "itemFloorIndian" },
  { key: "floor_american", category: "floor", cost: 0, origCost: 80, nameKey: "itemFloorAmerican" },
  { key: "floor_chinese", category: "floor", cost: 0, origCost: 80, nameKey: "itemFloorChinese" },

  // 壁（大物なので高め）
  { key: "wall_stripe", category: "wall", cost: 0, origCost: 70, nameKey: "itemWallStripe" },
  { key: "wall_wood", category: "wall", cost: 0, origCost: 70, nameKey: "itemWallWood" },
  { key: "wall_washi", category: "wall", cost: 0, origCost: 80, nameKey: "itemWallWashi" },
  { key: "wall_mediterranean", category: "wall", cost: 0, origCost: 80, nameKey: "itemWallMediterranean" },
  { key: "wall_indian", category: "wall", cost: 0, origCost: 80, nameKey: "itemWallIndian" },
  { key: "wall_american", category: "wall", cost: 0, origCost: 80, nameKey: "itemWallAmerican" },
  { key: "wall_chinese", category: "wall", cost: 0, origCost: 80, nameKey: "itemWallChinese" },

  // 窓枠
  { key: "window_wood", category: "window", cost: 0, origCost: 30, nameKey: "itemWindowWood" },
  { key: "window_blue", category: "window", cost: 0, origCost: 30, nameKey: "itemWindowBlue" },
  { key: "window_shoji", category: "window", cost: 0, origCost: 50, nameKey: "itemWindowShoji" },
  { key: "window_mediterranean", category: "window", cost: 0, origCost: 50, nameKey: "itemWindowMediterranean" },
  { key: "window_indian", category: "window", cost: 0, origCost: 50, nameKey: "itemWindowIndian" },
  { key: "window_american", category: "window", cost: 0, origCost: 50, nameKey: "itemWindowAmerican" },
  { key: "window_chinese", category: "window", cost: 0, origCost: 50, nameKey: "itemWindowChinese" },
  { key: "window_stained_glass", category: "window", cost: 0, origCost: 90, nameKey: "itemWindowStainedGlass" },
  { key: "window_porthole", category: "window", cost: 0, origCost: 60, nameKey: "itemWindowPorthole" },

  // 窓の外の景色
  { key: "scenery_night", category: "scenery", cost: 0, origCost: 50, nameKey: "itemSceneryNight" },
  { key: "scenery_sakura", category: "scenery", cost: 0, origCost: 60, nameKey: "itemScenerySakura" },
  { key: "scenery_aurora", category: "scenery", cost: 0, origCost: 90, nameKey: "itemSceneryAurora" },
  { key: "scenery_ocean", category: "scenery", cost: 0, origCost: 70, nameKey: "itemSceneryOcean" },

  // 部屋の家具（複数設置可）
  { key: "furniture_bed", category: "furniture", cost: 0, origCost: 50, nameKey: "itemFurnitureBed" },
  { key: "furniture_shelf", category: "furniture", cost: 0, origCost: 50, nameKey: "itemFurnitureShelf" },
  { key: "furniture_plant", category: "furniture", cost: 0, origCost: 30, nameKey: "itemFurniturePlant" },
  { key: "furniture_rug", category: "furniture", cost: 0, origCost: 30, nameKey: "itemFurnitureRug" },
  { key: "furniture_chair", category: "furniture", cost: 0, origCost: 45, nameKey: "itemFurnitureChair" },
  { key: "furniture_piano", category: "furniture", cost: 0, origCost: 120, nameKey: "itemFurniturePiano" },

  // 庭の置物（複数設置可）
  { key: "garden_bench", category: "garden", cost: 0, origCost: 40, nameKey: "itemGardenBench" },
  { key: "garden_fountain", category: "garden", cost: 0, origCost: 60, nameKey: "itemGardenFountain" },
  { key: "garden_lantern", category: "garden", cost: 0, origCost: 30, nameKey: "itemGardenLantern" },
  { key: "garden_flowerbed", category: "garden", cost: 0, origCost: 40, nameKey: "itemGardenFlowerbed" },
  { key: "garden_field", category: "garden", cost: 0, origCost: 90, nameKey: "itemGardenField" },
  { key: "garden_gazebo", category: "garden", cost: 0, origCost: 100, nameKey: "itemGardenGazebo" },
  { key: "garden_pond", category: "garden", cost: 0, origCost: 90, nameKey: "itemGardenPond" }
];

export const SINGLE_SLOT_CATEGORIES = ["hat", "outfit", "accessory", "floor", "wall", "window", "scenery"];
export const MULTI_SLOT_CATEGORIES = ["furniture", "garden"];

export function computeBalance(entries, pointsSpent) {
  return computeTotalEarned(entries) - (pointsSpent || 0);
}
