"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Li, Note } from "@/components/UiV2";
import {
  HEAD, LABEL, BACK_LABEL, WILL_DO, WILL_WORD, WONT_WORD,
  AFTER_LINE, SAME_ANSWER_NOTE, mayDo, whyCannotDo
} from "@/lib/opsRetireTeacher";

// ============================================================================
// ★先生が 退く とき（★裁定 その104 Q2）
//
//   ★★決めは lib/opsRetireTeacher.js が 持ちます。★ここでは 決めません。
//   ★★★押す 前に、★変わる ものと 変わらない ものを ぜんぶ 並べます。
//     ★★あとから「そんな つもりでは なかった」と ならない ように。
//
//   ★見張り components/tests/ops-retire-teacher.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsRetireTeacher({
  teacherId, teacherName, myId, onRetire, onClose, busy, error = "", done = ""
}) {
  const できる = !busy && mayDo({ teacherId, myId });
  const わけ = whyCannotDo({ teacherId, myId });

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={HEAD} right={
        onClose ? (
          <button type="button" onClick={onClose}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, padding: "0 4px", fontFamily: FONT_STACK
            }}>‹ {BACK_LABEL}</button>
        ) : null} />
      <p style={{ ...小, margin: "-4px 0 10px" }}>{teacherName || ""}</p>

      {/* ★★★変わる もの・変わらない もの ── ★両方 書きます。 */}
      <Card style={{ padding: 0 }}>
        {WILL_DO.map((x, i) => (
          <Li key={x.label} last={i === WILL_DO.length - 1}
            right={x.ok ? WILL_WORD : WONT_WORD}>
            <span style={x.ok ? undefined : { color: C.ink4 }}>{x.label}</span>
          </Li>
        ))}
      </Card>

      <button type="button" disabled={!できる}
        onClick={() => { if (できる && onRetire) onRetire(teacherId); }}
        style={{
          width: "100%", minHeight: 52, marginTop: rem(10), borderRadius: 12,
          border: `1px solid ${できる ? C.curtain : C.line}`, borderBottomWidth: 3,
          background: できる ? C.curtain : C.line,
          color: できる ? C.onCurtain : C.inkSoft,
          fontSize: rem(15.5), fontFamily: FONT_STACK
        }}>{LABEL}</button>
      {わけ ? <p style={{ ...小, margin: "6px 0 0" }}>{わけ}</p> : null}
      {error ? <p style={{ ...小, margin: "6px 0 0", color: C.ink }}>{error}</p> : null}
      {done ? <p style={{ ...小, margin: "6px 0 0", color: C.sage }}>{done}</p> : null}

      <Note>
        <span style={{ display: "block" }}>{AFTER_LINE}</span>
        <span style={{ display: "block" }}>{SAME_ANSWER_NOTE}</span>
      </Note>
    </div>
  );
}
