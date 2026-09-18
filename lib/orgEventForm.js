// ============================================================================
// ★行事を 出す ── ★決めごと 1か所（★2026-09-18）
//
//   ★出どころ 見本 `00-動く見本-PC・iPad（運営）.html` の `P_gyojiEdit`
//
//   ★★★見本の 入れ口は 7つ です。★いま 通せるのは **3つ** です。
//     ★★台帳の 列は ある のに、★`create_org_event` が 受け取りません。
//     ★★直の insert は 塞いで あります（★2026-09-04・#007）。
//       ★★`org_id` を 自由に できて、★どの 学校にも 予定を 作れて いました。
//     ★★★だから 抜け道を 作りません。★関数を 広げる 日まで、★3つ で 出します。
//
//   ★見張り components/tests/org-event-form.test.js
// ============================================================================

/** ★行事の 種類（★いまの 画面と 同じ 6つ）。 */
/** ★題の 下の 1行（★見本 `P_gyoji` の `.sub`）。 */
export const SUB_LINE = "日と 時間と 場所と 対象を 知らせます　／　出欠は 集めません";

export const EVENT_KINDS = Object.freeze([
  "本番", "試験", "合わせ", "練習", "休講", "その他"
]);

/**
 * ★いま 通せる 入れ口。★`create_org_event` が 受け取る ぶん だけ。
 *
 *   ★★★2026-09-18、★裁定 その89 で 4つ 増えました ──
 *     ★時間（はじまり／終わり）・場所・対象（学年／学科）。
 *   ★★台帳の 列も、★出す 道も、★同じ 日に 揃えて あります。
 */
export const FIELDS = Object.freeze([
  { key: "date", label: "日", required: true },
  { key: "kind", label: "種類", required: true },
  { key: "title", label: "行事の 名前", required: false },
  { key: "startTime", label: "はじまり", required: false },
  { key: "endTime", label: "終わり", required: false },
  { key: "place", label: "場所", required: false },
  { key: "grades", label: "対象 ── 学年", required: false },
  { key: "courses", label: "対象 ── 学科・コース", required: false }
]);

// ----------------------------------------------------------------------------
// ★時間（★裁定 その89 Q1・2026-09-18）
// ----------------------------------------------------------------------------
//   ★★★終わりは 入れなくて よい です（★見本の「終わりは 未定」）。
//   ★★★前後が 逆なら、★その場で 止めます。★出す ときに 気づかせません。
//     ★★台帳でも 止めます（★`EVENT_TIME_REVERSED`）。★二重に します。

/** ★時間の 近道（★見本の `+30分` など）。 */
export const TIME_STEPS = Object.freeze([30, 60, 120, 180]);
export const TIME_STEP_MIN = 5;

/** ★日の 近道（★見本の `きょう／あした／来週／来月`）。 */
export const DATE_SHORTCUTS = Object.freeze([
  { key: "today", label: "きょう", days: 0 },
  { key: "tomorrow", label: "あした", days: 1 },
  { key: "nextWeek", label: "来週", days: 7 },
  { key: "nextMonth", label: "来月", days: 30 }
]);

/** ★前後が 逆か（★見本の 赤い 断り）。 */
export function timeReversed(form) {
  const a = form && form.startTime;
  const b = form && form.endTime;
  if (!a || !b) return false;
  return b <= a;
}

/** ★はじまりが 無いのに 終わり だけ ある か。 */
export function endWithoutStart(form) {
  return !!(form && !form.startTime && form.endTime);
}

/** ★逆の ときの 断り（★見本の 字）。 */
export const TIME_REVERSED_LINE = "終わりが はじまりより 前です。直してください。";
export const END_WITHOUT_START_LINE = "はじまりも 入れて ください。";

/** ★時間の 下の 但し（★見本の 字）。 */
export const TIME_HINT =
  "はじまりを 変えると、終わりも 同じだけ ずれます。5分きざみ。キーボードで 打てます。";
/** ★日の 下の 但し（★見本の 字）。 */
export const DATE_HINT =
  "カレンダーから 選べます。キーボードでも 打てます。曜日は 自動で 出ます。";

