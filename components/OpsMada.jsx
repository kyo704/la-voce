"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Li, Note } from "@/components/UiV2";
import {
  HEAD, BACK_LABEL, NUDGE_LABEL, countWord, notSubmitted, alreadyNudged,
  nudgeTargets, whyCannotNudge, SENT_WORD, EMPTY_HEAD, NOT_READ, NOTES
} from "@/lib/opsMada";

// ============================================================================
// ★時間割が まだの方（★見本 `P_mada`）
//
//   ★★決めは lib/opsMada.js が 持ちます。★ここでは 決めません。
//   ★★★読めて いない ときは、★空の 一覧を 出しません。
//     ★★「みなさん 出して います」と「まだ 読めて いません」は ちがいます。
//   ★★★もう 知らせた 方には「知らせました」と 出します。★2度目は 送れません。
//
//   ★見張り components/tests/ops-mada.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsMada({
  submitted, nudges = [], nameOf, gradeOf,
  canNudge, onNudge, onClose, busy, error = "", done = ""
}) {
  const 行 = notSubmitted(submitted, nameOf, gradeOf);
  const わけ = 行 === null ? "" : whyCannotNudge(行, nudges);
  const 送り先 = 行 === null ? [] : nudgeTargets(行, nudges);
  const 押せる = !busy && !!canNudge && 送り先.length > 0;

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

      {行 === null ? (
        <Card><p style={{ ...小, margin: 0 }}>{NOT_READ}</p></Card>
      ) : (
        <>
          <p style={{ ...小, margin: "-4px 0 10px" }}>{countWord(行)}</p>
          {行.length === 0 ? (
            <Card><p style={{ ...小, margin: 0 }}>{EMPTY_HEAD}</p></Card>
          ) : (
            <Card style={{ padding: 0, maxWidth: 520 }}>
              {行.map((r, i) => (
                <Li key={r.studentId} last={i === 行.length - 1}
                  right={alreadyNudged(nudges, r.studentId)
                    ? <span style={小}>{SENT_WORD}</span>
                    : r.grade}>
                  {r.name}
                </Li>
              ))}
            </Card>
          )}

          {/* ★★★知らせる ── ★1回だけ。★2度目は 押せません。 */}
          {canNudge ? (
            <button type="button" disabled={!押せる}
              onClick={() => { if (押せる && onNudge) onNudge(送り先); }}
              style={{
                width: "100%", maxWidth: 520, minHeight: 52, marginTop: rem(12),
                borderRadius: 12,
                border: `1px solid ${押せる ? C.curtain : C.line}`,
                borderBottomWidth: 3,
                background: 押せる ? C.curtain : C.line,
                color: 押せる ? C.onCurtain : C.inkSoft,
                fontSize: rem(15.5), fontFamily: FONT_STACK
              }}>{NUDGE_LABEL}</button>
          ) : null}
          {わけ ? <p style={{ ...小, margin: "6px 0 0" }}>{わけ}</p> : null}
          {error ? <p style={{ ...小, margin: "6px 0 0", color: C.ink }}>{error}</p> : null}
          {done ? <p style={{ ...小, margin: "6px 0 0", color: C.sage }}>{done}</p> : null}
        </>
      )}

      <Note>{NOTES.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}</Note>
    </div>
  );
}
