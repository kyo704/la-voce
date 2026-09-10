// ============================================================================
// おうちの 置き場所 ── 9か所（★見本 J02 ／ Opus の 裁定）
//
//   ★出どころ docs/opus/裁定-羊のおうち J02・J03（9月10日）.md §1-1・§2・§3-2
//            docs/design/pack-final/screens/J02-おくスロット.html
//            docs/reports/2026-09-11-家具27点の仕分け.md
//
//   ★★決めごと（★裁定 §2-1 の 注記）
//     「★置く場所は 決まっています。★自由に 動かせません。★座標を 保存しません。」
//
//   ★★ここが 持つ 決めは 3つです。
//     ① 置き場所が いくつ、どこに あるか
//     ② どの 品が、どの 置き場所に 行くか
//     ③ 1か所につき 最低2点（★裁定 §2-2）を 満たしているか 数える道
//
//   ★★ここは「何を 持っているか」を 決めません。
//     ★品を 減らしません。★裁定 §4 ⑤「1点も 取り上げない」。
//
//   ★★書いてある 座標（furniturePositions ほか）は、★1つも 消しません。
//     ★読むときに、置き場所の ほうを 使います。
//     ★★消さないので、★あとで「やはり 動かせるほうが」と なっても 戻せます。
//
//   ★見張り components/tests/room-slots.test.js
// ============================================================================

import { INTERIOR_ITEMS } from "@/lib/sheepInteriorV2";

/**
 * ★置き場所（★9か所）。
 *
 *   ★★名まえは 裁定 §1-1 と §3-2 のとおりです。
 *     ★もと「たな」を「とだな」に 直してあります（★J04 の たな と 重なるため）。
 *
 *   ★★fixed は「部屋の 形そのもの」です（★裁定 §3-2）。
 *     ★まど・とびら。★動かせません。★1つだけ 選びます。
 *   ★★many は「いくつも 置ける」ところです。
 *
 *   ★★left / feet / top は、★部屋の 箱に 対する ％です。
 *     ★left は まん中の 位置、★feet は 下から、★top は 上から。
 *   ★★見本の 部屋の 絵（330×268）の 枠の まん中から 出しました。
 *     ★ただし 床に 置く ものは、★見本の 床線では なく
 *     ★★アプリの 床線（★34％）に 合わせます。
 *       ★見本の 部屋は 仮のものだからです（★裁定 §3-3）。
 *       ★合わせないと、★品が 床から 浮きます。
 */
export const SLOTS = Object.freeze([
  // ★① まど ── 見本の 枠 x26..112（まん中 69/330 ＝ 20.9％）
  { key: "window", label: "まど", fixed: true, left: 20.9, top: 29.9 },
  // ★② かべ（左）── x140..192（まん中 166/330 ＝ 50.3％）
  { key: "wallL", label: "かべ（左）", left: 50.3, top: 24.6 },
  // ★③ かべ（右）── x204..234（まん中 219/330 ＝ 66.4％）
  { key: "wallR", label: "かべ（右）", left: 66.4, top: 24.6 },
  // ★④ とだな ── x252..314（まん中 283/330 ＝ 85.8％）
  { key: "cabinet", label: "とだな", left: 85.8, onFloor: true },
  // ★⑤ いす ── x150..176（まん中 163/330 ＝ 49.4％）
  { key: "chair", label: "いす", left: 49.4, onFloor: true },
  // ★⑥ つくえ ── x52..138（まん中 95/330 ＝ 28.8％）
  { key: "desk", label: "つくえ", left: 28.8, onFloor: true },
  // ★⑦ ゆか ── x82..278（まん中 180/330 ＝ 54.5％）
  { key: "floor", label: "ゆか", left: 54.5, onFloor: true },
  // ★⑧ とびら（★2026-09-11 に 足しました・裁定 §3-2）
  //   ★★見本の 部屋の 絵に、とびらは 描かれていません（★裁定 §3-3）。
  //     ★「無い」では なく「まだ 描いていない」です。
  //   ★★だから ここの 数は、★見本から 取った ものでは ありません。
  //     ★いまの 部屋で、★右の 壁ぎわに 立つ 位置です。
  //     ★正しい 部屋の 絵が 届いたら、★ここを 直します。
  { key: "door", label: "とびら", fixed: true, left: 88, onFloor: true, fromMockup: false },
  // ★⑨ てんじょう（★2026-09-11・坂本さんの お決め ①㋐）
  //   ★★天井から 吊るす 照明 7点の 行き先です。
  //     ★8か所の どれにも 入らず、★宙に 浮いていました。
  //   ★★ここも 見本には ありません。
  { key: "ceiling", label: "てんじょう", left: 50, top: 0, fromMockup: false }
]);

export const SLOT_KEYS = Object.freeze(SLOTS.map((s) => s.key));

export function slotByKey(key) {
  return SLOTS.find((s) => s.key === key) || null;
}

export function slotLabel(key) {
  const s = slotByKey(key);
  return s ? s.label : key;
}

