"use client";

import { useEffect, useState } from "react";

// ============================================================================
// ★画面の 幅を 見る ── ★1本（★2026-09-18）
//
//   ★★★同じ 仕掛けが、★4か所に ありました ──
//     ★`OpsSchedule.jsx` ／ `Renraku.jsx` ／ `OpsRoster.jsx` ／ `OpsPosts.jsx`
//   ★★しかも 揃って いませんでした ──
//     ★★2つは `orientationchange` を 聞き、★2つは 聞いて いません でした。
//     ★★★iPad を 横に すると、★片方だけ 見せ方が 変わる、という こと です。
//   ★★この 蔵で 繰り返して いる 形 です。★1本に します。
//
//   ★★★はじめは `null` です。★「まだ 分からない」を 0 と 区別します。
//     ★★0 に すると、★組み上げの ときに いちばん 狭い 姿で 描かれ、
//       ★★端末で 一瞬 札が 出て から 表に 変わります。
//     ★★分からない うちは、★狭い ほうへ 倒す のが 決め です
//       （★`lib/opsRosterTable.js` ／ `lib/opsNav.js`）。
//
//   ★見張り components/tests/window-width.test.js
// ============================================================================

export default function useWindowWidth() {
  const [w, setW] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const on = () => setW(window.innerWidth);
    on();
    window.addEventListener("resize", on);
    // ★★向きを 変えた ときも 見ます。★iPad では これが 本番 です。
    window.addEventListener("orientationchange", on);
    return () => {
      window.removeEventListener("resize", on);
      window.removeEventListener("orientationchange", on);
    };
  }, []);
  return w;
}
