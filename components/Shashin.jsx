// ============================================================================
// ★写真（★裁定199・2026-09-25）
//
//   ★見本 `SC['写真']`（★design-v51）。
//
//   ★★★端末で 作り直して から 送ります（★1段目）。
//     ★元の ものを 送りません。★選んだ ファイルは どこへも 行きません。
//   ★★サーバが もう一度 確かめます（★2段目）。★断られたら わけを 出します。
//   ★★台帳が 印の 無い 写真を 他人に 出しません（★3段目・sql/83）。
//   ★★決めと 字は `lib/photoExif.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { useRef, useState } from "react";
import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  rebuild, mayAddPhoto, countLine, FACE_MARK, NOTE_LINES, ACCEPT_TYPES, MAX_PHOTOS
} from "@/lib/photoExif";

export default function Shashin({ photos, urlOf, onAdded, onRemove, onBack }) {
  const 枚 = Array.isArray(photos) ? photos : [];
  const 口 = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  async function 足す(file) {
    if (!file) return;
    setBusy(true); setErr("");
    try {
      // ★★★ここで 作り直します。★元の ものは 送りません。
      const { blob, w, h } = await rebuild(file);
      const fd = new FormData();
      fd.append("file", blob, "p.webp");
      fd.append("w", String(w));
      fd.append("h", String(h));
      const r = await fetch("/api/portfolio-photo", { method: "POST", body: fd });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) { setErr(j.line || "上げられませんでした。"); return; }
      if (onAdded) onAdded(j);
    } catch (e) {
      setErr("この 写真は 読めませんでした。");
    } finally {
      setBusy(false);
      // ★★同じ 写真を もう一度 選べる ように、★口を 空に します。
      if (口.current) 口.current.value = "";
    }
  }

  return (
    <div>
      <Back onClick={onBack}>あなたのページ</Back>
      <ScreenHead title="写真" />
      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "0 0 10px" }}>
        {countLine(枚.length)}
      </p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8 }}>
        {枚.map((p, i) => (
          <div key={p.id} style={{
            position: "relative", aspectRatio: "3 / 4", borderRadius: 8,
            overflow: "hidden", background: C.paper, border: `1px solid ${C.line}`
          }}>
            {/* ★★署名つきの 道 だけ を 使います。★道を 組み立てません。 */}
            {urlOf && urlOf(p) ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img src={urlOf(p)} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : null}
            {i === 0 ? (
              <span style={{
                position: "absolute", left: 6, bottom: 6, background: C.card,
                borderRadius: 4, padding: "1px 5px", fontSize: "0.75rem", color: C.ink
              }}>{FACE_MARK}</span>
            ) : null}
            <button type="button" aria-label="外す" onClick={() => onRemove && onRemove(p.id)}
              style={{
                position: "absolute", top: 5, right: 5, width: 24, height: 24,
                borderRadius: 999, border: "none", background: C.card,
                color: C.ink, fontSize: "0.8125rem", cursor: "pointer"
              }}>×</button>
          </div>
        ))}

        {mayAddPhoto(枚.length) ? (
          <button type="button" disabled={busy} onClick={() => 口.current && 口.current.click()}
            style={{
              aspectRatio: "3 / 4", borderRadius: 8, background: "none",
              border: `1.5px dashed ${C.line}`, color: C.curtain,
              fontSize: "0.8125rem", cursor: busy ? "default" : "pointer"
            }}>{busy ? "…" : "＋ 足す"}</button>
        ) : null}
      </div>

      <input ref={口} type="file" accept={ACCEPT_TYPES.join(",")}
        onChange={(e) => void 足す(e.target.files && e.target.files[0])}
        style={{ display: "none" }} />

      {err ? (
        <p style={{ fontSize: "0.8125rem", color: C.rust, marginTop: 10, lineHeight: 1.85 }}>{err}</p>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {NOTE_LINES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", color: i === 1 ? C.ink : C.inkSoft, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
