"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import {
  CATEGORIES, FIXED_TABS, subTabsFor, SORTS, nextSort, sortLabel,
  SIZES, COPY, colorBandApplies, leftButtonLabel, BAND_IDLE, actionLabel
} from "@/lib/homeDrawer";

// ============================================================================
// したく の引き出し（2026-09-08）
//
//   ★出どころ docs/opus/woolsong-仕様-おうち画面の作り直し（9月8日）.md §3・§6
//
//   ★★ふだんは、★出しません。★「したく」を押したときだけ 上がります。
//     ★★絵は、★引き出しを開けても 消えません（★§1-5）。
//       ★着せながら見えないと、★選べません。★40% 残します。
//
//   ★★3段（★§3-2）
//     第1段　大分類 5つ　　　★字だけ（★アイコンを作りません・§7-2）
//     第2段　中分類　　　　　★先頭3つは いつも同じ（さいきん／おきにいり／ぜんぶ）
//     第3段　🔍 ／ ラベル＋並び順（★巡回）／ ⇅
//
//   ★★色の帯は、★きるもの のときだけ、★1点えらんだ その時だけ（★§8-4）。
//     ★★いまは、★場所だけ 空けてあります（★絵が届いていないため）。
//
//   ★★数は lib/homeDrawer.js が持ちます。★ここで書かないこと。
//
//   ★見張り components/tests/home-drawer.test.js
// ============================================================================

