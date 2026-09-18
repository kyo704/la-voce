"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { statusLabel, isCounted } from "@/lib/orgRoster";
import { ROSTER_COLUMNS, TABLE_WIDTH } from "@/lib/opsRosterTable";

// ============================================================================
// ★名簿の 表（★裁定 その80・2026-09-18）
//
//   ★出どころ 見本 `00-動く見本-PC・iPad（運営）.html` の `P_meibo`
//
//   ★★★広い ときだけ 出します。★出し分けは 呼ぶ 側が します。
//     ★★表の 実の 幅は 857px です（★見本を 描いて 測りました）。
//
//   ★★★見出しの 行を 貼り付けます（★裁定 その80）。
//     ★★200人を 下まで 見た とき、★列の 名が 消えると
//       ★★どの 列が「担当」で どの 列が「状態」か 分からなく なります。
//   ★★★お名前の 列を 錨に します（★左に 貼り付け）。
//     ★★横に すべらせた とき、★お名前だけは 残ります。
//     ★★消えると、★どの 行を 見て いるか 分からなく なります。
//
//   ★★決めは lib/opsRosterTable.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/ops-roster-table.test.js
// ============================================================================

const 罫 = `1px solid ${C.line}`;

export default function OpsRosterTable({
  rows = [], nameOf, teacherNameOf, onOpen
}) {
  if (rows.length === 0) return null;

  return (
    <div style={{
      overflowX: "auto", overflowY: "auto", maxHeight: "62vh",
      border: 罫, borderRadius: 12, background: C.card, fontFamily: FONT_STACK
    }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: TABLE_WIDTH, width: "100%" }}>
        <thead>
          <tr>
            {ROSTER_COLUMNS.map((c) => (
              <th key={c.key} style={{
                minWidth: c.min,
                textAlign: c.num ? "right" : "left",
                padding: `${rem(9)} ${rem(10)}`,
                borderBottom: 罫,
                ...TYPE.mini, color: C.inkSoft, fontWeight: 400,
                // ★★見出しの 行を 貼り付けます。★下まで 見ても 列の 名が 残ります。
                position: "sticky", top: 0, zIndex: c.anchor ? 3 : 2,
                background: C.card,
                // ★★お名前の 列は、★左にも 貼り付けます（★錨）。
                ...(c.anchor ? { left: 0 } : null)
              }}>{c.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => {
            const 数える = isCounted(m);
            return (
              <tr key={m.id || m.user_id}>
                {ROSTER_COLUMNS.map((c) => {
                  let 中身 = "";
                  if (c.key === "name") 中身 = (nameOf && nameOf(m.user_id)) || "";
                  else if (c.key === "grade") 中身 = m.grade_label || "—";
                  else if (c.key === "course") 中身 = m.course_label || "—";
                  else if (c.key === "teacher") {
                    const t = (m.teacher_ids || [])
                      .map((id) => (teacherNameOf && teacherNameOf(id)) || "")
                      .filter(Boolean);
                    中身 = t.length ? t.join("・") : "—";
                  } else if (c.key === "status") 中身 = statusLabel(m.status);
                  // ★★★「数える」は ○ と — です（★見本の とおり）。
                  //   ★★「×」に しません。★数えない ことは、★悪い ことでは ありません。
                  else if (c.key === "counted") 中身 = 数える ? "○" : "—";

                  return (
                    <td key={c.key}
                      onClick={c.anchor && onOpen ? () => onOpen(m.user_id) : undefined}
                      style={{
                        minWidth: c.min,
                        textAlign: c.num ? "right" : "left",
                        padding: `${rem(9)} ${rem(10)}`,
                        borderBottom: 罫,
                        ...TYPE.usual,
                        color: c.key === "status" && !数える ? C.inkSoft : C.ink,
                        whiteSpace: "nowrap",
                        ...(c.anchor ? {
                          position: "sticky", left: 0, zIndex: 1,
                          background: C.card,
                          cursor: onOpen ? "pointer" : "default"
                        } : null)
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
