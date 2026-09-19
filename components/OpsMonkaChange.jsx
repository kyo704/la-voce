"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, H3, Card, Li, Note, Pill } from "@/components/UiV2";
import {
  HEAD, BACK_LABEL, NOW_LABEL, NEW_LABEL, NONE_WORD, DO_LABEL,
  pickable, mayDo, whyCannotDo, BEFORE_NOTES
} from "@/lib/opsMonkaChange";

// ============================================================================
// ★門下を 変える（★裁定 その104 Q1）
//
//   ★★決めは lib/opsMonkaChange.js が 持ちます。★ここでは 決めません。
//   ★★★選ぶまで 押せません。★押せない わけを その場に 出します（★§8⑤）。
//   ★★★変える 前に、★何が 起きるかを 3行で お伝えします。
//
//   ★見張り components/tests/ops-monka-change.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsMonkaChange({
  studentName, nowTeacherId, nowTeacherName,
  members = [], nameOf, onChange, onClose, busy, error = "", done = ""
}) {
  const [選び, set選び] = useState(null);
  const 候補 = pickable(members, nowTeacherId);
  const できる = !busy && mayDo({ nowTeacherId, newTeacherId: 選び });
  const わけ = whyCannotDo({ nowTeacherId, newTeacherId: 選び });

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
      <p style={{ ...小, margin: "-4px 0 10px" }}>{studentName || ""}</p>

      <Card style={{ padding: 0 }}>
        <Li right={nowTeacherName || NONE_WORD}>{NOW_LABEL}</Li>
        <Li last right={選び ? (nameOf ? nameOf(選び) : "") : NONE_WORD}>{NEW_LABEL}</Li>
      </Card>

      {/* ★★★新しい 先生を 選びます。★いまの 先生は 出しません。 */}
      <H3>{NEW_LABEL}</H3>
      {候補.length === 0 ? (
        <Card><p style={{ ...小, margin: 0 }}>ほかに 先生が いません。</p></Card>
      ) : (
        <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
          {候補.map((m) => (
            <Pill key={m.user_id} on={選び === m.user_id}
              onClick={() => set選び(m.user_id)}>
              {nameOf ? nameOf(m.user_id) : ""}
            </Pill>
          ))}
        </div>
      )}

      {/* ★★★変える 前に お伝えします。★あとから 驚かせません。 */}
      <Note>
        {BEFORE_NOTES.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
      </Note>

      <button type="button" disabled={!できる}
        onClick={() => { if (できる && onChange) onChange(選び); }}
        style={{
          width: "100%", minHeight: 52, marginTop: rem(10), borderRadius: 12,
          border: `1px solid ${できる ? C.curtain : C.line}`,
          borderBottomWidth: 3,
          background: できる ? C.curtain : C.line,
          color: できる ? C.onCurtain : C.inkSoft,
          fontSize: rem(15.5), fontFamily: FONT_STACK
        }}>{DO_LABEL}</button>
      {わけ ? <p style={{ ...小, margin: "6px 0 0" }}>{わけ}</p> : null}
      {error ? <p style={{ ...小, margin: "6px 0 0", color: C.ink }}>{error}</p> : null}
      {done ? <p style={{ ...小, margin: "6px 0 0", color: C.sage }}>{done}</p> : null}
    </div>
  );
}
