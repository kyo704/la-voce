import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isNativeApp } from "@/lib/isNativeApp";
import { C } from "@/lib/tokens";
import CheckoutButton from "@/components/CheckoutButton";
import PortalButton from "@/components/PortalButton";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default async function BillingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const requireSubscription = process.env.REQUIRE_SUBSCRIPTION === "true";

  // 実験公開期間中（無料開放中）は課金導線を出さず、案内のみ表示する
  if (!requireSubscription) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "64px 24px" }}>
        <h1 className="ff-display italic" style={{ fontSize: "2.5rem", color: C.curtain }}>
          ご利用プラン
        </h1>
        <div
          style={{
            marginTop: 24,
            padding: 16,
            borderRadius: 14,
            border: `1px solid ${C.line}`,
            background: C.card
          }}
        >
          <p style={{ fontSize: 14 }}>
            現在、<strong>実験公開期間中につき、すべての機能を無料</strong>でご利用いただけます。
          </p>
          <p style={{ fontSize: 13, color: C.inkSoft, marginTop: 8, lineHeight: 1.7 }}>
            クレジットカードの登録は不要です。今後、機能や料金プランを変更する場合はメールでお知らせします。
          </p>
        </div>
        <a
          href="/dashboard"
          style={{
            display: "inline-block",
            marginTop: 20,
            padding: "13px 28px",
            borderRadius: 999,
            background: C.curtain,
            color: "#fff",
            fontWeight: 600,
            textDecoration: "none"
          }}
        >
          アプリを開く
        </a>
      </main>
    );
  }

  // ここから下は REQUIRE_SUBSCRIPTION=true（有料化する場合）の従来ロジック
  const { data: sub } = await supabase
    .from("subscriptions")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const active = sub && (sub.status === "trialing" || sub.status === "active");
  const nativeApp = isNativeApp();

  return (
    <main style={{ maxWidth: 480, margin: "0 auto", padding: "64px 24px" }}>
      <h1 className="ff-display italic" style={{ fontSize: "2.5rem", color: C.curtain }}>
        ご利用プラン
      </h1>

      {active ? (
        <div style={{ marginTop: 24 }}>
          <div
            style={{
              padding: 16,
              borderRadius: 14,
              border: `1px solid ${C.line}`,
              background: C.card,
              marginBottom: 20
            }}
          >
            <p style={{ fontSize: 14 }}>
              現在のステータス:{" "}
              <strong>{sub.status === "trialing" ? "無料お試し期間中" : "ご契約中"}</strong>
            </p>
            {sub.status === "trialing" && sub.trial_end && (
              <p style={{ fontSize: 13, color: C.inkSoft, marginTop: 6 }}>
                お試し期間終了日: {formatDate(sub.trial_end)}（終了後、自動的に有料プランへ移行します）
              </p>
            )}
            {sub.status === "active" && sub.current_period_end && (
              <p style={{ fontSize: 13, color: C.inkSoft, marginTop: 6 }}>
                次回更新日: {formatDate(sub.current_period_end)}
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <a
              href="/dashboard"
              style={{
                padding: "13px 28px",
                borderRadius: 999,
                background: C.curtain,
                color: "#fff",
                fontWeight: 600,
                textDecoration: "none"
              }}
            >
              アプリを開く
            </a>
            <PortalButton />
          </div>
        </div>
      ) : nativeApp ? (
        <div style={{ marginTop: 24 }}>
          <p style={{ color: C.inkSoft, lineHeight: 1.7 }}>
            このアプリのご利用には、有効なアカウントが必要です。ウェブサイトでご登録のうえ、
            このアプリで改めてログインしてください。
          </p>
        </div>
      ) : (
        <div style={{ marginTop: 24 }}>
          <p style={{ color: C.inkSoft, lineHeight: 1.7, marginBottom: 24 }}>
            14日間無料でお試しいただけます。お試し期間終了後は月額プランに自動移行しますが、
            期間中・期間後もいつでも解約いただけます。
          </p>
          <CheckoutButton />
        </div>
      )}
    </main>
  );
}
