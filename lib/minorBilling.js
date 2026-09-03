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
export const PLANS = {
  MONTHLY_INDIVIDUAL: "monthlyIndividual",
  ANNUAL_INDIVIDUAL: "annualIndividual",
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
export const REFUND_PROMISE =
  "18歳未満の方、またはその保護者の方からお申し出があった場合は、" +
  "直近のお支払いを返金し、すぐに解約します。理由は伺いません。";

/**
 * ★申し込みに至るまでの、複数の画面に常設する1行（§8）。
 *
 *   ★出す場所は3つ：価格のページ／利用規約／決済の直前。
 *   ★文言は1つに統一します。★書き分けないこと。
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

export const MINOR_CONSENT_CHECKBOX =
  "保護者の方に、この画面を見てもらい、同意を得ました";

export function minorConsentLines(monthlyYen) {
  const price = monthlyYen == null ? "（未定）" : `${monthlyYen}円`;
  return [
    `お支払いは毎月${price}です。年ごとのお支払いはありません。`,
    "いつでも、ここから解約できます。",
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

/** 記録に必ず入る4つ。★検査が、欠けたら落とします。 */
export const MINOR_BILLING_RECORD_FIELDS = [
  "age_band", "policy_version", "granted_at", "displayed_price_yen"
];
