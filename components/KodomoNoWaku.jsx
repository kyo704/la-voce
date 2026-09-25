// ============================================================================
// ★子どもの 枠（★2026-09-25・C群 第1段・束6）
//
//   ★見本 `SC['子どもの枠']`（★design-v51）。
//
//   ★★呼び名 だけ です。★年齢・学校・写真・体調を うかがう 欄が ありません。
//   ★★連絡先は `set_kid_contact` を 通します。★表に 直に 書きません。
//   ★★見た 記録は 役割 だけ 出します。★名前を 出しません。
//   ★★字と 決めは `lib/kodomoNoWaku.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import {
  TITLE, subLine, ROLE_NOT_YET, contactWord, READS_HEAD, READS_EMPTY,
  BTN_REMOVE, ADD_HEAD, F_NAME, F_NAME_PH, F_TEL, F_TEL_PH, BTN_ADD,
  NAME_REQUIRED, mayAdd, EMPTY_LINE, readLine, NOTE_LINES
} from "@/lib/kodomoNoWaku";

export default function KodomoNoWaku({
  koenTitle, kids, readsByKid, onAdd, onRemove, onBack
}) {
  const 組 = Array.isArray(kids) ? kids : [];
  const [name, setName] = useState("");
  const [tel, setTel] = useState("");
  const [err, setErr] = useState("");

  function 足す() {
    if (!mayAdd(name)) { setErr(NAME_REQUIRED); return; }
    setErr("");
    // ★★連絡先は 空でも 送ります ── ★任意 です。
    if (onAdd) onAdd({ nickname: name.trim(), contact: tel.trim() });
    setName(""); setTel("");
  }

  return (
    <div>
      <Back onClick={onBack}>公演</Back>
      <ScreenHead title={TITLE} />
      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "0 0 10px" }}>
        {subLine(koenTitle)}
      </p>

      {組.length === 0 ? (
        <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{EMPTY_LINE}</p>
      ) : 組.map((k) => {
        const reads = (readsByKid && readsByKid[k.id]) || [];
        return (
          <Box key={k.id} style={{ marginBottom: 11 }}>
            <div style={{
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              gap: 12, padding: "12px 14px"
            }}>
              <span>
                <span style={{ fontSize: "0.875rem", color: C.ink }}>{k.nickname}</span>
                <span style={{ display: "block", fontSize: "0.75rem", color: C.inkSoft, marginTop: 2 }}>
                  {(k.role || ROLE_NOT_YET) + "　／　" + contactWord(!!k.hasContact)}
                </span>
              </span>
              <button type="button" onClick={() => onRemove && onRemove(k.id)}
                style={{
                  minHeight: 44, padding: "0 12px", borderRadius: 999,
                  border: `1px solid ${C.line}`, background: C.card,
                  color: C.inkSoft, fontSize: "0.75rem", cursor: "pointer"
                }}>{BTN_REMOVE}</button>
            </div>

            {/* ★★連絡先が ある 子だけ、★見た 記録を 出します。
                ★★★役割 だけ です。★名前を 出しません（★約束⑤）。 */}
            {k.hasContact ? (
              <>
                <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.line}` }}>
                  <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>{READS_HEAD}</span>
                </div>
                {reads.length === 0 ? (
                  <div style={{ padding: "10px 14px", borderTop: `1px solid ${C.line}` }}>
                    <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>{READS_EMPTY}</span>
                  </div>
                ) : reads.map((r) => {
                  const l = readLine(r);
                  return (
                    <div key={r.id} style={{
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      gap: 12, padding: "10px 14px", borderTop: `1px solid ${C.line}`
                    }}>
                      <span style={{ fontSize: "0.8125rem", color: C.ink }}>{l.when}</span>
                      <span style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{l.role}</span>
                    </div>
                  );
                })}
              </>
            ) : null}
          </Box>
        );
      })}

      <p style={{ fontSize: "0.8125rem", color: C.ink, margin: "14px 0 6px", fontWeight: 600 }}>
        {ADD_HEAD}
      </p>
      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "0 0 5px" }}>{F_NAME}</p>
      <input value={name} onChange={(e) => setName(e.target.value)} placeholder={F_NAME_PH}
        style={{
          width: "100%", minHeight: 44, padding: "0 10px", fontSize: "1rem",
          borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.ink
        }} />
      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "10px 0 5px" }}>{F_TEL}</p>
      <input value={tel} onChange={(e) => setTel(e.target.value)} placeholder={F_TEL_PH}
        style={{
          width: "100%", minHeight: 44, padding: "0 10px", fontSize: "1rem",
          borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.ink
        }} />
      <button type="button" onClick={足す}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 12,
          borderRadius: 10, border: "none", background: C.curtain,
          color: C.onCurtain, fontSize: "0.9375rem", cursor: "pointer"
        }}>{BTN_ADD}</button>
      {err ? (
        <p style={{ fontSize: "0.8125rem", color: C.rust, marginTop: 8 }}>{err}</p>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {NOTE_LINES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", // ★★1行目（先に 要る こと）と 4行目（★連絡先の 決め）を 濃く します。
            color: i === 0 || i === 4 ? C.ink : C.inkSoft, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
