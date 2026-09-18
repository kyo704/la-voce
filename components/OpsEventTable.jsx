"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { TABLE_CLASS, ANCHOR_CLASSES } from "@/lib/visualTokens";
import {
  EVENT_COLUMNS, TABLE_WIDTH, timeSpan, NO_VALUE
} from "@/lib/opsEventTable";
import { targetLine } from "@/lib/orgEventForm";
import { tx } from "@/lib/t";

// ============================================================================
// ★行事の 表（★見本 `P_gyoji` ／ ★2026-09-18・坂本さんの お決め Q4）
//
//   ★★★広い ときだけ 出ます。★狭い ときは 札 です（★`OpsEvents.jsx`）。
//     ★★どちらを 出すかは `lib/opsEventTable.js` が 決めます。
//
//   ★★すべりと 貼り付けは `.tblwrap` が 持ちます（★裁定 その81 §5-1）。
//     ★★自分で `position: sticky` を 書きません。★写しを 作りません。
//
//   ★★★取り下げた ものも 残します。★薄くして、★消しません。
//     ★★「無かったこと」に しません。★出す と 決めた 事実は 残ります。
//
//   ★見張り components/tests/ops-event-table.test.js
// ============================================================================

const 罫 = `1px solid ${C.line}`;

export default function OpsEventTable({ rows = [], onOpen, dayWord }) {
  if (rows.length === 0) return null;

  return (
    <div className={TABLE_CLASS} style={{ fontFamily: FONT_STACK }}>
      <table style={{
        borderCollapse: "separate", borderSpacing: 0,
        minWidth: TABLE_WIDTH, width: "100%"
      }}>
        <thead>
          <tr>
            {EVENT_COLUMNS.map((c) => (
              <th key={c.key} className={c.anchor ? ANCHOR_CLASSES[1] : undefined}
                style={{
                  minWidth: c.min,
                  textAlign: c.num ? "right" : "left",
                  padding: `${rem(9)} ${rem(10)}`,
                  borderBottom: 罫,
                  ...TYPE.mini, color: C.inkSoft, fontWeight: 400
                }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((x) => {
            const ev = x.ev;
            const 取り下げ = x.withdrawn;
            return (
              <tr key={ev.id} style={{ opacity: 取り下げ ? 0.55 : 1 }}>
                {EVENT_COLUMNS.map((c) => {
                  let 中身 = NO_VALUE;
                  if (c.key === "title") 中身 = ev.title || tx("（名前なし）");
                  else if (c.key === "date") 中身 = dayWord ? dayWord(ev.event_date) : ev.event_date;
                  else if (c.key === "time") 中身 = timeSpan(ev);
                  else if (c.key === "place") 中身 = ev.place || NO_VALUE;
                  else if (c.key === "target") {
                    中身 = targetLine(ev.target_grades, ev.target_courses);
                  } else if (c.key === "reach") 中身 = x.countWord || NO_VALUE;
                  else if (c.key === "state") 中身 = x.label;

                  return (
                    <td key={c.key}
                      className={c.anchor ? ANCHOR_CLASSES[1] : undefined}
                      onClick={c.anchor && onOpen ? () => onOpen(ev) : undefined}
                      style={{
                        minWidth: c.min,
                        textAlign: c.num ? "right" : "left",
                        padding: `${rem(9)} ${rem(10)}`,
                        borderBottom: 罫,
                        ...TYPE.usual, color: C.ink,
                        // ★★対象は 折り返します。★2軸 ぶん 入ります。
                        whiteSpace: c.key === "target" ? "normal" : "nowrap",
                        ...(c.anchor && onOpen ? { cursor: "pointer" } : null)
                      }}>{中身}</td>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
