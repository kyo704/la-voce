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

export default function SignupForm() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    isStudent: false,
    occupation: "",
    school: ""
  });
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setStatus("loading");
    setError("");
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: {
        data: {
          name: form.name,
          occupation: form.isStudent ? "学生" : form.occupation,
          school: form.isStudent ? form.school : ""
        },
        emailRedirectTo: `${window.location.origin}/auth/callback`
      }
    });
    if (error) {
      setError(error.message);
      setStatus("idle");
      return;
    }
    setStatus("done");
  }

  if (status === "done") {
    return (
      <main style={{ maxWidth: 420, margin: "0 auto", padding: "64px 24px", textAlign: "center" }}>
        <h1 className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain }}>
          確認メールを送信しました
        </h1>
        <p style={{ color: C.inkSoft, marginTop: 12, lineHeight: 1.7 }}>
          {form.email} 宛にメールを送信しました。メール内のリンクをクリックして登録を完了してください。
        </p>
      </main>
    );
  }

  return (
    <main style={{ maxWidth: 420, margin: "0 auto", padding: "64px 24px" }}>
      <h1 className="ff-display italic" style={{ fontSize: "2.5rem", color: C.curtain }}>
        La Voce に登録
      </h1>
      <p style={{ color: C.inkSoft, marginBottom: 16 }}>
        現在、実験公開期間中につき無料でご利用いただけます。
      </p>
      <div style={{ background: C.card, border: `1.5px solid ${C.sage}`, borderRadius: 12, padding: "12px 14px", marginBottom: 24, fontSize: 12.5, color: C.inkSoft, lineHeight: 1.6 }}>
        🔒 入力いただく体調・声の記録は、あなたご自身への分析表示のためだけに使い、広告目的での第三者提供や販売は一切行いません。詳しくは
        <a href="/legal/privacy" style={{ color: C.sage, fontWeight: 600 }}> プライバシーポリシー</a>をご覧ください。
      </div>
      <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
        <input
          required
          placeholder="お名前"
          value={form.name}
          onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          style={inputStyle}
        />
        <input
          required
          type="email"
          placeholder="メールアドレス"
          value={form.email}
          onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          style={inputStyle}
        />

        <label style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 13, color: C.inkSoft }}>
          <input
            type="checkbox"
            checked={form.isStudent}
            onChange={(e) => setForm((f) => ({ ...f, isStudent: e.target.checked }))}
          />
          学生です
        </label>

        {form.isStudent ? (
          <div>
            <label style={{ fontSize: 12, color: C.inkSoft, display: "block", marginBottom: 4 }}>学校名</label>
            <input
              required
              placeholder="例：〇〇音楽大学"
              value={form.school}
              onChange={(e) => setForm((f) => ({ ...f, school: e.target.value }))}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
        ) : (
          <div>
            <label style={{ fontSize: 12, color: C.inkSoft, display: "block", marginBottom: 4 }}>職業</label>
            <input
              required
              placeholder="例：声楽家、会社員 など"
              value={form.occupation}
              onChange={(e) => setForm((f) => ({ ...f, occupation: e.target.value }))}
              style={{ ...inputStyle, width: "100%" }}
            />
          </div>
        )}

        <input
          required
          type="password"
          minLength={8}
          placeholder="パスワード（8文字以上）"
          value={form.password}
          onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
          style={inputStyle}
        />
        {error && <p style={{ color: C.curtain, fontSize: 13 }}>{error}</p>}
        <button type="submit" disabled={status === "loading"} style={buttonStyle}>
          {status === "loading" ? "処理中…" : "登録する"}
        </button>
      </form>
      <p style={{ marginTop: 20, fontSize: 13, color: C.inkSoft }}>
        すでにアカウントをお持ちの方は <a href="/login" style={{ color: C.curtain }}>ログイン</a>
      </p>
      <p style={{ marginTop: 32, fontSize: 11, color: C.inkSoft, lineHeight: 1.6 }}>
        登録すると <a href="/legal/terms" style={{ color: C.inkSoft }}>利用規約</a> と{" "}
        <a href="/legal/privacy" style={{ color: C.inkSoft }}>プライバシーポリシー</a> に同意したものとみなされます。
      </p>
    </main>
  );
}
