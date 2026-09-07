// ============================================================================
// 有料化のお知らせ ── ★1つの決めを、ここが持ちます
//
//   出どころ 利用規約 第3条「有料での提供を開始する場合には、事前にお知らせします」
//            Opus の見立て（30日前）／坂本さんの決め（2026-09-07）
//
//   ★★順番を、逆にしないこと。
//     ① 仕組みを作る（★出さない。★動くことだけ確かめる）
//     ② 日付を決める
//     ③ 30日前に、出す
//     ④ 有料を開ける
//     ⑤ ★そのあとで、規約 第3条を書き換える
//   ★★④を先にやると「知らないうちに有料になった」と言われます。
//     ★⑤を先にやると、規約と実物が食い違います。
//
//   ★★日付が決まるまで、★何も出ませんし、★1通も送りません。
//     ★GO_LIVE_DATE = null が、★その状態です。
// ============================================================================

import { GATE_CLOSING_LINES } from "@/lib/freeTier";

/**
 * ★有料を開ける日（YYYY-MM-DD）。
 *
 *   ★★まだ決まっていません（2026-09-07）。
 *     ★どの形にするか（案A/B/C）、体験期間、年額の割引が、まだ決まっていません。
 *   ★★null のあいだは、★お知らせも出ませんし、★メールも送りません。
 *     ★入れるまで、★この仕組みは動きません。★それが正しい状態です。
 */
export const GO_LIVE_DATE = null;

/** ★何日前から知らせるか。★Opus の見立て。 */
export const NOTICE_DAYS_BEFORE = 30;

/**
 * ★知らせ始める日。★lib/freeTier.js の GATE_STARTS_AT と同じ形です。
 *   ★日付から引き算します。★手で2つ書きません（★ずれます）。
 */
export const NOTICE_STARTS_AT = GO_LIVE_DATE
  ? shiftDate(GO_LIVE_DATE, -NOTICE_DAYS_BEFORE)
  : null;

/** ★アプリの中で見たか。★user_notices に、この鍵で残します。 */
export const NOTICE_KEY = "pricingChange";

/** ★メールを送ったか。★同じ表に、★別の鍵で残します（★表を作りません）。 */
export const MAIL_KEY = "pricingChangeMail";

/**
 * ★いま、知らせてよい日か。
 *
 *   ★★日付が決まっていなければ、★いつでも false です。
 *   ★★今日を、呼ぶ側が渡します。★ここで時計を引きません。
 */
export function noticeIsDue(todayISO) {
  if (!NOTICE_STARTS_AT || !todayISO) return false;
  return todayISO >= NOTICE_STARTS_AT;
}

/**
 * ★その方に、送ってよいか。
 *
 *   ★★送らない方
 *     ・こちら側の口座（is_internal）… ★坂本さんの決め（2026-09-07）
 *     ・退会を申し出た方（deleted_at）… ★30日の猶予の最中です
 *     ・メールアドレスが無い方
 *   ★★「見たかどうか」は、ここでは見ません。★呼ぶ側が持ちます。
 */
export function mayMail(profile, email) {
  if (!profile) return false;
  if (profile.is_internal === true) return false;
  if (profile.deleted_at) return false;
  if (!email || typeof email !== "string" || !email.includes("@")) return false;
  return true;
}

/**
 * ★お知らせの文。
 *
 *   ★★lib/freeTier.js の GATE_CLOSING_LINES を、★そのまま入れます。
 *     ★あちらに「この2行を、必ず添えること」と書かれています。
 *     ★書き写しません。★引いてきます。★2か所になると、片方だけ直る日が来ます。
 *
 *   ★★禁じた言い方を、★使っていません。
 *     ・急かす言葉（まだ／忘れ／途切れ／連続／達成／頑張）
 *     ・「見られません」「できません」「無料期間が終わり」
 *   ★★「一部の機能」の中身は、★ここに詰めこみません。
 *     ★短い文に詰めると、★かえって不安にさせます。★リンク先で書きます。
 */
export function noticeParagraphs(goLiveLabel) {
  const day = goLiveLabel || "（日付は、決まりしだいお知らせします）";
  return [
    `${day}より、一部の機能が有料になります。`,
    GATE_CLOSING_LINES.join("\n"),
    "受診用のまとめも、これからも無料です。",
    "詳しくは、こちらをご覧ください。"
  ];
}

/** ★メールの件名。★急かしません。★「重要」「至急」と書きません。 */
export const MAIL_SUBJECT = "Woolsong ── 一部の機能が有料になります";

/** ★メールの本文。★アプリの中と、同じ文にします。★2つ書きません。 */
export function mailBody(goLiveLabel, linkUrl) {
  const lines = noticeParagraphs(goLiveLabel);
  return lines.join("\n\n") + (linkUrl ? `\n${linkUrl}\n` : "\n");
}

/** ★日付をずらします。★時計は引きません。 */
function shiftDate(iso, delta) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d + delta));
  return dt.toISOString().slice(0, 10);
}
