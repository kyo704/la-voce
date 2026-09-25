// ============================================================================
// ★よてい ── ★レッスン 1件の 中身（★2026-09-25・C群 束2）
//
//   ★見本 `SC_yotei`（★design-v51）。
//
//   ★★読むだけ の 画面 です。★1つだけ 書く ところが あります ──
//     ★「休むことを 伝える」。★書くのは `lessons.student_notice` だけ です。
//     ★★決まり `lessons_student_notice` が、★その 1列 しか 通しません。
//   ★★★`attendance` を 書く 道が ありません。★台帳が 受け取りません。
//
//   ★★字と 並びは `lib/yotei.js` が 持ちます。★ここでは 決めません。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import {
  BACK_TO, DASH, rowsOf, BTN_TELL, mayTell, toldWord, NOTE_LINES,
  AS_LESSON, tellLessonWord, MEMO_HEAD, MEMO_ADD, NO_ORG_WORD, lessonNoteLines
} from "@/lib/yotei";

export default function Yotei({
  lesson, teacherName, placeName, orgName, whenWord, as: 姿,
  onTell, onMemo, onBack
}) {
  const l = lesson || {};
  const rows = rowsOf(l, { teacherName, placeName });
  // ★★2つの 姿 ── ★よてい と レッスン。★行は 同じ、★断りが ちがいます。
  const レッスン = 姿 === AS_LESSON;
  const 断り = レッスン ? lessonNoteLines(orgName) : NOTE_LINES;

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={(l.kind || "レッスン") + "　" + (teacherName || "")} />
      {/* ★★教室が 無い ときは「あなただけの 予定」と 書きます（★見本の まま）。 */}
      <p style={{ fontSize: "0.8125rem", color: C.inkSoft, margin: "0 0 10px" }}>
        {whenWord || DASH}
        {orgName ? "　／　" + orgName : (レッスン ? "　／　" + NO_ORG_WORD : "")}
      </p>

      <Box>
        {rows.map((r, i) => (
          <div key={r.label} style={{
            display: "flex", alignItems: "center", justifyContent: "space-between",
            gap: 12, padding: "12px 14px",
            borderTop: i === 0 ? "none" : `1px solid ${C.line}`
          }}>
            <span style={{ fontSize: "0.875rem", color: C.ink }}>{r.label}</span>
            <span style={{ fontSize: "0.875rem", color: C.inkSoft }}>{r.value}</span>
          </div>
        ))}
      </Box>

      {/* ★★先生が いない 回、★すでに 伝えて ある 回には 出しません。
          ★★★押せない 札を 置かない、★2度 送らない（★見本「1回だけ」）。 */}
      {mayTell(l) ? (
        <button type="button" onClick={() => onTell && onTell(l.id)}
          style={{
            minHeight: 44, marginTop: 12, padding: "0 14px", borderRadius: 10,
            border: `1px solid ${C.line}`, background: C.card,
            color: C.ink, fontSize: "0.875rem", cursor: "pointer"
          }}>{レッスン ? tellLessonWord(teacherName) : BTN_TELL}</button>
      ) : l.student_notice ? (
        <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: 12, lineHeight: 1.85 }}>
          {toldWord(teacherName)}
        </p>
      ) : null}

      {/* ★★レッスンに だけ ある もの ── ★この日の 稽古メモ。
          ★★渡されて いない ときは 出しません（★押せない 札を 置きません）。 */}
      {レッスン && onMemo ? (
        <>
          <p style={{ fontSize: "0.8125rem", color: C.ink, margin: "16px 0 6px", fontWeight: 600 }}>
            {MEMO_HEAD}
          </p>
          <button type="button" onClick={onMemo}
            style={{
              display: "block", width: "100%", minHeight: 44, borderRadius: 10,
              border: `1px solid ${C.line}`, background: C.card,
              color: C.ink, fontSize: "0.9375rem", cursor: "pointer"
            }}>{MEMO_ADD}</button>
        </>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {断り.map((l2, i) => (
          <p key={i} style={{
            fontSize: "0.8125rem",
            color: i === (レッスン ? 1 : 2) ? C.ink : C.inkSoft, lineHeight: 1.9
          }}>{l2}</p>
        ))}
      </div>
    </div>
  );
}
