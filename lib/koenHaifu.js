// ============================================================================
// ★配る ── ★公演の くばりもの（★2026-09-25・C群 第1段）
//
//   ★見本 `P_haifu`（★design-v51・PC・iPad 運営）。
//
//   ★★★見本の 約束 2つ（★1文字も 変えないこと）──
//     ①「読んだかどうか、読んだ 数は 出しません」
//     ②「楽譜は 配りません（著作権の ため）。配れるのは 香盤表・稽古予定・演出ノート・進行表です」
//
//   ★★①が この 画面の 核 です。
//     ★★★配った 側が「誰が 読んだか」を 知れる ように すると、
//       ★読んで いない 人を 探す 道具に なります。
//     ★台帳にも その 道が ありません ── `export_log` は 出した 側の 記録 だけ です。
//
//   ★★②は 決めごと です。★配れる ものを 4つに 限ります。
//     ★★楽譜を 除くのは 著作権の ため です。★「たぶん だいじょうぶ」で 広げません。
//
//   ★★台帳（★2026-09-25・本番で 確かめました）──
//     ★書く: `record_export(p_org_id, p_what, p_rows)`（SECURITY DEFINER）
//       ★中で `memberships` を 確かめます。★その 学校の 人 以外は 書けません。
//       ★`export_log` に 直に 書く 道は ありません。
//     ★読む: `export_log`（org_id, user_id, what, rows, created_at, org_name_at）
//
//   ★★★足りて いない もの（★隠しません）
//     ★見本の 一覧は 3列 です ── ★名前 ／ 配った 日 ／ **誰に 届いたか**。
//     ★★`export_log` に「誰に」を しまう 列が ありません。
//       ★あるのは `rows`（★何件 ぶんか）だけ です。
//     ★★★だから「第3幕に 出る方」の ような 字を 出しません。
//       ★出すなら しまう 場所が 要ります。★無い ものを 画面で 作ると、
//       ★次に 開いた とき 消えます。★お尋ねして います。
// ============================================================================

/** ★台帳の 関数と 表（★字は ここ 1か所 です）。 */
export const RECORD_FN = "record_export";
export const LOG_TABLE = "export_log";

/** ★`export_log` から 引く 列 だけ。★`select('*')` を 書きません。 */
export const COLS_EXPORT_LOG = "id, what, rows, created_at";

/** ★題と 小見出し（★見本の `<h2>` と `.sub`）。 */
export const TITLE = "配る";
export const SUB = "香盤表・稽古予定・演出ノート";

/**
 * ★配れる もの（★見本の `.note` ②）。
 *
 *   ★★この 4つ だけ です。★増やす ときは 裁定が 要ります。
 *   ★★楽譜は 入って いません。★著作権の ため です。
 */
export const CAN_SHARE = Object.freeze([
  "香盤表", "稽古予定", "演出ノート", "進行表"
]);

/** ★配れる ものか。★知らない ものは false ── ★迷ったら 配らない。 */
export function mayShare(what) {
  const s = String(what || "").trim();
  if (!s) return false;
  return CAN_SHARE.some((k) => s.startsWith(k) || s.includes(k));
}

/** ★押しどころ（★見本の `.pill`）。 */
export const BTN_ADD = "＋ PDF を 配る";

/**
 * ★確かめの 字（★見本の `askShow`）。
 *
 *   ★★「届いたことを お知らせは しません」── ★これも 約束 です。
 *     ★知らせを 出すと、★読ませる ための 道具に なります。
 */
export const ASK_HEAD = "配りますか";
export const ASK_LINES = Object.freeze([
  "届いたことを お知らせは しません。開いたときに 見えます。"
]);

/** ★下の 2行（★見本の `.note`・1文字も 変えないこと）。 */
export const NOTE_LINES = Object.freeze([
  "読んだかどうか、読んだ 数は 出しません。",
  "楽譜は 配りません（著作権の ため）。配れるのは 香盤表・稽古予定・演出ノート・進行表です。"
]);

/** ★1つも 無い とき。 */
export const EMPTY_LINE = "まだ 配って いません。";

/**
 * ★配った 日の 言い方。
 *
 *   ★★見本は「10月16日に 配りました」です。
 *   ★★年を 出しません ── ★同じ 公演の 中の 話 だから です。
 */
export function sharedWord(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return (d.getMonth() + 1) + "月" + d.getDate() + "日に 配りました";
}

/**
 * ★並べ替え ── ★新しい ものが 上。
 *
 *   ★★台帳の 並びに 頼りません。★関数を 直した 日に 黙って 変わります。
 */
export function sortShared(rows) {
  const list = Array.isArray(rows) ? rows.filter(Boolean) : [];
  return [...list].sort((a, b) =>
    String(b.created_at || "").localeCompare(String(a.created_at || "")));
}
