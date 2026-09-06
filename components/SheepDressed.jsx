"use client";

import { SHEEP_BASE, SHEEP_ASSET_BASE, sheepItemByKey, sheepItemSrc } from "@/lib/sheepItems";
import { LAYER_ORDER, PROP_SIDE_DEFAULT, motionOf } from "@/lib/sheepWardrobe";

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
  travel = true
}) {
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
  const anim = `sheepBob${motion} ${mo.sec}s ease-in-out infinite`;
  // ★歩く道のり（ゆっくり）。★はずみ10回ぶんで、★1往復します。
  const travelAnim = (mo.travelX > 0 && travel)
    ? `sheepTravel${motion} ${(mo.sec * 10).toFixed(2)}s ease-in-out infinite` : "none";

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
      <style>{`
        /* ★★動きは、★かたまりごとです。★1枚ずつ動かすと、服と体がずれます。
           ★数字は lib/sheepWardrobe.js の MOTIONS から来ています。 */
        @keyframes sheepBob${motion} {
          0%, 100% { transform: translateY(0) rotate(0deg) scaleY(1); }
          25%      { transform: translateY(-${mo.bobY}%) rotate(-${mo.tilt}deg) scaleY(1); }
          50%      { transform: translateY(0) rotate(0deg) scaleY(${motion === "sleep" ? 0.985 : 1}); }
          75%      { transform: translateY(-${mo.bobY}%) rotate(${mo.tilt}deg) scaleY(1); }
        }
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
        /* ★★動きを減らす設定の方には、★動かしません。
           ★酔う方がいらっしゃいます。★羊は、それより大事ではありません。 */
        @media (prefers-reduced-motion: reduce) {
          .sheep-dressed-move { animation: none !important; }
        }
      `}</style>
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
      </div>
    </div>
  );
}
