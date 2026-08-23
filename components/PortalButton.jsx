"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";

export default function PortalButton() {
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    const res = await fetch("/api/stripe/portal", { method: "POST" });
    const data = await res.json();
    if (data.url) {
      window.location.href = data.url;
    } else {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      style={{
        padding: "11px 22px",
        borderRadius: 999,
        border: `1px solid ${C.line}`,
        background: "transparent",
        color: C.ink,
        fontWeight: 500,
        fontSize: 14
      }}
    >
      {loading ? "処理中…" : "お支払い情報・解約の管理"}
    </button>
  );
}
