"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import {
  KANJI, SHOW_OWNED, SHOW_ALL, COPY, emptyQuery, toggleKanji, isEmptyQuery,
  disabledKanji
} from "@/lib/drawerSearch";
import { CLOTH_COLORS, swatchHex, needsEdge, edgeHex } from "@/lib/clothColors";
import { SIZES } from "@/lib/homeDrawer";

// ============================================================================
// さがす（★§3-6・見本⑥）── 2026-09-08
//
//   ★★絞り込みは、★ふだんの画面から 外します。★ここにだけ 置きます。
//     ★虫めがねを押した時だけ 出る、★1枚です。
//
//   ★★下に3つ。★やめる ／ さがす ／ けす。
//     ★★「けす」を、必ず置きます。★絞ったまま戻れなくならないためです。
//
//   ★★数を、出しません。★「12点 見つかりました」と書かないこと。
//
//   ★見張り components/tests/drawer-search.test.js
// ============================================================================

export default function DrawerSearch({ initial, onApply, onCancel, items }) {
  const [q, setQ] = useState(initial || emptyQuery());
  // ★★0件になる かんじは、★押せない灰色に します
  //   （★2026-09-08 夜・Opus の決め）。
  //   ★★押せるのに 0件、は「壊れている」に 見えます。
  //   ★★数は 数えますが、★表には 出しません（★「12点」と書かないこと）。
  //   ★★いまの並びから 数えます。★決め打ちの一覧を 持ちません。
  //     ★品が増えたら、★ここが 勝手に 追いつきます。
  const off = disabledKanji(items || []);

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60,
      background: "rgba(60,50,40,0.45)",
      display: "flex", alignItems: "flex-end", justifyContent: "center"
    }}>
      <div style={{
        width: "100%", maxWidth: 520, maxHeight: "88%", overflowY: "auto",
        background: C.card, borderTopLeftRadius: 18, borderTopRightRadius: 18,
        padding: 16, paddingBottom: "calc(16px + env(safe-area-inset-bottom))"
      }}>
        <h3 className="ff-display italic text-lg mb-3" style={{ color: C.ink }}>{COPY.title}</h3>

        {/* ★文字で さがす */}
        <label className="text-xs block mb-1" style={{ color: C.inkSoft }}>{COPY.textLabel}</label>
        <input type="text" value={q.text} placeholder={COPY.textHint}
          onChange={(e) => setQ((v) => ({ ...v, text: e.target.value }))}
          style={{
            width: "100%", minHeight: 44, padding: "0 12px", marginBottom: 14,
            borderRadius: 6, border: `1px solid ${C.line}`, borderBottomWidth: 2,
            background: C.paper, color: C.ink, fontSize: "1rem"
          }} />

        {/* ★いろ ── ★24色。★もう一度押すと、外れます。 */}
        <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>{COPY.colorLabel}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: SIZES.swatchGapPx, marginBottom: 14 }}>
          {CLOTH_COLORS.map((c) => {
            const on = q.color === c.key;
            return (
              <button key={c.key} type="button"
                aria-pressed={on} aria-label={c.name}
                // ★★いろを えらんだら、★みせかたを「もっているもの」に します
                //   （★2026-09-08 夜・Opus の訂正）。
                //   ★★まだの品は 24色 どれにでも なれるので、
                //     ★色で 絞ることに 意味が ありません。
                //   ★★外したときは、★戻しません。★勝手に 広げないためです。
                onClick={() => setQ((v) => (on
                  ? { ...v, color: null }
                  : { ...v, color: c.key, show: SHOW_OWNED }))}
                style={{
                  width: SIZES.swatchPx, height: SIZES.swatchPx,
                  borderRadius: SIZES.swatchRadiusPx, background: swatchHex(c.key),
                  // ★★大きさを、変えません。★変えると、並びが ずれます。
                  border: needsEdge(c.key)
                    ? `1px solid ${edgeHex(c.key)}` : "1px solid rgba(0,0,0,0.10)",
                  boxShadow: on ? `0 0 0 3px ${C.ink}` : "none",
                  padding: 0
                }} />
            );
          })}
        </div>

        {/* ★かんじ ── ★6つ。★いくつでも選べます。 */}
        <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>{COPY.kanjiLabel}</p>
        <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
          {KANJI.map((k) => {
            const on = (q.kanji || []).includes(k);
            // ★★この並びに 1点も 無い かんじは、★押せなくします。
            //   ★消しません。★あることは 見えたままにします。
            const dead = off.includes(k) && !on;
            return (
              <button key={k} type="button" aria-pressed={on}
                disabled={dead}
                // ★★なぜ押せないかを、★読み上げにも 残します。
                title={dead ? "ここには ありません" : undefined}
                onClick={() => setQ((v) => toggleKanji(v, k))}
                style={{ ...chip(on), opacity: dead ? 0.4 : 1 }}>
                {k}
              </button>
            );
          })}
        </div>

        {/* ★みせかた ── ★2つ。★どちらか1つ。 */}
        <p className="text-xs mb-1.5" style={{ color: C.inkSoft }}>{COPY.showLabel}</p>
        <div style={{ display: "flex", gap: 6, marginBottom: 18 }}>
          {[[SHOW_OWNED, COPY.showOwned], [SHOW_ALL, COPY.showAll]].map(([v, label]) => (
            <button key={v} type="button" aria-pressed={(q.show || SHOW_ALL) === v}
              onClick={() => setQ((x) => ({ ...x, show: v }))}
              style={chip((q.show || SHOW_ALL) === v)}>
              {label}
            </button>
          ))}
        </div>

        {/* ★★下に3つ。★「けす」を、必ず置きます。
            ★絞ったまま 戻れなくならないためです。 */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
          <button type="button" onClick={() => onCancel && onCancel()} style={btn(false)}>
            {COPY.cancel}
          </button>
          <button type="button" onClick={() => onApply && onApply(emptyQuery())}
            disabled={isEmptyQuery(q)}
            style={{ ...btn(false), opacity: isEmptyQuery(q) ? 0.45 : 1 }}>
            {COPY.clear}
          </button>
          <button type="button" onClick={() => onApply && onApply(q)} style={btn(true)}>
            {COPY.search}
          </button>
        </div>
      </div>
    </div>
  );
}

function chip(on) {
  return {
    minHeight: 36, padding: "0 12px", borderRadius: 4,
    border: `1px solid ${on ? C.curtain : C.line}`, borderBottomWidth: on ? 3 : 1,
    background: on ? C.curtain : C.paper,
    color: on ? "#FFFDF8" : C.inkSoft, fontSize: "0.8125rem"
  };
}
function btn(primary) {
  return {
    minHeight: 44, borderRadius: 8,
    border: `1px solid ${primary ? C.curtain : C.line}`, borderBottomWidth: 2,
    background: primary ? C.curtain : C.paper,
    color: primary ? "#FFFDF8" : C.ink,
    fontSize: "0.875rem", fontWeight: primary ? 600 : 400
  };
}
