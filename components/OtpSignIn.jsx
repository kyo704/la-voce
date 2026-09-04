"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "@/lib/tokens";
import { createClient } from "@/lib/supabase/client";
import { countStep } from "@/lib/countStep";

// ============================================================================
// 6桁の数字で入る（2026-09-04）
//
//   出どころ docs/opus/lavoce-仕様-ホーム画面までの動線・画面と文言（9月4日）.md §4
//
//   ★★リンクではなく、6桁の数字です。
//     ★メールのリンクを押すと、★既定のブラウザが開きます。
//     ★★せっかくホーム画面に置いたアプリの、★外に出てしまいます。
//     ★数字なら、★ホーム画面版の中で完結します。
//
//   ★★パスワードを作らせません。
//     ★いまお使いの方は、★パスワードのままです。★触りません。
//     ★ここは、★新しく始める方の道です。
//
//   ★貼り付けでも入るようにします（autocomplete="one-time-code"）。
//
//   ★★文字を小さくしないこと。
//     ★お客さまには、年配の声の professional がいらっしゃいます。
//     ★読めない画面は、★無いのと同じです。
// ============================================================================

const RESEND_WAIT_SEC = 60;

export default function OtpSignIn({ onSignedIn }) {
  const [stage, setStage] = useState("email"); // email | code
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);
  const timer = useRef(null);

  useEffect(() => () => { if (timer.current) clearInterval(timer.current); }, []);

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

  async function send() {
    const addr = email.trim();
    if (!addr || busy) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    // ★shouldCreateUser: true です。★はじめての方は、ここで作られます。
    //   ★★emailRedirectTo は渡しません。
    //     ★渡すと、★リンクのほうを使う形に寄ります。
    //     ★私たちが使うのは、★数字のほうです。
    const { error: err } = await supabase.auth.signInWithOtp({
      email: addr,
      options: { shouldCreateUser: true }
    });
    setBusy(false);
    if (err) {
      console.error("★数字を送れませんでした:", err.message);
      // ★★そのアドレスが登録済みかどうかを、★言い分けないこと。
      //   ★言い分けると、★誰が使っているかを調べる道具になります。
      setError("送れませんでした。アドレスをご確認のうえ、もう一度お試しください。");
      return;
    }
    countStep("register_started");
    setStage("code");
    startWait();
  }

  async function verify() {
    const t = code.replace(/[^0-9]/g, "");
    if (t.length !== 6 || busy) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const { error: err } = await supabase.auth.verifyOtp({
      email: email.trim(),
      token: t,
      type: "email"
    });
    setBusy(false);
    if (err) {
      console.error("★数字を確かめられませんでした:", err.message);
      // ★「間違い」と「期限切れ」を、言い分けません。
      //   ★どちらでも、★することは同じです（もう一度送る）。
      setError("この数字では入れませんでした。もう一度お確かめください。");
      return;
    }
    countStep("register_completed");
    if (onSignedIn) onSignedIn();
  }

  if (stage === "email") {
    return (
      <div>
        <h1 style={{ fontSize: 24, fontWeight: 600, color: C.ink, margin: "0 0 10px", lineHeight: 1.5 }}>
          メールアドレスを教えてください。
        </h1>
        <p style={{ fontSize: 16, color: C.inkSoft, margin: "0 0 20px", lineHeight: 1.8 }}>
          パスワードは要りません。
        </p>

        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
          autoComplete="email" inputMode="email"
          placeholder="mail@example.com"
          style={{
            width: "100%", padding: "14px", borderRadius: 12,
            border: `1px solid ${C.line}`, background: C.card, color: C.ink,
            // ★16px より小さくしないこと。★iOS で画面が勝手に拡大します。
            fontSize: 17, marginBottom: 14, boxSizing: "border-box"
          }} />

        {error && <p style={{ fontSize: 15, color: C.curtain, margin: "0 0 12px", lineHeight: 1.7 }}>{error}</p>}

        <button type="button" onClick={send} disabled={busy || !email.trim()}
          style={{
            width: "100%", padding: "15px", borderRadius: 999, border: "none",
            background: C.curtain, color: "#FFFDF8", fontSize: 17, fontWeight: 600,
            minHeight: 52, opacity: (busy || !email.trim()) ? 0.5 : 1
          }}>
          {busy ? "送っています…" : "次へ"}
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 style={{ fontSize: 24, fontWeight: 600, color: C.ink, margin: "0 0 10px", lineHeight: 1.5 }}>
        メールに、6桁の数字を送りました。
      </h1>
      <p style={{ fontSize: 16, color: C.inkSoft, margin: "0 0 20px", lineHeight: 1.8 }}>
        {email.trim()} に送っています。
      </p>

      {/* ★貼り付けでも入るようにします。★one-time-code を落とさないこと。 */}
      <input type="text" value={code}
        onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 6))}
        autoComplete="one-time-code" inputMode="numeric" maxLength={6}
        placeholder="000000"
        style={{
          width: "100%", padding: "14px", borderRadius: 12,
          border: `1px solid ${C.line}`, background: C.card, color: C.ink,
          fontSize: 28, letterSpacing: "0.4em", textAlign: "center",
          marginBottom: 14, boxSizing: "border-box"
        }} />

      {error && <p style={{ fontSize: 15, color: C.curtain, margin: "0 0 12px", lineHeight: 1.7 }}>{error}</p>}

      <button type="button" onClick={verify} disabled={busy || code.length !== 6}
        style={{
          width: "100%", padding: "15px", borderRadius: 999, border: "none",
          background: C.curtain, color: "#FFFDF8", fontSize: 17, fontWeight: 600,
          minHeight: 52, opacity: (busy || code.length !== 6) ? 0.5 : 1
        }}>
        {busy ? "確かめています…" : "入る"}
      </button>

      <p style={{ fontSize: 15, color: C.inkSoft, margin: "18px 0 10px", lineHeight: 1.8 }}>
        届かないときは、迷惑メールもご覧ください。
      </p>

      {/* ★続けて押されると、送る側で止められます。★こちらでも待ちます。 */}
      <button type="button" onClick={send} disabled={busy || wait > 0}
        style={{
          width: "100%", padding: "13px", borderRadius: 999,
          border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
          fontSize: 16, minHeight: 48, opacity: (busy || wait > 0) ? 0.5 : 1
        }}>
        {wait > 0 ? `もう一度送る（${wait}秒後）` : "もう一度送る"}
      </button>

      {/* ★どの画面にも「戻る」があります。 */}
      <button type="button" onClick={() => { setStage("email"); setCode(""); setError(""); }}
        style={{
          width: "100%", marginTop: 10, padding: "13px", borderRadius: 999,
          border: "none", background: "transparent", color: C.inkSoft,
          fontSize: 16, minHeight: 48
        }}>
        アドレスを入れ直す
      </button>
    </div>
  );
}
