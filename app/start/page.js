// 印刷用の「はじめかた」1枚（見やすさとかんたん表示.md §6）。
//
// ★紙を渡せることが、この層では効きます。
//   教室では、先生が最初のレッスンで一緒にやります。
//
// ★このページは、ログインを求めません。配る紙のための版下です。
// ★A4・縦。ブラウザの印刷（⌘P / Ctrl+P）でそのまま出ます。
import { C } from "@/lib/tokens";
import { INSTALL_STEPS } from "@/lib/displayPrefs";

export const metadata = { title: "La Voce のはじめかた" };

const SITE = process.env.NEXT_PUBLIC_SITE_URL || "https://la-voce.app";

export default function StartSheet() {
  return (
    <main style={{ background: "#FFFFFF", color: "#241914", padding: "16mm", maxWidth: "210mm", margin: "0 auto" }}>
      <style>{`
        @page { size: A4 portrait; margin: 0; }
        @media print { .no-print { display: none; } }
        ol { margin: 0; padding: 0; list-style: none; }
      `}</style>

      <h1 style={{ fontSize: "28pt", margin: 0, lineHeight: 1.3 }}>La Voce のはじめかた</h1>
      <p style={{ fontSize: "13pt", marginTop: "4mm", lineHeight: 1.7 }}>
        スマートフォンのホーム画面に置いておくと、次からは1回押すだけで開けます。
      </p>

      {/* ★住所は大きく。打ち間違えないように、区切って読める大きさで出す。 */}
      <div style={{ border: `2px solid ${C.line}`, borderRadius: 8, padding: "8mm", marginTop: "8mm", textAlign: "center" }}>
        <p style={{ fontSize: "11pt", margin: 0, color: "#6b5d52" }}>この住所を開いてください</p>
        <p style={{ fontSize: "20pt", margin: "3mm 0 0", wordBreak: "break-all", fontWeight: 600 }}>{SITE}</p>
        {/* ★QRコードは、まだ入れていません。作り方は下の注記のとおりです。
            間違ったQRを印刷して配ると、いちばん困るのは受け取った人なので、
            読み取りを確かめてから入れます。 */}
        <div style={{
          width: "45mm", height: "45mm", margin: "6mm auto 0",
          border: `1px dashed ${C.line}`, borderRadius: 8,
          display: "flex", alignItems: "center", justifyContent: "center"
        }}>
          <span style={{ fontSize: "9pt", color: "#6b5d52" }}>QRコードを貼る場所</span>
        </div>
      </div>

      <Steps title="iPhone・iPad をお使いの方" steps={INSTALL_STEPS.ios} />
      <Steps title="Android をお使いの方" steps={INSTALL_STEPS.android} />

      <p style={{ fontSize: "11pt", marginTop: "8mm", lineHeight: 1.8, color: "#6b5d52" }}>
        ※ ホーム画面に置かなくても、ブラウザのままで全部お使いいただけます。
        うまくいかないときは、次のレッスンで一緒にやりましょう。
      </p>

      <p className="no-print" style={{ marginTop: "10mm", fontSize: "10pt", color: "#6b5d52" }}>
        （この画面は印刷用です。ブラウザの印刷から、A4・縦で出してください。）
      </p>
    </main>
  );
}

function Steps({ title, steps }) {
  return (
    <section style={{ marginTop: "8mm" }}>
      <h2 style={{ fontSize: "15pt", margin: 0, borderBottom: `1px solid ${C.line}`, paddingBottom: "2mm" }}>{title}</h2>
      <ol style={{ marginTop: "4mm" }}>
        {steps.map((s, i) => (
          <li key={i} style={{ display: "flex", gap: "5mm", fontSize: "13pt", lineHeight: 1.8, marginBottom: "2mm" }}>
            <span style={{ fontWeight: 700, minWidth: "6mm" }}>{i + 1}</span>
            <span>{s}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
