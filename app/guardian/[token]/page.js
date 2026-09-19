"use client";

import { useState } from "react";
import { useParams } from "next/navigation";
import {
  DONE_HEAD, DONE_LINES, FAILED_LINE, SCHOOL_SEES, SCHOOL_NEVER_SEES,
  GUARDIAN_NOTES, GUARDIAN_LATER
} from "@/lib/guardianConsent";

// ============================================================================
// ★保護者の 画面（★裁定 その107・2026-09-20）
//
//   ★★★お入りに なって いない 方が 開きます。★アカウントは 作りません。
//     ★★押す ところは 1つ だけ です。
//   ★★★お子さまの 記録は、★この 画面にも 出しません。
//     ★★出て いるのは、★学校に 何が 見えるか だけ です。
//
//   ★★色は 直に 書きます（★門の 外の 画面 です。★`lib/tokens.js` を 使いません）。
//   ★見張り components/tests/guardian-consent.test.js
// ============================================================================

export default function GuardianPage() {
  const params = useParams();
  const token = typeof params?.token === "string" ? params.token : "";
  const [状態, set状態] = useState("まだ");
  const [断り, set断り] = useState("");

  async function 押す() {
    set状態("いま");
    set断り("");
    try {
      const r = await fetch("/api/guardian/accept", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ token })
      });
      const j = await r.json();
      if (j && j.ok) {
        set状態("済み");
        return;
      }
      set状態("まだ");
      set断り((j && j.error) || FAILED_LINE);
    } catch {
      set状態("まだ");
      set断り(FAILED_LINE);
    }
  }

  return (
    <main style={{
      maxWidth: 560, margin: "0 auto", padding: "28px 18px 48px",
      background: "#FFFDF8", color: "#2B2622", minHeight: "100vh",
      fontFamily: "system-ui, -apple-system, 'Hiragino Sans', sans-serif",
      lineHeight: 1.9
    }}>
      <h1 style={{ fontSize: "1.25rem", margin: "0 0 4px" }}>
        {状態 === "済み" ? DONE_HEAD : "お子さまが 学校に 入ろうと して います"}
      </h1>

      {状態 === "済み" ? (
        <div style={{ marginTop: 14 }}>
          {DONE_LINES.map((t) => (
            <p key={t} style={{ margin: "0 0 8px", fontSize: "0.96875rem" }}>{t}</p>
          ))}
        </div>
      ) : (
        <>
          <div style={{
            marginTop: 14, padding: "14px 16px", borderRadius: 12,
            border: "1px solid #E6DCC8", background: "#FFFFFF"
          }}>
            <p style={{ margin: 0, fontSize: "0.90625rem", fontWeight: 700 }}>
              学校に 見える もの
            </p>
            <p style={{ margin: "2px 0 10px", fontSize: "0.90625rem" }}>
              {SCHOOL_SEES.join("／")}
            </p>
            <p style={{ margin: 0, fontSize: "0.90625rem", fontWeight: 700 }}>
              学校に 見えない もの
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "0.90625rem" }}>
              {SCHOOL_NEVER_SEES.join("／")}
            </p>
          </div>

          <p style={{ marginTop: 14, fontSize: "0.90625rem" }}>
            よろしければ、下を 押して ください。
          </p>

          <button type="button" onClick={押す} disabled={状態 === "いま" || !token}
            style={{
              width: "100%", minHeight: 52, marginTop: 8, borderRadius: 12,
              border: "1px solid #840C24", borderBottomWidth: 3,
              background: "#840C24", color: "#FFFDF8",
              fontSize: "0.96875rem", cursor: "pointer"
            }}>
            {状態 === "いま" ? "送って います" : "承知しました"}
          </button>

          {断り ? (
            <p style={{ marginTop: 10, fontSize: "0.90625rem" }}>{断り}</p>
          ) : null}

          {/* ★★★「いまは やめて おく」も 置きます（★見本・第7版）。
               ★★押さずに 閉じる ことが、★はっきり できる ように します。
               ★★★押しても 何も 起きません ── ★それで 正しい です。
                 ★★同意を しない、が この 札の 中身 です。 */}
          <button type="button" onClick={() => window.close()}
            style={{
              width: "100%", minHeight: 48, marginTop: 8, borderRadius: 12,
              border: "1px solid #E6DCC8", background: "#FFFFFF",
              color: "#6B6259", fontSize: "0.90625rem", cursor: "pointer"
            }}>{GUARDIAN_LATER}</button>

          <div style={{ marginTop: 18, fontSize: "0.78125rem", color: "#6B6259" }}>
            {GUARDIAN_NOTES.map((t2) => (
              <p key={t2} style={{ margin: "0 0 4px" }}>※{t2}</p>
            ))}
          </div>
        </>
      )}
    </main>
  );
}
