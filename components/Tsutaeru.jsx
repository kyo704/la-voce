// ============================================================================
// ★つたえる ── ★買う前の 画面（★2026-09-25・C群 第1段）
//
//   ★見本 `SC['Woolsong']`（★design-v49）。
//
//   ★★鍵（`pricing`）が 開いて いない ときは、★**何も 返しません**。
//     ★★「準備中」も 書きません（★裁定176 §3）。
//   ★★字と 値段の 出どころは `lib/tsutaeru.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import {
  mayShowTsutaeru, TITLE, LEAD_LINES, CAN_LINES,
  PRICE_LABEL, priceWord, FREE_LINES, BTN_START, BTN_LATER, NOTE_LINES
} from "@/lib/tsutaeru";

export default function Tsutaeru({ features, onBack, onStart }) {
  // ★★鍵が 開いて いない ときは 出しません。★入口も 置きません。
  if (!mayShowTsutaeru(features)) return null;

  return (
    <div>
      <Back onClick={onBack}>もっと</Back>
      <ScreenHead title={TITLE} />

      <div style={{
        marginTop: 4, padding: "13px 15px", borderRadius: 10,
        background: C.card, border: `1px solid ${C.line}`
      }}>
        {LEAD_LINES.map((l, i) => (
          <p key={i} style={{ fontSize: "0.90625rem", color: C.ink, lineHeight: 1.9 }}>{l}</p>
        ))}
        <div style={{ marginTop: 9 }}>
          {CAN_LINES.map((l, i) => (
            <p key={i} style={{ fontSize: "0.8125rem", color: C.inkSoft, lineHeight: 1.9 }}>・{l}</p>
          ))}
        </div>
      </div>

      {/* ★★値段は lib/tsutaeru.js が `tools/prices.json` から 出します。
          ★★ここに 数を 書きません（★2026-09-25 の 食いちがいの あと）。 */}
      <Box style={{ marginTop: 11 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          padding: "12px 14px"
        }}>
          <span style={{ fontSize: "0.875rem", color: C.ink }}>{PRICE_LABEL}</span>
          <span style={{ fontSize: "0.875rem", color: C.inkSoft }}>{priceWord()}</span>
        </div>
      </Box>

      {/* ★★★お金で 人との 関わりを 買わない、という 決め。
          ★★1文字も 変えないこと。★短く しないこと。 */}
      <div style={{
        marginTop: 11, padding: "12px 14px", borderRadius: 10,
        background: C.paper, border: `1px solid ${C.line}`
      }}>
        {FREE_LINES.map((l, i) => (
          <p key={i} style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.95 }}>{l}</p>
        ))}
      </div>

      <button type="button" onClick={onStart}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 12,
          borderRadius: 10, border: "none", background: C.curtain,
          color: C.onCurtain, fontSize: "0.9375rem", cursor: "pointer"
        }}>{BTN_START}</button>
      <button type="button" onClick={onBack}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 8,
          borderRadius: 10, border: `1px solid ${C.line}`, background: C.card,
          color: C.ink, fontSize: "0.9375rem", cursor: "pointer"
        }}>{BTN_LATER}</button>

      <div style={{ marginTop: 14 }}>
        {NOTE_LINES.map((l, i) => (
          <p key={i} style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.9 }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
