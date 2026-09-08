"use client";

import { useEffect, useState } from "react";
import { paintCloth, paintedUrl } from "@/lib/clothPaint";

// ============================================================================
// 色を塗った服の絵、1枚（2026-09-08）
//
//   ★★色を選んでいなければ、★もとの絵を、そのまま出します。
//     ★もとの絵は、★作った方が決めた色です。★それも1つの色です。
//
//   ★★塗るのに、少しかかります。★そのあいだ、★空にしません。
//     ★もとの絵を出しておいて、★塗れたら差し替えます。
//     ★★真っ白にしないこと。★消えたように見えます。
//
//   ★★塗れなかったときも、★もとの絵のままです。★何も壊れません。
//
//   ★見張り components/tests/cloth-colors.test.js
// ============================================================================

/**
 * ★塗った絵の在りか。★塗れるまでは null。
 *
 *   ★★2026-09-08 夕、★靴だけ 色が変わらない、とご報告をいただきました。
 *     ★★靴は、★左右に切って 脚と一緒に振るため、★svg の枝で 描いています。
 *       ★そちらは ClothImage を通らないので、★色が乗りませんでした。
 *   ★★だから、★塗る仕組みを ここに出します。★2つの枝が、同じものを使います。
 */
export function usePaintedSrc(itemKey, colorKey) {
  // ★もう塗ってあるなら、★はじめから、それを出します（★ちらつかせないため）。
  const [painted, setPainted] = useState(() =>
    (itemKey && colorKey) ? paintedUrl(itemKey, colorKey) : null);

  useEffect(() => {
    let alive = true;
    if (!itemKey || !colorKey) { setPainted(null); return; }
    const have = paintedUrl(itemKey, colorKey);
    if (have) { setPainted(have); return; }
    setPainted(null);
    paintCloth(itemKey, colorKey)
      .then((u) => { if (alive) setPainted(u || null); })
      // ★塗れなくても、★黙って、もとの絵のままにします。
      .catch(() => {});
    return () => { alive = false; };
  }, [itemKey, colorKey]);

  return painted;
}

export default function ClothImage({ itemKey, colorKey, src, style, alt = "" }) {
  const painted = usePaintedSrc(itemKey, colorKey);
  return (
    <img src={painted || src} alt={alt} aria-hidden={alt ? undefined : "true"} style={style} />
  );
}

/**
 * ★靴の1枚（★svg の中）。
 *
 *   ★★靴は、★左右に切って、★それぞれの脚と一緒に振ります。
 *     ★だから img ではなく、★svg の image で描いています。
 *   ★★色の塗り方は、★上と まったく同じです。
 */
export function ClothShoeImages({ itemKey, colorKey, src, sides, clipId, dy }) {
  const painted = usePaintedSrc(itemKey, colorKey);
  const href = painted || src;
  return sides.map(([side, cx, groupStyle]) => (
    <g key={side} className="sheep-leg" style={groupStyle}>
      <image href={href} x="0" y={dy} width="1024" height="1024"
        clipPath={`url(#shoe${side}-${clipId})`} />
    </g>
  ));
}
