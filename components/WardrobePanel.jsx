"use client";

import { useId, useState } from "react";
import { C } from "@/lib/tokens";
import SheepDressed from "@/components/SheepDressed";
import WardrobeSheet from "@/components/WardrobeSheet";
import { SHEEP_GROUPS, itemsByGroup, sheepItemSrc, sheepItemByKey } from "@/lib/sheepItems";
import {
  inShopNow, currentSeason, SEASON_LABELS, isUnlockItem, unlockedItemKeys,
  PROP_SIDES, PROP_SIDE_DEFAULT, sortForShop
} from "@/lib/sheepWardrobe";
// ★★コーデと、シートの高さの決めは、lib が持ちます。
//   ★上限の数も、言い方も、★ここに書き写さないこと。
import {
  OUTFIT_LIMIT, OUTFIT_LABEL_MAX, makeOutfit, addOutfit, removeOutfit,
  outfitsLeft, outfitToWearing, wornForSave, isEmptyWorn
} from "@/lib/wardrobeOutfits";

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
  wearing = {}, owned = [], unlockedFlags = {}, todayISO, onChange,
  // ★★コーデ（★仕様書 §6）。★保存した着せ方を、1押しで呼び戻します。
  //   ★保存先は profiles.character_equipped.outfits です（★表は作りません）。
  outfits = [], onOutfitsChange
}) {
  // ★★下から出るシート（★仕様書 §2）。★開くまでは、羊と入口だけ出します。
  //   ★★一覧を全画面にしないこと。★羊が見えなくなります。
  const [open, setOpen] = useState(false);
  // ★保存するときの名前。★アプリは読みません。★出すだけです。
  const [naming, setNaming] = useState(false);
  const [label, setLabel] = useState("");
  const [notice, setNotice] = useState(null);
  const idBase = useId();
  // ★★歩きの試し（2026-09-06・案B の第1段）。
  //   ★まず1つだけ作って、★見ていただいてから、残りを作ります。
  const [walking, setWalking] = useState(false);
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

  // ★★コーデを保存します。
  //   ★★いっぱいのとき、★古いものを黙って落とさないこと。
  //     ★坂本さんの決め（2026-09-06）。★「どれかを消してください」と伝えます。
  //     ★受け取ったものを取り上げない、という決まりと同じ向きです。
  function saveOutfit() {
    if (!onOutfitsChange) return;
    const outfit = makeOutfit({
      // ★時計と乱数は、★呼ぶ側で引きます。★lib の中では引きません。
      id: `${idBase}-${Date.now()}`,
      label,
      worn: wearing,
      now: new Date().toISOString()
    });
    const res = addOutfit(outfits, outfit);
    if (!res.ok) { setNotice(res.message); return; }
    onOutfitsChange(res.list);
    setNaming(false);
    setLabel("");
    setNotice(null);
  }

  // ★★保存した着せ方に、まるごと着替えます。
  //   ★混ぜないこと。★前の帽子が残る、といったことが起きます。
  function wearOutfit(o) {
    if (!onChange) return;
    onChange(outfitToWearing(o));
    setNotice(null);
  }

  function deleteOutfit(id) {
    if (!onOutfitsChange) return;
    onOutfitsChange(removeOutfit(outfits, id));
    setNotice(null);
  }

  // ★★羊。★シートを開いているあいだも、★ここが見えたままです。
  const sheep = (
    <>
      <SheepDressed wearing={wearing} size={open ? 200 : 240}
        motion={walking ? "walk" : "still"} />
      <button type="button" onClick={() => setWalking((v) => !v)}
        style={{
          marginTop: 6, padding: "8px 18px", borderRadius: 999, minHeight: 40,
          border: `1px solid ${walking ? C.curtain : C.line}`,
          background: walking ? C.curtain : C.card,
          color: walking ? "#FFFDF8" : C.inkSoft,
          fontSize: "0.875rem"
        }}>
        {walking ? "止める" : "歩かせてみる"}
      </button>
    </>
  );

  // ★★保存した着せ方。★探すのではなく、呼び出す形です（★仕様書 §6）。
  const outfitRow = (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: "flex", alignItems: "baseline", gap: 8, marginBottom: 6 }}>
        <span style={{ fontSize: "0.875rem", color: C.ink }}>保存した着せ方</span>
        <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>
          あと{outfitsLeft(outfits)}着
        </span>
      </div>
      {outfits.length === 0 ? (
        <p style={{ fontSize: "0.8125rem", color: C.inkSoft, lineHeight: 1.7, margin: 0 }}>
          気に入った組み合わせを保存しておくと、あとで1回押すだけで戻せます。
        </p>
      ) : (
        <div className="flex gap-2 overflow-x-auto nav-scroll">
          {outfits.map((o) => (
            <div key={o.id} className="shrink-0"
              style={{
                border: `1px solid ${C.line}`, borderRadius: 12,
                background: C.paper, padding: 6, width: 92
              }}>
              <button type="button" onClick={() => wearOutfit(o)}
                style={{
                  border: "none", background: "transparent", padding: 0,
                  width: "100%", display: "block"
                }}>
                <SheepDressed wearing={outfitToWearing(o)} size={72}
                  motion="still" travel={false} alt={o.label || "保存した着せ方"} />
                <span style={{
                  display: "block", fontSize: "0.6875rem", color: C.ink,
                  lineHeight: 1.4, marginTop: 2, wordBreak: "break-word"
                }}>
                  {o.label || "なまえなし"}
                </span>
              </button>
              {/* ★消すのは、★本人が押したときだけです。 */}
              <button type="button" onClick={() => deleteOutfit(o.id)}
                aria-label={`${o.label || "この着せ方"}を消す`}
                style={{
                  marginTop: 4, width: "100%", minHeight: 32, borderRadius: 999,
                  border: `1px solid ${C.line}`, background: C.card,
                  color: C.inkSoft, fontSize: "0.6875rem"
                }}>
                消す
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ★★いっぱいのときの言い方は、lib が持ちます。★ここに書き写しません。 */}
      {notice && (
        <p style={{
          fontSize: "0.8125rem", color: C.rust, lineHeight: 1.7,
          margin: "8px 0 0"
        }}>
          {notice}
        </p>
      )}

      {naming ? (
        <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
          <input
            value={label} onChange={(e) => setLabel(e.target.value)}
            maxLength={OUTFIT_LABEL_MAX}
            placeholder="なまえ（なくても保存できます）"
            style={{
              flex: 1, minWidth: 0, minHeight: 44, borderRadius: 12,
              border: `1px solid ${C.line}`, background: C.card,
              color: C.ink, padding: "0 12px", fontSize: "1rem"
            }} />
          <button type="button" onClick={saveOutfit}
            style={{
              padding: "0 18px", minHeight: 44, borderRadius: 999, border: "none",
              background: C.curtain, color: "#FFFDF8", fontSize: "0.9375rem",
              flexShrink: 0
            }}>
            保存
          </button>
          <button type="button" onClick={() => { setNaming(false); setNotice(null); }}
            style={{
              padding: "0 14px", minHeight: 44, borderRadius: 999,
              border: `1px solid ${C.line}`, background: C.card,
              color: C.inkSoft, fontSize: "0.9375rem", flexShrink: 0
            }}>
            やめる
          </button>
        </div>
      ) : (
        <button type="button"
          onClick={() => { setNaming(true); setNotice(null); }}
          disabled={isEmptyWorn(wearing)}
          style={{
            marginTop: 8, padding: "10px 18px", borderRadius: 999, minHeight: 44,
            border: `1px solid ${C.line}`, background: C.card,
            color: isEmptyWorn(wearing) ? C.line : C.ink,
            fontSize: "0.9375rem"
          }}>
          いまの着せ方を保存する
        </button>
      )}
    </div>
  );

  // ★★開いていないとき。★羊と、入口と、保存した着せ方だけ。
  if (!open) {
    return (
      <div>
        <div style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          marginBottom: 12
        }}>
          {sheep}
        </div>
        <button type="button" onClick={() => setOpen(true)}
          style={{
            width: "100%", padding: "14px", borderRadius: 999, border: "none",
            background: C.curtain, color: "#FFFDF8", fontWeight: 600,
            fontSize: "1rem", minHeight: 52, marginBottom: 14
          }}>
          着せかえる
        </button>
        {outfitRow}
      </div>
    );
  }

  // ★★開いているとき。★羊は上に出したまま、★一覧は下から出します。
  return (
    <WardrobeSheet onClose={() => setOpen(false)} header={sheep}>
      {outfitRow}
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
    </WardrobeSheet>
  );
}
