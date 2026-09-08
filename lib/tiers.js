// ============================================================================
// 段（tier）── 無料／¥580／¥1,280（2026-09-08 夜）
//   ★★お支払いの仕方（月々・1年）は lib/plans.js です。★別ものです。
//
//   ★出どころ 2026-09-08・Opus の価格モデル
//     ★無料　　 2つのたなから1つ（4点まとめて）　年 56点
//     ★¥580　　 4つのたなから1つ、週に1点ずつ　　年 108点
//     ★¥1,280　 えらぶ必要がない。その月の16点が そのまま　年 244点
//
//   ★★段は 3つだけです。★増やさないこと。
//   ★★段を 決めるのは、★Stripe の 値段の鍵（price id）です。
//     ★★契約したときの 申告（metadata.plan）では ありません。
//       ★あちらは 人が 入れる値なので、★取りちがえが 起きます。
//       ★値段の鍵は、★Stripe が 付けます。★間違えようが ありません。
//
//   ★★どの鍵が どの段かは、★環境変数で 持ちます。
//     ★★本番と 試しで 鍵が ちがうためです。★書き込みません。
//       STRIPE_PRICE_ID_MONTHLY　★¥580（★lib/plans.js と 同じ鍵です）
//       STRIPE_PRICE_ID_FULL 　　★¥1,280（★これから 作っていただきます）
//     ★★入っていなければ、★その段には なりません。★勝手に 上げません。
//
//   ★★null は「まだ 決めていない」です。★無料として 読みます。
//     ★★埋めません（backfill しません）。★読むときに 決めます。
//     ★「選んでいない」と「無料を選んだ」を、★見分けられなくなるためです。
//
//   ★★lib/plans.js とは 別ものです。
//     ★あちらは「月々 ¥580 ／ 1年 ¥4,800」という、★お支払いの 仕方の 話です。
//     ★★こちらは「よそおいを どれだけ 受け取れるか」の 段です。
//     ★2026-09-08、★あちらに 書きこもうとして 上書きしました。★誤りです。
//       ★組み立てが 落ちて 気づき、★git から 戻しました。
//
//   ★見張り components/tests/tiers.test.js
// ============================================================================

/** ★段。★3つだけです。 */
export const FREE = "free";
export const BASIC = "basic";   // ★¥580
export const FULL = "full";     // ★¥1,280

export const TIERS = Object.freeze([FREE, BASIC, FULL]);

/**
 * ★1年に お届けする 点数（★段ごと）。
 *
 *   ★★数は ここだけです。★画面でも webhook でも 書かないこと。
 */
export const YEARLY_ITEMS = Object.freeze({
  [FREE]: 56,
  [BASIC]: 108,
  [FULL]: 244
});

/** ★えらぶ たなの 数（★無料 2つ／¥580 4つ／¥1,280 えらばない）。 */
export const SHELVES = Object.freeze({
  [FREE]: 2,
  [BASIC]: 4,
  [FULL]: 0
});

/**
 * ★Stripe の 値段の鍵から、★段を 決めます。
 *
 *   ★★知らない鍵なら、★null を 返します。★無料に 落としません。
 *     ★★落とすと、★お金を払った方から 取り上げることに なります。
 *     ★null は「分からない」です。★呼ぶ側が 決めます。
 */
export function tierFromPriceId(priceId, env) {
  const e = env || {};
  const id = String(priceId || "");
  if (!id) return null;
  if (e.STRIPE_PRICE_ID_FULL && id === e.STRIPE_PRICE_ID_FULL) return FULL;
  if (e.STRIPE_PRICE_ID_MONTHLY && id === e.STRIPE_PRICE_ID_MONTHLY) return BASIC;
  if (e.STRIPE_PRICE_ID_ANNUAL && id === e.STRIPE_PRICE_ID_ANNUAL) return BASIC;
  return null;
}

/**
 * ★いま 効いている 段。
 *
 *   ★★契約が 生きていなければ、★無料です。
 *     ★trialing と active だけを、★生きているとします。
 *   ★★段が 入っていなければ、★無料として 読みます（★null のまま 埋めません）。
 */
export function effectiveTier(subscription) {
  const s = subscription || {};
  const alive = s.status === "active" || s.status === "trialing";
  if (!alive) return FREE;
  return TIERS.includes(s.tier) ? s.tier : FREE;
}

/**
 * ★柄の 2色目を 選び直せるか。
 *
 *   ★★¥1,280「よそおい ぜんぶ」の方だけです（★2026-09-08・Opus）。
 *   ★★きょうまでは、★門の名簿で 暫定に していました。
 *     ★段が 入ったので、★ここが 正になります。
 */
export function mayChooseSecondColorByTier(subscription) {
  return effectiveTier(subscription) === FULL;
}

/** ★年払いの 終わりの日（★申し込みの日から 1年）。 */
export function oneYearFrom(startIso) {
  const d = new Date(startIso);
  if (Number.isNaN(d.getTime())) return null;
  // ★★1月1日では ありません。★申し込みの日から 1年です（★2026-09-08 の決め）。
  //   ★1月1日は「よそおいの 年のテーマ」が 変わる日で、★お金の日では ありません。
  d.setFullYear(d.getFullYear() + 1);
  return d.toISOString();
}
