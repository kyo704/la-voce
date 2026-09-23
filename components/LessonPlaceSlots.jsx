"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { DAYS, cellLabel } from "@/lib/myTimetable";
import { placeableSlots, OKERU_NOTE, OKERU_EMPTY_HEAD, OKERU_EMPTY_HOW, OKERU_FOOT } from "@/lib/lessonRound";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★置ける 枠 ── ★見本 `P_okeru`
//
//   ★出どころ woolsong-2026-09-21_24（docs/opus/pack-2026-09-21_24・2026-09-23 展開）
//     ／ 00-動く見本-PC・iPad（運営）.html（md5 c19ce4d1）
//
//   ★★決めは `lib/lessonRound.js` が 持ちます。★ここでは 1つも 決めません。
//     ★どの 枠を 出すか（★来られる ／ 空いて いる ／ 先生が 空いて いる）── ★借ります。
//
//   ★★★出すのは「押せる 枠」だけ です。
//     ★見本の 但し書き …「あなたの 予定が 入っている 枠は 出しません」
//     ★★押せない ものを 灰色で 並べません。★不具合に 見えます（★裁定176 §3）。
//
//   ★★★希望が 出て いなくても 置ける、は **この 画面の 外** の 話 です。
//     ★見本 …「希望が 出ていなくても、置くことは できます」── ★時間割から 置きます。
//     ★★ここは「その方が 来られる 枠」だけ を 出す 画面 です。
//
//   ★見張り components/tests/lesson-place-slots.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function LessonPlaceSlots({
  student, periods = [], prefs = {}, placed = {}, busy = {}, onPlace, onBack, busyNow = false
}) {
  if (!student) return null;
  const 枠 = placeableSlots({ prefs, placed, busy, periods, days: DAYS.length });

  return (
    <div>
      {onBack ? (
        <button type="button" onClick={onBack}
          style={{
            minHeight: 44, padding: `0 ${rem(11)}`, borderRadius: 999, marginBottom: rem(6),
            border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
            fontFamily: FONT_STACK, ...TYPE.usual
          }}>{tx("レッスンの 日程を 組む")}</button>
      ) : null}

      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(4)}` }}>{student.name}</h2>
      <div style={{ ...小, marginBottom: rem(10) }}>
        {/* ★★数えるのは「入れられる 枠」です。★人を 数えません。 */}
        {tx("入れられる 枠")}　{枠.length}
      </div>

      <div style={{
        background: C.band, border: `1px solid ${C.line3}`, borderRadius: 12,
        padding: rem(12), marginBottom: rem(10), ...TYPE.li
      }}>{tx(OKERU_NOTE)}</div>

      {枠.length === 0 ? (
        <div style={{
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
          padding: `${rem(22)} ${rem(10)}`, textAlign: "center"
        }}>
          <div style={{ ...TYPE.li, color: C.ink }}>{tx(OKERU_EMPTY_HEAD)}</div>
          <div style={{ ...小, marginTop: rem(4) }}>{tx(OKERU_EMPTY_HOW)}</div>
        </div>
      ) : (
        <div style={{
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
          maxWidth: 640, overflow: "hidden"
        }}>
          {枠.map((x) => (
            <button key={x.key} type="button" disabled={busyNow}
              onClick={() => onPlace && onPlace(x.key)}
              style={{
                width: "100%", minHeight: 44, display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: rem(8), textAlign: "left",
                padding: `${rem(10)} ${rem(12)}`, background: "transparent",
                border: "none", borderBottom: `1px solid ${C.line2}`,
                color: C.ink, fontFamily: FONT_STACK, opacity: busyNow ? 0.5 : 1, ...TYPE.li
              }}>
              <span>{cellLabel(x.weekday, x.period)}</span>
              <span style={{ color: C.curtain }}>{tx("ここに 入れる")} ›</span>
            </button>
          ))}
        </div>
      )}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {OKERU_FOOT.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
