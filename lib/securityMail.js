// ============================================================================
// 安全に関わるお知らせのメール（2026-09-05）
//
//   出どころ docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §7
//
//   ★★9月4日に「通知メールを作らない」と決めました。★これは例外です。
//
//     お知らせのメール   ★作らない（★催促になります）
//     安全に関わるメール ★送る（★乗っ取りに気づく、唯一の手です）
//
//   ★★新しい経路ではありません。
//     ★番号を送るのに、★もうメールを使っています。
//     ★台帳05（外に出る経路）に、★行は増えません。
//     ★送る道具も、★すでにある Resend です（app/api/feedback と同じ）。
//
//   ★★新旧の両方に送ります。
//     ★古いほうは、★受け取れないかもしれません。★それでも送ります。
//     ★★「古いアドレスがまだ生きていた」場合が、★いちばん危ないからです。
//     ★その方に気づいていただく手は、★これしかありません。
// ============================================================================

/**
 * ★メールアドレスが変わったことを、★新旧の両方にお伝えします。
 *
 *   ★送れなくても、★呼んだ側を止めないこと。
 *     ★送れないことより、★入れないことのほうが重いです。
 *   ★戻り値は、★送れた宛先の数です。★0 でも、失敗ではありません。
 */
export async function sendEmailChangedNotice({ fetchImpl, apiKey, from, oldEmail, newEmail, changedVia }) {
  const send = fetchImpl || (typeof fetch !== "undefined" ? fetch : null);
  if (!apiKey || !send) return 0;

  const lines = emailChangedLines({ oldEmail, newEmail, changedVia });
  let sent = 0;
  for (const to of [oldEmail, newEmail]) {
    if (!to) continue;
    try {
      const res = await send("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          from: from || "Woolsong <onboarding@resend.dev>",
          to,
          subject: EMAIL_CHANGED_SUBJECT,
          text: lines.join("\n")
        })
      });
      if (res && res.ok) sent += 1;
    } catch (e) {
      // ★★止めないこと。★片方に届けば、気づいていただけます。
      //   ★どちらにも届かなくても、★付け替えは終わっています。
    }
  }
  return sent;
}

// ★件名。★開く前に、何の話かが分かること。
export const EMAIL_CHANGED_SUBJECT = "【Woolsong】メールアドレスが変わりました";

/**
 * ★本文。★★アドレスを、そのまま全部は書きません。
 *   ★このメール自体が、★他人の手に渡ることがあります。
 *   ★★心当たりのある方には、これで十分に分かります。
 */
export function emailChangedLines({ oldEmail, newEmail, changedVia }) {
  const via = changedVia === "recovery"
    ? "復旧の番号を使って、変更されました。"
    : "設定の画面から、変更されました。";
  return [
    "Woolsong のメールアドレスが変わりました。",
    "",
    `変更前　${maskEmail(oldEmail)}`,
    `変更後　${maskEmail(newEmail)}`,
    "",
    via,
    "",
    // ★★心当たりが無いときに、★することを書きます。
    //   ★「ご確認ください」で終わらせないこと。★何をすればよいか分かりません。
    "心当たりがないときは、このメールに返信せず、",
    "woolsong.app@gmail.com までお知らせください。",
    "",
    "記録は、これまでどおり残っています。"
  ];
}

/**
 * ★アドレスを、途中まで伏せます。
 *   ★★このメールが他人の手に渡っても、★全部は分からないようにします。
 *   ★ご本人には、★これで分かります。
 */
export function maskEmail(email) {
  const s = String(email || "");
  const at = s.indexOf("@");
  if (at <= 0) return "（不明）";
  const name = s.slice(0, at);
  const domain = s.slice(at);
  if (name.length <= 2) return name[0] + "＊" + domain;
  return name.slice(0, 2) + "＊".repeat(Math.min(name.length - 2, 6)) + domain;
}
