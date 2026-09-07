"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import SheepDressed from "@/components/SheepDressed";
import {
  RESULTS, SHEEP_LINE, THANKS_LINES, askTitle, performedLabel
} from "@/lib/performanceResult";

// ============================================================================
// D+1 の一問（本番モード §7）
//
//   ★★これ以上、何も聞かないこと。
//     ★理由も、感想も、点数も聞きません。★3つだけです。
//
//   ★★どの答えでも、★同じ言葉を返します。
//     ★「良かったですね」「残念でしたね」と書かないこと。★評価はしません。
//
//   ★★「あとで」を、必ず置くこと。★出口のない画面を作らないこと。
//
//   ★決めは lib/performanceResult.js が持ちます。★ここには書きません。
// ============================================================================

export default function PerformanceResultAsk({
  performance, todayISO, wearing = {}, onAnswer, onLater
}) {
  const [answered, setAnswered] = useState(false);

  if (!performance) return null;

  // ★★答えたあと。★羊が1周期だけ歩きます。
  if (answered) {
    return (
      <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 10 }}>
          <SheepDressed wearing={wearing} size={120} motion="walk" travel={false} alt="羊" />
        </div>
        {THANKS_LINES.map((l) => (
          <p key={l} className="text-sm" style={{ color: C.ink, lineHeight: 1.9, textAlign: "center" }}>
            {l}
          </p>
        ))}
      </div>
    );
  }

  return (
    <div className="rounded-2xl p-5 border" style={{ background: C.card, borderColor: C.line }}>
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8 }}>
        <SheepDressed wearing={wearing} size={120} motion="still" travel={false} alt="羊" />
      </div>

      {/* ★羊の言葉。★ねぎらいであって、評価ではありません。 */}
      <p style={{ fontSize: 18, color: C.ink, textAlign: "center", margin: "0 0 12px" }}>
        {SHEEP_LINE}
      </p>

      {/* ★どの本番のことか。★日付と、付けておられた名前。 */}
      <p className="text-xs" style={{ color: C.inkSoft, textAlign: "center", margin: "0 0 4px" }}>
        {performedLabel(performance)}
      </p>

      <p style={{ fontSize: 20, fontWeight: 600, color: C.ink, textAlign: "center", margin: "0 0 18px", lineHeight: 1.6 }}>
        {askTitle(performance, todayISO)}
      </p>

      {/* ★★3つだけ。★「まあまあ」などを足さないこと。 */}
      <div style={{ display: "flex", gap: 8 }}>
        {RESULTS.map((r) => (
          <button key={r.key} type="button"
            onClick={() => { setAnswered(true); if (onAnswer) onAnswer(r.key); }}
            style={{
              flex: 1, minHeight: 72, borderRadius: 14,
              border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
              fontSize: "0.9375rem", lineHeight: 1.5, padding: "8px 4px"
            }}>
            {r.label}
          </button>
        ))}
      </div>

      {/* ★★「あとで」を、必ず置くこと。★同じ日は、もう出しません。 */}
      <button type="button" onClick={onLater}
        style={{
          width: "100%", marginTop: 14, minHeight: 44, padding: "10px",
          borderRadius: 999, border: "none", background: "transparent",
          color: C.inkSoft, fontSize: "0.9375rem"
        }}>
        あとで
      </button>
    </div>
  );
}
