// ============================================================================
// ★退会の 前に、★お支払いの 会社の ほうを 先に 止める（★第2段）
//
//   ★★出どころ　坂本さん（★2026-09-16・第2段）──
//     「★1 Stripe の解約を 先に 呼ぶ ／ ★2 成功を 確かめる
//       ★3 成功した ときだけ、記録を 消す ／ ★4 失敗したら 中止し、そう 伝える
//       ★★消してから 呼ぶ形は、★失敗したとき 何も 残りません」
//
//   ★★★いちばん 大事な ところ ── ★**写しを 見ません**。
//
//     ★★台帳 ㊶（★2026-09-16）──
//       「`subscriptions` は Stripe の 写しです。
//         ★写しだけを 見て 判断すると 間違えます」
//     ★★実際、★手で 書いた 見せかけの 行が 1つ ありました。
//       ★台帳では「有効な契約 2件」、★本当は 1件 でした。
//
//     ★★だから ここでは、★**会社に 直に 聞きます**。
//       ★写しから 引くのは `stripe_customer_id`（★どの お客さまか）だけ。
//       ★★「いくつ 契約が 生きて いるか」は、★会社の 答えだけ を 使います。
//       ★★写しに 無い 契約も、★これで 見つかります。
//
//   ★★止める のは `cancel`（★即時）です。★`cancel_at_period_end` では ありません。
//     ★★期末までの 取り消し予約に すると、★その あいだに 記録が 消えて、
//       ★★誰の 契約か 分からない ものが 残ります。
//     ★★退会は「いま 去る」です。★請求も いま 止めます。
//     ★★払った ぶんの お返しが ある かは、★別の 決め です（★紙に 書いて います）。
// ============================================================================

import { stripe, stripeConfigured } from "./stripe.js";

/** ★まだ お金が 動く 状態。★`lib/activeSubscription.js` と 同じ 考え です。 */
export const LIVE_STATUSES = Object.freeze([
  "active", "trialing", "past_due", "unpaid", "incomplete"
]);

/**
 * ★その お客さまの 契約を、★会社に 聞いて、★生きて いれば 止めます。
 *
 *   @param customerId ★`stripe_customer_id`（★写しから 引く 唯一の もの）
 *   @returns { ok, cancelled: [id], failures: [{id, message}] }
 *
 *   ★★`ok` が false の あいだは、★**1行も 消しては いけません**。
 */
export async function cancelLiveSubscriptions(customerId) {
  if (!customerId) {
    // ★お客さま番号が 無い ＝ ★会社に 登録が ありません。★止める ものも ありません。
    return { ok: true, cancelled: [], failures: [] };
  }
  if (!stripeConfigured()) {
    // ★★鍵が 無い のに 進めません。★止められたか 確かめられない から です。
    //   ★★「確かめられない」を「止まって いる」と 同じに しません。
    return {
      ok: false, cancelled: [],
      failures: [{ id: null, message: "お支払いの 会社に つながる 用意が ありません。" }]
    };
  }

  const cancelled = [];
  const failures = [];
  try {
    // ★★`status: "all"` で 聞きます。★生きて いる ものだけ を 選ぶのは こちら です。
    //   ★★会社の 言う「all」には、★もう 終わった ものも 入ります。
    const list = await stripe.subscriptions.list({
      customer: customerId, status: "all", limit: 100
    });
    const live = (list.data || []).filter((s) => LIVE_STATUSES.includes(s.status));
    for (const sub of live) {
      try {
        const done = await stripe.subscriptions.cancel(sub.id);
        // ★★★止まった ことを、★返事で 確かめます（★手順 2）。
        //   ★★呼べた ことと、★止まった ことは 別 です。
        if (done && done.status === "canceled") {
          cancelled.push(sub.id);
        } else {
          failures.push({
            id: sub.id,
            message: "止まりませんでした（" + ((done && done.status) || "状態が 読めません") + "）"
          });
        }
      } catch (e) {
        failures.push({ id: sub.id, message: String((e && e.message) || e) });
      }
    }
  } catch (e) {
    // ★★聞けなかった ときは、★止めます。★「聞けない」を「無い」と しません。
    return {
      ok: false, cancelled: [],
      failures: [{ id: null, message: String((e && e.message) || e) }]
    };
  }
  return { ok: failures.length === 0, cancelled, failures };
}

/** ★止められなかった ときに、★画面へ 出す 文（★ご指示の 字）。 */
export const CANCEL_FAILED_LINES = Object.freeze([
  "いま お支払いの おやめが できませんでした。",
  "時間を おいて、もう一度 お試しください。"
]);
