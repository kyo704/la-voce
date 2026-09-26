// ============================================================================
// ★合言葉を 見せる（★門下に 招く・2026-09-26・D群・裁定83）
//
//   ★見本 `SC['合言葉を見せる']`。
//   ★★字と 決めは `lib/aikotobaMiseru.js` が 持ちます。★ここでは 決めません。
//
//   ★★★送る 道を 作りません ── ★メールも LINE も 貼りません。
//     ★「顔合わせで、お手元で お見せください」と 書いて いる から です。
//   ★★★合言葉は とても 大きく 出します（★裁定83「画面の 半分くらい」）。
//   ★★QR は 作りません ── ★外の 道具を 呼びません。★字だけ で 足ります。
//   ★★選び直す 画面を 作りません（★約束②）。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  BACK_TO, TITLE, leftWord, untilWord, BTN_COPY, BTN_RENEW, BTN_LIMITS,
  noteLines, noteStrong, GONE_LINE, GONE_HOW, isGone
} from "@/lib/aikotobaMiseru";

export default function AikotobaMiseru({
  code, status, monkaName, onCopy, onRenew, onEditLimits, onBack
}) {
  const 消 = isGone(status);
  const 右 = [leftWord(status), untilWord(status)].filter(Boolean).join("　／　");

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />
      {monkaName ? (
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "-2px 0 14px" }}>
          {monkaName}
        </p>
      ) : null}

      {消 ? (
        <div>
          <p style={{ fontSize: "0.9375rem", color: C.ink }}>{GONE_LINE}</p>
          <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: 5 }}>{GONE_HOW}</p>
        </div>
      ) : (
        <div style={{
          padding: "26px 18px", textAlign: "center", borderRadius: 14,
          border: `1px solid ${C.line}`, background: C.card
        }}>
          {/* ★★とても 大きく（★裁定83）。★1文字ずつ 離します（★読み上げる ため）。 */}
          <div style={{
            fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
            fontSize: "2.375rem", letterSpacing: "0.3em", fontWeight: 600, lineHeight: 1.3,
            color: C.ink
          }}>{code || ""}</div>
          {右 ? (
            <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: 18 }}>{右}</p>
          ) : null}
        </div>
      )}

      <div style={{ display: "flex", gap: 9, marginTop: 11 }}>
        {onCopy ? (
          <button type="button" onClick={onCopy}
            style={{
              flex: 1, minHeight: 44, borderRadius: 10, border: `1px solid ${C.line}`,
              background: C.card, color: C.ink, fontSize: "0.90625rem", cursor: "pointer"
            }}>{BTN_COPY}</button>
        ) : null}
        {onRenew ? (
          <button type="button" onClick={onRenew}
            style={{
              flex: 1, minHeight: 44, borderRadius: 10, border: `1px solid ${C.line}`,
              background: C.card, color: C.ink, fontSize: "0.90625rem", cursor: "pointer"
            }}>{BTN_RENEW}</button>
        ) : null}
      </div>
      {onEditLimits ? (
        <button type="button" onClick={onEditLimits}
          style={{
            display: "block", width: "100%", minHeight: 44, marginTop: 9, borderRadius: 10,
            border: `1px solid ${C.line}`, background: C.card, color: C.ink,
            fontSize: "0.90625rem", cursor: "pointer"
          }}>{BTN_LIMITS}</button>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {noteLines(status).map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", lineHeight: 1.9,
            color: noteStrong(status).includes(i) ? C.ink : C.inkSoft,
            fontWeight: noteStrong(status).includes(i) ? 600 : 400
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
