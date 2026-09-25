// ============================================================================
// ★紙を たしかめる（★2026-09-25・C群 束2）
//
//   ★見本 `SC['紙をたしかめる']`（★design-v51）。
//
//   ★★読むだけ です。★1文字も 書きません。
//   ★★数を 出しません（★件数の 1つ だけ は 見本の とおり です）。
//   ★★体の ことは 1文字も 出ません ── ★引く 2表に その 列が ありません。
//   ★★決めと 字は `lib/kamiTashikame.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { useRef, useState } from "react";
import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  BACK_TO, PAPER_RATIO, isFew, fewLines, sortEntries,
  paperUrl, paperDateWord, BTN_PDF, BTN_PRINT, OVERFLOW_LINE, NOTE_LINES
} from "@/lib/kamiTashikame";

export default function KamiTashikame({ paper, entries, paperKind, now, onPdf, onPrint, onBack }) {
  const p = paper || {};
  const rows = sortEntries(entries);
  const 件 = rows.length;
  const 紙 = useRef(null);
  const [overflow, setOverflow] = useState(false);

  // ★★1枚に 収まったかを、★出す 前に 見ます。★黙って 切りません。
  //   ★★読めない ときは 何も 言いません ── ★出まかせを 言いません。
  function みる() {
    const el = 紙.current;
    if (!el) return;
    setOverflow(el.scrollHeight > el.clientHeight + 1);
  }

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={"紙　" + (paperKind || p.paper_type || "")} />

      {isFew(件) ? (
        <div style={{
          margin: "0 0 11px", padding: "11px 13px", borderRadius: 10,
          background: C.paper, border: `1px solid ${C.line}`
        }}>
          {fewLines(件).map((l, i) => (
            <p key={i} style={{
              fontSize: "0.8125rem", color: i === 1 ? C.ink : C.inkSoft, lineHeight: 1.9
            }}>{l}</p>
          ))}
        </div>
      ) : null}

      {/* ★★A4。★割合は lib/kamiTashikame.js の PAPER_RATIO が 決めます。 */}
      <div ref={紙} onLoad={みる}
        style={{
          background: "#fff", color: "#241C15", aspectRatio: PAPER_RATIO,
          border: `1px solid ${C.line}`, borderRadius: 2, padding: "8% 7.5%",
          fontSize: "clamp(6px, 1.6vw, 10px)", lineHeight: 1.66,
          display: "flex", flexDirection: "column", overflow: "hidden"
        }}>
        <div style={{ fontSize: "2em", fontWeight: 600, fontFamily: "Georgia, serif" }}>
          {p.display_name || ""}
        </div>
        {p.instrument ? (
          <div style={{ color: "#8C7D6C", letterSpacing: ".2em", marginTop: ".3em" }}>
            {p.instrument}
          </div>
        ) : null}
        {p.bio ? (
          <div style={{ marginTop: "1.4em", fontSize: "1.1em" }}>{p.bio}</div>
        ) : null}

        <div style={{ marginTop: "1.2em", lineHeight: 2.1 }}>
          {rows.map((r) => (
            <div key={r.id} style={{ display: "flex", gap: ".9em" }}>
              <span style={{ color: "#8C7D6C", width: "22%" }}>{r.detail || ""}</span>
              {r.title || ""}
            </div>
          ))}
        </div>

        {/* ★★右下 ── ★住所と、★書き出した 日。★古い 紙が 出回らないように。 */}
        <div style={{
          marginTop: "auto", borderTop: ".5px solid #E4DAC4", paddingTop: ".7em",
          fontSize: ".85em", color: "#A0917F",
          display: "flex", justifyContent: "space-between"
        }}>
          <span>{paperUrl(p.public_slug)}</span>
          <span>{paperDateWord(now || new Date())}</span>
        </div>
      </div>

      {overflow ? (
        <p style={{ fontSize: "0.8125rem", color: C.rust, marginTop: 10, lineHeight: 1.85 }}>
          {OVERFLOW_LINE}
        </p>
      ) : null}

      <button type="button" onClick={onPdf}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 12,
          borderRadius: 10, border: "none", background: C.curtain,
          color: C.onCurtain, fontSize: "0.9375rem", cursor: "pointer"
        }}>{BTN_PDF}</button>
      <button type="button" onClick={onPrint}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 8,
          borderRadius: 10, border: `1px solid ${C.line}`, background: C.card,
          color: C.ink, fontSize: "0.9375rem", cursor: "pointer"
        }}>{BTN_PRINT}</button>

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
