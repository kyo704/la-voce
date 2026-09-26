// ============================================================================
// ★届いたもの（★2026-09-26・D群）
//
//   ★見本 `SC['届いたもの']`。
//   ★★字と 決めは `lib/todoitaMono.js` が 持ちます。★ここでは 決めません。
//
//   ★★★返信の 欄を 置きません。★`textarea` も `input` も 1つも ありません。
//     ★★「できません」と 書いて 欄を 置く のでは ありません ──
//       ★欄が あれば、★いつか 誰かが つなぎます。
//   ★★★メールを 画面に 出しません（★読む 列にも ありません）。
//   ★★「済」は 印 だけ です。★数えません。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  BACK_TO, TITLE, LEAD, EMPTY_LINE, markOf, subOf, nameOf,
  BTN_BLOCK, noteLines, NOTES_STRONG, visibleRows
} from "@/lib/todoitaMono";

export default function TodoitaMono({ rows, onOpen, onBlock, onBack }) {
  const 列 = visibleRows(rows);

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />
      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "-2px 0 10px" }}>{LEAD}</p>

      {列.length === 0 ? (
        <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{EMPTY_LINE}</p>
      ) : (
        <div style={{
          borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, overflow: "hidden"
        }}>
          {列.map((r, i) => (
            <div key={r.id || i} style={{
              borderTop: i === 0 ? "none" : `1px solid ${C.line}`
            }}>
              <button type="button" onClick={() => onOpen && onOpen(r)}
                style={{
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  gap: 12, width: "100%", padding: "12px 13px", border: "none",
                  background: "transparent", textAlign: "left", cursor: "pointer"
                }}>
                <span style={{ flex: 1 }}>
                  <span style={{ fontSize: "0.875rem", color: C.ink }}>{nameOf(r)}</span>
                  {/* ★★本文は そのまま。★こちらで 切りません。★画面が 折ります。 */}
                  <span style={{
                    display: "block", fontSize: "0.75rem", color: C.inkSoft,
                    lineHeight: 1.8, marginTop: 2
                  }}>{subOf(r)}</span>
                </span>
                <span style={{ fontSize: "0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>
                  {markOf(r) ? `${markOf(r)} ` : ""}›
                </span>
              </button>
              {/* ★★止める 札。★渡されて いない ときは 出しません。 */}
              {onBlock ? (
                <button type="button" onClick={() => onBlock(r)}
                  style={{
                    display: "block", width: "100%", minHeight: 44, padding: "0 13px",
                    border: "none", borderTop: `1px solid ${C.line}`,
                    background: "transparent", color: C.inkSoft,
                    fontSize: "0.75rem", textAlign: "left", cursor: "pointer"
                  }}>{BTN_BLOCK}</button>
              ) : null}
            </div>
          ))}
        </div>
      )}

      <div style={{ marginTop: 14 }}>
        {noteLines().map((l, i) => (
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
