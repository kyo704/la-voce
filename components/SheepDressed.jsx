"use client";

import { useId } from "react";

import { SHEEP_BASE, SHEEP_ASSET_BASE, sheepItemByKey, sheepItemSrc } from "@/lib/sheepItems";
import { LAYER_ORDER, PROP_SIDE_DEFAULT, motionOf, LEGS, SHOE_SPLIT_X, slotZ } from "@/lib/sheepWardrobe";
import ClothImage from "@/components/ClothImage";

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

export default function SheepDressed({
  wearing = {}, size = 220, alt = "着せかえた羊",
  // ★★動き（2026-09-06・案B）。★いまは "walk" だけ、試しに作っています。
  //   ★"still" … 止まっています（★既定）
  //   ★"walk"  … 歩きます
  motion = "still",
  // ★左を向くか。★絵は右向きなので、★左のときだけ裏返します。
  facingLeft = false,
  // ★★実際に歩いて移動するか（2026-09-06）。
  //   ★その場で はずむだけだと、★「歩いている」に見えません。
  //   ★おうちの中では、★位置は外から決まります。★そのときは false にします。
  travel = true,
  // ★★見本（サムネ）のとき（★2026-09-08・仕様 §5）。
  //   ★一覧に、★羊に着せた姿を、★80個ほど並べます。
  //   ★★1つ描くごとに、★キーフレームを4本 作っています。
  //     ★80個 並べると、★320本になります。
  //   ★★見本は、★動きません。★だから、★動きの定義ごと外します。
  //     ★脚も描きません。★小さくて見えないうえ、★軸を4つ増やします。
  thumb = false,
  // ★★選んでいる色（★2026-09-08）。★{ 品の鍵: 色の鍵 }。
  //   ★★渡さない呼び方でも、★落ちません。★もとの色の絵が出ます。
  //   ★どの品に色を塗れるかは lib/clothColors.js が決めます。★ここでは決めません。
  colors = {}
}) {
  // ★重ねる絵を、順番どおりに並べます。
  // ★★脚（★案B1・2026-09-06）。★絵は描いていません。コードで描きます。
  //   ★どの動きに脚を出すかは、★lib/sheepWardrobe.js が決めます。
  //   ★★止まっているときも、★脚は出したままです。
  //     ★歩くときだけ生えると、★急に現れて驚かせます。
  // ★★切り抜きの名前は、★羊ごとに変えます。
  //   ★同じ名前が2つあると、★あとのほうが勝ち、★片方の靴が消えます。
  //   ★庭の画面では、★見本とおうちの羊が同時に出ています。
  const clipId = useId().replace(/[^a-zA-Z0-9]/g, "");

  // ★★見本のときは、★脚を描きません（★2026-09-08）。
  //   ★80px ほどでは見えず、★軸を4つ増やします（★脚2・靴2）。
  //   ★★見本の目的は「着たときの想像がつく」ことです（★仕様 §5）。
  //     ★脚が無くても、★服は分かります。
  const showLegs = !thumb;
  const swingLegs = motionOf(motion).legs === true;
  // ★履いている靴の絵。★脚の先に付けます。★無ければ、はだしです。
  const shoeItem = wearing.shoes ? sheepItemByKey(wearing.shoes) : null;
  const shoeSrc = shoeItem ? sheepItemSrc(shoeItem, null) : null;

  // ★★脚の左右。★軸と動きは、★ここで1回だけ決めます。
  //   ★★脚と靴で別々に書くと、★片方だけ直す日が来て、★ずれます。
  const legSides = [["L", LEGS.leftX], ["R", LEGS.rightX]];
  const legGroupStyle = (side, cx) => ({
    // ★★軸は、★数字で決めます。
    //   ★★fill-box は「そのかたまりの箱」を見ます。
    //     ★靴の絵は x=0・y=0 の1024角なので、★履いた瞬間に箱が
    //     ★画面ぜんたいへ広がり、★軸が (512, 0) へ飛びました。
    //   ★view-box なら、★中身が変わっても軸は動きません。
    transformBox: "view-box",
    transformOrigin: `${cx}px ${LEGS.topY}px`,
    // ★★動きは、★その場に書きます。★組の名前で書きません。
    //   ★組の名前だと、★画面に2匹いるとき、★あとの羊の規則が
    //   ★先の羊にも効き、★片方の脚が止まります。
    animation: (!thumb && swingLegs)
      ? `sheepLeg${side}${motion} ${LEGS.sec}s ease-in-out infinite`
      : "none"
  });

  const layers = [];
  for (const slot of LAYER_ORDER) {
    if (slot === "body") {
      layers.push({ key: "body", src: SHEEP_ASSET_BASE + SHEEP_BASE.body, z: slotZ("body") });
      continue;
    }
    if (slot === "head") {
      layers.push({ key: "head", src: SHEEP_ASSET_BASE + SHEEP_BASE.head, z: slotZ("head") });
      continue;
    }
    const itemKey = wearing[slot];
    if (!itemKey) continue;
    const item = sheepItemByKey(itemKey);
    if (!item) continue;
    // ★持ち物だけ、★置き場所（左・まん中・右）があります。
    const side = slot === "prop" ? (wearing.propSide || PROP_SIDE_DEFAULT) : null;
    const src = sheepItemSrc(item, side);
    // ★★靴は、★重ねの列に残したまま、★描き方だけ変えます（2026-09-06・直し）。
    //   ★★列から外して脚の絵の中へ移したのが、★誤りでした。
    //     ★脚の絵は、★体より後ろ（zIndex 0）にあります。
    //     ★体の絵は 490〜951 が不透明で、★靴は 844〜976。
    //     ★だから靴のほとんどが、★体に塗りつぶされていました。
    //   ★★列に残せば、★これまでどおり体より前に出ます。
    //     ★振れは、★描くときに脚と同じ軸で回してやります。
    if (src) {
      layers.push({
        key: item.key + (side || ""), src, name: item.name,
        isShoe: slot === "shoes",
        // ★★重ね順は、★名簿が持ちます（★2026-09-08・Opus の決め）。
        //   ★★「ながい上」は 35 です。★上（10）とは 別の値です。
        //   ★名簿に無い品（★記念のもの219点）は、★置き場所の既定を使います。
        z: (typeof item.z === "number") ? item.z : slotZ(slot),
        // ★★色は、★塗る側（ClothImage）が判じます。★ここでは渡すだけです。
        itemKey: item.key, colorKey: (colors && colors[item.key]) || null
      });
    }
  }

  // ★★重ね順で、並べ替えます（★2026-09-08 の直し）。
  //   ★★もとは LAYER_ORDER の順に そのまま描いていました。
  //     ★あの並びは 下 → 上 で、★上が 下の前に来ていました。
  //     ★★Opus の決めは 逆です（上10 → 下20）。
  //   ★★同じ z のときは、★もとの順を守ります（★安定な並べ替え）。
  layers.sort((a, b) => (a.z - b.z));

  // ★★動かすのは、★かたまりの外側だけです。
  //   ★1枚ずつ動かすと、★服と体がずれます。
  //   ★羊も服も、★一緒に動かないと、★着ているように見えません。
  //
  //   ★歩き方について
  //     ★上下にはずみ、★わずかに傾きます。
  //     ★腕と脚は、★別々には動きません（★案Bの割り切りです）。
  //     ★★服の下では、どのみち見えないところです。
  //
  //   ★★動きを減らす設定の方には、★動かしません。
  //     ★酔う方がいらっしゃいます。★羊は、それより大事ではありません。
  //   ★★2026-09-06、★「その場で はずんでいるだけに見える」とご指摘。
  //     ★上下 3→5、★傾き 1.2→2 にし、★左右の移動を足しました。
  //
  //   ★★数字は、★lib/sheepWardrobe.js の MOTIONS が持ちます。
  //     ★ここには書きません。★あとで直すとき、★1か所で済みます。
  const mo = motionOf(motion);
  // ★はずみ（速い）。★止まっているときも、★息だけしています。
  // ★★見本のときは、★動かしません（★2026-09-08）。
  //   ★定義そのものを作っていないので、★名前で呼ぶと、★何も起きません。
  //   ★★「none」と はっきり書きます。★無い名前を書き残さないこと。
  const anim = thumb
    ? "none"
    : `sheepBob${motion} ${mo.sec}s ${mo.gait ? "linear" : "ease-in-out"} infinite`;
  // ★★歩く道のり。★はずみ10回ぶんで、★1往復します。
  //   ★★歩くときは linear です（★案C・2026-09-06）。
  //     ★ease だと、★端でゆっくり・まん中で速くなります。
  //     ★歩幅は変わらないのに速さが変わるので、★すべって見えます。
  //     ★これが「歩いているように見えない」いちばんの原因でした。
  const travelAnim = (!thumb && mo.travelX > 0 && travel)
    ? `sheepTravel${motion} ${(mo.sec * 10).toFixed(2)}s ${mo.gait ? "linear" : "ease-in-out"} infinite`
    : "none";

  return (
    <div
      role="img"
      aria-label={alt}
      style={{
        position: "relative", width: size, height: size, flexShrink: 0,
        // ★裏返しと、はずみを、★同じ入れ物でやると打ち消し合います。
        //   ★だから、★裏返しは外側、★はずみは内側にします。
        transform: facingLeft ? "scaleX(-1)" : "none"
      }}
    >
      {/* ★★見本のときは、★動きの定義を作りません（★2026-09-08）。
          ★1つあたり4本。★80個 並べると320本になります。
          ★見本は動かないので、★1本も要りません。 */}
      {!thumb && (
      <style>{`
        /* ★★動きは、★かたまりごとです。★1枚ずつ動かすと、服と体がずれます。
           ★数字は lib/sheepWardrobe.js の MOTIONS から来ています。 */
        @keyframes sheepBob${motion} {
${mo.gait ? `
          /* ★★歩き（案C）。★1回まわるあいだに、★2歩ぶん入れます。
             ★0%と50%が、★足のついた瞬間です。★そこでつぶれます。
             ★25%と75%が、★体のいちばん高いところです。
             ★左右のころびは、★一歩ごとに向きが変わります。
             ★lean は、★ずっとかかったままです（前のめり）。
               ★向きを変えると、★外側の scaleX が一緒に裏返してくれます。 */
          0%, 100% { animation-timing-function: ease-out;
                     transform: translateY(0)
                       rotate(${(mo.lean + mo.sway).toFixed(2)}deg)
                       scaleY(${mo.squash}) scaleX(${(2 - mo.squash).toFixed(3)}); }
          25%      { animation-timing-function: ease-in;
                     transform: translateY(-${mo.bobY}%)
                       rotate(${mo.lean}deg)
                       scaleY(${mo.stretch}) scaleX(${(2 - mo.stretch).toFixed(3)}); }
          50%      { animation-timing-function: ease-out;
                     transform: translateY(0)
                       rotate(${(mo.lean - mo.sway).toFixed(2)}deg)
                       scaleY(${mo.squash}) scaleX(${(2 - mo.squash).toFixed(3)}); }
          75%      { animation-timing-function: ease-in;
                     transform: translateY(-${mo.bobY}%)
                       rotate(${mo.lean}deg)
                       scaleY(${mo.stretch}) scaleX(${(2 - mo.stretch).toFixed(3)}); }
` : `
          0%, 100% { transform: translateY(0) rotate(0deg) scaleY(1); }
          25%      { transform: translateY(-${mo.bobY}%) rotate(-${mo.tilt}deg) scaleY(1); }
          50%      { transform: translateY(0) rotate(0deg) scaleY(${motion === "sleep" ? 0.985 : 1}); }
          75%      { transform: translateY(-${mo.bobY}%) rotate(${mo.tilt}deg) scaleY(1); }
`}        }
        /* ★★歩いて移動します。★行って、向きを変えて、帰ってきます。
           ★向きを変えるのは、★端で止まっている一瞬です。
             ★歩きながら裏返ると、★すべって見えます。 */
        /* ★★名前に動きを混ぜます。★混ぜないと、★画面に2匹いるとき、
             ★あとから描かれたほうの定義が、★先のものを消します。
           ★★2026-09-06、★庭の画面では、着せかえの見本と、おうちの羊が、
             ★同時に出ています。★止まっている羊（移動0）の定義が勝つと、
             ★見本の「歩かせてみる」が★その場で止まって見えます。 */
        @keyframes sheepTravel${motion} {
          0%   { transform: translateX(-${mo.travelX}%) scaleX(1); }
          46%  { transform: translateX(${mo.travelX}%)  scaleX(1); }
          50%  { transform: translateX(${mo.travelX}%)  scaleX(-1); }
          96%  { transform: translateX(-${mo.travelX}%) scaleX(-1); }
          100% { transform: translateX(-${mo.travelX}%) scaleX(1); }
        }
        /* ★★脚の振れ（★案B1・2026-09-06）。
           ★左右が逆向きに振れます。★これが「歩いている」に見える正体です。
           ★★名前に動きを混ぜます。★2匹いるとき、消し合わないためです。
           ★★止まっているときは、★振りません。★脚は生えたままです。 */
        @keyframes sheepLegL${motion} {
          0%, 100% { transform: rotate(${LEGS.swing}deg); }
          50%      { transform: rotate(-${LEGS.swing}deg); }
        }
        @keyframes sheepLegR${motion} {
          0%, 100% { transform: rotate(-${LEGS.swing}deg); }
          50%      { transform: rotate(${LEGS.swing}deg); }
        }
        /* ★★動きを減らす設定の方には、★動かしません。
           ★酔う方がいらっしゃいます。★羊は、それより大事ではありません。 */
        @media (prefers-reduced-motion: reduce) {
          .sheep-dressed-move,
          .sheep-leg { animation: none !important; }
        }
      `}</style>
      )}
      {/* ★★移動（ゆっくり）と、はずみ（速い）を、★別の入れ物にします。
          ★1つにまとめると、★transform が上書きし合って、★片方が消えます。 */}
      <div className="sheep-dressed-move"
        style={{ position: "absolute", inset: 0, animation: travelAnim }}
      >
      <div className="sheep-dressed-move"
        style={{
          position: "absolute", inset: 0,
          // ★足もとを軸に、はずみます。★頭を軸にすると、★浮いて見えます。
          transformOrigin: "50% 92%",
          animation: anim
        }}
      >
      {/* ★★脚（★案B1）。★体の絵より先に描くので、★後ろに入ります。
          ★はみ出しを許しています。★ひづめが箱の下ぎわに来るためです。 */}
      {showLegs && (
        <svg
          viewBox="0 0 1024 1024"
          aria-hidden="true"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            overflow: "visible", zIndex: 0, pointerEvents: "none"
          }}
        >
          {legSides.map(([side, cx]) => (
            <g key={side} className="sheep-leg" style={legGroupStyle(side, cx)}>
              <rect
                x={cx - LEGS.width / 2} y={LEGS.topY}
                width={LEGS.width}
                height={LEGS.bottomY - LEGS.hoofRy - LEGS.topY}
                rx={LEGS.width / 2} fill={LEGS.color} />
              {/* ★★靴を履いていたら、★ひづめは描きません。
                  ★靴の底(〜976)より、★ひづめの下端(1002)のほうが下なので、
                  ★描くと、★靴の下から足がはみ出して見えます。 */}
              {!shoeSrc && (
                <ellipse
                  cx={cx} cy={LEGS.bottomY - LEGS.hoofRy}
                  rx={LEGS.footW / 2} ry={LEGS.hoofRy} fill={LEGS.color} />
              )}
            </g>
          ))}
        </svg>
      )}
      {/* ★★体と服を、★脚のぶんだけ持ち上げます。
          ★持ち上げは、はずみと別の入れ物にします。
            ★同じ入れ物に書くと、★animation の transform に消されます。 */}
      <div style={{
        position: "absolute", inset: 0, zIndex: 1,
        transform: showLegs ? `translateY(${-(LEGS.lift / 1024) * 100}%)` : "none"
      }}>
      {layers.map((l, i) => (
        // ★★靴は、★左右に切って、★それぞれの脚と一緒に振ります。
        //   ★★重ねの列の、★もとの場所のまま描きます。
        //     ★だから、★これまでどおり体より前に出ます。
        l.isShoe && showLegs ? (
          <svg
            key={l.key}
            viewBox="0 0 1024 1024"
            aria-hidden="true"
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              overflow: "visible", zIndex: i, pointerEvents: "none"
            }}
          >
            <defs>
              {/* ★靴の絵は、1枚に左右そろって入っています。★x=511 で切ります。 */}
              <clipPath id={`shoeL-${clipId}`}>
                <rect x="0" y="0" width={SHOE_SPLIT_X} height="1024" />
              </clipPath>
              <clipPath id={`shoeR-${clipId}`}>
                <rect x={SHOE_SPLIT_X} y="0" width={1024 - SHOE_SPLIT_X} height="1024" />
              </clipPath>
            </defs>
            {legSides.map(([side, cx]) => (
              <g key={side} className="sheep-leg" style={legGroupStyle(side, cx)}>
                <image
                  href={l.src} x="0" y={LEGS.shoeDy}
                  width="1024" height="1024"
                  clipPath={`url(#shoe${side}-${clipId})`} />
              </g>
            ))}
          </svg>
        ) : (
        // ★★同じ大きさで、同じ場所に重ねます。★ずらさないこと。
        //   ★★色を選んでいない品は、★もとの絵が、そのまま出ます。
        //     ★ClothImage が、★色の鍵が無ければ src をそのまま使います。
        <ClothImage
          key={l.key}
          itemKey={l.itemKey}
          colorKey={l.colorKey}
          src={l.src}
          style={{
            position: "absolute", inset: 0,
            width: "100%", height: "100%",
            objectFit: "contain",
            // ★重ね順は、並べた順のままです。★z-index を足すと、崩れます。
            zIndex: i,
            pointerEvents: "none"
          }}
        />
      )))}
      </div>
      </div>
      </div>
    </div>
  );
}
