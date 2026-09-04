// ============================================================================
// 未成年の方に売る形（2026-09-04）
//
//   出どころ docs/opus/lavoce-判断-未成年に売ること（9月4日）.md
//
//   ★考え方（Opus・末尾の1行）
//     ★★取り消されないようにするのではなく、
//       ★取り消されても困らないようにすること。
//
//   ★同意画面は、取消権を封じません（§2）。
//     ★本人が押す確認は、★同意する能力を問われている本人が押しています。
//     ★★だから、いちばん効くのは★返金の約束です（§5）。
//
//   ★ここは「決めごとの置き場」です。★1か所にまとめます。
//     ★画面・規約・保護者の方へのページが、★ここから引きます。
//     ★同じ文が3か所にあると、★片方だけが古くなります。
//
//   ★このファイルは、ほかの lib を読み込みません。
//     検査が1本ずつ切り離して読み込むためです。
// ============================================================================

/**
 * 年齢の帯。
 *
 *   ★★いまのアプリは、まだ2択（18歳未満／以上）しか持っていません。
 *     ★`profiles.is_under_18` の真偽値だけです。
 *   ★★ですから "under15" と "teen" を、★いまは見分けられません。
 *     ★見分けるには、3帯の質問が要ります（保護者の同意の作業・スロット⑤）。
 *   ★見分けられないうちは、★どちらも UNKNOWN_MINOR として扱います。
 *     ★★安全な側は「売らない」です。★フェイルクローズ。
 */
export const AGE_BAND = {
  UNDER_15: "under15",        // ★課金の画面に到達しません
  TEEN: "teen",               // 15〜17歳。★個人の月額プランだけ
  ADULT: "adult",             // 18歳以上
  UNKNOWN_MINOR: "unknownMinor" // ★未成年だが、帯が分からない。★売りません
};

/**
 * 契約できるプラン。
 *
 *   ★年払いも、教室・団体のプランも、★未成年には出しません（§4①）。
 *   ★長期の契約ほど、取り消されたときに戻す額が大きくなります。
 */
/**
 *   ★★値は lib/plans.js の key と、★同じ文字列でなければなりません。
 *     ★決済の道が offeredPlans(band).includes(planKey) で照らします。
 *     ★planKey は、画面が送る "monthly" / "annual" です。
 *   ★★2026-09-04、ここが食い違っていて、★誰も契約できませんでした。
 *     ★"monthlyIndividual" と "monthly" で、★1件も一致しませんでした。
 *     ★同じものに、2つの名前を付けたためです。
 *   ★検査が、plans.js と突き合わせます。★片方だけ変えたら落ちます。
 */
export const PLANS = {
  MONTHLY_INDIVIDUAL: "monthly",
  ANNUAL_INDIVIDUAL: "annual",
  // ★教室・団体のプラン。★lib/plans.js には、まだありません（売らないため）。
  //   ★未成年に出さないことだけを、ここで決めています。
  ORGANIZATION: "organization"
};

/**
 * その帯の方に出してよいプラン。
 *
 *   ★帯が分からないうちは、★1つも出しません。
 */
export function offeredPlans(band) {
  if (band === AGE_BAND.ADULT) {
    return [PLANS.MONTHLY_INDIVIDUAL, PLANS.ANNUAL_INDIVIDUAL, PLANS.ORGANIZATION];
  }
  if (band === AGE_BAND.TEEN) {
    return [PLANS.MONTHLY_INDIVIDUAL];
  }
  // ★UNDER_15 と UNKNOWN_MINOR。★課金の画面に到達しません。
  return [];
}

/** 課金の画面に入れるか。 */
export function mayReachCheckout(band) {
  return offeredPlans(band).length > 0;
}

/** 未成年専用の同意画面を出すか。★18歳以上には出しません。 */
export function needsMinorConsentScreen(band) {
  return band === AGE_BAND.TEEN;
}

/**
 * ★返金の約束。★この設計でいちばん効きます（§5）。
 *
 *   ★規約（B-4）と、同意画面の★両方に、この文が入ります。
 *   ★「クーリング・オフ」とは書きません。
 *     ★★通信販売に、クーリング・オフはありません。
 *     ★無いものの名前を使うことが、★それ自体、誤りです。
 *   ★これは★自主的な返金です。
 */
/**
 *   ★★期間の制限を、★書かないこと（追補 §7）。
 *     ★未成年者の取消権は、★成人してから5年です（民法126条）。
 *     ★17歳の方の契約は、★22歳まで取り消せます。
 *     ★「30日以内に」と書くと、★その権利を狭めたと読まれます。
 *   ★★区切るのは★金額です。★時間ではありません。
 *     ★「直近のお支払い」と書きます。
 */
export const REFUND_PROMISE =
  "18歳未満の方、またはその保護者の方からお申し出があった場合は、" +
  "直近のお支払いを返金し、すぐに解約します。理由は伺いません。";

/**
 * ★申し込みに至るまでの、複数の画面に常設する1行（§8）。
 *
 *   ★出す場所は3つ：価格のページ／利用規約／決済の直前。
 *   ★文言は1つに統一します。★書き分けないこと。
 */
/**
 *   ★★「法律で決まっているため」と書かないこと（追補・既存の規則）。
 *     ★15〜17歳の方について、★これは法律が求めているものではありません。
 *     ★★私たちの決まりです。★そう書きます。
 *     ★確かめられないことも、★決まっていないことも、断言しません。
 */
export const MINOR_NOTICE_LINE =
  "18歳未満の方は、保護者の方の同意が必要です。";

