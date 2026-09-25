// ============================================================================
// ★予定の 中身（★2026-09-26・C群）
//
//   ★見本 `SC['予定の中身']`。
//   ★★字と 決めは `lib/yoteiNoNakami.js` が 持ちます。★ここでは 決めません。
//
//   ★★★事務に `kind` を 渡す 道を 作りません。
//     ★★「これは ご自分の 予定ですね」と 分かること 自体が、
//       ★「動かして ください」と 言う きっかけに なります（★sql/93 の 註）。
//   ★★升目を 選んで いない ときは、★別の 1枚を 出します（★見本の 前半）。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  BACK_TO, NOT_PICKED_TITLE, NOT_PICKED_NOTE,
  KIND_LABEL, KINDS, kindOf, kindNoteOf,
  NAME_LABEL, NAME_OPTIONAL, NAME_PLACEHOLDER, namesOf,
  BTN_DELETE, BTN_OK, NOTES, NOTES_STRONG
} from "@/lib/yoteiNoNakami";

const 札 = { fontSize: "0.75rem", color: C.inkSoft, margin: "12px 0 5px" };

export default function YoteiNoNakami({ row, label, onChange, onSave, onDelete, onBack }) {
  // ★★升目を 選んで いない とき（★見本の 前半）。
  if (!row) {
    return (
      <div>
        <Back onClick={onBack}>自分のコマ</Back>
        <ScreenHead title={NOT_PICKED_TITLE} />
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.9 }}>
          {NOT_PICKED_NOTE}
        </p>
      </div>
    );
  }

  const いま = kindOf(row);
  const 直す = (k, v) => onChange && onChange({ ...row, [k]: v });

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={label || ""} />

      <p style={札}>{KIND_LABEL}</p>
      <div style={{ display: "flex", gap: 7, flexWrap: "wrap" }}>
        {KINDS.map((k) => {
          const 選 = いま === k.key;
          return (
            <button key={k.key} type="button" onClick={() => 直す("kind", k.key)}
              style={{
                minHeight: 44, padding: "0 14px", borderRadius: 999,
                border: `1px solid ${選 ? C.curtain : C.line}`,
                background: 選 ? C.curtain : C.card,
                color: 選 ? C.onCurtain : C.ink,
                fontSize: "0.8125rem", cursor: "pointer"
              }}>{k.label}</button>
          );
        })}
      </div>
      {/* ★★自分の ほうは 約束 です。★消さないこと。 */}
      <p style={{ fontSize: "0.75rem", color: C.ink, margin: "7px 0 0", lineHeight: 1.9 }}>
        {kindNoteOf(row)}
      </p>

      <p style={札}>
        {NAME_LABEL}
        <span style={{ marginLeft: 4 }}>{NAME_OPTIONAL}</span>
      </p>
      <input value={row.title || ""} placeholder={NAME_PLACEHOLDER}
        onChange={(e) => 直す("title", e.target.value)}
        style={{
          width: "100%", minHeight: 44, padding: "10px 12px", fontSize: "1rem",
          borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, color: C.ink
        }} />
      {/* ★★早く 入れる 札。★`kind` で 中身が 変わります。 */}
      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 9 }}>
        {namesOf(row).map((n) => (
          <button key={n} type="button" onClick={() => 直す("title", n)}
            style={{
              minHeight: 44, padding: "0 12px", borderRadius: 999,
              border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
              fontSize: "0.75rem", cursor: "pointer"
            }}>{n}</button>
        ))}
      </div>

      <div style={{ display: "flex", gap: 9, marginTop: 14 }}>
        <button type="button" onClick={() => onDelete && onDelete(row)}
          style={{
            flex: 1, minHeight: 44, borderRadius: 10, border: `1px solid ${C.line}`,
            background: C.card, color: C.rust, fontSize: "0.875rem", cursor: "pointer"
          }}>{BTN_DELETE}</button>
        <button type="button" onClick={() => onSave && onSave(row)}
          style={{
            flex: 1, minHeight: 44, borderRadius: 10, border: "none",
            background: C.curtain, color: C.onCurtain, fontSize: "0.875rem", cursor: "pointer"
          }}>{BTN_OK}</button>
      </div>

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
