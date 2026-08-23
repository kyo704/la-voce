"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/tokens";

const inputStyle = {
  padding: "12px 14px",
  borderRadius: 10,
  border: `1px solid ${C.line}`,
  fontSize: 14,
  background: C.card,
  color: C.ink
};
const buttonStyle = {
  padding: "13px",
  borderRadius: 12,
  border: "none",
  background: C.curtain,
  color: "#fff",
  fontWeight: 600,
  fontSize: 15
};

export default function LoginPage() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: form.email,
      password: form.password
    });
    if (error) {
      setError("メールアドレスまたはパスワードが正しくありません。");
      setStatus("idle");
      return;
    }
    window.location.href = "/dashboard";
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "64px 24px" }}>
      <h1 className="ff-display italic" style={{ fontSize: "2.5rem", color: C.curtain }}>
        ログイン
      </h1>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14, marginTop: 24 }}>
        <input
          required
          type="email"
          placeholder="メールアドレス"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          style={inputStyle}
        />
        <input
          required
          type="password"
          placeholder="パスワード"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          style={inputStyle}
        />
        {error && <p style={{ color: C.curtain, fontSize: 13 }}>{error}</p>}
        <button type="submit" disabled={status === "loading"} style={buttonStyle}>
          {status === "loading" ? "処理中…" : "ログイン"}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: 13, color: C.inkSoft }}>
        アカウントをお持ちでない方は <a href="/signup" style={{ color: C.curtain }}>新規登録</a>
      </p>
    </main>
  );
}
