"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
import { buildEvents, actionsFor, EVENT_STATES } from "@/lib/orgEventsView";

// ============================================================================
// 行事 ── 見本④（2026-09-09・第3便）
//
//   ★出どころ docs/opus/woolsong-見本-運営モード8点（9月9日）.jpg ④
//     「★取り下げても、★除いて 出しません。★勝手に 書き換えません。」
//     「★選び忘れている 中は 出しません。★数だけです。」
//
//   ★★1行を 1枚の カードに（★裁定）。★操作は 下半分に。★44pt 以上。
//   ★★％を 出しません。★「41/54」と 数で 書きます。
//   ★★この画面から、★生徒の健康の記録には たどりつけません。
//
//   ★数と 決めは lib/orgEventsView.js が 持ちます。
//
//   ★見張り components/tests/org-events-view.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };

function dayWord(iso) {
  const s = String(iso || "");
  if (s.length < 10) return "";
  return `${Number(s.slice(5, 7))}月${Number(s.slice(8, 10))}日`;
}

export default function OpsEvents({ events, participants, targetOf, onAdd, onAction }) {
  const [openId, setOpenId] = useState(null);
  const rows = buildEvents(events, participants, targetOf);

  return (
    <div className="space-y-3" style={{ paddingBottom: 16 }}>
      <div>
        <h2 className="ff-display italic" style={{ fontSize: "1.25rem", color: C.ink }}>行事</h2>
        <p style={small}>出したり消したり。対象の方の「きょう」に出ます。</p>
      </div>

      {rows.length === 0 ? (
        <div style={card}><p style={small}>まだ行事はありません。</p></div>
      ) : (
        rows.map((x) => {
          const withdrawn = x.state === EVENT_STATES.WITHDRAWN;
          const open = openId === x.ev.id;
          return (
            <div key={x.ev.id} style={{
              ...card,
              // ★★取り下げた ものも 残します。★薄くして、★消しません。
              //   ★★「無かったこと」に しません。★出す と 決めた事実は 残ります。
              opacity: withdrawn ? 0.55 : 1
            }}>
              <div className="flex items-start justify-between gap-2">
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontSize: "0.9375rem", color: C.ink }}>{x.ev.title || "（名前なし）"}</p>
                  <p style={small}>{dayWord(x.ev.event_date)}</p>
                </div>
                <span style={{
                  fontSize: "0.625rem", color: C.inkSoft, background: C.paper,
                  border: `1px solid ${C.line}`, borderRadius: 999,
                  padding: "3px 9px", whiteSpace: "nowrap"
                }}>{x.label}</span>
              </div>
              {/* ★★出ますの 数。★％を 出しません。★数だけです。
                  ★★まだ 押していない方の 中身は 出しません（★見本④）。
                    ★誰が まだかを 並べると、★催促の 一覧に なります。 */}
              {x.countWord ? (
                <p style={{ ...small, marginTop: 4 }}>出ます　{x.countWord}</p>
              ) : null}

              {/* ★★できること。★押しどころは 下半分・44pt 以上。
                  ★★取り下げた ものには、★何も 出しません。 */}
              {actionsFor(x.state).length > 0 ? (
                <>
                  <button type="button" onClick={() => setOpenId(open ? null : x.ev.id)}
                    className="w-full"
                    style={{
                      minHeight: 44, marginTop: 8, borderRadius: 10,
                      border: `1px solid ${C.line}`, background: C.paper,
                      color: C.inkSoft, fontSize: "0.75rem"
                    }}>{open ? "とじる" : "この行事で すること"}</button>
                  {open ? (
                    <div className="space-y-2" style={{ marginTop: 8 }}>
                      {actionsFor(x.state).map((a) => (
                        <button key={a.key} type="button"
                          onClick={() => { if (onAction) onAction(x.ev, a.key); }}
                          className="w-full flex items-center justify-between"
                          style={{
                            minHeight: 48, borderRadius: 10, padding: "0 12px",
                            border: `1px solid ${C.line}`, background: C.card,
                            color: C.ink, fontSize: "0.8125rem"
                          }}>
                          <span>{a.label}</span>
                          {a.note ? <span style={small}>{a.note}</span> : null}
                        </button>
                      ))}
                    </div>
                  ) : null}
                </>
              ) : null}
            </div>
          );
        })
      )}

      {/* ★★足すのは、★いちばん下（★操作は 下半分に）。 */}
      {onAdd ? (
        <button type="button" onClick={onAdd}
          className="w-full"
          style={{
            minHeight: 52, borderRadius: 12, border: `1px solid ${C.curtain}`,
            borderBottomWidth: 3, background: C.curtain, color: "#FFFDF8",
            fontSize: "0.9375rem"
          }}>行事を 出す</button>
      ) : null}
    </div>
  );
}
