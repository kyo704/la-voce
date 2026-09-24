// ============================================================================
// ★保護者の 同意（★裁定 その107）── ★決めごと 1か所
//
//   ★★★15〜17歳の 方が、★**学校に 入る** ときだけ の 話 です。
//     ★★個人で 使う ぶんには 要りません ── ★記録・ノート・レパートリー・羊・しらべる。
//     ★★★止めるのは「学校に 入る こと」だけ です（★裁定 §2）。
//
//   ★★★保護者に アカウントを 作らせません。★メールを 1通 だけ。
//     ★★保護者に 学生の 記録を 見せません。
//       ★★見えると、★学生が 書かなく なります（★9月10日の 線）。
//
//   ★★★催促しません。★1度 出して、★閉じたら 出しません（★裁定 §2）。
//     ★★もっと → 通って いる ところ から、★ご自分で 開けます。
//
//   ★見張り components/tests/guardian-consent.test.js
// ============================================================================

import { AGE_BANDS, ageBandOf } from "@/lib/ageGate";

/** ★同意が 要る 方か（★15〜17歳 だけ）。 */
export function needsGuardianConsent(profile) {
  return ageBandOf(profile) === AGE_BANDS.TEEN;
}

/**
 * ★学校に 入れるか。
 *
 *   ★★★18歳以上 …… ★そのまま 入れます
 *   ★★★15〜17歳 …… ★同意が 済んで いれば 入れます
 *   ★★★15歳未満 …… ★入れません（★登録の ときに 弾いて います）
 *   ★★★帯が 分からない …… ★入れません（★安全な 側へ 倒します）
 */
export function mayJoinSchool(profile, { hasConsent } = {}) {
  const 帯 = ageBandOf(profile);
  if (帯 === AGE_BANDS.ADULT) return true;
  if (帯 === AGE_BANDS.TEEN) return !!hasConsent;
  return false;
}

/**
 * ★その 学校の、★いまの ようす（★2026-09-20・坂本さんの ご指摘）。
 *
 *   ★★★「まだ ひとことを いただいて いない」ものを「取り消す」とは 言えません。
 *     ★★坂本さんが 実機で 押せて しまいました。★誤り でした。
 *     ★★★さらに、★学校から 出て しまいました ──
 *       ★その 学校には、★同意の 仕組みが できる 前から 在籍して いました。
 *       ★★同意が 作った もの では ない ものを、★取り消しが 壊しました。
 *
 *   ★★4つ です ──
 *     `none` …… まだ 何も お送りして いません
 *     `pending` …… お送りしました。★まだ 押されて いません
 *     `consented` …… ひとことを いただいて います（★取り消せます）
 *     `withdrawn` …… 取り消し済み です
 */
export const GUARDIAN_STATES = Object.freeze(["none", "pending", "consented", "withdrawn"]);

export function guardianState(rows, orgId) {
  const なか = (rows || []).filter((r) => r && String(r.org_id) === String(orgId));
  if (なか.length === 0) return "none";
  if (なか.some((r) => r.consented_at && !r.withdrawn_at)) return "consented";
  if (なか.some((r) => !r.consented_at && !r.withdrawn_at)) return "pending";
  return "withdrawn";
}

/** ★取り消せるのは、★ひとことを いただいた ときだけ です。 */
export function mayWithdraw(state) {
  return state === "consented";
}

/** ★まだ 押されて いない ときの 1行（★取り消しの 札の 代わりに 出します）。 */
export const PENDING_LINE =
  "保護者の 方に お送りしました。まだ 押されて いません。";
export const PENDING_SUB =
  "7日で 切れます。過ぎたら、もう一度 お送りください。";

export const ASK_HEAD = "保護者の 方に 1通 お送りします";
export const ASK_SUB =
  "学校に 入る ときだけ、保護者の 方の ご承知を いただいて います。";
export const EMAIL_LABEL = "保護者の 方の メールアドレス";
// ★★見本の 字 です（★`SC['保護者にお知らせ']`・2026-09-24）。★「送る」では ありません。
export const SEND_LABEL = "お送りする";
export const ASK_PLACEHOLDER = "れい：guardian@example.com";
export const SENT_LINE =
  "お送りしました。保護者の 方が 押されると、学校に 入れます。";
export const EXPIRE_LINE = "7日で 切れます。過ぎたら、もう一度 お送りください。";

/**
 * ★どの 学校の、★どなたの 門下か（★見本の 2行目）。
 *
 *   ★★★名が 分からない ときは、★その ぶんを 落とします。
 *     ★★「○○」の ままでは 出しません ── ★見本の 中の 字 です。
 */
export function askSubline({ orgName, teacherName } = {}) {
  const 並 = [];
  if (orgName) 並.push(String(orgName));
  if (teacherName) 並.push(String(teacherName) + " 先生の 門下");
  return 並.join("　／　");
}

