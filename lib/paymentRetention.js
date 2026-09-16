// ============================================================================
// ★お支払いの 記録だけは、★法律で 残します（★第3段・2026-09-16）
//
//   ★★出どころ　坂本さん（★2026-09-16・第3段）──
//     「★subscriptions の行を 全部 消しては いけません。
//       ★法人税法・所得税法 ── 取引の帳簿は 7年 保存。
//       ★GDPR 17条3項(b) ── 法的義務の履行に必要な場合は 削除しない。
//       ★個情法も 同じ。
//       ★★個人が 分からない形で（user_id を 切り離す）」
//
//   ★★これは「★消さない こと」では ありません。
//     ★★消します。★**その方と 結びつく ところ**を 消します。
//       ★消す … user_id・お名前・メール
//       ★残す … 金額・日付・お客さま番号・契約番号・やめた日・プラン
//     ★★残った 行から、★その方を 引き当てる 道は ありません。
//
//   ★★7年の 数え方 ── ★取引の 日から です。★退会の 日では ありません。
//     ★★税の 帳簿は「その 取引が いつ 起きたか」で 数えます。
//
//   ★★この 一枚が 決める こと ──
//     ★① どの 列を 残すか（★これ以外は 残しません）
//     ★② どの 列を 切るか（★人に 結びつく もの）
//     ★③ 画面と 紙に 書く 文（★3か所で 同じ 字）
// ============================================================================

/**
 * ★`subscriptions` から 残す 列。
 *
 *   ★★`user_id` は **入れません**。★切る ためです。
 *   ★★`trial_end` も 入れません ── ★取引では ありません。
 */
export const KEEP_FROM_SUBSCRIPTION = Object.freeze([
  "stripe_customer_id",
  "stripe_subscription_id",
  "plan",
  "status",
  "current_period_end"
]);

/**
 * ★`purchases`（★買い切り）から 残す 列。
 *
 *   ★★`tier` は 残しません ── ★何を 見せるかの 話で、★取引の 額では ありません。
 */
export const KEEP_FROM_PURCHASE = Object.freeze([
  "stripe_session_id",
  "stripe_payment_intent",
  "stripe_price_id",
  "plan",
  "amount_yen",
  "started_at",
  "ends_at",
  "status"
]);

/**
 * ★人に 結びつく ので、★**必ず 切る** 列。
 *
 *   ★★見張りが、★この どれかが 残り先に 入って いないかを 見ます。
 *   ★★足す ときは ここに 足して ください。★1か所で 決めます。
 */
export const MUST_SEVER = Object.freeze([
  "user_id", "email", "display_name", "name", "line_user_id"
]);

/** ★残す 先の 表。★`user_id` の 列を **持ちません**。 */
export const RETENTION_TABLE = "payment_records";

/** ★法律で 決まった 年数。★取引の 日から 数えます。 */
export const RETENTION_YEARS = 7;

/**
 * ★1行を、★残す 形に 直します。
 *
 *   @param row    ★もとの 行
 *   @param keep   ★残す 列の 一覧
 *   @param kind   "subscription" ／ "purchase"
 *
 *   ★★知らない 列は 落とします。★「残す」と 決めた ものだけ 通します。
 *     ★★逆（★「切る」と 決めた ものだけ 落とす）に すると、
 *       ★新しい 列が 増えた とき、★黙って 残って しまいます。
 */
export function toRetained(row, keep, kind) {
  if (!row) return null;
  const out = { kind };
  keep.forEach((k) => {
    if (row[k] !== undefined) out[k] = row[k];
  });
  // ★★いつ 切ったか。★7年の 起点では ありません。★記録の ため です。
  out.severed_at = new Date().toISOString();
  return out;
}

/** ★切り忘れが 無いか。★見張りと 道の 両方から 呼びます。 */
export function severedProblems(retained) {
  if (!retained) return ["行が ありません"];
  return MUST_SEVER.filter((k) => retained[k] !== undefined)
    .map((k) => "★" + k + " が 残って います");
}

/**
 * ★画面と 紙に 書く 文（★3か所で 同じ 字）。
 *
 *   ★★きょう、★同じ ことを 2か所で 別々に 書いて いて 食い違いました
 *     （★書き出しの 約束）。★だから 1か所に 置きます。
 *   ★★退会の 画面・特商法・個人情報の 取扱い ── ★3つとも ここを 読みます。
 */
export const RETENTION_LINES = Object.freeze([
  "記録・ノート・レパートリー・手に入れたものは、全て 消えます。",
  "お支払いの 記録だけは、法律で 7年 保存する ことに なっています。",
  "お名前や メールとは 切り離して 残します。"
]);

/** ★紙（特商法・個人情報）に 書く ときの 言い方。★「お客さま」で 書きます。 */
export const RETENTION_LINES_FORMAL = Object.freeze([
  "記録・ノート・レパートリー・手に入れたものは、すべて消えます。",
  "お支払いの記録だけは、法律で7年保存することになっています。",
  "お客さまのお名前やメールアドレスとは切り離して残します。"
]);
