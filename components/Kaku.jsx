// ============================================================================
// ★書く ── ★経歴の 1つを 足す／直す（★2026-09-25・C群 束5）
//
//   ★見本 `SC['書く']`（★design-v51）。
//
//   ★★`portfolio_entries` の 画面 です（★`notes` では ありません）。
//   ★★どの 種が ある かは `lib/portfolio.js` が 持ちます。★ここで 並べません。
//   ★★字と 並べ替えは `lib/kaku.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import {
  hasDate, DATE_LABEL, DATE_PLACEHOLDER, placeholderOf, labelOf, formHead,
  BTN_CANCEL, BTN_UP, BTN_EDIT, BTN_DELETE, EMPTY_LINE, ORDER_LINE,
  sortEntries, moveUp, mayAdd, noteLines
} from "@/lib/kaku";

export default function Kaku({ kind, field, entries, onSave, onRemove, onReorder, onBack }) {
  const 並 = sortEntries(entries);
  const 札 = labelOf(field, kind);
  const [直す, set直す] = useState(null);   // ★直して いる 行の id
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const [err, setErr] = useState("");

  function 始める(r) {
    set直す(r.id); setTitle(r.title || ""); setDetail(r.detail || ""); setErr("");
  }
  function やめる() { set直す(null); setTitle(""); setDetail(""); setErr(""); }

  function 出す() {
    if (!mayAdd(title)) { setErr(札 + "を 入れて ください。"); return; }
    setErr("");
    if (onSave) onSave({ id: 直す, kind, title: title.trim(), detail: detail.trim() });
    やめる();
  }

  return (
    <div>
      <Back onClick={onBack}>あなたのページ</Back>
      <ScreenHead title={札} />

      {並.length === 0 ? (
        <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{EMPTY_LINE}</p>
      ) : (
        <>
          <Box>
            {並.map((r, i) => (
              <div key={r.id} style={{
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                gap: 10, padding: "12px 14px",
                background: 直す === r.id ? C.paper : "transparent",
                borderTop: i === 0 ? "none" : `1px solid ${C.line}`
              }}>
                <span style={{ flex: 1 }}>
                  <span style={{ fontSize: "0.875rem", color: C.ink }}>{r.title}</span>
                  {r.detail ? (
                    <span style={{ display: "block", fontSize: "0.75rem", color: C.inkSoft, marginTop: 2 }}>
                      {r.detail}
                    </span>
                  ) : null}
                </span>
                <span style={{ display: "flex", gap: 6, whiteSpace: "nowrap" }}>
                  {/* ★★いちばん 上では 出しません。★押せない 札を 置きません。 */}
                  {i > 0 ? (
                    <button type="button" aria-label="上げる"
                      onClick={() => onReorder && onReorder(moveUp(並, i))}
                      style={{
                        minWidth: 44, minHeight: 44, borderRadius: 999,
                        border: `1px solid ${C.line}`, background: C.card,
                        color: C.inkSoft, cursor: "pointer"
                      }}>{BTN_UP}</button>
                  ) : null}
                  <button type="button" onClick={() => 始める(r)}
                    style={{
                      minHeight: 44, padding: "0 11px", borderRadius: 999,
                      border: `1px solid ${C.line}`, background: C.card,
                      color: C.ink, fontSize: "0.75rem", cursor: "pointer"
                    }}>{BTN_EDIT}</button>
                  <button type="button" onClick={() => onRemove && onRemove(r.id)}
                    style={{
                      minHeight: 44, padding: "0 11px", borderRadius: 999,
                      border: `1px solid ${C.line}`, background: C.card,
                      color: C.ink, fontSize: "0.75rem", cursor: "pointer"
                    }}>{BTN_DELETE}</button>
                </span>
              </div>
            ))}
          </Box>
          <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "6px 0 10px" }}>
            {ORDER_LINE}
          </p>
        </>
      )}

      <p style={{ fontSize: "0.8125rem", color: C.ink, margin: "14px 0 6px", fontWeight: 600 }}>
        {formHead(!!直す)}
      </p>

      {/* ★★「いつ」は 種に よって 出します（★師事した方 には 出しません）。 */}
      {hasDate(kind) ? (
        <>
          <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "0 0 5px" }}>{DATE_LABEL}</p>
          <input value={detail} onChange={(e) => setDetail(e.target.value)}
            placeholder={DATE_PLACEHOLDER}
            style={{
              width: "100%", minHeight: 44, padding: "0 10px", fontSize: "1rem",
              borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.ink
            }} />
        </>
      ) : null}

      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "10px 0 5px" }}>{札}</p>
      <input value={title} onChange={(e) => setTitle(e.target.value)}
        placeholder={placeholderOf(kind)}
        style={{
          width: "100%", minHeight: 44, padding: "0 10px", fontSize: "1rem",
          borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.ink
        }} />

      <button type="button" onClick={出す}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 12,
          borderRadius: 10, border: "none", background: C.curtain,
          color: C.onCurtain, fontSize: "0.9375rem", cursor: "pointer"
        }}>{formHead(!!直す)}</button>
      {直す ? (
        <button type="button" onClick={やめる}
          style={{
            display: "block", width: "100%", minHeight: 44, marginTop: 8,
            borderRadius: 10, border: `1px solid ${C.line}`, background: C.card,
            color: C.ink, fontSize: "0.9375rem", cursor: "pointer"
          }}>{BTN_CANCEL}</button>
      ) : null}
      {err ? (
        <p style={{ fontSize: "0.8125rem", color: C.rust, marginTop: 8 }}>{err}</p>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {noteLines(kind).map((l, i) => (
          <p key={i} style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.9 }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
