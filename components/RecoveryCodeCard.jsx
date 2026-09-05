"use client";

import { useEffect, useState } from "react";
import { C } from "@/lib/tokens";
import {
  formatRecoveryCode,
  RECOVERY_HEADING, RECOVERY_BODY_LINES, RECOVERY_WARNING_LINES,
  RECOVERY_REISSUED_LINE, RECOVERY_ACK_LABEL
} from "@/lib/recoveryCode";

// ============================================================================
// 復旧コードを、1度だけお見せする画面（2026-09-05）
//
//   出どころ docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §3・§5
//
//   ★★ここだけは、★「あとで」を置きません。
//     ★ふだんの決まりは「出口のない画面を作らない」です。★ここだけ例外です。
//     ★この画面を閉じた瞬間に、★番号は二度と見られません。
//     ★「あとで」を押せると、★何も持たずに出ていき、★気づきません。
//     ★★気づくのは、★メールを失った日です。★そのときは、もう遅いです。
//
//   ★出口は「書き写しました」の1つだけです。
//   ★★決めそのものは lib/recoveryCode.js が持ちます
//     （maySkipRecoveryCodeScreen は false）。
//     ★ここでは、★その決めに従って、★出口を1つしか作りません。
//     ★見せかけの呼び出しを置かないこと。★確かめのためだけの行は、要りません。
//
//   ★★番号を、★どこにも送りません。★画面に出すだけです。
//     ★ログにも出しません。★コピーの控えも持ちません。
//
//   ★9か月、締め出された人を助ける人がいません。★それが、この画面の理由です。
// ============================================================================

export default function RecoveryCodeCard({ onDone, reissue = false }) {
  const [code, setCode] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/recovery/issue", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({})
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        setBusy(false);
        if (!res.ok || !data.code) {
          console.error("★控えをお出しできませんでした:", data.error || res.status);
          setError(data.error || "いま、控えをお出しできません。");
          return;
        }
        setCode(data.code);
      } catch (e) {
        if (cancelled) return;
        setBusy(false);
        console.error("★控えを頼めませんでした:", e && e.message);
        setError("いま、控えをお出しできません。");
      }
    })();
    return () => { cancelled = true; };
  }, []);

  async function copy() {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(formatRecoveryCode(code));
      setCopied(true);
    } catch (e) {
      // ★写せない端末があります。★画面に出ているので、書き写せます。
      //   ★★ここで止めないこと。
      console.error("★写せませんでした:", e && e.message);
    }
  }

  // ★出せなかったときも、★出口を1つ置きます。
  //   ★★ここで詰まらせると、★登録の直後に、★先へ進めなくなります。
  if (error) {
    return (
      <div style={{ maxWidth: 420 }}>
        <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: C.ink, margin: "0 0 10px", lineHeight: 1.5 }}>
          {RECOVERY_HEADING}
        </h2>
        <p style={{ fontSize: "1rem", color: C.ink, margin: "0 0 8px", lineHeight: 1.8 }}>{error}</p>
        <p style={{ fontSize: "0.9375rem", color: C.inkSoft, margin: "0 0 18px", lineHeight: 1.8 }}>
          設定の画面から、いつでもお出しできます。
        </p>
        <button type="button" onClick={onDone}
          style={{
            width: "100%", padding: "15px", borderRadius: 999, border: "none",
            background: C.curtain, color: "#FFFDF8", fontSize: "1.0625rem", fontWeight: 600, minHeight: 52
          }}>
          すすむ
        </button>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: 420 }}>
      <h2 style={{ fontSize: "1.25rem", fontWeight: 600, color: C.ink, margin: "0 0 12px", lineHeight: 1.5 }}>
        {RECOVERY_HEADING}
      </h2>

      {/* ★番号そのもの。★大きく、★区切って出します。
          ★書き写していただくものです。★区切らないと、必ず1文字ずれます。 */}
      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 14,
        padding: "18px 12px", textAlign: "center", marginBottom: 14
      }}>
        <p className="ff-mono" style={{
          fontSize: "clamp(20px, 6vw, 28px)", letterSpacing: "0.08em",
          color: C.ink, margin: 0, lineHeight: 1.5, wordBreak: "break-all"
        }}>
          {busy ? "…" : formatRecoveryCode(code)}
        </p>
      </div>

      {reissue && (
        <p style={{ fontSize: "0.9375rem", color: C.curtain, margin: "0 0 12px", lineHeight: 1.8 }}>
          {RECOVERY_REISSUED_LINE}
        </p>
      )}

      {RECOVERY_BODY_LINES.map((line) => (
        <p key={line} style={{ fontSize: "1rem", color: C.ink, margin: "0 0 6px", lineHeight: 1.8 }}>
          {line}
        </p>
      ))}

      {/* ★★元に戻せないことを、はっきり書きます。★ぼかさないこと。 */}
      <div style={{ background: C.paper, borderRadius: 14, padding: 14, margin: "16px 0" }}>
        {RECOVERY_WARNING_LINES.map((line) => (
          <p key={line} style={{ fontSize: "0.9375rem", color: C.ink, margin: "0 0 6px", lineHeight: 1.8 }}>
            {line}
          </p>
        ))}
      </div>

      {/* ★写せる端末では、写せるように。★写せなくても、画面に出ています。 */}
      <button type="button" onClick={copy} disabled={busy || !code}
        style={{
          width: "100%", padding: "13px", borderRadius: 999,
          border: `1px solid ${C.line}`, background: C.card, color: C.ink,
          fontSize: "1rem", minHeight: 48, marginBottom: 10,
          opacity: (busy || !code) ? 0.5 : 1
        }}>
        {copied ? "写しました" : "この番号を写す"}
      </button>

      {/* ★★出口は、これ1つです（判断書 §5）。
          ★「あとで」を置かないこと。★置くと、何も持たずに出ていかれます。 */}
      <button type="button" onClick={onDone} disabled={busy || !code}
        style={{
          width: "100%", padding: "15px", borderRadius: 999, border: "none",
          background: C.curtain, color: "#FFFDF8", fontSize: "1.0625rem", fontWeight: 600,
          minHeight: 52, opacity: (busy || !code) ? 0.5 : 1
        }}>
        {RECOVERY_ACK_LABEL}
      </button>
    </div>
  );
}
