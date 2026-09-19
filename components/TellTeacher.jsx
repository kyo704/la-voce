"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { timeOf } from "@/lib/todayBand";
import { NOTICES, noticeLabel, ONLY_TEACHER_LINE, NO_REASON_LINES } from "@/lib/tellTeacher";

// ============================================================================
// 先生に 伝える ── 連絡板では ない、別の道（見本⑥ ／ 2026-09-10）
//
//   ★出どころ docs/opus/woolsong-見本-連絡6画面（9月9日）.html ⑥
//            docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §6-1 の 対処②
//
//   ★★§6-1 の いちばん大きな 危険への 手当てです。
//     ★休むことを 連絡板に 書くと、★体調が 門下の 全員に 伝わります。
//     ★★だから、★休むことは ここに 分けます。
//
//   ★★理由の 欄は ありません（★見本⑥）。
//     ★★欄が あれば、★書く人が 出ます。★書けば 体調が 伝わります。
//     ★列も 作っていません（★supabase/2026-09-10-先生に伝える.sql）。
//
//   ★★誰に 届くかを、★先に 書きます。★押したあとでは ありません。
//
//   ★言葉と 決めは lib/tellTeacher.js が 持ちます。
//
//   ★見張り components/tests/tell-teacher.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.78125rem", color: C.inkSoft, lineHeight: 1.8 };

export default function TellTeacher({ lesson, teacherName, onTell, onClose }) {
  const [picked, setPicked] = useState(lesson ? lesson.student_notice || null : null);
  const [busy, setBusy] = useState(false);
  if (!lesson) return null;

  // ★★★時刻は 端末の 時計で 読みます（★2026-09-18）。
  //   ★★`slice(11,16)` は 台帳の 字を そのまま 切ります。★台帳は UTC です。
  //   ★★15:00 の レッスンが「06:00」と 出ます。★9時間 ずれます。
  //   ★★★日づけも 同じ です。★夜の レッスンは、★前の 日に 見えます。
  const when = String(lesson.scheduled_at || "");
  const d = when ? new Date(when) : null;
  const whenWord = d && !Number.isNaN(d.getTime())
    ? `${d.getMonth() + 1}月${d.getDate()}日 ${timeOf(when) || ""}`
    : "";

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="ff-display italic" style={{ fontSize: "1.25rem", color: C.ink }}>先生に 伝える</h2>
        <button type="button" onClick={onClose} aria-label="とじる"
          style={{
            minWidth: 44, minHeight: 44, border: "none",
            background: "transparent", color: C.inkSoft, fontSize: "1.125rem"
          }}>✕</button>
      </div>

      {/* ★★誰に 届くかを、★いちばん上に 書きます（★見本⑥）。
          ★★押したあとに 知らせるのでは 遅すぎます。 */}
      <div style={{ ...card, background: C.paper }}>
        <p style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.9 }}>
          {ONLY_TEACHER_LINE.replace("{先生}", teacherName || "担当の先生")}
        </p>
      </div>

      <div style={card}>
        <p style={small}>どの レッスン</p>
        <p style={{ fontSize: "0.96875rem", color: C.ink, marginTop: 2 }}>{whenWord}</p>
        {lesson.note ? <p style={small}>{lesson.note}</p> : null}
      </div>

      {/* ★★伝えること。★3つだけです。★自由に 書く欄は ありません。 */}
      <p style={small}>伝えること</p>
      <div className="space-y-2">
        {NOTICES.map((n) => {
          const on = picked === n.key;
          return (
            <button key={n.key} type="button" onClick={() => setPicked(on ? null : n.key)}
              aria-pressed={on}
              className="w-full text-left"
              style={{
                minHeight: 56, borderRadius: 12, padding: "0 16px",
                border: `1px solid ${on ? C.curtain : C.line}`,
                borderBottomWidth: on ? 3 : 1,
                background: on ? C.paper : C.card,
                color: C.ink, fontSize: "0.96875rem"
              }}>{n.label}</button>
          );
        })}
      </div>

      {/* ★★理由の 欄が ない ことを、★はっきり 書きます。 */}
      {NO_REASON_LINES.map((l) => <p key={l} style={small}>{l}</p>)}

      <button type="button" disabled={busy || !picked}
        onClick={async () => {
          setBusy(true);
          const ok = await onTell(lesson.id, picked);
          setBusy(false);
          if (ok && onClose) onClose();
        }}
        className="w-full"
        style={{
          minHeight: 52, borderRadius: 12,
          border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
          background: picked ? C.curtain : C.line, color: "#FFFDF8",
          fontSize: "0.96875rem"
        }}>{busy ? "伝えています" : "伝える"}</button>
    </div>
  );
}
