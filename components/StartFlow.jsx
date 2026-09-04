"use client";

import { useEffect, useState } from "react";
import { C } from "@/lib/tokens";
import AddToHomeGuide from "@/components/AddToHomeGuide";
import OtpSignIn from "@/components/OtpSignIn";
import {
  readPlatform, nextStep, STEP, OS,
  shouldAskToOpenInBrowser, inAppBrowserOf, inAppBrowserLabel, canAddToHome
} from "@/lib/platform";
import { PLANS } from "@/lib/plans";
import { countStep } from "@/lib/countStep";
import { createClient } from "@/lib/supabase/client";

// ============================================================================
// 着地の画面（2026-09-04）
//
//   出どころ docs/opus/lavoce-仕様-ホーム画面までの動線・画面と文言（9月4日）.md §1〜§3
//
//   ★★iOS では、ここでブラウザの登録画面を出しません。
//     ★iOS は、ホーム画面版と Safari で★保存場所が別です。
//     ★ブラウザで登録させると、★ホーム画面から開いたときログアウトしています。
//     ★★だから、置いてから登録します。
//
//   ★アプリの中のブラウザ（LINE など）では、★置く道がありません。
//     ★共有のシートが出ず、beforeinstallprompt も来ません。
//     ★★だから、案内を出しても押せません。
//       ★代わりに「ふつうのブラウザで開いてください」と伝えます。
//
//   ★見分けは、★描いたあとに行います（useEffect）。
//     ★サーバでは navigator が無く、★描き分けると食い違います。
//     ★★最初の1瞬は、どちらでもない形を出します。
// ============================================================================

export default function StartFlow() {
  const [platform, setPlatform] = useState(null);
  const [skipped, setSkipped] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [ua, setUa] = useState("");

  useEffect(() => {
    const p = readPlatform();
    setPlatform(p);
    if (typeof navigator !== "undefined") setUa(navigator.userAgent);

    // ★★ホーム画面のしるしは、★必ずここを開きます（manifest の start_url）。
    //   ★すでに入っておられる方には、★着地ページは要りません。
    //   ★★毎回この画面を見せると、★「入り直すのか」と思わせます。
    //   ★だから、★入っておられたら、そのまま中へ送ります。
    let cancelled = false;
    (async () => {
      try {
        const { data } = await createClient().auth.getSession();
        if (!cancelled && data && data.session) {
          window.location.replace("/dashboard");
          return;
        }
      } catch (e) {
        // ★確かめられなくても、★着地ページを出せばよいだけです。
        //   ★ここで止めないこと。
      }
      if (cancelled) return;
      // ★1回だけ数えます。★人数ではありません。★回数です。
      countStep("landing");
      // ★ホーム画面から開かれたことも数えます。★ここが、いちばん見たい段です。
      if (p.standalone) countStep("standalone_opened");
    })();
    return () => { cancelled = true; };
  }, []);

  // ★読み込みの前。★何も決めつけません。
  if (!platform) {
    return (
      <Shell>
        <p style={{ fontSize: 16, color: C.inkSoft, textAlign: "center" }}>読み込んでいます…</p>
      </Shell>
    );
  }

  // ★アプリの中のブラウザ。★置く道がありません。
  //   ★★開き方は、アプリの版で変わります。★手順を細かく書かないこと。
  if (shouldAskToOpenInBrowser({ userAgent: ua, standalone: platform.standalone })) {
    const label = inAppBrowserLabel(inAppBrowserOf({ userAgent: ua }));
    return (
      <Shell>
        <h1 style={{ fontSize: 23, fontWeight: 600, margin: "0 0 12px", lineHeight: 1.5 }}>
          ブラウザで開いてください
        </h1>
        <p style={{ fontSize: 17, color: C.ink, margin: "0 0 14px", lineHeight: 1.7 }}>
          {label ? `${label}の中では、` : "いまの画面では、"}
          ホーム画面に置くことができません。
        </p>
        <p style={{ fontSize: 16, color: C.inkSoft, margin: "0 0 18px", lineHeight: 1.8 }}>
          画面のすみにある「…」や、四角から矢印が出ているしるしを押すと、
          ブラウザ（Safari や Chrome）で開き直せます。
        </p>
        <p style={{ fontSize: 16, color: C.inkSoft, margin: 0, lineHeight: 1.8 }}>
          このまま読んでいただくこともできます。記録を始めるときに、
          もう一度ブラウザで開いてください。
        </p>
      </Shell>
    );
  }

  const step = nextStep({
    os: platform.os,
    standalone: platform.standalone,
    skippedAddToHome: skipped
  });

  // ★iOS ＆ ブラウザ → ★まず置いてもらいます。
  if (step === STEP.IOS_ADD_TO_HOME && canAddToHome({ os: platform.os, userAgent: ua })) {
    return (
      <Shell center={false}>
        <AddToHomeGuide
          onShow={() => countStep("add_to_home_shown")}
          onSkip={() => { countStep("add_to_home_skipped"); setSkipped(true); }} />
      </Shell>
    );
  }

  // ★「あとで」を押した方には、★先に不利なことを伝えます。
  //   ★★あとで驚かせません。
  const showSkipWarning = skipped && platform.os === OS.IOS && !platform.standalone;

  // ★★「はじめる」を押したら、★6桁の道に入ります。
  //   ★別の画面へ飛ばしません。★飛ばすと、ホーム画面版の外に出ることがあります。
  if (registering) {
    return (
      <Shell center={false}>
        <OtpSignIn onSignedIn={() => { window.location.href = "/dashboard"; }} />
        <button type="button" onClick={() => setRegistering(false)}
          style={{
            width: "100%", marginTop: 18, padding: "13px", borderRadius: 999,
            border: "none", background: "transparent", color: C.inkSoft,
            fontSize: 16, minHeight: 48
          }}>
          もどる
        </button>
      </Shell>
    );
  }

  return (
    <Shell>
      <Landing showSkipWarning={showSkipWarning}
        onAddToHome={() => setSkipped(false)}
        onStart={() => setRegistering(true)} />
    </Shell>
  );
}

