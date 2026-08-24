import { C } from "@/lib/tokens";

export default function PrivacyPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px", lineHeight: 1.8, fontSize: 14 }}>
      <h1 className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain, marginBottom: 8 }}>
        プライバシーポリシー
      </h1>

      <div style={{ background: C.card, border: `1.5px solid ${C.sage}`, borderRadius: 16, padding: "20px 22px", marginBottom: 24 }}>
        <p style={{ fontWeight: 600, color: C.sage, marginBottom: 8, fontSize: 15 }}>
          🔒 あなたの体調・声の記録は、広告や販売、第三者への提供のために使われることは絶対にありません。
        </p>
        <p style={{ color: C.inkSoft, fontSize: 13 }}>
          入力していただいた情報は、あなた自身に分析結果やグラフを表示するためだけに使われます。
          データベース（Supabase社）や決済（Stripe社）などサービス運営に必要な委託先を除き、
          法令に基づく場合を除いて、本人の同意なく外部に提供・販売することはありません。
          詳しくは下記「3. 第三者提供・委託」をご覧ください。
        </p>
      </div>

      <p style={{ fontSize: 12, color: C.inkSoft, marginBottom: 24 }}>
        ※ これは草案テンプレートです。実際の運用・第三者サービスの利用状況に合わせて内容を見直し、必要に応じて専門家にご確認ください。
      </p>

      <h2 style={{ fontWeight: 600, marginTop: 24 }}>1. 取得する情報</h2>
      <p>
        本サービス（以下「本サービス」）は、会員登録の際に氏名・メールアドレス・生年月日を取得します。
        また、サービス利用時に入力される体調・声のコンディション等の記録データ、決済のためにStripe社が処理する
        お支払い情報（カード番号自体は本サービスのサーバーには保存されません）を取り扱います。
      </p>

      <h2 style={{ fontWeight: 600, marginTop: 24 }}>2. 利用目的</h2>
      <p>取得した情報は、本サービスの提供・本人確認・お問い合わせ対応・料金の請求・サービス改善のために利用します。</p>

      <h2 style={{ fontWeight: 600, marginTop: 24 }}>3. 第三者提供・委託</h2>
      <p>
        本サービスは、データベースおよび認証基盤としてSupabase社、決済処理としてStripe社のサービスを利用しています。
        これらの委託先には、業務遂行に必要な範囲でのみ情報を提供します。法令に基づく場合を除き、
        本人の同意なく第三者に個人情報を提供することはありません。広告目的での第三者提供・データ販売は一切行いません。
      </p>

      <h2 style={{ fontWeight: 600, marginTop: 24 }}>4. データの保存期間・削除</h2>
      <p>
        利用者のデータは、アカウントが有効な間保存されます。アカウント削除のご希望は［連絡先］までお問い合わせください。
      </p>

      <h2 style={{ fontWeight: 600, marginTop: 24 }}>5. 開示・訂正・削除の請求</h2>
      <p>
        利用者は、自己の個人情報について開示・訂正・削除を求めることができます。［連絡先］までご連絡ください。
      </p>

      <h2 style={{ fontWeight: 600, marginTop: 24 }}>6. お問い合わせ窓口</h2>
      <p>［事業者名／連絡先メールアドレスを記入］</p>

      <p style={{ marginTop: 24, color: C.inkSoft }}>制定日：［日付］</p>
    </main>
  );
}
