"use client";

import { useEffect, useRef, useState } from "react";
import { C } from "@/lib/tokens";

// ============================================================================
// ★羊の 寸法を、★画面に そのまま 出す（★2026-09-10・調べるための 枠）
//
//   ★★羊の 大きさを 4度 直し、★4度とも 実機で 変わりませんでした。
//     ★配信も、★組み立ても、★配信されている コード自身に 聞いた 値も、
//     ★★ぜんぶ 新しい ものでした。★Service Worker も 直しました。
//   ★★それでも 変わらないなら、★私の 読み違いが どこかに あります。
//     ★★読むのを やめて、★実機の 数字を 見せていただきます。
//
//   ★★この 枠が 画面に 出ること 自体が、★1つの 答えです。
//     ★出れば　★新しい コードが 動いています
//     ★出なければ ★まだ 古い コードが 動いています
//
//   ★★門の中（名簿の方）だけに 出します。★38人には 出ません。
//   ★★調べ終わったら、★この ファイルごと 外します。
// ============================================================================

export default function SheepProbe({ cssSize, ratio, teaching }) {
  const ref = useRef(null);
  const [m, setM] = useState(null);

  useEffect(() => {
    // ★★描き終わってから 測ります。★2回 待つのは、★絵が 入ってからの ためです。
    let id2 = 0;
    const id1 = requestAnimationFrame(() => {
      id2 = requestAnimationFrame(() => {
        const el = ref.current;
        if (!el) return;
        // ★★羊は、★この枠の すぐ 上の きょうだいです。
        const box = el.previousElementSibling;
        const sheep = box ? box.querySelector('[role="img"]') : null;
        const r = (n) => {
          if (!n) return null;
          const b = n.getBoundingClientRect();
          return { w: Math.round(b.width), h: Math.round(b.height) };
        };
        const cs = sheep && typeof window !== "undefined"
          ? window.getComputedStyle(sheep) : null;
        setM({
          screen: Math.round(document.documentElement.clientWidth),
          dpr: window.devicePixelRatio || 1,
          box: r(box),
          sheep: r(sheep),
          styleW: cs ? cs.width : "（羊が 見つかりません）",
          styleH: cs ? cs.height : "",
          opacity: cs ? cs.opacity : "",
          found: !!sheep
        });
      });
    });
    return () => { cancelAnimationFrame(id1); cancelAnimationFrame(id2); };
  }, [cssSize]);

  const row = (k, v) => (
    <div style={{ display: "flex", justifyContent: "space-between", gap: 8, padding: "1px 0" }}>
      <span style={{ opacity: 0.75 }}>{k}</span>
      <span style={{ fontWeight: 700, textAlign: "right", wordBreak: "break-all" }}>{v}</span>
    </div>
  );

  return (
    <div ref={ref} style={{
      border: `1px dashed ${C.curtain}`, borderRadius: 8, padding: "7px 9px",
      margin: "6px 0", fontSize: 10.5, lineHeight: 1.7, color: C.ink, background: C.card
    }}>
      <div style={{ color: C.curtain, fontWeight: 700, marginBottom: 3 }}>
        羊の寸法（調べるための枠・9月10日）
      </div>
      {row("式", cssSize)}
      {row("割合", (ratio * 100).toFixed(2) + "%" + (teaching ? "（先生の日）" : ""))}
      {m ? (
        <>
          {row("画面の幅", m.screen + "px（×" + m.dpr + "）")}
          {row("入れ物", m.box ? m.box.w + " × " + m.box.h : "（無し）")}
          {row("羊の箱", m.sheep ? m.sheep.w + " × " + m.sheep.h : "（見つかりません）")}
          {row("羊のwidth", m.styleW)}
          {row("羊のheight", m.styleH)}
          {row("見え方", m.opacity === "1" ? "出ています" : "opacity " + m.opacity)}
          {row("画面に対して", m.sheep && m.screen
            ? Math.round((m.sheep.w / m.screen) * 100) + "%（見本は 51.7%）"
            : "—")}
        </>
      ) : row("測定", "…")}
    </div>
  );
}
