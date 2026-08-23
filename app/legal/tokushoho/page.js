import { C } from "@/lib/tokens";

const rows = [
  ["販売事業者", "［氏名または名称を記入］"],
  ["運営統括責任者", "［氏名を記入］"],
  ["所在地", "［請求があった場合には遅滞なく開示します／住所を記入］"],
  ["連絡先", "［メールアドレスまたは電話番号を記入。請求があれば遅滞なく開示する形でも可］"],
  ["販売価格", "月額［金額］円（税込）"],
  ["商品代金以外の必要料金", "インターネット接続料金等はお客様のご負担となります。"],
  ["お支払い方法", "クレジットカード決済（Stripe社を通じて処理されます）"],
  ["お支払い時期", "無料お試し期間終了後、初回課金。以降は毎月同日に自動課金されます。"],
  ["サービス提供時期", "決済手続き完了後、直ちにご利用いただけます。"],
  ["返品・キャンセルについて", "デジタルサービスの性質上、課金後の返金は原則行いません。解約はいつでもマイページの「お支払い情報・解約の管理」から可能で、次回更新日の前までに解約すれば、以降の課金は発生しません。"]
];

export default function TokushohoPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px" }}>
      <h1 className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain, marginBottom: 8 }}>
        特定商取引法に基づく表記
      </h1>
      <p style={{ fontSize: 12, color: C.inkSoft, marginBottom: 24 }}>
        ※ これは草案テンプレートです。内容は法律の専門家に確認のうえ、実情に合わせて書き換えてください。
      </p>
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
        <tbody>
          {rows.map(([label, value]) => (
            <tr key={label} style={{ borderBottom: `1px solid ${C.line}` }}>
              <th style={{ textAlign: "left", padding: "12px 12px 12px 0", width: "35%", verticalAlign: "top", color: C.inkSoft, fontWeight: 500 }}>
                {label}
              </th>
              <td style={{ padding: "12px 0", verticalAlign: "top" }}>{value}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
