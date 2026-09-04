"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "@/lib/tokens";
import { createClient } from "@/lib/supabase/client";
import {
  OTP_MAX_LENGTH, normalizeOtp, isSendableOtp,
  OTP_SENT_HEADING, OTP_INPUT_LABEL, OTP_NOT_ARRIVED
} from "@/lib/otpCode";

// ============================================================================
// メールに届いた数字を入れる段（2026-09-05）
//
//   出どころ docs/opus/lavoce-判断-パスワードを主にする（9月4日・訂正2）.md §3
//
//   ★★なぜ、リンクではなく数字なのか
//     ★メールのリンクを押すと、★既定のブラウザが開きます。
//     ★★ホーム画面に置いたアプリの、★外に出てしまいます。
//     ★そこで登録を終えても、★アプリの側は、まだ入れていません。
//     ★★「終わったのに入れない」という、いちばん困る形になります。
//
//   ★★この段は、★2つの場所で使います。★同じものを2つ作らないこと。
//     ・登録の確認   type="signup"
//     ・パスワードの決め直し  type="recovery"
//
//   ★桁数は、★ここで決めません（lib/otpCode.js）。
//     ★Supabase の設定で 6〜10 に変わります。
//     ★2026-09-05、設定が 8 で、★入れない方が出ました。
//
//   ★文字を小さくしないこと。★読めない画面は、無いのと同じです。
// ============================================================================

const RESEND_WAIT_SEC = 60;

export default function OtpCodeStep({
  email,
  type,            // "signup" ／ "recovery"
  heading,         // ★用途を書きます。★数字より前に（訂正2 §3）
  onVerified,
  onResend,        // ★もう一度送る。★用途ごとに違うので、呼ぶ側が渡します
  onBack
}) {
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(RESEND_WAIT_SEC);
  const timer = useRef(null);

  useEffect(() => {
    startWait();
    return () => { if (timer.current) clearInterval(timer.current); };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  function startWait() {
    setWait(RESEND_WAIT_SEC);
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(() => {
      setWait((n) => {
        if (n <= 1) { clearInterval(timer.current); return 0; }
        return n - 1;
      });
    }, 1000);
  }

  async function verify() {
    const t = normalizeOtp(code);
    if (!isSendableOtp(t) || busy) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({
      email: (email || "").trim(),
      token: t,
      type
    });
    setBusy(false);
    if (err) {
      console.error("★数字を確かめられませんでした:", err.message);
      // ★★「間違い」と「期限切れ」を、言い分けません。
      //   ★どちらでも、★することは同じです（もう一度送る）。
      setError("この数字では進めませんでした。もう一度お確かめください。");
      return;
    }
    if (onVerified) onVerified();
  }

  async function resend() {
    if (busy || wait > 0 || !onResend) return;
    setBusy(true);
    setError("");
    const ok = await onResend();
    setBusy(false);
    if (!ok) {
      setError("送れませんでした。少し置いて、もう一度お試しください。");
      return;
    }
    startWait();
  }

  return (
    <div>
      {/* ★用途を、数字より前に書きます（訂正2 §3）。
          ★★登録の数字と、決め直しの数字は、★見た目が同じです。 */}
      <h1 style={{ fontSize: "1.5rem", fontWeight: 600, color: C.ink, margin: "0 0 10px", lineHeight: 1.5 }}>
        {heading || OTP_SENT_HEADING}
      </h1>
      <p style={{ fontSize: "1rem", color: C.inkSoft, margin: "0 0 20px", lineHeight: 1.8 }}>
        {(email || "").trim()} に送っています。{OTP_INPUT_LABEL}
      </p>

      {/* ★one-time-code を落とさないこと。
          ★iOS が、メールから数字を拾って、★キーボードの上に出します。
          ★★お客さまは、打たずに済みます。 */}
      <input type="text" value={code}
        onChange={(e) => setCode(normalizeOtp(e.target.value))}
        autoComplete="one-time-code" inputMode="numeric" maxLength={OTP_MAX_LENGTH}
        placeholder="000000"
        aria-label={OTP_INPUT_LABEL}
        style={{
          width: "100%", padding: "14px", borderRadius: 12,
          border: `1px solid ${C.line}`, background: C.card, color: C.ink,
          // ★16px を下回らないこと。★iOS が画面を勝手に拡大します。
          fontSize: "max(16px, 1.75rem)", letterSpacing: "0.4em", textAlign: "center",
          marginBottom: 14, boxSizing: "border-box"
        }} />

      {error && <p style={{ fontSize: "0.9375rem", color: C.curtain, margin: "0 0 12px", lineHeight: 1.7 }}>{error}</p>}

      <button type="button" onClick={verify} disabled={busy || !isSendableOtp(code)}
        style={{
          width: "100%", padding: "15px", borderRadius: 999, border: "none",
          background: C.curtain, color: "#FFFDF8", fontSize: "1.0625rem", fontWeight: 600,
          minHeight: 52, opacity: (busy || !isSendableOtp(code)) ? 0.5 : 1
        }}>
        {busy ? "確かめています…" : "すすむ"}
      </button>

      <p style={{ fontSize: "0.9375rem", color: C.inkSoft, margin: "18px 0 10px", lineHeight: 1.8 }}>
        {OTP_NOT_ARRIVED}
      </p>

      {/* ★続けて押されると、送る側で止められます。★こちらでも待ちます。 */}
      {onResend && (
        <button type="button" onClick={resend} disabled={busy || wait > 0}
          style={{
            width: "100%", padding: "13px", borderRadius: 999,
            border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
            fontSize: "1rem", minHeight: 48, opacity: (busy || wait > 0) ? 0.5 : 1
          }}>
          {wait > 0 ? `もう一度送る（${wait}秒後）` : "もう一度送る"}
        </button>
      )}

      {/* ★どの画面にも「戻る」があります。 */}
      {onBack && (
        <button type="button" onClick={onBack}
          style={{
            width: "100%", marginTop: 10, padding: "13px", borderRadius: 999,
            border: "none", background: "transparent", color: C.inkSoft,
            fontSize: "1rem", minHeight: 48
          }}>
          もどる
        </button>
      )}
    </div>
  );
}
