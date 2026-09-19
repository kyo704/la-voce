"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, H3, Card, Li, Note, Warn } from "@/components/UiV2";
import {
  WITHDRAW_HEAD, WITHDRAW_WARN, WITHDRAW_GONE, WITHDRAW_KEPT,
  WITHDRAW_KEPT_WORD, WITHDRAW_KEPT_LINE, WITHDRAW_DO, WITHDRAW_CANCEL,
  WITHDRAW_NOTES
} from "@/lib/guardianConsent";

// ============================================================================
// ★保護者の 同意を 取り消す（★見本 `SC['同意を取り消す']`・裁定 その107 §4）
//
//   ★★決めは lib/guardianConsent.js が 持ちます。★ここでは 決めません。
//   ★★★「消える もの」と「消えない もの」を、★両方 並べます。
//     ★★消えない ものを 書かないと、★押す 手が 止まります。
//   ★★★記録は 1つも 消えません。★そこを いちばん 大きく 書きます。
//
//   ★見張り components/tests/guardian-consent.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function GuardianWithdraw({
  orgName, onWithdraw, onClose, busy, error = "", done = ""
}) {
  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={WITHDRAW_HEAD} right={
        onClose ? (
          <button type="button" onClick={onClose}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, padding: "0 4px", fontFamily: FONT_STACK
            }}>‹ 戻る</button>
        ) : null} />
      {orgName ? <p style={{ ...小, margin: "-4px 0 10px" }}>{orgName}</p> : null}

      <Warn>
        {WITHDRAW_WARN.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
      </Warn>

      <H3>消える もの</H3>
      <Card style={{ padding: 0 }}>
        {WITHDRAW_GONE.map((t, i) => (
          <Li key={t} last={i === WITHDRAW_GONE.length - 1}>{t}</Li>
        ))}
      </Card>

      <H3>消えない もの</H3>
      <Card style={{ padding: 0 }}>
        {WITHDRAW_KEPT.map((t, i) => (
          <Li key={t} last={i === WITHDRAW_KEPT.length - 1}
            right={<span style={{ color: C.sage }}>{WITHDRAW_KEPT_WORD}</span>}>{t}</Li>
        ))}
      </Card>
      <p style={{ ...小, margin: "4px 0 12px" }}>{WITHDRAW_KEPT_LINE}</p>

      {done ? (
        <p style={{ ...TYPE.usual, color: C.sage, margin: 0 }}>{done}</p>
      ) : (
        <>
          <button type="button" disabled={busy}
            onClick={() => onWithdraw && onWithdraw()}
            style={{
              width: "100%", minHeight: 52, borderRadius: 12,
              border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
              background: C.curtain, color: C.onCurtain,
              fontSize: rem(15.5), fontFamily: FONT_STACK
            }}>{busy ? "いま 取り消して います" : WITHDRAW_DO}</button>
          {onClose ? (
            <button type="button" onClick={onClose}
              style={{
                width: "100%", minHeight: 48, marginTop: rem(8), borderRadius: 12,
                border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
                fontSize: rem(14.5), fontFamily: FONT_STACK
              }}>{WITHDRAW_CANCEL}</button>
          ) : null}
          {error ? <p style={{ ...小, margin: "6px 0 0", color: C.ink }}>{error}</p> : null}
        </>
      )}

      <Note>
        {WITHDRAW_NOTES.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
      </Note>
    </div>
  );
}
