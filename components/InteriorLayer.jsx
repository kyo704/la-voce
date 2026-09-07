"use client";

import {
  interiorOf, interiorItemByKey, interiorSrc, windowLayers,
  FLOOR_LINE_Y, isSingleSlot, WINDOW_INNER_RATIO
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
// ★★部屋の床は、★上から66%（＝下から34%）から下です。
//   ★CharacterHome の ROOM_FLOOR_LINE = 66 と、★同じ数です。
//   ★★2か所に書いています。★あちらを import できないため、
//     ★ここに書き、★検査で「同じ数であること」を見張ります。
const ROOM_FLOOR_BOTTOM_PCT = 34;

// ★部屋は、幅：高さ ＝ およそ 4：3。★横の％を、縦の％に直すときに使います。
const ROOM_ASPECT = 4 / 3;

const SPOT = {
  door: { left: 88, width: 16 },
  window: { left: 50, top: 13, width: 26 },
  wallart: { left: 20, top: 18, width: 12 },
  furniture: { left: 34, width: 22 },
  showa: { left: 62, width: 22 },
  garden: { left: 50, width: 15 }
};

/**
 * ★床に置くものの、置き場所。
 *
 *   ★★2026-09-08、★「0.18 を掛ける」という★根拠のない数で置いていました。
 *     ★実機で「浮いている」とご指摘をいただきました。★そのとおりです。
 *
 *   ★★正しい出し方。
 *     ★絵は 320 の高さで、★y300 が床の線。★下の20pxは余白です。
 *     ★絵を幅 w% で置くと、★高さも w%（★正方形なので）。
 *     ★★余白は、★その高さの (h - 300) / h。
 *       ★部屋の高さに直すと、★w × (h-300)/h ％ ぶん、下へ余ります。
 *     ★だから、★床の線から、★その分だけ下げて置きます。
 *
 *   @param item      置く品
 *   @param widthPct  部屋の幅に対する、絵の幅（％）
 */
function floorBottomPct(item, widthPct) {
  const size = item && item.size ? item.size : [320, 320];
  const [w, h] = size;
  // ★絵の高さは、★幅に対して h/w 倍。★部屋の幅の widthPct% を占めるので、
  //   ★部屋の幅に対する高さは widthPct * (h/w) ％です。
  //   ★★部屋は横長なので、★縦の％は、そのままでは使えません。
  //   ★ですが、余白の割合そのものは、★絵の中の比です。
  const padRatio = (h - FLOOR_LINE_Y) / h;      // ★絵の高さのうち、余白の割合
  const heightPct = widthPct * (h / w);          // ★部屋の幅に対する、絵の高さ
  // ★部屋は、幅：高さ ＝ およそ 4：3。★縦の％に直します。
  return ROOM_FLOOR_BOTTOM_PCT - padRatio * heightPct * ROOM_ASPECT;
}

export default function InteriorLayer({ equipped, wardrobeOn, editMode, onUpdatePosition, Draggable }) {
  // ★★門の外の方には、★1枚も出しません。
  //   ★ここで止めます。★呼ぶ側に任せないこと。
  if (!wardrobeOn) return null;
  const placed = interiorOf(equipped);

  // ★★壁と床は、★別のところに敷きます（★2026-09-08 の直し）。
  const wallTile = interiorItemByKey(placed.wallTile);
  const floorTile = interiorItemByKey(placed.floorTile);

  // ★★窓は、★2枚です（★景色 → 枠）。
  //   ★★片方だけでも出します。★選んだものは、そのまま出すこと。
  const win = windowLayers(placed);

  // ★★いくつでも置けるもの。
  const many = ["furniture", "showa", "garden", "wallart"]
    .flatMap((c) => (Array.isArray(placed[c]) ? placed[c] : [])
      .map((k) => interiorItemByKey(k))
      .filter(Boolean));

  const door = interiorItemByKey(placed.door);

  // ★★動かした位置（★2026-09-08・坂本さんの決め）。
  //   ★★いまの101点と、★同じ仕組みに乗せます（★handleUpdatePosition）。
  //     ★別の仕組みを作ると、★保存の形が2つになります。
  //   ★保存の場所は character_equipped.interiorPositions です。
  //   ★★動かしていないものは、★既定の場所に出ます。
  //     ★null のままにします。★いっせいに埋めません。
  const pos = (equipped && equipped.interiorPositions) || {};
  const spotOf = (it) => {
    const s = SPOT[it.category] || SPOT.furniture;
    const p = pos[it.key];
    return {
      left: p && typeof p.left === "number" ? p.left : s.left,
      top: p && typeof p.top === "number" ? p.top : null,
      width: s.width,
      wallTop: s.top
    };
  };

  return (
    <>
      {/* ★★壁のタイル。★壁のところ（上から66%まで）だけに敷きます。
          ★★2026-09-08、★部屋ぜんぶに敷いていました。
            ★だから、★床の柄を選ぶと、★壁まで変わっていました。
            ★実機でご指摘をいただきました。★そのとおりです。 */}
      {wallTile && (
        <div aria-hidden="true"
          style={{
            position: "absolute", left: 0, right: 0, top: 0,
            height: `${100 - ROOM_FLOOR_BOTTOM_PCT}%`, zIndex: 0,
            backgroundImage: `url(${interiorSrc(wallTile)})`,
            backgroundRepeat: "repeat", backgroundSize: "22%",
            pointerEvents: "none"
          }} />
      )}

      {/* ★★床のタイル。★床のところ（下から34%）だけに敷きます。 */}
      {floorTile && (
        <div aria-hidden="true"
          style={{
            position: "absolute", left: 0, right: 0, bottom: 0,
            height: `${ROOM_FLOOR_BOTTOM_PCT}%`, zIndex: 0,
            backgroundImage: `url(${interiorSrc(floorTile)})`,
            backgroundRepeat: "repeat", backgroundSize: "22%",
            pointerEvents: "none"
          }} />
      )}

      {/* ★★窓（★景色 → 枠の順）。★枠の中は抜けているので、景色が透けます。
          ★★2026-09-08、★枠と景色を、同じ幅・同じ位置で置いていました。
            ★枠は 384×384、景色は 480×320。★縦横比が違うので、そろいません。
            ★実機でご指摘をいただきました。★そのとおりです。
          ★★いまは、★景色を、★枠の内側（74%）に収めます。
          ★★そして、★2枚そろわなければ、★1枚も出しません（坂本さんの決め）。 */}
      {win.map((it) => {
        const isFrame = it.category === "window";
        // ★枠は、そのまま。★景色は、枠の内側に収めます。
        const w = isFrame
          ? SPOT.window.width
          : SPOT.window.width * WINDOW_INNER_RATIO;
        // ★枠の中心と、景色の中心を、そろえます。
        //   ★枠は正方形なので、★中心は top + 幅/2 の高さです。
        const centerTop = SPOT.window.top + SPOT.window.width * ROOM_ASPECT / 2;
        const vh = w * (it.size[1] / it.size[0]) * ROOM_ASPECT;
        return (
          <img key={it.key} src={interiorSrc(it)} alt="" aria-hidden="true"
            style={{
              position: "absolute",
              left: `${SPOT.window.left}%`,
              top: isFrame ? `${SPOT.window.top}%` : `${centerTop - vh / 2}%`,
              width: `${w}%`,
              transform: "translate(-50%, 0)",
              // ★景色が先（1）、枠があと（2）。★枠が上です。
              zIndex: isFrame ? 2 : 1,
              pointerEvents: "none"
            }} />
        );
      })}

      {/* ★扉。★320×512 で、★ほかより縦に長い絵です。 */}
      {door && (
        <img src={interiorSrc(door)} alt="" aria-hidden="true"
          style={{
            position: "absolute",
            left: `${SPOT.door.left}%`,
            bottom: `${floorBottomPct(door, SPOT.door.width)}%`,
            width: `${SPOT.door.width}%`,
            transform: "translate(-50%, 0)",
            zIndex: 1, pointerEvents: "none"
          }} />
      )}

      {/* ★★いくつでも置けるもの。★重ならないよう、少しずつずらします。
          ★★動かせるようにするのは、次の段です。
            ★いまは、置いた順に並べます。★消えるより、重なるほうがましです。 */}
      {many.map((it, i) => {
        const s = spotOf(it);
        const onWall = it.category === "wallart";
        // ★動かしていないものは、★重ならないよう、★少しずつずらします。
        const shift = pos[it.key] ? 0 : (i % 4) * 9 - 13;
        const left = s.left + shift;
        const top = s.top != null
          ? s.top
          : (onWall ? s.wallTop : null);
        const style = {
          position: "absolute",
          left: `${left}%`,
          ...(top != null
            ? { top: `${top}%` }
            : { bottom: `${floorBottomPct(it, s.width)}%` }),
          width: `${s.width}%`,
          transform: "translate(-50%, 0)",
          zIndex: onWall ? 1 : 2
        };
        const img = (
          <img src={interiorSrc(it)} alt="" aria-hidden="true"
            style={{ width: "100%", display: "block", pointerEvents: "none" }} />
        );
        // ★★動かせるのは、★置きかたを直しているときだけです。
        //   ★ふだんは押せません（★羊を押すのと、まぎれないため）。
        if (editMode && Draggable && onUpdatePosition) {
          return (
            <div key={it.key} style={style}>
              <Draggable
                itemKey={it.key}
                onDragEnd={(nl, nt) => onUpdatePosition("interior", it.key, nl, nt)}>
                {img}
              </Draggable>
            </div>
          );
        }
        return <div key={it.key} style={{ ...style, pointerEvents: "none" }}>{img}</div>;
      })}
    </>
  );
}

/** ★1つだけ置ける分類か（★画面から使います）。 */
export { isSingleSlot };
