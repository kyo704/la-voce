// ============================================================================
// ★本番の 予定（★2026-09-25・C群）
//
//   ★見本 `SC['本番の予定']`。
//   ★★字と 決めは `lib/honbanYotei.js` が 持ちます。★ここでは 決めません。
//
//   ★★★打った 字を そのまま 送ります。★整える 手を 1つも 通しません（★約束②）。
//   ★★見本の「場所」は 出しません ── ★台帳に 列が ありません（★lib の 註）。
//   ★★催促も、★「あと◯」も 出しません（★約束④）。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  TITLE, FIELDS, WORDS_LABEL, WORDS_OPTIONAL, WORDS_PLACEHOLDER,
  BTN_OK, NOTES, NOTES_STRONG, canSave
} from "@/lib/honbanYotei";

const 札 = { fontSize: "0.75rem", color: C.inkSoft, margin: "12px 0 5px" };
const 入 = {
  width: "100%", minHeight: 44, padding: "10px 12px", fontSize: "1rem",
  borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, color: C.ink
};

export default function HonbanYotei({ value, onChange, onSave, onBack }) {
  const v = value || {};
  const 直す = (k, s) => onChange && onChange({ ...v, [k]: s });

  return (
    <div>
      <Back onClick={onBack}>戻る</Back>
      <ScreenHead title={TITLE} />

      {FIELDS.map((f) => (
        <div key={f.key}>
          <p style={札}>{f.label}</p>
          <input type={f.kind === "date" ? "date" : "text"}
            value={v[f.key] || ""} placeholder={f.placeholder}
            onChange={(e) => 直す(f.key, e.target.value)} style={入} />
        </div>
      ))}

      <p style={札}>
        {WORDS_LABEL}
        <span style={{ marginLeft: 4 }}>{WORDS_OPTIONAL}</span>
      </p>
      {/* ★★打った 字を そのまま 持ちます。★ここで 整えません。 */}
      <textarea value={v.morning_words || ""} placeholder={WORDS_PLACEHOLDER}
        onChange={(e) => 直す("morning_words", e.target.value)}
        style={{ ...入, minHeight: 110, lineHeight: 1.85, resize: "vertical" }} />

      <button type="button" disabled={!canSave(v)} onClick={() => onSave && onSave(v)}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 11,
          borderRadius: 10, border: "none", background: C.curtain, color: C.onCurtain,
          fontSize: "0.9375rem", cursor: canSave(v) ? "pointer" : "default",
          opacity: canSave(v) ? 1 : 0.5
        }}>{BTN_OK}</button>

      <div style={{ marginTop: 14 }}>
        {NOTES.map((l, i) => (
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
