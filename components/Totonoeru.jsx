// ============================================================================
// ★整える ── ★ページの 見た目（★2026-09-25・C群 束5）
//
//   ★見本 `SC['整える']`（★design-v51）。
//
//   ★★赤・黄・緑が 1つも ありません。★信号に 読まれない ため です。
//   ★★選びは `portfolios.theme`（jsonb）と `page_sections` に 残ります。
//     ★★型（`paper_type`／`web_type`）と 別の ところ です ──
//       ★だから「型を 変えても 残ります」が ほんとう です。
//   ★★字と 決めは `lib/totonoeru.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import {
  TITLE, BACK_TO, COLORS, COLOR_NOTE, FONTS, PHOTO_SHAPES,
  HEAD_COLOR, HEAD_FONT, HEAD_PHOTO, HEAD_SECTION,
  themeOf, sortSections, move, NOTE_LINES
} from "@/lib/totonoeru";

export default function Totonoeru({ theme, sections, onTheme, onSections, onBack }) {
  const t = themeOf(theme);
  const 節 = sortSections(sections);

  const 丸 = (on) => ({
    display: "inline-block", width: 17, height: 17, borderRadius: "50%",
    border: `1.6px solid ${on ? C.curtain : C.line}`,
    background: on ? C.curtain : "transparent",
    boxShadow: on ? `inset 0 0 0 3px ${C.card}` : "none"
  });

  const 組 = (head, list, now, key) => (
    <>
      <p style={{ fontSize: "0.8125rem", color: C.ink, margin: "14px 0 6px", fontWeight: 600 }}>
        {head}
      </p>
      <Box>
        {list.map((x, i) => (
          <button key={x.key} type="button"
            onClick={() => onTheme && onTheme({ ...theme, [key]: x.key })}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, width: "100%", minHeight: 44, padding: "12px 14px",
              border: "none", background: "none", textAlign: "left",
              borderTop: i === 0 ? "none" : `1px solid ${C.line}`, cursor: "pointer"
            }}>
            <span style={{ fontSize: "0.875rem", color: C.ink }}>{x.label}</span>
            <span style={丸(now === x.key)} />
          </button>
        ))}
      </Box>
    </>
  );

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />

      <p style={{ fontSize: "0.8125rem", color: C.ink, margin: "4px 0 8px", fontWeight: 600 }}>
        {HEAD_COLOR}
      </p>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 9, marginBottom: 8 }}>
        {COLORS.map((c) => (
          <button key={c.key} type="button" title={c.label}
            aria-label={c.label} aria-pressed={t.accent === c.key}
            onClick={() => onTheme && onTheme({ ...theme, accent: c.key })}
            style={{
              width: 34, height: 34, borderRadius: "50%", background: c.hex,
              border: "none", cursor: "pointer",
              boxShadow: t.accent === c.key
                ? `0 0 0 2px ${C.card}, 0 0 0 4px ${c.hex}` : "none"
            }} />
        ))}
      </div>
      {/* ★★★この 1行を 消さないこと。★なぜ 8色 なのかを 言って います。 */}
      <p style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.85 }}>{COLOR_NOTE}</p>

      {組(HEAD_FONT, FONTS, t.font, "font")}
      {組(HEAD_PHOTO, PHOTO_SHAPES, t.photoShape, "photoShape")}

      <p style={{ fontSize: "0.8125rem", color: C.ink, margin: "14px 0 6px", fontWeight: 600 }}>
        {HEAD_SECTION}
      </p>
      <Box>
        {節.map((s, i) => (
          <div key={s.key} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 10, padding: "10px 14px",
            borderTop: i === 0 ? "none" : `1px solid ${C.line}`
          }}>
            <span style={{ fontSize: "0.875rem", color: C.ink }}>{s.title || s.label}</span>
            <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {/* ★★端では 動きません。★押せない ものを 出しません。 */}
              {i > 0 ? (
                <button type="button" aria-label="上げる"
                  onClick={() => onSections && onSections(move(節, i, -1))}
                  style={{
                    minWidth: 44, minHeight: 44, borderRadius: 999,
                    border: `1px solid ${C.line}`, background: C.card,
                    color: C.inkSoft, cursor: "pointer"
                  }}>↑</button>
              ) : null}
              {i < 節.length - 1 ? (
                <button type="button" aria-label="下げる"
                  onClick={() => onSections && onSections(move(節, i, 1))}
                  style={{
                    minWidth: 44, minHeight: 44, borderRadius: 999,
                    border: `1px solid ${C.line}`, background: C.card,
                    color: C.inkSoft, cursor: "pointer"
                  }}>↓</button>
              ) : null}
              <button type="button" aria-label={s.visible ? "消す" : "出す"}
                onClick={() => onSections && onSections(
                  節.map((x, k) => (k === i ? { ...x, visible: !x.visible } : x)))}
                style={{
                  minWidth: 44, minHeight: 44, border: "none",
                  background: "none", cursor: "pointer"
                }}>
                <span style={{
                  display: "inline-block", width: 17, height: 17, borderRadius: 4,
                  border: `1.6px solid ${s.visible ? C.curtain : C.line}`,
                  background: s.visible ? C.curtain : "transparent",
                  boxShadow: s.visible ? `inset 0 0 0 3px ${C.card}` : "none"
                }} />
              </button>
            </span>
          </div>
        ))}
      </Box>

      <div style={{ marginTop: 14 }}>
        {NOTE_LINES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", color: i === 0 ? C.inkSoft : C.ink, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
