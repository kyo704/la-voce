"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { useState } from "react";
import { ScreenHead, H3, Card, Li, Note, Ask } from "@/components/UiV2";
import {
  LIST_HEAD, LIST_SUB, LIST_NOTES, progressOf, totalWord, defaultOrder,
  DONE_LABEL, DONE_NOTE, mayConfirm, CONFIRM_LABEL, CONFIRM_NOTE,
  CONFIRM_ASK, CONFIRM_ASK_NOTE, CONFIRMED_WORD, isConfirmed
} from "@/lib/evaluation";

// ============================================================================
// ★採点（★見本 `P_saiten`・裁定 その105）
//
//   ★★決めは lib/evaluation.js が 持ちます。★ここでは 決めません。
//   ★★★進み具合を **色で 出しません**。★言葉（未入力／入力中／済）です。
//   ★★★順位を 付けません。★既定の 並びは お名前順 です。
//   ★★★締切の 前は、★ほかの 審査員の 点は 見えません ── ★それを 書きます。
//
//   ★見張り components/tests/evaluation.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsSaiten({
  eventName, eventSub, students = [], items = [], scoresOf, allScores = [],
  perms, myDone, onOpenOne, onDone, onConfirm, onClose, busy, error = "", done = "",
  // ★★★2026-09-24 ── ★採点の となりの 2枚への 入口。
  //   ★★どちらも 渡されなければ **出しません**（★押せない 札を 置きません）。
  //     ★渡すか どうかを 決めるのは 呼ぶ 側 です ── ★鍵（`scoring`）と、できこと。
  onGoJudges, onGoLayout
}) {
  const 使う = items.filter((i) => i && i.in_use);
  const 並 = defaultOrder(students);
  const [確かめ, set確かめ] = useState(false);
  const 済み = isConfirmed(allScores);

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <ScreenHead title={`${eventName || "行事"}　採点`} right={
        onClose ? (
          <button type="button" onClick={onClose}
            style={{
              background: "transparent", border: "none", color: C.inkSoft,
              ...TYPE.mini, minHeight: 44, padding: "0 4px", fontFamily: FONT_STACK
            }}>‹ 行事</button>
        ) : null} />
      {eventSub ? <p style={{ ...小, margin: "-4px 0 10px" }}>{eventSub}</p> : null}

      {/* ==================================================================
          ★★採点の となりの 2枚（★2026-09-24・配線）。
            ★審査員を 足す（`JuryPanel`）／実技試験を 組む（`JuryLayout`）。
          ★★どちらも 前から 出来て いました。★どこからも 呼ばれて いません でした。
            ★★「作った」と「届く」は 別 です。
          ★★渡されなければ 出しません。★鍵が 閉じて いる 間は 1つも 出ません。
         ================================================================== */}
      {onGoJudges || onGoLayout ? (
        <Card style={{ padding: 0, marginBottom: rem(10) }}>
          {onGoJudges ? (
            <Li last={!onGoLayout} onClick={onGoJudges} right="›">審査員を 足す</Li>
          ) : null}
          {onGoLayout ? (
            <Li last onClick={onGoLayout} right="›">実技試験を 組む</Li>
          ) : null}
        </Card>
      ) : null}

      <H3>{LIST_HEAD}　<span style={小}>{LIST_SUB}</span></H3>
      <Card style={{ padding: 0 }}>
        {並.length === 0 ? (
          <p style={{ ...小, margin: 0, padding: rem(14) }}>
            受験者が いません。行事の 対象を お決め ください。
          </p>
        ) : 並.map((s, i) => {
          const 点 = scoresOf ? (scoresOf(s.id) || []) : [];
          return (
            <Li key={s.id} last={i === 並.length - 1}
              onClick={onOpenOne ? () => onOpenOne(s) : undefined}
              right={<span style={小}>{progressOf(点, 使う)}</span>}>
              {s.name}
            </Li>
          );
        })}
      </Card>

      {/* ★★★まとめ ── ★合計 だけ。★順位を 付けません（★裁定 §Q1）。 */}
      {使う.length > 0 && 並.length > 0 ? (
        <>
          <H3>集計</H3>
          <p style={{ ...小, margin: "-4px 0 6px" }}>
            まとめ方 …… 合計（貴学の お決め）
          </p>
          <Card style={{ padding: 0 }}>
            {並.map((s, i) => (
              <Li key={s.id} last={i === 並.length - 1}
                right={<span style={小}>
                  {totalWord(scoresOf ? (scoresOf(s.id) || []) : [], 使う)}
                </span>}>{s.name}</Li>
            ))}
          </Card>
          <p style={{ ...小, margin: "6px 0 0" }}>
            点数の 一覧です。順位は 付けて いません。
          </p>
        </>
      ) : null}

      {/* ★★★つけ終わる ── ★押すと、ほかの 審査員の 点が 見えます。 */}
      {onDone ? (
        <>
          <button type="button" disabled={busy || myDone}
            onClick={() => onDone()}
            style={{
              width: "100%", minHeight: 52, marginTop: rem(12), borderRadius: 12,
              border: `1px solid ${myDone ? C.line : C.curtain}`, borderBottomWidth: 3,
              background: myDone ? C.line : C.curtain,
              color: myDone ? C.inkSoft : C.onCurtain,
              fontSize: rem(15.5), fontFamily: FONT_STACK
            }}>{myDone ? "つけ終わって います" : DONE_LABEL}</button>
          <p style={{ ...小, margin: "6px 0 0" }}>{DONE_NOTE}</p>
        </>
      ) : null}
      {/* ★★★確定（★裁定 その105 §Q2）。★`saiten` を 持つ 方 だけ。
           ★★押す 前に 一度 お尋ねします ── ★学生に 見える ように なる ため です。 */}
      {onConfirm && mayConfirm(perms) ? (
        <>
          <button type="button" disabled={busy || 済み}
            onClick={() => set確かめ(true)}
            style={{
              width: "100%", minHeight: 52, marginTop: rem(10), borderRadius: 12,
              border: `1px solid ${済み ? C.line : C.curtain}`,
              background: 済み ? C.line : C.card,
              color: 済み ? C.inkSoft : C.ink,
              fontSize: rem(14.5), fontFamily: FONT_STACK
            }}>{済み ? CONFIRMED_WORD : CONFIRM_LABEL}</button>
          <p style={{ ...小, margin: "6px 0 0" }}>{CONFIRM_NOTE}</p>
        </>
      ) : null}
      {error ? <p style={{ ...小, margin: "6px 0 0", color: C.ink }}>{error}</p> : null}
      {done ? <p style={{ ...小, margin: "6px 0 0", color: C.sage }}>{done}</p> : null}

      <Note>
        {LIST_NOTES.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
      </Note>

      {確かめ ? (
        <Ask title={CONFIRM_ASK} note={CONFIRM_ASK_NOTE}
          okLabel={CONFIRM_LABEL}
          onOk={() => { if (onConfirm) onConfirm(); set確かめ(false); }}
          onCancel={() => set確かめ(false)} />
      ) : null}
    </div>
  );
}
