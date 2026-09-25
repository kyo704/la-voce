// ============================================================================
// ★お仕事を選ぶ（★2026-09-25・C群）
//
//   ★見本 `SC['お仕事を選ぶ']`（★design-v75）。
//   ★字と 決めは `lib/workField.js` が 持ちます。★ここでは 決めません。
//
//   ★★★選んでも 記録を 1行も 触りません（★下の 断りの 1行目）。
//     ★送るのは `profiles.field` 1つ だけ です。
//   ★★★丸は 見本の 形 です（★17px・塗りは 内側の 影）。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  BACK_TO, TITLE, LEAD_LINES, FIELDS, isChosen, NOTE_LINES, NOTE_STRONG
} from "@/lib/workField";

export default function WorkField({ field, onPick, onBack }) {
  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />

      <div style={{ margin: "0 0 12px" }}>
        {LEAD_LINES.map((l, i) => (
          <p key={i} style={{ fontSize: "0.8125rem", color: C.inkSoft, lineHeight: 1.9 }}>{l}</p>
        ))}
      </div>

      <div style={{
        borderRadius: 10, border: `1px solid ${C.line}`, background: C.card,
        overflow: "hidden"
      }}>
        {FIELDS.map((f, i) => {
          const 選 = isChosen(field, f.key);
          return (
            <button key={f.key} type="button" onClick={() => onPick && onPick(f.key)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, width: "100%", minHeight: 44, padding: "12px 13px",
                border: "none", borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
                background: "transparent", color: C.ink, textAlign: "left",
                cursor: "pointer"
              }}>
              <span>
                <span style={{ fontSize: "0.9375rem", lineHeight: 1.7 }}>{f.name}</span>
                <span style={{
                  display: "block", fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.8
                }}>{f.sub}</span>
              </span>
              {/* ★見本の 丸。★選んで いる ものは 塗ります。 */}
              <span aria-hidden="true" style={{
                flex: "0 0 auto", width: 17, height: 17, borderRadius: "50%",
                border: `1.6px solid ${選 ? C.curtain : C.line}`,
                background: 選 ? C.curtain : "transparent",
                boxShadow: 選 ? `inset 0 0 0 3px ${C.card}` : "none"
              }} />
            </button>
          );
        })}
      </div>

      {/* ★★5行 とも 約束 です。★消さないこと。 */}
      <div style={{ marginTop: 14 }}>
        {NOTE_LINES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", lineHeight: 1.9,
            color: NOTE_STRONG.includes(i) ? C.ink : C.inkSoft,
            fontWeight: NOTE_STRONG.includes(i) ? 600 : 400
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
