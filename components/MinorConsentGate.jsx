"use client";

import { C } from "@/lib/tokens";
// ★「記録は残る／書き出しは無料」の2行。★lib/freeTier.js が持ちます。
import { GATE_CLOSING_LINES } from "@/lib/freeTier";
import CheckoutButton from "@/components/CheckoutButton";
import { PLANS } from "@/lib/plans";
import {
  // ★★同意の申告に使っていたものは、★もう読みません（★案C・2026-09-07）。
  //   minorConsentCheckbox / minorConsentLines / MINOR_CONSENT_VERSION
  //   MINOR_NOTICE_LINE（★「保護者の方の同意が必要です」）
  AGE_BAND, offeredPlans
} from "@/lib/minorBilling";

// ============================================================================
// 未成年の方の、有料機能への同意（2026-09-04）
//
//   出どころ docs/opus/lavoce-判断-未成年に売ること（9月4日）.md §6
//            docs/opus/lavoce-判断-同意を前に出すこと（9月4日・追補）.md §5
//
//   ★★この画面は、取消権を封じません。
//     ★押すのは、結局その端末を持っている人です。★それは変えられません。
//     ★★変えられないことを前提に、★返金の約束で受けます。
//
//   ★★チェックの文は「認めます」です。「同意します」ではありません。
//     ★「契約に同意する」は民法5条1項。★あったことを★証明しなければ効きません。
//     ★「毎月◯◯円まで使ってよい」は民法5条3項の、
//       ★目的を定めた処分の許可です。★金額の上限が定まります。
//     ★★同じチェックで、当てはまる条文が変わります。
//
//   ★チェックは★初期状態でオフ。★既定でオンにしないこと。
//   ★★止めるのは画面だけではありません。
//     ★api/stripe/checkout も、年齢の帯で止めます。
//     ★ここは「伝える」ためのもので、★壁はサーバ側です。
//
//   ★★「法律で決まっているため」と書かないこと。
//     ★15〜17歳について、これは法律が求めているものではありません。
//     ★私たちの決まりです。
// ============================================================================

export default function MinorConsentGate({ band, userId }) {
  const plans = offeredPlans(band);

  // ★出せるプランが1つも無い方（15歳未満・帯が分からない方）。
  //   ★★ボタンを出しません。★押せないものを見せないこと。
  if (plans.length === 0) {
    // ★★2026-09-07、★案C。★18歳未満の方には、お売りしません。
    //   ★★年齢をまだ伺っていない方と、★18歳未満の方を、書き分けます。
    //     ★前者は、お答えいただけば進めます。★後者は、進めません。
    //     ★同じ文で済ませると、★どちらの方にも正しくありません。
    //   ★★「記録は、これまでどおり」を、必ず添えること。
    //     ★書かないと、★「使えなくなった」と読まれます。
    const notAnsweredYet = band !== AGE_BAND.TEEN && band !== AGE_BAND.UNDER_15;
    return (
      <div style={{ background: C.paper, borderRadius: 16, padding: 16 }}>
        {notAnsweredYet ? (
          <>
            <p style={{ fontSize: "0.875rem", color: C.ink, margin: 0, lineHeight: 1.8 }}>
              お申し込みの前に、年齢をお尋ねしています。
            </p>
            <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: 8, lineHeight: 1.8 }}>
              18歳以上の方に、有料の機能をお使いいただいています。
            </p>
          </>
        ) : (
          <>
            <p style={{ fontSize: "0.875rem", color: C.ink, margin: 0, lineHeight: 1.8 }}>
              18歳未満の方には、有料の機能をお売りしていません。
            </p>
            <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: 8, lineHeight: 1.8 }}>
              私たちの決まりとして、そうしています。
            </p>
          </>
        )}
        {/* ★★どちらの方にも、★これを添えます。★消えないことを、その場で言います。 */}
        <div style={{ marginTop: 12 }}>
          {GATE_CLOSING_LINES.map((line) => (
            <p key={line} style={{ fontSize: "0.8125rem", color: C.ink, margin: "0 0 4px", lineHeight: 1.8 }}>
              {line}
            </p>
          ))}
        </div>
      </div>
    );
  }

  // ★★同意の画面は、まるごとやめました（★案C・2026-09-07）。
  //   ★売らないので、★同意をいただく相手がいません。
  //   ★★「保護者の同意を得た」と申告していただく形も、やめました。
  //     ★得たかどうかを、★こちらは確かめられませんでした。
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      <PlanButtons plans={plans} />
    </div>
  );
}

// ★★同意の申告の一式を、まるごと外しました（★案C・2026-09-07）。
//   ・handleDeclare（minor_billing_consents への書き込み）
//   ・guardian_consent_declared_at のしるし
//   ・チェックボックスと、その文
//   ・「保護者の方の同意が必要です」の見出しと本文
//   ★★売らないので、★同意をいただく相手がいません。
//   ★★minor_billing_consents の行は、★消しません。★書くのをやめるだけです。
//     ★過去に申告してくださった記録です。★取り上げません。

function PlanButtons({ plans }) {
  // ★lib/plans.js の並びで出します。★ここで金額を書きません。
  return (
    <>
      {PLANS.filter((p) => plans.includes(p.key)).map((p) => (
        <CheckoutButton key={p.key} planKey={p.key}
          label={`${p.label}（${p.priceLabel}）でお申し込み`} />
      ))}
    </>
  );
}
