// ============================================================================
// ★書く ── ★経歴の 1つを 足す／直す（★2026-09-25・C群 束5）
//
//   ★見本 `SC['書く']`（★design-v51・iPhone で 開く用）。
//
//   ★★★Opus の 束4 は「たぶん本文・ノート本文・書く」でした が、
//     ★★`書く` は `notes` の 画面では ありません。
//     ★★★`PF[kind]` ── ★`portfolio_entries` の 画面 です（★親は あなたのページ）。
//       ★2026-09-25 に お伝えして います。
//
//   ★★★2つの 約束（★見本の `.note`・1文字も 変えないこと）──
//     ①「手を 止めると、そのまま 残ります。途中で やめても かまいません。」
//     ②「消しても、ほかの 記録・ノート・ひつじは 変わりません。」
//   ★★`shiji`（師事した方）の ときだけ、★もう 1行 ──
//     ③「公開の 講座で 教わった方は、分けて 書いてください。」
//
//   ★★★②は この 家の 根の 決め です（★CLAUDE.md）──
//     「記録・ノート・レパートリー・ひつじは、どの 操作でも 消えない」
//     ★★`portfolio_entries` を 消しても、★`entries` にも `notes` にも 触りません。
//
//   ★★台帳（★2026-09-25・本番で 確かめました）──
//     ★`portfolio_entries`（id, user_id, kind, title, detail, sort_order, created_at）
//     ★`title` は not null。★`detail` は 任意（★「いつ」を ここに 入れます）。
//     ★決まりは 本人だけ（`portfolio_entries_own`）＋ 公開の 範囲（`_read`・sql/80）。
//
//   ★★★どの 種が ある かは `lib/portfolio.js` の `KINDS_BY_FIELD` が 持ちます。
//     ★★ここで 並べません。★`enabledAt` の 無い 種は 呼ばれません。
// ============================================================================
import { kindsOfField } from "@/lib/portfolio";

/** ★引く／書く 列 だけ。 */
export const COLS_ENTRY = "id, kind, title, detail, sort_order";

/**
 * ★「いつ」の 欄を 出す 種（★見本 `hasDate`）。
 *
 *   ★★見本は `['keireki','sho','honban','rokuga']` です。
 *     ★台帳の 鍵に 直すと ── `school` ／ `award` ／ `performance` ／ `recording`。
 *   ★★★「師事した方」には 出しません ── ★年を 書く ところでは ありません。
 */
export const WITH_DATE = Object.freeze(["school", "award", "performance", "recording"]);
export function hasDate(kind) {
  return WITH_DATE.includes(String(kind || ""));
}

/** ★「いつ」の 案（★見本の `placeholder`）。 */
export const DATE_LABEL = "いつ";
export const DATE_PLACEHOLDER = "れい：2026.11　／　2020–24";

/**
 * ★本文の 案（★見本の `ph`）。★種ごと に ちがいます。
 *
 *   ★★見本の 字を そのまま 使います。★こちらで 考えません。
 */
export const PLACEHOLDERS = Object.freeze({
  school: "○○音楽大学 声楽科 卒業",
  teacher: "高橋 のぞみ",
  award: "○○声楽コンクール 第2位",
  performance: "『冬の旅』全曲　千葉文化会館",
  repertoire: "冬の旅（全曲）",
  recording: "『冬の旅』第1曲",
  physical: "168cm",
  skill: "殺陣",
  management: "○○プロダクション",
  press: "「言葉が立つ」○○新聞",
  link: "Instagram"
});
export function placeholderOf(kind) {
  return PLACEHOLDERS[String(kind || "")] || "";
}

/** ★その 種の 札（★`KINDS_BY_FIELD` から 引きます。★書き写しません）。 */
export function labelOf(field, kind) {
  const k = kindsOfField(field).find((x) => x.key === kind);
  return k ? k.label : "";
}

/** ★見出し（★見本の `.sh3`）。★足す か 直す か。 */
export function formHead(editing) {
  return editing ? "直す" : "足す";
}

/** ★押しどころ（★見本）。 */
export const BTN_CANCEL = "やめる";
export const BTN_UP = "↑";
export const BTN_EDIT = "直す";
export const BTN_DELETE = "消す";

/** ★1つも 無い とき（★見本の `.empty`）。 */
export const EMPTY_LINE = "まだ ありません。";

/** ★一覧の 下の 1行（★見本の `.usu`）。 */
export const ORDER_LINE = "上に あるものから 出ます。↑で 並べ替えられます。";

/** ★並べ替え。★`sort_order` の 昇り順。★台帳の 並びに 頼りません。 */
export function sortEntries(rows) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  return [...list].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
}

/** ★1つ 上へ。★いちばん 上では 動かしません。 */
export function moveUp(rows, index) {
  const list = sortEntries(rows);
  if (index <= 0 || index >= list.length) return list;
  const [x] = list.splice(index, 1);
  list.splice(index - 1, 0, x);
  return list.map((r, i) => ({ ...r, sort_order: i }));
}

/** ★本文が 空では 足せません。★`title` は not null です。 */
export function mayAdd(title) {
  return String(title || "").trim().length > 0;
}

/**
 * ★下の 断り。
 *
 *   ★★`shiji`（師事した方）の ときだけ 3行 です。
 *     ★★★「公開の 講座で 教わった方は、分けて 書いてください。」
 *       ★★一度きりの 講座を「師事」と 書くと、★読む 人が 取りちがえます。
 */
export function noteLines(kind) {
  const 共通1 = "手を 止めると、そのまま 残ります。途中で やめても かまいません。";
  const 共通2 = "消しても、ほかの 記録・ノート・ひつじは 変わりません。";
  if (String(kind || "") === "teacher") {
    return [共通1, "公開の 講座で 教わった方は、分けて 書いてください。", 共通2];
  }
  return [共通1, 共通2];
}
