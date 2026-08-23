import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isNativeApp } from "@/lib/isNativeApp";
import { C } from "@/lib/tokens";

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const nativeApp = isNativeApp();

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: 24
      }}
    >
      <h1 className="ff-display italic" style={{ fontSize: "3.5rem", color: C.curtain }}>
        La Voce
      </h1>
      <p style={{ color: C.inkSoft, maxWidth: 480, marginTop: 12, lineHeight: 1.7 }}>
        声楽家のための体調記録アプリ。喉・声のコンディション、睡眠、気候、公演の出来まで、
        日々の記録から自分だけの傾向を見つけましょう。
      </p>
      <p style={{ color: C.gold, fontSize: 13, marginTop: 10, fontWeight: 500 }}>
        現在、実験公開期間中につき無料でご利用いただけます
      </p>
      <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
        {!nativeApp && (
          <a
            href="/signup"
            style={{
              padding: "13px 28px",
              borderRadius: 999,
              background: C.curtain,
              color: "#fff",
              fontWeight: 600,
              textDecoration: "none"
            }}
          >
            無料で始める
          </a>
        )}
        <a
          href="/login"
          style={{
            padding: "13px 28px",
            borderRadius: 999,
            border: `1px solid ${C.line}`,
            color: C.ink,
            textDecoration: "none"
          }}
        >
          ログイン
        </a>
      </div>
      {nativeApp && (
        <p style={{ marginTop: 20, fontSize: 12, color: C.inkSoft, maxWidth: 320, lineHeight: 1.7 }}>
          アカウントをお持ちでない方は、ウェブサイトからご登録のうえ、こちらのアプリでログインしてください。
        </p>
      )}
      <p style={{ marginTop: 40, fontSize: 12, color: C.inkSoft }}>
        <a href="/legal/tokushoho" style={{ color: C.inkSoft, marginRight: 12 }}>特定商取引法に基づく表記</a>
        <a href="/legal/privacy" style={{ color: C.inkSoft, marginRight: 12 }}>プライバシーポリシー</a>
        <a href="/legal/terms" style={{ color: C.inkSoft }}>利用規約</a>
      </p>
    </main>
  );
}

