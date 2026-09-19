// ============================================================================
// ★授業の 型 ── ★決めごと 1か所（★裁定 その90・2026-09-18）
//
//   ★出どころ docs/opus/visual-*/pack/ruling-90-attendance-count.md §5 §6
//            見本 `P_presets` ／ `P_presetEdit` ／ `stJugyo`
//
//   ★★★なぜ 要る か
//     ★★音大では、★1つの 授業名を ★何人もの 先生が 持ちます。
//     ★★「声楽実技」を 6人の 先生が 持つ。★年30回・週1回 は 全部 同じ。
//     ★★★1つ 作って、★6つの 門下に 当てます。★無いと 6回 打ちます。
//
//   ★★★作る・消すのは 事務（`meibo`）だけ。★先生（`monka_write`）は 見るだけ。
//     ★★年間の 回数は **学校が 決める もの** です（★裁定 その90 §5-4）。
//     ★★台帳の 決まりも 同じ です（`supabase/migration_lesson_presets.sql`）。
//       ★★★画面と 台帳の 両方で 止めます。★画面だけ では 守りに なりません。
//
//   ★★★型を 消しても、★出席の 記録は 消えません（★裁定 その90 Q5）。
//     ★★型は **目安** です。★記録は 別 です。
//
//   ★見張り components/tests/lesson-presets-screen.test.js
// ============================================================================

import { can } from "@/lib/opsPerms";
// ★★足りない 見込みの 印は、★1か所が 持ちます。
import { SHORT_WORD } from "@/lib/attendanceCount";

/** ★題（★見本 `P_presets`）。 */
export const HEAD = "授業の 型";
export const SUB_LINE =
  "年間の 回数を 決めます　／　1つの 型を 複数の 門下に 当てられます";

/** ★年間の 回数の 幅（★台帳の `check` と 同じ 数）。 */
export const TOTAL_MIN = 1;
export const TOTAL_MAX = 400;

/**
 * ★足りると される 回数（★2026-09-19・坂本さんの お決め Q1）。
 *
 *   ★★★空の まま に できます。★決めて いない 学校も あります。
 *     ★★空なら、★★印は **1つも 出ません**（★`looksShort`）。
 *     ★★★勝手な 線を 引きません。★見本の 2/3 も、★こちらでは 決めません。
 *   ★★年間の 回数より 多く できません（★台帳の `check` と 同じ）。
 */
export const NEED_LABEL = "足りると される 回数";
//   ★★★字の 中に「★」を 書けません（★2026-09-15 の お決め・SEVERITY 2）。
//     ★★「★」は 紙の 中の 印 です。★画面に 出しません。
//     ★★★その 言葉は `lib/attendanceCount.js` の `SHORT_WORD` が 持ちます。
//       ★★2か所に 書きません。★変えた 日に 片方だけ 残ります。
export const NEED_HINT =
  `決めて いなければ、空の ままで かまいません。「${SHORT_WORD}」は 出ません。`;

/** ★はじめの 姿（★見本は 30回）。★足りる 回数は 空 です。 */
export function emptyPreset() {
  return { name: "", total_count: 30, need_count: "", note: "", teachers: [] };
}

/** ★足りる 回数が 正しい か（★空は よい）。 */
export function needOk(form) {
  if (!form) return false;
  const v = form.need_count;
  if (v === "" || v === null || v === undefined) return true;
  const n = Number(v);
  if (!Number.isInteger(n)) return false;
  return n > 0 && n <= Number(form.total_count);
}

/**
 * ★作れる か（★事務 だけ）。
 *
 *   ★★見るだけ の 方に、★作る 札を 出しません（★§8⑤）。
 *   ★★台帳も 同じ 門 です。★画面が 通しても、★台帳が 止めます。
 */
export function mayEdit(perms) {
  return can(perms, "meibo");
}

/** ★見られる か（★事務 と 先生）。 */
export function maySee(perms) {
  return can(perms, "meibo") || can(perms, "monka_write");
}

