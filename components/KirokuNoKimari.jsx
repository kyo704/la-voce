// ============================================================================
// ★この画面の きまり ── ★記録の 約束を 出す だけ の 画面（★2026-09-25）
//
//   ★見本 `SC['記録のきまり']`（★design-v49）。
//
//   ★★台帳を 1度も 引きません。★約束の 字を 出す だけ です。
//     ★★だから 読み込み中も ありません。★出ない ことが ありません。
//   ★★字は `lib/kirokuNoKimari.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import { TITLE, RULE_LINES, PROMISE_LINES, BACK_TO } from "@/lib/kirokuNoKimari";

export default function KirokuNoKimari({ onBack }) {
  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />

      <Box>
        <div style={{ padding: "12px 14px" }}>
          {RULE_LINES.map((r, i) => (
            <p key={i} style={{
              fontSize: "0.84375rem", color: C.ink, lineHeight: 1.95,
              paddingLeft: r.indent ? "1em" : 0,
              marginBottom: r.gap ? "0.95em" : 0
            }}>
              {r.indent ? "" : "・"}{r.text}
            </p>
          ))}
        </div>
      </Box>

      {/* ★★白い 帯（★見本 `.wl`）。★ここが この 画面の 核 です。
          ★★1文字も 変えないこと。★決めは lib/kirokuNoKimari.js。 */}
      <div style={{
        marginTop: 12, padding: "12px 14px", borderRadius: 10,
        background: C.paper, border: `1px solid ${C.line}`
      }}>
        {PROMISE_LINES.map((l, i) => (
          <p key={i} style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.95 }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
