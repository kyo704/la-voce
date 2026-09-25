// ============================================================================
// ★見た目を 選ぶ（★2026-09-25・C群）
//
//   ★見本 `SC['見た目を選ぶ']`。
//   ★★字と 決めは `lib/portfolioLook.js` が 持ちます。★ここでは 決めません。
//
//   ★★★払って いない 方の 組み方・ことばは **隠しません**。
//     ★出して、★右に「Woolsong」と 出します（★お決め）。
//   ★★★`theme` の ほかの 鍵を 消しません。★上書きだけ します。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  BACK_TO, TITLE, lockLines, HEAD_LOOK, HEAD_ORDER, HEAD_LANG,
  LOOKS, ORDERS, LANGS, LOCKED_WORD, mayUseLook, mayUseLang,
  EN_LINE, BTN_PREVIEW, NOTES, lookOf, orderOf, langOf
} from "@/lib/portfolioLook";

const box = {
  borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, overflow: "hidden"
};
function H3({ children, first }) {
  return (
    <p style={{
      fontSize: "0.8125rem", color: C.ink, fontWeight: 600,
      margin: first ? "0 0 6px" : "15px 0 6px"
    }}>{children}</p>
  );
}
function 丸({ on }) {
  return (
    <span aria-hidden="true" style={{
      display: "inline-block", width: 17, height: 17, borderRadius: "50%",
      border: `1.6px solid ${on ? C.curtain : C.line}`,
      background: on ? C.curtain : "transparent",
      boxShadow: on ? `inset 0 0 0 3px ${C.card}` : "none",
      verticalAlign: "-3px"
    }} />
  );
}

export default function PortfolioLook({ theme, paid, onPick, onPreview, onBack }) {
  const いま = { look: lookOf(theme), order: orderOf(theme), lang: langOf(theme) };
  const 行 = (中, 右, 押せる, onClick, i) => (
    <button key={i} type="button" disabled={!押せる} onClick={onClick}
      style={{
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 12, width: "100%", minHeight: 44, padding: "12px 13px",
        border: "none", borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
        background: "transparent", textAlign: "left",
        color: 押せる ? C.ink : C.inkSoft, cursor: 押せる ? "pointer" : "default"
      }}>
      <span style={{ fontSize: "0.9375rem" }}>{中}</span>
      <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>{右}</span>
    </button>
  );

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />

      {!paid ? (
        <div style={{
          margin: "0 0 12px", padding: "11px 13px", borderRadius: 10,
          background: C.paper, border: `1px solid ${C.line}`
        }}>
          {lockLines().map((l, i) => (
            <p key={i} style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.9 }}>{l}</p>
          ))}
        </div>
      ) : null}

      <H3 first>{HEAD_LOOK}</H3>
      <div style={box}>
        {LOOKS.map((v, i) => 行(
          v,
          mayUseLook(i, paid) ? <丸 on={いま.look === v} /> : LOCKED_WORD,
          mayUseLook(i, paid),
          () => onPick && onPick({ look: v }),
          i
        ))}
      </div>

      <H3>{HEAD_ORDER}</H3>
      <div style={box}>
        {ORDERS.map((v, i) => 行(
          v, <丸 on={いま.order === v} />, true, () => onPick && onPick({ order: v }), i
        ))}
      </div>

      <H3>{HEAD_LANG}</H3>
      <div style={box}>
        {LANGS.map((l, i) => 行(
          l.label,
          mayUseLang(l.key, paid) ? <丸 on={いま.lang === l.key} /> : LOCKED_WORD,
          mayUseLang(l.key, paid),
          () => onPick && onPick({ lang: l.key }),
          i
        ))}
      </div>
      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "7px 0 12px", lineHeight: 1.9 }}>
        {EN_LINE}
      </p>

      <button type="button" onClick={onPreview}
        style={{
          display: "block", width: "100%", minHeight: 44, borderRadius: 10,
          border: `1px solid ${C.line}`, background: C.card, color: C.ink,
          fontSize: "0.9375rem", cursor: "pointer"
        }}>{BTN_PREVIEW}</button>

      <div style={{ marginTop: 14 }}>
        {NOTES.map((l, i) => (
          <p key={i} style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.9 }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
