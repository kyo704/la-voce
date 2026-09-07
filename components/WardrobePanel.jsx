"use client";

import { useId, useState } from "react";
import { C } from "@/lib/tokens";
import SheepDressed from "@/components/SheepDressed";
// ★★どの箱かは、lib/wardrobeBoxes.js が持ちます（★裁定 §6-⑤）。
//   ★画面で判定しないこと。★2か所になると、片方だけが古くなります。
import { boxOf, BOX_KEEPSAKE, BOX_RECORD, BOX_DRESSUP } from "@/lib/wardrobeBoxes";
// ★★絞り込みと印は、lib/wardrobeMarks.js が持ちます（★§4・§7・§11）。
//   ★保存する場所は、★character_equipped の中です。★列を足していません。
import {
  FILTERS, STYLES, applyFilter, isFavorite, toggleFavorite, styleLabel,
  favoritesFirst, oftenWorn, countWear
} from "@/lib/wardrobeMarks";
import CATALOG from "@/docs/opus/items.json";
import WardrobeSheet from "@/components/WardrobeSheet";
import { SHEEP_GROUPS, itemsByGroup, sheepItemSrc, sheepItemByKey } from "@/lib/sheepItems";
import {
  inShopNow, currentSeason, SEASON_LABELS, isUnlockItem, unlockedItemKeys, applyWear,
  groupBySlot, railSlotsWithItems, slotLabel, RAIL_GARMENT,
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
  outfits = [], onOutfitsChange,
  // ★★印（お気に入り・よく着る・いつ見たか）。★仕様 §4・§7・§11。
  //   ★保存先は profiles.character_equipped です（★列を足していません）。
  //   ★★marks を渡さない呼び方でも、★落ちないようにします。
  marks = {}, onMarksChange,
  // ★★いつ受け取ったか（★新着の判定に使います）。★{ 鍵: ISOの日時 }。
  //   ★渡されなければ、★新着は1つも出ません（★分からないためです）。
  receivedAt = {}
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
  // ★★レール（★§3・2026-09-08）。★どの置き場所を選んでいるか。
  //   ★★これが、いちばん外の軸になりました。
  //     ★これまでは「まとまり（時代・世界…）」が外側で、
  //     ★その中に上も靴も帽子も混ざっていました。
  //   ★★null は「全身もの」です。★レールの外にある、という意味です。
  const [railSlot, setRailSlot] = useState(RAIL_GARMENT);
  // ★★絞り込み（★仕様 §4）。★1つだけ選べます。★重ねません。
  const [filter, setFilter] = useState("all");
  const [style, setStyle] = useState(null);
  // ★★段（少しだけ／半分／全部）は、★もう見ていません（★2026-09-08）。
  //   ★段で中身を変えるのを、★やめたためです。
  //   ★誰も読まない状態を、★残さないこと。
  // ★★試着していること（★仕様 §9）。★鍵と、着られることの、食い違いを埋めます。
  const [tryOn, setTryOn] = useState(null);
  const season = currentSeason(todayISO);
  const opened = new Set(unlockedItemKeys(unlockedFlags));

  // ★いま選んでいるまとまりの品物。★並び順は lib が決めます。
  const groupItems = sortForShop(itemsByGroup(group), { todayISO, unlockedFlags });
  // ★★レールに出すのは、★このまとまりに品物がある置き場所だけです。
  //   ★空の札を並べません。★押せないものを出さないこと。
  const railKeys = railSlotsWithItems(groupItems);
  const hasGarment = groupItems.some((i) => i.slot === RAIL_GARMENT);
  // ★★選んでいる置き場所が、★このまとまりに無いことがあります。
  //   ★「オペラ」を見ていて「上」を選び、★「和服」へ移ると、★上はありません。
  //   ★★そのとき、★何も出ない画面になります。★壊れて見えます。
  //   ★だから、★選びは「希望」として持ち、★実際に出す先は、その場で決めます。
  //     ★状態を直しに行かないこと。★書き替えると、★行ったり来たりします。
  const activeSlot =
    (railSlot === RAIL_GARMENT && hasGarment) || railKeys.includes(railSlot)
      ? railSlot
      : (hasGarment ? RAIL_GARMENT : (railKeys[0] || null));
  const slotItems = groupItems.filter((i) => i.slot === activeSlot);
  // ★★絞り込みを、当てます（★§4）。★決めは lib です。
  const filtered = applyFilter(slotItems, filter, style, {
    owned, equipped: marks, receivedAt,
    todayISO, slot: activeSlot,
    itemSlotOf: (k) => (sheepItemByKey(k) || {}).slot
  });
  // ★★お気に入りを、先頭に集めます（★仕様 §7）。★落としません。
  const ordered = favoritesFirst(filtered, marks);
  // ★★段による切り替えを、★やめました（★2026-09-08・坂本さんの決め）。
  //   ★★もとは「少しだけ」の段で、★よく着るもの4点だけにしていました。
  //     ★引き上げ具合で中身が変わるので、★予告なく減ったように見えます。
  //     ★実機で「分かりにくい」とご指摘をいただきました。
  //   ★★いまは「よく着る」の札です。★押したときだけ変わります。
  //     ★同じことが、★自分で選べる形になりました。
  const items = ordered;

  function wear(item) {
    if (!onChange) return;
    // ★★持っていない品も、★着られます（★仕様 §9「試着」）。
    //   ★「タップすると、その羊に着せた姿を3秒だけ見せる（試着）。
    //     ★そのあと『これは まだ です』とだけ出す」
    //   ★★止めないこと。★止めると、着たときの想像がつきません。
    //   ★★ただし、★黙らないこと。
    //     ★2026-09-08、★鍵が付いているのに着られて、
    //     ★どちらが本当なのか分からない、というご指摘をいただきました。
    //     ★鍵は「持っていない」、着られるのは「試着」。★別のことです。
    //     ★それを、★その場で1行 伝えます。
    //   ★★「購入する」「今だけ」「残り◯点」は、書きません（★仕様 §9）。
    //     ★「まだ」以外の言葉を、足さないこと。
    if (!(owned || []).includes(item.key) && !opened.has(item.key)) {
      setTryOn(item.key);
    } else {
      setTryOn(null);
    }
    // ★★決めは lib/sheepWardrobe.js の applyWear が持ちます。
    //   ★ここで書かないこと。★2か所になると、片方だけが古くなります。
    //   ★全身ものと、上・下・羽織りの、脱ぎ着もあちらが見ています。
    //   ★sheepItemByKey を渡します。★渡さないと、
    //     ★着物の上からシャツが出る向きを、★見られません。
    onChange(applyWear(wearing, item, sheepItemByKey));
    // ★★着た回数を、1つ足します（★仕様 §7）。
    //   ★★脱ぐときは、数えません。★着たことだけを数えます。
    //   ★数は、画面に出しません。★並べ替えにだけ使います。
    if (onMarksChange && wearing[item.slot] !== item.key) {
      onMarksChange(countWear(marks, item.key, todayISO));
    }
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
      {/* ★★左右の絵がある持ちものだけ、★置き場所を選べるようにします。
          ★1枚だけの品（お箸・フォーク）では、★押しても何も変わりません。
          ★★押しても何も起きないボタンを、★出さないこと。 */}
      {wearing.prop && sheepItemByKey(wearing.prop) &&
       sheepItemByKey(wearing.prop).files && (
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

      {/* ★★レール（★仕様 §3・2026-09-08）。
          ★★スクロールさせません。★8つを画面幅に入れます。
            ★横に流すと、★右にまだ在ることに気づいていただけません。
          ★★絵のアイコンではなく、★字にしました（★坂本さんの決め）。
            ★絵は、★意味が伝わらないことがあります。★字なら、迷いません。
          ★★「全身もの」は、★レールの外の、別の札です（★仕様 §3）。
            ★全身ものを選ぶと、★上と下が同時に置き換わります。
            ★同じ列に混ぜると、★その違いが伝わりません。 */}
      <div style={{ marginBottom: 10 }}>
        {hasGarment && (
          <button type="button" onClick={() => setRailSlot(RAIL_GARMENT)}
            aria-pressed={activeSlot === RAIL_GARMENT}
            style={{
              padding: "8px 14px", borderRadius: 999, minHeight: 40, marginBottom: 8,
              border: `1px solid ${activeSlot === RAIL_GARMENT ? C.curtain : C.line}`,
              background: activeSlot === RAIL_GARMENT ? C.curtain : C.card,
              color: activeSlot === RAIL_GARMENT ? "#FFFDF8" : C.inkSoft,
              fontSize: "0.875rem"
            }}>
            全身もの
          </button>
        )}
        {railKeys.length > 0 && (
          <div style={{ display: "grid", gridTemplateColumns: `repeat(${railKeys.length}, 1fr)`, gap: 4 }}>
            {railKeys.map((k) => {
              const on = activeSlot === k;
              return (
                <button key={k} type="button" onClick={() => setRailSlot(k)}
                  aria-pressed={on}
                  style={{
                    padding: "8px 2px", borderRadius: 10, minHeight: 40,
                    border: `1px solid ${on ? C.curtain : C.line}`,
                    background: on ? C.curtain : C.card,
                    color: on ? "#FFFDF8" : C.inkSoft,
                    fontSize: "0.75rem", lineHeight: 1.2, whiteSpace: "nowrap"
                  }}>
                  {slotLabel(k)}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* ★★絞り込みの札（★仕様 §4）。★1つだけ選べます。
          ★★重ねて選べる形にしないこと。★迷わせます。
          ★★「持っていないものを隠す」は、★作りません（★仕様 §8）。
            ★「もっている」を選んだときだけ、★絞ります。
          ★★数を、書きません。★「12点」と出さないこと。 */}
      <div className="flex gap-1.5 flex-wrap" style={{ marginBottom: 10 }}>
        {FILTERS.map((f) => {
          const on = filter === f.key;
          return (
            <button key={f.key} type="button"
              aria-pressed={on}
              onClick={() => {
                setFilter(on && f.key !== "all" ? "all" : f.key);
                if (f.key !== "style") setStyle(null);
              }}
              style={{
                padding: "6px 12px", borderRadius: 999, minHeight: 36,
                border: `1px solid ${on ? C.curtain : C.line}`,
                background: on ? C.curtain : C.card,
                color: on ? "#FFFDF8" : C.inkSoft,
                fontSize: "0.8125rem"
              }}>
              {f.label}
            </button>
          );
        })}
      </div>

      {/* ★★系統の第2列（★仕様 §4）。★「系統」を選んだときだけ出します。 */}
      {filter === "style" && (
        <div className="flex gap-1.5 flex-wrap" style={{ marginBottom: 10 }}>
          {STYLES.map((st) => {
            const on = style === st.key;
            return (
              <button key={st.key} type="button"
                aria-pressed={on}
                onClick={() => setStyle(on ? null : st.key)}
                style={{
                  padding: "6px 12px", borderRadius: 999, minHeight: 36,
                  border: `1px solid ${on ? C.curtain : C.line}`,
                  background: on ? C.curtain : C.paper,
                  color: on ? "#FFFDF8" : C.inkSoft,
                  fontSize: "0.8125rem"
                }}>
                {st.label}
              </button>
            );
          })}
        </div>
      )}

      {/* ★★絞った結果が空のときは、★黙らないこと。
          ★「無い」ではなく、★何を選べば戻れるかを書きます。 */}
      {/* ★★試着していることを、★1行で伝えます（★仕様 §9）。
          ★「これは まだ です」だけ。★それ以外の言葉を足さないこと。
          ★★「購入する」「今だけ」「残り◯点」は、書きません。 */}
      {tryOn && (
        <p className="text-xs" style={{ color: C.inkSoft, margin: "0 0 8px", lineHeight: 1.8 }}>
          これは まだ です。着た姿だけ、見ていただけます。
        </p>
      )}

      {/* ★★段による切り替えは、やめました（★2026-09-08）。
          ★★引き上げ具合で中身が変わるのは、★予告なく減ったように見えます。
            ★いまは「よく着る」の札です。★押したときだけ変わります。 */}

      {items.length === 0 && slotItems.length > 0 && (
        <p className="text-xs" style={{ color: C.inkSoft, margin: "10px 0", lineHeight: 1.8 }}>
          この絞り込みに当てはまるものは、ここにはありません。
          「すべて」を押すと、戻ります。
        </p>
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

      {/* ★★品物。★絵で選びます。★名前だけでは、分かりません。
          ★★2026-09-08、★置き場所ごとに分けました。
            ★「ふだんぎ」を開くと、★上も靴も帽子も、★ひとつづきに並んでいました。
            ★62点が1列に混ざって、★何を探しているのか分からなくなります。
          ★分け方と並びは lib/sheepWardrobe.js の groupBySlot が持ちます。
          ★★中身のない置き場所は、★見出しごと出しません。 */}
      {groupBySlot(items).map((sec) => (
      <div key={sec.slot}>
      {/* ★見出しは、★まとまりが2つ以上あるときだけ出します。
          ★1つしかないのに見出しを付けると、★かえって読みにくくなります。 */}
      {groupBySlot(items).length > 1 && (
        <p className="text-xs" style={{ color: C.inkSoft, margin: "10px 0 6px" }}>
          {sec.label}
        </p>
      )}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(84px, 1fr))", gap: 10 }}>
        {/* ★★「はずす」を、★いちばん前に置きます（★仕様 §5）。
            ★★脱ぐ道が無いと、★一度着たら戻れません。
              ★同じ品をもう一度押しても脱げますが、★それは気づけません。
            ★いま何も着ていない場所では、★出しません。★押す先がありません。 */}
        {wearing[sec.slot] && (
          <button type="button"
            onClick={() => onChange && onChange(applyWear(wearing,
              { key: wearing[sec.slot], slot: sec.slot }, sheepItemByKey))}
            aria-label={`${sec.label}をはずす`}
            style={{
              border: `1px solid ${C.line}`, borderRadius: 12, background: C.paper,
              padding: 6, minHeight: 92, display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 4
            }}>
            <span style={{ fontSize: "1.25rem", color: C.inkSoft, lineHeight: 1 }}>−</span>
            <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>はずす</span>
          </button>
        )}
        {sec.items.map((it) => {
          const worn = wearing[it.slot] === it.key;
          const shop = inShopNow(it, todayISO);
          const unlock = isUnlockItem(it.key);
          const openedYet = opened.has(it.key);
          // ★★どの箱か（★2026-09-08）。
          //   ★箱1 記念　　… 買えません。交換もできません。★達成でだけ開きます
          //   ★箱2 記録　　… 30日ぶんたまるごとに、3点から1つ選びます
          //   ★箱3 よそおい… お金で得ます
          //   ★★持っている品には、★何も出しません。
          //     ★手に入れたあとで「有料」と出ていると、★取り上げられそうに見えます。
          const box = boxOf(it, CATALOG.find((c) => c.key === it.key));
          const have = (owned || []).includes(it.key) || openedYet;
          return (
            <button key={it.key} type="button" onClick={() => wear(it)}
              title={it.name}
              style={{
                // ★★選んでいるものは、★わくを太くします（★仕様 §5）。
                //   ★色だけで示さないこと。★色の見分けにくい方に伝わりません。
                border: `${worn ? 3 : 1}px solid ${worn ? C.curtain : C.line}`,
                borderRadius: 12, background: C.card,
                padding: worn ? 4 : 6,
                minHeight: 92, display: "flex", flexDirection: "column",
                alignItems: "center", gap: 4, position: "relative",
                // ★★隠しません。★薄くして、★見えるようにします。
                //   ★出さないなら、はじめから出さない。★ぼかさないこと。
                // ★★暗くしすぎないこと（★仕様 §5）。★買う気が失せます。
                //   ★0.45 は暗すぎたので、★0.62 にしました。
                opacity: (!have) ? 0.62 : 1
              }}>
              {/* ★★選んでいるしるし（★仕様 §5）。★右下に●。
                  ★わくの太さと、2つで示します。★片方だけにしないこと。 */}
              {worn && (
                <span aria-hidden="true"
                  style={{
                    position: "absolute", right: 5, bottom: 5,
                    width: 9, height: 9, borderRadius: 999, background: C.curtain
                  }} />
              )}
              {/* ★★持っていないもののしるし（★仕様 §5）。★右上に鍵。
                  ★★暗くして隠すのではなく、★理由が分かる形にします。 */}
              {!have && (
                <span aria-hidden="true"
                  style={{
                    position: "absolute", right: 4, top: 4,
                    fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1
                  }}>
                  🔒
                </span>
              )}
              {/* ★★見本は「羊に着せた姿」です（★仕様 §5）。
                  ★「服だけを並べると、着たときの想像がつきません。
                    ★ここは手を抜かないでください」と書かれています。
                  ★★1点だけ着せます。★いま着ているものは、混ぜません。
                    ★混ぜると、★どれがその品なのか分からなくなります。
                  ★★thumb にすると、★動きの定義も脚も作りません。
                    ★80個 並ぶので、★1つずつが軽くないと、開きません。 */}
              <SheepDressed
                wearing={{ [it.slot]: it.key, propSide: wearing.propSide || PROP_SIDE_DEFAULT }}
                size={72} thumb travel={false} alt="" />
              <span style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.4, textAlign: "center" }}>
                {it.name}
              </span>
              {/* ★★お気に入りの印（★仕様 §7）。
                  ★★入れ子のボタンにしません（★押せなくなります）。
                    ★品物の枠は button なので、★中に button を置けません。
                    ★だから span にして、★押されたときに上へ伝えないようにします。
                  ★★印そのものは、★数を出しません。 */}
              {onMarksChange && (
                <span role="button" tabIndex={0}
                  aria-label={`${it.name}をお気に入りに${isFavorite(marks, it.key) ? "しない" : "する"}`}
                  aria-pressed={isFavorite(marks, it.key)}
                  onClick={(e) => { e.stopPropagation(); onMarksChange(toggleFavorite(marks, it.key)); }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === " ") {
                      e.preventDefault(); e.stopPropagation();
                      onMarksChange(toggleFavorite(marks, it.key));
                    }
                  }}
                  style={{
                    fontSize: "0.875rem", lineHeight: 1,
                    color: isFavorite(marks, it.key) ? C.gold : C.line,
                    cursor: "pointer", padding: "2px 6px"
                  }}>
                  ★
                </span>
              )}
              {/* ★季節のものは、★いまの季節だけ店に並びます。
                  ★★持っていれば、いつでも着られます（★取り上げません）。 */}
              {!shop && (
                <span style={{ fontSize: "0.6875rem", color: C.inkSoft }}>
                  {SEASON_LABELS[season]}のあいだは、お店にありません
                </span>
              )}
              {/* ★★箱の札（★2026-09-08）。★持っている品には、出しません。
                  ★数を書かないこと。「あと◯」も「◯点中」も出しません。 */}
              {!have && box === BOX_KEEPSAKE && !unlock && (
                <span style={{ fontSize: "0.6875rem", color: C.inkSoft }}>記念のもの</span>
              )}
              {!have && box === BOX_RECORD && (
                <span style={{ fontSize: "0.6875rem", color: C.inkSoft }}>記録がたまると届きます</span>
              )}
              {!have && box === BOX_DRESSUP && (
                <span style={{ fontSize: "0.6875rem", color: C.inkSoft }}>よそおいのお届けで</span>
              )}
              {unlock && !openedYet && (
                <span style={{ fontSize: "0.6875rem", color: C.inkSoft }}>記録すると届きます</span>
              )}
            </button>
          );
        })}
      </div>
      </div>
      ))}
    </WardrobeSheet>
  );
}
