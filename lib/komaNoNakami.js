// ============================================================================
// ★コマの 中身（★2026-09-26・C群 最後の 2枚の 1つ）
//
//   ★見本 `SC['コマの中身']`。★「レッスンの 日程を 組む」の 升目から 開きます。
//   ★台帳 `public.lessons`
//     （★`duration_minutes` ／ `place_id` ／ `repeat_kind` ／ `repeat_until`）。
//
//   ★★★`repeat_kind` と `repeat_until` は sql/93 で 入りました
//     （★2026-09-26・本番 131本目）。★それまで この 画面は 作りませんでした ──
//     ★見本の 約束「繰り返すなら「いつまで」を 決めてください（無期限に しません）」が
//       ★守れなかった から です。
//   ★★★台帳の 側も 同じ ことを 言います ── `lessons_repeat_needs_until`。
//     ★★画面で 止め、★台帳でも 止めます。★どちらか 片方に しません。
//
//   ★★★下の 3行は **約束** です ──
//     ①「長さも 場所も 繰り返しも、あとから いつでも 決められます。」
//       ★★ぜんぶ おまけ です。★決めなくても レッスンは 置かれて います。
//     ②「繰り返すなら「いつまで」を 決めてください（無期限に しません）。」
//       ★★`canSave` が 止めます。★台帳の CHECK も 止めます。
//     ③「場所は 覚えておくだけです。部屋の 予約は しません。」
//       ★★`place_id` を 置くだけ です。★空きを 押さえる 道は ありません。
//
//   ★★★長さは **1分きざみ** です（★見本の「上下に スワイプして 合わせます」）。
//     ★★5分きざみに 丸めません。★45分の レッスンも 50分の レッスンも あります。
//
//   ★見張り components/tests/koma-no-nakami.test.js
// ============================================================================

/** ★戻る 先（★見本 `bk('レッスンの 日程を 組む')`）。 */

import { tx } from "@/lib/t";
export const BACK_TO = tx("レッスンの 日程を 組む");

/**
 * ★コマが 外れて いた とき（★見本の `if(!pl) …`）。
 *
 *   ★★★開いて いる あいだに、★その コマが 外された ことが あります。
 *     ★★白い 1枚に しません。★何が 起きたかを 書きます。
 *   ★★「もう一度 お試しください」と 言いません ── ★同じ ことを しても 戻りません。
 */
export const GONE_TITLE = tx("外れています。");
export const GONE_HOW = tx("戻って 置き直してください。");

/** ★上の 断り（★見本の `card`）。★おまけ だと 先に 言います。 */
export const OPTION_LINES = Object.freeze([
  tx("ここから 下は オプションです。"),
  tx("決めなくても、レッスンは 置かれています。")
]);

/** ★節の 題（★見本の `fl`）。 */
export const HEAD_LEN = tx("オプション　── 長さ");
export const HEAD_PLACE = tx("オプション　── 場所");
export const HEAD_REPEAT = tx("オプション　── 繰り返し");
export const HEAD_UNTIL = tx("オプション　── いつまで");

/** ★場所を 足す・消す（★見本の 右上の 札）。 */
export const PLACE_EDIT = tx("足す・消す ›");

/** ★長さの 下の 1行（★見本の `usu`）。 */
export const LEN_HINT = tx("上下に スワイプして 合わせます（1分きざみ）");

/** ★きざみ（★1分）。★丸めません。 */
export const LEN_STEP = 1;

/** ★長さの 幅（★時間は 0〜4。★見本の `col(5,hh,'h')`）。 */
export const LEN_HOURS = 5;
export const LEN_MINUTES = 60;

/** ★既定の 長さ（★見本 ── `if(typeof pl.len!=='number')pl.len=45`）。 */
export const LEN_DEFAULT = 45;

/** ★「1時間05分」の 形（★見本の `lenlab`）。 */
export function lenWord(mins) {
  const n = Number(mins);
  const m = Number.isFinite(n) && n >= 0 ? Math.round(n) : LEN_DEFAULT;
  return `${Math.floor(m / 60)}時間${String(m % 60).padStart(2, "0")}分`;
}

/** ★時間と 分に 分ける。 */
export function splitLen(mins) {
  const n = Number(mins);
  const m = Number.isFinite(n) && n >= 0 ? Math.round(n) : LEN_DEFAULT;
  return { h: Math.floor(m / 60), m: m % 60 };
}

/** ★時間と 分から 分に 戻す。 */
export function joinLen(h, m) {
  return Math.max(0, Number(h) || 0) * 60 + Math.max(0, Number(m) || 0);
}

