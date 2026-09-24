"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK, cardStyle } from "@/lib/uiKit";
import { TABLE_CLASS, ANCHOR_CLASSES } from "@/lib/visualTokens";
import {
  MARKS, mayMark, isActingFor, ACTING_NOTE,
  LOCKED_LINES, LOCKED_EMPTY, LOCKED_EMPTY_SUB, NOTES,
  BULK_WARN, BULK_TAP_LINE,
  draftOf, setDraft, changedRows, bulkCountLine, saveWord,
  BACK_LABEL, BACK_MINE_LABEL
} from "@/lib/opsAttendance";
import { Warn } from "@/components/UiV2";
import { timeOf } from "@/lib/todayBand";
import { tx } from "@/lib/t";

// ============================================================================
// ★まとめて つける（★裁定 その91 R4・2026-09-18）
//
//   ★★★開いた とき、★まだ 白い 方は **出席** です。
//     ★★実際は「ほとんど 出席、★休みは 1〜2人」です。
//     ★★★20人を 1人ずつ 押すのは 20回 です。★ちがう 方だけ 直します。
//
//   ★★★保存する まで、★台帳に 書きません。
//     ★★だから「つけ忘れが 出席に なる」ことが 起こり得ます。
//     ★★★保存の 前に「◯人を つけました」と 出します。
//     ★★一度も 触らずに 保存する ことも できます（★先生の ご判断 です）。
//
//   ★★もとから つけて ある ものは、★上書きしません。
//     ★★きのう「休み」と つけた 方が、★開いた だけ で 変わっては いけません。
//
//   ★★決めは lib/opsAttendance.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/attendance-bulk.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };
const 罫 = `1px solid ${C.line}`;

