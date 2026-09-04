"use client";

import { useEffect, useState } from "react";
import { C } from "@/lib/tokens";
import AddToHomeGuide from "@/components/AddToHomeGuide";
import {
  readPlatform, nextStep, STEP, OS,
  shouldAskToOpenInBrowser, inAppBrowserOf, inAppBrowserLabel, canAddToHome
} from "@/lib/platform";
import { PLANS } from "@/lib/plans";
import { countStep } from "@/lib/countStep";

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
  const [ua, setUa] = useState("");

  useEffect(() => {
    const p = readPlatform();
    setPlatform(p);
    if (typeof navigator !== "undefined") setUa(navigator.userAgent);
    // ★1回だけ数えます。★人数ではありません。★回数です。
    countStep("landing");
    // ★ホーム画面から開かれたことも数えます。★ここが、いちばん見たい段です。
    if (p.standalone) countStep("standalone_opened");
  }, []);

  // ★読み込みの前。★何も決めつけません。
  if (!platform) {
    return (
      <Shell>
        <p style={{ fontSize: 13, color: C.inkSoft, textAlign: "center" }}>読み込んでいます…</p>
      </Shell>
    );
  }

  // ★アプリの中のブラウザ。★置く道がありません。
  //   ★★開き方は、アプリの版で変わります。★手順を細かく書かないこと。
  if (shouldAskToOpenInBrowser({ userAgent: ua, standalone: platform.standalone })) {
    const label = inAppBrowserLabel(inAppBrowserOf({ userAgent: ua }));
    return (
      <Shell>
        <h1 style={{ fontSize: 19, fontWeight: 600, margin: "0 0 10px" }}>
          ブラウザで開いてください
        </h1>
        <p style={{ fontSize: 14, color: C.ink, margin: "0 0 12px" }}>
          {label ? `${label}の中では、` : "いまの画面では、"}
          ホーム画面に置くことができません。
        </p>
        <p style={{ fontSize: 13, color: C.inkSoft, margin: "0 0 16px" }}>
          画面のすみにある「…」や、四角から矢印が出ているしるしを押すと、
          ブラウザ（Safari や Chrome）で開き直せます。
        </p>
        <p style={{ fontSize: 13, color: C.inkSoft, margin: 0 }}>
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

  return (
    <Shell>
      <Landing showSkipWarning={showSkipWarning} onAddToHome={() => setSkipped(false)} />
    </Shell>
  );
}

function Landing({ showSkipWarning, onAddToHome }) {
  const monthly = PLANS.find((p) => p.key === "monthly");
  const annual = PLANS.find((p) => p.key === "annual");
  return (
    <div style={{ textAlign: "center" }}>
      <img src="/icon-120.png" alt="Woolsong のアイコン（羊の絵）"
        width={72} height={72}
        style={{ borderRadius: 16, margin: "0 auto 18px", display: "block" }} />

      <h1 className="ff-display italic" style={{ fontSize: 28, color: C.curtain, margin: "0 0 14px" }}>
        Woolsong
      </h1>

      <p style={{ fontSize: 15, color: C.ink, margin: "0 0 8px", lineHeight: 1.8 }}>
        声を使う人の、体調と負荷の記録。
      </p>
      <p style={{ fontSize: 14, color: C.inkSoft, margin: "0 0 26px", lineHeight: 1.8 }}>
        毎日ひとこと記録するだけで、<br />声の使いすぎが見えるようになります。
      </p>

      {showSkipWarning && (
        <div style={{ background: C.paper, borderRadius: 14, padding: 14, marginBottom: 18, textAlign: "left" }}>
          <p style={{ fontSize: 13, color: C.ink, margin: "0 0 8px" }}>
            このまま、ブラウザでも始められます。
          </p>
          {/* ★不利なことを、先に書きます。★あとで驚かせません。 */}
          <p style={{ fontSize: 13, color: C.inkSoft, margin: "0 0 12px" }}>
            あとでホーム画面に置いたときに、もう一度だけ、数字を入れていただきます。
          </p>
          <button type="button" onClick={onAddToHome}
            style={{
              width: "100%", padding: "10px", borderRadius: 999,
              border: `1px solid ${C.line}`, background: C.card, color: C.ink, fontSize: 13
            }}>
            ホーム画面に置く
          </button>
        </div>
      )}

      <a href="/signup"
        style={{
          display: "block", padding: "14px", borderRadius: 999,
          background: C.curtain, color: "#FFFDF8", fontWeight: 600,
          fontSize: 15, textDecoration: "none", marginBottom: 14
        }}>
        はじめる
      </a>

      {/* ★値段だけ見せると止まります。★「無料で使える」を必ず書きます。 */}
      <p style={{ fontSize: 12, color: C.inkSoft, margin: "0 0 4px" }}>
        {monthly ? `毎月 ¥${monthly.priceYen}（税込）` : ""}
        {annual ? ` ／ 年 ¥${annual.priceYen.toLocaleString()}（税込）` : ""}
      </p>
      <p style={{ fontSize: 12, color: C.inkSoft, margin: "0 0 22px" }}>
        記録は無料でお使いいただけます。
      </p>

      {/* ★すでにお使いの方のために、小さく置きます。 */}
      <a href="/login" style={{ fontSize: 13, color: C.inkSoft }}>
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
