// ============================================================================
// 導線の数を、1つ増やす（画面の側・2026-09-04）
//
//   ★★待ちません。★失敗しても、画面を止めません。
//     ★数が取れないことより、★画面が止まることのほうが重いです。
//   ★★体調の値も、メールアドレスも、識別子も、★渡す口がありません。
//     ★渡せるのは、★段の名前だけです。
//   ★外部の解析サービスへは、★1バイトも出しません。
// ============================================================================

import { buildCountPayload } from "@/lib/onboardingFunnel";

export function countStep(step) {
  const body = buildCountPayload(step);
  // ★知らない段は、★送りません。★黙って捨てます。
  if (!body) return;
  if (typeof fetch !== "function") return;
  try {
    fetch("/api/onboarding/count", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
      // ★画面が切り替わっても、★送りきります。
      keepalive: true
    }).catch(() => {});
  } catch (e) {
    // ★何もしません。★数のために、画面を止めないこと。
  }
}
