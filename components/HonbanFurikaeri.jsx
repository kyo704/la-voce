// ============================================================================
// ★本番の ふりかえり（★2026-09-25・C群）
//
//   ★見本 `SC['本番のふりかえり']`。
//   ★★字と 決めは `lib/honbanFurikaeri.js` が 持ちます。★ここでは 決めません。
//
//   ★★★点も 印も 色も 付けません（★約束①「よい わるいは 言いません」）。
//     ★★だから 行の 色を 眠りの 長さで 変えません。★並べるだけ です。
//   ★★書いて いない 日は「書いていません」。★0時間と 書きません。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import { TITLE, HEAD, rowsOf, NOTES, NOTES_STRONG } from "@/lib/honbanFurikaeri";

export default function HonbanFurikaeri({ performance, sleepByDate, onBack }) {
  const p = performance || {};
  const 行 = rowsOf(p.performed_on, sleepByDate);

  return (
    <div>
      <Back onClick={onBack}>ふりかえる</Back>
      <ScreenHead title={TITLE} />
      {p.performed_on ? (
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "-2px 0 11px" }}>
          {p.performed_on}の 本番
        </p>
      ) : null}

      <p style={{ fontSize: "0.8125rem", color: C.ink, fontWeight: 600, margin: "0 0 6px" }}>
        {HEAD}
      </p>
      <div style={{
        borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, overflow: "hidden"
      }}>
        {行.map((r, i) => (
          <div key={r.date} style={{
            padding: "11px 13px",
            borderTop: i === 0 ? "none" : `1px solid ${C.line}`
          }}>
            {/* ★★色を 変えません。★どの 行も 同じ 色 です。 */}
            <span style={{ fontSize: "0.90625rem", color: C.ink }}>{r.text}</span>
          </div>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        {NOTES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", lineHeight: 1.9,
            color: NOTES_STRONG.includes(i) ? C.ink : C.inkSoft,
            fontWeight: NOTES_STRONG.includes(i) ? 600 : 400
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
