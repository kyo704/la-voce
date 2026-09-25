// ============================================================================
// ★録画を 足す（★2026-09-25・C群 束5）
//
//   ★見本 `SC['録画を足す']`（★design-v51）。
//
//   ★★動画そのものを 受け取りません。★URL だけ です。
//   ★★4つの お答えは どこにも 残りません ── ★しまう 列が ありません。
//   ★★問いと 許す ところは `lib/portfolio.js` が 持ちます。★ここで 作りません。
// ============================================================================
"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import {
  RECORDING_ASKS, mayAddRecording, urlOk, hostOf, HOST_NG
} from "@/lib/portfolio";
import {
  TITLE, BACK_TO, F_URL, F_DATE, F_PLACE, URL_NOTE, ASKS_HEAD,
  YES, NOT_YET, BTN_ADD, NOT_ALL, NOTE_LINES
} from "@/lib/rokugaTasu";

export default function RokugaTasu({ onAdd, onBack }) {
  const [url, setUrl] = useState("");
  const [date, setDate] = useState("");
  const [place, setPlace] = useState("");
  // ★★お答えは ここ（画面の 中）にだけ あります。★送りません。★しまいません。
  const [asks, setAsks] = useState(() => RECORDING_ASKS.map(() => false));
  const [err, setErr] = useState("");

  const 形ok = url === "" || urlOk(url);
  // ★★`4つ` という 名前は 使えません ── ★数字から 始まる 名は 通りません。
  const よっつ = mayAddRecording(asks);

  function push() {
    if (!urlOk(url)) { setErr(HOST_NG); return; }
    if (!よっつ) { setErr(NOT_ALL); return; }
    setErr("");
    // ★★送るのは 3つ だけ です。★お答えは 渡しません。
    if (onAdd) onAdd({ url, detail: [date, place].filter(Boolean).join("　") });
  }

  const 欄 = (label, v, set, ph) => (
    <div style={{ marginTop: 12 }}>
      <p style={{ fontSize: "0.8125rem", color: C.ink, margin: "0 0 5px", fontWeight: 600 }}>
        {label}
      </p>
      <input value={v} onChange={(e) => set(e.target.value)} placeholder={ph || ""}
        style={{
          width: "100%", minHeight: 44, padding: "0 10px", fontSize: "1rem",
          borderRadius: 8, border: `1px solid ${C.line}`, background: C.card, color: C.ink
        }} />
    </div>
  );

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />

      <div>
        <p style={{ fontSize: "0.8125rem", color: C.ink, margin: "4px 0 5px", fontWeight: 600 }}>
          {F_URL}
        </p>
        <input value={url} onChange={(e) => setUrl(e.target.value)}
          style={{
            width: "100%", minHeight: 44, padding: "0 10px", fontSize: "1rem",
            borderRadius: 8, border: `1px solid ${形ok ? C.line : C.rust}`,
            background: C.card, color: C.ink
          }} />
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: 5, lineHeight: 1.8 }}>
          {URL_NOTE}
        </p>
        {/* ★★どこへ 行くかを、★押す 前に お見せします。 */}
        {url && 形ok ? (
          <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: 3 }}>{hostOf(url)}</p>
        ) : null}
      </div>

      {欄(F_DATE, date, setDate)}
      {欄(F_PLACE, place, setPlace)}

      <p style={{ fontSize: "0.8125rem", color: C.ink, margin: "14px 0 6px", fontWeight: 600 }}>
        {ASKS_HEAD}
      </p>
      <Box>
        {RECORDING_ASKS.map((q, i) => (
          <button key={i} type="button"
            onClick={() => setAsks((a) => a.map((v, k) => (k === i ? !v : v)))}
            style={{
              display: "flex", alignItems: "flex-start", justifyContent: "space-between",
              gap: 12, width: "100%", minHeight: 44, padding: "12px 14px",
              border: "none", background: "none", textAlign: "left",
              borderTop: i === 0 ? "none" : `1px solid ${C.line}`, cursor: "pointer"
            }}>
            <span style={{ fontSize: "0.84375rem", color: C.ink, lineHeight: 1.75 }}>{q}</span>
            <span style={{ fontSize: "0.8125rem", color: C.inkSoft, whiteSpace: "nowrap" }}>
              {asks[i] ? YES : NOT_YET}
            </span>
          </button>
        ))}
      </Box>

      {/* ★★押せない ままに しません。★押した ときに わけを 言います。 */}
      <button type="button" onClick={push}
        style={{
          display: "block", width: "100%", minHeight: 44, marginTop: 12,
          borderRadius: 10, border: "none",
          background: よっつ ? C.curtain : C.card,
          border: よっつ ? "none" : `1px solid ${C.line}`,
          color: よっつ ? C.onCurtain : C.inkSoft,
          fontSize: "0.9375rem", cursor: "pointer"
        }}>{BTN_ADD}</button>
      {err ? (
        <p style={{ fontSize: "0.8125rem", color: C.rust, marginTop: 8, lineHeight: 1.85 }}>{err}</p>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {NOTE_LINES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", color: i === 3 ? C.ink : C.inkSoft, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
