// ============================================================================
// ★希望が まだの方 ── ★出して いない 方の 一覧（★2026-09-25・C群 束2）
//
//   ★見本 `P_wariMada`（★design-v51・PC・iPad 運営）。
//
//   ★★★この 画面の 核は、★出さない ことを 責めない 形 です ──
//     「★こちらから 催促は しません。
//       ★声を かけるか、時間割の 空いている コマから 置いてください。
//       ★希望が 出ていなくても、置くことは できます。」
//   ★★これは `CLAUDE.md` の 変えない 原則「★催促しない」の、★画面での 形 です。
//
//   ★★★だから ここに 置か**ない** ものを 先に 決めます ──
//     ★★① 数の 出し方 …… 「★あと◯人」を 出しません。★人数 だけ です。
//       ★「あと」は 追い立てる 言い方 です。
//     ★★② 何日 待って いるか を 出しません。
//       ★出すと「遅い 人」が 見えます。★責める 道具に なります。
//     ★★③ 並べ替えを「待たせて いる 順」に しません。★名簿の 順 です。
//     ★★④ 押す と「知らせる」は ありません。★行き先は 置ける枠 だけ です。
//
//   ★★台帳（★2026-09-25・本番で 確かめました）──
//     ★読む: `lesson_prefs`（round_id, user_id, slot_key, level, updated_at）
//       ★決まり 3本 …… `lesson_prefs_own`（ALL）／`lesson_prefs_read_own`（SELECT）
//         ／`lesson_prefs_read_staff`（SELECT）
//       ★★事務が 読めるのは `lesson_prefs_read_staff` に よります。
//     ★★★中身（どの コマを ◎に したか）は **出しません**。
//       ★この 画面が 要るのは「★行が あるか ないか」だけ です。
//       ★中身を 出すと、★希望を 見ながら 置く ことに なります。
//         ★それは 別の 画面（置ける枠）の 仕事 です。
// ============================================================================

/** ★引く 列 だけ。★`level` も `slot_key` も 引きません（★要りません）。 */
export const COLS_PREF_WHO = "user_id";

/** ★題と 戻り先（★見本の `<h2>` と `bk`）。 */
export const TITLE = "希望が まだの方";
export const BACK_TO = "レッスン割";

/**
 * ★まだ 出して いない 方（★`lesson_prefs` に 1行も 無い 方）。
 *
 *   ★★`roster` は 名簿の 並び その まま を 受け取ります。★並べ替えません。
 *     ★★★「待たせて いる 順」に すると、★遅い 人が 上に 来ます。
 *       ★それは 責める 並び です。
 *
 * @param {Array} roster ★[{ user_id, name, sub }] ★名簿の 順
 * @param {Array} prefs  ★`lesson_prefs` の 行（`user_id` だけで よい）
 */
export function stillWaiting(roster, prefs) {
  const 出した = new Set(
    (Array.isArray(prefs) ? prefs : []).filter(Boolean).map((p) => p.user_id));
  return (Array.isArray(roster) ? roster : [])
    .filter((r) => r && r.user_id && !出した.has(r.user_id));
}

/**
 * ★小見出し（★見本 `.sub`）── ★「◯人　／　◯◯（回の 名）」。
 *
 *   ★★「あと◯人」と 書きません。★人数 だけ です。
 */
export function subLine(n, roundName) {
  const 人 = String(n) + "人";
  return roundName ? 人 + "　／　" + roundName : 人;
}

/** ★行の 右（★見本 `<s>時間割から 置く ›</s>`）。 */
export const ROW_ACTION = "時間割から 置く ›";

/** ★1人も いない とき。★褒めません ── ★ただ 事実を 書きます。 */
export const EMPTY_LINE = "みなさん 出して います。";

/** ★下の 3行（★見本の `.note`・1文字も 変えないこと）。 */
export const NOTE_LINES = Object.freeze([
  "こちらから 催促は しません。",
  "声を かけるか、時間割の 空いている コマから 置いてください。",
  "希望が 出ていなくても、置くことは できます。"
]);
