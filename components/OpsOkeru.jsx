"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Li, Note, Warn, Ask } from "@/components/UiV2";
import {
  OKERU_HEAD_SUB, OKERU_NOTE, OKERU_EMPTY, OKERU_EMPTY_HOW, OKERU_NOTES,
  OKERU_PUT, putAsk, PUT_ASK_NOTE, DAYS, periodWord
} from "@/lib/opsKumu";

// ============================================================================
// ★入れられる 枠（★見本 `P_okeru`・裁定 その108）
//
//   ★★★表を 作って いません。★その場で 数えて います。
//     ★★空き枠は「授業が 入って いない 時間」です。★もとから 計算で 出ます。
//
//   ★★★押す 前に 一度 お尋ねします（★裁定 その108）。
//     ★★押しまちがいで 予定が 入ると、★相手にも 及びます。
//
//   ★見張り components/tests/ops-okeru.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsOkeru({
  studentName, grade, slots = [], onPut, onClose, busy, error = ""
}) {
  const [確かめ, set確かめ] = useState(null);

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={studentName || ""} right={
        onClose ? (
          <button type="button" onClick={onClose}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, padding: "0 4px", fontFamily: FONT_STACK
            }}>‹ 日程を 組む</button>
        ) : null} />
      <p style={{ ...小, margin: "-4px 0 10px" }}>
        {grade || ""}{grade ? "　／　" : ""}{OKERU_HEAD_SUB}　{slots.length}
      </p>

      <Warn>{OKERU_NOTE}</Warn>

      {slots.length === 0 ? (
        <Card style={{ marginTop: rem(8) }}>
          <p style={{ ...TYPE.li, color: C.ink, margin: 0 }}>{OKERU_EMPTY}</p>
          <p style={{ ...小, margin: "4px 0 0" }}>{OKERU_EMPTY_HOW}</p>
        </Card>
      ) : (
        <Card style={{ padding: 0, maxWidth: 640, marginTop: rem(8) }}>
          {slots.map((s, i) => (
            <Li key={`${s.dateISO}-${s.period.id || s.period.ord}`}
              last={i === slots.length - 1}
              onClick={busy ? undefined : () => set確かめ(s)}
              right={<span style={小}>{OKERU_PUT}</span>}>
              {String(s.dateISO).slice(5).replace("-", "月")}日（{DAYS[s.weekday]}）
              <div style={小}>{periodWord(s.period)}</div>
            </Li>
          ))}
        </Card>
      )}
      {error ? <p style={{ ...小, margin: "8px 0 0", color: C.ink }}>{error}</p> : null}

      <Note>
        {OKERU_NOTES.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
      </Note>

      {/* ★★★押す 前に 一度（★裁定 その108）。 */}
      {確かめ ? (
        <Ask title={putAsk(確かめ)} note={PUT_ASK_NOTE}
          okLabel={OKERU_PUT}
          onOk={() => { if (onPut) onPut(確かめ); set確かめ(null); }}
          onCancel={() => set確かめ(null)} />
      ) : null}
    </div>
  );
}
