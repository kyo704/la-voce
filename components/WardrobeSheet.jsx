"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "@/lib/tokens";
import { SHEET_SNAPS, SHEET_DEFAULT, snapByKey, nearestSnap } from "@/lib/wardrobeOutfits";

// ============================================================================
// 下から出るシート（★仕様書 §2）
//
//   ★★羊を、絶対に隠さないこと。★これが §0 の「いまの問題」そのものです。
//     ★一覧を全画面にしません。★上に羊が見えたままにします。
//
//   ★★高さは3段。★指で動かすと、いちばん近い段に吸い付きます。
//     ★数字は lib/wardrobeOutfits.js が持ちます。★ここには書きません。
//
//   ★★下にスワイプで閉じます。★閉じても、着せかえは消えません。
//     ★仕様書 §2「閉じても着せ替えは消えない（プレビューのまま）」
//
//   ★★動きを減らす設定の方には、★動かしません。
// ============================================================================

export default function WardrobeSheet({ children, header, onClose, onSnapChange }) {
  const [snap, setSnapRaw] = useState(SHEET_DEFAULT);
  // ★★どの段にいるかを、★外へも伝えます（★2026-09-08・仕様 §7）。
  //   ★「少しだけ」の段では、★よく着るもの4点だけを出すためです。
  //   ★★状態を2つ持たないこと。★ここが正で、★外へは知らせるだけです。
  const setSnap = (v) => {
    setSnapRaw(v);
    if (onSnapChange) onSnapChange(v);
  };
  // ★指で持っているあいだの、いまの高さ。★離すと段に吸い付きます。
  const [dragTop, setDragTop] = useState(null);
  const startRef = useRef(null);

  // ★★開いているあいだ、★後ろの画面を動かさないこと。
  //   ★シートを触っているつもりで、★後ろが流れると、★酔います。
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  // ★戻るキー・Esc で閉じられること。★出口のない画面を作らないこと。
  useEffect(() => {
    function onKey(e) { if (e.key === "Escape" && onClose) onClose(); }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const topPct = dragTop != null ? dragTop : snapByKey(snap).topPct;

  function pointFrom(e) {
    const t = e.touches && e.touches[0] ? e.touches[0] : e;
    return t.clientY;
  }
  function onStart(e) {
    startRef.current = { y: pointFrom(e), top: snapByKey(snap).topPct };
  }
  function onMove(e) {
    if (!startRef.current) return;
    const dy = pointFrom(e) - startRef.current.y;
    const h = typeof window !== "undefined" ? window.innerHeight : 844;
    // ★★いちばん上の段より上へは、行かせません。★全画面にしないためです。
    const top = Math.max(SHEET_SNAPS[2].topPct,
      Math.min(100, startRef.current.top + (dy / h) * 100));
    setDragTop(top);
  }
  function onEnd() {
    if (!startRef.current) return;
    const top = dragTop;
    startRef.current = null;
    setDragTop(null);
    if (top == null) return;
    // ★★下へ大きく引いたら、閉じます。★いちばん下の段より下です。
    if (top > SHEET_SNAPS[0].topPct + 8) { if (onClose) onClose(); return; }
    setSnap(nearestSnap(top).key);
  }

  return (
    <div
      style={{
        position: "fixed", inset: 0, zIndex: 60,
        background: C.paper, display: "flex", flexDirection: "column"
      }}
    >
      {/* ★★上は、羊のための場所です。★シートは、ここまで上がりません。 */}
      <div style={{
        position: "absolute", left: 0, right: 0, top: 0,
        height: `${SHEET_SNAPS[2].topPct}%`,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", padding: "8px 16px", overflow: "hidden"
      }}>
        {header}
      </div>

      {/* ★閉じる。★どの段でも押せるところに置きます。 */}
      <button type="button" onClick={onClose} aria-label="着せかえを閉じる"
        style={{
          position: "absolute", top: "max(12px, env(safe-area-inset-top))", right: 12,
          minWidth: 44, minHeight: 44, borderRadius: 999,
          border: `1px solid ${C.line}`, background: C.card, color: C.ink,
          fontSize: "1rem", zIndex: 2
        }}>
        ×
      </button>

      {/* ★シート本体。 */}
      <div
        style={{
          position: "absolute", left: 0, right: 0, bottom: 0,
          top: `${topPct}%`,
          background: C.card,
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          boxShadow: "0 -6px 24px rgba(60,40,20,0.10)",
          display: "flex", flexDirection: "column",
          transition: dragTop == null ? "top 0.22s ease-out" : "none"
        }}
      >
        {/* ★つまみ。★ここを持って、上下に動かします。 */}
        <div
          onTouchStart={onStart} onTouchMove={onMove} onTouchEnd={onEnd}
          onMouseDown={onStart} onMouseMove={onMove} onMouseUp={onEnd} onMouseLeave={onEnd}
          style={{ padding: "10px 0 6px", cursor: "grab", touchAction: "none", flexShrink: 0 }}
        >
          <div aria-hidden="true" style={{
            width: 44, height: 5, borderRadius: 999,
            background: C.line, margin: "0 auto"
          }} />
          {/* ★★指で動かせない方のために、★押せる段も置きます。
              ★つまみだけだと、★動かし方が分からない方がいらっしゃいます。 */}
          <div style={{ display: "flex", gap: 6, justifyContent: "center", marginTop: 8 }}>
            {SHEET_SNAPS.map((s) => (
              <button key={s.key} type="button" onClick={() => setSnap(s.key)}
                style={{
                  padding: "6px 14px", borderRadius: 999, minHeight: 36,
                  border: `1px solid ${snap === s.key ? C.curtain : C.line}`,
                  background: snap === s.key ? C.curtain : C.paper,
                  color: snap === s.key ? "#FFFDF8" : C.inkSoft,
                  fontSize: "0.8125rem"
                }}>
                {s.label}
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: "0 14px 8px", flexShrink: 0 }}>{header ? null : null}</div>

        {/* ★中身。★ここだけが流れます。 */}
        <div style={{
          flex: 1, overflowY: "auto", padding: "4px 14px 24px",
          WebkitOverflowScrolling: "touch"
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
