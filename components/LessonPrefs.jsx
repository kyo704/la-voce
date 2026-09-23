"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { DAYS } from "@/lib/myTimetable";
import {
  MARU, SANKAKU, BATSU, nextLevel, markOf, LEVEL_WORDS,
  slotKey, isClassSlot, levelOf, countLevels, canEdit, DUE_NOTE, PREFS_NOTE
} from "@/lib/lessonRound";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★レッスンの 希望（★学生）── ★見本 `SC['レッスンの希望']`
//
//   ★★決めは `lib/lessonRound.js` が 持ちます。★ここでは 1つも 決めません。
//     ★押した ときの 次の 値 ／ 印 ／ 枠の 鍵 ／ 授業の マス ── ★ぜんぶ 借ります。
//
//   ★★★見本の 但し書きを、★1字も 変えずに 出します ──
//     「理由は うかがいません。」
//     「見るのは、担当の 先生と、日程を 組む 方だけです。ほかの 学生には 見えません。」
//     「授業の コマは、はじめから × に しています。授業の 名前は 先生に 伝わりません。」
//     「決まったら、きょうと 日程に 出ます。カレンダーにも 入れられます。」
//
//   ★★★授業の マスは **押せません**。★`×` と「授業」だけ 出します。
//     ★★授業の **名前**は 受け取りません。★props にも ありません。
//       ★「授業の 名前は 先生に 伝わりません」を、★仕組みで 守ります。
//
//   ★★しめきりは 日づけ だけ 書きます。★「あと n 日」を 数えません（★台帳の 決め）。
//
//   ★見張り components/tests/lesson-prefs-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

/** ★1つの マス。★押すと 次の 値に 変わります。 */
function マス({ level, classSlot, onTap }) {
  const 色 = classSlot
    ? { background: C.band2, color: C.inkSoft }
    : level === MARU ? { background: C.curtain, color: C.onCurtain }
    : level === SANKAKU ? { background: C.band2, color: C.ink, border: `1.5px solid ${C.curtain}` }
    : level === BATSU ? { background: C.card, color: C.inkSoft, border: `1.5px solid ${C.line}` }
    : { background: C.card, border: `1.5px dashed ${C.line}` };
  return (
    <button type="button" onClick={classSlot ? undefined : onTap} disabled={classSlot}
      aria-label={classSlot ? tx("授業") : markOf(level) || tx("まだ")}
      style={{
        width: "100%", minHeight: 46, borderRadius: 9, padding: 0,
        display: "flex", flexDirection: "column", alignItems: "center",
        justifyContent: "center", fontFamily: FONT_STACK,
        cursor: classSlot ? "default" : "pointer", ...色
      }}>
      <span style={{ fontSize: rem(17), fontWeight: 600, lineHeight: 1 }}>
        {classSlot ? "×" : markOf(level)}
      </span>
      {classSlot ? (
        <span style={{ fontSize: rem(12), marginTop: rem(3) }}>{tx("授業")}</span>
      ) : null}
    </button>
  );
}

