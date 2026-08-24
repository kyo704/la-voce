import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isNativeApp } from "@/lib/isNativeApp";
import { C } from "@/lib/tokens";

function StaffPulseHero() {
  return (
    <svg viewBox="0 0 640 160" style={{ width: "100%", maxWidth: 560, height: "auto" }}>
      {/* 五線譜 */}
      {[0, 1, 2, 3, 4].map((i) => (
        <line key={i} x1="10" y1={40 + i * 20} x2="630" y2={40 + i * 20} stroke={C.line} strokeWidth="1.5" />
      ))}
      {/* 心拍・記録データのライン（五線の中を通り抜けていく） */}
      <path
        d="M10,80 L160,80 L180,30 L200,130 L220,50 L240,80 L340,80 L360,45 L380,115 L400,80 L630,80"
        fill="none"
        stroke={C.curtain}
        strokeWidth="3"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* ト音記号風の飾り（簡略） */}
      <path
        d="M56,20 Q40,20 40,38 Q40,56 58,58 Q76,60 76,42 Q76,28 62,28 Q52,28 52,40 L52,90 Q52,102 42,102 Q34,102 34,94"
        fill="none"
        stroke={C.gold}
        strokeWidth="3.5"
        strokeLinecap="round"
      />
      {/* データポイント */}
      {[[180, 30], [220, 50], [360, 45], [400, 80]].map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="4" fill={C.gold} stroke={C.card} strokeWidth="1.5" />
      ))}
    </svg>
  );
}

function FeatureCard({ title, desc, accent }) {
  return (
    <div
      style={{
        background: C.card,
        border: `1px solid ${C.line}`,
        borderRadius: 16,
        padding: "22px 20px",
        textAlign: "left",
        flex: "1 1 220px",
        minWidth: 220
      }}
    >
      <div style={{ width: 32, height: 3, background: accent, borderRadius: 2, marginBottom: 14 }} />
      <h3 className="ff-display italic" style={{ fontSize: "1.2rem", color: C.ink, margin: "0 0 6px" }}>
        {title}
      </h3>
      <p style={{ color: C.inkSoft, fontSize: 13.5, lineHeight: 1.7, margin: 0 }}>{desc}</p>
    </div>
  );
}

export default async function LandingPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const nativeApp = isNativeApp();

  return (
    <main style={{ minHeight: "100vh" }}>
      {/* ヒーロー */}
      <section style={{ display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", padding: "72px 24px 40px" }}>
        <p style={{ color: C.gold, fontSize: 12.5, letterSpacing: "0.14em", fontWeight: 600, marginBottom: 10 }}>
          VOICE HEALTH JOURNAL FOR SINGERS
        </p>
        <h1 className="ff-display italic" style={{ fontSize: "3.4rem", color: C.curtain, margin: 0, lineHeight: 1.15 }}>
          La Voce
        </h1>
        <p style={{ color: C.ink, maxWidth: 520, marginTop: 18, lineHeight: 1.85, fontSize: 15.5 }}>
          声楽家にとって、楽器は自分自身の身体です。
          <br />
          けれど多くの人は、その楽器の調子を「なんとなく」でしか把握していません。
        </p>

        <div style={{ margin: "36px 0 8px" }}>
          <StaffPulseHero />
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 28, flexWrap: "wrap", justifyContent: "center" }}>
          {!nativeApp && (
            <a
              href="/signup"
              style={{
                padding: "14px 32px",
                borderRadius: 999,
                background: C.curtain,
                color: "#fff",
                fontWeight: 600,
                textDecoration: "none",
                boxShadow: "0 8px 20px rgba(122,31,43,0.25)"
              }}
            >
              無料で始める
            </a>
          )}
          <a
            href="/login"
            style={{
              padding: "14px 32px",
              borderRadius: 999,
              border: `1px solid ${C.line}`,
              color: C.ink,
              textDecoration: "none",
              background: C.card
            }}
          >
            ログイン
          </a>
        </div>
        <p style={{ color: C.gold, fontSize: 12.5, marginTop: 16, fontWeight: 500 }}>
          現在、実験公開期間中につき無料でご利用いただけます
        </p>
      </section>

      {/* なぜ生まれたか */}
      <section style={{ maxWidth: 640, margin: "0 auto", padding: "24px 24px 56px", textAlign: "center" }}>
        <h2 className="ff-display italic" style={{ fontSize: "1.9rem", color: C.ink, marginBottom: 18 }}>
          なぜ、このアプリは生まれたか
        </h2>
        <p style={{ color: C.inkSoft, lineHeight: 1.9, fontSize: 14.5, textAlign: "left" }}>
          睡眠が浅かった翌朝、声の出だしが重い。夕食の時間が遅かった日、なぜか喉がイガイガする。
          本番前日の過ごし方で、翌日の響きがまるで違う——声楽家なら誰もが、経験として知っていることです。
          <br />
          <br />
          けれど「経験として知っている」ことと「記録として持っている」ことの間には、大きな差があります。
          スポーツ選手が体調やトレーニングを細かく記録するように、声を仕事にする人にも、
          自分の身体という楽器と向き合うための場所が必要なのではないか——La Voce は、その問いから生まれました。
          <br />
          <br />
          睡眠、水分、食事とその時刻、当日の気候、そして声そのものの調子。
          バラバラに感じていたものを一つの記録としてつなげたとき、
          はじめて見えてくる「自分だけの傾向」があります。
        </p>
      </section>

      {/* 何ができるか */}
      <section style={{ maxWidth: 780, margin: "0 auto", padding: "0 24px 64px" }}>
        <div style={{ display: "flex", gap: 16, flexWrap: "wrap", justifyContent: "center" }}>
          <FeatureCard
            accent={C.curtain}
            title="声・喉のコンディション"
            desc="起き抜けと発声後の声の高さ、響きのスコア、喉の症状まで。日々の変化を数値と記録の両方で追えます。"
          />
          <FeatureCard
            accent={C.sage}
            title="睡眠・食事とのつながり"
            desc="夕食の時刻と就寝までの間隔、水分、栄養バランス。前日の過ごし方が今日の声にどうつながるかを可視化します。"
          />
          <FeatureCard
            accent={C.gold}
            title="自分だけの分析"
            desc="記録が増えるほど、あなたの声にとって本当に大切な習慣が見えてきます。グラフと相関分析で、感覚を裏付けます。"
          />
        </div>
      </section>

      {nativeApp && (
        <p style={{ textAlign: "center", fontSize: 12, color: C.inkSoft, maxWidth: 320, lineHeight: 1.7, margin: "0 auto 40px" }}>
          アカウントをお持ちでない方は、ウェブサイトからご登録のうえ、こちらのアプリでログインしてください。
        </p>
      )}

      <p style={{ textAlign: "center", padding: "0 24px 40px", fontSize: 12, color: C.inkSoft }}>
        <a href="/legal/tokushoho" style={{ color: C.inkSoft, marginRight: 12 }}>特定商取引法に基づく表記</a>
        <a href="/legal/privacy" style={{ color: C.inkSoft, marginRight: 12 }}>プライバシーポリシー</a>
        <a href="/legal/terms" style={{ color: C.inkSoft }}>利用規約</a>
      </p>
    </main>
  );
}