/**
 * ★繰り返しの 4つ（★札の 字と、★台帳に 入る 字）。
 *
 *   ★★★台帳は `once` ／ `weekly` ／ `biweekly` ／ `monthly`
 *     （★`lessons_repeat_kind_check`）。★札は 見本の 字 です。
 *   ★★対で 持ちます。★取り違えると 台帳に 弾かれます（★23514）。
 */
export const REPEATS = Object.freeze([
  Object.freeze({ key: "once", label: tx("この日だけ") }),
  Object.freeze({ key: "weekly", label: tx("毎週") }),
  Object.freeze({ key: "biweekly", label: tx("隔週") }),
  Object.freeze({ key: "monthly", label: tx("月1回") })
]);

/** ★いま どれか（★空は `once`。★台帳の 既定と 同じ）。 */
export function repeatOf(row) {
  const k = (row && row.repeat_kind) || "once";
  return REPEATS.some((x) => x.key === k) ? k : "once";
}

/** ★繰り返すか（★`once` 以外）。 */
export function repeats(row) {
  return repeatOf(row) !== "once";
}

/** ★いつまでを 決めて いない ときの 字（★見本の `決めていません`）。 */
export const UNTIL_EMPTY = tx("決めていません");
export const UNTIL_PICK = tx("カレンダーで 選ぶ ›");

/**
 * ★いつまでの 下の 1行（★見本の `usu`）。
 *
 *   ★★★これは **約束** です ──「日は カレンダーからだけ 選べます」。
 *     ★★だから 打ち込む 欄を 置きません。★`<input type="date">` も 置きません。
 *       ★★あれは 端末によって 打ち込めます。★「カレンダーからだけ」に なりません。
 */
export const UNTIL_HINT = tx("日は カレンダーからだけ 選べます（押し間違いを 防ぐため）");

/** ★札。 */
export const BTN_OK = tx("これでいい");

/** ★下の 断り（★約束。★消さないこと）。 */
export const NOTES = Object.freeze([
  tx("長さも 場所も 繰り返しも、あとから いつでも 決められます。"),
  tx("繰り返すなら「いつまで」を 決めてください（無期限に しません）。"),
  tx("場所は 覚えておくだけです。部屋の 予約は しません。")
]);

/** ★太字に する 行（★見本の `<b>`）。 */
export const NOTES_STRONG = Object.freeze([0, 1]);

/** ★台帳から 読む 列（★`select('*')` を 書かない ため）。 */
export const COLS =
  "id, student_id, teacher_id, scheduled_at, duration_minutes, place_id, repeat_kind, repeat_until";
export const COLS_PLACE = "id, org_id, name, ord";

/**
 * ★まとめの 1行（★見本の 下の `card`）。
 *
 *   ★★決めた ものだけ 並べます。★空の ものを「―」で 埋めません。
 */
export function summaryOf(row, placeName) {
  const r = row || {};
  const 並 = [lenWord(r.duration_minutes)];
  if (placeName) 並.push(placeName);
  const rep = REPEATS.find((x) => x.key === repeatOf(r));
  if (rep) 並.push(rep.label);
  if (repeats(r) && r.repeat_until) 並.push(`${r.repeat_until} まで`);
  return 並.join("　");
}

/**
 * ★送れる か（★約束② ── ★無期限に しません）。
 *
 *   ★★★台帳の `lessons_repeat_needs_until` と 同じ こと を 言います。
 *     ★★弾かれる 前に、★画面で 止めます。★押せない わけも 出します。
 */
export function canSave(row) {
  const r = row || {};
  if (!repeats(r)) return true;
  return /^\d{4}-\d{2}-\d{2}$/.test(String(r.repeat_until || ""));
}

/** ★送れない わけ（★出さないと、★押せない 理由が 分かりません）。 */
export const WHY_CANNOT = tx("「いつまで」を 決めてください。");
export function whyCannotSave(row) {
  return canSave(row) ? "" : WHY_CANNOT;
}

/**
 * ★台帳へ 入れる 形。
 *
 *   ★★`once` に 戻した ときは、★`repeat_until` を **空に します**。
 *     ★★残すと、★繰り返さない のに 期限が ある 行に なります。
 */
export function patchOf(row) {
  const r = row || {};
  const k = repeatOf(r);
  return {
    duration_minutes: Math.max(0, Math.round(Number(r.duration_minutes) || LEN_DEFAULT)),
    place_id: r.place_id || null,
    repeat_kind: k,
    repeat_until: k === "once" ? null : (r.repeat_until || null)
  };
}