// ----------------------------------------------------------------------------
// ★対象（★裁定 その89 Q3・2026-09-18）
// ----------------------------------------------------------------------------
//   ★★★空の 並び ＝ **みなさん**。★`null` に しません。
//     ★★`null` は「まだ 決めて いない」と「みなさん」を 分けられません。
//   ★★2軸 です ── ★学年 と 学科・コース。
//     ★★「声楽の 3年」「全学科の 1年2年」を、★そのまま 書けます。

/** ★みなさん か（★空の 並び）。 */
export function isEveryone(list) {
  return !Array.isArray(list) || list.length === 0;
}

/** ★対象の 1行（★見本の 下見の 中）。 */
export const EVERYONE_LABEL = "学校の みなさん";
export function targetLine(grades, courses) {
  const g = isEveryone(grades) ? null : grades.join("・");
  const c = isEveryone(courses) ? null : courses.join("・");
  if (!g && !c) return EVERYONE_LABEL;
  return [c, g].filter(Boolean).join("　／　");
}

/**
 * ★まだ 通せない 入れ口 ── ★わけと、★引き金。
 *
 *   ★★★列は ある のに 通せない もの が あります。
 *     ★★`start_time` / `end_time` / `target_group` は `org_events` に あります。
 *     ★★★`create_org_event` が 受け取らない だけ です。
 *   ★★【後まわし・引き金は この 束】── ★関数を 広げる 日に、★ここから 外します。
 */
// ★★★2026-09-18、★`NOT_YET` を 空に しました（★裁定 その89）。
//   ★★3つ とも 通る ように なりました ──
//     ★時間 … `create_org_event` に `p_start_time` / `p_end_time` を 足しました
//     ★対象 … `target_grades` / `target_courses` の 2列に しました
//     ★場所 … `place` の 1列を 足しました（★自由に 打ちます。★表は 作りません）
//   ★★★形は 残します。★次に「まだ できない もの」が 出た 日に、★ここへ 書きます。
export const NOT_YET = Object.freeze([]);


/**
 * ★出せる か。
 *
 *   ★★日が 無ければ 出せません（★もとからの 決め）。
 *   ★★★時間の 前後が 逆なら 出せません（★裁定 その89 Q1）。
 *   ★★★終わり だけ でも 出せません。
 */
export function canSubmit(form) {
  if (!(form && typeof form.date === "string" && /^\d{4}-\d{2}-\d{2}$/.test(form.date))) {
    return false;
  }
  if (timeReversed(form)) return false;
  if (endWithoutStart(form)) return false;
  return true;
}

/** ★はじめの 姿。★対象は 空の 並び（＝みなさん）です。 */
export function emptyForm() {
  return {
    date: "", kind: EVENT_KINDS[0], title: "",
    startTime: "", endTime: "", place: "",
    grades: [], courses: []
  };
}

/**
 * ★出す 前の 下見（★見本の `warn`・★裁定 その88 のあと G3）。
 *
 *   ★★★出す 前に、★何が 出るかを 見せます。
 *     ★★押して から「ちがった」と 気づく のを 減らします。
 *   ★★人数は ここで 数えません。★呼ぶ 側が 渡します
 *     （★`lib/orgRoster.js` と 同じ 決め ── 同じ 式を 2つ 持たない）。
 */
export function previewLines(form) {
  const f = form || {};
  const 名 = f.title || "（名前 まだ）";
  const 時 = f.startTime
    ? (f.endTime ? `${f.startTime}〜${f.endTime}` : `${f.startTime}〜`)
    : "時間 まだ";
  return {
    head: 名,
    when: [f.date || "日 まだ", 時].join("　"),
    where: f.place || "場所 まだ",
    who: targetLine(f.grades, f.courses)
  };
}

/** ★下に 出す 断り（★見本の `.note` から。★減らしません）。 */
export const FORM_NOTES = Object.freeze([
  "出欠は 集めません。出席の 提出も、その 一覧も ありません。",
  "取り下げても、静かに 1行 残ります。体調も 理由も 集めません。"
]);
