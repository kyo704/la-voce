"use client";

// 旧オリジン（la-voce.vercel.app）で開かれたときの後始末と案内。
//
// 出典 docs/lavoce-作業指示-ドメイン切替（woolsong.app）.md §8-1①
//
// ★仕様書は「旧オリジンに最後のデプロイを1回行う」と書いていますが、
//   このプロジェクトでは新旧の2つのドメインが同じ1つのデプロイを指しています
//   （両方の /api/version が同じコミットを返します）。配備が分かれていないため、
//   別のビルドを旧オリジンにだけ配ることはできません。
//   代わりに、配られたコードの中でホスト名を見て、旧オリジンのときだけ働きます。
//
// ★新オリジンでは何もしません。表示にも動作にも一切影響しません。
//
// やること（この順番で）
//   ① Service Worker の登録を全部解除する
//   ② caches を全部消す（la-voce-shell-v2 を含む）
//   ③ 案内を出す
//   ④ 新しいURLへ移動する。★パスを落とさない（§10）
//
// ★①②を先に終わらせてから移動します。移動が先だと、旧オリジンの
//   Service Worker が残り続け、あとから消す手段が無くなります。

import { useEffect, useState } from "react";
import { isLegacyOrigin, newOriginUrlFor, PRODUCTION_ORIGIN } from "@/lib/baseUrl";

export default function LegacyOriginNotice() {
  const [onLegacy, setOnLegacy] = useState(false);
  const [target, setTarget] = useState(PRODUCTION_ORIGIN + "/");

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!isLegacyOrigin(window.location.hostname)) return;
    setOnLegacy(true);
    const to = newOriginUrlFor(window.location);
    setTarget(to);

    let cancelled = false;
    (async () => {
      // ① Service Worker を解除する
      try {
        if ("serviceWorker" in navigator) {
          const regs = await navigator.serviceWorker.getRegistrations();
          await Promise.all(regs.map((r) => r.unregister().catch(() => {})));
        }
      } catch { /* 解除できなくても、案内と移動は続けます */ }

      // ② キャッシュを全部消す
      try {
        if (typeof caches !== "undefined") {
          const keys = await caches.keys();
          await Promise.all(keys.map((k) => caches.delete(k).catch(() => {})));
        }
      } catch { /* 同上 */ }

      // ④ 後始末が終わってから移動する。
      //   ★replace を使います。戻るボタンで旧オリジンに戻れてしまうと、
      //     せっかく消した Service Worker がまた登録されます。
      if (!cancelled) window.location.replace(to);
    })();

    return () => { cancelled = true; };
  }, []);

  if (!onLegacy) return null;

  // ③ 案内。★移動が始まらなかった人のために、押せるボタンも必ず置きます。
  return (
    <div
      role="status"
      style={{
        position: "fixed", inset: 0, zIndex: 2147483647,
        background: "#F6F1E7", color: "#241914",
        display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center",
        padding: "32px 24px", textAlign: "center", gap: 16,
        fontFamily: 'system-ui, -apple-system, "Hiragino Sans", sans-serif'
      }}
    >
      <p style={{ fontSize: 22, fontWeight: 600, margin: 0, lineHeight: 1.5 }}>
        新しいURLに移動しました
      </p>
      <p style={{ fontSize: "0.9375rem", margin: 0, lineHeight: 1.8, maxWidth: 420 }}>
        Woolsong は <strong>woolsong.app</strong> に引っ越しました。<br />
        記録はそのまま残っています。自動で移動します。
      </p>
      <a
        href={target}
        style={{
          display: "inline-block", marginTop: 8,
          padding: "14px 28px", borderRadius: 999,
          background: "#8C2F39", color: "#FFFDF8",
          fontSize: "1rem", fontWeight: 600, textDecoration: "none"
        }}
      >
        新しいページを開く
      </a>
      <p style={{ fontSize: "0.8125rem", margin: "8px 0 0", lineHeight: 1.8, maxWidth: 420, opacity: 0.75 }}>
        ★ホーム画面にアイコンを追加していた方は、
        一度削除してから、新しいページで追加し直してください。
      </p>
    </div>
  );
}
