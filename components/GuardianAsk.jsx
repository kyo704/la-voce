"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { Card, Note } from "@/components/UiV2";
import {
  ASK_HEAD, ASK_SUB, EMAIL_LABEL, SEND_LABEL, SENT_LINE, EXPIRE_LINE,
  NOT_BLOCKED_LINES, GUARDIAN_SEES, GUARDIAN_NEVER_SEES
} from "@/lib/guardianConsent";

// ============================================================================
// ★保護者の メールを お尋ねする（★裁定 その107・2026-09-20）
//
//   ★★決めは lib/guardianConsent.js が 持ちます。★ここでは 決めません。
//   ★★★催促しません。★閉じる ところを 必ず 置きます。
//   ★★★「止まるのは 学校に 入る ことだけ」を、★その場に 書きます。
//     ★★不安に させない ため です。★記録は これまでどおり 書けます。
//
//   ★見張り components/tests/guardian-consent.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function GuardianAsk({ onSend, onClose, busy, done = "", error = "" }) {
  const [メール, setメール] = useState("");
  const 押せる = !busy && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(メール.trim());

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <Card>
        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
          <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>{ASK_HEAD}</p>
          {onClose ? (
            <button type="button" onClick={onClose}
              style={{
                background: "transparent", border: "none", color: C.inkSoft,
                ...TYPE.mini, minHeight: 44, padding: "0 4px", fontFamily: FONT_STACK
              }}>閉じる</button>
          ) : null}
        </div>
        <p style={{ ...小, margin: "2px 0 10px" }}>{ASK_SUB}</p>

        {done ? (
          <>
            <p style={{ ...TYPE.usual, color: C.ink, margin: 0 }}>{done}</p>
            <p style={{ ...小, margin: "4px 0 0" }}>{EXPIRE_LINE}</p>
          </>
        ) : (
          <>
            <label style={{ ...小, display: "block" }}>{EMAIL_LABEL}</label>
            <input
              type="email" value={メール} inputMode="email" autoComplete="email"
              onChange={(e) => setメール(e.target.value)}
              placeholder="hogosha@example.com"
              style={{
                width: "100%", minHeight: 48, borderRadius: 10, marginTop: 4,
                padding: `0 ${rem(10)}`, border: `1px solid ${C.line}`,
                background: C.paper, color: C.ink, fontSize: rem(16),
                fontFamily: FONT_STACK
              }} />
            <button type="button" disabled={!押せる}
              onClick={() => { if (押せる && onSend) onSend(メール.trim()); }}
              style={{
                width: "100%", minHeight: 52, marginTop: rem(10), borderRadius: 12,
                border: `1px solid ${押せる ? C.curtain : C.line}`, borderBottomWidth: 3,
                background: 押せる ? C.curtain : C.line,
                color: 押せる ? C.onCurtain : C.inkSoft,
                fontSize: rem(15.5), fontFamily: FONT_STACK
              }}>{busy ? "送って います" : SEND_LABEL}</button>
            {error ? <p style={{ ...小, margin: "6px 0 0", color: C.ink }}>{error}</p> : null}
          </>
        )}
      </Card>

      {/* ★★★止まるのは ここだけ、と はっきり 書きます。 */}
      <Note>
        {NOT_BLOCKED_LINES.map((t) => (
          <span key={t} style={{ display: "block" }}>{t}</span>
        ))}
      </Note>

      <Card style={{ marginTop: rem(8) }}>
        <p style={{ ...小, margin: 0 }}>
          保護者の 方に 見えるもの …… {GUARDIAN_SEES.join("／")}
        </p>
        <p style={{ ...小, margin: "2px 0 0" }}>
          保護者の 方にも 見えないもの …… {GUARDIAN_NEVER_SEES.join("／")}
        </p>
      </Card>
    </div>
  );
}
