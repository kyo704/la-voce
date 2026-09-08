"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import {
  buildBand, timeOf, ATTENDANCE, attendanceLabel, UNDO_SECONDS, COPY
} from "@/lib/todayBand";

// ============================================================================
// 「きょう」の帯 ── 第2便（2026-09-08）
//
//   ★出どころ §4-1（並び順）・§4-2（先生）・§4-3（生徒）・§7-2（1タップ）
//
//   ★★該当がなければ、★その行を出しません。
//     ★「今日のレッスンはありません」と、★書かないこと。
//     ★★無いことを毎朝 知らせるのは、★催促と同じです。
//
//   ★★先生のときは、★帯そのものが 出欠の表です。
//     ★「きょう」を開いた時点で、★もう並んでいます。★0タップです。
//
//   ★★［来た］［休み］［中止］は、★押した瞬間に確定します（★§7-2）。
//     ★「よろしいですか」を、★出しません。
//     ★代わりに、★3秒だけ「もどす」を出します。
//
//   ★★数と言葉は lib/todayBand.js が持ちます。★ここで書かないこと。
//
//   ★見張り components/tests/today-band.test.js
// ============================================================================

export default function TodayBand({
  todayISO, tz, lessons, performances, orgEvents, sheepLine,
  teaching = false, nameOf, onAttend, onSeeAll, onCalendar, unsent = 0, onUnsent
}) {
  const rows = buildBand({
    todayISO, tz, lessons, performances, orgEvents, sheepLine, teaching
  });
  // ★★3秒だけ出る「もどす」。★確認より速く、★間違いも直せます。
  const [undoFor, setUndoFor] = useState(null);

  function tap(lesson, status) {
    // ★★押した瞬間に、★画面へ反映します（★楽観的更新・§7-1）。
    //   ★送れたかどうかを、★待たせません。
    if (onAttend) onAttend(lesson, status);
    setUndoFor({ id: lesson.id, status });
    setTimeout(() => setUndoFor((u) => (u && u.id === lesson.id ? null : u)), UNDO_SECONDS * 1000);
  }

  return (
    <div className="space-y-2 mb-3">
      {/* ★★未送信。★右上に、小さく（★§7-1）。
          ★★0件のときは、★出しません。★いつも出ていると、目に入らなくなります。 */}
      {unsent > 0 && (
        <button type="button" onClick={() => onUnsent && onUnsent()}
          style={{
            display: "block", marginLeft: "auto",
            minHeight: 32, padding: "0 10px", borderRadius: 6,
            border: `1px solid ${C.line}`, background: C.paper,
            color: C.inkSoft, fontSize: "0.75rem"
          }}>
          {COPY.unsent} {unsent}件
        </button>
      )}

      {rows.map((r) => {
        if (r.key === "lessonToday") {
          return (
            <div key={r.key} className="rounded-2xl p-3 border"
              style={{ background: C.card, borderColor: C.line }}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-sm font-medium" style={{ color: C.ink }}>
                  {/* ★★人数です。★点数でも、順位でも、達成度でもありません。 */}
                  {r.teaching ? `${COPY.teachingToday} ${r.count}人` : "きょうの レッスン"}
                </span>
                {onSeeAll && (
                  <button type="button" onClick={onSeeAll}
                    style={{
                      marginLeft: "auto", minHeight: 32, padding: "0 10px",
                      borderRadius: 6, border: `1px solid ${C.line}`,
                      background: C.paper, color: C.inkSoft, fontSize: "0.75rem"
                    }}>
                    {r.teaching ? COPY.seeAll : COPY.calendar}
                  </button>
                )}
              </div>
              <div className="space-y-1.5">
                {r.lessons.map((l) => {
                  const done = l.attendance || null;
                  const undoing = undoFor && undoFor.id === l.id;
                  return (
                    <div key={l.id} className="flex items-center gap-2 flex-wrap">
                      <span className="ff-mono text-xs" style={{ color: C.inkSoft, minWidth: 42 }}>
                        {timeOf(l.scheduled_at, tz) || ""}
                      </span>
                      <span className="text-sm flex-1 truncate" style={{ color: C.ink }}>
                        {nameOf ? nameOf(l) : ""}
                      </span>
                      {/* ★★先生のときだけ、★押せます。★生徒は見るだけです。 */}
                      {!r.teaching ? null : undoing ? (
                        <button type="button"
                          onClick={() => { setUndoFor(null); if (onAttend) onAttend(l, null); }}
                          style={pill(true)}>
                          {COPY.undo}
                        </button>
                      ) : done ? (
                        /* ★★押したあとは、★何を押したかを出します。
                            ★「済」だけだと、★何を押したか分かりません。 */
                        <span style={{ fontSize: "0.75rem", color: C.inkSoft }}>
                          {COPY.done} {attendanceLabel(done)}
                        </span>
                      ) : (
                        ATTENDANCE.map((a) => (
                          <button key={a.key} type="button"
                            onClick={() => tap(l, a.key)}
                            style={pill(false)}>
                            {a.label}
                          </button>
                        ))
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        }
        if (r.key === "performanceSoon") {
          return (
            <div key={r.key} className="rounded-2xl p-3 border"
              style={{ background: C.card, borderColor: C.line }}>
              {r.items.map((p) => (
                <p key={p.id} className="text-sm" style={{ color: C.ink }}>
                  {/* ★★「あと◯日」は、★予定の話です。
                      ★ごほうびへの残り日数では ありません。 */}
                  {p.inDays === 0 ? "きょう" : `あと${p.inDays}日`}　{p.label || p.title || "本番"}
                </p>
              ))}
            </div>
          );
        }
        if (r.key === "orgEventSoon") {
          return (
            <div key={r.key} className="rounded-2xl p-3 border"
              style={{ background: C.card, borderColor: C.line }}>
              {r.items.map((e) => (
                <p key={e.id} className="text-sm" style={{ color: C.ink }}>
                  {String(e.event_date).slice(5).replace("-", "月") + "日"}　{e.title || e.kind || ""}
                </p>
              ))}
            </div>
          );
        }
        // ★★羊のことば。★いつも出ます。★空の帯を作らないためです。
        return r.line ? (
          <div key={r.key} className="rounded-2xl p-3 border"
            style={{ background: C.card, borderColor: C.line }}>
            <p className="text-sm" style={{ color: C.ink }}>{r.line}</p>
          </div>
        ) : null;
      })}
    </div>
  );
}

function pill(primary) {
  return {
    minHeight: 32, padding: "0 10px",
    // ★丸いピル型にしません（★おうち画面と同じ形にそろえます）。
    borderRadius: 4,
    border: `1px solid ${primary ? C.curtain : C.line}`,
    borderBottomWidth: 2,
    background: primary ? C.curtain : C.paper,
    color: primary ? "#FFFDF8" : C.inkSoft,
    fontSize: "0.75rem"
  };
}
