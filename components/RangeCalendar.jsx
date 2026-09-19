"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, SPACE, FONT_STACK, cardStyle, rem } from "@/lib/uiKit";
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

/**
 * ★字の 大きさは 2通り です（★2026-09-19・お決め D66(a)）。
 *
 *   ★★この 部品は、★古い 画面にも、★門の 中にも 出ます。
 *     ★★だから 呼ぶ 側（置き所）が 決めます。★部品の 中では 決めません。
 *   ★★★`六段` を 渡された ときだけ、★裁定 その103 の 6段に 寄せます。
 *     ★★渡されなければ いまの まま ── ★38人の 画面は 変わりません。
 *   ★★★部品に 門（`layoutV2`）を 足して いません。
 *     ★★坂本さんの お決め ── ★UiV2 の ような 門を もう1つ 増やさない。
 */
export default function RangeCalendar({ 六段 = false, value, onChange, todayISO, max }) {
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
              background: "transparent", border: "none", color: C.inkSoft, fontSize: rem(六段 ? 15.5 : 15) }}>‹</button>
          <span style={{ ...TYPE.li, fontWeight: 700 }}>{view.y}年 {view.m}月</span>
          <button type="button" onClick={() => step(1)} aria-label="次の月"
            style={{ minWidth: SPACE.tapMin, minHeight: SPACE.tapMin, margin: -10,
              background: "transparent", border: "none", color: C.inkSoft, fontSize: rem(六段 ? 15.5 : 15) }}>›</button>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
          {WEEK_LABELS.map((w) => (
            <span key={w} style={{ textAlign: "center", fontSize: rem(六段 ? 12 : 9), color: C.inkSoft, paddingBottom: 2 }}>{w}</span>
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
                  // ★★★えらべる 日を 越えた 日（★2026-09-18・裁定 その84 PRIORITY_2）。
                  //   ★★`C.line` は 線の 色 です。★紙の上で 1.21。★見えません。
                  //   ★★★`opacity: 0.5` が 重なって いました ── ★1.10 です。
                  //     ★★色を 直しても、★薄さが 重なると 2.04 に しか なりません。
                  //     ★★だから、★色で 示して、★薄さは 外します。
                  //     ★★2つで 薄く すると、★どちらを 直せば よいか 分からなく なります。
                  color: edge ? "#FFFDF8" : (over ? C.ink4 : C.ink),
                  borderRadius: edge ? 8 : 0,
                  fontSize: rem(12),
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
