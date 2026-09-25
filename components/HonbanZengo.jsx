// ============================================================================
// ★本番の 前後（★2026-09-25・C群 束2）
//
//   ★見本 `SC['本番の前後']`（★design-v51）。
//
//   ★★読むだけ です。★1文字も 書きません。
//   ★★数を 出しません ── ★棒の 長さと 日の 番号 だけ です。
//   ★★書いて いない 日は 棒を 出しません。★0％に しません
//     （★0％は「いちばん 悪い」に 見えます）。
//   ★★決めは `lib/honbanZengo.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import { readDekiValue } from "@/lib/recordV2";
import {
  SPAN_LABEL, ZERO_LABEL, buildDays, dayLabel, NOTE_LINE, NO_RECORD_LINE
} from "@/lib/honbanZengo";

export default function HonbanZengo({ name, performedOn, entries, onBack }) {
  const entryOf = (iso) => (entries ? entries[iso] : null);
  const days = buildDays(performedOn, entryOf, readDekiValue);
  const かいた = days.filter((d) => d.width != null).length;

  return (
    <div>
      <Back onClick={onBack}>本番でそろえる</Back>
      <ScreenHead title={name || ""} />

      <div style={{
        marginTop: 4, padding: "13px 15px", borderRadius: 10,
        background: C.card, border: `1px solid ${C.line}`
      }}>
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "0 0 8px" }}>{SPAN_LABEL}</p>

        {かいた === 0 ? (
          <p style={{ fontSize: "0.8125rem", color: C.inkSoft, lineHeight: 1.85 }}>
            {NO_RECORD_LINE}
          </p>
        ) : days.map((d) => (
          <div key={d.offset} style={{
            display: "flex", alignItems: "center", gap: 8, minHeight: 20
          }}>
            <span style={{
              width: 26, textAlign: "right", fontSize: "0.75rem",
              color: d.isDay ? C.ink : C.inkSoft
            }}>{dayLabel(d.offset)}</span>
            {/* ★★書いて いない 日は 棒を 出しません。★空けます。 */}
            {d.width == null ? (
              <span style={{ flex: 1 }} />
            ) : (
              <span style={{
                display: "block", height: 9, borderRadius: 2,
                width: d.width + "%", background: C.curtain,
                opacity: d.isDay ? 1 : 0.45
              }} />
            )}
          </div>
        ))}

        <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: 8 }}>{ZERO_LABEL}</p>
      </div>

      <p style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.9, marginTop: 14 }}>
        {NOTE_LINE}
      </p>
    </div>
  );
}
