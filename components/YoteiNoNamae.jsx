// ============================================================================
// ★押したときの 名前（★2026-09-25・C群）
//
//   ★見本 `SC['予定の名前']`（★design-v63）。
//
//   ★★既定は「予定」です。★空に しません（★決めなくても 進めます）。
//   ★★すぐ 押せる 名前を 並べ替えません（★数えません）。
//   ★★字は `lib/yoteiNoNamae.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  TITLE, BACK_TO, LEAD, FIELD_LABEL, DEFAULT_NAME, namesOf,
  BTN_OK, NAME_REQUIRED, mayUse, NOTE_LINES
} from "@/lib/yoteiNoNamae";

export default function YoteiNoNamae({ kind, name, onDecide, onBack }) {
  const [v, setV] = useState(name || DEFAULT_NAME);
  const [err, setErr] = useState("");
  const 札 = namesOf(kind);

  function 決める() {
    if (!mayUse(v)) { setErr(NAME_REQUIRED); return; }
    setErr("");
    if (onDecide) onDecide(v.trim());
  }

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />
      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "0 0 10px", lineHeight: 1.85 }}>
        {LEAD}
      </p>

      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "0 0 5px" }}>{FIELD_LABEL}</p>
      <input value={v} onChange={(e) => setV(e.target.value)}
        style={{
          width: "100%", minHeight: 44, padding: "0 10px", fontSize: "1rem",
          borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.ink
        }} />

      {/* ★★すぐ 押せる 名前。★並べ替えません（★数えません）。 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginTop: 9 }}>
        {札.map((x) => (
          <button key={x} type="button" onClick={() => setV(x)}
            style={{
              minHeight: 44, padding: "0 12px", borderRadius: 999,
              border: `1px solid ${v === x ? C.curtain : C.line}`,
              background: v === x ? C.curtain : C.card,
              color: v === x ? C.onCurtain : C.ink,
              fontSize: "0.8125rem", cursor: "pointer"
            }}>{x}</button>
        ))}
      </div>

      <button type="button" onClick={決める}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 12,
          borderRadius: 10, border: "none", background: C.curtain,
          color: C.onCurtain, fontSize: "0.9375rem", cursor: "pointer"
        }}>{BTN_OK}</button>
      {err ? (
        <p style={{ fontSize: "0.8125rem", color: C.rust, marginTop: 8 }}>{err}</p>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {NOTE_LINES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", color: i === 1 ? C.ink : C.inkSoft, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
