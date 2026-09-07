"use client";

import {
  interiorOf, interiorItemByKey, interiorSrc, windowLayers,
  FLOOR_LINE_Y, isSingleSlot
} from "@/lib/sheepInteriorV2";

// ============================================================================
// おうちの内装 120点を、部屋に置きます（2026-09-08）
//
//   ★出どころ zip の中の acnh/interior/README.md
//
//   ★★いまの101点の見え方を、★1つも変えません。
//     ★あちらは CharacterHome が描いています。★触りません。
//     ★★これは、★その上に重ねる、★別の層です。
//     ★門（wardrobeOn）の外の方には、★1枚も出ません。
//
//   ★★大きさが5種類あります。★1024の1種類ではありません。
//     ★だから、★1つずつ、★その絵の高さで置き場所を出します。
//
//   ★★床の線は y300（★320の絵のうち）。★下の20pxは余白です。
//     ★「床のラインに y300 を合わせて置いてください。全点そろえてあります」
//     ★だから、★下端ではなく、★y300 を床に合わせます。
//
//   ★見張り components/tests/sheep-interior-v2.test.js
// ============================================================================

/**
 * ★部屋の中の、置き場所（★％）。
 *
 *   ★★数を、ここ1か所で持ちます。★画面のあちこちに書かないこと。
 *   ★いまは決め打ちです。★動かせるようにするのは、次の段です。
 */
const SPOT = {
  door: { left: 88, bottom: 34, width: 18 },
  window: { left: 50, top: 14, width: 30 },
  wallart: { left: 22, top: 16, width: 14 },
  furniture: { left: 34, bottom: 34, width: 24 },
  showa: { left: 62, bottom: 34, width: 24 },
  garden: { left: 50, bottom: 34, width: 16 }
};

/**
 * ★床に置くものの、下の余白ぶんを差し引きます。
 *
 *   ★絵の高さのうち、★y300 より下が余白です。
 *   ★★下端を床に合わせると、★その余白のぶん、★浮いて見えます。
 */
function floorBottomPct(item, spotBottom) {
  const h = item && item.size ? item.size[1] : 320;
  const pad = ((h - FLOOR_LINE_Y) / h) * 100;   // ★絵の高さに対する、余白の割合
  return spotBottom - pad * 0.18;               // ★部屋の高さに直します（およそ）
}

export default function InteriorLayer({ equipped, wardrobeOn }) {
  // ★★門の外の方には、★1枚も出しません。
  //   ★ここで止めます。★呼ぶ側に任せないこと。
  if (!wardrobeOn) return null;
  const placed = interiorOf(equipped);

  // ★★壁と床のタイルは、★敷き詰めです。★1枚ずつ置くものではありません。
  const tile = interiorItemByKey(placed.tile);

  // ★★窓は、★2枚です（★景色 → 枠）。
  //   ★★片方だけでも出します。★選んだものは、そのまま出すこと。
  const win = windowLayers(placed);

  // ★★いくつでも置けるもの。
  const many = ["furniture", "showa", "garden", "wallart"]
    .flatMap((c) => (Array.isArray(placed[c]) ? placed[c] : [])
      .map((k) => interiorItemByKey(k))
      .filter(Boolean));

  const door = interiorItemByKey(placed.door);

  return (
    <>
      {/* ★★壁と床のタイル。★いちばん後ろです。
          ★256×256 の継ぎ目のない絵なので、★敷き詰めます。 */}
      {tile && (
        <div aria-hidden="true"
          style={{
            position: "absolute", inset: 0, zIndex: 0,
            backgroundImage: `url(${interiorSrc(tile)})`,
            backgroundRepeat: "repeat",
            backgroundSize: "22%",
            opacity: 0.95, pointerEvents: "none"
          }} />
      )}

      {/* ★★窓（★景色 → 枠の順）。★枠の中は抜けているので、景色が透けます。 */}
      {win.map((it, i) => (
        <img key={it.key} src={interiorSrc(it)} alt="" aria-hidden="true"
          style={{
            position: "absolute",
            left: `${SPOT.window.left}%`, top: `${SPOT.window.top}%`,
            width: `${SPOT.window.width}%`,
            transform: "translate(-50%, 0)",
            // ★景色が先、枠があと。★windowLayers が、その順で返します。
            zIndex: 1 + i,
            pointerEvents: "none"
          }} />
      ))}

      {/* ★扉。★320×512 で、★ほかより縦に長い絵です。 */}
      {door && (
        <img src={interiorSrc(door)} alt="" aria-hidden="true"
          style={{
            position: "absolute",
            left: `${SPOT.door.left}%`, bottom: `${SPOT.door.bottom}%`,
            width: `${SPOT.door.width}%`,
            transform: "translate(-50%, 0)",
            zIndex: 1, pointerEvents: "none"
          }} />
      )}

      {/* ★★いくつでも置けるもの。★重ならないよう、少しずつずらします。
          ★★動かせるようにするのは、次の段です。
            ★いまは、置いた順に並べます。★消えるより、重なるほうがましです。 */}
      {many.map((it, i) => {
        const s = SPOT[it.category] || SPOT.furniture;
        const shift = (i % 4) * 9 - 13;
        const onWall = it.category === "wallart";
        return (
          <img key={it.key} src={interiorSrc(it)} alt="" aria-hidden="true"
            style={{
              position: "absolute",
              left: `${s.left + shift}%`,
              ...(onWall
                ? { top: `${s.top}%` }
                : { bottom: `${floorBottomPct(it, s.bottom)}%` }),
              width: `${s.width}%`,
              transform: "translate(-50%, 0)",
              zIndex: onWall ? 1 : 2,
              pointerEvents: "none"
            }} />
        );
      })}
    </>
  );
}

/** ★1つだけ置ける分類か（★画面から使います）。 */
export { isSingleSlot };
