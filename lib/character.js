// 羊のキャラクター育成・カスタマイズのロジック。
// ポイントは「記録を続けたかどうか」だけで貯まります（体調の良し悪しでは変化しません）。
// 貯まったポイントは、服・部屋・庭のアイテムと自由に交換（購入）できます。

// ============================================================================
// ポイントの計算ルール
//
// 統合実行ルートv4 §11「かんたん記録のポイント・連続記録を減点しない」に従い、
// 2026-08-27 以降の記録は「その日に記録したかどうか」だけでポイントが決まります。
// それ以前は、項目数で増える旧ルールのままです。
//
// ★なぜ切替日を持つのか
//   所持ポイントは entries から毎回計算し直しているため、計算式を丸ごと変えると
//   過去に貯めた残高まで書き換わってしまいます。切替日より前の記録には旧ルールを
//   適用し続けることで、既に貯まっているポイントを1ptも動かさずに移行できます。
//   この日付は動かさないでください。動かすと過去の残高が変わります。
// ============================================================================
export const POINTS_RULE_V2_FROM = "2026-08-27";

// 1日分のポイント。旧ルールの「基礎1pt＋項目ごとに加算」の平均的な値に合わせてある。
export const DAILY_POINTS = 5;

// その日、何か記録したか。かんたん記録（声・活動・睡眠）だけでも成立する。
// ★項目の数は数えません。数えた瞬間に、かんたん記録が減点になるためです。
export function hasAnyRecord(entry) {
  if (!entry) return false;
  if ((entry.voiceEntries || []).length > 0) return true;
  if (typeof entry.throatCondition === "number" || typeof entry.voiceQuality === "number") return true;
  if (typeof entry.sleepHours === "number" && entry.sleepHours > 0) return true;
  if ((entry.activities || []).length > 0 || entry.recovery) return true;
  // 上のコア以外しか記録していない日も、記録した日として扱う（開いてくれた日を無にしない）。
  if ((entry.meals || []).length > 0) return true;
  if ((entry.exercises || []).length > 0) return true;
  if (entry.weightKg) return true;
  if (Object.values(entry.waterBySlot || {}).some((v) => Number(v) > 0)) return true;
  if ((entry.throatSymptoms || []).length > 0) return true;
  if ((entry.notes || "").trim() || (entry.voiceMemo || "").trim() || (entry.mentalReason || "").trim()) return true;
  return false;
}

/**
 * その日のポイント。
 * @param {object} entry
 * @param {string} [date] 記録日（YYYY-MM-DD）。切替日の判定に使う。
 *   省略された場合は旧ルールで計算する（過去データの再計算を壊さないため）。
 */
export function computeEntryPoints(entry, date) {
  if (!entry) return 0;
  if (date && date >= POINTS_RULE_V2_FROM) {
    return hasAnyRecord(entry) ? DAILY_POINTS : 0;
  }
  return computeEntryPointsLegacy(entry);
}

// 旧ルール（2026-08-27 より前の記録にのみ適用）。項目数で増えるため、
// かんたん記録の人が構造的に不利になっていた。★過去の残高を保つためだけに残しています。
function computeEntryPointsLegacy(entry) {
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
  if (entry.resonanceScore !== "" && entry.resonanceScore != null) points += 1; // 声の出来（列名は resonance_score のまま）
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
  // ★「声の記録ブロックを作ったか」で見る。値が入っているかでは見ない。
  //   newVoiceEntry は bodyFeel:3 / quality:5 を既定で入れていた。
  //   そのため、スライダーに触っていない人にも「声の出来を使った」印が付いていた。
  //   既定値を答えとして数える、というこのアプリがいちばんやってはいけないこと。
  //   ポイントは記録した行為に付ける（羊のおうち仕様 §1）。値の中身では判定しない。
  //   ★旧データも通る: rowToEntry が旧列から voiceEntries を組み立てるので、
  //     以前の記録でもブロックは1件以上になり、既に付いたボーナスは消えない。
  { key: "voiceEntry", test: (e) => (e.voiceEntries || []).length > 0 },
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
  // 日付を渡すこと。渡さないと全て旧ルールで計算され、移行が効かない。
  const daily = Object.entries(entries || {}).reduce((sum, [date, e]) => sum + computeEntryPoints(e, date), 0);
  return daily + computeFirstUseBonus(entries);
}

function toISODate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}


/**
 * ★連続記録（computeStreaks）は 2026-09-01 に削除しました。
 *
 *   何日続けて記録したかを数え、「現在の連続記録」「最長連続記録」として
 *   出していました。★続いたかどうかで人を測る形だったので、やめました。
 *
 *   数えるのは★累計の記録日数だけです（Object.keys(entries).length）。
 *   累計は連続より必ず大きいので、この切り替えで
 *   ★誰も持ち物を失いません。解放ずみのものが戻ることもありません。
 *
 *   ★ここに連続の計算を戻さないこと。
 *     使われない関数として残すと、いつかまた呼ばれます
 *     （derivePrimaryActivityLegacy と同じ理由）。
 *   ★木の育ち（growthTreeStage）は、もともと累計だけを見ています。
 */

