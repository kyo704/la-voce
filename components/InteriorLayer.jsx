"use client";

import { fallbackToPng } from "@/lib/imageFormat";
import {
  interiorOf, interiorItemByKey, interiorSrc, windowLayers,
  floorLineOf, widthPctOf, flushRightLeftPct, isSingleSlot, windowHoleMask,
  FLOOR_BAND, WALL_BAND, LEFT_BAND, clampToBand,
  placementOf, anchorOf, zOf, zIndexOf,
  CEILING_TOP_PCT, WALL_CENTER_PCT, TABLETOP_FEET_PCT
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

/**
 * ★置き場所（★左右の位置と、壁のものの高さ）。
 *
 *   ★★大きさ（width）は、★ここでは決めません（★2026-09-08 の直し）。
 *     ★★分類ごとに 22／15／12／16／26 と決め打ちしていました。
 *       ★どれも同じ 320 の絵なのに、★庭だけ小さく出ていました。
 *     ★いまは widthPctOf(item) が、★絵の幅から出します。
 *
 *   ★★扉は、★壁ぎわに寄せます。★中身は x14〜306（320の絵）なので、
 *     ★絵の幅の半分だけ内側に置けば、★右の壁に接します。
 */
const SPOT = {
  // ★★扉の left は、★flushRightLeftPct が出します（★中身の端を壁に合わせるため）。
  //   ★ここには書きません。★書くと、また余白のぶん浮きます。
  door: {},
  window: { left: 50, top: 13 },
  wallart: { left: 20, top: 18 },
  furniture: { left: 34 },
  showa: { left: 62 },
  garden: { left: 50 }
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
/**
 * ★足もとを、その高さに置いたときの bottom（★％）。
 *
 *   ★★落とした先に、★足もとが来るようにします。
 *   ★絵の下にある余白は、★ここで差し引きます。
 */
function bottomForFeet(item, widthPct, feetPct) {
  const size = item && item.size ? item.size : [320, 320];
  const [w, h] = size;
  const padRatio = (h - floorLineOf(item)) / h;
  const heightPct = widthPct * (h / w);
  return (100 - feetPct) - padRatio * heightPct * ROOM_ASPECT;
}

function floorBottomPct(item, widthPct) {
  const size = item && item.size ? item.size : [320, 320];
  const [w, h] = size;
  // ★★床に着く線は、★1点ずつ実測した値を使います（★2026-09-08 の直し）。
  //   ★★どの絵も y300 だとして置いていました。★そろっていませんでした。
  //     ★扉は 512 の絵で、★床の線は 503。★300 を当てると、2割ちかく浮きます。
  //   ★実機で「扉が壁に接していない」とご指摘をいただきました。
  const padRatio = (h - floorLineOf(item)) / h;  // ★絵の高さのうち、床より下の余白
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

  // ★★窓は、★いつも1組です（★選んでいないほうは、既定で埋まります）。
  //   ★重ね順は windowLayers が決めます（★景色 → 枠）。
  const win = windowLayers(placed);
  const view = win.find((x) => x.category === "view") || null;
  const frame = win.find((x) => x.category === "window") || null;

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
      // ★壁のものの上端（★古い自由な位置も、ここに入ります）
      top: p && typeof p.top === "number" ? p.top : null,
      // ★★床のものの足もと。★新しく足した値です。
      //   ★★古い top は、★ここに読み替えません。★意味が違います。
      feet: p && typeof p.feet === "number" ? p.feet : null,
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
            height: `${100 - ROOM_FLOOR_BOTTOM_PCT}%`, zIndex: zIndexOf(zOf(wallTile), 0),
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
            height: `${ROOM_FLOOR_BOTTOM_PCT}%`, zIndex: zIndexOf(zOf(floorTile), 0),
            backgroundImage: `url(${interiorSrc(floorTile)})`,
            backgroundRepeat: "repeat", backgroundSize: "22%",
            pointerEvents: "none"
          }} />
      )}

      {/* ★★窓 ── ★枠1枚と、★その穴にはめた景色。
          ★★2026-09-08（夕）、★「枠と景色が、まるで合っていない」と
            ★ご指摘をいただきました。★そのとおりでした。
          ★★もとは「枠の幅 × 0.74」で景色を置いていました。
            ★★13枚の穴を実測したところ、★どれも違いました。
              ふつうの枠　0.805〜0.867
              window_09 　0.617（★小さい丸窓）
              window_11 　幅0.867 × ★高0.302（★低くて横長）
              window_10 　★穴ではなく、すりガラス（半透明）
            ★★「割合を1つ」では、★合うはずがありませんでした。
          ★★いまは、★穴の四角に、★景色を切り抜いてはめます。
            ★景色は 480×320、★穴は正方形のこともあります。
            ★★引き伸ばしません。★はみ出しを切ります（★object-fit: cover）。
              ★引き伸ばすと、★空も山も ゆがみます。
          ★穴の場所は、★名簿に入っています（lib/sheepInteriorV2.js）。
            ★★ここで数を書かないこと。 */}
      {frame && (() => {
        const w = widthPctOf(frame);
        return (
          <div aria-hidden="true"
            style={{
              position: "absolute",
              left: `${SPOT.window.left}%`,
              top: `${SPOT.window.top}%`,
              width: `${w}%`,
              // ★★枠は正方形の絵です。★高さは、CSS に出させます。
              aspectRatio: `${frame.size[0]} / ${frame.size[1]}`,
              transform: "translate(-50%, 0)",
              zIndex: zIndexOf(zOf(frame), 0), pointerEvents: "none"
            }}>
            {/* ★★景色は、★枠の「抜けているところ」だけに 出します。
                ★★2026-09-08、★3回 直しました。
                  ★① 穴の「四角」で切る　→ ★丸い枠で、四隅に はみ出しました
                  ★② 枠の絵を 型にする　→ ★枠の外も透けているので、そこにも出ます
                  ★③ ★★「外から届かない、透けているところ」だけを 白にした型
                    ★13枚 作りました。★これで、どんな形でも はみ出しません。
                ★★型は名簿が持ちます（holeMask）。★ここで作らないこと。
                ★★2026-09-08、★景色が 384×384 になりました（★枠と同じ寸法）。
                  ★だから、★同じ大きさ・同じ場所に 重ねるだけです。 */}
            {view && windowHoleMask(frame) && (
              <div style={{
                position: "absolute", inset: 0, overflow: "hidden",
                WebkitMaskImage: `url(${windowHoleMask(frame)})`,
                maskImage: `url(${windowHoleMask(frame)})`,
                WebkitMaskSize: "100% 100%",
                maskSize: "100% 100%",
                WebkitMaskRepeat: "no-repeat",
                maskRepeat: "no-repeat"
              }}>
                <img src={interiorSrc(view)} alt=""
                  style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              </div>
            )}
            {/* ★枠は、いちばん上。 */}
            <img src={interiorSrc(frame)} alt=""
              style={{ position: "absolute", inset: 0, width: "100%", height: "100%", display: "block" }} />
          </div>
        );
      })()}

      {/* ★扉。★320×512 で、★ほかより縦に長い絵です。 */}
      {door && (
        <img src={interiorSrc(door)} alt="" aria-hidden="true"
          style={{
            position: "absolute",
            // ★★絵の端ではなく、★中身の端を、右の壁に合わせます。
            //   ★★2026-09-08、★left=89％ で置いていて、★0.89％ 内側に浮いていました。
            //     ★扉の絵は 320 幅で、★中身は x14〜306。★右に余白があります。
            left: `${flushRightLeftPct(door)}%`,
            bottom: `${floorBottomPct(door, widthPctOf(door))}%`,
            width: `${widthPctOf(door)}%`,
            transform: "translate(-50%, 0)",
            // ★扉は opening（★30）。★羊（★70の帯）より、うしろです。
            zIndex: zIndexOf(zOf(door), 0), pointerEvents: "none"
          }} />
      )}

      {/* ★★いくつでも置けるもの。
          ★★2026-09-08、★2つ 誤りがありました（★実機のご報告）。
            ★① 指に、品物が付いてきませんでした。
              ★部屋に対する％を、★CSS の translate に渡していました。
              ★★CSS の％は、★その要素じしんの大きさに対する割合です。
              ★だから、★家具では★4.5倍の遅れになり、
              ★離した瞬間に、★指の位置へ跳んでいました。
            ★② 一度動かすと、★床の線を見なくなり、★宙に浮いていました。
          ★★いまは、
            ★① 動かしているあいだは、★画素で1対1に動かします。
            ★② 落とした先の「足もと」を、★床の帯に収めます。★浮きません。 */}
      {many.map((it, i) => {
        const s = spotOf(it);
        // ★★置き場所は、★名簿が決めます（★2026-09-08・placement-120.json）。
        //   ★★2026-09-08 まで、★分類（wallart か どうか）で判じていました。
        //     ★だから、★天井から下げるもの（電球・シャンデリア）が、
        //     ★★床に置かれていました。★実機でご指摘をいただきました。
        //   ★★9種類のうち、ここに来るのは floor / ceiling / wall / tabletop / outside です。
        const place = placementOf(it);
        const anchor = anchorOf(it);
        const onWall = anchor === "center";
        const onCeiling = anchor === "top-center";
        // ★★大きさは、★絵の幅から出します（★分類ごとに決め打ちしません）。
        const wpct = widthPctOf(it);
        // ★動かしていないものは、★重ならないよう、★少しずつずらします。
        const shift = pos[it.key] ? 0 : (i % 4) * 9 - 13;
        const left = clampToBand(s.left + shift, LEFT_BAND);
        // ★★壁のものは「上端」、★床のものは「足もと」で置きます。
        //   ★★同じ数の意味が2つに割れないよう、★分けて持ちます。
        // ★★天井から下げるものは、★上端を 天井に合わせます。
        //   ★★足もとでは ありません。★anchor が top-center だからです。
        const ceilTop = onCeiling
          ? (s.top != null ? Math.max(0, Math.min(40, s.top)) : CEILING_TOP_PCT)
          : null;
        const wallTop = onWall
          ? clampToBand(s.top != null ? s.top : (s.wallTop != null ? s.wallTop : WALL_CENTER_PCT), WALL_BAND)
          : null;
        // ★★足もと。★動かしていなければ、★床の線のまま。
        //   ★★古い自由な位置（top）は、★足もととして読み替えません。
        //     ★あれは「浮いていた高さ」です。★読み替えると、動いてしまいます。
        //     ★消しもしません。★足もと（feet）が入るまで、★床の線に戻します。
        // ★★台の上に置くものは、★床より少し上です。
        const defaultFeet = place === "tabletop" ? TABLETOP_FEET_PCT : null;
        const feet = (!onWall && !onCeiling)
          ? (s.feet != null ? clampToBand(s.feet, FLOOR_BAND) : defaultFeet)
          : null;
        const style = {
          position: "absolute",
          left: `${left}%`,
          ...(onCeiling
            ? { top: `${ceilTop}%` }
            : onWall
              ? { top: `${wallTop}%` }
              : { bottom: `${feet != null ? bottomForFeet(it, wpct, feet) : floorBottomPct(it, wpct)}%` }),
          width: `${wpct}%`,
          transform: "translate(-50%, 0)",
          // ★★重ね順も、★名簿が決めます（★小さい順に描く）。
          //   ★outside 5 ／ 壁材 10 ／ view 20 ／ opening 30 ／ wall 40
          //   ★structure 60 ／ floor・tabletop 70 ／ ceiling 90
          // ★★帯の順は Opus の決め、★床の中の前後は 足もとの y です。
          //   ★★羊も、同じ物差しで置きます（★lib/sheepInteriorV2.js）。
          zIndex: zIndexOf(zOf(it), feet != null ? feet : (onCeiling ? 0 : 66))
        };
        const img = (
          <img src={interiorSrc(it)} alt="" aria-hidden="true"
            // ★★WebP が 読めない端末では、★PNG に 戻します（★2026-09-09）。
            onError={fallbackToPng}
            style={{ width: "100%", display: "block", pointerEvents: "none" }} />
        );
        // ★★動かせるのは、★置きかたを直しているときだけです。
        //   ★ふだんは押せません（★羊を押すのと、まぎれないため）。
        if (editMode && Draggable && onUpdatePosition) {
          // ★★いまの位置を、★そのまま渡します。
          //   ★★動かした分を、★ここに足します。★指の位置を使いません。
          //     ★指の位置を保存していたので、★跳んでいました。
          const startTop = onCeiling ? ceilTop
            : onWall ? wallTop
            : (feet != null ? feet : FLOOR_BAND[0]);
          return (
            <div key={it.key} style={style}>
              <Draggable
                itemKey={it.key}
                startLeft={left} startTop={startTop}
                band={onCeiling ? [0, 40] : (onWall ? WALL_BAND : FLOOR_BAND)}
                onDragEnd={(nl, nt) =>
                  onUpdatePosition("interior", it.key, nl, nt,
                    (onWall || onCeiling) ? "top" : "feet")}>
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
