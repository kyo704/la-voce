"use client";

import { Fragment, useState } from "react";
import { C } from "@/lib/tokens";
import {
  buildBand, timeOf, monthDayLabel, ATTENDANCE, attendanceLabel, UNDO_SECONDS, COPY
} from "@/lib/todayBand";
import { TYPE, SPACE, obiStyle, speakStyle, rem } from "@/lib/uiKit";
import { SHEEP_SUB } from "@/lib/todayCard";

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
  teaching = false, nameOf, onAttend, onSeeAll, onCalendar, unsent = 0, onUnsent,
  sheepFirst = false, v2 = false, sheepSlot = null
}) {
  const rows = buildBand({
    todayISO, tz, lessons, performances, orgEvents, sheepLine, teaching, sheepFirst
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

  /**
   * ★見本の 服を 着た 1行（★A01・design.zip）。
   *
   *   ★★出す行を 決めているのは buildBand です。★ここでは 決めません。
   *     ★同じ r を、★v1 と v2 が 別の 服で 描いているだけです。
   *   ★★言葉も v1 と 同じものを 使います（★COPY・attendanceLabel）。
   *     ★言い回しを ここで 作り直すと、★2か所に 分かれます。
   */
  function renderV2(r) {
    if (r.key === "lessonToday") {
      return (
        <BandRowV2 key={r.key}>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ObiTitle>
              {/* ★★人数です。★点数でも、順位でも、達成度でも ありません。 */}
              {r.teaching ? `${COPY.teachingToday} ${r.count}人` : "きょう"}
            </ObiTitle>
            {onSeeAll && (
              <button type="button" onClick={onSeeAll}
                style={{
                  marginLeft: "auto", marginTop: -10, marginBottom: -10,
                  minHeight: SPACE.tapMin, padding: "0 10px",
                  borderRadius: 6, border: `1px solid ${C.line}`,
                  background: C.paper, color: C.inkSoft, fontSize: rem(11.5)
                }}>
                {r.teaching ? COPY.seeAll : COPY.calendar}
              </button>
            )}
          </div>
          {r.lessons.map((l) => {
            const done = l.attendance || null;
            const undoing = undoFor && undoFor.id === l.id;
            return (
              <div key={l.id} style={{
                display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap",
                ...TYPE.body
              }}>
                <span style={{ color: C.inkSoft, minWidth: 42 }}>
                  {timeOf(l.scheduled_at, tz) || ""}
                </span>
                <span style={{ flex: 1, minWidth: 0, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {nameOf ? nameOf(l) : ""}
                </span>
                {/* ★★先生のときだけ、★押せます。★生徒は 見るだけです。 */}
                {!r.teaching ? null : undoing ? (
                  <button type="button"
                    onClick={() => { setUndoFor(null); if (onAttend) onAttend(l, null); }}
                    style={pill(true)}>
                    {COPY.undo}
                  </button>
                ) : done ? (
                  <span style={{ fontSize: rem(11.5), color: C.inkSoft }}>
                    {COPY.done} {attendanceLabel(done)}
                  </span>
                ) : (
                  ATTENDANCE.map((a) => (
                    <button key={a.key} type="button" onClick={() => tap(l, a.key)} style={pill(false)}>
                      {a.label}
                    </button>
                  ))
                )}
              </div>
            );
          })}
        </BandRowV2>
      );
    }
    if (r.key === "performanceSoon") {
      // ★★見本① は、★本番を 1本ずつ 別の 帯に しています（★「9月14日」が 帯の 題）。
      //   ★★「あと2日」では なく 日付です。★どちらも ご本人が 入れた 予定の 事実です。
      return (
        <Fragment key={r.key}>
          {r.items.map((x) => (
            <BandRowV2 key={x.id}>
              <ObiTitle>{monthDayLabel(x.performed_on || x.date)}</ObiTitle>
              <div style={TYPE.body}>{x.label || x.title || "本番"}</div>
            </BandRowV2>
          ))}
        </Fragment>
      );
    }
    if (r.key === "orgEventSoon") {
      return (
        <Fragment key={r.key}>
          {r.items.map((e) => (
            <BandRowV2 key={e.id}>
              <ObiTitle>{monthDayLabel(e.event_date)}</ObiTitle>
              <div style={TYPE.body}>{e.title || e.kind || ""}</div>
            </BandRowV2>
          ))}
        </Fragment>
      );
    }
    // ★★羊の 絵と、★羊の ひとこと（★見本 .speak）。
    //   ★★絵は、★いつも ひとことの すぐ 上です。
    //     ★A01（生徒）… ひとことが いちばん上 → ★絵も いちばん上。
    //     ★A02（先生）… 出欠の 帯が 先 → ★絵は その あと。
    //   ★★見本 2枚の ちがいは、★これ 1つで 出ます。
    //     ★2つの 並べ方を 書き分けると、★片方だけ 直ります。
    //   ★★下に 1行 添えます（★見本 S_kyou の .usu）。
    //     ★「羊は「記録した行為」に 反応します。中身には 反応しません」
    //     ★★2026-09-11、★比較画像で 抜けて いました。
    //       ★★この 1行が 無いと、★羊が 体調に 応えて いるように 読めます。
    //         ★羊は 書いた という 行為に だけ 応えます。★中身を 見ません。
    return (
      <Fragment key={r.key}>
        {sheepSlot}
        {r.line ? (
          <BandRowV2 speak>
            {r.line}
            <span style={{
              display: "block", marginTop: 4,
              ...TYPE.usual, color: C.inkSoft
            }}>{SHEEP_SUB}</span>
          </BandRowV2>
        ) : null}
      </Fragment>
    );
  }

  return (
    <div className={v2 ? undefined : "space-y-2 mb-3"}>
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
        // ★★見本の 服（★A01 の .speak / .obi）。
        //   ★★出す行を 決めているのは、★上の buildBand です。★v1 と 同じです。
        //     ★ここで 変えているのは、★見た目だけです。
        //   ★★門の外（38人）には 渡しません（★v2 の 既定は false）。
        if (v2) return renderV2(r);
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
                  {monthDayLabel(e.event_date)}　{e.title || e.kind || ""}
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

/**
 * ★見本の 服を 着せた 1行（★A01 ／ design.zip・2026-09-10）。
 *
 *   .speak  ★羊の ひとこと ── ★白・角16・内側 11/13・13.5px
 *   .obi    ★予定の 帯　　 ── ★白・角14・内側 10/12
 *     .t    ★山吹・10.5px・700・字間 .08em（★「きょう」「9月14日」）
 *     .m    ★13.5px（★「15:00　○○先生のレッスン」）
 *
 *   ★★見本には 帯どうしの あいだ 9px が 入ります（.obi{margin-bottom:9px}）。
 */
function BandRowV2({ children, speak = false }) {
  return (
    <div style={{
      ...(speak ? speakStyle : obiStyle),
      marginBottom: SPACE.cardGap
    }}>
      {children}
    </div>
  );
}

function ObiTitle({ children }) {
  return <div style={{ ...TYPE.obiTitle, marginBottom: 4 }}>{children}</div>;
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
