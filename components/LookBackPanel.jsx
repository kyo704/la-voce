"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { buildLookBack, hasAnything } from "@/lib/lookBack";

// ============================================================================
// C1 ── 出なかった日の、前3日をひらく（2026-09-08）
//
//   ★★★文章を、添えません。
//     ★「睡眠が短かったからでしょう」と、★書かないこと。
//     ★確率も、割合も、順位も、色分けも、ありません。
//     ★★書いたことを、そのまま縦に並べるだけです。
//
//   ★★ゲートは要りません。★何も主張しないためです。★1日目から動きます。
//
//   ★★書いていない日も、★出します。★「書いていません」と、そう書きます。
//     ★黙って飛ばすと、★何日ぶんを見ているのか、分からなくなります。
//
//   ★見張り components/tests/look-back.test.js
// ============================================================================

export default function LookBackPanel({ dates, entries, fields }) {
  const list = Array.isArray(dates) ? dates : [];
  const [open, setOpen] = useState(list.length ? list[0] : null);
  if (list.length === 0) return null;

  const sections = open ? buildLookBack(open, entries, fields) : [];

  return (
    <div className="rounded-2xl p-4 border mb-4" style={{ background: C.card, borderColor: C.line }}>
      <h3 className="ff-display italic text-lg mb-1">出なかった日の、前の3日</h3>
      {/* ★★数を、書きません。★「3件あります」と出さないこと。
          ★★何をする画面かだけを、書きます。 */}
      <p className="text-xs mb-3" style={{ color: C.inkSoft, lineHeight: 1.8 }}>
        その日の前に、あなたが書いたことを、そのまま並べます。
      </p>

      {/* ★日を選びます。★新しい順です。 */}
      <div className="flex gap-1.5 flex-wrap" style={{ marginBottom: 12 }}>
        {list.map((d) => {
          const on = open === d;
          return (
            <button key={d} type="button"
              aria-pressed={on}
              onClick={() => setOpen(on ? null : d)}
              style={{
                padding: "6px 12px", borderRadius: 999, minHeight: 36,
                // ★色だけで示しません。★わくの太さでも示します。
                border: `${on ? 2 : 1}px solid ${on ? C.curtain : C.line}`,
                background: on ? C.curtain : C.card,
                color: on ? "#FFFDF8" : C.inkSoft,
                fontSize: "0.8125rem"
              }}>
              {d.slice(5).replace("-", "/")}
            </button>
          );
        })}
      </div>

      {open && !hasAnything(sections) && (
        <p className="text-xs" style={{ color: C.inkSoft, lineHeight: 1.8 }}>
          この日の前には、まだ何も書かれていません。
        </p>
      )}

      {open && hasAnything(sections) && sections.map((s) => (
        <div key={s.key} style={{ marginBottom: 14 }}>
          <p className="text-xs font-medium" style={{ color: C.ink, margin: "0 0 6px" }}>
            {s.label}（{s.date.slice(5).replace("-", "/")}）
          </p>
          {s.rows.length === 0 ? (
            /* ★★黙って飛ばしません。★書いていないことも、事実です。 */
            <p className="text-xs" style={{ color: C.inkSoft, paddingLeft: 8 }}>
              書いていません。
            </p>
          ) : (
            <div style={{ display: "grid", gap: 4, paddingLeft: 8 }}>
              {s.rows.map((r) => (
                <div key={r.key} style={{ display: "flex", gap: 8, fontSize: "0.8125rem" }}>
                  <span style={{ color: C.inkSoft, minWidth: 96, flexShrink: 0 }}>{r.label}</span>
                  {/* ★★色を変えません。★値の大小で、色を変えないこと。 */}
                  <span style={{ color: C.ink }}>{r.value}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      ))}

      {/* ★★ここに、まとめの1文を置かないこと。
          ★「前の夜は遅かったようです」も、★書きません。
          ★★並べるところで、終わりです。 */}
    </div>
  );
}
