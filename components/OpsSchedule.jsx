"use client";

import { useState, useEffect } from "react";
import { C } from "@/lib/tokens";
import {
  VIEWS, WIDE_AT, layoutOf, hours, hourOf, timeOf, dateOf,
  dayGrid, overlapsOf, weekHeat
} from "@/lib/opsSchedule";
import { mayDragBlocks, DRAG_NOTE } from "@/lib/opsShell";

// ============================================================================
// 日程 ── 1つの日程を、3つの 見せ方で（見本②⑥⑧ ／ 2026-09-09・第3便）
//
//   ★出どころ 坂本さん経由・Opus の裁定（2026-09-09）
//     ★⑧ 1日 × 先生よこ　　★時間列は position: sticky で 固定、横に ずらす
//     ★⑨ 1週間 × 濃さの地図　★1色の 濃淡のみ。★赤黄青は 使わない
//     ★⑩ よこ持ち　　　　　★812px を 超えた時点で 自動。★選ばせない
//
//   ★★3つは 別々の画面では ありません。★1つの日程の、見せ方の 切り替えです。
//
//   ★★守りつづけるもの
//     ★重なりは 印だけ。★自動で 動かしません。
//     ★連続日数・％を 出しません。
//     ★この画面から、★生徒の健康の記録には たどりつけません。
//
//   ★数と 決めは lib/opsSchedule.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/ops-schedule.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };
const TIME_COL = 46;

function useWidth() {
  const [w, setW] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const on = () => setW(window.innerWidth);
    on();
    window.addEventListener("resize", on);
    window.addEventListener("orientationchange", on);
    return () => {
      window.removeEventListener("resize", on);
      window.removeEventListener("orientationchange", on);
    };
  }, []);
  return w;
}

function mmdd(iso) {
  return `${Number(iso.slice(5, 7))}月${Number(iso.slice(8, 10))}日`;
}