/** ★常設で出す場所。★増やすときは、ここに足してから画面を触ること。 */
export const MINOR_NOTICE_PLACES = ["pricing", "terms", "checkout"];

/**
 * 更新のたびに出す1行（§9）。
 *
 *   ★これは催促ではありません。★起きたことの知らせです。
 *   ★毎月のことなので、忘れられます。
 *     ★忘れたまま続くのが、いちばん揉めます。
 *   ★未成年のあいだだけ出します。
 */
export const RENEWAL_NOTICE_LINE =
  "昨日、今月分のお支払いがありました。やめるときは、ここから。";

/**
 * 同意画面の文（§6）。
 *
 *   ★価格は、決まってから入れます。★仮の数字を書かないこと。
 *   ★チェックは★初期状態でオフ。★既定でオンにしないこと。
 *   ★「この画面を見てもらい」を残すこと。
 *     ★ただ「同意を得ました」より、★何をしたのかが具体的になります。
 */
export const MINOR_CONSENT_VERSION = "minor-billing-2026-09-v1";

/**
 * ★チェックの文（2026-09-04・追補 §5）。
 *
 *   ✕ 「この契約に同意します」
 *   ◯ ★「毎月◯◯円まで、このアプリで使ってよいと認めます」
 *
 *   ★同じチェックで、★当てはまる条文が変わります。
 *     ★「契約に同意する」は民法5条1項の同意です。
 *       ★★あったことを★証明しなければ効きません。
 *     ★「◯◯円まで使ってよい」は民法5条3項の
 *       ★★目的を定めた処分の許可です。★金額の上限が定まります。
 *
 *   ★押すのは、結局その端末を持っている人です。★それは変えられません。
 *     ★変えられないことを前提に、★返金で受けます。
 */
export function minorConsentCheckbox(monthlyYen) {
  const price = monthlyYen == null ? "◯◯円" : `${monthlyYen}円`;
  return `毎月${price}まで、このアプリで使ってよいと認めます`;
}

export function minorConsentLines(monthlyYen) {
  const price = monthlyYen == null ? "（未定）" : `${monthlyYen}円`;
  return [
    `お支払いは毎月${price}です。年ごとのお支払いはありません。`,
    "いつでも、ここから解約できます。",
    "やめ方：アプリの中から、いつでも。",
    REFUND_PROMISE,
    "お問い合わせ：woolsong.app@gmail.com"
  ];
}

/**
 * 記録するもの（§10）。
 *
 *   ★consent_records と同じ形で残します。
 *   ★★「表示していた価格」を落とさないこと。
 *     ★あとで値上げしたとき、★そのとき何円で契約したかが争点になります。
 *   ★生年月日は取りません。★帯だけです。
 */
export function buildMinorBillingRecord({ userId, band, monthlyYen, now }) {
  if (!userId || band !== AGE_BAND.TEEN) return null;
  return {
    user_id: userId,
    purpose_key: "billing.minor",
    policy_version: MINOR_CONSENT_VERSION,
    // ★契約したときの年齢帯。★生年月日ではありません。
    age_band: band,
    // ★表示していた価格。★落とさないこと。
    displayed_price_yen: monthlyYen == null ? null : Number(monthlyYen),
    granted_at: now || new Date().toISOString(),
    withdrawn_at: null
  };
}

/**
 * ★フラグの名前（追補 §9）。
 *
 *   ✕ guardian_consent_obtained   （保護者の同意を★得た）
 *   ◯ ★guardian_consent_declared  （保護者の同意を得たと★申告された）
 *
 *   ★得たかどうかを、アプリは知りません。★申告されたことだけを知っています。
 *   ★★名前を間違えると、半年後に誰かがこう言います。
 *     「この利用者は保護者の同意を得ています」──★得ていないかもしれません。
 *
 *   ★「確かめられないことを、表示しない」。
 *     ★内部の列の名前にも、同じ規則を通します。
 *
 *   ★★このフラグを、判断の根拠にしないこと。
 *     ★記録として持ちますが、★これを見て「だから大丈夫」とはしません。
 */
export const GUARDIAN_CONSENT_FLAG = "guardian_consent_declared";

/**
 * ★2つの同意は、1つにまとめられません（追補 §2）。
 *
 *   利用の同意（有料機能を含む）
 *     ★前に出せます。★登録のとき、または最初のころに。
 *     ★範囲が、あらかじめ決まっているためです。
 *
 *   教室・先生との連携の同意
 *     ★★その連携ごとに取ります。★前に出せません。
 *     ★誰とつながるかが、★そのときまで決まらないためです。
 *
 *   ★★そして、どちらの同意も、★無料の利用を止めません（追補 §3）。
 *     ★止めるのは、★有料の機能と、★連携だけです。
 */
export const CONSENT_SCOPES = {
  USAGE: "usage",       // ★前に出せる
  CONNECTION: "connection" // ★連携ごと。★前に出せない
};

/** その同意が、前に出せるか。 */
export function mayFrontLoad(scope) {
  return scope === CONSENT_SCOPES.USAGE;
}

/**
 * ★無料の利用を止めてよいか。★いつでも false です。
 *
 *   ★同意を待つあいだ、★アプリを使えなくしないこと。
 *   ★★止めるのは、有料の機能と、連携だけです。
 */
export function mayBlockFreeUsage() {
  return false;
}

/** 記録に必ず入る4つ。★検査が、欠けたら落とします。 */
export const MINOR_BILLING_RECORD_FIELDS = [
  "age_band", "policy_version", "granted_at", "displayed_price_yen"
];
