// ============================================================================
// ★日を 選ぶ（★2026-09-25・C群）
//
//   ★見本 `SC['日を選ぶ']`。★3つの 使い方（範囲・1日・いくつでも）。
//   ★★字と 決めは `lib/dayPick.js` が 持ちます。★ここでは 決めません。
//
//   ★★★台帳を 1つも 触りません。★選んだ 日を 呼ぶ 側に 返すだけ です。
//   ★★戻る 先は 呼ぶ 側が 名のります。★名が 無い ときは その 1行を 出しません。
// ============================================================================
"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  TITLE, WEEK, MONTHS, PREV, NEXT, QUICK, btnOf, noteOf, backLineOf,
  cellsOf, isoOf, stepMonth, tap, markOf, labelOf, canOk, normalizeMode
} from "@/lib/dayPick";

export default function DayPick({ mode, from, year, month0, value, onOk, onBack }) {
  const m = normalizeMode(mode);
  const [年, set年] = useState(Number(year) || new Date().getFullYear());
  const [月, set月] = useState(Number.isInteger(month0) ? month0 : new Date().getMonth());
  const [選, set選] = useState(value || {});
  const 枡 = cellsOf(年, 月);

  function 動く(n) {
    const t = stepMonth(年, 月, n);
    set年(t.year); set月(t.month0);
  }

  return (
    <div>
      <Back onClick={onBack}>{from || "戻る"}</Back>
      <ScreenHead title={TITLE} />

      <div style={{
        padding: "13px", borderRadius: 10, border: `1px solid ${C.line}`,
        background: C.card, textAlign: "center"
      }}>
        <span style={{ fontSize: "0.90625rem", color: C.ink }}>{labelOf(m, 選)}</span>
      </div>

      <div style={{
        marginTop: 11, padding: "11px", borderRadius: 10,
        border: `1px solid ${C.line}`, background: C.card
      }}>
        <div style={{ display: "flex", alignItems: "center", marginBottom: 9 }}>
          <button type="button" onClick={() => 動く(-1)}
            style={{ border: "none", background: "none", color: C.curtain,
              fontSize: "0.78125rem", cursor: "pointer", padding: 0, minHeight: 44 }}>
            {PREV}
          </button>
          <span style={{ margin: "0 auto", fontSize: "0.8125rem", color: C.inkSoft }}>
            {年}年 {MONTHS[月]}
          </span>
          <button type="button" onClick={() => 動く(1)}
            style={{ border: "none", background: "none", color: C.curtain,
              fontSize: "0.78125rem", cursor: "pointer", padding: 0, minHeight: 44 }}>
            {NEXT}
          </button>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {WEEK.map((w) => (
            <span key={w} style={{
              textAlign: "center", fontSize: "0.6875rem", color: C.inkSoft, padding: "4px 0"
            }}>{w}</span>
          ))}
          {枡.map((d, i) => {
            if (d === null) return <span key={`x${i}`} />;
            const iso = isoOf(年, 月, d);
            const 印 = markOf(m, 選, iso);
            return (
              <button key={iso} type="button"
                onClick={() => set選((s) => tap(m, s, iso))}
                style={{
                  minHeight: 40, borderRadius: 8, cursor: "pointer",
                  border: 印 === "on" ? `1.6px solid ${C.curtain}` : `1px solid ${C.line}`,
                  background: 印 === "on" ? C.curtain : 印 === "mid" ? C.paper : C.card,
                  color: 印 === "on" ? C.onCurtain : C.ink,
                  fontSize: "0.84375rem"
                }}>{d}</button>
            );
          })}
        </div>
      </div>

      {m === "range" ? (
        <div style={{ display: "flex", gap: 7, marginTop: 10, flexWrap: "wrap" }}>
          {QUICK.map((q) => (
            <span key={q} style={{
              padding: "7px 12px", borderRadius: 999, border: `1px solid ${C.line}`,
              background: C.card, color: C.inkSoft, fontSize: "0.75rem"
            }}>{q}</span>
          ))}
        </div>
      ) : null}

      <button type="button" disabled={!canOk(m, 選)}
        onClick={() => onOk && onOk(選)}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 11,
          borderRadius: 10, border: "none", background: C.curtain, color: C.onCurtain,
          fontSize: "0.9375rem", cursor: canOk(m, 選) ? "pointer" : "default",
          opacity: canOk(m, 選) ? 1 : 0.5
        }}>{btnOf(m)}</button>

      <div style={{ marginTop: 14 }}>
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.9 }}>{noteOf(m)}</p>
        {/* ★★名が 無い ときは この 行を 出しません（★意味に ならない ため）。 */}
        {backLineOf(from) ? (
          <p style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.9 }}>
            {backLineOf(from)}
          </p>
        ) : null}
      </div>
    </div>
  );
}