export default function OpsSchedule({
  lessons, teachers, dateISO, weekDays, nameOf, studentNameOf, onPickDate
}) {
  const [view, setView] = useState("day");
  const width = useWidth();
  const layout = layoutOf(width);
  const ids = (teachers || []).map((x) => x.id);

  // ★★よこ持ちのときは、★先生を 全部 横に 並べます（★⑩）。
  //   ★★選ばせません。★はばだけで 決まります。
  const perScreen = layout === "wide" ? Math.max(ids.length, 1) : 2;
  const colW = layout === "wide" ? `${Math.floor(100 / perScreen)}%` : "44%";

  const grid = dayGrid(lessons, dateISO, ids);
  const overlaps = overlapsOf(lessons, dateISO);
  const heat = weekHeat(lessons, weekDays || [], ids);

  const chip = (on) => ({
    minHeight: 44, padding: "0 16px", borderRadius: 999,
    border: `1px solid ${on ? C.curtain : C.line}`,
    background: on ? C.curtain : C.card,
    color: on ? "#FFFDF8" : C.inkSoft, fontSize: "0.8125rem"
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="ff-display italic" style={{ fontSize: "1.25rem", color: C.ink }}>
          日程　{mmdd(dateISO)}
        </h2>
      </div>

      {/* ★★見せ方の 切り替え。★1つの日程に 対する ものです。
          ★★よこ持ち（⑩）は ここに 出しません。★選ばせないからです。 */}
      <div className="flex gap-2">
        {VIEWS.map((v) => (
          <button key={v.key} type="button" onClick={() => setView(v.key)} style={chip(view === v.key)}>
            {v.label}
          </button>
        ))}
      </div>

      {/* ★★重なりの 印（★§4-2）。★教えるだけ。★自動で 動かしません。
          ★★どちらを 動かすかは、★人が 決めます。 */}
      {overlaps.length > 0 ? (
        <div style={{ ...card, background: C.paper }}>
          <p style={{ fontSize: "0.8125rem", color: C.ink, marginBottom: 4 }}>
            ★重なり {overlaps.length}件
          </p>
          {overlaps.map((o) => (
            <p key={o.key} style={small}>{o.at}　{o.lessons.length}件</p>
          ))}
          <p style={{ ...small, marginTop: 6 }}>
            重なりは線を引くだけです。自動では動かしません。
          </p>
        </div>
      ) : null}

      {view === "day" ? (
        <>
          {/* ★★⑧ 1日 × 先生よこ。★時間の 列を 左に 固定し、★横に ずらします。 */}
          <div style={{ ...card, padding: 0, overflowX: "auto", WebkitOverflowScrolling: "touch" }}>
            <div style={{ display: "flex", minWidth: layout === "wide" ? "100%" : `${TIME_COL + ids.length * 44}%` }}>
              {/* ★時間の 列。★position: sticky で 左に 貼りつけます。 */}
              <div style={{
                position: "sticky", left: 0, zIndex: 2, flex: `0 0 ${TIME_COL}px`,
                background: C.card, borderRight: `1px solid ${C.line}`
              }}>
                <div style={{ height: 34 }} />
                {hours().map((h) => (
                  <div key={h} style={{
                    height: 44, fontSize: "0.625rem", color: C.inkSoft,
                    padding: "2px 6px", borderTop: `1px solid ${C.line}`
                  }}>{h}:00</div>
                ))}
              </div>
              {grid.map((col) => (
                <div key={col.teacherId} style={{ flex: `0 0 ${colW}`, minWidth: 0 }}>
                  <div style={{
                    height: 34, fontSize: "0.6875rem", color: C.ink,
                    display: "flex", alignItems: "center", justifyContent: "center",
                    borderBottom: `1px solid ${C.line}`, overflow: "hidden",
                    textOverflow: "ellipsis", whiteSpace: "nowrap", padding: "0 4px"
                  }}>{nameOf ? nameOf(col.teacherId) : ""}</div>
                  <div style={{ position: "relative", height: hours().length * 44 }}>
                    {hours().map((h) => (
                      <div key={h} style={{
                        position: "absolute", top: (h - hours()[0]) * 44, left: 0, right: 0,
                        height: 44, borderTop: `1px solid ${C.line}`
                      }} />
                    ))}
                    {col.lessons.map((l) => {
                      const hv = hourOf(timeOf(l));
                      if (hv == null) return null;
                      const dup = overlaps.some((o) => o.lessons.some((x) => x.id === l.id));
                      return (
                        <div key={l.id} style={{
                          position: "absolute", left: 3, right: 3,
                          top: (hv - hours()[0]) * 44 + 2, minHeight: 40,
                          borderRadius: 8, padding: "4px 6px",
                          // ★★色は 1つ。★重なりだけ、★わくを 太くします。
                          //   ★赤・黄・青を 使いません。★通信簿に しないためです。
                          background: C.paper,
                          border: `${dup ? 2 : 1}px solid ${dup ? C.curtain : C.line}`,
                          fontSize: "0.625rem", color: C.ink, overflow: "hidden"
                        }}>
                          <div>{timeOf(l)}</div>
                          <div style={{ color: C.inkSoft, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {studentNameOf ? studentNameOf(l.student_id) : ""}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
          {/* ★★うごかせるのは パソコンだけ（★見本⑧）。★見ることは どこでも できます。 */}
          {!mayDragBlocks(width) ? <p style={small}>{DRAG_NOTE}</p> : null}
        </>
      ) : (
        <>
          {/* ★★⑨ 1週間 × 濃さの地図。★1色の 濃淡だけです。
              ★★数を 出さず、★濃さだけに しません。★数も 添えます。
                ★濃さは 見つけるため、★数は 確かめるためです。
              ★★押すと、★その日の ⑧が 開きます。 */}
          <div style={card}>
            <div style={{ display: "flex", gap: 3, marginBottom: 4 }}>
              <div style={{ flex: `0 0 ${TIME_COL}px` }} />
              {(weekDays || []).map((d) => (
                <div key={d} style={{ flex: 1, textAlign: "center", fontSize: "0.5625rem", color: C.inkSoft }}>
                  {Number(d.slice(8, 10))}
                </div>
              ))}
            </div>
            {heat.rows.map((r) => (
              <div key={r.teacherId} style={{ display: "flex", gap: 3, marginBottom: 3, alignItems: "center" }}>
                <div style={{
                  flex: `0 0 ${TIME_COL}px`, fontSize: "0.5625rem", color: C.inkSoft,
                  overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap"
                }}>{nameOf ? nameOf(r.teacherId) : ""}</div>
                {r.cells.map((c) => (
                  <button key={c.date} type="button"
                    onClick={() => { if (onPickDate) onPickDate(c.date); setView("day"); }}
                    aria-label={`${mmdd(c.date)} ${c.count}件`}
                    style={{
                      flex: 1, minHeight: 44, borderRadius: 6, border: `1px solid ${C.line}`,
                      // ★★1色の 濃淡だけ。★赤黄青を 使いません。
                      background: c.count === 0 ? C.paper : C.curtain,
                      opacity: c.count === 0 ? 1 : 0.25 + 0.75 * c.density,
                      color: c.count === 0 ? C.inkSoft : "#FFFDF8",
                      fontSize: "0.625rem"
                    }}>{c.count === 0 ? "" : c.count}</button>
                ))}
              </div>
            ))}
            <p style={{ ...small, marginTop: 8 }}>
              濃いほど、コマの数が多い日です。押すと、その日の並びが開きます。
            </p>
          </div>
        </>
      )}
    </div>
  );
}
