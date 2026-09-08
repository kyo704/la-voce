import { boxOf, BOX_DRESSUP } from "@/lib/wardrobeBoxes";

// ============================================================================
// 年払いの 244点を、一度に お届けする（2026-09-08 夜）
//
//   ★出どころ 2026-09-08・坂本さんのお決め
//     ★① 244点は、★いまある箱3から 渡します
//     ★② 箱3は「★着せかえだけ」です（★287点）。★内装は 入れません
//     ★③ 古いお店101点は、★含めません
//     ★★内装の 箱分けは、★11月以降に 落ち着いて 進めます
//
//   ★★かたよらない ように 選びます。
//     ★箱3 287点の 部位ごとの 数に あわせて、★同じ比で 配ります。
//       garment 65／hat 46／neck 38／top 37／prop 33／outer 26／
//       bottom 24／shoes 14／eyes 4
//     ★★はじめ 290 と 数えました。★誤りでした。
//       ★UNLOCKS を 荒く 拾っていました。★boxOf に 通すと 287 です。
//     ★★「上ばかり 244点」に なりません。
//
//   ★★重複を 避けます。
//     ★もう 持っている品は、★渡しません。
//     ★★数えるのは「★その方が 箱3を 何点 持っているか」です。
//       ★244点 持っている状態に なるまで 渡します。
//       ★★すでに 50点 持っていれば、★渡すのは 194点です。
//       ★2度 申し込んでも、★2度は 渡しません。
//
//   ★★選び方に 運を 使いません。
//     ★★Math.random を 使いません。★同じ人・同じ持ち物なら、★同じ結果です。
//       ★確かめられない配り方は、★間違っていても 気づけません。
//
//   ★見張り components/tests/yearly-delivery.test.js
// ============================================================================

/** ★年払いで お届けする 点数。 */
export const YEARLY_TOTAL = 244;

/**
 * ★箱3（お金の箱）の 鍵。
 *
 *   ★★着せかえの名簿から 引きます。★内装は 見ません（★②の決め）。
 *   ★★箱1（記念）と 箱2（記録で交換）は、★入りません。
 */
export function box3Keys(wearItems) {
  return (wearItems || [])
    .filter((i) => i && i.slot && boxOf(i) === BOX_DRESSUP)
    .map((i) => i.key);
}

/**
 * ★部位ごとに 分けます。
 *
 *   ★★並びは、★名簿の順の ままです。★並べ替えません。
 *     ★並べ替えると、★名簿が 変わるたびに 中身が 変わります。
 */
function bySlot(wearItems, keys) {
  const set = new Set(keys);
  const out = new Map();
  for (const i of wearItems || []) {
    if (!set.has(i.key)) continue;
    if (!out.has(i.slot)) out.set(i.slot, []);
    out.get(i.slot).push(i.key);
  }
  return out;
}

/**
 * ★お届けする 鍵を、決めます。
 *
 *   @param wearItems 着せかえの名簿
 *   @param ownedKeys もう 持っている鍵
 *   @param total     何点に するか（★既定 244）
 *   @returns { deliver, already, short }
 *     deliver ★これから 渡す鍵
 *     already ★もう 持っている 箱3の 点数
 *     short   ★足りない点数（★箱3が 尽きたとき。★ふつうは 0）
 */
export function planYearlyDelivery(wearItems, ownedKeys, total) {
  const want = typeof total === "number" ? total : YEARLY_TOTAL;
  const pool = box3Keys(wearItems);
  const owned = new Set(ownedKeys || []);
  const already = pool.filter((k) => owned.has(k)).length;
  const need = Math.max(0, want - already);
  if (need === 0) return { deliver: [], already, short: 0 };

  // ★★部位ごとに、★箱3の 数の 比で 割ります。
  const groups = bySlot(wearItems, pool);
  const rest = new Map();
  for (const [slot, keys] of groups) rest.set(slot, keys.filter((k) => !owned.has(k)));

  // ★★部位ごとの 取り分を、先に 決めます（★最大剰余法）。
  //   ★★1つずつ まわして 取る形は、★誤りでした。
  //     ★小さい部位（目元4・くつ14）が 先に 尽き、
  //     ★★大きい部位（全身66）が 取り残されます。
  //     ★実際、★全身は 55点 あるべきところ 36点でした。
  //   ★★束の中の 割合を、★そのまま 写します。
  //     ★端数は、★いちばん惜しい部位から 1点ずつ 足します。
  const slots = [...rest.keys()];
  const share = new Map();
  let assigned = 0;
  const frac = [];
  for (const slot of slots) {
    const n = (groups.get(slot) || []).length;
    const exact = need * n / pool.length;
    const base = Math.floor(exact);
    share.set(slot, base);
    assigned += base;
    frac.push([slot, exact - base]);
  }
  frac.sort((a2, b2) => (b2[1] - a2[1]) || (a2[0] < b2[0] ? -1 : 1));
  for (let i = 0; assigned < need && i < frac.length; i++) {
    share.set(frac[i][0], share.get(frac[i][0]) + 1);
    assigned += 1;
  }

  const deliver = [];
  // ★★取り分の ぶんだけ、★名簿の順に 取ります。
  for (const slot of slots) {
    const ks = rest.get(slot) || [];
    const take = Math.min(share.get(slot) || 0, ks.length);
    for (let i = 0; i < take; i++) deliver.push(ks.shift());
    rest.set(slot, ks);
  }
  // ★★取り分に 足りなかった ぶんは、★残っている部位から 補います。
  //   ★★もう 持っている品が 多いと、★その部位だけ 早く 尽きます。
  //   ★そのときに 黙って 減らしません。★244点に なるまで 補います。
  while (deliver.length < need) {
    const left = slots.filter((s2) => (rest.get(s2) || []).length > 0)
      .sort((a2, b2) => ((rest.get(b2).length - rest.get(a2).length)
        || (a2 < b2 ? -1 : 1)));
    if (left.length === 0) break;
    const ks = rest.get(left[0]);
    deliver.push(ks.shift());
    rest.set(left[0], ks);
  }
  return { deliver, already, short: Math.max(0, need - deliver.length) };
}
