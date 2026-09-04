"use client";

import { useEffect, useState } from "react";
import { C } from "@/lib/tokens";
import { readPlatform, mayShowAndroidInstall } from "@/lib/platform";
import { countStep } from "@/lib/countStep";

// ============================================================================
// Android：ホーム画面に置く案内（2026-09-04）
//
//   出どころ docs/opus/lavoce-仕様-ホーム画面までの動線・画面と文言（9月4日）.md §7
//
//   ★Android は、★保存がブラウザと共有されます。★だからログインが続きます。
//     ★★順番を入れ替える必要がありません。★記録を1つ入れたあとに出します。
//
//   ★★beforeinstallprompt が来ていない端末には、★出しません。
//     ★押せないボタンを、見せないこと。
//     ★LINE などの中のブラウザでは、★このイベントが来ません。
//
//   ★★一度断られたら、二度と出しません。★催促しません。
//     ★代わりに、設定の中に「ホーム画面に置く方法」を常設で置きます。
//
//   ★「インストール」と書きません。★「ホーム画面に置く」です。
//     ★インストールと書くと、★ストアを探されます。
// ============================================================================

const DISMISS_KEY = "woolsong-android-install-dismissed";

export default function AndroidInstallPrompt({ enteredFirstRecord }) {
  const [deferred, setDeferred] = useState(null);
  const [platform, setPlatform] = useState(null);
  const [dismissedAt, setDismissedAt] = useState(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    setPlatform(readPlatform());
    // ★localStorage は、読めないことがあります（★私用の窓・設定で切っている方）。
    //   ★★読めなくても、画面が壊れないこと。
    try {
      setDismissedAt(window.localStorage.getItem(DISMISS_KEY));
    } catch (e) {
      setDismissedAt(null);
    }
    function onPrompt(e) {
      // ★既定の案内を止めて、★こちらのボタンで出します。
      e.preventDefault();
      setDeferred(e);
    }
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const show = !gone && platform && mayShowAndroidInstall({
    os: platform.os,
    standalone: platform.standalone,
    hasDeferredPrompt: !!deferred,
    dismissedAt,
    enteredFirstRecord
  });

  // ★出すと決まってから、1回だけ数えます。
  useEffect(() => {
    if (show) countStep("android_install_shown");
  }, [show]);

  if (!show) return null;

  function remember() {
    try {
      window.localStorage.setItem(DISMISS_KEY, new Date().toISOString());
    } catch (e) {
      // ★覚えられなくても、★この場では消します。
      //   ★次に開いたときに、また出ます。★それは仕方がありません。
    }
    setGone(true);
  }

  async function handlePlace() {
    if (!deferred) return;
    try {
      deferred.prompt();
      const choice = await deferred.userChoice;
      if (choice && choice.outcome === "accepted") {
        countStep("android_install_accepted");
      }
    } catch (e) {
      console.error("★ホーム画面に置けませんでした:", e && e.message);
    }
    // ★★押しても断っても、★この案内は消します。★二度は出しません。
    remember();
  }

  return (
    <div style={{
      background: C.paper, borderRadius: 16, padding: 16, marginTop: 16
    }}>
      <p style={{ fontSize: 14, color: C.ink, margin: "0 0 12px" }}>
        ホーム画面に置いておくと、すぐ開けます。
      </p>
      <div style={{ display: "flex", gap: 8 }}>
        <button type="button" onClick={handlePlace}
          style={{
            flex: 1, padding: "11px", borderRadius: 999, border: "none",
            background: C.curtain, color: "#FFFDF8", fontSize: 14, fontWeight: 600
          }}>
          置く
        </button>
        {/* ★出口を必ず置きます。★断ったら、二度と出しません。 */}
        <button type="button" onClick={remember}
          style={{
            flex: 1, padding: "11px", borderRadius: 999,
            border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft, fontSize: 14
          }}>
          あとで
        </button>
      </div>
    </div>
  );
}
