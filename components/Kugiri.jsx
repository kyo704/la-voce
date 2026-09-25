// ============================================================================
// ★区切り ── ★一覧の 1枚（★2026-09-25・design-v76）
//
//   ★見本 `SC['区切り']`。★置き所は「しらべる」の 束 です。
//   ★★字と 決めは `lib/periodMarkers.js` が 持ちます。★ここでは 決めません。
//
//   ★★★理由を 書く ところを 作りません（★設計 §9 の 8番）。
//     ★★見本の 1行目に「先生が 変わった とき」と 添えて あります が、
//       ★あれは 理由 です。★欄を 作れば、★服薬の 記録に なります。
//     ★★「書けません」と 書いて 欄を 置く のでは ありません。★欄が 無い のです。
//   ★★置ける のは **きょう** です。★ほかの 日は 記録の 画面から 置きます
//     （★`PeriodMarkerButton`）。★同じ 台帳・同じ 言葉 です。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  COPY, markerDates, hasMarker,
  LIST_BACK_TO, LIST_TITLE, LIST_HEAD_LINES, LIST_HEAD_STRONG, LIST_EMPTY, LIST_ADD,
  LIST_NOTES, LIST_NOTES_STRONG, LIST_NOTES_SMALL
} from "@/lib/periodMarkers";

export default function Kugiri({ markers, today, busy, onToggle, onBack }) {
  // ★★新しい ものから 上に。★数は 出しません。
  const 日 = markerDates(markers).slice().reverse();
  const きょう有 = !!today && hasMarker(markers, today);

  return (
    <div>
      <Back onClick={onBack}>{LIST_BACK_TO}</Back>
      <ScreenHead title={LIST_TITLE} />

      <div style={{
        margin: "0 0 12px", padding: "11px 13px", borderRadius: 10,
        background: C.paper, border: `1px solid ${C.line}`
      }}>
        {LIST_HEAD_LINES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.8125rem", color: C.ink, lineHeight: 1.9,
            fontWeight: LIST_HEAD_STRONG.includes(i) ? 600 : 400
          }}>{l}</p>
        ))}
      </div>

      {日.length === 0 ? (
        <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{LIST_EMPTY}</p>
      ) : (
        <div style={{
          borderRadius: 10, border: `1px solid ${C.line}`, background: C.card,
          overflow: "hidden"
        }}>
          {日.map((d, i) => (
            <div key={d} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, padding: "12px 13px",
              borderTop: i === 0 ? "none" : `1px solid ${C.line}`
            }}>
              {/* ★★日 だけ です。★下に 添える 字は ありません（★理由を 置かない ため）。 */}
              <span style={{ fontSize: "0.9375rem", color: C.ink }}>{d}</span>
              <button type="button" disabled={busy}
                onClick={() => onToggle && onToggle(d, false)}
                style={{
                  minHeight: 44, padding: "0 12px", borderRadius: 999,
                  border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
                  fontSize: "0.75rem", cursor: busy ? "default" : "pointer",
                  opacity: busy ? 0.6 : 1
                }}>{COPY.remove}</button>
            </div>
          ))}
        </div>
      )}

      {/* ★★きょうの ぶんが もう ある ときは 出しません。★同じ 日を 2つ 置けません。 */}
      {today && !きょう有 ? (
        <button type="button" disabled={busy}
          onClick={() => onToggle && onToggle(today, true)}
          style={{
            display: "block", width: "100%", minHeight: 44, marginTop: 11,
            borderRadius: 10, border: "none", background: C.curtain,
            color: C.onCurtain, fontSize: "0.9375rem",
            cursor: busy ? "default" : "pointer", opacity: busy ? 0.6 : 1
          }}>{LIST_ADD}</button>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {/* ★★4行目は 小さな 字 です（★見本の `<span class="usu">`）。
            ★★「（いまは まだです）」── ★くらべるが 区切りを 使い 始めた 日に 外します。 */}
        {LIST_NOTES.map((l, i) => (
          <p key={i} style={{
            fontSize: LIST_NOTES_SMALL.includes(i) ? "0.6875rem" : "0.75rem",
            lineHeight: 1.9,
            color: LIST_NOTES_STRONG.includes(i) ? C.ink : C.inkSoft,
            fontWeight: LIST_NOTES_STRONG.includes(i) ? 600 : 400
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
