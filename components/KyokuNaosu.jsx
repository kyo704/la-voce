// ============================================================================
// ★曲を 直す（★2026-09-25・C群）
//
//   ★見本 `SC['曲を直す']`。
//   ★★字と 決めは `lib/kyokuNaosu.js` が 持ちます。★ここでは 決めません。
//
//   ★★★「はじめて 記録した日」は **読むだけ** です。
//     ★記録から 数えて いる もの なので、★打てる 欄を 置きません。
//     ★★下の 断り（「記録から 数えているので 直せません」）が その 約束 です。
//   ★★消す ときは 1度 尋ねます。★押した だけでは 消えません。
// ============================================================================
"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  TITLE, FIELDS, STATUS_LABEL, STATUS_CHOICES, FIRST_LABEL, firstDayWord,
  BTN_OK, BTN_DELETE, NOTE, canSave
} from "@/lib/kyokuNaosu";

const 札 = { fontSize: "0.75rem", color: C.inkSoft, margin: "12px 0 5px" };
const 入 = {
  width: "100%", minHeight: 44, padding: "10px 12px", fontSize: "1rem",
  borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, color: C.ink
};

export default function KyokuNaosu({ item, onChange, onSave, onDelete, onBack }) {
  const v = item || {};
  const [きく, setきく] = useState(false);
  const 直す = (k, s) => onChange && onChange({ ...v, [k]: s });

  return (
    <div>
      <Back onClick={onBack}>{v.repertoire_name || "曲"}</Back>
      <ScreenHead title={TITLE} />

      {FIELDS.map((f) => (
        <div key={f.key}>
          <p style={札}>{f.label}</p>
          <input value={v[f.key] || ""} placeholder={f.placeholder}
            onChange={(e) => 直す(f.key, e.target.value)} style={入} />
        </div>
      ))}

      <p style={札}>{STATUS_LABEL}</p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 7 }}>
        {STATUS_CHOICES.map((s) => {
          const 選 = v.status === s;
          return (
            <button key={s} type="button" onClick={() => 直す("status", s)}
              style={{
                minHeight: 44, padding: "0 13px", borderRadius: 999,
                border: `1px solid ${選 ? C.curtain : C.line}`,
                background: 選 ? C.curtain : C.card,
                color: 選 ? C.onCurtain : C.ink,
                fontSize: "0.8125rem", cursor: "pointer"
              }}>{s}</button>
          );
        })}
      </div>

      {/* ★★読むだけ です。★打てる 欄を 置きません。 */}
      <p style={札}>{FIRST_LABEL}</p>
      <p style={{ fontSize: "0.9375rem", color: C.ink }}>{firstDayWord(v.created_at)}</p>

      <button type="button" disabled={!canSave(v)} onClick={() => onSave && onSave(v)}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 14,
          borderRadius: 10, border: "none", background: C.curtain, color: C.onCurtain,
          fontSize: "0.9375rem", cursor: canSave(v) ? "pointer" : "default",
          opacity: canSave(v) ? 1 : 0.5
        }}>{BTN_OK}</button>

      {きく ? (
        <div style={{
          marginTop: 9, padding: "11px 13px", borderRadius: 10,
          border: `1px solid ${C.line}`, background: C.paper
        }}>
          <p style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.9 }}>
            {v.repertoire_name}　{BTN_DELETE}
          </p>
          <div style={{ display: "flex", gap: 9, marginTop: 9 }}>
            <button type="button" onClick={() => setきく(false)}
              style={{
                flex: 1, minHeight: 44, borderRadius: 10, border: `1px solid ${C.line}`,
                background: C.card, color: C.ink, fontSize: "0.875rem", cursor: "pointer"
              }}>やめる</button>
            <button type="button" onClick={() => { setきく(false); if (onDelete) onDelete(v); }}
              style={{
                flex: 1, minHeight: 44, borderRadius: 10, border: "none",
                background: C.rust, color: "#FFFDF8", fontSize: "0.875rem", cursor: "pointer"
              }}>{BTN_DELETE}</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setきく(true)}
          style={{
            display: "block", width: "100%", minHeight: 44, marginTop: 9,
            borderRadius: 10, border: `1px solid ${C.line}`, background: C.card,
            color: C.rust, fontSize: "0.9375rem", cursor: "pointer"
          }}>{BTN_DELETE}</button>
      )}

      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "14px 0 0", lineHeight: 1.9 }}>
        {NOTE}
      </p>
    </div>
  );
}
