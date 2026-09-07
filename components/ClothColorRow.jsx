"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import {
  CLOTH_COLORS, swatchHex, edgeHex, needsEdge, isColorable, colorByKey
} from "@/lib/clothColors";

// ============================================================================
// 服の色を、選ぶところ 24色（2026-09-08）
//
//   ★出どころ docs/opus/woolsong-確定-服のいろ24色（9月8日）.md
//
//   ★★いま着ているものの色を変えます。★あつ森と、同じ考え方です。
//     ★★色を塗れる品を着ているときだけ、★出します。
//       ★塗れない品のときに、★灰色の見本を並べません。
//       ★押せないものを並べるのは、★焦らしているのと同じです。
//
//   ★★「もとの色」を、★いちばん前に置きます。
//     ★★作った方が決めた色も、★1つの色です。★戻る道を、必ず残します。
//     ★色を選んだあと、★もとに戻れないようにしないこと。
//
//   ★★見本は「狙う色」で出します（★swatchHex）。
//     ★実際に絵へ塗る値（★pre）は、★様式のぶんを差し引いた別の値です。
//     ★★見本に pre を出すと、★お客さまの目には、★濁って見えます。
//       ★お客さまが見るのは、★塗ったあとの色です。
//
//   ★★はじめは、閉じています（★2026-09-08・坂本さんの決め）。
//     ★★いつも開いていると、★24個の丸が、★品物の一覧を押しのけます。
//       ★着せかえに来た方の、★目当ては品物です。
//     ★押すと開きます。★開けたことは、★この画面のあいだ おぼえています。
//
//   ★★数を、書きません。★「24色」と出さないこと。
//
//   ★★色の名前は、★文字でも出します。
//     ★色だけで示すと、★色の見分けにくい方に、★何も伝わりません。
//
//   ★見張り components/tests/cloth-colors.test.js
// ============================================================================

export default function ClothColorRow({ itemKey, itemName, itemSlot, colorKey, onChange }) {
  // ★★はじめは閉じています。★押すと開きます。
  //   ★★state は、★早めに置きます。★条件で return するより前です。
  //     ★あとに置くと、★呼ばれる回数が変わり、React が落ちます。
  const [open, setOpen] = useState(false);

  // ★★塗れない品のときは、★何も出しません。★灰色にして並べないこと。
  //   ★全身ものと、★止めているあいだは、★isColorable が false を返します。
  if (!itemKey || !isColorable(itemKey, itemSlot)) return null;

  const pick = (k) => { if (onChange) onChange(k); };
  // ★★いま選んでいる色を、★閉じたままでも分かるようにします。
  const now = colorKey ? colorByKey(colorKey) : null;

  return (
    <div style={{ marginBottom: 14 }}>
      {/* ★★押しどころは、★1つの button です。
          ★★「色」という字と、★いま選んでいる丸を、★両方 出します。
            ★閉じているあいだも、★何色にしているかが分かるようにします。 */}
      <button type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        style={{
          display: "flex", alignItems: "center", gap: 8,
          width: "100%", minHeight: 44, padding: "6px 10px",
          borderRadius: 12, border: `1px solid ${C.line}`, background: C.card,
          color: C.inkSoft, fontSize: "0.8125rem", marginBottom: open ? 8 : 0
        }}>
        <span>{itemName ? `${itemName}の色` : "色"}</span>
        <span aria-hidden="true"
          style={{
            width: 18, height: 18, borderRadius: 999,
            background: now ? swatchHex(now.key) : C.paper,
            border: now && needsEdge(now.key)
              ? `1.5px solid ${edgeHex(now.key)}`
              : `1px solid ${C.line}`
          }} />
        <span style={{ fontSize: "0.75rem" }}>{now ? now.name : "もとの色"}</span>
        <span aria-hidden="true" style={{ marginLeft: "auto", fontSize: "0.75rem" }}>
          {open ? "とじる" : "えらぶ"}
        </span>
      </button>
      {!open ? null : (
      <div style={{ display: "flex", gap: 8, overflowX: "auto", paddingBottom: 6 }}>
        {/* ★★もとの色。★いちばん前です。★戻る道を、必ず残します。 */}
        <button type="button"
          onClick={() => pick(null)}
          aria-pressed={!colorKey}
          aria-label="もとの色にする"
          style={{
            flex: "0 0 auto", minWidth: 52, minHeight: 60,
            borderRadius: 12, background: C.card,
            border: `${!colorKey ? 3 : 1}px solid ${!colorKey ? C.curtain : C.line}`,
            padding: !colorKey ? 2 : 4,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 4
          }}>
          <span aria-hidden="true"
            style={{
              width: 26, height: 26, borderRadius: 999,
              border: `1px solid ${C.line}`, background: C.paper,
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "0.75rem", color: C.inkSoft
            }}>／</span>
          <span style={{ fontSize: "0.625rem", color: C.inkSoft, lineHeight: 1.2 }}>もとの色</span>
        </button>

        {CLOTH_COLORS.map((c) => {
          const on = colorKey === c.key;
          return (
            <button key={c.key} type="button"
              onClick={() => pick(c.key)}
              aria-pressed={on}
              aria-label={c.name}
              style={{
                flex: "0 0 auto", minWidth: 52, minHeight: 60,
                borderRadius: 12, background: C.card,
                // ★選んでいるものは、★わくを太くします（★色だけにしません）。
                border: `${on ? 3 : 1}px solid ${on ? C.curtain : C.line}`,
                padding: on ? 2 : 4,
                display: "flex", flexDirection: "column", alignItems: "center", gap: 4
              }}>
              {/* ★★白っぽい色は、★紙の上で消えます。★濃い縁を付けます。
                  ★どの色に縁が要るかは lib/clothColors.js が決めます。 */}
              <span aria-hidden="true"
                style={{
                  width: 26, height: 26, borderRadius: 999,
                  background: swatchHex(c.key),
                  border: needsEdge(c.key)
                    ? `1.5px solid ${edgeHex(c.key)}`
                    : `1px solid rgba(0,0,0,0.10)`
                }} />
              {/* ★★名前も出します。★色だけで示さないこと。 */}
              <span style={{ fontSize: "0.625rem", color: C.inkSoft, lineHeight: 1.2, whiteSpace: "nowrap" }}>
                {c.name}
              </span>
            </button>
          );
        })}
      </div>
      )}
    </div>
  );
}
