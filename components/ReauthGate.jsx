"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import {
  REAUTH_HEADING, REAUTH_NOTE, REAUTH_FAILED, reauthReason
} from "@/lib/reauth";

// ============================================================================
// 大事な操作の前の、もう一度の確かめ（2026-09-05）
//
//   出どころ docs/reports/2026-09-05-FaceIDで再確認できるか.md §4
//
//   ★★Face ID を、こちらで呼ぶのではありません。
//     ★パスワードの欄を出すと、★iPhone が★自分で Face ID を出します。
//     ★autocomplete="current-password" が付いているからです。
//     ★★お客さまから見ると、★顔を見せるだけです。★打ちません。
//
//   ★★この画面は、★自分では確かめません。★受け取って、渡すだけです。
//     ★確かめるのは、★route です（lib/reauth.js の verifyPassword）。
//
//   ★★なぜ、ここで確かめないのか（2026-09-05・大事なところ）
//     ★入ったままの状態で signInWithPassword を呼ぶと、
//     ★★いまのセッションが★書き換わります。
//     ★route は、★セッションを持たないクライアントで確かめます。
//     ★だから、★いまのセッションは1ミリも動きません。
//     ★（app/api/account/delete/route.js:80 に、先に書いてありました）
//
//   ★どうして聞くのかを、★先に書きます。★黙って聞かないこと。
//
//   ★★本物の <form> にすること。★div にボタンを置くと、
//     ★端末がパスワードを差し出してくれません。
// ============================================================================

// ★email は受け取りません。★route が、入っている方のアドレスを使います。
//   ★画面から渡すと、★渡し間違いが起きます。
export default function ReauthGate({ action, onPassed, onCancel }) {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (busy || !password) return;
    setBusy(true);
    setError("");
    // ★★確かめるのは、呼ぶ側（route）です。★ここでは確かめません。
    //   ★onPassed は、★通ったら true、★だめなら false を返してください。
    let ok = false;
    try {
      ok = await onPassed(password);
    } catch (e2) {
      console.error("★もう一度の確かめが通りませんでした:", e2 && e2.message);
      ok = false;
    }
    setBusy(false);
    // ★★通っても通らなくても、★パスワードは手元から消します。
    //   ★画面にも、★状態にも残しません。
    setPassword("");
    if (!ok) setError(REAUTH_FAILED);
  }

  return (
    <form onSubmit={submit} style={{ maxWidth: 380 }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: C.ink, margin: "0 0 8px", lineHeight: 1.5 }}>
        {REAUTH_HEADING}
      </h2>
      {/* ★何のために聞いているかを、★数字より前に。 */}
      <p style={{ fontSize: "1rem", color: C.ink, margin: "0 0 6px", lineHeight: 1.8 }}>
        {reauthReason(action)}
      </p>
      <p style={{ fontSize: "0.9375rem", color: C.inkSoft, margin: "0 0 18px", lineHeight: 1.8 }}>
        {REAUTH_NOTE}
      </p>

      {/* ★★ここを外すと、★端末がパスワードを差し出してくれません。
          ★そうなると、★お客さまは打つことになります。
          ★この画面の意味が、★そこで消えます。 */}
      <input type="password" name="password" autoComplete="current-password"
        value={password} onChange={(e) => setPassword(e.target.value)}
        aria-label="パスワード"
        style={{
          width: "100%", padding: "14px", borderRadius: 12,
          border: `1px solid ${C.line}`, background: C.card, color: C.ink,
          // ★16px を下回らないこと。★iOS が画面を勝手に拡大します。
          fontSize: "max(16px, 1rem)", marginBottom: 14, boxSizing: "border-box"
        }} />

      {error && <p style={{ fontSize: "0.9375rem", color: C.curtain, margin: "0 0 12px", lineHeight: 1.7 }}>{error}</p>}

      <button type="submit" disabled={busy || !password}
        style={{
          width: "100%", padding: "15px", borderRadius: 999, border: "none",
          background: C.curtain, color: "#FFFDF8", fontSize: "1.0625rem", fontWeight: 600,
          minHeight: 52, opacity: (busy || !password) ? 0.5 : 1
        }}>
        {busy ? "確かめています…" : "すすむ"}
      </button>

      {/* ★出口を必ず置きます。 */}
      {onCancel && (
        <button type="button" onClick={onCancel}
          style={{
            width: "100%", marginTop: 10, padding: "13px", borderRadius: 999,
            border: "none", background: "transparent", color: C.inkSoft,
            fontSize: "1rem", minHeight: 48
          }}>
          やめる
        </button>
      )}
    </form>
  );
}
