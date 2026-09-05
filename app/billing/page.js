import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isNativeApp } from "@/lib/isNativeApp";
import { C } from "@/lib/tokens";
import MinorConsentGate from "@/components/MinorConsentGate";
// ★★無料と有料の線（⑫）。★何が無料で、何が有料かは、★lib/freeTier.js が持ちます。
//   ★この画面で並べ直さないこと。★2か所になります。
import {
  PAID_GATE_ENABLED, GATE_STARTS_AT, PAID_FEATURES, NEVER_PAID,
  featureLabel, GATE_CLOSING_LINES
} from "@/lib/freeTier";
import { ageBandOf } from "@/lib/ageGate";
import PortalButton from "@/components/PortalButton";
import { getUserWithTimeout } from "@/lib/withTimeout";
import ConnectionError from "@/components/ConnectionError";

function formatDate(iso) {
  if (!iso) return "";
  const d = new Date(iso);
  return `${d.getFullYear()}年${d.getMonth() + 1}月${d.getDate()}日`;
}

export default async function BillingPage() {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "お支払い画面の認証確認");
  if (unreachable) return <ConnectionError detail="認証の確認がタイムアウトしました" />;
  if (!user) redirect("/login");

  const requireSubscription = process.env.REQUIRE_SUBSCRIPTION === "true";

  // ★年齢の帯を、ここで読みます（2026-09-04）。
  //   ★★読めなかったときは、★帯が分からない扱いになります。
  //     ★ageBandOf(null) は unknownMinor を返します。★売りません。
  //     ★フェイルクローズ。★読めないことを、大人と同じにしません。
  const { data: profForBand } = await supabase
    .from("profiles").select("age_band, is_under_18").eq("id", user.id).single();
  const band = ageBandOf(profForBand);

  // ★★門が開いているときの画面（⑫・2026-09-05）。
  //
  //   ★★REQUIRE_SUBSCRIPTION とは、★別の決めです。★混ぜないこと。
  //     REQUIRE_SUBSCRIPTION … ★払わないと、アプリそのものが使えない（★休止中）
  //     PAID_GATE_ENABLED    … ★アプリは無料。★まとめだけが有料（★⑫）
  //
  //   ★門から「くわしく見る」で来た方が、★ここに着きます。
  //     ★★噛み合わない画面を出さないこと。★買えない画面に着かせないこと。
  const paidGateOpen = PAID_GATE_ENABLED && !!GATE_STARTS_AT;
  if (!requireSubscription && paidGateOpen) {
    return (
      <main style={{ maxWidth: 480, margin: "0 auto", padding: "56px 24px 96px" }}>
        <h1 className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain }}>
          ご利用プラン
        </h1>

        {/* ★★先に「無料のもの」を出します。
            ★あとで「増えるもの」を出します。
            ★順番を逆にすると、★取り上げられたように読めます。 */}
        <div style={{
          marginTop: 24, padding: 16, borderRadius: 14,
          border: `1px solid ${C.line}`, background: C.card
        }}>
          <p style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 10 }}>
            ずっと無料でお使いいただけるもの
          </p>
          {NEVER_PAID.map((k) => (
            <p key={k} style={{ fontSize: "0.9375rem", color: C.ink, margin: "0 0 6px", lineHeight: 1.8 }}>
              ・{featureLabel(k)}
            </p>
          ))}
        </div>

        <div style={{
          marginTop: 16, padding: 16, borderRadius: 14,
          border: `1px solid ${C.line}`, background: C.card
        }}>
          <p style={{ fontSize: "1rem", fontWeight: 600, marginBottom: 10 }}>
            月580円でご覧いただけるもの
          </p>
          {PAID_FEATURES.map((k) => (
            <p key={k} style={{ fontSize: "0.9375rem", color: C.ink, margin: "0 0 6px", lineHeight: 1.8 }}>
              ・{featureLabel(k)}
            </p>
          ))}
        </div>

        {/* ★★この2行を、必ず添えること。★消えないことを、その場で言います。 */}
        <div style={{ marginTop: 16, padding: 14, borderRadius: 12, background: C.paper }}>
          {GATE_CLOSING_LINES.map((line) => (
            <p key={line} style={{ fontSize: "0.9375rem", color: C.ink, margin: "0 0 4px", lineHeight: 1.8 }}>
              {line}
            </p>
          ))}
        </div>

        {/* ★年齢の帯で、出すものが変わります。★門は MinorConsentGate が持ちます。
            ★★画面で隠すだけにしないこと。★api/stripe/checkout も同じ帯で止めます。 */}
        <div style={{ marginTop: 24 }}>
          <MinorConsentGate band={band} userId={user.id} />
        </div>
      </main>
    );
  }

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
          {/* ★ここが、実際に見えている文です（2026-09-03）。
              REQUIRE_SUBSCRIPTION が有効でないので、この return より下へは進みません。
              ★私は最初、下のほうの文だけを直しました。あちらは誰にも見えません。 */}
          <p style={{ fontSize: "0.875rem" }}>
            いまは、<strong>すべての機能を無料</strong>でお使いいただけます。
          </p>
          <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: 8, lineHeight: 1.7 }}>
            有料の提供は、まだ始まっていません。
            自動的に有料に切り替わることはありません。
            有料の提供を始めるときは、事前にお知らせします。
            それまでにお預かりした記録は、そのまま残ります。
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
            <p style={{ fontSize: "0.875rem" }}>
              現在のステータス:{" "}
              <strong>{sub.status === "trialing" ? "無料お試し期間中" : "ご契約中"}</strong>
            </p>
            {sub.status === "trialing" && sub.trial_end && (
              <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: 6 }}>
                お試し期間終了日: {formatDate(sub.trial_end)}（終了後、自動的に有料プランへ移行します）
              </p>
            )}
            {sub.status === "active" && sub.current_period_end && (
              <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: 6 }}>
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
            いまは、すべての機能を無料でお使いいただけます。
            <br /><br />
            有料の提供は、まだ始まっていません。
            自動的に有料に切り替わることはありません。
            有料の提供を始めるときは、事前にお知らせします。
            それまでにお預かりした記録は、そのまま残ります。
          </p>
          {/* ★年齢の帯で、出すものが変わります（2026-09-04）。
              ★18歳以上   … プランのボタンだけ
              ★15〜17歳   … ★同意の画面を先に。押してから、月額だけ
              ★15歳未満・帯が分からない方 … ★ボタンを出しません
              ★★止めるのは画面だけではありません。
                ★api/stripe/checkout も、同じ帯で止めます。
                ★★画面で隠すだけにしないこと。★API を直に叩かれます。
              ★常設の1行（§8）も、この部品が出します。 */}
          <MinorConsentGate band={band} userId={user.id} />
        </div>
      )}
    </main>
  );
}