// ---------------------------------------------------------------------------
// ★どの 品が、どの 置き場所に 行くか
//
//   ★★品の 名まえから 当てません。★名まえは 変わります。
//     ★鍵で 書きます。★鍵は 変えません（★変えると 台帳と 合わなくなります）。
//
//   ★★出どころは docs/reports/2026-09-11-家具27点の仕分け.md です。
//     ★あの 一覧を、そのまま 表に しました。
// ---------------------------------------------------------------------------

/** ★座るもの（★いす 向き）。 */
const SEAT = ["furniture_01", "furniture_04", "furniture_07", "furniture_10",
  "furniture_13", "furniture_16", "furniture_19", "furniture_22", "furniture_25",
  "showa_17"];

/** ★作業するもの（★つくえ 向き）。 */
const DESK = ["furniture_02", "furniture_05", "furniture_08", "furniture_11",
  "furniture_14", "furniture_17", "furniture_20", "furniture_23", "furniture_26",
  "showa_07", "showa_12"];

/** ★しまうもの（★とだな 向き）。 */
const CABINET = ["showa_03", "showa_04", "showa_08", "showa_18"];

/**
 * ★どこに 置いても おかしくない もの ＋ 床の その他（★ゆか 向き）。
 *
 *   ★★床置きの 照明 3点は、★仕分けの ①（どこでも）です。
 *     ★いす の わきでも つくえ の わきでも 自然ですが、
 *     ★★1つの 品を 1か所に 決めます。★選べる ほうが 分かりやすいためです。
 *     ★ゆか に 置きます。
 */
const FLOOR_OTHER = ["furniture_09", "furniture_24", "furniture_27",
  "showa_05", "showa_09", "showa_10", "showa_13", "showa_14", "showa_15", "showa_16"];

/**
 * ★その品の 置き場所。
 *
 *   ★★上の 表に 無い 品は、★置き場所（placement）から 決めます。
 *     ★新しい 絵が 増えたときに、★どこにも 行けなく ならない ためです。
 *   ★★それでも 決まらない ものは null です。★出しません。
 *     ★★null が 出たら、★見張りが 教えます（★room-slots.test.js）。
 *
 *   ★★かべ は 左右 2か所 あります。★品では 決まりません。
 *     ★どちらに 置くかは、★えらんだ 方が 決めます。★ここでは "wall" を 返し、
 *     ★呼ぶ側が wallL / wallR の どちらかに 入れます。
 */
export function slotOfItem(item) {
  if (!item || !item.key) return null;
  if (SEAT.includes(item.key)) return "chair";
  if (DESK.includes(item.key)) return "desk";
  if (CABINET.includes(item.key)) return "cabinet";
  if (FLOOR_OTHER.includes(item.key)) return "floor";
  const c = item.category;
  const p = item.placement;
  if (c === "window" || c === "view") return "window";
  if (c === "door") return "door";
  if (c === "wallart" || p === "wall") return "wall";
  if (p === "ceiling") return "ceiling";
  if (p === "floor") return "floor";
  // ★★tabletop（★とだな・つくえ の 上に 置くもの）は、★とだな に 寄せます。
  if (p === "tabletop") return "cabinet";
  // ★★outside（庭）は、部屋の 置き場所では ありません。
  //   ★★surface（かべ紙・床材）も、★敷くもので、置くものでは ありません。
  //   ★★structure（縁側 1点）は、★Opus に お尋ね中です（★2026-09-11）。
  //     ★決まるまで、ここでは 決めません。★出す 側は これまでどおりです。
  return null;
}

/** ★その置き場所に 置ける 品。 */
export function itemsForSlot(slotKey, items) {
  const list = Array.isArray(items) ? items : INTERIOR_ITEMS;
  if (slotKey === "wallL" || slotKey === "wallR") {
    return list.filter((i) => slotOfItem(i) === "wall");
  }
  return list.filter((i) => slotOfItem(i) === slotKey);
}

/**
 * ★1か所につき 最低2点（★裁定 §2-2）。
 *
 *   ★★1点だと「選ぶ」ことに なりません。
 *     ★選べない ものは、置く 意味が ありません（★裁定 §2-2）。
 *
 *   ★★2026-09-11、★slotCounts() を 消しました。
 *     ★出どころ 「9月10日・回答-とだなの数字はどこか §3」
 *              ＋ 坂本さんの お決め（★2026-09-11）
 *     ★★理由 ── ★あの 数は、★どの 画面にも 出ていませんでした。
 *       ★「置ける点数（6点のうち2点）」は、★進捗バーの 一種です。
 *       ★出す つもりが 無いのに 数える 関数が 残っていると、
 *       ★★いつか 誰かが 画面に 出します。★notOutDates と 同じ 形です。
 *     ★★消したのは 数える ことだけです。
 *       ★品も、character_inventory も、★1件も 触っていません。
 *   ★★この 数（2）は 残します。★見張りが 使う 決めだからです。
 *     ★画面に 出す 値では ありません。
 */
export const MIN_PER_SLOT = 2;