function Landing({ showSkipWarning, onAddToHome, onStart }) {
  const monthly = PLANS.find((p) => p.key === "monthly");
  const annual = PLANS.find((p) => p.key === "annual");
  return (
    <div style={{ textAlign: "center" }}>
      <img src="/icons/icon-120-2609.png" alt="Woolsong のアイコン（羊の絵）"
        width={72} height={72}
        style={{ borderRadius: 16, margin: "0 auto 18px", display: "block" }} />

      <h1 className="ff-display italic" style={{ fontSize: 32, color: C.curtain, margin: "0 0 16px" }}>
        Woolsong
      </h1>

      <p style={{ fontSize: 18, color: C.ink, margin: "0 0 10px", lineHeight: 1.8 }}>
        声を使う人の、体調と負荷の記録。
      </p>
      <p style={{ fontSize: 17, color: C.inkSoft, margin: "0 0 28px", lineHeight: 1.9 }}>
        毎日ひとこと記録するだけで、<br />声の使いすぎが見えるようになります。
      </p>

      {showSkipWarning && (
        <div style={{ background: C.paper, borderRadius: 14, padding: 14, marginBottom: 18, textAlign: "left" }}>
          <p style={{ fontSize: 17, color: C.ink, margin: "0 0 10px", lineHeight: 1.7 }}>
            このまま、ブラウザでも始められます。
          </p>
          {/* ★不利なことを、先に書きます。★あとで驚かせません。 */}
          <p style={{ fontSize: 16, color: C.inkSoft, margin: "0 0 14px", lineHeight: 1.8 }}>
            あとでホーム画面に置いたときに、もう一度だけ、数字を入れていただきます。
          </p>
          <button type="button" onClick={onAddToHome}
            style={{
              width: "100%", padding: "10px", borderRadius: 999,
              border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: 16, minHeight: 48
            }}>
            ホーム画面に置く
          </button>
        </div>
      )}

      {/* ★★6桁の数字で入ります（2026-09-04）。
          ★リンクではありません。★リンクは、ホーム画面版の外に出ます。
          ★★いまお使いの方は、★パスワードのままです。★触っていません。
            ★この道は、★新しく始める方のものです。 */}
      <button type="button" onClick={onStart}
        style={{
          display: "block", width: "100%", padding: "16px", borderRadius: 999,
          border: "none", background: C.curtain, color: "#FFFDF8", fontWeight: 600,
          fontSize: 18, marginBottom: 16, minHeight: 52
        }}>
        はじめる
      </button>

      {/* ★値段だけ見せると止まります。★「無料で使える」を必ず書きます。 */}
      <p style={{ fontSize: 15, color: C.inkSoft, margin: "0 0 6px" }}>
        {monthly ? `毎月 ¥${monthly.priceYen}（税込）` : ""}
        {annual ? ` ／ 年 ¥${annual.priceYen.toLocaleString()}（税込）` : ""}
      </p>
      <p style={{ fontSize: 15, color: C.inkSoft, margin: "0 0 24px" }}>
        記録は無料でお使いいただけます。
      </p>

      {/* ★すでにお使いの方のために、小さく置きます。 */}
      <a href="/login" style={{ fontSize: 16, color: C.inkSoft, display: "inline-block", padding: "12px 8px" }}>
        すでにお使いの方
      </a>
    </div>
  );
}

/**
 * ★★真ん中に寄せるのは、★中身が画面より短いときだけです。
 *   ★長い中身を寄せると、★上下が画面の外へ出ます。
 *   ★★2026-09-04、実機で★案内の写真と説明が、外に出ていました。
 *   ★だから、★寄せる／寄せないを、呼ぶ側が決めます。
 */
function Shell({ children, center = true }) {
  return (
    <main style={{
      minHeight: "100svh", display: "flex",
      alignItems: center ? "center" : "flex-start",
      justifyContent: "center", padding: "24px 20px 40px", background: C.paper
    }}>
      <div style={{ width: "100%", maxWidth: 420 }}>{children}</div>
    </main>
  );
}
