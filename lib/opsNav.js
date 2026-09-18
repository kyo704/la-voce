// ============================================================================
// ★運営の ナビ ── ★まとまり・幅・たたみ（★裁定 その78 §1 §2 §4 ／ その81 §4）
//
//   ★出どころ docs/opus/visual-2026-09-18/pack/ruling-78-ops-layout.md
//            docs/opus/visual-2026-09-18/pack/ruling-81-visual-design.md §4
//
//   ★★★左の ナビは 残します（★裁定 その78 §1-2）。
//     ★★NN/g ──「垂直・左ナビは、★広い／成長する IA に 適合する」
//     ★★34画面を 横に 並べると、★「極端に 小さい フォント、項目の 密集、
//       ★不自然に 短い ラベル」を 招く、と 同じ 記事が 警告して います。
//     ★★★ただし 欠点も 実在します ── ★内容 対 枠が 5:1 に なります
//       （★坂本さんの 210px の ご指摘）。★だから **たためる** ように します。
//
//   ★★★たたんでも、★ラベルを 消しません（★裁定 その78 §2-2）。
//     ★★NN/g ──「★デスクトップで、ナビを アイコンだけに 隠すな」
//     ★★「★ナビゲーションでは、単語は 千の絵に 値する」
//     ★★読み上げには 残します。★指を 乗せると 名前が 出ます。
//
//   ★★★出す／出さないは、★ここで 決めません。
//     ★★`lib/opsPerms.js` の `TAB_RULES` が 1つ 持って います。
//     ★★ここが 決めるのは **並べ方** だけ です。
//     ★★★2つ 目の 表を 作ると、★門下の 行が 片方に しか 無い 日が 来ます。
//       ★★きょう、★実際に そう なって いました（★`OPS_TABS` の 一件）。
//
//   ★見張り components/tests/ops-nav.test.js
// ============================================================================

import { tabsForPerms, TAB_RULES } from "@/lib/opsPerms";

// ----------------------------------------------------------------------------
// 【一】★幅（★裁定 その78 §2-3 ／ その81 §4-1）
// ----------------------------------------------------------------------------
//   ★★190px から 拡げました。★ラベルが 窮屈 だった ため です。
export const SIDE_WIDTH = 232;
export const RAIL_WIDTH = 68;

// ----------------------------------------------------------------------------
// 【二】★まとまり ── ★5つ（★裁定 その81 §4-2）
// ----------------------------------------------------------------------------
//   ★★Carbon ──「2次ナビが ★5項目 超なら 左パネル。★3階層は 作らない」
//   ★★★2階層まで です。★3階層を 作りません。
//
//   ★★`key` は `TAB_RULES` の `key` です。★字は そちらが 持ちます。
//     ★★ここに ラベルを 書き写しません。★写すと、★片方だけ 直る 日が 来ます。
export const NAV_GROUPS = Object.freeze([
  { head: "", items: ["home"] },
  { head: "ひと", items: ["roster", "monka"] },
  { head: "とき", items: ["schedule", "events"] },
  { head: "やりとり", items: ["threads"] },
  { head: "しらべ", items: ["settings"] }
]);

/** ★その 行の しるし（★`lib/opsIcons.js` の 名）。 */
export const NAV_ICONS = Object.freeze({
  home: "home",
  roster: "users",
  monka: "cap",
  schedule: "grid",
  events: "star",
  threads: "mail",
  settings: "gear"
});

/**
 * ★その 方に 出す ナビ（★まとまりの まま）。
 *
 *   ★★持って いない ものは 出しません。★空の まとまりも 出しません。
 *   ★★並びは `NAV_GROUPS` の とおり。★`TAB_RULES` の 順では ありません。
 */
export function navGroupsFor(perms) {
  const 出る = new Map(tabsForPerms(perms).map((t) => [t.key, t.label]));
  return NAV_GROUPS
    .map((g) => ({
      head: g.head,
      items: g.items.filter((k) => 出る.has(k))
        .map((k) => ({ key: k, label: 出る.get(k), icon: NAV_ICONS[k] }))
    }))
    .filter((g) => g.items.length > 0);
}