export default function HomeDrawer({
  category, onCategory,
  tab, onTab,
  sort, onSort,
  onSearch,
  onClose, onUndo, onDone,
  canUndo = false,
  // ★★押した品（★2026-09-08・坂本さんのお決め「2段階」）。
  //   ★★押すと すぐ着る、ではなく、★名前を見せてから 着ます。
  //   ★渡されなければ、★この段は出ません。
  picked = null, pickedOn = false, onWear, onCancelPick,
  // ★★色の帯（★きるもの・1点えらんだとき）。
  //   ★★渡されなければ、★1段ぶんの場所も 空けません。
  colorBand = null,
  children
}) {
  const tabs = subTabsFor(category);
  // ★★帯は「きるもの」のとき、★いつも出します（★見本①・2026-09-08）。
  //   ★★もとは「1点えらんだ時だけ 出す」と読んでいました。★誤りでした。
  //     ★見本①は、★帯を出したまま 灰色にしています。
  //     ★「ここで色が かえられる」と、★先に分かるためです。
  //     ★押しても何も起きないので、★間違えません。
  //   ★★出したり消したりすると、★下の一覧の位置が ずれます。
  //     ★見本②に「グリッドは そのまま。位置がずれません」と 書いてあります。
  const showColor = colorBandApplies(category);

  return (
    <div
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0,
        height: `${SIZES.drawerPct}%`,
        background: C.card,
        borderTop: `1px solid ${C.line}`,
        borderTopLeftRadius: 18, borderTopRightRadius: 18,
        display: "flex", flexDirection: "column",
        zIndex: 40,
        // ★iPhone の下の余白を、飲み込ませます。
        paddingBottom: "env(safe-area-inset-bottom)"
      }}>

      {/* ★★第1段 ── 大分類 5つ。★字だけです。
          ★★アイコンを作らないと決めました（★§7-2・坂本さんのお決め）。
            ★あの作品の絵（りんご・のこぎり・葉）に似ないためには、
            ★★作らないのが、いちばん確かです。 */}
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${CATEGORIES.length}, 1fr)`, flexShrink: 0 }}>
        {CATEGORIES.map((c) => {
          const on = category === c.key;
          return (
            <button key={c.key} type="button"
              aria-pressed={on}
              onClick={() => onCategory && onCategory(c.key)}
              style={{
                minHeight: 44, padding: "8px 2px",
                // ★色だけで示しません。★下の線でも示します。
                background: on ? C.paper : C.card,
                border: "none",
                borderBottom: `${on ? 3 : 1}px solid ${on ? C.curtain : C.line}`,
                color: on ? C.ink : C.inkSoft,
                fontSize: `${SIZES.tier1LabelPx}px`, lineHeight: 1.3,
                fontWeight: on ? 600 : 400
              }}>
              {c.label}
            </button>
          );
        })}
      </div>

      {/* ★★第2段 ── 中分類。★先頭3つは、いつも同じ順です（★§1-2）。
          ★横に流します。★折り返すと、段の高さが変わって落ち着きません。 */}
      <div className="nav-scroll"
        style={{
          display: "flex", gap: 6, overflowX: "auto", flexShrink: 0,
          padding: "8px 10px", borderBottom: `1px solid ${C.line}`
        }}>
        {tabs.map((tb, i) => {
          const on = tab === tb.key;
          const fixed = i < FIXED_TABS.length;
          return (
            <button key={tb.key} type="button"
              aria-pressed={on}
              onClick={() => onTab && onTab(tb.key)}
              className="shrink-0 whitespace-nowrap"
              style={{
                height: SIZES.tier2ChipPx, padding: "0 10px",
                // ★★丸いピル型にしません（★§7-2「形」）。
                //   ★桐たんすの札に寄せて、★角は小さめ・下に木の線。
                borderRadius: 4,
                border: `1px solid ${on ? C.curtain : C.line}`,
                borderBottomWidth: on ? 3 : 1,
                background: on ? C.curtain : C.paper,
                color: on ? "#FFFDF8" : C.inkSoft,
                fontSize: "0.75rem",
                // ★先頭3つは、★少しだけ濃くしておきます（★場所の目印）。
                fontWeight: fixed ? 600 : 400
              }}>
              {tb.label}
            </button>
          );
        })}
      </div>

      {/* ★★第3段 ── 🔍 ／ ラベル＋並び順 ／ ⇅ */}
      <div style={{
        height: SIZES.tier3Px, flexShrink: 0,
        display: "flex", alignItems: "center", gap: 8, padding: "0 10px",
        borderBottom: `1px solid ${C.line}`
      }}>
        {/* ★★「さがす」は、★まだ作っていません（★2026-09-08）。
            ★★押しどころだけを、★先に出していました。★私の落ち度です。
              ★押せるのに何も起きないものを、★出してはいけません。
            ★★作ってから、★出します。★onSearch を渡した時だけ 出します。 */}
        {onSearch && (
          <button type="button" onClick={() => onSearch()}
            aria-label={COPY.search}
            style={{
              minWidth: 32, minHeight: 32, borderRadius: 6,
              border: `1px solid ${C.line}`, background: C.paper, color: C.inkSoft,
              fontSize: "0.8125rem"
            }}>
            {COPY.search}
          </button>
        )}
        {/* ★★数を、書きません。★「54点」と出さないこと。 */}
        <span style={{ color: C.inkSoft, fontSize: "0.75rem", flex: 1 }} />
        {/* ★★並び順は、★1つのチップを押して巡回します（★§1-3・§6）。
            ★メニューを開かせません。 */}
        <button type="button" onClick={() => onSort && onSort(nextSort(sort))}
          aria-label={`並び順を変える（いまは ${sortLabel(sort)}）`}
          style={{
            minHeight: 32, padding: "0 10px", borderRadius: 4,
            border: `1px solid ${C.line}`, borderBottomWidth: 2,
            background: C.paper, color: C.inkSoft, fontSize: "0.75rem",
            whiteSpace: "nowrap"
          }}>
          {sortLabel(sort)}
        </button>
      </div>

      {/* ★★品物。★4列（★§6）。★ここは、呼ぶ側が入れます。 */}
      <div style={{ flex: 1, overflowY: "auto", padding: 10 }}>
        {children}
      </div>

      {/* ★★押した品の、名前と押しどころ（★2026-09-08・坂本さんのお決め）。
          ★★押すと すぐ着る、ではなく、★名前を見せてから 着ます。
            ★「名前が分かったほうが、面白い」というご判断です。
          ★★色の帯の すぐ上に置きます。★一覧の位置を、動かしません。
            ★出したり消したりで 一覧がずれると、★見ていた品を見失います。
          ★★やめる（✕）を、必ず置きます。★出口のない画面を作らないこと。 */}
      {picked && (
        <div style={{
          flexShrink: 0, display: "flex", alignItems: "center", gap: 8,
          padding: "8px 10px", borderTop: `1px solid ${C.line}`, background: C.paper
        }}>
          <span style={{
            flex: 1, minWidth: 0, fontSize: "0.8125rem", color: C.ink,
            overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
          }}>
            {picked.name}
          </span>
          <button type="button" onClick={() => onCancelPick && onCancelPick()}
            aria-label={COPY.cancel}
            style={{
              minWidth: 40, minHeight: 40, borderRadius: 6,
              border: `1px solid ${C.line}`, borderBottomWidth: 2,
              background: C.card, color: C.inkSoft, fontSize: "1rem"
            }}>
            ✕
          </button>
          <button type="button" onClick={() => onWear && onWear(picked)}
            style={{
              minHeight: 40, padding: "0 16px", borderRadius: 6,
              border: `1px solid ${C.curtain}`, borderBottomWidth: 2,
              background: C.curtain, color: "#FFFDF8",
              fontSize: "0.875rem", fontWeight: 600, whiteSpace: "nowrap"
            }}>
            {actionLabel(category)}
          </button>
        </div>
      )}

      {/* ★★色の帯 ── ★きるもの のときだけ、★1点えらんだ その時だけ（★§8-4）。
          ★★グリッドの下、★下の帯の上に、★固定で1段（★§8-1）。
          ★★帯が有るかどうかが、そのまま「色を変えられる」という説明になります。
            ★文字で説明しないこと。
          ★★いまは、★絵が届くまで 出ません。★場所だけ空けてあります。 */}
      {showColor && (
        <div style={{
          height: SIZES.colorBandPx, flexShrink: 0,
          borderTop: `1px solid ${C.line}`, background: C.paper,
          display: "flex", alignItems: "center", padding: `0 ${SIZES.swatchGapPx}px`,
          overflowX: "auto",
          // ★★まだ えらんでいないときは、★薄く・灰色に（★§8-5）。
          //   ★消しません。★出したままにします。
          opacity: colorBand ? 1 : BAND_IDLE.opacity,
          filter: colorBand ? "none" : `grayscale(${BAND_IDLE.grayscale})`,
          pointerEvents: colorBand ? "auto" : "none",
          justifyContent: colorBand ? "flex-start" : "center"
        }}>
          {colorBand || (
            <span style={{ fontSize: "0.6875rem", color: C.inkSoft }}>
              {COPY.colorHint}
            </span>
          )}
        </div>
      )}

      {/* ★★下の帯 ── 3つ。★左だけ、場面で変わります（★§6）。
          ★★言葉は §7-2 のとおりです。★「もようがえ」を使わないこと。 */}
      <div style={{
        flexShrink: 0, display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: 8, padding: 10, borderTop: `1px solid ${C.line}`
      }}>
        <button type="button" onClick={() => onClose && onClose()}
          style={btn(false)}>
          {leftButtonLabel(category)}
        </button>
        <button type="button" onClick={() => onUndo && onUndo()}
          disabled={!canUndo}
          style={{ ...btn(false), opacity: canUndo ? 1 : 0.45 }}>
          {COPY.undo}
        </button>
        <button type="button" onClick={() => onDone && onDone()}
          style={btn(true)}>
          {COPY.done}
        </button>
      </div>
    </div>
  );
}

function btn(primary) {
  return {
    minHeight: 44, borderRadius: 8,
    border: `1px solid ${primary ? C.curtain : C.line}`,
    borderBottomWidth: 2,
    background: primary ? C.curtain : C.paper,
    color: primary ? "#FFFDF8" : C.ink,
    fontSize: "0.875rem", fontWeight: primary ? 600 : 400
  };
}
