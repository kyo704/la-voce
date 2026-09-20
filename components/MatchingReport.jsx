"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { ScreenHead, Card, Note, Btn, Li, Warn, H3 } from "@/components/UiV2";
import {
  HEAD, TOP_LINES, TOP_BOLD, REASON_HEAD, DETAIL_HEAD, DETAIL_HINT,
  SUBMIT, REASONS, NOTES, NOTES_BOLD, canSubmit, toRow
} from "@/lib/matchingReport";
import { tx } from "@/lib/t";

// ============================================================================
// ★こまったことが ありました（★見本 `SC['こまったこと']`・裁定 その121 Q2）
//
//   ★★★字は lib/matchingReport.js が 持ちます。★ここでは 書きません。
//   ★★★`matching_cuts` の 行を ここで 作りません。
//     ★★台帳の 引き金が 作ります（★裁定 その125）。
//     ★★画面で 作ると、★別の 道から 入った とき 作られません。
//
//   ★★まだ どこからも 開けません。★「さがす」の 画面が ありません。
//     ★★開く 口は、★「この人との やりとりについて」の 板に 付けます。
//
//   ★見張り components/tests/matching-report-copy.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function MatchingReport({ onSubmit, onClose, busy, error = "" }) {
  const [reason, setReason] = useState(null);
  const [detail, setDetail] = useState("");

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      {/* ★★★`ScreenHead` は `onBack` を 受け取りません（★2026-09-21 に 確かめました）。
           ★★渡しても 黙って 落ちます。★出る 道の 無い 画面に なります。
           ★★だから 右に 置きます。★見本も `bk('さがす')` で 戻ります。 */}
      <ScreenHead title={HEAD} right={onClose ? (
        <button type="button" onClick={onClose} style={{
          background: "transparent", border: "none", color: C.inkSoft,
          ...TYPE.mini, minHeight: 44, padding: `0 ${rem(4)}`, fontFamily: FONT_STACK
        }}>{tx("‹ もどる")}</button>
      ) : null} />

      {/* ★★いちばん 上の 断り。★「お名前は お伝えしません」を 先頭 近くに。 */}
      <Warn>
        {TOP_LINES.map((t) => (
          <span key={t} style={{ display: "block" }}>
            {t === TOP_BOLD ? <b style={{ color: C.ink }}>{t}</b> : t}
          </span>
        ))}
      </Warn>

      <H3>{REASON_HEAD}</H3>
      <Card>
        {REASONS.map((r, i) => (
          <Li key={r.key} last={i === REASONS.length - 1}
            onClick={() => setReason(r.key)}
            right={(
              <span aria-hidden="true" style={{
                display: "inline-block", width: 17, height: 17, borderRadius: 4,
                border: `1.6px solid ${reason === r.key ? C.curtain : C.line}`,
                background: reason === r.key ? C.curtain : "transparent",
                boxShadow: reason === r.key ? `inset 0 0 0 3px ${C.card}` : undefined
              }} />
            )}>
            <span aria-pressed={reason === r.key}>{r.label}</span>
          </Li>
        ))}
      </Card>

      <H3>{DETAIL_HEAD}</H3>
      {/* ★★書かなくて よい 欄 です。★出す ための 条件に しません。 */}
      <textarea value={detail} onChange={(e) => setDetail(e.target.value)}
        placeholder={DETAIL_HINT}
        style={{
          width: "100%", minHeight: 88, borderRadius: 12, padding: rem(11),
          border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
          fontSize: "1rem", fontFamily: FONT_STACK, lineHeight: 1.8
        }} />

      {error ? <p style={{ ...小, color: C.curtain, margin: `${rem(8)} 0 0` }}>{error}</p> : null}

      <Btn disabled={busy || !canSubmit(reason)}
        onClick={() => onSubmit && onSubmit(toRow({ reason, detail }))}
        style={{ marginTop: rem(12) }}>{SUBMIT}</Btn>

      <Note>
        {NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>
            {t.indexOf(NOTES_BOLD) >= 0 ? (
              <>
                {t.slice(0, t.indexOf(NOTES_BOLD))}
                <b style={{ color: C.ink }}>{NOTES_BOLD}</b>
                {t.slice(t.indexOf(NOTES_BOLD) + NOTES_BOLD.length)}
              </>
            ) : t}
          </span>
        ))}
      </Note>
    </div>
  );
}

/**
 * ★止まった 方に お見せする 1枚（★裁定 その125 確定の 字）。
 *
 *   ★★わけを 書きません。★お返事の 口も 置きません。
 *   ★★押す ものが 1つも ありません。★読むだけ の 画面 です。
 */
export function MatchingSuspendedNotice({ lines }) {
  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <Card>
        {lines.map((t, i) => (
          <p key={t} style={{
            ...TYPE.li, color: C.ink, lineHeight: 1.95,
            margin: i ? `${rem(9)} 0 0` : 0
          }}>{t}</p>
        ))}
      </Card>
      <Note>{tx("この画面で できる ことは ありません。")}</Note>
    </div>
  );
}
