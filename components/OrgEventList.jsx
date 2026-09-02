"use client";

import { C } from "@/lib/tokens";
import { orgEventState, movedMessage, WITHDRAWN_MESSAGE, DISMISS_LABEL } from "@/lib/orgEventDisplay";

// ============================================================================
// 教室の予定の一覧（2026-09-02）
//
//   ★なぜ部品に切り出したか
//     同じ一覧を、ノートのカレンダーと、レッスンのタブの2か所に出します。
//     ★この JSX を書き写すと、片方だけ直る日が来ます。
//     この repo で何度も起きている壊れ方なので、実体は1つにします。
//     （判定そのものは、もともと lib/orgEventDisplay.js の1か所にあります。
//       ここで切り出したのは★見せ方のほうです）
//
//   ★出す・出さないの判定は、この部品が持ちます
//     呼ぶ側に .filter(...).length > 0 を書かせると、
//     それがもう1つの「同じ判定」になります。
//     出すものが何も無ければ、★この部品が null を返します。
//
//   ★2か所で見え方を変えません
//     「レッスンのほうは読むだけ」にすると、取り下げや日付の変更が
//     片方にしか出ない、ということが起こります。同じものを同じように出します。
// ============================================================================

export default function OrgEventList({ events, joins, todayISO, onToggleJoin, onDismiss, title = "教室の予定" }) {
  const list = events || [];
  const j = joins || {};
  const visible = list.filter((ev) => orgEventState(ev, j[ev.id], todayISO) !== "hidden");
  if (visible.length === 0) return null;

  return (
    <div className="rounded-2xl p-4 border" style={{ background: C.card, borderColor: C.line }}>
      <p className="text-sm font-medium mb-2">{title}</p>
      <div className="space-y-2">
        {visible.map((ev) => {
          const joined = j[ev.id];
          const st = orgEventState(ev, joined, todayISO);
          return (
            <div key={ev.id} className="text-xs rounded-xl p-2.5"
              style={{ background: C.paper, opacity: st === "withdrawn" ? 0.6 : 1 }}>
              <div className="flex items-center gap-2">
                <span className="ff-mono" style={{ color: C.inkSoft }}>{ev.event_date.slice(5)}</span>
                <span style={{ color: C.ink }}>{ev.kind}</span>
                <span className="flex-1 truncate" style={{ color: C.inkSoft }}>{ev.title}</span>
                {st !== "withdrawn" && (
                  <button type="button" onClick={() => onToggleJoin(ev)}
                    className="px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: joined ? C.sage : C.card, color: joined ? "#FFFDF8" : C.inkSoft, border: `1px solid ${C.line}` }}>
                    {joined ? "出ます" : "出る"}
                  </button>
                )}
              </div>
              {/* ★主語は予定。人ではありません。 */}
              {st === "withdrawn" && (
                <div className="flex items-center gap-2 mt-1.5">
                  <span style={{ color: C.inkSoft }}>{WITHDRAWN_MESSAGE}</span>
                  {joined && (
                    <button type="button" onClick={() => onDismiss(ev)}
                      className="underline" style={{ color: C.inkSoft }}>{DISMISS_LABEL}</button>
                  )}
                </div>
              )}
              {st === "moved" && (
                <p className="mt-1.5" style={{ color: C.inkSoft }}>
                  {movedMessage(ev.previous_date.slice(5), ev.event_date.slice(5))}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
