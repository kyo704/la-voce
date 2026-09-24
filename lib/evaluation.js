import { featureOn } from "@/lib/featureOn";

/** ★採点の 鍵（★`feature_flags` の key）。★字は ここ 1か所 です。 */
export const SCORING_KEY = "scoring";

// ============================================================================
// ★採点（★裁定 その105）── ★決めごと 1か所
//
//   ★★★出さない もの（★裁定 §Q1）
//     ★順位 ／ 平均との 差 ／ 偏差値 ／ 分布の 中の 位置
//     ★★合計・平均は 出して よい。★ただし **くらべる 表** に しません。
//     ★★★既定の 並びは 学籍番号順。★点の 順に 並べ替えません。
//
//   ★★★見える 範囲（★§Q1・§Q2）
//     ★審査員 …… ご自分の 点。★ほかの 審査員の 点は つけ終わるまで 見えません
//     ★事務・学長（`saiten`）…… ぜんぶ
//     ★学生 …… ★確定の あと の、ご自分の 点 だけ
//
//   ★★★型を 決めるのは 学校 です（★§Q3）。★先生は 見るだけ。
//     ★点が 入った あとは 変えられません。
//
//   ★見張り components/tests/evaluation.test.js
// ============================================================================

import { can } from "@/lib/opsPerms";

export const HEAD = "評価の 型";
export const SUB_LINE =
  "この 学校の 評価の 仕方を 決めます。こちらからの 既定は ありません。";

/** ★型を 直せる 方（★`saiten`）。★先生は 見るだけ です。 */
export function mayEditItems(perms) {
  return can(perms, "saiten");
}

/** ★きざみ（★見本の 3つ。★「整数のみ」は 1 と 同じ です）。 */
export const STEPS = Object.freeze([
  { key: "1", label: "1点", value: 1 },
  { key: "0.5", label: "0.5点", value: 0.5 }
]);

export const MAX_MIN = 1;
export const MAX_MAX = 1000;

/** ★入れられる 点か（★満点まで・きざみに 合う こと）。 */
export function pointOk(value, item) {
  if (value === null || value === undefined || value === "") return true;
  const v = Number(value);
  if (!Number.isFinite(v)) return false;
  if (v < 0) return false;
  const max = Number(item && item.max_points);
  if (Number.isFinite(max) && v > max) return false;
  const step = Number((item && item.step) || 1);
  return Math.abs(Math.round(v / step) - v / step) < 1e-9;
}

/**
 * ★札に 出す 点の 並び（★0 から 満点まで・2026-09-24）。
 *
 *   ★出どころ  見本 `SC['点を入れる']` の 註 ──
 *     「点は 札で 選びます。手で 打ちません。
 *       （ホールの 暗がりで、細かい 数字を 打つのは 難しいからです）」
 *     ★★Opus の 確かめ（design-v42）──「満点までしか 札を 作らない」が 正しい 解き方。
 *
 *   ★★★満点を 超える 札を 作りません。
 *     ★これが「満点超過で 停止」の いちばん 確かな 形 です。
 *     ★★出して から 止めるのでは ありません。★はじめから ありません。
 *
 *   ★★きざみは 学校が 決めます（`step` は 1 か 0.5）。
 */
/**
 * ★採点の となりの 2枚（審査員を 足す／実技試験を 組む）を 出して よいか。
 *
 *   ★★2つ 揃った ときだけ です（★2026-09-24）──
 *     ① 鍵が 開いて いる（`scoring`）
 *     ② 採点の できことを 持って いる
 *   ★★どちらか 欠けたら 出しません。★押せない 札を 置きません（★裁定176 §3）。
 *   ★★★判じるのは ここ だけ です。★画面で 組み立てません。
 */
export function mayGoJury(features, canSaiten) {
  return featureOn(features, SCORING_KEY) && canSaiten === true;
}

export function pointChoices(item) {
  if (!item) return [];
  const 満 = Number(item.max_points);
  const 刻 = Number(item.step) || 1;
  if (!Number.isFinite(満) || 満 <= 0 || 刻 <= 0) return [];
  const 出 = [];
  for (let v = 0; v <= 満 + 1e-9; v += 刻) 出.push(Math.round(v * 2) / 2);
  return 出;
}

