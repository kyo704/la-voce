import { sheepItemByKey, sheepItemSrc, SHEEP_ASSET_BASE, SHEEP_BASE } from "@/lib/sheepItems";
import { interiorItemByKey, interiorSrc, placedKeys } from "@/lib/sheepInteriorV2";
import { HEAD_NOFACE, preloadList as facePreloadList } from "@/lib/sheepFace";

// ============================================================================
// ひつじの画面の 絵を、裏で 先に 読んでおく（2026-09-08 夜・案2）
//
//   ★★「はじめて ひつじタブを 開くと 1秒かかる」への 答えです。
//
//   ★★測った中身（★2026-09-08）
//     ★羊の土台（体＋顔なしの頭）　179KB
//     ★顔9枚　　　　　　　　　　　152KB
//     ★着ているもの　1点 平均 41KB（★最大8点）
//     ★置いている内装　1点 平均 17KB／床壁 1枚 平均 59KB
//     ★★ぜんぶで 20〜30枚、★700KB ほどです。
//
//   ★★一覧の 414点を、★先読みしません。★そこが 肝です。
//     ★★読むのは「★その方が いま着ている・置いている物」だけです。
//     ★一覧は 小さい絵（144×144・3.4KB）で、★見えたぶんだけ 読みます。
//
//   ★★手が空いたときに 読みます（requestIdleCallback）。
//     ★★記録の画面の じゃまを しません。
//     ★無ければ、★少し待ってから 読みます。
//
//   ★★1度だけです。★同じ絵を 2度 読みません。
//     ★ブラウザの 覚え書きにも 残るので、★開いたときには もう あります。
//
//   ★見張り components/tests/preload-room.test.js
// ============================================================================

/** ★裏で 読んでおく 絵の みちすじ。 */
export function roomAssetUrls(equipped) {
  const eq = equipped || {};
  const out = [];

  // ★★羊の 土台。★これは かならず 要ります。
  out.push(SHEEP_ASSET_BASE + SHEEP_BASE.body);
  out.push(HEAD_NOFACE);
  // ★★顔9枚。★まばたきの ときに 差し替えます。
  //   ★★切り替えの瞬間に 白が 出ないよう、★先に 読みます。
  for (const f of facePreloadList()) out.push(f);

  // ★★着ているもの。★着ていない部位は ありません。
  const wearing = eq.wardrobe || {};
  for (const slot of Object.keys(wearing)) {
    if (slot === "propSide") continue;
    const it = sheepItemByKey(wearing[slot]);
    if (!it) continue;
    const src = sheepItemSrc(it, slot === "prop" ? wearing.propSide : null);
    if (src) out.push(src);
  }

  // ★★置いている内装。★床壁も 入ります。
  // ★★入れ物（object）を、★for...of で まわさないこと。
  //   ★★2026-09-08 夜、★ここで 落ちました（★「is not iterable」）。
  //   ★平らにする所は、★lib が 1つ 持ちます（placedKeys）。
  for (const key of placedKeys(eq)) {
    const it = interiorItemByKey(key);
    if (it) out.push(interiorSrc(it));
  }

  // ★★同じ絵を 2度 数えません。
  return [...new Set(out.filter(Boolean))];
}

/**
 * ★裏で 読みます。
 *
 *   ★★手が空いたときに、★1枚ずつ。★まとめて 投げません。
 *     ★まとめて 投げると、★記録の画面の 読み込みと ぶつかります。
 *
 *   ★★もう 読んだものは、★2度 読みません。
 *   ★★止められます。★画面を 離れたら やめます。
 */
const done = new Set();

export function preloadUrls(urls, opts) {
  const o = opts || {};
  const list = (urls || []).filter((u) => u && !done.has(u));
  if (list.length === 0) return () => {};
  if (typeof window === "undefined") return () => {};

  let stopped = false;
  let i = 0;
  const idle = window.requestIdleCallback
    ? (fn) => window.requestIdleCallback(fn, { timeout: 2000 })
    // ★★無い ブラウザ（★Safari の 古い版）では、★少し待ってから 読みます。
    : (fn) => window.setTimeout(fn, 120);

  const step = () => {
    if (stopped || i >= list.length) return;
    const u = list[i++];
    done.add(u);
    const im = new window.Image();
    im.decoding = "async";
    im.src = u;
    if (typeof o.onEach === "function") o.onEach(u);
    idle(step);
  };
  idle(step);

  return () => { stopped = true; };
}
