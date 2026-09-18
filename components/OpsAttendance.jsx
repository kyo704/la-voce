"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK, cardStyle } from "@/lib/uiKit";
import {
  MARKS, mayMark, isMine, isActingFor, ACTING_NOTE,
  LOCKED_LINES, LOCKED_EMPTY, LOCKED_EMPTY_SUB, NOTES, nextUnmarked, countLine
} from "@/lib/opsAttendance";
import { tx } from "@/lib/t";

// ============================================================================
// ★出欠を つける（★1人ずつ の 姿・★見本 `P_shukketsu` の ②）
//
//   ★★★押した その場で 変わります。★「よろしいですか」を 出しません。
//     ★★確認より 速く、★間違いも 直せます（★`取り消す`）。
//
//   ★★★つけられない ときは、★**お名前も 出しません**。
//     ★★よその 門下の 名簿は、★1人も 出しません。
//     ★★「つけられない」と「見えない」を、★同時に 守ります。
//
//   ★★決めは lib/opsAttendance.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/ops-attendance.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsAttendance({
  lessons = [], current, perms, userId, nameOf, teacherNameOf,
  onMark, onClose, busy, error = ""
}) {
  const l = current || null;
  if (!l) return null;

  const つけられる = mayMark(perms, { lesson: l, userId });
  const 代わりに = isActingFor(l, userId, perms);
  const 次 = nextUnmarked(lessons, l.id);

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      {/* ★★題 ── ★時刻と レッスン。★その 下に 先生。 */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <h2 style={{ ...TYPE.title, color: C.ink, margin: 0 }}>
          {String(l.scheduled_at || "").slice(11, 16)}　{tx("レッスン")}
        </h2>
        {onClose ? (
          <button type="button" onClick={onClose}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, padding: "0 4px", fontFamily: FONT_STACK
            }}>{tx("もどる")}</button>
        ) : null}
      </div>
      <p style={{ ...小, margin: "2px 0 10px" }}>
        {(teacherNameOf && teacherNameOf(l.teacher_id)) || tx("先生")}
        {isMine(l, userId) ? "" : `　${tx("先生")}`}
      </p>

      {/* ★★★つけられない とき ── ★お名前も 出しません。 */}
      {!つけられる ? (
        <>
          <div style={{ ...cardStyle, background: C.paper, borderColor: C.line }}>
            {LOCKED_LINES.map((t) => (
              <p key={t} style={{ ...小, margin: 0, color: C.ink }}>{t}</p>
            ))}
          </div>
          <div style={{ ...cardStyle, marginTop: rem(9), textAlign: "center" }}>
            <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>{LOCKED_EMPTY}</p>
            <p style={{ ...小, margin: "4px 0 0" }}>{LOCKED_EMPTY_SUB}</p>
          </div>
        </>
      ) : (
        <>
          {/* ★★代わりに つける とき ── ★必ず お伝えします。 */}
          {代わりに ? (
            <div style={{ ...cardStyle, background: C.paper, borderColor: C.curtain }}>
              <p style={{ ...小, margin: 0, color: C.ink }}>{ACTING_NOTE}</p>
            </div>
          ) : null}

          {/* ★★その方 ── ★大きく。★見本は 24px です。 */}
          <div style={{ ...cardStyle, marginTop: rem(9), borderColor: C.inkSoft }}>
            <div style={{ fontSize: rem(24), fontWeight: 700, color: C.ink, letterSpacing: "0.02em" }}>
              {(nameOf && nameOf(l.student_id)) || tx("お名前が ありません")}
            </div>

            {/* ★★3つの 札。★大きく、★横に 並べます（★見本の とおり）。 */}
            <div style={{ display: "flex", gap: 10, marginTop: rem(12) }}>
              {MARKS.map((m) => {
                const on = l.attendance === m.key;
                return (
                  <button key={m.key} type="button" disabled={busy}
                    onClick={() => onMark && onMark(l, on ? null : m.key)}
                    aria-pressed={on}
                    style={{
                      flex: 1, minHeight: 56, borderRadius: 12,
                      border: `1px solid ${on ? C.curtain : C.line}`,
                      background: on ? C.curtain : C.card,
                      color: on ? "#FFFDF8" : C.ink,
                      fontSize: rem(16), fontFamily: FONT_STACK
                    }}>{m.label}</button>
                );
              })}
            </div>

            {/* ★★つけた あと ── ★誰が つけたか を 残します。★取り消せます。 */}
            {l.attendance ? (
              <p style={{ ...小, margin: `${rem(11)} 0 0` }}>
                <span style={{ color: C.sage, fontWeight: 700 }}>
                  ✓ {(MARKS.find((m) => m.key === l.attendance) || {}).label}
                </span>
                {"　"}{tx("つけた人")}
                {(teacherNameOf && teacherNameOf(l.attendance_by)) || ""}
                {"　"}
                <button type="button" disabled={busy}
                  onClick={() => onMark && onMark(l, null)}
                  style={{
                    background: "transparent", border: "none", color: C.curtain,
                    ...TYPE.mini, padding: 0, minHeight: 44, fontFamily: FONT_STACK
                  }}>{tx("取り消す")}</button>
              </p>
            ) : (
              <p style={{ ...小, margin: `${rem(11)} 0 0` }}>{tx("まだ つけて いません。")}</p>
            )}
          </div>

          {error ? (
            <p style={{ ...小, color: C.curtain, margin: `${rem(8)} 0 0` }}>{error}</p>
          ) : null}

          {/* ★★次の 方へ ── ★戻らずに 進めます（★見本の とおり）。 */}
          {次 ? (
            <button type="button" disabled={busy}
              onClick={() => onMark && onMark(次, undefined)}
              style={{
                width: "100%", minHeight: 52, marginTop: rem(10), borderRadius: 12,
                border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
                background: C.curtain, color: "#FFFDF8", fontSize: rem(15),
                fontFamily: FONT_STACK
              }}>
              {tx("次の 方へ")}　{(nameOf && nameOf(次.student_id)) || ""}
            </button>
          ) : null}

          {/* ★★数 ── ★いま どこまで 来たか。 */}
          <p style={{ ...小, margin: `${rem(10)} 0 0` }}>{countLine(lessons)}</p>
        </>
      )}

      <div style={{ marginTop: rem(10) }}>
        {NOTES.map((t) => (<p key={t} style={{ ...小, margin: 0 }}>{t}</p>))}
      </div>
    </div>
  );
}