export default function OpsAttendanceBulk({
  lessons = [], perms, userId, nameOf, teacherNameOf, gradeOf,
  onSave, onOpenOne, onClose, onGoMine, busy, error = ""
}) {
  const 先頭 = lessons[0] || null;
  const [draft, setDraftState] = useState(() => draftOf(lessons));

  if (!先頭) return null;
  const つけられる = mayMark(perms, { lesson: 先頭, userId });
  const 代わりに = isActingFor(先頭, userId, perms);

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      {/* ★★題 ── ★時刻と レッスン。 */}
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 8 }}>
        <h2 style={{ ...TYPE.title, color: C.ink, margin: 0 }}>
          {timeOf(先頭.scheduled_at) || ""}　{tx("レッスン")}
        </h2>
        {/* ★★★戻り道は 2つ（★裁定 その91 R1）。
            ★★つけられない 役職でも、★来た 道に 戻れます。 */}
        <span style={{ display: "flex", gap: 4 }}>
          {onClose ? (
            <button type="button" onClick={onClose}
              style={戻りの形}>{BACK_LABEL}</button>
          ) : null}
          {onGoMine ? (
            <button type="button" onClick={onGoMine}
              style={戻りの形}>{BACK_MINE_LABEL}</button>
          ) : null}
        </span>
      </div>
      <p style={{ ...小, margin: "2px 0 10px" }}>
        {(teacherNameOf && teacherNameOf(先頭.teacher_id)) || tx("先生")}
      </p>

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
          {代わりに ? (
            <div style={{ ...cardStyle, background: C.paper, borderColor: C.curtain }}>
              <p style={{ ...小, margin: 0, color: C.ink }}>{ACTING_NOTE}</p>
            </div>
          ) : null}

          {/* ★★★数（★裁定 その91 R5）。★率は 出しません（★裁定 その90）。 */}
          {/* ==============================================================
              ★★なぜ ぜんぶ「出席」で 始まるのか（★見本の warn・2026-09-24）。
                ★★書いて いないと、★勝手に 付いて いる ように 見えます。
             ============================================================== */}
          <Warn>
            {BULK_WARN.map((t) => (
              <span key={t} style={{ display: "block" }}>{tx(t)}</span>
            ))}
          </Warn>

          <p style={{ ...TYPE.li, color: C.ink, margin: `${rem(9)} 0 ${rem(6)}` }}>
            {bulkCountLine(lessons, draft)}
          </p>

          {/* ★★★まとめて 入れる 札。★「全部 出席」は 既定 なので 置きません。
              ★★置くと、★押さないと 始まらない ように 見えます。
              ★★ここに 置くのは「ちがう ほう」だけ です。 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: rem(8) }}>
            {MARKS.map((m) => (
              <button key={m.key} type="button" disabled={busy}
                onClick={() => setDraftState(() => {
                  const 次 = {};
                  lessons.forEach((l) => { 次[l.id] = m.key; });
                  return 次;
                })}
                style={{
                  minHeight: 44, padding: `0 ${rem(12)}`, borderRadius: 999,
                  border: `1px solid ${C.line}`, background: C.card,
                  color: C.inkSoft, ...TYPE.mini, fontFamily: FONT_STACK
                }}>{tx("全部")} {m.label}</button>
            ))}
          </div>

          {/* ★★一覧。★お名前を 押すと、★その方 ひとりの 画面へ（★見本の とおり）。 */}
          <div className={TABLE_CLASS}>
            <table style={{ borderCollapse: "separate", borderSpacing: 0, width: "100%" }}>
              <thead>
                <tr>
                  <th className={ANCHOR_CLASSES[1]} style={見出しの形}>{tx("お名前")}</th>
                  {MARKS.map((m) => (
                    <th key={m.key} style={{ ...見出しの形, textAlign: "center" }}>{m.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => {
                  const v = draft[l.id];
                  return (
                    <tr key={l.id}>
                      <td className={ANCHOR_CLASSES[1]} style={{ ...ますの形, minWidth: 150 }}>
                        <button type="button"
                          onClick={() => { if (onOpenOne) onOpenOne(l); }}
                          style={{
                            background: "transparent", border: "none", padding: 0,
                            minHeight: 44, color: C.curtain, ...TYPE.usual,
                            fontFamily: FONT_STACK, textAlign: "left"
                          }}>
                          {(nameOf && nameOf(l.student_id)) || tx("お名前が ありません")}
                          {onOpenOne ? " ›" : ""}
                        </button>
                        {/* ★★学年（★裁定 その91 R2）。★場所は 出しません（★列が ありません）。 */}
                        {gradeOf && gradeOf(l.student_id) ? (
                          <div style={小}>{gradeOf(l.student_id)}</div>
                        ) : null}
                      </td>
                      {MARKS.map((m) => {
                        const on = v === m.key;
                        return (
                          <td key={m.key} style={{ ...ますの形, textAlign: "center" }}>
                            <button type="button" disabled={busy}
                              onClick={() => setDraftState((d) => setDraft(d, l.id, m.key))}
                              aria-pressed={on}
                              style={{
                                minHeight: 44, minWidth: 44, borderRadius: 999,
                                border: `1px solid ${on ? C.curtain : C.line}`,
                                background: on ? C.curtain : C.card,
                                color: on ? C.onCurtain : C.inkSoft,
                                ...TYPE.mini, fontFamily: FONT_STACK
                              }}>{m.label}</button>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {error ? (
            <p style={{ ...小, color: C.curtain, margin: `${rem(8)} 0 0` }}>{error}</p>
          ) : null}

          {/* ★★★保存の 前に、★何人 つけたかを 出します（★裁定 その91 R4 の 注意）。
              ★★★一度も 触らずに 保存する ことも できます。★止めません。
                ★★「変えた ところは ありません」と 出る だけ です。 */}
          <p style={{ ...小, margin: `${rem(10)} 0 ${rem(6)}` }}>
            {saveWord(lessons, draft)}
          </p>
          <button type="button" disabled={busy}
            onClick={() => { if (onSave) onSave(changedRows(lessons, draft)); }}
            style={{
              width: "100%", minHeight: 52, borderRadius: 12,
              border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
              // ★★15 → 15.5（★裁定 その103・2026-09-19）。★大きい ほうの 押し札。
              background: C.curtain, color: C.onCurtain, fontSize: rem(15.5),
              fontFamily: FONT_STACK
            }}>{tx("つけ終わる")}</button>
        </>
      )}

      <div style={{ marginTop: rem(10) }}>
        {/* ★★注記の 印（★段3a 段階2・2026-09-20）。★見た目は 変わりません。 */}
        {/* ★★お名前が 押せる ことを 書きます（★見本の note・2026-09-24）。
            ★★`›` だけ では 分かりません。 */}
        {onOpenOne ? (
          <p className="note" style={{ ...小, margin: 0 }}>{tx(BULK_TAP_LINE)}</p>
        ) : null}
        {NOTES.map((t) => (<p key={t} className="note" style={{ ...小, margin: 0 }}>{t}</p>))}
      </div>
    </div>
  );
}

// ★★★11 → 12.5（★裁定 その103・2026-09-19）。
//   ★★どちらも「添える 字」の 役 です ── ★戻り道と、★表の 見出し。
//   ★★表の 中身（`ますの形`）より 小さく、★でも 読める 大きさに します。
const 戻りの形 = {
  background: "transparent", border: "none", color: C.inkSoft,
  fontSize: "0.78125rem", minHeight: 44, padding: "0 4px", fontFamily: FONT_STACK
};
const 見出しの形 = {
  padding: `${rem(9)} ${rem(8)}`, borderBottom: 罫,
  fontSize: "0.78125rem", color: C.inkSoft, fontWeight: 400
};
const ますの形 = {
  padding: `${rem(7)} ${rem(8)}`, borderBottom: 罫, verticalAlign: "top"
};
