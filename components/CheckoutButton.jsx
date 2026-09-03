"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";

/**
 * @param planKey  "monthly" / "annual"（lib/plans.js の名前）
 * @param label    ボタンに出す文字
 *
 * ★プランごとに1つずつ置きます。★1つのボタンで切り替えません。
 *   ★どちらを押したかが、★押す前に見えているようにします。
 */
export default function CheckoutButton({ planKey = "monthly", label }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleClick() {
    setLoading(true);
    setError("");
    try {
      // ★どのプランかを、名前で送ります（2026-09-04）。
      //   ★★価格ID（price_…）を送らないこと。
      //     ★送ると、任意の価格で契約できてしまいます。
      //   ★引き当ては、サーバ側です。
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ plan: planKey })
      });
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
        {loading ? "処理中…" : (label || "お申し込みに進む")}
      </button>
      {error && <p style={{ color: C.curtain, fontSize: 13, marginTop: 8 }}>{error}</p>}
    </div>
  );
}