export function whyPointBad(value, item) {
  if (pointOk(value, item)) return "";
  const v = Number(value);
  const max = Number(item && item.max_points);
  if (Number.isFinite(max) && v > max) return `満点は ${max}点 です。`;
  const step = Number((item && item.step) || 1);
  return `${step}点 きざみで 入れて ください。`;
}

/**
 * ★型を 変えられるか（★裁定 §Q3 の caution）。
 *
 *   ★★★点が 入った あとに 変えると、★入力済みの 点が 宙に 浮きます。
 *     ★★だから 止めます。★「すでに N件 点が 入って います」と お伝えします。
 */
export function mayChangeItem(item, scoreCount) {
  return !(Number(scoreCount) > 0);
}
export function whyCannotChangeItem(scoreCount) {
  const n = Number(scoreCount) || 0;
  return n > 0 ? `すでに ${n}件 点が 入って います。` : "";
}

/** ★「使わない に する」と「消す」の ちがい（★見本の 字）。 */
export const OFF_LABEL = "使わない に する";
export const OFF_NOTE = "点は 残ります。集計に 入りません。あとで もどせます。";
export const DELETE_LABEL = "消す";
export function deleteNote(scoreCount) {
  const n = Number(scoreCount) || 0;
  return n > 0
    ? `${n}人ぶんの 点も 消えます。もどせません。`
    : "点は 入って いないので、そのまま 消せます。";
}

/**
 * ★まとめ（★合計・平均 だけ）。
 *
 *   ★★★順位・偏差値・平均との 差は 出しません（★裁定 §Q1）。
 *   ★★使わない 項目は 入れません。
 */
export function totalOf(scores, items) {
  const 使う = new Set((items || []).filter((i) => i && i.in_use).map((i) => i.id));
  const 並 = (scores || []).filter((s) => s && 使う.has(s.item_id) && s.points != null);
  if (並.length === 0) return null;
  return 並.reduce((n, s) => n + Number(s.points), 0);
}

/** ★何人ぶん 入って いるか（★数 だけ）。 */
export function enteredCount(scores) {
  return (scores || []).filter((s) => s && s.points != null).length;
}

/** ★既定の 並び ── ★名前順（★点の 順に しません）。 */
export function defaultOrder(rows) {
  return [...(rows || [])].sort((a, b) =>
    String((a && a.name) || "").localeCompare(String((b && b.name) || ""), "ja"));
}

/** ★確定（★`saiten` を 持つ 方 だけ）。★確定の あと、学生に 見えます。 */
export function mayConfirm(perms) {
  return can(perms, "saiten");
}
export const CONFIRM_LABEL = "確定する";
export const CONFIRM_NOTE =
  "確定すると、学生 ご本人に、ご自分の 点だけ が 見えます。";

/** ★確定の あとの 直しは 記録に 残ります（★裁定 §Q4）。 */
export const AFTER_CONFIRM_NOTE =
  "確定の あとで 直すと、誰が いつ 直したかを 残します。学生にも お知らせします。";

/** ★書けなかった ときの 1行（★わけを 作りません）。 */
export const FAILED_LINE = "いま 直せませんでした。もう一度 お試し ください。";

// ----------------------------------------------------------------------------
// ★採点の 一覧（★見本 `P_saiten`）と、★点を 入れる（★`P_tenIreru`）
// ----------------------------------------------------------------------------
//   ★★★進み具合は **色で 出しません**。★言葉で 出します（★見本の 字）。
//     ★★「未入力 ／ 入力中 ／ 済」の 3つ です。
//   ★★★締切の 前は、★ほかの 審査員の 点は 見えません（★§Q1）。
//     ★★見えない ことを、★画面に 書きます。★黙って 隠しません。

export const LIST_HEAD = "受験者";
export const LIST_SUB = "名簿の 対象から 出して います";

/** ★1人ぶんの 進み（★色を 使いません）。 */
export const PROGRESS = Object.freeze({
  none: "未入力", some: "入力中", done: "済"
});

