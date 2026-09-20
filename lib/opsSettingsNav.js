// ============================================================================
// ★設定の 節 ── ★何を 出し、★どれが まだ か（★見本 `P_settei`）
//
//   ★★★裁定 その97（2026-09-19）── ★1画面ずつ、★**機能まで**。
//     ★★この 蔵は「設定」の 骨 です。★左に 一覧、★右に 中身。
//
//   ★★★見本は 12の 節を、★できことで 出し分けて います。
//     ★★実装は 4つ しか ありませんでした（ご請求・役職・ひと・授業の型）。
//     ★★★残りは「まだ」です。★押せる 札に しません（★§8⑤）。
//       ★★出さないのでは なく、★「まだ」と 名ざしで お伝えします。
//       ★★何が 無くて できないのかも、★一緒に 書きます。
//
//   ★★決めを ここに 1つ だけ 置きます。★画面で 判じません。
//
//   ★見張り components/tests/ops-settings-nav.test.js
// ============================================================================

import { permSet } from "@/lib/opsPerms";

/**
 * ★節（★見本 `P_settei` の 並びの とおり）。
 *
 *   `key`   … ★どの 中身を 出すか
 *   `label` … ★見本の 字。★1文字も 変えないこと
 *   `any`   … ★出す できこと（★1つでも 持って いれば 出します）
 *   `ready` … ★中身が ある か（★false なら「まだ」）
 *   `needs` … ★まだ の とき、★何が 足りないか
 */
export const SETTING_SECTIONS = Object.freeze([
  { key: "miyasu", label: "見やすさ（文字の 大きさ）", any: null, ready: true },
  // ★★★ご請求 ── ★数の ほかに、★請求書の 宛名と ご請求の 宛先が 入りました
  //   （★2026-09-19・見本 `P_seikyuNa` ／ `P_atesaki`）。
  //   ★★変えられるのは `bill_pay` を 持つ 方 だけ です。★台帳の 門も そう です。
  { key: "bill", label: "ご請求", any: ["bill", "bill_pay"], ready: true },
  // ★★★2026-09-20 に できました（★`export_log` に 記録が 残ります）。
  { key: "export", label: "書き出す（校務システムへ）", any: ["meibo", "sched_all"],
    ready: true },
  { key: "import", label: "読み込む（校務システムから）", any: ["meibo", "master"],
    ready: false, needs: "読み込みの 道と、取り違えを 直す 画面" },
  // ★★★2026-09-20 に できました（★`org_periods`）。
  { key: "koma", label: "時間の 割り方（コマ）", any: ["koma", "koma_mine"], ready: true },
  // ★★★2026-09-20 に できました（★`org_places`）。
  { key: "place", label: "場所", any: ["koma"], ready: true },
  { key: "mine", label: "自分の 予定（レッスン いがい）", any: ["sched_mine"],
    ready: false, needs: "先生ご自身の 予定の 表" },
  { key: "jugyo", label: "授業の 型", any: ["meibo"], ready: true },
  // ★★★2026-09-20 に できました（★`eval_items` ／ 点を 入れる 画面）。
  { key: "saiten", label: "評価の 型", any: ["master"], ready: true },
  // ★★★2026-09-19（★裁定 その98 BLOCKER_1）── ★表が できました。
  //   ★★`org_divisions`（`parent_id` で つなぐ）／`memberships.division_id`。
  { key: "org", label: "学校の 形", any: ["master"], ready: true },
  { key: "post", label: "役職と、できること", any: ["post", "master"], ready: true },
  { key: "people", label: "ひとと 役職", any: ["post", "master"], ready: true }
]);

/** ★その方に 出す 節（★並びは 上の とおり）。 */
export function sectionsFor(perms) {
  const s = permSet(perms);
  return SETTING_SECTIONS.filter((x) => !x.any || x.any.some((k) => s.has(k)));
}

/** ★いま 触れる 節（★中身が ある ものだけ）。 */
export function readySections(perms) {
  return sectionsFor(perms).filter((x) => x.ready);
}

/** ★まだ の 節（★何が 足りないかを 添えて）。 */
export function notYetSections(perms) {
  return sectionsFor(perms).filter((x) => !x.ready);
}

/**
 * ★はじめに 開く 節。
 *
 *   ★★★中身の ある ものの うち、★いちばん 上 です。
 *     ★★「まだ」を 開いて 白い 紙を 出しません。
 *   ★★1つも 無ければ null。★そのときは 一覧だけ を 出します。
 */
export function firstSection(perms) {
  const r = readySections(perms);
  return r.length ? r[0].key : null;
}

/** ★その 節を、★その方が 開けるか。 */
export function mayOpen(perms, key) {
  return readySections(perms).some((x) => x.key === key);
}

/** ★左の 一覧の 幅（★見本 ── `flex:0 0 210px`）。 */
export const SIDE_WIDTH = 210;

/** ★2つに 分ける 幅（★運営の ほかの 画面と 同じ 境目）。 */
export const TWO_PANE_AT = 900;
export function isTwoPane(width) {
  return typeof width === "number" && width >= TWO_PANE_AT;
}

/** ★まだ の 節を まとめた 題と 1行。 */
export const NOT_YET_HEAD = "まだ できない こと";
export const NOT_YET_LINE =
  "作って いない ものです。押せる 札に しません。何が 足りないかを 書きます。";

/** ★題（★見本 ── ご請求を 持つ 方には「設定・ご請求」）。 */
export function headOf(perms) {
  const s = permSet(perms);
  return (s.has("bill") || s.has("bill_pay")) ? "設定・ご請求" : "設定";
}
