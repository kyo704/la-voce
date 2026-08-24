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
// category: hat | outfit | floor | wall | window | scenery | furniture | garden
// slot持ちのカテゴリ（hat/outfit/floor/wall/window/scenery）は1つだけ装備、
// furniture / garden は複数同時に配置可能。

export const SHOP_ITEMS = [
  // 帽子（頭）
  { key: "hat_straw", category: "hat", cost: 5, nameKey: "itemHatStraw" },
  { key: "hat_knit", category: "hat", cost: 30, nameKey: "itemHatKnit" },
  { key: "hat_ribbon", category: "hat", cost: 40, nameKey: "itemHatRibbon" },

  // 服（体）
  { key: "outfit_scarf", category: "outfit", cost: 20, nameKey: "itemOutfitScarf" },
  { key: "outfit_overall", category: "outfit", cost: 60, nameKey: "itemOutfitOverall" },
  { key: "outfit_sweater", category: "outfit", cost: 50, nameKey: "itemOutfitSweater" },

  // 床（大物なので高め）
  { key: "floor_tile", category: "floor", cost: 70, nameKey: "itemFloorTile" },
  { key: "floor_carpet", category: "floor", cost: 70, nameKey: "itemFloorCarpet" },

  // 壁（大物なので高め）
  { key: "wall_stripe", category: "wall", cost: 70, nameKey: "itemWallStripe" },
  { key: "wall_wood", category: "wall", cost: 70, nameKey: "itemWallWood" },

  // 窓枠
  { key: "window_wood", category: "window", cost: 30, nameKey: "itemWindowWood" },
  { key: "window_blue", category: "window", cost: 30, nameKey: "itemWindowBlue" },

  // 窓の外の景色
  { key: "scenery_night", category: "scenery", cost: 50, nameKey: "itemSceneryNight" },
  { key: "scenery_sakura", category: "scenery", cost: 60, nameKey: "itemScenerySakura" },

  // 部屋の家具（複数設置可）
  { key: "furniture_bed", category: "furniture", cost: 50, nameKey: "itemFurnitureBed" },
  { key: "furniture_shelf", category: "furniture", cost: 50, nameKey: "itemFurnitureShelf" },
  { key: "furniture_plant", category: "furniture", cost: 30, nameKey: "itemFurniturePlant" },
  { key: "furniture_rug", category: "furniture", cost: 30, nameKey: "itemFurnitureRug" },

  // 庭の置物（複数設置可）
  { key: "garden_bench", category: "garden", cost: 40, nameKey: "itemGardenBench" },
  { key: "garden_fountain", category: "garden", cost: 60, nameKey: "itemGardenFountain" },
  { key: "garden_lantern", category: "garden", cost: 30, nameKey: "itemGardenLantern" },
  { key: "garden_flowerbed", category: "garden", cost: 40, nameKey: "itemGardenFlowerbed" }
];

export const SINGLE_SLOT_CATEGORIES = ["hat", "outfit", "floor", "wall", "window", "scenery"];
export const MULTI_SLOT_CATEGORIES = ["furniture", "garden"];

export function computeBalance(entries, pointsSpent) {
  return computeTotalEarned(entries) - (pointsSpent || 0);
}
