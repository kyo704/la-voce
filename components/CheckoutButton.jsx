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
/**
 * ★返ってきた状態から、★お客さまに出す言葉を決めます。
 *
 *   ★★中の言葉（plan_not_available など）を、★そのまま出さないこと。
 *   ★★「エラー」で終わらせないこと。★することが分かる言葉にします。
 *   ★禁じた言い方（「できません」）を使わないこと（⑫・裁定 §6-5）。
 */
export function checkoutMessage(status, data) {
  const code = (data && data.error) || "";
  if (status === 401) return "もう一度お入りください。";
  if (status === 403 || code === "plan_not_available") {
    return "このお支払いの方法は、いまお選びいただけません。設定の年齢のご確認をお願いします。";
  }
  if (status === 503) {
    // ★★「できません」と書かないこと（⑫・裁定 §6-5）。★私が1度書きました。
    return "いま、お申し込みの窓口が開いていません。少し置いて、もう一度お試しください。";
  }
  if (status === 502) {
    return "お支払いの窓口につながりませんでした。少し置いて、もう一度お試しください。";
  }
  return "少し置いて、もう一度お試しください。";
}

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
      const data = await res.json().catch(() => ({}));
      if (data.url) {
        window.location.href = data.url;
        return;
      }
      // ★★2026-09-05、★理由を1つも残していませんでした。
      //   ★どの失敗でも、★同じ1文を出していました。
      //   ★★止めないことと、★黙ることは、★別です。
      //     ★黙ると、★なぜ進めないのかを、★誰も追えません。
      //   ★お客さまには、★することが分かる言葉を出します。
      //   ★私たちには、★console に、★状態と中身を残します。
      console.error("★お申し込みに進めませんでした:", res.status, JSON.stringify(data));
      setError(checkoutMessage(res.status, data));
      setLoading(false);
    } catch (e) {
      console.error("★お申し込みを送れませんでした:", e && e.message);
      setError("いま、つながりません。少し置いて、もう一度お試しください。");
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
          fontSize: "0.9375rem"
        }}
      >
        {loading ? "処理中…" : (label || "お申し込みに進む")}
      </button>
      {error && <p style={{ color: C.curtain, fontSize: "0.8125rem", marginTop: 8 }}>{error}</p>}
    </div>
  );
}