/**
 * ★出せる か。
 *
 *   ★★名前が 要ります。★空の 型を 作りません。
 *   ★★回数は 1〜400。★台帳の `check` と 同じ です。
 *     ★★★同じ 数を 2か所に 書いて います。★片方は SQL です。
 *       ★★見張りが、★SQL の 数と ここの 数を 突き合わせます。
 */
export function canSave(form) {
  if (!form) return false;
  const 名 = String(form.name || "").trim();
  if (!名) return false;
  const n = Number(form.total_count);
  if (!Number.isInteger(n)) return false;
  if (n < TOTAL_MIN || n > TOTAL_MAX) return false;
  // ★★足りる 回数は 空でも よい です。★入って いれば 筋を 見ます。
  return needOk(form);
}

/** ★出せない わけ（★黙って 押せなく しません）。 */
export function whyCannotSave(form) {
  if (!form) return "";
  if (!String(form.name || "").trim()) return "名前を 入れて ください。";
  const n = Number(form.total_count);
  if (!Number.isInteger(n)) return "回数は 数で 入れて ください。";
  if (n < TOTAL_MIN) return `回数は ${TOTAL_MIN} 以上で お願いします。`;
  if (n > TOTAL_MAX) return `回数は ${TOTAL_MAX} までで お願いします。`;
  if (!needOk(form)) {
    return `${NEED_LABEL}は、年間の 回数（${n}）までで お願いします。`;
  }
  return "";
}

/**
 * ★当てて いる 門下の 1行（★見本 ──「6つ　高橋・斎藤・渡辺 ほか」）。
 *
 *   ★★3人まで 名を 出し、★あとは「ほか」に します。
 *   ★★0の ときは「まだ どこにも」。★空に しません。
 */
export const NOT_ASSIGNED = "まだ どこにも";
export function targetsWord(names) {
  const a = (names || []).filter(Boolean);
  if (a.length === 0) return NOT_ASSIGNED;
  const 頭 = a.slice(0, 3).join("・");
  return `${a.length}つ　${頭}${a.length > 3 ? " ほか" : ""}`;
}

/** ★回数の 1行（★見本 ──「年 30回」）。 */
export function totalWord(n) {
  // ★★★`Number(null)` は **0** です（★2026-09-18・きょう 2度目）。
  //   ★★`Number.isFinite` だけ では、★渡されて いない ことを 見分けられません。
  //   ★★「まだ 決まって いない」が「年 0回」と 出ます。
  if (n === null || n === undefined || n === "") return "";
  const v = Number(n);
  return Number.isFinite(v) ? `年 ${v}回` : "";
}

/**
 * ★下の 注（★見本の `.note`。★1行も 減らしません）。
 *
 *   ★★★3行 とも、★約束の 字 です。
 *     ★★「作れるのは 事務の 方だけ」…… ★誰が 決めるか の 線
 *     ★★「年間の 回数は 学校が 決める」… ★同じ ことの 言い換え では ありません。
 *       ★★★先生が 勝手に 増やせない、と いう こと です。
 *     ★★「型を 消しても、出席の 記録は 消えません」… ★いちばん 大事な 1行
 */
export const NOTES = Object.freeze([
  "作れるのは 事務の 方だけです。先生は 見るだけ。",
  "年間の 回数は 学校が 決めるものです。",
  "型を 消しても、出席の 記録は 消えません。型は 目安です。"
]);

/** ★太く する ところ（★見本の `<b>`）。 */
export const NOTES_BOLD = Object.freeze([
  "作れるのは 事務の 方だけ",
  "学校が 決めるもの",
  "出席の 記録は 消えません"
]);

/** ★中の 画面の 注（★見本 `P_presetEdit` の `.note`）。 */
export const EDIT_NOTES = Object.freeze([
  "1つの 型を、いくつの 門下に 当てても かまいません。",
  "同じ 授業名で 先生が 何人 いても、1回 作れば 足ります。",
  "消しても、出席の 記録は 消えません。"
]);

/** ★何も 無い ときの 字。 */
export const EMPTY_HEAD = "まだ、授業の 型が ありません。";
export const EMPTY_HOW = "＋ から 作れます。";
