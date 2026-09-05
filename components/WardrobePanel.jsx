"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import SheepDressed from "@/components/SheepDressed";
import { SHEEP_GROUPS, itemsByGroup, sheepItemSrc, sheepItemByKey } from "@/lib/sheepItems";
import {
  inShopNow, currentSeason, SEASON_LABELS, isUnlockItem, unlockedItemKeys,
  PROP_SIDES, PROP_SIDE_DEFAULT, sortForShop
} from "@/lib/sheepWardrobe";

// ============================================================================
// 着せかえの画面（★2026-09-05 夜・Stage 1）
//
//   ★★まだ、坂本さんにしか出しません。
//     ★出す・出さないは lib/sheepWardrobe.js の mayUseWardrobe が決めます。
//     ★この画面は、★呼ばれたら描くだけです。
//
//   ★★守ること
//     ・★季節を、★入手の期限にしないこと
//       ★過ぎた季節のものも、★持っていれば着られます。
//       ★店に並ぶかどうかだけが、★季節で変わります。
//     ・★達成で開くものは、★お金で買えません。★そう見えるように出します。
//     ・★催促しないこと。★「あと◯日」を出さないこと。
// ============================================================================

const SLOT_LABELS = {
  garment: "服", neck: "襟まき", shoes: "くつ", hat: "かぶりもの", prop: "持ちもの"
};

export default function WardrobePanel({
  wearing = {}, owned = [], unlockedFlags = {}, todayISO, onChange
}) {
  const groups = Object.keys(SHEEP_GROUPS);
  const [group, setGroup] = useState(groups[0]);
  const season = currentSeason(todayISO);
  const opened = new Set(unlockedItemKeys(unlockedFlags));

  // ★いま選んでいるまとまりの品物。★並び順は lib が決めます。
  const items = sortForShop(itemsByGroup(group), { todayISO, unlockedFlags });

  function wear(item) {
    if (!onChange) return;
    const next = { ...wearing };
    // ★同じものを押したら、★外します。
    if (next[item.slot] === item.key) delete next[item.slot];
    else next[item.slot] = item.key;
    onChange(next);
  }

  function setSide(side) {
    if (!onChange) return;
    onChange({ ...wearing, propSide: side });
  }

  return (
    <div>
      {/* ★いまの姿。★大きく出します。 */}
      <div style={{ display: "flex", justifyContent: "center", marginBottom: 16 }}>
        <SheepDressed wearing={wearing} size={240} />
      </div>

      {/* ★いま着ているものを、外せるように並べます。 */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 16, justifyContent: "center" }}>
        {Object.keys(SLOT_LABELS).map((slot) => {
          const it = wearing[slot] ? sheepItemByKey(wearing[slot]) : null;
          if (!it) return null;
          return (
            <button key={slot} type="button" onClick={() => wear(it)}
              style={{
                padding: "8px 14px", borderRadius: 999, minHeight: 44,
                border: `1px solid ${C.line}`, background: C.card, color: C.ink,
                fontSize: "0.9375rem"
              }}>
              {SLOT_LABELS[slot]}：{it.name}　×
            </button>
          );
        })}
      </div>

      {/* ★持ちものの置き場所（★左・まん中・右）。★持っているときだけ出します。 */}
      {wearing.prop && (
        <div style={{ display: "flex", gap: 8, marginBottom: 16, justifyContent: "center" }}>
          {PROP_SIDES.map((s) => (
            <button key={s} type="button" onClick={() => setSide(s)}
              style={{
                padding: "8px 16px", borderRadius: 999, minHeight: 44,
                border: `1px solid ${(wearing.propSide || PROP_SIDE_DEFAULT) === s ? C.curtain : C.line}`,
                background: (wearing.propSide || PROP_SIDE_DEFAULT) === s ? C.curtain : C.card,
                color: (wearing.propSide || PROP_SIDE_DEFAULT) === s ? "#FFFDF8" : C.inkSoft,
                fontSize: "0.9375rem"
              }}>
              {s === "L" ? "左" : s === "C" ? "まんなか" : "右"}
            </button>
          ))}
        </div>
      )}

      {/* ★まとまりの選び分け。★横に流します（★折り返すと、名前が読めません）。 */}
      <div className="flex gap-2 overflow-x-auto nav-scroll" style={{ marginBottom: 14 }}>
        {groups.map((g) => (
          <button key={g} type="button" onClick={() => setGroup(g)}
            className="whitespace-nowrap shrink-0"
            style={{
              padding: "9px 16px", borderRadius: 999, minHeight: 44,
              border: `1px solid ${group === g ? C.curtain : C.line}`,
              background: group === g ? C.curtain : C.card,
              color: group === g ? "#FFFDF8" : C.inkSoft,
              fontSize: "0.9375rem"
            }}>
            {SHEEP_GROUPS[g]}
          </button>
        ))}
      </div>

      {/* ★品物。★絵で選びます。★名前だけでは、分かりません。 */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 10 }}>
        {items.map((it) => {
          const worn = wearing[it.slot] === it.key;
          const shop = inShopNow(it, todayISO);
          const unlock = isUnlockItem(it.key);
          const openedYet = opened.has(it.key);
          return (
            <button key={it.key} type="button" onClick={() => wear(it)}
              title={it.name}
              style={{
                border: `1px solid ${worn ? C.curtain : C.line}`,
                borderRadius: 12, background: C.card, padding: 6,
                minHeight: 92, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 4,
                // ★★隠しません。★薄くして、★見えるようにします。
                //   ★出さないなら、はじめから出さない。★ぼかさないこと。
                opacity: (unlock && !openedYet) ? 0.45 : 1
              }}>
              <img src={sheepItemSrc(it, wearing.propSide || PROP_SIDE_DEFAULT)} alt=""
                aria-hidden="true"
                style={{ width: "100%", aspectRatio: "1 / 1", objectFit: "contain" }} />
              <span style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.4, textAlign: "center" }}>
                {it.name}
              </span>
              {/* ★季節のものは、★いまの季節だけ店に並びます。
                  ★★持っていれば、いつでも着られます（★取り上げません）。 */}
              {!shop && (
                <span style={{ fontSize: "0.6875rem", color: C.inkSoft }}>
                  {SEASON_LABELS[season]}のあいだは、お店にありません
                </span>
              )}
              {unlock && !openedYet && (
                <span style={{ fontSize: "0.6875rem", color: C.inkSoft }}>記録すると届きます</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
