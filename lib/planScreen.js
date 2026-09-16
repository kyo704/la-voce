// ============================================================================
// ★プランの 画面（★見本 `SC['プラン']`）が 言う ことを、★1か所に 置きます。
//
//   ★★2026-09-16、★門の 中の プランの 画面は **まっ白** でした。
//     ★★中身が 1枚の 札だけ で、★その 札に
//       `subscribed !== true && paidGateApplies` が 付いて いました。
//     ★★`paidGateApplies` は「試しの 一覧に 居るか」です。
//       ★居ない 方には、★1つも 出ません でした。
//     ★★門の 外（38人）では、★プランは「もっと」の 中の 1節 です。
//       ★節が 1つ 減るだけ で、★空白の 画面には なりません。
//     ★★引っ越した ときに、★**空の ときの 姿**を 作って いません でした。
//
//   ★★坂本さんの お決め（★2026-09-16・DECISION_1）──
//     「★`paidGateApplies` は『★勧誘するか』の 門であって
//       『★価格を 見せるか』の 門では ない。★実装が この 2つを 混同して いた」
//     ★★だから、★プランの 画面は **どなたにも** 出ます。値段も 出ます。
//
//   ★★見本は「★払って いない 方に、★**いま 何が 無料か**を 見せる 画面」です。
//     ★実装は「★払って いない 方に、★**買える もの**を 見せる 札」でした。
//     ★★向きが 逆 でした。★見本の 向きに 直します。
// ============================================================================

import { PAID_FEATURES } from "@/lib/freeTier";

/**
 * ★いまも これからも 無料の もの（★見本の 1つめの 箱）。
 *
 *   ★★見本の 字の ままです。★1文字も 変えて いません。
 *   ★★これは「★売らない もの」の 一覧 です。
 *     ★★増やす ときは、★売り物に していない ことを 確かめて ください。
 */
export const PLAN_FREE_ROWS = Object.freeze([
  "記録", "並べる", "さかのぼる", "ノート",
  "ひつじ・おうち", "受診用の 1枚", "書き出す（CSV・JSON）"
]);

/**
 * ★調べる（★有料）の 中身（★見本の 2つめの 箱）。
 *
 *   ★★「何が 有料か」を 決めて いるのは `lib/freeTier.js` の `PAID_FEATURES` です。
 *     ★★ここは **言い方**だけ を 持ちます。★決めは 持ちません。
 *   ★★鍵で 結んで あります。★`PAID_FEATURES` が 増えたり 減ったり すると、
 *     ★見張り `plan-screen.test.js` が 落ちます。
 *     ★★同じ 一覧が 2か所に ある と、★片方だけ 古く なります。
 *       ★★この 家で 何度も 起きた 形 です（★値段・同意の 字・門の 判定）。
 */
export const PAID_ROW_LABEL = Object.freeze({
  summary: "詳しく 数える",
  compare: "調べることを 5つまで 選ぶ",
  stage_mode: "本番の 前の3日だけ"
});

/** ★見本の 並びで、★調べるの 行を 出します。 */
export function paidRows() {
  return PAID_FEATURES.map((k) => PAID_ROW_LABEL[k] || k);
}

/**
 * ★`PAID_ROW_LABEL` が `PAID_FEATURES` と ずれて いないか。
 *
 *   ★★見張りが 呼びます。★画面は 呼びません。
 *   ★★返すのは「★足りない 鍵」と「★余った 鍵」です。
 */
export function paidRowGaps() {
  const have = Object.keys(PAID_ROW_LABEL);
  return {
    missing: PAID_FEATURES.filter((k) => !have.includes(k)),
    extra: have.filter((k) => !PAID_FEATURES.includes(k))
  };
}

/**
 * ★いまの ご様子（★見本の いちばん 上の 札）。
 *
 *   @param subscribed ★お支払いが 続いて いるか（true / false / null）
 *
 *   ★★`null` は「★まだ 読めて いない」です。★`false` と 分けます。
 *     ★★読めて いないのに「無料です」と 言い切りません。
 *       ★★お金の 話で、★推し量った ことを 断言しない こと。
 *
 *   ★★見本は 払って いる 方に「次の お支払い　2026年10月9日」と 出します。
 *     ★★**その 日付を、★いまの 実装は 持って いません。**
 *       ★`subscriptions` から 読んで いるのは `status` と `tier` だけ です
 *       （★`components/VocalTracker.jsx`）。
 *     ★★だから 出しません。★作りません。
 *       ★★見本に 在る 日付を、★それらしく こしらえる ことは しません。
 *     ★★戻す 引き金は `tools/excluded_by_design.json` に あります。
 */
export function planState(subscribed) {
  if (subscribed === true) {
    return { title: "調べる（ひと月ごと）", sub: null, paid: true };
  }
  if (subscribed === false) {
    return { title: "無料", sub: "お支払いは ありません", paid: false };
  }
  return { title: null, sub: null, paid: false, unknown: true };
}

/**
 * ★調べるの お値段（★右の 字）。
 *
 *   ★★`lib/plans.js` から 引きます。★ここに 書き写しません。
 *     ★★2026-09-07、★年額を 5,800 → 4,800 に 下げた とき、
 *       ★値段を 直に 書いて いた ところだけが 古いまま 残りました。
 *       ★`components/CountV2.jsx` と `app/billing/page.js` の 2か所 です。
 *     ★★同じ ことを 3度目に しません。
 */
export function monthlyPriceLabel(plans) {
  const m = (plans || []).find((p) => p.interval === "month");
  return m ? m.priceLabel : null;
}

/**
 * ★画面の 最後の 但し書き。
 *
 *   ★★2026-09-16、★Opus の 差し替え文。★見本の 字の ままです。
 *
 *   ★★これまでの 字は こうでした ──
 *     「学校の 名簿に 入っている間は、調べるが 束に なっています
 *       （二重には いただきません）。
 *      名簿から 外れると 止まりますが、記録は 消えません。」
 *   ★★裁定その54（★2026-09-13・坂本さん承認済み）で こう 変わりました ──
 *     「学校の 400円は 運営のみ。★個人の 有料機能は 学生が 自分で 買う」
 *   ★★つまり「調べる」は もう 学校費用に 含まれません。
 *     ★★1文めは 事実と ちがい、★2文めの 前半も 事実と ちがいます。
 *       ★名簿から 外れても、★調べるは 止まりません。★ご自分で 払って おられます。
 *     ★★2文めの 後半「記録は 消えません」は 正しい ので、★残して あります。
 *
 *   ★★2026-09-16、★`lib/freeTier.js` の `SCHOOL_BUNDLE_LINES` を 消し、
 *     ★`app/billing/page.js` も ここを 読む ように しました。
 *     ★★**同じ ことを 言う 場所は 1つ**です。★2つに しません。
 *       ★★この 家で 何度も 起きた 形 です ── ★片方だけ 古く なります。
 */
export const PLAN_NOTE_LINES = Object.freeze([
  "調べるは、ご自分で お選びいただくものです。",
  "学校が お支払いになるのは、レッスンの 運営（日程・出欠・名簿・連絡）です。",
  "学校を 離れても、調べるは そのまま 続きます。"
]);

/** ★但し書きの 最後の 1行。★見本では 太字 です。 */
export const PLAN_NOTE_BOLD = "記録は、どちらの 場合も 消えません。";

/** ★下の ボタンの 字。 */
export const PLAN_BUTTON = Object.freeze({
  free: "調べるを 見る",
  paid: "やめる"
});

/** ★無料の 行の 右に 出す 字。 */
export const FREE_MARK = "無料";
