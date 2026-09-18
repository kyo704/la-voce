"use client";

import { useState } from "react";
import { C } from "@/lib/tokens";
// ★★行事を 出す 入れ口の 決め（★2026-09-18）。★字も 決めも lib が 持ちます。
import {
  EVENT_KINDS, NOT_YET, FORM_NOTES, canSubmit, emptyForm
} from "@/lib/orgEventForm";
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

export default function OpsEvents({
  events, participants, targetOf, onAdd, onAction, adding = false, addError = ""
}) {
  const [openId, setOpenId] = useState(null);
  // ★★行事を 出す 入れ口（★2026-09-18）。
  //   ★★はじめは 閉じて います。★札を 押して 開きます。
  //   ★★開きっぱなしに しません。★一覧が 下に 押し下げられます。
  const [form, setForm] = useState(null);
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
      {onAdd && form === null ? (
        <button type="button" onClick={() => setForm(emptyForm())}
          className="w-full"
          style={{
            minHeight: 52, borderRadius: 12, border: `1px solid ${C.curtain}`,
            borderBottomWidth: 3, background: C.curtain, color: "#FFFDF8",
            fontSize: "0.9375rem"
          }}>行事を 出す</button>
      ) : null}

      {/* ★★★行事を 出す 入れ口（★2026-09-18）。
          ★★★見本の 入れ口は 7つ です。★いま 通せるのは 3つ です。
            ★★時間・対象・場所は、★`create_org_event` が 受け取りません。
            ★★台帳に 列は ある ものも あります（start_time / end_time / target_group）。
            ★★★直の insert を しません。★塞いで あります（★2026-09-04・#007）。
              ★★`org_id` を 自由に できて、★どの 学校にも 予定を 作れて いました。
            ★★★抜け道を 作りません。★関数を 広げる 日まで、★3つ で 出します。
          ★★まだの ものは、★下に 何が まだかを 書きます。★口は 置きません（★§8⑤）。
          ★★字も 決めも lib/orgEventForm.js が 持ちます。 */}
      {onAdd && form !== null ? (
        <div style={{
          background: C.card, border: `1px solid ${C.curtain}`,
          borderRadius: 14, padding: 14
        }}>
          <p style={{ fontSize: "0.875rem", fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>
            行事を 出す
          </p>

          <p style={{ ...small, margin: "0 0 4px" }}>日</p>
          <input type="date" value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            style={{
              width: "100%", minHeight: 48, borderRadius: 12, padding: "0 13px",
              border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
              fontSize: "1rem", marginBottom: 10
            }} />

          <p style={{ ...small, margin: "0 0 4px" }}>種類</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {EVENT_KINDS.map((k) => (
              <button key={k} type="button" onClick={() => setForm((f) => ({ ...f, kind: k }))}
                aria-pressed={form.kind === k}
                style={{
                  minHeight: 44, padding: "0 12px", borderRadius: 999,
                  border: `1px solid ${form.kind === k ? C.curtain : C.line}`,
                  background: form.kind === k ? C.curtain : C.card,
                  color: form.kind === k ? "#FFFDF8" : C.inkSoft,
                  fontSize: "0.75rem"
                }}>{k}</button>
            ))}
          </div>

          <p style={{ ...small, margin: "0 0 4px" }}>行事の 名前</p>
          <input type="text" value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value.slice(0, 60) }))}
            placeholder="れい：実技試験"
            style={{
              width: "100%", minHeight: 48, borderRadius: 12, padding: "0 13px",
              border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
              fontSize: "1rem", marginBottom: 10
            }} />

          {addError ? (
            <p style={{ ...small, color: C.curtain, margin: "0 0 8px" }}>{addError}</p>
          ) : null}

          <div style={{ display: "flex", gap: 8 }}>
            <button type="button" disabled={adding || !canSubmit(form)}
              onClick={async () => {
                const ok = await onAdd(form);
                if (ok !== false) setForm(null);
              }}
              style={{
                flex: 1, minHeight: 48, borderRadius: 12,
                border: `1px solid ${C.curtain}`,
                background: canSubmit(form) ? C.curtain : C.line,
                color: "#FFFDF8", fontSize: "0.875rem"
              }}>出す</button>
            <button type="button" onClick={() => setForm(null)}
              style={{
                minHeight: 48, padding: "0 16px", borderRadius: 12,
                border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
                fontSize: "0.875rem"
              }}>やめる</button>
          </div>

          <div style={{ marginTop: 10 }}>
            {FORM_NOTES.map((t) => (
              <p key={t} style={{ ...small, margin: 0 }}>{t}</p>
            ))}
            {NOT_YET.map((x) => (
              <p key={x.key} style={{ ...small, margin: 0, color: C.inkSoft }}>
                {`${x.label} …… ${x.why}`}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
