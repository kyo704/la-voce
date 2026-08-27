"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// パスワードの再設定（Supabase Auth の標準の仕組み）
//
// 流れ:
//   ログイン画面 → resetPasswordForEmail(redirectTo: /auth/callback?next=/reset-password)
//   → メールのリンク → Supabase が検証 → /auth/callback がセッションを確立
//   → このページ → updateUser({ password }) → ログイン画面へ
//
// ★独自のトークンや照合は作らない。Supabase の仕組みだけを使う。
// ============================================================================

const T = {
  title: { ja: "新しいパスワードを設定", en: "Set a new password" },
  lead: { ja: "新しいパスワードを入力してください。8文字以上でお願いします。", en: "Enter a new password. Please use at least 8 characters." },
  ph1: { ja: "新しいパスワード", en: "New password" },
  ph2: { ja: "確認のためもう一度", en: "Repeat the password" },
  save: { ja: "このパスワードにする", en: "Set this password" },
  saving: { ja: "設定しています…", en: "Saving…" },
  done: { ja: "パスワードを変更しました。新しいパスワードでログインしてください。", en: "Password changed. Please log in with your new password." },
  toLogin: { ja: "ログインへ", en: "Go to login" },
  tooShort: { ja: "8文字以上にしてください。", en: "Please use at least 8 characters." },
  mismatch: { ja: "2つのパスワードが一致しません。", en: "The two passwords do not match." },
  failed: { ja: "変更できませんでした。時間をおいて、もう一度お試しください。", en: "Could not change it. Please try again in a moment." },
  noSession: { ja: "このリンクは有効ではありません。期限が切れたか、既に使われた可能性があります。ログイン画面から、もう一度お手続きください。", en: "This link is not valid. It may have expired or already been used. Please start again from the login screen." },
  checking: { ja: "確認しています…", en: "Checking…" }
};
function tr(k) { return T[k].ja; }

export default function ResetPasswordPage() {
  const [ready, setReady] = useState("checking"); // checking | ok | nosession
  const [pw1, setPw1] = useState("");
  const [pw2, setPw2] = useState("");
  const [status, setStatus] = useState("idle");   // idle | saving | done
  const [error, setError] = useState("");

  useEffect(() => {
    // /auth/callback がセッションを確立してからここへ来る。
    // 直接開かれた場合やリンクが期限切れの場合は、セッションが無い。
    (async () => {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      setReady(user ? "ok" : "nosession");
    })();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (pw1.length < 8) { setError(tr("tooShort")); return; }
    if (pw1 !== pw2) { setError(tr("mismatch")); return; }
    setStatus("saving");
    const supabase = createClient();
    const { error: err } = await supabase.auth.updateUser({ password: pw1 });
    if (err) {
      console.error("パスワードの変更に失敗しました:", err);
      setError(tr("failed"));
      setStatus("idle");
      return;
    }
    // 変更が済んだらセッションを畳む。新しいパスワードで入り直してもらう。
    await supabase.auth.signOut();
    setStatus("done");
  }

  const card = {
    width: "100%", maxWidth: 420, background: "#FBF6EA", borderRadius: 18,
    padding: "30px 26px", boxShadow: "0 24px 60px rgba(0,0,0,0.45), 0 0 0 1px rgba(212,169,79,0.25)",
    display: "flex", flexDirection: "column", gap: 14
  };
  const input = {
    padding: "13px 14px", borderRadius: 10, border: "1px solid #E4DCC9",
    background: "#FFFDF8", fontSize: 15, color: "#241914"
  };
  const button = {
    padding: "14px", borderRadius: 10, border: "none",
    background: "linear-gradient(180deg, #8A2A36, #7A1F2B)", color: "#FBF6EA",
    fontWeight: 600, fontSize: 15, cursor: "pointer"
  };

  return (
    <main style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "48px 20px",
      background: "radial-gradient(ellipse 70% 55% at 50% 32%, #3A1016 0%, #1A0A0D 62%, #12070A 100%)"
    }}>
      <div style={card}>
        <h1 className="ff-display italic" style={{ fontSize: "1.4rem", color: "#7A1F2B", margin: 0 }}>{tr("title")}</h1>

        {ready === "checking" && <p style={{ fontSize: 14, color: "#6b5d52", margin: 0 }}>{tr("checking")}</p>}

        {ready === "nosession" && (
          <>
            <p style={{ fontSize: 14, color: "#7A1F2B", margin: 0 }}>{tr("noSession")}</p>
            <a href="/login" style={{ ...button, textAlign: "center", textDecoration: "none", display: "block" }}>{tr("toLogin")}</a>
          </>
        )}

        {ready === "ok" && status === "done" && (
          <>
            <p style={{ fontSize: 14, color: "#4F7562", margin: 0 }}>{tr("done")}</p>
            <a href="/login" style={{ ...button, textAlign: "center", textDecoration: "none", display: "block" }}>{tr("toLogin")}</a>
          </>
        )}

        {ready === "ok" && status !== "done" && (
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <p style={{ fontSize: 13, color: "#6b5d52", margin: 0 }}>{tr("lead")}</p>
            <input required type="password" autoComplete="new-password" placeholder={tr("ph1")}
              value={pw1} onChange={(e) => setPw1(e.target.value)} style={input} />
            <input required type="password" autoComplete="new-password" placeholder={tr("ph2")}
              value={pw2} onChange={(e) => setPw2(e.target.value)} style={input} />
            {error && <p style={{ fontSize: 13, color: "#7A1F2B", margin: 0 }}>{error}</p>}
            <button type="submit" disabled={status === "saving"} style={{ ...button, opacity: status === "saving" ? 0.7 : 1 }}>
              {status === "saving" ? tr("saving") : tr("save")}
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