/** ★お送りする 中身を、★先に お見せします（★見本の「お送りする 中身」）。 */
export const MAIL_PREVIEW_HEAD = "お送りする 中身";
/**
 * ★下書きの 中の 押す ところ。
 *
 *   ★★★下書きに 本当の 合言葉を 入れません。★画面は 合言葉を 触りません。
 *     ★★だから `mailLines` に これを 渡します ── ★字を 2つ 持たない ため です。
 */
export const PREVIEW_BUTTON = "［ 承知しました ］";
export function mailPreviewLines(arg) {
  return mailLines({ ...(arg || {}), url: PREVIEW_BUTTON });
}

/**
 * ★お送りした あとの 字（★見本の 上半分）。
 *
 *   ★★宛先を その場に 出します ── ★打ち間違いに 気づいて いただく ため です。
 *   ★★だから 入れ直す ところも 要ります。
 */
export const SENT_HEAD = "お送りしました";
export const RESEND_LABEL = "メールを 入れ直す";

/**
 * ★この 画面の 断り（★見本の note・★5行）。
 *
 *   ★★★3行目の かっこが 大事 です ── ★**わけ** です。
 *     ★★「見えません」だけ だと、★隠して いるように 読めます。
 *     ★★見られると 書かなく なる、★と 書きます。
 *   ★★★5行目 ── ★保護者の メールは 学校に 渡りません。
 *     ★★これは 約束 です。★`app/api/guardian/request/route.js` が 守って います。
 */
export const ASK_NOTES = Object.freeze([
  "保護者の 方に、アカウントは 要りません。メールを 1通 お送りするだけです。",
  "お子さまの 記録は、保護者の 方にも 見えません。",
  "　（見られると、書けなく なってしまうからです）",
  "いただくのは、学校に 何が 渡るかについての ひとことです。",
  "メールの 宛先は、学校には お伝えしません。"
]);

/**
 * ★送れなかった ときの 1行。
 *
 *   ★★★行は もう 出来て います。★そこを はっきり 書きます。
 *     ★★「はじめから やり直し」に させません。
 */
export const NOT_SENT_LINE =
  "いま お送りできませんでした。少し 経ってから、もう一度 お試し ください。";

/** ★止めるのは ここだけ、と はっきり 書きます。 */
export const NOT_BLOCKED_LINES = Object.freeze([
  "この あいだも、記録・ノート・レパートリー・羊・しらべる は お使いいただけます。",
  "止まるのは「学校に 入る こと」だけ です。"
]);

/** ★保護者に 見える もの・見えない もの（★裁定 §1）。 */
export const GUARDIAN_SEES = Object.freeze([
  "学校の 名前", "先生の 名前", "学校に 見える ものの 一覧"
]);
// ★★★見本に 合わせました（★2026-09-20・第7版の 荷）。★5つ です。
export const GUARDIAN_NEVER_SEES = Object.freeze([
  "声の 記録", "からだの こと", "ノート", "レパートリー", "ひつじ"
]);

/** ★学校に 見える もの・見えない もの（★メールに 書く 字）。 */
export const SCHOOL_SEES = Object.freeze(["出欠", "空いて いる 時間", "先生との やりとり"]);
// ★★見本の 並び（★5つ）。★「ひつじ」も 学校には 見えません。
export const SCHOOL_NEVER_SEES = Object.freeze([
  "声の 記録", "からだの こと", "ノート", "レパートリー", "ひつじ"
]);

/**
 * ★メールの 中身（★裁定 §1 の 字）。
 *
 *   ★★★1度きり だと 書きます。★お子さまの 記録は 見えないと 書きます。
 *   ★★件名に 学校の 名を 入れません ── ★受け取る 方の 受信箱に 残ります。
 */
export const MAIL_SUBJECT = "【Woolsong】お子さまが 学校に 入ろうと して います";

export function mailLines({ studentName, orgName, teacherName, url }) {
  const 生 = studentName || "お子さま";
  const 校 = orgName || "学校";
  const 師 = teacherName ? `${teacherName}先生の 門下` : "先生の 門下";
  return [
    `${生}さんが ${校}の ${師}に 入ろうと して います。`,
    "",
    "学校に 見える もの",
    "　" + SCHOOL_SEES.join("／"),
    "学校に 見えない もの",
    "　" + SCHOOL_NEVER_SEES.join("／"),
    "",
    "よろしければ、下を 押して ください。",
    "",
    url || "",
    "",
    "※この メールは 1度きり です。",
    "※お子さまの 記録は、保護者の 方にも 見えません。"
  ];
}

