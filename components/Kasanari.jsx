// ============================================================================
// ★重なって いる 予定（★2026-09-25・C群 第1段）
//
//   ★見本 `SC['あなたの重なり']`（★design-v63）。
//
//   ★★★寄せません。★見つけて 教えるだけ です。
//     ★「こちらを 動かしましょう」と すすめません（★約束①）。
//   ★★2つを 並べる 順は、★渡された 順の まま です。★上を「先」に しません。
//   ★★字と 見つけ方は `lib/kasanari.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  TITLE, BACK_TO, HEAD_LINES, countWord, BTN_TIMETABLE, EMPTY_LINE,
  tellWord, findOverlaps, whenWord, NOTE_LINES
} from "@/lib/kasanari";

export default function Kasanari({ items, onTell, onTimetable, onBack }) {
  const 重 = findOverlaps(items);

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} right={countWord(重.length)} />

      <div style={{
        margin: "0 0 11px", padding: "11px 13px", borderRadius: 10,
        background: C.paper, border: `1px solid ${C.line}`
      }}>
        {HEAD_LINES.map((l, i) => (
          <p key={i} style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.9 }}>{l}</p>
        ))}
      </div>

      {重.length === 0 ? (
        <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{EMPTY_LINE}</p>
      ) : 重.map((x, n) => (
        <div key={n} style={{
          marginBottom: 11, padding: "12px 14px", borderRadius: 10,
          background: C.card, border: `1px solid ${C.line}`,
          borderLeft: `3px solid ${C.gold}`
        }}>
          <p style={{ fontSize: "0.75rem", color: C.inkSoft }}>
            {whenWord(x.on, x.from, x.to)}
          </p>
          {/* ★★①②の 順で 並べます。★渡された 順の まま です。 */}
          <div style={{ marginTop: 7 }}>
            {x.items.map((it, k) => (
              <p key={it.id} style={{
                fontSize: "0.84375rem", color: C.ink, lineHeight: 1.9
              }}>
                {["①", "②"][k] || "・"} {[it.org, it.teacher ? it.teacher + " 先生" : "", it.room]
                  .filter(Boolean).join("　")}
              </p>
            ))}
          </div>
          {/* ★★どちらにも 同じ 大きさの 札を 置きます。
              ★★★片方を 目立たせません ── ★すすめる ことに なります。 */}
          <div style={{ display: "flex", gap: 8, marginTop: 10 }}>
            {x.items.map((it) => (
              <button key={it.id} type="button" onClick={() => onTell && onTell(it.id)}
                style={{
                  flex: 1, minHeight: 44, borderRadius: 10,
                  border: `1px solid ${C.line}`, background: C.card,
                  color: C.ink, fontSize: "0.8125rem", cursor: "pointer"
                }}>{tellWord(it.teacher)}</button>
            ))}
          </div>
        </div>
      ))}

      <button type="button" onClick={onTimetable}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 3,
          borderRadius: 10, border: `1px solid ${C.line}`, background: C.card,
          color: C.ink, fontSize: "0.9375rem", cursor: "pointer"
        }}>{BTN_TIMETABLE}</button>

      <div style={{ marginTop: 14 }}>
        {NOTE_LINES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", color: i === 0 ? C.ink : C.inkSoft, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
