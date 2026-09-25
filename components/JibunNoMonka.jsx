// ============================================================================
// ★自分の 門下（★2026-09-25・C群）
//
//   ★見本 `SC['自分の門下']`（★design-v75）。
//
//   ★★★返信の 欄を 置きません。★添付の 口も 置きません。
//     ★★「できません」と 書いて 欄を 置く のでは ありません ──
//       ★欄が あれば、★いつか 誰かが つなぎます。
//   ★★★`entries` を 1度も 引きません。★生徒の 記録に 道が ありません。
//   ★★字は `lib/jibunNoMonka.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  titleOf, countWord, BACK_TO, HEAD_LINES, WRITE_HEAD, WRITE_PLACEHOLDER,
  BTN_POST, mayPost, EMPTY_LINE, WITHDRAWN_MARK, isWithdrawn, noteLines
} from "@/lib/jibunNoMonka";

export default function JibunNoMonka({ me, count, posts, onPost, onBack }) {
  const 列 = Array.isArray(posts) ? posts : [];
  const [body, setBody] = useState("");
  const [err, setErr] = useState("");

  function 出す() {
    if (!mayPost(body)) { setErr("書いてから 出せます。"); return; }
    setErr("");
    if (onPost) onPost(body.trim());
    setBody("");
  }

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={titleOf(me)} right={countWord(count)} />

      <div style={{
        margin: "0 0 11px", padding: "11px 13px", borderRadius: 10,
        background: C.paper, border: `1px solid ${C.line}`
      }}>
        {HEAD_LINES.map((l, i) => (
          <p key={i} style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.9 }}>{l}</p>
        ))}
      </div>

      {列.length === 0 ? (
        <p style={{ fontSize: "0.8125rem", color: C.inkSoft }}>{EMPTY_LINE}</p>
      ) : 列.map((r) => (
        <div key={r.id} style={{
          marginBottom: 9, padding: "11px 13px", borderRadius: 10,
          background: C.card, border: `1px solid ${C.line}`
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", gap: 10 }}>
            <span style={{ fontSize: "0.8125rem", color: C.ink }}>{me}</span>
            <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>
              {String(r.created_at || "").slice(0, 10)}
            </span>
          </div>
          {/* ★★取り消した ものは 消しません。★印を つけます。 */}
          {isWithdrawn(r) ? (
            <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: 6 }}>
              {WITHDRAWN_MARK}
            </p>
          ) : (
            <p style={{
              fontSize: "0.84375rem", color: C.ink, lineHeight: 1.9, marginTop: 6,
              whiteSpace: "pre-wrap"
            }}>{r.body}</p>
          )}
        </div>
      ))}

      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "14px 0 5px" }}>{WRITE_HEAD}</p>
      {/* ★★打つ ところ 1つ だけ です。★添付の 口も 返信の 欄も ありません。 */}
      <textarea value={body} onChange={(e) => setBody(e.target.value)}
        placeholder={WRITE_PLACEHOLDER}
        style={{
          width: "100%", minHeight: 90, padding: "11px 12px", fontSize: "1rem",
          lineHeight: 1.85, borderRadius: 10, border: `1px solid ${C.line}`,
          background: C.card, color: C.ink, resize: "vertical"
        }} />
      <button type="button" onClick={出す}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 9,
          borderRadius: 10, border: "none", background: C.curtain,
          color: C.onCurtain, fontSize: "0.9375rem", cursor: "pointer"
        }}>{BTN_POST}</button>
      {err ? (
        <p style={{ fontSize: "0.8125rem", color: C.rust, marginTop: 8 }}>{err}</p>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {noteLines().map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", color: i === 2 ? C.ink : C.inkSoft, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