/** ★押した あとの 画面の 字。 */
export const DONE_HEAD = "承知しました";
/** ★保護者の 画面の 断り（★見本の note）。 */
export const GUARDIAN_NOTES = Object.freeze([
  "お子さまの 記録は、保護者の 方にも 見えません。",
  // ★★2026-09-24、★足しました（★見本 `SC['保護者の画面']` の note・2行目）。
  //   ★★1行目は「見えません」── ★**できない** ことを 言って います。
  //     ★★2行目は「ご本人だけの もの」── ★**なぜ そう なのか** です。
  //   ★★落ちて いると、★隠して いるように 読めます。
  "声の 記録・からだの こと・ノートは、ご本人だけの ものです。",
  "このページは 7日で 切れます。1度 押すと、二度目は ひらきません。",
  "あとで お気持ちが 変わられたら、お子さまの 画面から 取り消せます。"
]);

/**
 * ★保護者の 画面の、★いちばん 上の 1行（★見本 `SC['保護者の画面']` の warn）。
 *
 *   ★★見本の warn は「見本だけの 画面です」と 断って います。★あれは 見本の 話 です。
 *     ★★けれど その 中の **1文** は、★本物の 画面でこそ 要ります ──
 *   ★★★「保護者の 方は、Woolsong に 登録する 必要が ありません。」
 *     ★★お入りに なって いない 方が、★いきなり 開く 画面 です。
 *       ★★「まず 登録を させられるのでは」と 思われた ところで 閉じられます。
 *     ★★本当 です ── ★この 画面は 合言葉だけで 開き、★`useParams` の ほかに
 *       ★何も 見て いません。★押す 道（`/api/guardian/accept`）も、
 *       ★お入りに なって いるかを 問いません。
 */
export const GUARDIAN_NO_ACCOUNT =
  "保護者の 方は、Woolsong に 登録する 必要が ありません。";
export const GUARDIAN_LATER = "いまは やめて おく";

export const DONE_LINES = Object.freeze([
  "ありがとうございます。学校に 入れる ように なりました。",
  "この 画面は 閉じて いただいて かまいません。",
  "お子さまの 記録は、保護者の 方にも 見えません。"
]);

/** ★通らなかった ときの 1行（★わけを 分けません・裁定 その77）。 */
export const FAILED_LINE = "この 道は お使いに なれません。";

// ----------------------------------------------------------------------------
// ★取り消す（★学生 ご本人の 画面から・★見本 `SC['同意を取り消す']`）
// ----------------------------------------------------------------------------
//   ★★★「消える もの」と「消えない もの」を、★両方 並べます。
//     ★★消えない ものを 書かないと、★押す 手が 止まります。
export const WITHDRAW_LABEL = "保護者の 同意を 取り消す";
export const WITHDRAW_HEAD = "保護者の 同意を 取り消す";
export const WITHDRAW_WARN = Object.freeze([
  "取り消すと、この 教室から 出ます。",
  "保護者の 方にも、お知らせが 届きます。"
]);
export const WITHDRAW_GONE = Object.freeze([
  "この 教室の 予定・行事",
  "門下の 連絡",
  "この 教室から、あなたが 見えなく なる こと"
]);
export const WITHDRAW_KEPT = Object.freeze([
  "声の 記録", "からだの こと", "ノート", "レパートリー", "ひつじ"
]);
export const WITHDRAW_KEPT_WORD = "そのまま";
export const WITHDRAW_KEPT_LINE = "ひとつも 消えません。";
export const WITHDRAW_DO = "取り消す";
export const WITHDRAW_CANCEL = "やめる";
export const WITHDRAW_NOTES = Object.freeze([
  "これまでの 出欠と、連絡に 書いた ことは、教室の 記録として 残ります（運営の 義務です）。",
  "また 入る ときは、もう一度 保護者の 方に ひとこと いただきます。",
  "18歳に なられても、聞き直しません。一度 いただいた ひとことは、そのまま です。"
]);
export const WITHDRAW_DONE = "取り消しました。";
export const WITHDRAW_FAILED = "いま 取り消せませんでした。もう一度 お試し ください。";

/** ★取り消した ことを、★保護者に お伝えする メール。 */
export const WITHDRAW_MAIL_SUBJECT = "【Woolsong】学校に 入る ことを 取り消しました";
export function withdrawMailLines({ studentName, orgName }) {
  const 生 = studentName || "お子さま";
  const 校 = orgName || "学校";
  return [
    `${生}さんが、${校}に 入る ことを 取り消しました。`,
    "",
    "学校からは、これ以上 新しい ことは 見えません。",
    "これまでの 出欠と 連絡は、教室の 記録として 残ります。",
    "",
    "お子さまの 記録（声・からだ・ノート）は、これまでどおり",
    "保護者の 方にも 見えません。",
    "",
    "※この メールに お返事は いりません。"
  ];
}
