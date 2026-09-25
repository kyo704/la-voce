// ============================================================================
// ★予定の 中身（★2026-09-26・C群 最後の 2枚の 1つ）
//
//   ★見本 `SC['予定の中身']`。★「自分の コマ」の 升目を 押して 開きます。
//   ★台帳 `public.my_timetable`（★`title` ／ `kind`）。
//
//   ★★★`kind` は sql/93 で 入りました（★2026-09-26・本番 131本目）。
//     ★★この 1列が 無い あいだ、★この 画面は **作りませんでした** ──
//       ★守れない 約束が 2つ あった からです（★下の 断りの 2行）。
//     ★★既定は `school`。★いまの 13行は すべて 学校の 時間割 です。
//
//   ★★★下の 2行は **約束** です ──
//     ①「ここには レッスンを 入れられません。空きに 戻すと、入れられるように なります。」
//       ★★`unavailable` が その ままの 意味 です。★行が あれば レッスンは 入りません。
//     ②「この 名前が 見えるのは あなただけです。事務にも 生徒にも 出ません。」
//       ★★`my_timetable` の 決まりは `auth.uid() = user_id` 1つ だけ です
//         （★`lib/myTimetable.js` の 註・2026-09-19 に 確かめた もの）。
//       ★★事務の 画面に 出るのは「空いて いない」だけ です。
//
//   ★★★`kind` の 断りは 2つ で、★どちらを 出すかで **中身が ちがいます** ──
//     ★自分 …… 「事務から『動かしてください』と 言われません。理由も 聞かれません。」
//     ★学校 …… 「学校の 用です。行事と ぶつかったとき、事務が 相談に 来ます。」
//     ★★★前者は **守らねば ならない 約束** です。★台帳では 止めません ──
//       ★止めるのは 画面の 決まり です（★sql/93 の 註 ── ★「これは ご自分の 予定ですね」と
//         ★分かること 自体が、★動かしてと 言う きっかけに なる）。
//       ★★だから 事務に `kind` を 渡す コードを 書かない こと。
//
//   ★見張り components/tests/yotei-no-nakami.test.js
// ============================================================================

/** ★戻る 先（★見本 `bk('自分の 予定')`）。 */
export const BACK_TO = "自分の 予定";

/** ★升目を 選んで いない ときの 1枚（★見本の 前半）。 */
export const NOT_PICKED_TITLE = "予定を 選んでください";
export const NOT_PICKED_NOTE = "一覧から、見たい 予定を 押してください。";

/** ★どちらの 予定か（★見本の `pills`）。 */
export const KIND_LABEL = "どちらの 予定ですか";

/**
 * ★2つ（★札の 字と、★台帳に 入る 字）。
 *
 *   ★★★台帳は `school` ／ `self` です（★`my_timetable_kind_check`）。
 *     ★★札は「学校の 予定」「自分の 予定」。★取り違えないため、対で 持ちます。
 */
export const KINDS = Object.freeze([
  Object.freeze({ key: "school", label: "学校の 予定" }),
  Object.freeze({ key: "self", label: "自分の 予定" })
]);

/** ★いま どちらか（★空は `school`。★台帳の 既定と 同じ）。 */
export function kindOf(row) {
  const k = (row && row.kind) || "school";
  return KINDS.some((x) => x.key === k) ? k : "school";
}

/** ★自分の 予定か。 */
export function isSelf(row) {
  return kindOf(row) === "self";
}

/**
 * ★`kind` の 下の 1行（★見本の `usu`）。
 *
 *   ★★★自分の ほうは **約束** です。★消さないこと。
 */
export const KIND_NOTE_SELF =
  "事務から「動かしてください」と 言われません。理由も 聞かれません。";
export const KIND_NOTE_SCHOOL =
  "学校の 用です。行事と ぶつかったとき、事務が 相談に 来ます。";
export function kindNoteOf(row) {
  return isSelf(row) ? KIND_NOTE_SELF : KIND_NOTE_SCHOOL;
}

/** ★名前の 欄（★見本の `input`）。 */
export const NAME_LABEL = "何が ありますか";
export const NAME_OPTIONAL = "（空でも かまいません）";
export const NAME_PLACEHOLDER = "れい：西洋音楽史（講義）";

/**
 * ★早く 入れる 札（★見本の `BNAMES` ／ `BNAMES_P`）。
 *
 *   ★★★`kind` で 変わります。★自分の ときに「入試」は 出しません。
 */
export const NAMES_SCHOOL = Object.freeze([
  "予定", "講義", "会議", "非常勤", "入試", "行事", "移動"
]);
export const NAMES_SELF = Object.freeze([
  "予定", "用事", "通院", "お休み", "送りむかえ", "移動", "伴奏合わせ", "練習"
]);
export function namesOf(row) {
  return isSelf(row) ? NAMES_SELF : NAMES_SCHOOL;
}

/** ★札 2つ。 */
export const BTN_DELETE = "この 予定を 消す";
export const BTN_OK = "これで いい";

/** ★下の 断り（★約束。★消さないこと）。 */
export const NOTES = Object.freeze([
  "ここには レッスンを 入れられません。空きに 戻すと、入れられるように なります。",
  "この 名前が 見えるのは あなただけです。事務にも 生徒にも 出ません。"
]);

/** ★太字に する 行（★見本の `<b>`）。 */
export const NOTES_STRONG = Object.freeze([0, 1]);

/** ★台帳から 読む 列（★`select('*')` を 書かない ため）。 */
export const COLS = "id, user_id, weekday, period_id, title, kind, unavailable";

/**
 * ★台帳へ 入れる 形。
 *
 *   ★★★`unavailable` は **真の まま** です。★この 画面から 外しません ──
 *     ★外す 道は「この 予定を 消す」です（★見本の とおり）。
 *     ★★約束①「空きに 戻すと、入れられるように なります」── ★行を 消すのが 空き です。
 *   ★★名前は 空でも かまいません（★見本の 断り）。★空の ときは null。
 */
export function patchOf(v) {
  const o = v || {};
  return {
    kind: kindOf(o),
    title: o.title ? String(o.title) : null,
    unavailable: true
  };
}
