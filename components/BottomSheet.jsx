"use client";

// ============================================================================
// 下から 上がる 1枚（★見本の .sheet）
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     .sheet{position:absolute;left:0;right:0;bottom:0;background:var(--paper);
//            border-radius:22px 22px 0 0;box-shadow:0 -10px 30px rgba(90,72,48,.2);
//            padding:10px 15px 16px;max-height:82%;overflow-y:auto}
//     .sht{font-size:16px;font-weight:700;margin-bottom:4px}
//     .wl{background:#F6EFDF;border:1px solid #E8DFC8;border-radius:12px;
//         padding:9px 11px;font-size:11px;color:var(--ink2);line-height:1.7;margin-top:8px}
//
//   ★★見本には 22枚 あります。★器は これ 1つです。
//     ★22か所に 書くと、★1枚だけ 高さや 影が ちがう ものが できます。
//
//   ★★出口を 3つ 置きます。
//     ① 後ろの 暗い ところを 押す
//     ② 下の ボタン（★見本の shBtm・既定は「閉じる」）
//     ③ Esc（★パソコン・iPad）
//     ★出口の ない 1枚を 作らないこと。
//
//   ★★開いている あいだ、★後ろを 動かしません（★body の スクロールを 止めます）。
//     ★★止めないと、★1枚を 指で なぞったときに、★後ろが 動きます。
//
//   ★見張り components/tests/bottom-sheet.test.js
// ============================================================================

import { useEffect, useRef } from "react";
import { C } from "@/lib/tokens";
import { TYPE, FONT_STACK, rem } from "@/lib/uiKit";

export default function BottomSheet({ title, onClose, children, closeLabel = "閉じる" }) {
  const ref = useRef(null);
  // ★★いちばん 新しい onClose を、★描き直しを またいで 持ちます。
  //   ★★下の 効き目（useEffect）の 頼りに 入れない ため です。
  const closeRef = useRef(onClose);
  closeRef.current = onClose;

  // ★★開いた ときに 1度だけ すること。
  //
  //   ★★2026-09-11、★坂本さんから 実機の ご報告 ──
  //     「ひとことを 打つと、★1文字ごとに キーボードが 閉じる」
  //
  //   ★★原因は、★この 効き目の 頼り（依存）が [onClose] だった ことです。
  //     ★★呼ぶ 側は onClose={() => { … }} と 書いて います。
  //       ★★その場で 作る ので、★描き直すたびに **別の もの**に なります。
  //     ★★だから 1文字 打つ たびに（★setFormData → 描き直し）、
  //       ★★この 効き目が もう一度 走り、★ref.current.focus() が
  //       ★★焦点を 入力欄から 1枚の 枠へ 移して いました。
  //     ★★焦点が 外れると、★端末は キーボードを 閉じます。
  //
  //   ★★だから、★焦点を 移すのは **開いた とき 1度だけ** に します。
  //     ★頼りを 空（[]）に します。★描き直しでは 走りません。
  useEffect(() => {
    const before = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    if (ref.current) ref.current.focus();
    return () => { document.body.style.overflow = before; };
  }, []);

  // ★★Esc で 閉じる。★こちらは 毎回 付け替えても 害が ありません。
  //   ★★けれど、★onClose を 頼りに 入れません。★上と 同じ 形に します。
  useEffect(() => {
    const onKey = (e) => { if (e.key === "Escape") closeRef.current(); };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <div onClick={onClose} aria-hidden="true"
        style={{
          position: "fixed", inset: 0, zIndex: 80,
          background: "rgba(36,25,20,0.35)"
        }} />
      <div ref={ref} role="dialog" aria-modal="true" aria-label={title} tabIndex={-1}
        style={{
          position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 81,
          maxHeight: "82%", overflowY: "auto",
          background: C.paper, borderRadius: "22px 22px 0 0",
          boxShadow: "0 -10px 30px rgba(90,72,48,.2)",
          padding: `${rem(10)} ${rem(15)} calc(${rem(16)} + env(safe-area-inset-bottom))`,
          fontFamily: FONT_STACK, outline: "none"
        }}>
        {/* ★つまみ。★見本の #grab。★飾りです（★押しても 何も しません）。 */}
        <div aria-hidden="true" style={{
          width: 38, height: 4, borderRadius: 2, background: "#DFD4BE",
          margin: `0 auto ${rem(12)}`
        }} />
        <div style={{ ...TYPE.btn, fontWeight: 700, marginBottom: rem(4) }}>{title}</div>
        {children}
        {closeLabel === null ? null : (
          <button type="button" onClick={onClose}
            style={{
              width: "100%", minHeight: 48, marginTop: rem(11), borderRadius: 12,
              border: `1px solid ${C.line}`, background: C.card, color: C.ink,
              ...TYPE.li, fontFamily: FONT_STACK
            }}>{closeLabel}</button>
        )}
      </div>
    </>
  );
}

/** ★1枚の 中の 但し書き（★見本の .wl）。 */
export function SheetNote({ children }) {
  return (
    <div style={{
      background: "#F6EFDF", border: "1px solid #E8DFC8", borderRadius: 12,
      padding: `${rem(9)} ${rem(11)}`, marginTop: rem(8),
      ...TYPE.usual, color: C.inkSoft, lineHeight: 1.7
    }}>{children}</div>
  );
}

/** ★丸い 札の 列（★見本の .pills）。 */
export function Pills({ options, value, onSelect, multiple = false, small = false }) {
  const chosen = multiple ? (Array.isArray(value) ? value : []) : [];
  return (
    <div style={{ display: "flex", gap: 6, marginBottom: rem(11), flexWrap: "wrap" }}>
      {(options || []).map((o) => {
        const key = typeof o === "object" ? o.value : o;
        const label = typeof o === "object" ? o.label : o;
        const on = multiple ? chosen.includes(key) : value === key;
        return (
          <button key={String(key)} type="button" onClick={() => onSelect(key)}
            aria-pressed={on}
            style={{
              // ★★見本は 上下 7px（★＝27px）ですが、★押せるところは 44 以上です。
              //   ★中の 見え方は 見本の まま、★指の 当たる 所だけ 広げます。
              minHeight: 44, padding: small ? `0 ${rem(9)}` : `0 ${rem(12)}`,
              borderRadius: 99, whiteSpace: "nowrap",
              border: `1px solid ${on ? C.curtain : C.line}`,
              background: on ? C.curtain : C.card,
              color: on ? "#FFFDF8" : C.inkSoft,
              fontWeight: on ? 700 : 400,
              fontSize: small ? rem(10.5) : rem(11.5),
              fontFamily: FONT_STACK
            }}>{label}</button>
        );
      })}
    </div>
  );
}
