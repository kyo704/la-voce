"use client";

import { C } from "@/lib/tokens";
import {
  CLOTH_COLORS, swatchHex, edgeHex, needsEdge, isColorable, colorByKey
} from "@/lib/clothColors";
import { hasPattern, secondColor } from "@/lib/patternColors";
import { paintHex, hexToRgb } from "@/lib/clothColors";
import { SIZES, COPY } from "@/lib/homeDrawer";

// ============================================================================
// 服の色を、選ぶ帯 24色（2026-09-08）
//
//   ★出どころ docs/opus/色をかえるしくみ.png ①②③
//            docs/opus/woolsong-仕様-おうち画面の作り直し（9月8日）.md §8
//
//   ★★引き出しの いちばん下に、★1段 固定します（★§8-1）。
//     ★① 位置が動かない　★上に出すと、見ていた品を見失います
//     ★② 親指が届く　　　★片手で持ったとき、いちばん押しやすいのは 下です
//     ★③ 読む順と合う　　★引き出し → 部位 → 品 → 色
//
//   ★★「もとの」を、★いちばん前に置きます。★戻る道を、必ず残します。
//     ★作った方が決めた色も、★1つの色です。
//
//   ★★柄ものは、★左端に「がら ■■」と出します（★見本③）。
//     ★★2色目は、★選ばせません。★何色になるかだけ、見せます。
//
//   ★★見本に出すのは「狙う色」です（★swatchHex）。
//     ★実際に絵へ塗る値（pre）は、★様式のぶんを差し引いた別の値です。
//     ★見本に pre を出すと、★お客さまの目には 濁って見えます。
//
//   ★★数を、書きません。★「24色」と出さないこと。
//   ★★色の名前は、★読み上げに残します。★色だけで示さないためです。
//
//   ★見張り components/tests/cloth-colors.test.js
// ============================================================================

export default function ClothColorRow({ itemKey, itemSlot, colorKey, onChange }) {
  // ★★塗れない品のときは、★何も出しません。★灰色にして並べないこと。
  if (!itemKey || !isColorable(itemKey, itemSlot)) return null;

  const pick = (k) => { if (onChange) onChange(k); };
  const now = colorKey ? colorByKey(colorKey) : null;
  // ★★柄の2色目。★1色目から 表を引いて 決まります（★選ばせません）。
  //   ★見本③のとおり、★何色になるかだけを 見せます。
  const pat = hasPattern(itemKey)
    ? secondColor(itemKey, colorKey, hexToRgb, paintHex) : null;

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 6, width: "100%" }}>
      <span style={{ fontSize: "0.6875rem", color: C.inkSoft, flexShrink: 0 }}>いろ</span>

      {/* ★★「もとの」── ★いちばん前です。★戻る道を、必ず残します。 */}
      <button type="button"
        onClick={() => pick(null)}
        aria-pressed={!colorKey}
        aria-label="もとの色にする"
        style={{
          flexShrink: 0, minHeight: SIZES.swatchPx + 8, padding: "0 8px",
          borderRadius: SIZES.swatchRadiusPx,
          border: `${!colorKey ? 2 : 1}px solid ${!colorKey ? C.ink : C.line}`,
          background: C.card, color: C.inkSoft, fontSize: "0.625rem"
        }}>
        {COPY.colorNone}
      </button>

      {/* ★★柄もの ── ★2色目は 選ばせません。★何色になるかだけ、見せます。 */}
      {pat && (
        <span style={{ display: "flex", alignItems: "center", gap: 3, flexShrink: 0 }}>
          <span style={{ fontSize: "0.625rem", color: C.inkSoft }}>{COPY.colorPattern}</span>
          <span aria-hidden="true" style={{
            width: 12, height: 12, borderRadius: 2,
            background: `rgb(${pat[0]},${pat[1]},${pat[2]})`,
            border: `1px solid rgba(0,0,0,0.12)`
          }} />
        </span>
      )}

      <div style={{ display: "flex", gap: SIZES.swatchGapPx, overflowX: "auto", flex: 1 }}>
        {CLOTH_COLORS.map((c) => {
          const on = colorKey === c.key;
          return (
            <button key={c.key} type="button"
              onClick={() => pick(c.key)}
              aria-pressed={on}
              // ★★色の名前は、★読み上げに残します。★色だけで示さないためです。
              aria-label={c.name}
              style={{
                flexShrink: 0,
                width: SIZES.swatchPx, height: SIZES.swatchPx,
                borderRadius: SIZES.swatchRadiusPx,
                background: swatchHex(c.key),
                // ★★選んでいるものは、★枠を太くして、少し大きくします（★§8-5）。
                border: on
                  ? `3px solid ${C.ink}`
                  : (needsEdge(c.key) ? `1.5px solid ${edgeHex(c.key)}` : "1px solid rgba(0,0,0,0.10)"),
                transform: on ? "scale(1.16)" : "none",
                padding: 0
              }} />
          );
        })}
      </div>
    </div>
  );
}