// ----------------------------------------------------------------------------
// 【三】★たたむ（★裁定 その78 §2-3 ／ その81 §4-3）
// ----------------------------------------------------------------------------
//   ★★手で … ★Ctrl / ⌘ + B
//   ★★自動 … ★表の 画面 ＋ iPad の とき **だけ**
//   ★★★PC では 自動に しません。★幅が 足りて いるから です。
//     ★★Fluent の Auto と 同じ 考え です。★ただし **幅では なく 画面で** 決めます。
//     ★★幅が 足りないのは、★表の 画面 だけ だから です。

/** ★自動で たたむ 画面（★裁定 その81 §4-3 の `WIDE`）。 */
export const WIDE_SCREENS = Object.freeze([
  "役職の一覧", "名簿", "日程を組む", "置ける枠", "採点"
]);

/** ★たたむ ときの 押しどころ（★Ctrl / ⌘ + B）。 */
export const FOLD_KEY = "b";

/**
 * ★端末の 見当（★裁定 その78 §7 ／ M3 の ウィンドウサイズクラス）。
 *
 *   ★★pc …… 1280 以上（★裁定 その78 の 対象）
 *   ★★pad … 834 以上（★iPad たて）
 *   ★★phone ★それ 未満
 *
 *   ★★★幅が 分からない うちは phone に 倒します。
 *     ★★狭い ほうへ 倒すのが 安全 です（★`lib/opsRosterTable.js` と 同じ 決め）。
 */
export const PC_AT = 1280;
export const PAD_AT = 834;

export function deviceOf(width) {
  const w = Number(width);
  if (!Number.isFinite(w) || w <= 0) return "phone";
  if (w >= PC_AT) return "pc";
  if (w >= PAD_AT) return "pad";
  return "phone";
}

/**
 * ★左の ナビを 出すか。
 *
 *   ★★★iPhone では 出しません。★下の 帯の まま です。
 *     ★★2026-09-09 の お決め ──「同じ6つの タブを iPhone の 幅に 収めます」
 *     ★★そこへ 左の ナビを 足すと、★入口が 2つに なります。
 */
export function showSideNav(width) {
  return deviceOf(width) !== "phone";
}

/**
 * ★たたむ か。
 *
 *   ★★`manual` … ★手で たたんだ か（★Ctrl / ⌘ + B）
 *   ★★`screen` … ★いま 見て いる 画面の 名
 *   ★★`width` … ★画面の 幅
 */
export function isRail({ manual, screen, width } = {}) {
  if (manual) return true;
  return WIDE_SCREENS.includes(screen) && deviceOf(width) === "pad";
}

/** ★いまの 幅（★`SIDE_WIDTH` か `RAIL_WIDTH`）。 */
export function navWidth(rail) {
  return rail ? RAIL_WIDTH : SIDE_WIDTH;
}

// ----------------------------------------------------------------------------
// 【四】★この 蔵に まだ 無い 画面
// ----------------------------------------------------------------------------
//   ★★`WIDE_SCREENS` の 5つ は、★裁定が 挙げて いる 画面の 名 です。
//   ★★★そのうち いくつかは、★まだ 作られて いません。
//     ★★だから この 一覧は、★いまは 効かない 行を 含みます。
//     ★★★消しません。★裁定の 数 です。★作った 日に そのまま 効きます。
//   ★★どれが 有る かは、★見張りが 数えて 出します。★ここには 書きません
//     （★数えた 数を 書き写すと、★作った 日に 古い 数が 残ります）。

/** ★`TAB_RULES` に ある 名を、★まとまりが 1つ 残らず 拾って いるか。 */
export function coversAllTabs() {
  const 並べた = NAV_GROUPS.reduce((a, g) => a.concat(g.items), []);
  const 決め = TAB_RULES.map((t) => t.key);
  return 決め.every((k) => 並べた.includes(k)) && 並べた.every((k) => 決め.includes(k));
}
