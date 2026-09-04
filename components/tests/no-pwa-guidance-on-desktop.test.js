#!/usr/bin/env node
/**
 * ★★パソコンの方に、ホーム画面の案内を出さないこと（2026-09-05）
 *
 *   ★運営者の決めごと ── パソコンの方は、★ふつうのウェブサイトとして使う。
 *     ★「アプリとして」「ホーム画面に」は、★1つも出さない。
 *
 *   ★★2026-09-05、★漏れていました。
 *     ★画面の側で「beforeinstallprompt が来たら Android」と決めていました。
 *     ★これはパソコンの Chrome と Edge にも来ます。
 *     ★パソコンの方に「画面の右上の ⋮ を押す」と出ていました。
 *
 *   実行  node components/tests/no-pwa-guidance-on-desktop.test.js
 */

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}

const UA = {
  Mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15",
  Windows: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  Linux: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Safari/537.36",
  // ★★ここが、いちばん危ないところです（2026-09-05 に確かめました）。
  //   ★Mac の Chrome と Edge は、★PWA を入れられます。
  //   ★だから beforeinstallprompt が★実際に来ます。
  //   ★★来たことを機械の種類と読み違えると、★ここに携帯向けの手順が出ます。
  MacChrome: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  MacEdge: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0",
  WinEdge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36 Edg/128.0",
  ChromeOS: "Mozilla/5.0 (X11; CrOS x86_64 14541.0.0) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36",
  iPhone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
  Android: "Mozilla/5.0 (Linux; Android 14) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120 Mobile Safari/537.36"
};

(async () => {
  const b64 = Buffer.from(fs.readFileSync(path.join(ROOT, "lib", "platform.js"))).toString("base64");
  const m = await import("data:text/javascript;base64," + b64);

  console.log("\n① ★パソコンでは、案内の形が「無し」になること");
  for (const name of ["Mac", "Windows", "Linux",
    "MacChrome", "MacEdge", "WinEdge", "ChromeOS"]) {
    // ★★maxTouchPoints は 0 です（★指で触る画面ではありません）。
    const os = m.osOf({ userAgent: UA[name], maxTouchPoints: 0 });
    ok(`${name}：★案内を出さない`,
      m.installGuidePlatform({ os, standalone: false, isIosSafari: false }) === "other");
    ok(`${name}：★iOS の案内を出さない`,
      !m.mayShowIosAddToHome({ os, standalone: false }));
    ok(`${name}：★Android の案内を出さない`,
      !m.mayShowAndroidInstall({
        os, standalone: false, hasDeferredPrompt: true,
        dismissedAt: null, enteredFirstRecord: true
      }));
    ok(`${name}：★置ける見込みが無い`, !m.canAddToHome({ os, userAgent: UA[name] }));
    ok(`${name}：★次の段が、いきなり登録である`,
      m.nextStep({ os, standalone: false, skippedAddToHome: false }) === m.STEP.REGISTER);
  }

  console.log("\n② ★携帯には、ちゃんと出ること（★出しすぎも、出さなすぎも困ります）");
  const ios = m.osOf({ userAgent: UA.iPhone, maxTouchPoints: 5 });
  const and = m.osOf({ userAgent: UA.Android, maxTouchPoints: 5 });
  ok("iPhone：★iOS の形で出る", m.installGuidePlatform({ os: ios }) === "ios");
  ok("Android：★Android の形で出る", m.installGuidePlatform({ os: and }) === "android");
  // ★もうホーム画面版で開いておられるなら、要りません。
  ok("★ホーム画面版で開いていたら、出さない",
    m.installGuidePlatform({ os: ios, standalone: true }) === "other");

  console.log("\n③ ★★画面の側で、機械の種類を組み立てていないこと");
  // ★これが、今回の原因そのものです。
  //   ★beforeinstallprompt は、★機械の種類ではありません。
  const vt = readCode("components", "VocalTracker.jsx");
  ok("★pwaInstallPrompt から Android と決めていない",
    !/pwaInstallPrompt\s*\?\s*"android"/.test(vt));
  ok("★installGuidePlatform を通している", /installGuidePlatform/.test(vt));
  // ★★「インストール」の帯が、機械の種類で絞られていること。
  ok("★インストールの帯を、機械の種類で絞っている",
    /pwaInstallPrompt[\s\S]{0,220}installGuidePlatform\([\s\S]{0,120}===\s*"android"/.test(vt));

  console.log("\n④ ★ホーム画面の言葉が、絞られていない所に無いこと");
  // ★★app と components を歩いて、「ホーム画面」と書いている画面を数えます。
  //   ★その画面が、機械の種類で絞られているかを見ます。
  const ALLOWED = [
    "components/AddToHomeGuide.jsx",   // ★iOS 専用の画面（呼ぶ側が絞ります）
    "components/AndroidInstallPrompt.jsx", // ★中で mayShowAndroidInstall を通します
    "components/StartFlow.jsx",        // ★中で canAddToHome / nextStep を通します
    "components/VocalTracker.jsx",     // ★上の③で見ました
    "components/LegacyOriginNotice.jsx", // ★引っ越しのお知らせ（★案内ではありません）
    "app/start/page.js"                // ★紙に刷る案内（★画面ではありません）
  ].map((p) => p.split("/").join(path.sep));
  const offenders = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(js|jsx)$/.test(e.name)) continue;
      if (p.includes(path.join("components", "tests"))) continue;
      if (ALLOWED.includes(p)) continue;
      const code = readCode(p);
      // ★JSX の中の文言だけを見ます（コメントは外してあります）。
      if (/ホーム画面に(追加|置)|アプリとしてインストール/.test(code)) offenders.push(p);
    }
  };
  ["app", "components"].forEach(walk);
  ok(`★絞られていない案内が無い${offenders.length ? "（★" + offenders.join(" ") + "）" : ""}`,
    offenders.length === 0);

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
