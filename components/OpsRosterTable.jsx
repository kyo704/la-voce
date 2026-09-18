"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
// ★★すべり・貼り付けの 決めは 1本 です（★裁定 その81 §5-1）。
import { TABLE_CLASS, ANCHOR_CLASSES } from "@/lib/visualTokens";
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
    /* ★★★すべりと 貼り付けは、★`.tblwrap` が 持ちます（★裁定 その81 §5-1）。
         ★★きょうまで、★この 1枚が 自分で 持って いました。
           ★★`maxHeight: "62vh"` も、★`position: sticky` も、★ここに ありました。
         ★★★運営の 表は これ 1つ では ありません。★役職の 表も あります。
           ★★2つに 別々の 数が 入ると、★片方だけ 直る 日が 来ます。
         ★★決めは lib/visualTokens.js が 1つ 持ちます。★ここでは 決めません。
         ★★`.tblwrap` は `.wsv` の 中 だけ で 効きます（★門の 外に かかりません）。 */
    <div className={TABLE_CLASS} style={{ fontFamily: FONT_STACK }}>
      <table style={{ borderCollapse: "separate", borderSpacing: 0, minWidth: TABLE_WIDTH, width: "100%" }}>
        <thead>
          <tr>
            {ROSTER_COLUMNS.map((c) => (
              /* ★★貼り付けは `.tblwrap` が します。★ここでは 大きさと 字だけ です。
                   ★★お名前の 列には `anc`（★錨）を 付けます。 */
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
                      className={c.anchor ? ANCHOR_CLASSES[1] : undefined}
                      onClick={c.anchor && onOpen ? () => onOpen(m.user_id) : undefined}
                      style={{
                        minWidth: c.min,
                        textAlign: c.num ? "right" : "left",
                        padding: `${rem(9)} ${rem(10)}`,
                        borderBottom: 罫,
                        ...TYPE.usual,
                        color: c.key === "status" && !数える ? C.inkSoft : C.ink,
                        whiteSpace: "nowrap",
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
