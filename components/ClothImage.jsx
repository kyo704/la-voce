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

export default function ClothImage({ itemKey, colorKey, src, style, alt = "" }) {
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

  return (
    <img src={painted || src} alt={alt} aria-hidden={alt ? undefined : "true"} style={style} />
  );
}
