"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, H3, Card, Li, Note } from "@/components/UiV2";
import {
  SUB_LINE, BACK_LABEL, MARK, MAX, countOf, mayToggle, whyCannot,
  CAN_DO, CAN_HEAD, CAN_WORD, CANNOT_WORD, NOTES, HEAD
} from "@/lib/opsDaihyo";

// ============================================================================
// ★代表を 決める（★見本 `P_daihyo`）
//
//   ★★決めは lib/opsDaihyo.js が 持ちます。★ここでは 決めません。
//   ★★「2人まで」の 正は 台帳 です（`set_monka_representative`）。
//     ★★ここでは、★押す 前に お伝えする だけ です。
//
//   ★★★押せない 札を 置きません（★§8⑤）。
//     ★★2人 いる とき、★3人目は **押せません**。★わけを その場に 出します。
//     ★★外す のは いつでも できます。
//
//   ★見張り components/tests/ops-daihyo.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsDaihyo({
  rows = [], onToggle, onClose, busy, error = ""
}) {
  const いま = countOf(rows);

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
      <p style={{ ...小, margin: "-4px 0 10px" }}>{SUB_LINE}</p>

      {/* ★★★門下の 一覧。★押すと 付く・外れる。 */}
      <Card style={{ padding: 0, maxWidth: 420 }}>
        {rows.length === 0 ? (
          <p style={{ ...小, margin: 0, padding: rem(14) }}>
            まだ、門下に 誰も いません。
          </p>
        ) : rows.map((r, i) => {
          const 押せる = !busy && mayToggle(rows, r.studentId);
          return (
            <Li key={r.studentId} last={i === rows.length - 1}
              onClick={押せる ? () => onToggle && onToggle(r) : undefined}
              right={r.isRepresentative ? (
                <span style={{ color: C.curtain }}>{MARK}</span>
              ) : (
                押せる ? "" : <span style={小}>{whyCannot(rows, r.studentId)}</span>
              )}>
              <span>
                {r.name}
                {r.grade ? (
                  <><br /><span style={小}>{r.grade}</span></>
                ) : null}
              </span>
            </Li>
          );
        })}
      </Card>
      <p style={{ ...小, margin: "6px 0 0" }}>
        いま {いま}人　／　{MAX}人まで
      </p>
      {error ? (
        <p style={{ ...小, margin: "4px 0 0", color: C.ink }}>{error}</p>
      ) : null}

      {/* ★★★代表に すると 何が 変わるか ── ★決める 前に 並べます。 */}
      <H3>{CAN_HEAD}</H3>
      <Card style={{ padding: 0 }}>
        {CAN_DO.map((x, i) => (
          <Li key={x.label} last={i === CAN_DO.length - 1}
            right={x.ok ? CAN_WORD : CANNOT_WORD}>
            <span style={x.ok ? undefined : { color: C.ink4 }}>{x.label}</span>
          </Li>
        ))}
      </Card>

      <Note>{NOTES.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}</Note>
    </div>
  );
}
