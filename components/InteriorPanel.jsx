"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import {
  INTERIOR_CATEGORIES, itemsByCategory, interiorSrc,
  toggleInterior, isPlaced, isSingleSlot, categoryLabel,
  windowMissing, interiorOf
} from "@/lib/sheepInteriorV2";

// ============================================================================
// おうちの内装 120点を、選ぶ画面（2026-09-08）
//
//   ★★着せかえの画面と、★同じ考え方にします。
//     ・★分類の札（家具／昭和／窓枠／窓の外／扉／壁かけ／庭／壁と床）
//     ・★中身のない分類は、★出しません
//     ・★数を、書きません（「27点」と出さないこと）
//     ・★押している札は、★色だけでなく★わくの太さでも示します
//
//   ★★いまの101点のお店とは、★別の枠です。
//     ★あちらは CharacterHome の中にあります。★触りません。
//     ★鍵が1つも重ならないので、★混ざりません。
//
//   ★★1つだけ置ける分類（窓枠・窓の外・扉・壁と床）は、
//     ★押すと置き換わります。★同じものを押すと、外れます。
//   ★いくつでも置ける分類（家具・昭和・庭・壁かけ）は、★足す・引くです。
//
//   ★見張り components/tests/sheep-interior-v2.test.js
// ============================================================================

export default function InteriorPanel({ equipped, onChange }) {
  const cats = INTERIOR_CATEGORIES.filter((c) => itemsByCategory(c.key).length > 0);
  const [cat, setCat] = useState(cats[0] ? cats[0].key : null);
  if (!cat) return null;
  const items = itemsByCategory(cat);
  // ★★窓が、片方だけになっていないか。★足りないほうを伝えます。
  const missing = windowMissing(interiorOf(equipped));

  return (
    <div className="rounded-2xl p-4 border mb-4" style={{ background: C.card, borderColor: C.line }}>
      <h3 className="ff-display italic text-lg mb-1">おうちのもの</h3>
      {/* ★★数を、書きません。★「120点あります」と出さないこと。
          ★何ができるかだけを、書きます。 */}
      <p className="text-xs mb-3" style={{ color: C.inkSoft, lineHeight: 1.8 }}>
        押すと置いて、もう一度押すと外せます。
        窓は、枠と外の景色が そろうと出ます。
      </p>

      {/* ★分類の札。★中身のないものは、出しません。 */}
      <div className="flex gap-1.5 flex-wrap" style={{ marginBottom: 10 }}>
        {cats.map((c) => {
          const on = cat === c.key;
          return (
            <button key={c.key} type="button"
              aria-pressed={on}
              onClick={() => setCat(c.key)}
              style={{
                padding: "6px 12px", borderRadius: 999, minHeight: 36,
                // ★色だけで示しません。★わくの太さでも示します。
                border: `${on ? 2 : 1}px solid ${on ? C.curtain : C.line}`,
                background: on ? C.curtain : C.card,
                color: on ? "#FFFDF8" : C.inkSoft,
                fontSize: "0.8125rem"
              }}>
              {c.label}
            </button>
          );
        })}
      </div>

      {/* ★★窓は、★2枚そろって1つです（★2026-09-08・坂本さんの決め）。
          ★枠は 384×384、景色は 480×320 で、★縦横比が違います。
          ★片方だけ置くと、★大きさが合わず、おかしく見えます。
          ★★だから、★そろうまで出しません。
            ★ただし、★黙りません。★あと何を選べばよいかを、書きます。 */}
      {missing && (cat === "window" || cat === "view") && (
        <p className="text-xs" style={{ color: C.inkSoft, margin: "0 0 8px", lineHeight: 1.8 }}>
          窓は、枠と外の景色が そろうと出ます。
          {missing === "view" ? "「窓の外」を、もうひとつ選んでください。" : "「窓枠」を、もうひとつ選んでください。"}
        </p>
      )}

      {/* ★★1つだけ置ける分類は、★そう書きます。
          ★押したときに、前のものが消える理由が分かるようにします。 */}
      {isSingleSlot(cat) && (
        <p className="text-xs" style={{ color: C.inkSoft, margin: "0 0 8px", lineHeight: 1.8 }}>
          {categoryLabel(cat)}は、ひとつだけ置けます。別のものを押すと、入れ替わります。
        </p>
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 10 }}>
        {items.map((it) => {
          const on = isPlaced(equipped, it);
          return (
            <button key={it.key} type="button"
              onClick={() => onChange && onChange(toggleInterior(equipped, it))}
              aria-pressed={on}
              title={it.name}
              style={{
                // ★選んでいるものは、★わくを太くします（★色だけにしません）。
                border: `${on ? 3 : 1}px solid ${on ? C.curtain : C.line}`,
                borderRadius: 12, background: C.paper,
                padding: on ? 4 : 6,
                minHeight: 96, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 4, position: "relative"
              }}>
              <img src={interiorSrc(it)} alt="" aria-hidden="true"
                style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "contain" }} />
              <span style={{ fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.4, textAlign: "center" }}>
                {it.name}
              </span>
              {on && (
                <span aria-hidden="true"
                  style={{
                    position: "absolute", right: 5, bottom: 5,
                    width: 9, height: 9, borderRadius: 999, background: C.curtain
                  }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