/**
 * ★その方の 進み。
 *
 *   ★★`items` …… 使う 項目 だけ を 渡して ください。
 *   ★★`scores` …… ★その方・その 審査員の 点 だけ。
 */
export function progressOf(scores, items) {
  const 使う = (items || []).filter((i) => i && i.in_use);
  if (使う.length === 0) return PROGRESS.none;
  const 入 = 使う.filter((i) =>
    (scores || []).some((s) => s && s.item_id === i.id && s.points != null)).length;
  if (入 === 0) return PROGRESS.none;
  return 入 === 使う.length ? PROGRESS.done : PROGRESS.some;
}

/** ★まとめの 出し方（★「27 / 35」。★順位は 付けません）。 */
export function totalWord(scores, items) {
  const 合 = totalOf(scores, items);
  const 満 = (items || []).filter((i) => i && i.in_use)
    .reduce((n, i) => n + Number(i.max_points || 0), 0);
  if (合 === null) return "—";
  return `${合} / ${満}`;
}

export const ENTRY_NOTES = Object.freeze([
  "項目と 満点は、貴学が 決めた 型から 出て います。",
  "締切の 前は、ほかの 審査員の 点は 見えません。",
  "色では 出しません。言葉で 出します。"
]);

export const LIST_NOTES = Object.freeze([
  "進み具合は、色では 出しません。「未入力／入力中／済」の 言葉で 出します。",
  "締切の 前は、ほかの 審査員の 点は 見えません。",
  "この 一覧は、行事に 決めた 対象から 出て います。名簿が 変わると 変わります。"
]);

export const ENTRY_LABEL = "入れる";
export const REVIEW_LABEL = "講評";
export const DONE_LABEL = "つけ終わる";
export const DONE_NOTE =
  "つけ終わると、ほかの 審査員の 点が 見える ように なります。あとからも 直せます。";
export const SAVED_LINE = "入れました。";

// ----------------------------------------------------------------------------
// ★確定と、★確定の あとの 直し（★裁定 その105 §Q2・§Q4）
// ----------------------------------------------------------------------------
//   ★★★確定を 押すと、★学生 ご本人に「ご自分の 点」と「講評」が 見えます。
//     ★★つけた 直後には 見えません。★学校が 押すまで 見えません。
//   ★★★確定の あとの 直しは、★わけを 添えて いただきます。
//     ★★誰が・いつ・前の 値・あとの 値 を 残します。★消せません。
//     ★★学生にも お知らせします。

/** ★確定したか（★その 行事の 点が 1つでも 確定して いるか）。 */
export function isConfirmed(scores) {
  return (scores || []).some((s) => s && s.confirmed_at);
}

export const CONFIRM_ASK = "この 行事の 点を 確定しますか。";
export const CONFIRM_ASK_NOTE =
  "確定すると、学生 ご本人に「ご自分の 点」と「講評」が 見えます。"
  + "あとから 直す ときは、わけを 添えて いただきます。";
export const CONFIRMED_WORD = "確定済み";
export function confirmedWord({ scores, reviews }) {
  const s = Number(scores) || 0;
  const r = Number(reviews) || 0;
  return `点 ${s}件、講評 ${r}件を 確定しました。`;
}

/** ★確定の あとに 直す ときの 字。 */
export const EDIT_REASON_LABEL = "直す わけ";
export const EDIT_REASON_HINT = "あとで 見て 分かる ように、短くて かまいません。";
export const EDIT_LABEL = "わけを 添えて 直す";
export const EDIT_NOTE =
  "確定の あとの 直しは、誰が いつ 直したかを 残します。学生にも お知らせします。";
export const EDIT_FAILED = "いま 直せませんでした。もう一度 お試し ください。";

/** ★わけを 書かないと 押せません（★記録の 意味が なくなる ため）。 */
export function mayEditConfirmed(reason) {
  return String(reason || "").trim().length > 0;
}
export const EDIT_WHY_EMPTY = "わけを 書いて ください。";

export const NOT_YET_LINES = Object.freeze([
  "率（％）も、順位も 出しません。",
  "点の 順に 並べ替える ことは できません。"
]);