// ===== ショップカタログ =====
// category: hat | outfit | accessory | floor | wall | window | scenery | backdrop | furniture | garden | wallhang
// slot持ちのカテゴリ（hat/outfit/accessory/floor/wall/window/scenery/backdrop）は1つだけ装備、
// furniture / garden / wallhang は複数同時に配置可能。
//
// 価格は「1日の記録で平均5pt貯まる」という想定を基準に設計。
// 5pt=1日、15pt=3日、35pt=1週間、70pt=2週間、150pt=1ヶ月、300pt=2ヶ月、450pt=3ヶ月、900pt=半年、1800pt=ほぼ1年。
// 安いものは数日、豪華なものは1ヶ月〜数ヶ月、部屋・庭の拡張は1年近く毎日続けないと届かない設計にしてある。

// ============================================================================
// アイテムの値段（作業指示-羊StageAとアイテム.md B-3）
//
// ★バランス調整が1ファイルで済むように、種別ごとの目安をここに置きます。
//   新しいアイテムの値段は、まずこの帯から選んでください。
//
// ★既存84件の値段は、この帯から外れているものがあります（帽子 5〜400 など）。
//   王冠やティアラのような「めったに買わないもの」が意図的に高く、
//   麦わら帽子のような入門用が意図的に安いためです。
//   勝手に付け替えると、坂本さんが決めた経済を壊すので、
//   ★既存の値段は変更していません。見直すときは、ここを見ながら判断できます。
// ============================================================================
export const PRICE_BANDS = {
  hat: [15, 30],          // 小物（持ち物・帽子）
  accessory: [15, 30],
  outfit: [30, 50],       // 服
  furniture: [40, 80],    // 家具・庭の置物
  garden: [40, 80],
  wallhang: [40, 80],
  floor: [60, 100],       // 床・壁・窓枠
  wall: [60, 100],
  window: [60, 100],
  scenery: [80, 120],     // 窓の景色・庭の景観
  backdrop: [80, 120]
};

// ============================================================================
// 達成で解放されるアイテム（B-4／アイテムカタログ §5）
//
// ★すべて累計ベース。「連続◯日」を条件にしないこと。
//   体調が悪くて途切れた人から、一度得たものを取り上げないためです。
// ★一度解放されたら、二度と失われません。
// ============================================================================
export const UNLOCK_CONDITIONS = {
  firstPerformance: { labelKey: "unlockFirstPerformance" },
  performances10: { labelKey: "unlockPerformances10" },
  firstPianissimo: { labelKey: "unlockFirstPianissimo" },
  tenFieldKinds: { labelKey: "unlockTenFieldKinds" },
  practiceGoalDone: { labelKey: "unlockPracticeGoalDone" }
};

/**
 * 累計の記録から、解放されているものを求める。
 * ★連続記録は見ません（途切れても後退しないため）。
 */
export function computeUnlocked(entries) {
  const days = Object.values(entries || {});
  const performances = days.filter((e) =>
    (e.activities || []).some((a) => a && a.kind === "本番")).length;
  const unlocked = new Set();
  if (performances >= 1) unlocked.add("firstPerformance");
  if (performances >= 10) unlocked.add("performances10");
  if (days.some((e) => e && e.pianissimoHighNote)) unlocked.add("firstPianissimo");
  // 記録項目を10種類以上使ったか（その日ではなく、累計で何種類に触れたか）
  const kinds = new Set();
  days.forEach((e) => Object.entries(e || {}).forEach(([k, v]) => {
    if (v == null || v === "" || (Array.isArray(v) && v.length === 0)) return;
    if (k === "date") return;
    kinds.add(k);
  }));
  if (kinds.size >= 10) unlocked.add("tenFieldKinds");
  return unlocked;
}

// ============================================================================
// ショップの並び順（B-2）
//
//   1. 未購入かつ、いま買えるもの      ← いちばん上
//   2. 未購入で、あと少しで買えるもの
//   3. その他の未購入
//   4. 購入済み
//   同じ組の中では、いまの職業に合うものを優先する。
//
// ★professions は並び順の優先だけに使います。買えなくする条件にしないこと。
// ★season も「今月の新作」として先頭に出すためだけ。入手期限を作らないこと。
//   期間限定は「いま買わないと損」を生み、羊のおうち仕様 §1 の
//   「罰を作らない」に反します。体調が悪くて記録できなかった月に、
//   二度と手に入らないものが流れていくのは、罰です。
// ============================================================================
export const ALMOST_AFFORDABLE_PT = 30;   // 「あと少し」の幅

export function shopSortRank(item, { balance, owned }) {
  if (owned && owned.has(item.key)) return 3;             // 購入済み
  const cost = Number(item.cost) || 0;
  if (balance >= cost) return 0;                           // いま買える
  if (cost - balance <= ALMOST_AFFORDABLE_PT) return 1;    // あと少し
  return 2;
}

export function sortShopItems(items, { balance = 0, owned = new Set(), professions = [] } = {}) {
  const prof = new Set(professions || []);
  return [...(items || [])].sort((a, b) => {
    const ra = shopSortRank(a, { balance, owned });
    const rb = shopSortRank(b, { balance, owned });
    if (ra !== rb) return ra - rb;
    // 同じ組の中では、今月の新作 → 職業が合うもの → 安いもの の順
    const sa = a.season ? 0 : 1, sb = b.season ? 0 : 1;
    if (sa !== sb) return sa - sb;
    const pa = (a.professions || []).some((x) => prof.has(x)) ? 0 : 1;
    const pb = (b.professions || []).some((x) => prof.has(x)) ? 0 : 1;
    if (pa !== pb) return pa - pb;
    return (Number(a.cost) || 0) - (Number(b.cost) || 0);
  });
}

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
