"use client";

import { SHEEP_BASE, SHEEP_ASSET_BASE, sheepItemByKey, sheepItemSrc } from "@/lib/sheepItems";
import { LAYER_ORDER, PROP_SIDE_DEFAULT } from "@/lib/sheepWardrobe";

// ============================================================================
// 着せかえた羊（★絵を重ねます・2026-09-05 夜）
//
//   出どころ docs/assets/羊-着せかえ一式-読んでください（決定版11・217点）.md §1
//
//   ★★重ね順を、★変えないこと。
//     body → garment → neck → head → shoes → hat → prop
//     ★頭より前に服を描くと、★首が消えます。
//     ★順番は lib/sheepWardrobe.js が持ちます。★ここには書きません。
//
//   ★★絵は、★どれも 1024×1024 で、★同じ位置に描かれています。
//     ★だから、★重ねるだけで合います。★位置合わせは要りません。
//
//   ★SVG の羊（CharacterHome の SheepCharacter）は、★そのまま残します。
//     ★2026-09-05 の決め ── ★役目を分ける。
//     ★★同じ大きさで並べないこと。
// ============================================================================

export default function SheepDressed({ wearing = {}, size = 220, alt = "着せかえた羊" }) {
  // ★重ねる絵を、順番どおりに並べます。
  const layers = [];
  for (const slot of LAYER_ORDER) {
    if (slot === "body") {
      layers.push({ key: "body", src: SHEEP_ASSET_BASE + SHEEP_BASE.body });
      continue;
    }
    if (slot === "head") {
      layers.push({ key: "head", src: SHEEP_ASSET_BASE + SHEEP_BASE.head });
      continue;
    }
    const itemKey = wearing[slot];
    if (!itemKey) continue;
    const item = sheepItemByKey(itemKey);
    if (!item) continue;
    // ★持ち物だけ、★置き場所（左・まん中・右）があります。
    const side = slot === "prop" ? (wearing.propSide || PROP_SIDE_DEFAULT) : null;
    const src = sheepItemSrc(item, side);
    if (src) layers.push({ key: item.key + (side || ""), src, name: item.name });
  }

  return (
    <div
      role="img"
      aria-label={alt}
      style={{ position: "relative", width: size, height: size, flexShrink: 0 }}
    >
      {layers.map((l, i) => (
        // ★★同じ大きさで、同じ場所に重ねます。★ずらさないこと。
        <img
          key={l.key}
          src={l.src}
          alt=""
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "contain",
            // ★重ね順は、並べた順のままです。★z-index を足すと、崩れます。
            zIndex: i,
            pointerEvents: "none"
          }}
        />
      ))}
    </div>
  );
}
