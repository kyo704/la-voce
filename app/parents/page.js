import { C } from "@/lib/tokens";
import { PLANS } from "@/lib/plans";
import { REFUND_PROMISE } from "@/lib/minorBilling";

// ============================================================================
// 保護者の方へ（2026-09-04）
//
//   出どころ docs/opus/lavoce-判断-未成年に売ること（9月4日）.md §7
//
//   ★★これは、★見せるだけのページです。★フォームにしないこと。
//     ★同意のボタンも、入力欄も、置きません。
//     ★★置くと、★保護者の個人データを持つことになります。
//       ★開示・削除・漏えい報告の対象が増えます。
//       ★台帳05（外に出る経路）にも、行が増えます。
//     ★そして★証拠としては強くなりません。
//       ★お子さまが2つ目のアドレスを入れれば、それで通ります。
//
//   ★メールも送りません。★URL を1つ置くだけです。
//     ★お子さまが、保護者の方に★見せられるものです。
//
//   ★書くこと（§7）
//     ・これは何のアプリか ・いくらか ・どうやめるか
//     ・返金の約束 ・連絡先
//
//   ★文言の正は lib/minorBilling.js と lib/plans.js です。
//     ★ここに数字を直書きしないこと。★片方だけが古くなります。
// ============================================================================

export const metadata = {
  title: "保護者の方へ｜Woolsong"
};

export default function ParentsPage() {
  const monthly = PLANS.find((p) => p.key === "monthly");

  return (
    <main className="legal-doc" style={{ margin: "0 auto", padding: "56px 24px 96px", color: C.ink }}>
      <h1 className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain, marginBottom: 24 }}>
        保護者の方へ
      </h1>

      <p>このアプリを、お子さまがお使いになります。</p>

      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>どんなアプリですか</h2>
      <p>
        声を使う方が、体調と、声の使い方を記録するためのアプリです。
        睡眠、のどの調子、声を使った時間などを、ご本人が毎日書き留めます。
      </p>

      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>記録するもの</h2>
      <div style={{ margin: "8px 0 16px", paddingLeft: 14, borderLeft: `2px solid ${C.line}` }}>
        <p style={{ margin: "2px 0" }}>睡眠時間</p>
        <p style={{ margin: "2px 0" }}>のどの調子</p>
        <p style={{ margin: "2px 0" }}>声を使った時間</p>
        <p style={{ margin: "2px 0" }}>その日の活動</p>
      </div>
      <p>
        記録は、お子さまご本人のものです。
        本サービスは、保護者の方が記録をご覧になる機能を持ちません。
        教室の先生がご覧になる機能も、持ちません。
      </p>

      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>お支払い</h2>
      <p>毎月{monthly ? monthly.priceYen : "◯◯"}円です。年ごとのお支払いはありません。</p>

      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>やめ方</h2>
      <p>アプリの中から、いつでもやめられます。「もっと ＞ ご利用プラン」からお手続きいただけます。</p>

      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>返金について</h2>
      <p>{REFUND_PROMISE}</p>

      <h2 style={{ fontWeight: 600, marginTop: 28, marginBottom: 8 }}>お問い合わせ</h2>
      <p>woolsong.app@gmail.com</p>

      <hr style={{ border: 0, borderTop: `1px solid ${C.line}`, margin: "28px 0" }} />
      <p style={{ fontSize: 13, color: C.inkSoft }}>
        このページは、ご説明のためのものです。ここでお手続きいただくことはありません。
      </p>
    </main>
  );
}
