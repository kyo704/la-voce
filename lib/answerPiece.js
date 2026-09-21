// ============================================================================
// ★曲目を 答える ── ★決めごと 1か所
//   ★出どころ 見本 `SC['曲目を答える']`／★裁定 その94 §4c「REPLY_ROUND_TRIP」
//
//   ★★★送るのは **曲の 名の 並び** か、★決まった ことば 2つ だけ です。
//     ★★曲の 名は **データ** です。★書いた 文では ありません（★§4c `why_safe`）。
//     ★★自由に 書ける 欄を 置きません。
//
//   ★★★たずねられて いる ときにしか 送れません。
//     ★★台帳の 門が 見ます（★`migration_message_insert_guard.sql`）。
//     ★★画面でも 出しませんが、★門が 本体 です。
//
//   ★見張り components/tests/answer-piece.test.js
// ============================================================================
import { tx } from "@/lib/t";

export const HEAD = tx("曲目を 答える");
/** ★誰から たずねられて いるか。★お名前は 呼ぶ側が 入れます。 */
export const ASKED_BY = tx("{s} さんから、曲目を たずねられています");

export const FROM_REP = tx("レパートリーから");
export const ADD_HERE = tx("＋ ここで 曲を 足す");
export const ADD_NOTE = tx("まだ 入れていない 曲は、ここで 足せます。レパートリーにも 入ります。");
export const ADD_HINT = tx("曲の 名前");
export const ADD_OK = tx("足す");
export const OR_HEAD = tx("または");
export const SUBMIT = tx("送る");
export const EMPTY_REP = tx("まだ レパートリーが ありません。");

/** ★決まった ことば 2つ（★見本の「または」）。 */
export const FALLBACKS = Object.freeze([
  { key: "kyokumoku_kore_kara", label: tx("曲目は これから 決めます") },
  { key: "toujitsu_made_ni", label: tx("当日までに お伝えします") }
]);

/** ★下の 断り（★見本の `.note`）。 */
export const NOTES = Object.freeze([
  tx("曲の 名前だけを お伝えします。自由に 書くことは できません。"),
  tx("そのほかの ことは、話が まとまってから ご自分たちで お決めください。")
]);
export const NOTES_BOLD = tx("曲の 名前だけを お伝えします。");

/**
 * ★まだ できない こと。
 *
 *   ★★見本の 板には「作った人」も あります。
 *     ★★`repertoire_tessitura` に その 列が ありません。
 *     ★★列の 無い ものを、★入れ口だけ 作りません。
 */
export const NOT_YET = Object.freeze([
  { key: "composer", label: tx("作った人"),
    when: tx("レパートリーに 作った人の 列を 置く、と 決まった とき") }
]);

/** ★はじめの 姿。 */
export function emptyForm() {
  return { pieces: [], fallback: null };
}

/**
 * ★送れるか。
 *
 *   ★★曲を 1つ 以上 選んだ か、★決まった ことばを 1つ 選んだ か。
 *   ★★★両方は できません。★どちらか です。
 *     ★★曲を 選びながら「これから 決めます」は、★食い違います。
 */
export function canSubmit(f) {
  if (!f) return false;
  const 曲 = Array.isArray(f.pieces) ? f.pieces : [];
  const 決 = FALLBACKS.some((x) => x.key === f.fallback);
  if (曲.length > 0 && 決) return false;
  return 曲.length > 0 || 決;
}

/** ★送れない わけ。 */
export function whyNot(f) {
  const 曲 = (f && Array.isArray(f.pieces)) ? f.pieces : [];
  const 決 = FALLBACKS.some((x) => x.key === (f && f.fallback));
  if (曲.length > 0 && 決) return tx("曲を 選ぶか、下の どちらかを 選ぶか、いずれかに してください。");
  if (曲.length === 0 && !決) return tx("曲を 選ぶか、下の どちらかを 選んでください。");
  return "";
}

/**
 * ★台帳に 渡す 形。
 *
 *   ★★`application_id` と `sender_user_id` は 呼ぶ側が 入れます。
 *   ★★曲を 選んだ ときは `kyokumoku_kotae`。★並びを 添えます。
 *   ★★決まった ことばの ときは、★並びを 付けません（★台帳の 縛り）。
 */
export function toRow(f) {
  const 曲 = Array.isArray(f.pieces) ? f.pieces : [];
  if (曲.length > 0) {
    return { template_key: "kyokumoku_kotae", pieces: 曲 };
  }
  return { template_key: f.fallback, pieces: null };
}

/** ★足す 曲の 名。★前後の 空きを 落とします。★空は 足しません。 */
export function cleanName(s) {
  return String(s || "").trim();
}
