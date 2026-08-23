import { C } from "@/lib/tokens";

export default function TermsPage() {
  return (
    <main style={{ maxWidth: 640, margin: "0 auto", padding: "64px 24px", lineHeight: 1.8, fontSize: 14 }}>
      <h1 className="ff-display italic" style={{ fontSize: "2rem", color: C.curtain, marginBottom: 8 }}>
        利用規約
      </h1>
      <p style={{ fontSize: 12, color: C.inkSoft, marginBottom: 24 }}>
        ※ これは草案テンプレートです。実際の運用に合わせて内容を見直し、必要に応じて専門家にご確認ください。
      </p>

      <h2 style={{ fontWeight: 600, marginTop: 24 }}>第1条（適用）</h2>
      <p>本規約は、［事業者名］（以下「当方」）が提供する「La Voce」（以下「本サービス」）の利用条件を定めるものです。</p>

      <h2 style={{ fontWeight: 600, marginTop: 24 }}>第2条（登録）</h2>
      <p>利用希望者は、氏名・メールアドレス・生年月日等の必要事項を届け出て、当方所定の方法によって利用登録を申請します。</p>

      <h2 style={{ fontWeight: 600, marginTop: 24 }}>第3条（料金及び支払方法）</h2>
      <p>
        本サービスは無料お試し期間終了後、月額料金が発生する有料サービスです。利用者は、当方が指定する決済代行会社（Stripe）を通じて、
        利用料金をクレジットカードにより支払うものとします。解約手続きが行われない限り、契約は自動的に更新されます。
      </p>

      <h2 style={{ fontWeight: 600, marginTop: 24 }}>第4条（解約）</h2>
      <p>利用者は、いつでもマイページから解約手続きを行うことができます。解約時点までの利用料金は返金されません。</p>

      <h2 style={{ fontWeight: 600, marginTop: 24 }}>第5条（禁止事項）</h2>
      <p>利用者は、法令または公序良俗に違反する行為、本サービスの運営を妨害する行為等を行ってはなりません。</p>

      <h2 style={{ fontWeight: 600, marginTop: 24 }}>第6条（免責事項）</h2>
      <p>
        本サービスは体調管理の記録・分析を補助するものであり、医学的な診断・助言を提供するものではありません。
        健康上の懸念がある場合は、医療専門家にご相談ください。当方は、本サービスの利用により生じた損害について、
        当方の故意または重過失による場合を除き、責任を負わないものとします。
      </p>

      <h2 style={{ fontWeight: 600, marginTop: 24 }}>第7条（規約の変更）</h2>
      <p>当方は、必要と判断した場合には、利用者への通知をもって本規約を変更できるものとします。</p>

      <p style={{ marginTop: 24, color: C.inkSoft }}>制定日：［日付］</p>
    </main>
  );
}
