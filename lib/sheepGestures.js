// ============================================================================
// 羊の しぐさ（第1段・2026-09-08 夜）
//
//   ★出どころ 2026-09-08・実機のご報告「羊が 歩くだけに 見える」
//
//   ★★立ち止まっている あいだに、★ときどき 体を 動かします。
//     ★のび／あくび／足ぶみ／見まわす。
//
//   ★★絵を 1枚も 増やしません。★CSS で 体を 動かすだけです。
//     ★★羊の顔の 禁じられていること 5番と 同じ考えです。
//       「★体の動きのために 顔を増やさない。★CSS transform でやる」
//
//   ★★歩いている・すわっている・眠っている あいだは しません。
//     ★立ち止まっている ときだけです。
//   ★★動きを 減らす設定の方には しません。
//   ★★見えていないときは しません（document.hidden）。
//
//   ★★体調にも 記録にも、★1つも 関わりません。
//     ★★羊は「記録した行為」に 反応し、「記録の中身」には 反応しません。
//     ★しぐさは、★ただ 生きている ということだけです。
//
//   ★見張り components/tests/sheep-gestures.test.js
// ============================================================================

/**
 * ★しぐさ。★名前は CSS の @keyframes と 同じです。
 *
 *   ★★長さは、★短めに します。★長いと「固まった」に 見えます。
 */
export const GESTURES = Object.freeze([
  { key: "stretch", ms: 1400, label: "のび" },
  { key: "yawn", ms: 1200, label: "あくび" },
  { key: "step", ms: 1100, label: "足ぶみ" },
  { key: "lookAround", ms: 1600, label: "見まわす" }
]);

/** ★つぎの しぐさまでの 間（★12〜25秒）。 */
export const GESTURE_MIN_MS = 12000;
export const GESTURE_MAX_MS = 25000;

/** ★直近いくつを 避けるか。★2つ 続けて 同じは しません。 */
export const AVOID_RECENT = 2;

export function nextGestureMs(random) {
  const r = typeof random === "function" ? random() : Math.random();
  return GESTURE_MIN_MS + r * (GESTURE_MAX_MS - GESTURE_MIN_MS);
}

/**
 * ★つぎの しぐさを 1つ えらびます。
 *
 *   ★★直近2つは 出しません。★同じものが 続くと、★仕掛けが 見えます。
 */
export function pickGesture(recent, random) {
  const hist = Array.isArray(recent) ? recent.slice(0, AVOID_RECENT) : [];
  const fresh = GESTURES.filter((g) => !hist.includes(g.key));
  const pool = fresh.length > 0 ? fresh : GESTURES;
  const r = typeof random === "function" ? random() : Math.random();
  return pool[Math.floor(r * pool.length) % pool.length];
}

/** ★出したものを 積みます。 */
export function pushRecent(recent, key) {
  const list = Array.isArray(recent) ? recent : [];
  if (!key) return list;
  return [key, ...list.filter((x) => x !== key)].slice(0, AVOID_RECENT);
}

/** ★しぐさを してよい ときか。 */
export function mayGesture({ isWalking, isSitting, isLying }) {
  return !isWalking && !isSitting && !isLying;
}
