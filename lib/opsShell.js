// ============================================================================
// 運営モード ── 別のシェル（2026-09-09・第3便）
//
//   ★出どころ docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §3-3・§1-1・§4-7
//     「★「きょう」の右上の歯車 →「◯◯の運営」→ ★運営モードへ
//      ★運営モードの左上に「もどる」→ 個人のアプリへ
//      → ★2つのアプリが 1つに入っている形です」
//
//   ★★いちばん大事な 一文（★§3-3）
//     「★この画面から、★生徒の健康の記録には たどりつけません
//       　（★画面そのものが ありません）」
//     ★★これは 設定では ありません。★画面が 無い、ということです。
//     ★見張りが、★健康側の画面を import していないことを 確かめます（★§7-7）。
//
//   ★★iPhone でも 使えます（★2026-09-09・坂本さんの お決め）。
//     ★★「パソコン幅のときだけ」という 制限は、★設けません。
//     ★下タブ6つを、★iPhone の 幅に 収めます。
//     ★★ただし §4-7 の「先生を横に並べる 一覧」だけは パソコンです。
//       ★これは 日程の 中の 1つの 見せ方の 話で、★運営モード全体の 話では ありません。
//
//   ★見張り components/tests/ops-shell.test.js
// ============================================================================

/** ★役割 4つ（★§1-1）。 */
export const ROLES = Object.freeze(["owner", "admin", "teacher", "staff"]);

/**
 * ★運営モードの 下タブ。
 *
 *   ★★役割で 変わります（★§3-3 の 表の とおり）。
 *   ★★teacher は 入りません。★§3-2 の 帯で 足ります。
 *   ★★staff は 日程だけ。★事務の方に、★名簿も 連絡も 出しません。
 */
export const OPS_TABS = Object.freeze([
  { key: "home", label: "ホーム" },
  { key: "schedule", label: "日程" },
  { key: "roster", label: "名簿" },
  { key: "events", label: "行事" },
  { key: "threads", label: "連絡" },
  { key: "settings", label: "設定" }
]);

const BY_ROLE = Object.freeze({
  owner: ["home", "schedule", "roster", "events", "threads", "settings"],
  admin: ["home", "schedule", "roster", "events", "threads"],
  staff: ["schedule"],
  teacher: []
});

/** ★その役割で 出す 下タブ。★知らない役割は 空です（★勝手に 開けません）。 */
export function tabsFor(role) {
  const keys = BY_ROLE[role] || [];
  return OPS_TABS.filter((t) => keys.includes(t.key));
}

/**
 * ★運営モードに 入れるか。
 *
 *   ★★teacher は 入りません。★§3-2 の 帯で 足ります。
 *   ★★入口を 出すかどうかも、★これで 決めます。
 *     ★入れないのに 入口を 出すと、★押しても 何も 起きません。
 */
export function mayEnterOps(role) {
  return tabsFor(role).length > 0;
}

/** ★設定（お金）は owner だけ（★§1-1「admin は お金以外」）。 */
export function maySeeMoney(role) {
  return role === "owner";
}

/**
 * ★§4-7 の 一覧は、★パソコンだけ。
 *
 *   ★★これは「日程」の中の、★先生を 横に並べる 表 1つの 話です。
 *     ★★運営モード 全体を 止めるものでは ありません（★2026-09-09・お決め）。
 *   ★★iPad は 見るだけ。★コマを うごかせるのは パソコンだけ（★§4-7）。
 *
 *   @param width ★画面の 横はば（px）
 */
export const WIDE_TABLE_MIN_WIDTH = 1024;

export function mayShowWideTable(width) {
  return typeof width === "number" && width >= WIDE_TABLE_MIN_WIDTH;
}

/** ★§4-7 の 断り。★1行だけ。★責める言葉に しません。 */
export const WIDE_TABLE_NOTE = "先生を横に並べた表は、パソコンでご覧ください。";

/**
 * ★★運営モードから たどりつけない もの（★§3-3・§7-7）。
 *
 *   ★見張りが、★この一覧の 部品を import していないことを 確かめます。
 *   ★★「出さない」では ありません。★「持たない」です。
 *     ★出し分けにすると、★条件を 1行 変えるだけで 出てしまいます。
 */
export const NEVER_IN_OPS = Object.freeze([
  "VocalTracker", "HomeV2", "LookBackV2", "CompareV2", "CountV2",
  "LookBackPanel", "RecordV2Head", "HealthInfo", "CharacterHome"
]);
