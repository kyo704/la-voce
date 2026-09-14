// ============================================================================
// ★家具が 重なった ところで、★どれが 押しどころを 取って いるか
//
//   ★出どころ 2026-09-14、★坂本さん ──
//     「★動かしたい 家具の 手前に 別の 家具が あり、★実際に 触れて いるのに
//       ★手前の 家具の 判定が 優先されて 反応しない」
//
//   ★★これは「当たりが 狭い」とは 別の 話です。
//     ★★狭いのなら、★どこを 押しても 反応しません。
//     ★★取られて いるのなら、★押した ところで **別のものが** 反応します。
//
//   ★★この 道具は、★どちらかを 見分けます。★直しません。★測るだけ です。
//
//   ★使い方（★ブラウザの コンソール）
//     ① ひつじ →「配置を変える」を 押す
//     ② コンソールに この ファイルの 中身を 貼る
//     ③ diagnoseFurnitureOverlap(x, y) ── 押したい ところの 座標
//     ★または sweepRoom() ── ★部屋ぜんたいを 20px ごとに 見ます
//
//   ★名札（data-item-id）は components/CharacterHome.jsx:1631 が 出して います。
// ============================================================================

function diagnoseFurnitureOverlap(x, y) {
  const atPoint = document.elementsFromPoint(x, y);
  // ★★名札の ある もの だけ。★中の svg は 親を 見ます。
  const seen = new Set();
  const items = [];
  atPoint.forEach((el) => {
    const box = el.closest ? el.closest("[data-item-id]") : null;
    if (!box) return;
    const id = box.dataset.itemId;
    if (seen.has(id)) return;
    seen.add(id);
    items.push(box);
  });

  if (items.length === 0) {
    console.log(`(${x}, ${y}) ★家具は ありません`);
    return [];
  }
  if (items.length === 1) {
    console.log(`(${x}, ${y}) ★家具は 1つ … ${items[0].dataset.itemId}`);
    return items;
  }

  console.log(`(${x}, ${y}) ★${items.length}つ 重なって います`);
  items.forEach((el, i) => {
    const s = getComputedStyle(el);
    const r = el.getBoundingClientRect();
    // ★★絵が 本当に そこに あるか。★透明な ところを 押して いないか。
    const art = el.querySelector("svg, img");
    const ar = art ? art.getBoundingClientRect() : null;
    const insideArt = ar
      ? (x >= ar.left && x <= ar.right && y >= ar.top && y <= ar.bottom)
      : null;
    console.log(`  [${i}] ${i === 0 ? "★これが 反応します" : "　 うしろ"}`, {
      名: el.dataset.itemId,
      層: el.dataset.layer,
      zIndex: s.zIndex,
      pointerEvents: s.pointerEvents,
      DOMの順: Array.from(el.parentElement.children).indexOf(el),
      箱: { w: Math.round(r.width), h: Math.round(r.height) },
      "★絵の 中か": insideArt,
      "★中心からの 距離": Math.round(Math.hypot(x - (r.left + r.width / 2),
                                                 y - (r.top + r.height / 2)))
    });
  });

  // ★★いちばん 大事な 一行 ── ★取って いる ものが、★絵の 外か。
  const top = items[0];
  const art = top.querySelector("svg, img");
  if (art) {
    const ar = art.getBoundingClientRect();
    const inside = x >= ar.left && x <= ar.right && y >= ar.top && y <= ar.bottom;
    if (!inside) {
      console.warn("  ★★取って いる のは、★絵の 外側です（★透明な 箱）。"
        + " ★これが『押しても 反応しない』の 正体です。");
    }
  }
  return items;
}

/**
 * ★部屋ぜんたいを 見て、★「取られて いる」ところを 数えます。
 *
 *   ★★1点ずつ 押して 確かめるのは 大変です。
 *     ★★網の目に 当てて、★重なって いる ところを 一覧に します。
 */
function sweepRoom(step) {
  const s = Number(step) > 0 ? Number(step) : 20;
  const room = document.getElementById("room-anchor");
  if (!room) { console.log("★部屋が ありません"); return null; }
  const r = room.getBoundingClientRect();
  const hits = [];
  for (let y = r.top + 4; y < r.bottom - 4; y += s) {
    for (let x = r.left + 4; x < r.right - 4; x += s) {
      const at = document.elementsFromPoint(x, y);
      const seen = new Set();
      const items = [];
      at.forEach((el) => {
        const box = el.closest ? el.closest("[data-item-id]") : null;
        if (!box || seen.has(box.dataset.itemId)) return;
        seen.add(box.dataset.itemId);
        items.push(box);
      });
      if (items.length < 2) continue;
      const top = items[0];
      // ★★重ね順は、★外側の 入れ物（親）に 付いて います。
      const zOf = (el) => {
        const par = el.parentElement;
        const z = par ? getComputedStyle(par).zIndex : "auto";
        return z === "auto" ? 0 : Number(z);
      };
      const zs = items.map(zOf);
      const maxZ = Math.max.apply(null, zs);
      // ★★取って いる ものが、★いちばん 手前 では ない ── ★これが 不具合 です。
      const wrong = zOf(top) < maxZ;
      hits.push({ x: Math.round(x), y: Math.round(y),
        取る: top.dataset.itemId, z: zOf(top), 重なり: items.length,
        手前のz: maxZ, "★手前で ない ものが 取る": wrong,
        うしろ: items.slice(1).map((e) => e.dataset.itemId + "(z" + zOf(e) + ")").join(" ") });
    }
  }
  const wrongs = hits.filter((h) => h["★手前で ない ものが 取る"]);
  console.log("★掴みどころが 重なって いる 点 " + hits.length
    + " / ★そのうち 手前で ない ものが 取る " + wrongs.length);
  console.table((wrongs.length ? wrongs : hits).slice(0, 20));
  return { hits, stolen: wrongs };
}

if (typeof module !== "undefined") {
  module.exports = { diagnoseFurnitureOverlap, sweepRoom };
}
