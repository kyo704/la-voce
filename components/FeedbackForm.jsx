"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";

const CATEGORIES = ["バグ報告", "機能のご要望", "その他"];

export default function FeedbackForm({ userEmail }) {
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setStatus("sending");
    setError("");
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ category, message })
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "送信に失敗しました。");
        setStatus("idle");
        return;
      }
      setStatus("done");
    } catch (e) {
      setError("送信に失敗しました。時間をおいて再度お試しください。");
      setStatus("idle");
    }
  }

  if (status === "done") {
    return (
      <div style={{ padding: 16, borderRadius: 14, border: `1px solid ${C.line}`, background: C.card }}>
        <p style={{ fontSize: 14 }}>送信しました。ありがとうございます。</p>
        <button
          onClick={() => { setMessage(""); setStatus("idle"); }}
          style={{ marginTop: 12, fontSize: 13, color: C.curtain, background: "none", border: "none", padding: 0 }}
        >
          もう1件送る
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <label style={{ fontSize: 13, color: C.inkSoft, display: "block", marginBottom: 6 }}>種類</label>
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 14, background: C.card, color: C.ink }}
        >
          {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>
      <div>
        <label style={{ fontSize: 13, color: C.inkSoft, display: "block", marginBottom: 6 }}>内容</label>
        <textarea
          required
          rows={6}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="不具合の内容や、あったらいいなと思う機能について、できるだけ具体的に書いてください。"
          style={{ width: "100%", padding: "10px 12px", borderRadius: 10, border: `1px solid ${C.line}`, fontSize: 14, background: C.card, color: C.ink, resize: "vertical" }}
        />
      </div>
      {error && <p style={{ color: C.curtain, fontSize: 13 }}>{error}</p>}
      <button
        type="submit"
        disabled={status === "sending"}
        style={{ padding: "13px", borderRadius: 12, border: "none", background: C.curtain, color: "#fff", fontWeight: 600, fontSize: 15 }}
      >
        {status === "sending" ? "送信中…" : "送信する"}
      </button>
      <p style={{ fontSize: 11, color: C.inkSoft, lineHeight: 1.6 }}>
        送信すると、アカウントのメールアドレス（{userEmail}）が開発者に共有されます。個別の返信ができない場合がありますが、内容には全て目を通します。
      </p>
    </form>
  );
}
