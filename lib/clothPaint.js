"use client";

import { layerSrc, paintHex, hexToRgb, isColorable } from "@/lib/clothColors";
// ★柄の2色目と、型。★決めは、あちらが持ちます。
import { secondColor, hasPattern, maskSrc } from "@/lib/patternColors";

// ============================================================================
// 服に、色を塗ります（2026-09-08）
//
//   ★出どころ assets/color-2layer/…（9月8日）.zip の README.md
//
//   ★★式は lib/clothColors.js が持ちます。★ここは、絵に当てるだけです。
//       out = (light − dark) × col / 255 + dark
//       アルファは light のもの
//
//   ★★なぜ canvas なのか。
//     ★CSS の混ぜ方（mix-blend-mode）では、★この式を作れません。
//       ★「かけ算」も「足し算」も在りますが、★2つの絵から
//       ★1画素ずつ、★別々の係数で混ぜることができません。
//     ★SVG の filter でもできますが、★品ごとに定義が要り、
//       ★かえって読みにくくなります。
//
//   ★★塗った絵は、★とっておきます（★何度も塗らないため）。
//     ★★これは絵の作り置きであって、★お客さまのものではありません。
//       ★だから、★いっぱいになったら、★古いものから捨ててよいのです。
//       ★（★お客さまが受け取ったもの・書いたものは、★決して捨てません。
//         ★その決めは、この作り置きには当てはまりません。）
//
//   ★見張り components/tests/cloth-colors.test.js
// ============================================================================

// ★塗る大きさ。★羊は画面で 260px ほど、★倍の細かさの画面でも 520px です。
//   ★★1024 のまま塗ると、★1枚あたり 4MB を持つことになります。
//   ★512 で塗って、★小さく出します。★見た目は変わりません。
const PAINT_SIZE = 512;

// ★作り置きの数。★これを超えたら、★いちばん古いものを捨てます。
const CACHE_MAX = 24;

// ★鍵は「品の鍵:色の鍵」。★値は blob の在りか。
const cache = new Map();
// ★塗っている途中のもの。★同じものを2回塗らないため。
const inFlight = new Map();
// ★2枚の絵。★品ごとに1度だけ読みます。
const imgCache = new Map();

export function cacheKey(itemKey, colorKey) {
  return itemKey + ":" + colorKey;
}

/** ★もう塗ってあるか。★あれば、その在りかを返します（★待ちません）。 */
export function paintedUrl(itemKey, colorKey) {
  const k = cacheKey(itemKey, colorKey);
  if (!cache.has(k)) return null;
  // ★使ったものを、いちばん新しい側へ move します（★捨てる順のため）。
  const v = cache.get(k);
  cache.delete(k);
  cache.set(k, v);
  return v;
}

function remember(key, url) {
  cache.set(key, url);
  while (cache.size > CACHE_MAX) {
    const oldest = cache.keys().next().value;
    const u = cache.get(oldest);
    cache.delete(oldest);
    // ★取っておいた場所を、★返します。★返さないと、たまり続けます。
    if (u && typeof URL !== "undefined" && URL.revokeObjectURL) URL.revokeObjectURL(u);
  }
}

function loadImage(src) {
  if (imgCache.has(src)) return imgCache.get(src);
  const p = new Promise((resolve, reject) => {
    const im = new Image();
    im.onload = () => resolve(im);
    im.onerror = () => reject(new Error("読めません: " + src));
    im.src = src;
  });
  imgCache.set(src, p);
  return p;
}

/**
 * ★塗ります。
 *
 *   ★★README の式を、★1画素ずつ当てます。
 *     out.r = (light.r − dark.r) × col.r / 255 + dark.r
 *     out.a = light.a
 *
 *   ★★ボーダーの白い縞も、★チェックの柄も、★ボタンも、そのまま残ります。
 *     ★light と dark の差が小さいところは、★色が乗りません。
 *     ★それが「柄」です。★式が、そのまま守ってくれます。
 */
export async function paintCloth(itemKey, colorKey) {
  if (!isColorable(itemKey) || !colorKey) return null;
  const k = cacheKey(itemKey, colorKey);
  const done = paintedUrl(itemKey, colorKey);
  if (done) return done;
  if (inFlight.has(k)) return inFlight.get(k);

  const hex = paintHex(colorKey);
  if (!hex) return null;

  const job = (async () => {
    // ★★柄ものは、★3枚目（型）も読みます。
    const patterned = hasPattern(itemKey);
    const [light, dark, mask] = await Promise.all([
      loadImage(layerSrc(itemKey, "light")),
      loadImage(layerSrc(itemKey, "dark")),
      patterned ? loadImage(maskSrc(itemKey)).catch(() => null) : Promise.resolve(null)
    ]);
    const n = PAINT_SIZE;
    const cv = document.createElement("canvas");
    cv.width = n; cv.height = n;
    const ctx = cv.getContext("2d", { willReadFrequently: true });

    ctx.clearRect(0, 0, n, n);
    ctx.drawImage(light, 0, 0, n, n);
    const L = ctx.getImageData(0, 0, n, n);

    ctx.clearRect(0, 0, n, n);
    ctx.drawImage(dark, 0, 0, n, n);
    const D = ctx.getImageData(0, 0, n, n);

    // ★★柄の型（★3枚目）。★灰色階調1枚です。
    //   ★★型の濃さのぶんだけ、★2色目を足します。
    //     出す色 ＝ dark ＋（light − dark）/255 × 色1 ＋ ★型/255 × 色2
    let M = null, c2 = null;
    if (mask) {
      ctx.clearRect(0, 0, n, n);
      ctx.drawImage(mask, 0, 0, n, n);
      M = ctx.getImageData(0, 0, n, n);
      // ★★2色目は、★1色目から 表を引いて 決めます（★2026-09-08・正本の表）。
      //   ★★お客さまには、選ばせません。
      //   ★1色目を選んでいないとき（★もとの色）は、焼かれた色のままです。
      c2 = secondColor(itemKey, colorKey, hexToRgb, paintHex);
    }

    const [cr, cg, cb] = hexToRgb(hex);
    const a = L.data, b = D.data;
    const md = M ? M.data : null;
    for (let i = 0; i < a.length; i += 4) {
      // ★★透けているところは、触りません。★そのまま透けたままです。
      if (a[i + 3] === 0) continue;
      let r = (a[i]     - b[i])     * cr / 255 + b[i];
      let g = (a[i + 1] - b[i + 1]) * cg / 255 + b[i + 1];
      let bl = (a[i + 2] - b[i + 2]) * cb / 255 + b[i + 2];
      if (md && c2) {
        // ★★型は灰色階調です。★どの通り道も同じ値なので、1つだけ読みます。
        const t = md[i] / 255;
        if (t > 0) {
          r += t * c2[0];
          g += t * c2[1];
          bl += t * c2[2];
        }
      }
      a[i]     = r < 0 ? 0 : (r > 255 ? 255 : r);
      a[i + 1] = g < 0 ? 0 : (g > 255 ? 255 : g);
      a[i + 2] = bl < 0 ? 0 : (bl > 255 ? 255 : bl);
      // ★アルファは light のまま。★書き替えません。
    }
    ctx.putImageData(L, 0, 0);

    const url = await new Promise((res) => {
      if (cv.toBlob) cv.toBlob((bl) => res(bl ? URL.createObjectURL(bl) : cv.toDataURL()), "image/png");
      else res(cv.toDataURL());
    });
    remember(k, url);
    return url;
  })().finally(() => { inFlight.delete(k); });

  inFlight.set(k, job);
  return job;
}
