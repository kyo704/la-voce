// ============================================================================
// 引き出しに、何を並べるか（2026-09-08）
//
//   ★出どころ docs/opus/woolsong-仕様-おうち画面の作り直し（9月8日）.md §3
//
//   ★★いままで、★品物の選び方が★3か所に分かれていました。
//     ★着せかえ（WardrobePanel）／内装（InteriorPanel）／古いお店（CharacterHome）
//   ★★同じ決めが3か所にあると、★片方だけ直す日が来ます。
//     ★特大窓ガラスも、★上下羽織り目元も、★その形の不具合でした。
//   ★★だから、★「何を並べるか」を、★ここ1か所にします。
//
//   ★★並べ替えは、★4つを巡回します（★§6）。
//     あたらしい順 → よく使う順 → 色の順 → 名前順 →（先頭へ）
//
//   ★見張り components/tests/home-drawer.test.js
// ============================================================================

import { withoutRetired } from "@/lib/retiredWardrobe";

/**
 * ★その大分類・中分類で、並べる品。
 *
 *   ★★ここは「選ぶ」だけです。★着せる・置くは、呼ぶ側の仕事です。
 *
 *   @param category  きるもの wear / おくもの place / かべ・ゆか surface / まど window
 *   @param tab       さいきん recent / おきにいり fav / ぜんぶ all / そのほかは置き場所
 *   @param ctx       { wearItems, interiorItems, marks, placed, tileSurfaceOf }
 */
export function itemsFor(category, tab, ctx) {
  const c = ctx || {};
  // ★★棚から下げた品は、★出しません（★2026-09-08 夜・scarf-v1）。
  //   ★★neck_01／02／03 は、★scarf_01〜28 に 置き換わりました。
  //   ★★消していません。★いま着ている方は、★そのまま 出ます（★外せるように）。
  //   ★決めは lib/retiredWardrobe.js が 持ちます。★ここでは 判じません。
  if (category === "wear") {
    return pick(withoutRetired(c.wearItems || [], (c.marks || {}).wardrobe),
      tab, c, (i) => i.slot);
  }
  if (category === "place") {
    return pick((c.interiorItems || []).filter(
      (i) => ["furniture", "showa", "wallart", "garden"].includes(i.category)), tab, c, (i) => i.category);
  }
  if (category === "surface") {
    const tiles = (c.interiorItems || []).filter((i) => i.category === "tile");
    const of = c.tileSurfaceOf || (() => null);
    return pick(tiles, tab, c, of);
  }
  if (category === "window") {
    return pick((c.interiorItems || []).filter(
      (i) => ["window", "view", "door"].includes(i.category)), tab, c, (i) => i.category);
  }
  // ★★「しまう」は、★置いてあるものだけを並べます。
  if (category === "store") return (c.placed || []);
  return [];
}

function pick(list, tab, ctx, groupOf) {
  if (tab === "all") return list;
  if (tab === "fav") {
    const fav = (ctx.marks && ctx.marks.favorites) || [];
    return list.filter((i) => fav.includes(i.key));
  }
  if (tab === "recent") return recent(list, ctx);
  return list.filter((i) => groupOf(i) === tab);
}

/**
 * ★さいきん使ったもの。
 *
 *   ★★「いつ着たか」は、★もう持っています（wearCounts の last）。
 *   ★★新しく数え直しません。★1か所で持ちます。
 *   ★★数を出しません。★並べるだけです。
 */
export const RECENT_LIMIT = 24;

export function recent(list, ctx) {
  const counts = (ctx && ctx.marks && ctx.marks.wearCounts) || {};
  return list
    .map((i) => ({ i, at: (counts[i.key] || {}).last || null }))
    .filter((x) => x.at)
    .sort((a, b) => String(b.at).localeCompare(String(a.at)))
    .slice(0, RECENT_LIMIT)
    .map((x) => x.i);
}

/**
 * ★並べ替え。
 *
 *   ★★どれも、★その方ご自身の記録だけを見ます。
 *     ★ほかの方の数を、★1つも混ぜません（★人気順を作らないこと）。
 */
export function sortItems(list, sort, ctx) {
  const c = ctx || {};
  const arr = [...(list || [])];
  const counts = (c.marks && c.marks.wearCounts) || {};
  const receivedAt = c.receivedAt || {};
  if (sort === "often") {
    // ★★ご自身が着た数です。★ほかの方の数ではありません。
    return arr.sort((a, b) => ((counts[b.key] || {}).n || 0) - ((counts[a.key] || {}).n || 0)
      || String(a.key).localeCompare(String(b.key)));
  }
  if (sort === "color") {
    // ★★色の順。★選んでいる色があれば、その順。★無ければ、名簿の順のまま。
    const order = c.colorOrder || [];
    const colorOf = c.colorOf || (() => null);
    const rank = (i) => {
      const k = colorOf(i.key);
      const n = k ? order.indexOf(k) : -1;
      return n < 0 ? 999 : n;
    };
    return arr.sort((a, b) => rank(a) - rank(b) || String(a.key).localeCompare(String(b.key)));
  }
  if (sort === "name") {
    return arr.sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), "ja"));
  }
  // ★あたらしい順。★受け取った日が分からないものは、うしろへ。
  return arr.sort((a, b) => {
    const x = receivedAt[a.key] || "", y = receivedAt[b.key] || "";
    if (x && y) return String(y).localeCompare(String(x));
    if (x) return -1;
    if (y) return 1;
    return 0;
  });
}