export default function LessonPrefs({
  round, periods = [], timetable = [], prefs = {}, ngDates = [],
  onTap, onAddNg, onRemoveNg, onSend, busy = false, error = "", sent = false
}) {
  if (!round) return null;
  const 直せる = canEdit(round);
  const 数 = countLevels(prefs);

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(6)}` }}>
        {tx("レッスンの 希望")}
      </h2>
      <div style={{ ...小, marginBottom: rem(10) }}>
        {round.name}
        <br />
        {/* ★★しめきりの 日づけ だけ。★残りの 日数を 数えません。 */}
        {tx("しめきり")}　{round.due_on}（{tx(DUE_NOTE)}）
      </div>

      <div style={{ display: "flex", gap: rem(12), ...TYPE.li, marginBottom: rem(8) }}>
        {LEVEL_WORDS.map((w) => (
          <span key={w.mark}><b>{w.mark}</b> {tx(w.word)}</span>
        ))}
      </div>

      <div style={{ overflowX: "auto", margin: `0 -${rem(4)}` }}>
        <table style={{
          width: "100%", borderCollapse: "separate", borderSpacing: rem(4),
          tableLayout: "fixed", ...TYPE.li
        }}>
          <thead>
            <tr>
              <th style={{ width: "17%" }} />
              {DAYS.map((d, i) => (
                <th key={d} style={{ fontWeight: 500, color: C.inkSoft }}>{d}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {periods.map((p) => (
              <tr key={p.id}>
                <td style={{ color: C.inkSoft, lineHeight: 1.3 }}>
                  {p.name}
                </td>
                {DAYS.map((d, di) => {
                  // ★★★曜日は **0 から** 数えます（2026-09-23 に 直しました）。
                  //   ★★台帳の `my_timetable.weekday` は 0〜6 です
                  //     （`my_timetable_weekday_ok` … weekday >= 0 and weekday <= 6）。
                  //   ★★`seed_prefs_from_timetable` は その 生の 値で 鍵を 作ります ──
                  //       t.weekday::text || '-' || t.period_id::text
                  //   ★★`lib/myTimetable.js` の `buildGrid` も `cellKey(wd, …)` を
                  //     **0 から** 呼んで います。
                  //   ★★★1 から 数えて いた ため、★月曜の 希望が "1-…" に なり、
                  //     ★授業の × は "0-…" に 付いて いました ── ★1日 ずれます。
                  //     ★★土（5）が 6 に なると、★日曜と 同じ 鍵に なります。
                  const wd = di;
                  const k = slotKey(wd, p.id);
                  return (
                    <td key={d}>
                      <マス level={levelOf(prefs, k)}
                        classSlot={isClassSlot(timetable, wd, p.id)}
                        onTap={直せる && onTap ? () => onTap(k, nextLevel(levelOf(prefs, k))) : undefined} />
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...小, margin: `${rem(6)} 0 ${rem(14)}` }}>
        {tx("押すたびに ◎ → △ → × → 空 と 変わります。")}
        　◎ {数.maru}　△ {数.sankaku}
      </div>

      <h3 style={{ ...TYPE.h3, marginBottom: rem(6) }}>{tx("この日は だめ")}</h3>
      <div style={{ background: C.card, border: `1px solid ${C.line}`, borderRadius: 12 }}>
        {ngDates.map((v) => (
          <div key={v} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            padding: `${rem(10)} ${rem(12)}`, borderBottom: `1px solid ${C.line2}`, ...TYPE.li
          }}>
            <span>{v}</span>
            {直せる ? (
              <button type="button" onClick={() => onRemoveNg && onRemoveNg(v)}
                style={{
                  minHeight: 44, padding: `0 ${rem(11)}`, borderRadius: 999,
                  border: `1px solid ${C.line}`, background: C.card,
                  color: C.inkSoft, fontFamily: FONT_STACK, ...TYPE.usual
                }}>{tx("消す")}</button>
            ) : null}
          </div>
        ))}
        {直せる ? (
          <button type="button" onClick={() => onAddNg && onAddNg()}
            style={{
              width: "100%", minHeight: 44, textAlign: "left",
              padding: `${rem(10)} ${rem(12)}`, background: "transparent",
              border: "none", color: C.curtain, fontFamily: FONT_STACK, ...TYPE.li
            }}>{tx("＋ 日を 足す")}</button>
        ) : null}
      </div>

      {error ? (
        <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(10) }}>{error}</p>
      ) : null}

      {直せる ? (
        <button type="button" onClick={onSend} disabled={busy}
          style={{
            width: "100%", minHeight: 44, marginTop: rem(12), borderRadius: 13,
            padding: `${rem(14)} 0`, background: C.curtain, color: C.onCurtain,
            border: "none", fontFamily: FONT_STACK, fontWeight: 700,
            opacity: busy ? 0.5 : 1, ...TYPE.body
          }}>
          {sent ? tx("直した ものを 送る") : tx("送る")}
        </button>
      ) : null}

      {/* ★★★見本の 但し書き。★1字も 足しません。★決めは lib が 持ちます。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {PREFS_NOTE.map((line, i) => (
          <span key={i} style={{ display: "block" }}>{tx(line)}</span>
        ))}
      </div>
    </div>
  );
}
