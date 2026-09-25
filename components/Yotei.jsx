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
  BACK_TO, DASH, rowsOf, BTN_TELL, mayTell, toldWord, NOTE_LINES
} from "@/lib/yotei";

export default function Yotei({ lesson, teacherName, placeName, orgName, whenWord, onTell, onBack }) {
  const l = lesson || {};
  const rows = rowsOf(l, { teacherName, placeName });

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={(l.kind || "レッスン") + "　" + (teacherName || "")} />
      <p style={{ fontSize: "0.8125rem", color: C.inkSoft, margin: "0 0 10px" }}>
        {whenWord || DASH}{orgName ? "　／　" + orgName : ""}
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
          }}>{BTN_TELL}</button>
      ) : l.student_notice ? (
        <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: 12, lineHeight: 1.85 }}>
          {toldWord(teacherName)}
        </p>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {NOTE_LINES.map((l2, i) => (
          <p key={i} style={{
            fontSize: "0.8125rem", color: i === 2 ? C.ink : C.inkSoft, lineHeight: 1.9
          }}>{l2}</p>
        ))}
      </div>
    </div>
  );
}
