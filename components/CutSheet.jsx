"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { Card, Note, Li } from "@/components/UiV2";
import {
  HEAD, KINDS, NOT_YET, NOTES, NOTES_BOLDS, REPORT, REPORT_NOTE, toRow
} from "@/lib/cutSheet";
import { tx } from "@/lib/t";

// ============================================================================
// ★この人との やりとり（★見本 `SH['cut']`・裁定 その94 §5）
//
//   ★★★通報の 口を、★切りの 下に 置きます（★§5-4）。
//     ★★切ったら 通報できない、に しません。
//   ★★★「切りますか」と 聞きません。★1押し です（★§5）。
//     ★★確認を 挟むと、★言い出しにくく なります。
//     ★★間違えても、★「見えなくした 方」から 戻せます。
//
//   ★見張り components/tests/cut-sheet.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

function 太く(t, 太たち) {
  const 当 = (太たち || []).find((b) => t.indexOf(b) >= 0);
  if (!当) return t;
  const i = t.indexOf(当);
  return (
    <>
      {t.slice(0, i)}
      <b style={{ color: C.ink }}>{当}</b>
      {t.slice(i + 当.length)}
    </>
  );
}

export default function CutSheet({ onCut, onReport, onClose, busy, error = "" }) {
  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between" }}>
        <p style={{ ...TYPE.li, color: C.ink, fontWeight: 700, margin: 0 }}>{HEAD}</p>
        {onClose ? (
          <button type="button" onClick={onClose} style={{
            background: "transparent", border: "none", color: C.inkSoft,
            ...TYPE.mini, minHeight: 44, padding: `0 ${rem(4)}`, fontFamily: FONT_STACK
          }}>{tx("とじる")}</button>
        ) : null}
      </div>

      <Card>
        {KINDS.map((k, i) => (
          <Li key={k.key} last={i === KINDS.length - 1}
            onClick={busy ? undefined : () => onCut && onCut(toRow(k.key))}
            right={<span style={小}>›</span>}>
            <span>
              {k.label}
              {k.sub ? (
                <span style={{ display: "block", ...TYPE.mini, color: C.inkSoft }}>{k.sub}</span>
              ) : null}
            </span>
          </Li>
        ))}
      </Card>

      {error ? <p style={{ ...小, color: C.curtain, margin: `${rem(6)} 0 0` }}>{error}</p> : null}

      <Note>
        {NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>{太く(t, NOTES_BOLDS)}</span>
        ))}
      </Note>

      {/* ★★★通報の 口（★§5-4）。★切った あとでも 残ります。 */}
      {onReport ? (
        <Card style={{ marginTop: rem(10) }}>
          <Li last onClick={onReport} right={<span style={小}>›</span>}>
            <span style={{ color: C.curtain }}>{REPORT}</span>
          </Li>
        </Card>
      ) : null}
      {onReport ? <p style={{ ...小, margin: `${rem(4)} 0 0` }}>{REPORT_NOTE}</p> : null}

      <div style={{ marginTop: rem(10) }}>
        {NOT_YET.map((x) => (
          <p key={x.key} style={{ ...小, margin: 0 }}>
            {x.label}　……　{tx("まだ できません")}
          </p>
        ))}
      </div>
    </div>
  );
}
