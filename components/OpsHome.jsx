"use client";

import { C } from "@/lib/tokens";
import { homeSections, EMPTY_LINE } from "@/lib/opsHomeSections";
// ★★つけ終わって いるかを、★行の 右に 出します（★2026-09-18）。
import { attendanceLabel } from "@/lib/todayBand";
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
  teacherCount, nameOf, studentNameOf, onSeeSchedule, onOpenAttendance, perms
}) {
  // ★★★節ごとに、★できことで 出す／出さない（★裁定 その79・2026-09-18）。
  //   ★★見本は 役職で 3つの 画面に 分けて います（P_home / P_homeS / P_homeT）。
  //   ★★★1つの 画面の まま に します。
  //     ★★「学長・副学長」「事務」「先生」は **役職の 名** で 束ねた もの です。
  //     ★★役職は 学校が 自由に 作れます（★裁定 その75）。
  //       ★★「特任教授」を 作った 日に、★どの 画面を 出すか 決められません。
  //   ★★決めは lib/opsHomeSections.js が 持ちます。★ここでは 決めません。
  const 出す = (key) => homeSections(perms).some((x) => x.key === key);
  const 節の数 = homeSections(perms).length;
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

      {/* ★★★1つも 出ない 役職が あり得ます（★裁定 その79 の note）。
          ★★いま ひな型 10役職 の どれも 1つ以上 出ます（★数えました）。
            ★★いちばん 少ないのは 職員の 1つ（きょうの ながれ）です。
          ★★★けれど 学校は 役職を 自由に 作れます。
            ★★できことを 1つも 付けない 役職も 作れます。
          ★★空の 画面を 出しません。★白い 紙は「壊れた」と 読まれます。
            ★★何が できる かを 1行 書きます。★何が できないかでは ありません。 */}
      {節の数 === 0 ? <p style={small}>{EMPTY_LINE}</p> : null}

      {/* ★★数えるだけ。★4つ 並べます（★見本①）。 */}
      <div style={{ display: "flex", gap: 8 }}>
        <Stat label="きょうのレッスン" value={today.length} unit="件" />
        <Stat label="名簿の人数" value={rosterCount(members)} unit="人" />
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        <Stat label="先生" value={teacherCount || 0} unit="人" />
        <Stat label="重なり" value={overlaps.length} unit="件" />
      </div>
      {/* ★★2026-09-13、★ようすは active／left の 2つ だけ。
          ★★休会・返事まちは 台帳に ありません。★出しません。 */}
      {by.left > 0 ? (
        <p style={small}>{`退会 ${by.left}人`}</p>
      ) : null}

      {/* ★★きょうの ながれ。★該当が なければ 出しません。
          ★「今日の予定はありません」と 書かないこと。 */}
      {出す("nagare") && today.length > 0 ? (
        <div style={card}>
          <p style={{ ...small, marginBottom: 6 }}>きょうの ながれ</p>
          {today.map((l) => {
            const dup = overlaps.some((o) => o.lessons.some((x) => x.id === l.id));
            // ★★★出欠の 入口 ①（★裁定 その79・2026-09-18）。
            //   ★★「ホーム → きょうの ながれ → その 行」。
            //   ★★★きょうまで、★この 行は 押せません でした。
            //     ★★裁定 その79 は 帯を 作らない と 決めて います。
            //     ★★入口は 2つ しか ありません。★どちらも 塞がって いました。
            //   ★★★開く 先が 無い ときは、★押せる ように しません（★§8⑤）。
            //     ★★`onOpenAttendance` が 渡されて はじめて 押せます。
            const 中身 = (
              <>
                <span style={{ color: C.ink }}>
                  {String(l.scheduled_at || "").slice(11, 16)}　
                  {nameOf ? nameOf(l.teacher_id) : ""}
                </span>
                <span style={{ color: C.inkSoft, fontSize: "0.6875rem" }}>
                  {/* ★★つけ終わって いるかを、★ここで お見せします。
                      ★★★開く 前に 分かります。★開いて から 知る、では ありません。 */}
                  {dup ? "★重なり" : (l.attendance
                    ? `済 ${attendanceLabel(l.attendance) || ""}`
                    : (studentNameOf ? studentNameOf(l.student_id) : ""))}
                  {onOpenAttendance ? "　›" : ""}
                </span>
              </>
            );
            const 並び = {
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 8, width: "100%", textAlign: "left",
              padding: "7px 0", borderTop: `1px solid ${C.line}`, fontSize: "0.8125rem"
            };
            return onOpenAttendance ? (
              <button key={l.id} type="button" onClick={() => onOpenAttendance(l)}
                style={{ ...並び, minHeight: 44, background: "transparent", border: "none" }}>
                {中身}
              </button>
            ) : (
              <div key={l.id} style={並び}>{中身}</div>
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

      {/* ★★近い 行事。★無ければ 出しません。★できことが 無ければ 出しません。 */}
      {出す("gyoji") && upcoming.length > 0 ? (
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
