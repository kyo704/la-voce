// ============================================================================
// ★出す ── ★ポートフォリオを 外に 出す（★2026-09-25・C群 第1段・束5）
//
//   ★見本 `SC['出す']`（★design-v51）。
//
//   ★★範囲は `lib/portfolio.js` が 持ちます。★字も 鍵も ここで 決めません。
//   ★★18歳未満の 方に `public` を 出しません（★`scopesFor`）。
//   ★★★体調の ことは 1文字も 出ません ── ★引く 表に その 列が ありません。
// ============================================================================
"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import { SCOPES, scopesFor, mayUseScope } from "@/lib/portfolio";
import { ageBandOf, AGE_BANDS } from "@/lib/ageGate";
import {
  TITLE, MINOR_LINES, SLUG_HEAD, SLUG_PREFIX, SLUG_RULE, slugOk, SLUG_NG,
  SCOPE_HEAD, PUBLIC_SUB, LOCK_WORD, NOINDEX_LABEL, NOINDEX_SUB,
  BTN_PUBLISH, BTN_UNPUBLISH, isPublished, NOTE_LINES
} from "@/lib/dasu";

export default function Dasu({ paper, profile, onChange, onPublish, onUnpublish, onBack }) {
  const p = paper || {};
  const [slug, setSlug] = useState(p.public_slug || "");
  const 大人 = ageBandOf(profile) === AGE_BANDS.ADULT;
  const 選べる = scopesFor(profile);
  const 形ok = slug === "" || slugOk(slug);

  return (
    <div>
      <Back onClick={onBack}>ページをたしかめる</Back>
      <ScreenHead title={TITLE} />

      {!大人 ? (
        <div style={{
          margin: "0 0 11px", padding: "11px 13px", borderRadius: 10,
          background: C.paper, border: `1px solid ${C.line}`
        }}>
          {MINOR_LINES.map((l, i) => (
            <p key={i} style={{
              fontSize: "0.8125rem", color: i === 0 ? C.ink : C.inkSoft, lineHeight: 1.9
            }}>{l}</p>
          ))}
        </div>
      ) : null}

      <p style={{ fontSize: "0.8125rem", color: C.ink, margin: "0 0 6px", fontWeight: 600 }}>
        {SLUG_HEAD}
      </p>
      <div style={{ display: "flex", alignItems: "center", gap: 0 }}>
        <span style={{ fontSize: "0.8125rem", color: C.inkSoft, whiteSpace: "nowrap" }}>
          {SLUG_PREFIX}
        </span>
        <input value={slug} onChange={(e) => setSlug(e.target.value)}
          onBlur={() => { if (slugOk(slug) && onChange) onChange({ public_slug: slug }); }}
          style={{
            flex: 1, minHeight: 44, marginLeft: 2, padding: "0 10px",
            fontSize: "1rem", borderRadius: 8,
            border: `1px solid ${形ok ? C.line : C.rust}`, background: C.card, color: C.ink
          }} />
      </div>
      {/* ★★形の きまりは いつも 出します。★間違えて から 言いません。 */}
      <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: 5, lineHeight: 1.8 }}>
        {SLUG_RULE}
      </p>
      {!形ok ? (
        <p style={{ fontSize: "0.75rem", color: C.rust, marginTop: 3, lineHeight: 1.8 }}>
          {SLUG_NG}
        </p>
      ) : null}

      <p style={{ fontSize: "0.8125rem", color: C.ink, margin: "14px 0 6px", fontWeight: 600 }}>
        {SCOPE_HEAD}
      </p>
      <Box>
        {SCOPES.map((s, i) => {
          const 錠 = !mayUseScope(profile, s.key);
          const 選 = (p.visibility || "self") === s.key;
          return (
            <div key={s.key} style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, minHeight: 44, padding: "12px 14px",
              borderTop: i === 0 ? "none" : `1px solid ${C.line}`,
              cursor: 錠 ? "default" : "pointer"
            }}
              onClick={() => { if (!錠 && onChange) onChange({ visibility: s.key }); }}>
              <span>
                <span style={{ fontSize: "0.875rem", color: 錠 ? C.inkSoft : C.ink }}>
                  {s.label}
                </span>
                {s.key === "public" ? (
                  <span style={{ display: "block", fontSize: "0.75rem", color: C.inkSoft, marginTop: 2 }}>
                    {PUBLIC_SUB}
                  </span>
                ) : null}
              </span>
              {/* ★★錠の ときは わけを 書きます。★灰色に するだけに しません。 */}
              {錠 ? (
                <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>{LOCK_WORD}</span>
              ) : (
                <span style={{
                  display: "inline-block", width: 17, height: 17, borderRadius: "50%",
                  border: `1.6px solid ${選 ? C.curtain : C.line}`,
                  background: 選 ? C.curtain : "transparent",
                  boxShadow: 選 ? `inset 0 0 0 3px ${C.card}` : "none"
                }} />
              )}
            </div>
          );
        })}
      </Box>

      {/* ★★検索に 出さない（★`portfolios.noindex`・sql/78 で 足りた 列）。 */}
      <Box style={{ marginTop: 11 }}>
        <div style={{
          display: "flex", alignItems: "center", justifyContent: "space-between",
          gap: 12, minHeight: 44, padding: "12px 14px", cursor: "pointer"
        }}
          onClick={() => onChange && onChange({ noindex: !p.noindex })}>
          <span>
            <span style={{ fontSize: "0.875rem", color: C.ink }}>{NOINDEX_LABEL}</span>
            <span style={{ display: "block", fontSize: "0.75rem", color: C.inkSoft, marginTop: 2 }}>
              {NOINDEX_SUB}
            </span>
          </span>
          <span style={{
            display: "inline-block", width: 17, height: 17, borderRadius: 4,
            border: `1.6px solid ${p.noindex ? C.curtain : C.line}`,
            background: p.noindex ? C.curtain : "transparent"
          }} />
        </div>
      </Box>

      <button type="button" disabled={!形ok} onClick={onPublish}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 12,
          borderRadius: 10, border: "none",
          background: 形ok ? C.curtain : C.line,
          color: C.onCurtain, fontSize: "0.9375rem",
          cursor: 形ok ? "pointer" : "default"
        }}>{BTN_PUBLISH}</button>
      {isPublished(p) ? (
        <button type="button" onClick={onUnpublish}
          style={{
            display: "block", width: "100%", minHeight: 44, marginTop: 8,
            borderRadius: 10, border: `1px solid ${C.line}`, background: C.card,
            color: C.ink, fontSize: "0.9375rem", cursor: "pointer"
          }}>{BTN_UNPUBLISH}</button>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {NOTE_LINES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem",
            color: i === 0 || i === 3 ? C.ink : C.inkSoft, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
