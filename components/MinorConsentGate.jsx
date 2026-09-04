"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import CheckoutButton from "@/components/CheckoutButton";
import { PLANS } from "@/lib/plans";
import {
  AGE_BAND, offeredPlans, needsMinorConsentScreen,
  minorConsentCheckbox, minorConsentLines,
  MINOR_CONSENT_VERSION, MINOR_NOTICE_LINE
} from "@/lib/minorBilling";
import { createClient } from "@/lib/supabase/client";

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
  const [checked, setChecked] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [declared, setDeclared] = useState(false);

  // ★出せるプランが1つも無い方（15歳未満・帯が分からない方）。
  //   ★★ボタンを出しません。★押せないものを見せないこと。
  if (plans.length === 0) {
    return (
      <div style={{ background: C.paper, borderRadius: 16, padding: 16 }}>
        <p style={{ fontSize: "0.875rem", color: C.ink, margin: 0 }}>
          いまは、有料の機能にお進みいただけません。
        </p>
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: 8 }}>
          私たちの決まりとして、そうしています。記録の機能は、これまでどおりお使いいただけます。
        </p>
      </div>
    );
  }

  // ★18歳以上の方には、同意の画面を出しません。
  if (!needsMinorConsentScreen(band) || declared) {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        <PlanButtons plans={plans} />
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: 4 }}>{MINOR_NOTICE_LINE}</p>
      </div>
    );
  }

  // ★金額は lib/plans.js から引きます。★ここに数字を書かないこと。
  //   ★★書くと、値上げのときに片方だけが古くなります。
  const monthlyPlan = PLANS.find((p) => p.key === "monthly");
  const monthlyYen = monthlyPlan ? monthlyPlan.priceYen : null;

  async function handleDeclare() {
    if (!checked || busy) return;
    setBusy(true);
    setError("");
    const supabase = createClient();
    const now = new Date().toISOString();
    // ★足すだけの表です。★書き換えません。
    //   ★★「表示していた価格」を落とさないこと。
    const { error: insErr } = await supabase.from("minor_billing_consents").insert({
      user_id: userId,
      age_band: band,
      policy_version: MINOR_CONSENT_VERSION,
      displayed_price_yen: monthlyYen,
      plan: "monthly",
      declared_at: now
    });
    if (insErr) {
      console.error("★申告を記録できませんでした:", insErr);
      setBusy(false);
      setError("保存できませんでした。時間をおいて、もう一度お試しください。");
      return;
    }
    // ★いまの状態も、profiles に置きます。★0行を見ます。
    //   ★★列の名前は declared です。obtained ではありません。
    //     ★得たかどうかを、アプリは知りません。
    const { data: updated, error: upErr } = await supabase.from("profiles")
      .update({ guardian_consent_declared_at: now }).eq("id", userId).select("id");
    setBusy(false);
    if (upErr || !updated || updated.length === 0) {
      console.error("★申告のしるしを保存できませんでした:", upErr);
      setError("保存できませんでした。時間をおいて、もう一度お試しください。");
      return;
    }
    setDeclared(true);
  }

  return (
    <div style={{ background: C.paper, borderRadius: 16, padding: 16 }}>
      <p style={{ fontSize: "0.9375rem", fontWeight: 600, margin: "0 0 10px" }}>18歳未満の方へ</p>
      <p style={{ fontSize: "0.875rem", color: C.ink, margin: "0 0 12px" }}>
        有料の機能をお使いいただくには、保護者の方の同意が必要です。
      </p>

      <div style={{ margin: "0 0 14px", paddingLeft: 12, borderLeft: `2px solid ${C.line}` }}>
        {minorConsentLines(monthlyYen).map((l) => (
          <p key={l} style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "3px 0" }}>{l}</p>
        ))}
      </div>

      {/* ★見せるだけのページです。★フォームではありません。 */}
      <p style={{ fontSize: "0.8125rem", margin: "0 0 14px" }}>
        <a href="/parents" target="_blank" rel="noopener noreferrer"
          style={{ color: C.curtain }}>
          → 保護者の方へ（説明のページ）
        </a>
      </p>

      {/* ★★チェックは初期状態でオフ。★既定でオンにしないこと。 */}
      <label style={{ display: "flex", gap: 8, alignItems: "flex-start", cursor: "pointer", marginBottom: 14 }}>
        <input type="checkbox" checked={checked}
          onChange={(e) => setChecked(e.target.checked)} style={{ marginTop: 3 }} />
        <span style={{ fontSize: "0.8125rem", color: C.ink }}>{minorConsentCheckbox(monthlyYen)}</span>
      </label>

      {error && (
        <p style={{ fontSize: "0.75rem", color: C.curtain, margin: "0 0 10px" }}>{error}</p>
      )}

      {/* ★チェックしないと押せません。 */}
      <button type="button" onClick={handleDeclare} disabled={!checked || busy}
        style={{
          width: "100%", padding: "12px", borderRadius: 999, border: "none",
          background: C.curtain, color: "#FFFDF8", fontWeight: 600, fontSize: "0.875rem",
          opacity: (!checked || busy) ? 0.5 : 1
        }}>
        {busy ? "処理しています…" : "申し込みに進む"}
      </button>

      <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: 12 }}>{MINOR_NOTICE_LINE}</p>
    </div>
  );
}

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
