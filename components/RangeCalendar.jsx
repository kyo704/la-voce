"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, SPACE, FONT_STACK, cardStyle } from "@/lib/uiKit";
import { Pill, Note } from "@/components/UiV2";
import {
  WEEK_LABELS, partsOf, monthGrid, shiftMonth, pickDay, inRange, isEdge,
  QUICK_RANGES, quickRange, rangeLabel
} from "@/lib/rangeCalendar";

// ============================================================================
// ★期間を えらぶ カレンダー（★2026-09-11）
//
//   ★出どころ 裁定-9月10日夜の7点（役職名・先生の運営・希望申告ほか）.md §2
//     「★はじめの日 → おわりの日 の 順に 押す
//       ★途中の日は うすい色で つながる
//       ★もう一度 押すと やり直せる
//       ★『先月』『今月』『先週』の 早押しも 置いた」
//
//   ★★「受診用の『選ぶ』を 押しても、何も 出なかった」の 直しです。
//     ★これまでは <input type="date"> が 2つ 並んでいました。
//
//   ★★行事の「日」からも、★この 同じ ものを 使います。
//     ★2つ 作りません。★1つを 呼びます。
//
//   ★★決めは lib/rangeCalendar.js が 持ちます。★ここで 決めません。
//     ★時計も 見ません。★きょうを 受け取ります。
//
//   ★見張り components/tests/range-calendar.test.js
// ============================================================================

export default function RangeCalendar({ value, onChange, todayISO, max }) {
  const range = value || {};
  const anchor = partsOf(range.start) || partsOf(todayISO) || { y: 2026, m: 1 };
  const [view, setView] = useState({ y: anchor.y, m: anchor.m });
  const cells = monthGrid(view.y, view.m);

  const step = (by) => setView(shiftMonth(view.y, view.m, by));

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      {/* ★★早押し。★見本の 3つです。 */}
      <div style={{ display: "flex", gap: 6, marginBottom: 10, flexWrap: "wrap" }}>
        {QUICK_RANGES.map((q) => (
          <Pill key={q} onClick={() => {
            const r = quickRange(q, todayISO);
            if (!r) return;
            onChange(r);
            const p = partsOf(r.start);
            if (p) setView({ y: p.y, m: p.m });
          }}>{q}</Pill>
        ))}
      </div>

      <div style={{ ...cardStyle, marginBottom: SPACE.cardGap }}>
        {/* ★★前の月・次の月に 動けます（★見本のとおり）。 */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
          <button type="button" onClick={() => step(-1)} aria-label="前の月"
            style={{ minWidth: SPACE.tapMin, minHeight: SPACE.tapMin, margin: -10,
              background: "transparent", border: "none", color: C.inkSoft, fontSize: 15 }}>‹</button>
          <span style={{ ...TYPE.li, fontWeight: 700 }}>{view.y}年 {view.m}月</span>
          <button type="button" onClick={() => step(1)} aria-label="次の月"
            style={{ minWidth: SPACE.tapMin, minHeight: SPACE.tapMin, margin: -10,
              background: "transparent", border: "none", color: C.inkSoft, fontSize: 15 }}>›</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {WEEK_LABELS.map((w) => (
            <span key={w} style={{ textAlign: "center", fontSize: 9, color: C.inkSoft, paddingBottom: 2 }}>{w}</span>
          ))}
          {cells.map((iso, i) => {
            if (!iso) return <span key={"e" + i} />;
            const on = inRange(range, iso);
            const edge = isEdge(range, iso);
            // ★★きょうより 先は 押せません（★受診用は 過ぎた日の 話です）。
            const over = max ? iso > max : false;
            return (
              <button key={iso} type="button" disabled={over}
                onClick={() => onChange(pickDay(range, iso))}
                aria-pressed={on}
                style={{
                  // ★★押せる 大きさ。★升目でも 44 を 下回らせません。
                  minHeight: SPACE.tapMin,
                  border: "none", padding: 0,
                  // ★★途中の日は うすい色で つながります。★端は 濃く。
                  background: edge ? C.curtain : (on ? C.paper : "transparent"),
                  color: edge ? "#FFFDF8" : (over ? C.line : C.ink),
                  borderRadius: edge ? 8 : 0,
                  fontSize: 12, opacity: over ? 0.5 : 1,
                  fontFamily: FONT_STACK
                }}>
                {Number(iso.slice(8, 10))}
              </button>
            );
          })}
        </div>
      </div>

      {/* ★★いま 何を 選んでいるか。★片方だけの ときも 出します。 */}
      <Note>
        {range.start
          ? (range.end ? rangeLabel(range) : rangeLabel(range) + "　おわりの日を 押してください")
          : "はじめの日を 押してください。"}
        {range.start && range.end ? "　（もう一度 押すと やり直せます）" : ""}
      </Note>
    </div>
  );
}
