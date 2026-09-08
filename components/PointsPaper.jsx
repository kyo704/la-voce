"use client";

import { C } from "@/lib/tokens";
import { POINTS_PAPER } from "@/lib/homeDrawer";

// ============================================================================
// てんの紙（v3追補 ②）── 2026-09-08
//
//   ★★ふだんは 出しません。
//     ★はじめて「したく」を開いた日だけ 1回、
//     ★2回目からは、★てんの数字を 押したときだけです。
//
//   ★★毎日 数字が育つのを 見せることを、★避けています。
//     ★Deci ほか 1999（128研究）── ★予期される・従事に随伴する有形報酬は
//     ★内発的動機を 損ないます（d = −0.40）。★予期しない報酬は ±0（d = +0.01）。
//     ★★だから「記録したら てんが増える」を、★毎日 目に入れません。
//
//   ★★「あと◆てん」を 書かないこと（★§8-3②）。
//     ★出すのは 手持ちと、★これまで記録した日数だけです。
//
//   ★見張り components/tests/points-paper.test.js
// ============================================================================

export default function PointsPaper({ points, days, onClose }) {
  return (
    <div
      role="dialog"
      aria-label={POINTS_PAPER.title}
      onClick={() => onClose && onClose()}
      style={{
        position: "fixed", inset: 0, zIndex: 70,
        background: "rgba(36,25,20,0.34)",
        display: "flex", alignItems: "flex-end", justifyContent: "center"
      }}>
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: "100%", maxWidth: 664,
          background: C.card,
          borderTopLeftRadius: 18, borderTopRightRadius: 18,
          borderTop: `1px solid ${C.line}`,
          padding: "18px 16px",
          paddingBottom: "calc(18px + env(safe-area-inset-bottom))"
        }}>
        {/* ★★てんの数は、ここでは 大きく 出します。★買う場面だからです。 */}
        <p className="ff-display" style={{ fontSize: "1.75rem", color: C.ink, margin: "0 0 12px" }}>
          {points}<span style={{ fontSize: "1rem", marginLeft: 4 }}>てん</span>
        </p>

        {/* ★★4行。★各25字以内です。★増やさないこと。 */}
        {POINTS_PAPER.lines.map((l) => (
          <p key={l} style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.9, margin: 0 }}>
            {l}
          </p>
        ))}

        {/* ★★累計の記録日数は、★ここに 1行だけ。★棚には 出しません。
            ★これは 記録の話であって、★したくの話では ありません。 */}
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.9, margin: "12px 0 0" }}>
          {POINTS_PAPER.days(days)}
        </p>

        <button type="button" onClick={() => onClose && onClose()}
          style={{
            width: "100%", marginTop: 16, minHeight: 44, borderRadius: 8,
            border: `1px solid ${C.line}`, borderBottomWidth: 2,
            background: C.paper, color: C.ink, fontSize: "0.875rem"
          }}>
          {POINTS_PAPER.close}
        </button>
      </div>
    </div>
  );
}
