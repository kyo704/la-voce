"use client";

import { C } from "@/lib/tokens";
import { overlapsOf, dateOf } from "@/lib/opsSchedule";
import { rosterCount, countsByStatus } from "@/lib/orgRoster";
import { buildEvents, EVENT_STATES } from "@/lib/orgEventsView";

// ============================================================================
// 運営ホーム ── 見本①（2026-09-09・第3便）
//
//   ★出どころ docs/opus/woolsong-見本-運営モード8点（9月9日）.jpg ①
//     「★重なりは 印をつけるだけです。★こちらで 勝手に 動かしません。」
//
//   ★★数えるだけの 画面です。★良し悪しを 言いません。
//   ★★％も 連続日数も 出しません。
//   ★★この画面から、★生徒の健康の記録には たどりつけません。
//
//   ★数は lib（opsSchedule／orgRoster／orgEventsView）が 持ちます。
//     ★★ここで 数え直しません。★名簿の 人数を、★2通りに 数えないためです。
//
//   ★見張り components/tests/ops-home.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };

function Stat({ label, value, unit }) {
  return (
    <div style={{ ...card, flex: 1, minWidth: 0 }}>
      <p style={small}>{label}</p>
      <p style={{ color: C.ink, marginTop: 2 }}>
        <span className="ff-display" style={{ fontSize: "1.5rem" }}>{value}</span>
        <span style={{ fontSize: "0.6875rem", marginLeft: 2 }}>{unit}</span>
      </p>
    </div>
  );
}

export default function OpsHome({
  todayISO, lessons, members, events, participants, targetOf,
  teacherCount, nameOf, studentNameOf, onSeeSchedule
}) {
  const today = (lessons || []).filter((l) => dateOf(l) === todayISO)
    .sort((a, b) => (String(a.scheduled_at) < String(b.scheduled_at) ? -1 : 1));
  const overlaps = overlapsOf(lessons, todayISO);
  const by = countsByStatus(members);
  const upcoming = buildEvents(events, participants, targetOf)
    .filter((x) => String(x.ev.event_date) >= todayISO && x.state !== EVENT_STATES.WITHDRAWN)
    .slice(0, 3);

  return (
    <div className="space-y-3">
      <h2 className="ff-display italic" style={{ fontSize: "1.25rem", color: C.ink }}>ホーム</h2>
      <p style={small}>{todayISO}</p>

      {/* ★★数えるだけ。★4つ 並べます（★見本①）。 */}
      <div style={{ display: "flex", gap: 8 }}>
        <Stat label="きょうのレッスン" value={today.length} unit="件" />
        <Stat label="名簿の人数" value={rosterCount(members)} unit="人" />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Stat label="先生" value={teacherCount || 0} unit="人" />
        <Stat label="重なり" value={overlaps.length} unit="件" />
      </div>
      {by.paused > 0 || by.invited > 0 ? (
        <p style={small}>
          {by.paused > 0 ? `休会中 ${by.paused}人` : ""}
          {by.paused > 0 && by.invited > 0 ? "　／　" : ""}
          {by.invited > 0 ? `返事まち ${by.invited}人` : ""}
        </p>
      ) : null}

      {/* ★★きょうの ながれ。★該当が なければ 出しません。
          ★「今日の予定はありません」と 書かないこと。 */}
      {today.length > 0 ? (
        <div style={card}>
          <p style={{ ...small, marginBottom: 6 }}>きょうの ながれ</p>
          {today.map((l) => {
            const dup = overlaps.some((o) => o.lessons.some((x) => x.id === l.id));
            return (
              <div key={l.id} className="flex items-center justify-between gap-2"
                style={{ padding: "7px 0", borderTop: `1px solid ${C.line}`, fontSize: "0.8125rem" }}>
                <span style={{ color: C.ink }}>
                  {String(l.scheduled_at || "").slice(11, 16)}　
                  {nameOf ? nameOf(l.teacher_id) : ""}
                </span>
                <span style={{ color: C.inkSoft, fontSize: "0.6875rem" }}>
                  {dup ? "★重なり" : (studentNameOf ? studentNameOf(l.student_id) : "")}
                </span>
              </div>
            );
          })}
        </div>
      ) : null}

      {/* ★★重なり。★印を つけるだけです。★勝手に 動かしません（★見本①）。 */}
      {overlaps.length > 0 ? (
        <div style={{ ...card, background: C.paper }}>
          <p style={{ fontSize: "0.8125rem", color: C.ink }}>★重なり {overlaps.length}件</p>
          <p style={small}>重なりは印をつけるだけです。こちらで勝手に動かしません。</p>
          {onSeeSchedule ? (
            <button type="button" onClick={onSeeSchedule}
              className="w-full"
              style={{
                minHeight: 44, marginTop: 8, borderRadius: 10,
                border: `1px solid ${C.line}`, background: C.card, color: C.ink,
                fontSize: "0.8125rem"
              }}>日程で 見る</button>
          ) : null}
        </div>
      ) : null}

      {/* ★★近い 行事。★無ければ 出しません。 */}
      {upcoming.length > 0 ? (
        <div style={card}>
          <p style={{ ...small, marginBottom: 6 }}>近い 行事</p>
          {upcoming.map((x) => (
            <div key={x.ev.id} className="flex items-center justify-between gap-2"
              style={{ padding: "7px 0", borderTop: `1px solid ${C.line}`, fontSize: "0.8125rem" }}>
              <span style={{ color: C.ink }}>
                {Number(String(x.ev.event_date).slice(5, 7))}/{Number(String(x.ev.event_date).slice(8, 10))}　
                {x.ev.title || ""}
              </span>
              <span style={{ color: C.inkSoft, fontSize: "0.6875rem" }}>
                {x.countWord ? `出ます ${x.countWord}` : x.label}
              </span>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
