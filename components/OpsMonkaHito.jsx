"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { TABLE_CLASS, ANCHOR_CLASSES } from "@/lib/visualTokens";
import { ScreenHead, H3, Card, Li, Note } from "@/components/UiV2";
import { DAYS, periodWord } from "@/lib/opsKumu";
import {
  BACK_LABEL, ATT_HEAD, FREE_HEAD, CANNOT_HEAD, NO_COUNT, COUNT_UNIT,
  FREE_WORD, BUSY_WORD, FREE_NOTE, RATE_NOTE, attendanceBlock, freeGrid,
  freeCount, CANNOT_SEE, CANNOT_WORD, SIDE_LABELS, TIMETABLE_UNKNOWN,
  SLOT_NOT_YET, NOTES
} from "@/lib/opsMonkaHito";

// ============================================================================
// ★門下の ひと 1人（★見本 `P_monkaHito`）
//
//   ★★決めは lib/opsMonkaHito.js が 持ちます。★ここでは 決めません。
//   ★★数え方は lib/attendanceCount.js が 持ちます。★ここで 数えません。
//
//   ★★★読めない ものを、★空で 出しません ──
//     ★出席が 0件の とき …… ★「—」。★「0回」と 書きません。
//     ★空きが 読めない とき … ★表ごと 出しません。★1行 断ります。
//
//   ★見張り components/tests/ops-monka-hito.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsMonkaHito({
  studentId, name, grade, isRepresentative,
  lessons = [], teacherId, preset, heldTimes,
  // ★★空きの 並び（★`get_student_free_slots` が 返した まま）。
  //   ★★渡されなければ「読めて いない」と します。★空とは 別 です。
  freeSlots, periods = [],
  onClose, onGoKumu, onSlotNotYet, slotNote = ""
}) {
  const 出席 = attendanceBlock(lessons, teacherId, studentId, preset, heldTimes);
  const 表 = freeGrid(freeSlots, studentId, DAYS, periods);
  const 空き数 = freeCount(表);

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={name || ""} right={
        onClose ? (
          <button type="button" onClick={onClose}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, padding: "0 4px", fontFamily: FONT_STACK
            }}>‹ {BACK_LABEL}</button>
        ) : null} />
      <p style={{ ...小, margin: "-4px 0 10px" }}>
        {grade || ""}{isRepresentative ? "　／　代表" : ""}
      </p>

      {/* ★★★出席 ── ★回数 だけ。★率を 出しません（★裁定 その90 §4）。 */}
      <H3>{ATT_HEAD}</H3>
      <Card>
        {出席.name ? <div style={小}>{出席.name}</div> : null}
        <div style={{ display: "flex", gap: 26, alignItems: "baseline", marginTop: 7 }}>
          <div>
            <span style={{
              fontSize: rem(24), fontWeight: 700, color: C.ink,
              fontVariantNumeric: "tabular-nums"
            }}>{出席.came == null ? NO_COUNT : 出席.came}</span>
            <span style={小}>　{COUNT_UNIT}</span>
          </div>
          {出席.heldWord ? (
            <div style={小}>いま <b style={{ color: C.ink }}>{出席.heldWord}</b></div>
          ) : null}
        </div>
        {出席.short ? (
          <p style={{ ...小, margin: "9px 0 0", color: C.ink }}>{出席.short}</p>
        ) : null}
      </Card>
      <p style={{ ...小, margin: "4px 0 12px" }}>{RATE_NOTE}</p>

      {/* ★★★来られる 時間 ── ★空いて いるか どうか だけ です。 */}
      <H3>{FREE_HEAD}</H3>
      {表 === null ? (
        <Card><p style={{ ...小, margin: 0 }}>{FREE_NOTE}</p></Card>
      ) : (
        <div className={TABLE_CLASS}>
          <table style={{
            borderCollapse: "separate", borderSpacing: 0, width: "100%"
          }}>
            <tbody>
              <tr>
                <th className={ANCHOR_CLASSES[1]} style={見出し}>コマ</th>
                {DAYS.map((d) => <th key={d} style={見出し}>{d}</th>)}
              </tr>
              {表.map((r) => (
                <tr key={r.period.id || r.period.ord}>
                  <td className={ANCHOR_CLASSES[1]} style={{ ...ます, ...TYPE.mini }}>
                    {periodWord(r.period)}
                  </td>
                  {r.cells.map((来られる, di) => (
                    <td key={di} style={ます}>
                      <div style={{
                        height: 40, borderRadius: 5,
                        background: 来られる ? C.sage : C.band,
                        color: 来られる ? C.onCurtain : C.ink4,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        fontSize: rem(12.5)
                      }}>{来られる ? FREE_WORD : BUSY_WORD}</div>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p style={{ ...小, margin: "7px 0 12px" }}>{FREE_NOTE}</p>

      {/* ★★★右の 1枚 ── ★分かる ものだけ 書きます。 */}
      <Card style={{ padding: 0 }}>
        <Li right={grade || NO_COUNT}>{SIDE_LABELS.grade}</Li>
        {/* ★★★「出て いるか」は 分かりません（★台帳 08-11）。
             ★★空きの 数からは 分けられません。★「まだ」と 言い切りません。 */}
        <Li right={TIMETABLE_UNKNOWN}>{SIDE_LABELS.timetable}</Li>
        <Li right={空き数 == null ? NO_COUNT : `${空き数}コマ`}>{SIDE_LABELS.free}</Li>
        {/* ★★★枠は まだ しまえません。★押すと そう 出ます（★§8⑤）。 */}
        <Li right="›" last onClick={() => {
          if (onGoKumu) onGoKumu();
          else if (onSlotNotYet) onSlotNotYet(SLOT_NOT_YET);
        }}>{SIDE_LABELS.slot}</Li>
      </Card>
      {slotNote ? <p style={{ ...小, margin: "6px 0 0", color: C.ink }}>{slotNote}</p> : null}

      {/* ★★★見られない もの ── ★隠さずに 書きます。 */}
      <H3>{CANNOT_HEAD}</H3>
      <Card style={{ padding: 0 }}>
        {CANNOT_SEE.map((v, i) => (
          <Li key={v} right={CANNOT_WORD} last={i === CANNOT_SEE.length - 1}>
            <span style={{ color: C.ink4 }}>{v}</span>
          </Li>
        ))}
      </Card>

      <Note>{NOTES.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}</Note>
    </div>
  );
}

const 見出し = {
  padding: `${rem(9)} ${rem(8)}`, textAlign: "center",
  fontSize: rem(12.5), color: C.inkSoft, fontWeight: 400,
  borderBottom: `1px solid ${C.line}`
};
const ます = { padding: `${rem(4)} ${rem(4)}`, verticalAlign: "middle" };
