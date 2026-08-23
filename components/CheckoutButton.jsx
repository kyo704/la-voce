"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";

export default function CheckoutButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/stripe/checkout", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setError("エラーが発生しました。時間をおいて再度お試しください。");
        setLoading(false);
      }
    } catch (e) {
      setError("エラーが発生しました。時間をおいて再度お試しください。");
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleClick}
        disabled={loading}
        style={{
          padding: "13px 28px",
          borderRadius: 999,
          border: "none",
          background: C.curtain,
          color: "#fff",
          fontWeight: 600,
          fontSize: 15
        }}
      >
        {loading ? "処理中…" : "14日間無料でお試しを始める"}
      </button>
      {error && <p style={{ color: C.curtain, fontSize: 13, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
