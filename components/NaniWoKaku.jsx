// ============================================================================
// ★何を 足しますか（★2026-09-25・C群 束5）
//
//   ★見本 `SC['なにを書く']`（★design-v51）。
//
//   ★★読むだけ の 画面 です。★数えるだけ で、★1文字も 書きません。
//   ★★出す 種は `enabledKinds` だけ ── ★入れる 形の ある もの だけ です。
//   ★★字と 数え方は `lib/naniwoKaku.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import { TITLE, BACK_TO, rowsOf, NOTE_LINES, NOTE_STRONG } from "@/lib/naniwoKaku";

export default function NaniWoKaku({ field, entries, onPick, onBack }) {
  const 行 = rowsOf(field, entries);

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />

      <Box>
        {行.map((r, i) => (
          <button key={r.key} type="button" onClick={() => onPick && onPick(r.key)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, width: "100%", minHeight: 44, padding: "12px 14px",
              border: "none", background: "none", textAlign: "left",
              borderTop: i === 0 ? "none" : `1px solid ${C.line}`, cursor: "pointer"
            }}>
            <span style={{ fontSize: "0.875rem", color: C.ink }}>{r.label}</span>
            {/* ★★0件の ときは 数を 出しません。★責める 形に しません。 */}
            <span style={{ fontSize: "0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>
              {r.right}{r.right ? " " : ""}›
            </span>
          </button>
        ))}
      </Box>

      <div style={{ marginTop: 14 }}>
        {/* ★★4行目は design-v80 で 足された 約束 です（★お仕事を 変えても 消えません）。 */}
        {NOTE_LINES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", color: i === 0 ? C.ink : C.inkSoft, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
