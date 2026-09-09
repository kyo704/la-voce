// ============================================================================
// 止まったことに 気づく ── 知らせ（2026-09-10）
//
//   ★出どころ 坂本さんの お決め（2026-09-10）
//     「★keep-alive 失敗時に 運営宛メールを 1通、★1日1通を 上限として」
//
//   ★★1日1通は、★数えずに 守ります。
//     ★（kind, sent_on）が 一意です（★supabase/2026-09-10-止まったことに気づく.sql）。
//     ★★2通目は、★入りません。★入らなければ、★送りません。
//     ★★if で 数えると、★同時に 2つ 走った ときに 2通 出ます。
//     ★数える 側では なく、★入れる 側で 決めます。
//
//   ★★落ちつづける あいだ、★毎回 届いては いけません。
//     ★1分ごとに 届く メールは、★誰も 読まなく なります。
//     ★★読まれない 知らせは、★無いのと 同じです。
//
//   ★★中身に、★人の ことを 書きません。
//     ★止まった、という 事実と、★短い わけ だけです。
//
//   ★見張り components/tests/system-alert.test.js
// ============================================================================

/** ★知らせの 種類。★増やすときは、ここへ。 */
export const ALERT_KINDS = Object.freeze(["keep-alive"]);

/** ★日本時間の 日付。★1日の 変わり目を そろえます。 */
export function todayJST(now) {
  const d = now instanceof Date ? now : new Date();
  return new Date(d.getTime() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
}

export const ALERT_SUBJECT = "【Woolsong】定期処理が失敗しました";

/**
 * ★知らせの 文。
 *
 *   ★★短く します。★読む人が、★次に 何を すればよいかだけ。
 *   ★★人の ことを 書きません。
 */
export function alertLines({ kind, detail, at }) {
  return [
    `${kind} が失敗しました。`,
    at ? `時刻：${at}` : null,
    detail ? `内容：${String(detail).slice(0, 300)}` : null,
    "",
    "Vercel の Logs で、詳しい内容をご確認ください。",
    "★このお知らせは、1日に1通までです。",
    "★直るまで、毎回は届きません。"
  ].filter((x) => x !== null);
}

/**
 * ★知らせを 1通 送ります。★きょう もう 送っていれば、★送りません。
 *
 *   @param admin     ★service role の client（★RLS を 通り抜けます）
 *   @param fetchImpl ★試すために 差し替えられます
 *
 *   @returns "sent" ／ "already" ／ "skipped"（★設定が 無い）／ "failed"
 *
 *   ★★先に 控えを 入れ、★入ったときだけ 送ります。
 *     ★★逆に すると、★送ってから 控えに 失敗し、★もう1通 出ます。
 *     ★「送りすぎる」より「送り漏らす」ほうを 選びます。
 *     ★★送り漏らしても、★翌日 また 試します。
 */
export async function sendAlertOncePerDay(admin, { kind, detail, apiKey, to, from, fetchImpl, now }) {
  if (!ALERT_KINDS.includes(kind)) return "skipped";
  if (!admin) return "skipped";
  const sentOn = todayJST(now);

  // ★★先に 控え。★重なれば、★決まりが はじきます。
  const { error } = await admin.from("system_alerts")
    .insert({ kind, sent_on: sentOn, detail: detail ? String(detail).slice(0, 300) : null });
  if (error) {
    // ★★一意の 決まりに 当たった ＝ きょう もう 送っています。★正しい姿です。
    if (String(error.code) === "23505") return "already";
    console.error("知らせの控えを残せませんでした:", error.message);
    return "failed";
  }

  if (!apiKey || !to) {
    // ★★控えは 残りました。★送れないことを、★黙って 飲みこみません。
    console.error("知らせ：RESEND_API_KEY か 宛先が ありません");
    return "skipped";
  }
  const send = fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
  if (!send) return "skipped";

  try {
    const res = await send("https://api.resend.com/emails", {
      method: "POST",
      headers: { "content-type": "application/json", authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({
        from: from || "Woolsong <onboarding@resend.dev>",
        to,
        subject: ALERT_SUBJECT,
        text: alertLines({ kind, detail, at: new Date().toISOString() }).join("\n")
      })
    });
    if (!res || !res.ok) {
      console.error("知らせを送れませんでした:", res && res.status);
      return "failed";
    }
    return "sent";
  } catch (e) {
    console.error("知らせを送れませんでした:", e && e.message);
    return "failed";
  }
}
