"use client";

import { useState } from "react";
import useWindowWidth from "@/components/useWindowWidth";
import { C } from "@/lib/tokens";
// ★★広い ときは 表（★2026-09-18・坂本さんの お決め Q4）。★名簿・役職と 同じ 形。
import OpsEventTable from "@/components/OpsEventTable";
import { showEventTable, timeSpan } from "@/lib/opsEventTable";
// ★★行事を 出す 入れ口の 決め（★2026-09-18）。★字も 決めも lib が 持ちます。
import {
  EVENT_KINDS, NOT_YET, EVENT_NOTES, canSubmit, emptyForm,
  // ★★裁定 その89（時間・場所・対象）／★お決め Q5（下見・近道・字）。
  DATE_SHORTCUTS, DATE_HINT, TIME_HINT, TIME_STEPS, TIME_STEP_MIN,
  timeReversed, endWithoutStart, TIME_REVERSED_LINE, END_WITHOUT_START_LINE,
  previewLines, targetLine, SUB_LINE
} from "@/lib/orgEventForm";
import { buildEvents, actionsFor, EVENT_STATES } from "@/lib/orgEventsView";
import { tx } from "@/lib/t";

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
// ★★★6段に 寄せました（★裁定 その103・2026-09-19）。
//   ★★役で 寄せます。★近い 数に 丸めません（★D55）。
//   ★★11 → 12.5 …… ★添える 字（★日づけ・断り）
//   ★★10 → 12 …… ★いちばん 小さい 印（★「済み」などの 札）
//   ★★15 → 15.5 …… ★一覧の 題／大きい 押し札
//   ★★14 → 14.5 …… ★書き口の 小見出し／出す・やめる の 札
const small = { fontSize: "0.78125rem", color: C.inkSoft, lineHeight: 1.8 };

/**
 * ★きょうから n日 先の 日（★見本の `dShift`）。
 *
 *   ★★★端末の 時計で 作ります（★2026-09-18 の 一件）。
 *     ★★`toISOString()` は UTC です。★夜に 押すと 前の 日に なります。
 */
function 先の日(days) {
  const d = new Date();
  d.setDate(d.getDate() + Number(days || 0));
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

/** ★はじまりに n分 足した 時刻（★見本の `tAdd`）。 */
function 足した時刻(start, min) {
  const m = /^(\d{2}):(\d{2})/.exec(String(start || ""));
  if (!m) return "";
  const t = Number(m[1]) * 60 + Number(m[2]) + Number(min || 0);
  if (t >= 24 * 60) return "23:55";
  return `${String(Math.floor(t / 60)).padStart(2, "0")}:${String(t % 60).padStart(2, "0")}`;
}

/** ★時計の 枠（★逆の ときは わくを 変えます）。 */
function 時計の枠(warui) {
  return {
    minHeight: 48, borderRadius: 12, padding: "0 12px", maxWidth: 140,
    border: `1px solid ${warui ? C.curtain : C.line}`,
    background: warui ? C.paper : C.paper, color: C.ink, fontSize: "1rem"
  };
}

/** ★並びに 入れる／外す（★押した その場で 効きます）。 */
function 入れ替え(list, v) {
  const a = Array.isArray(list) ? list.slice() : [];
  const i = a.indexOf(v);
  if (i >= 0) a.splice(i, 1);
  else a.push(v);
  return a;
}

function dayWord(iso) {
  const s = String(iso || "");
  if (s.length < 10) return "";
  return `${Number(s.slice(5, 7))}月${Number(s.slice(8, 10))}日`;
}

export default function OpsEvents({
  events, participants, targetOf, onAdd, onAction, adding = false, addError = "",
  // ★★対象の 札（★裁定 その89 Q3）。★名簿に ある ものだけ を 渡して ください。
  //   ★★1つも 無ければ、★その 列ごと 出しません（★押せない 札を 置きません）。
  grades = [], courses = [],
  // ★★★採点へ（★裁定 その105・2026-09-20）。★渡されなければ 出しません。
  onGoSaiten}) {
  /**
   * ★対象の 1列（★学年 ／ 学科・コース）。
   *
   *   ★★★1つも 無ければ、★列ごと 出しません。
   *     ★★空の 見出しだけ が 残ると、★何かが 壊れて いるように 見えます。
   *   ★★何も 選ばなければ「みなさん」です。★そう 書いて おきます。
   */
  function 対象の列(見出し, 札, 選んだ, 押した) {
    if (!札 || 札.length === 0) return null;
    return (
      <div style={{ marginBottom: 10 }}>
        <p style={{ ...small, margin: "0 0 4px" }}>{見出し}</p>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
          {札.map((v) => {
            const on = (選んだ || []).indexOf(v) >= 0;
            return (
              <button key={v} type="button" onClick={() => 押した(v)}
                aria-pressed={on}
                style={{
                  minHeight: 44, padding: "0 12px", borderRadius: 999,
                  border: `1px solid ${on ? C.curtain : C.line}`,
                  background: on ? C.curtain : C.card,
                  color: on ? C.onCurtain : C.inkSoft, fontSize: "0.75rem"
                }}>{v}</button>
            );
          })}
        </div>
      </div>
    );
  }

  const [openId, setOpenId] = useState(null);
  // ★★行事を 出す 入れ口（★2026-09-18）。
  //   ★★はじめは 閉じて います。★札を 押して 開きます。
  //   ★★開きっぱなしに しません。★一覧が 下に 押し下げられます。
  const [form, setForm] = useState(null);
  const width = useWindowWidth();
  const rows = buildEvents(events, participants, targetOf);
  // ★★表に 渡す ため、★取り下げ かどうかも 添えます。
  const 表の行 = rows.map((x) => ({
    ...x, withdrawn: x.state === EVENT_STATES.WITHDRAWN
  }));

  return (
    <div className="space-y-3" style={{ paddingBottom: 16 }}>
      <div>
        {/* ★★`.ff-display` を 外しました（★2026-09-18・お決め G7）。
            ★★`lib/uiKit.js`「門の中の 画面では .ff-display を 使いません」。
            ★★名簿・日程・連絡と 揃えました。 */}
        <h2 style={{ fontSize: "1.25rem", color: C.ink }}>行事</h2>
        {/* ★★題の 下の 1行（★見本の `.sub`・★お決め G5）。★字は lib が 持ちます。 */}
        <p style={small}>{SUB_LINE}</p>
      </div>

      {/* ★★★広い ときは 表（★見本 `P_gyoji` の 7列・★お決め Q4）。
           ★★狭い ときは これまで どおり 札 です。★どちらも 残します。
           ★★境目は lib/opsEventTable.js の `TABLE_AT`（★測った 数 ＋ 殻の 余白）。 */}
      {rows.length > 0 && showEventTable(width) ? (
        <OpsEventTable rows={表の行} dayWord={dayWord}
          onOpen={(ev) => setOpenId(openId === ev.id ? null : ev.id)} />
      ) : rows.length === 0 ? (
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
                  <p style={{ fontSize: "0.96875rem", color: C.ink }}>{x.ev.title || "（名前なし）"}</p>
                  <p style={small}>{dayWord(x.ev.event_date)}</p>
                </div>
                <span style={{
                  fontSize: "0.75rem", color: C.inkSoft, background: C.paper,
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

              {/* ★★★採点へ（★見本 `P_saiten`・裁定 その105・2026-09-20）。
                   ★★渡されなければ 出しません（★押せない 札を 置きません）。
                   ★★取り下げた 行事には 出しません。★採点する もの が ありません。 */}
              {onGoSaiten && !withdrawn ? (
                <button type="button" onClick={() => onGoSaiten(x.ev)}
                  className="w-full"
                  style={{
                    minHeight: 44, marginTop: 8, borderRadius: 10,
                    border: `1px solid ${C.line}`, background: C.card,
                    color: C.ink, fontSize: "0.78125rem"
                  }}>採点</button>
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
            borderBottomWidth: 3, background: C.curtain, color: C.onCurtain,
            fontSize: "0.96875rem"
          }}>行事を 出す</button>
      ) : null}

      {/* ★★★一覧の 下の 断り（★裁定 その117・2026-09-20）。
           ★★きょうまで、★この 字は「行事を 出す」の 中に だけ ありました。
             ★★出す 人しか 読めません でした。
           ★★★一覧を 見るのは 生徒・先生・事務 です。★みなさん です。
             ★★「出欠は 集めません」は、★見る 人が 知る こと です。
             ★★出す 人に だけ 見せると、★見る 人は「なぜ 出欠が 無いか」が 判りません。
           ★★★字は 入力の 画面と **同じ もの** です（★`EVENT_NOTES` の 1つ から）。
             ★★2か所で ちがう 字に しません（★裁定 その113 §1 EXCEPTION）。
           ★★★出す 道が 無い 人にも 出します。★約束は みなさんの ものです。 */}
      <div style={{ marginTop: 10 }}>
        {EVENT_NOTES.map((t) => (
          <p key={t} className="note" style={{ ...small, margin: 0 }}>{t}</p>
        ))}
      </div>

      {/* ★★★行事を 出す 入れ口（★2026-09-18・裁定 その89）。
          ★★きょうまで、★通せるのは 3つ でした（★日・種類・名前）。
            ★★時間・対象・場所は、★`create_org_event` が 受け取りません でした。
          ★★★裁定 その89 で、★台帳も 道も 広がりました ──
            ★★時間 … `p_start_time` / `p_end_time`（★列は もとから ありました）
            ★★場所 … `place` の 1列（★自由に 打ちます。★表は 作りません）
            ★★対象 … `target_grades` / `target_courses` の **2列**
              ★★★空の 並び ＝ みなさん。★`null` に しません。
          ★★★直の insert を しません。★塞いで あります（★2026-09-04・#007）。
            ★★`org_id` を 自由に できて、★どの 学校にも 予定を 作れて いました。
          ★★字も 決めも lib/orgEventForm.js が 持ちます。 */}
      {onAdd && form !== null ? (
        <div style={{
          background: C.card, border: `1px solid ${C.curtain}`,
          borderRadius: 14, padding: 14
        }}>
          <p style={{ fontSize: "0.90625rem", fontWeight: 700, color: C.ink, margin: "0 0 8px" }}>
            行事を 出す
          </p>

          <p style={{ ...small, margin: "0 0 4px" }}>日</p>
          <input type="date" value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            style={{
              width: "100%", minHeight: 48, borderRadius: 12, padding: "0 13px",
              border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
              fontSize: "1rem"
            }} />
          {/* ★★日の 近道（★見本の きょう／あした／来週／来月・★お決め G4）。
              ★★日づけは 端末の 時計で 作ります（★台帳は UTC・2026-09-18 の 一件）。 */}
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "6px 0 4px" }}>
            {DATE_SHORTCUTS.map((d) => (
              <button key={d.key} type="button"
                onClick={() => setForm((f) => ({ ...f, date: 先の日(d.days) }))}
                style={{
                  minHeight: 44, padding: "0 12px", borderRadius: 999,
                  border: `1px solid ${C.line}`, background: C.card,
                  color: C.inkSoft, fontSize: "0.75rem"
                }}>{d.label}</button>
            ))}
          </div>
          <p style={{ ...small, margin: "0 0 10px" }}>{DATE_HINT}</p>

          <p style={{ ...small, margin: "0 0 4px" }}>種類</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 10 }}>
            {EVENT_KINDS.map((k) => (
              <button key={k} type="button" onClick={() => setForm((f) => ({ ...f, kind: k }))}
                aria-pressed={form.kind === k}
                style={{
                  minHeight: 44, padding: "0 12px", borderRadius: 999,
                  border: `1px solid ${form.kind === k ? C.curtain : C.line}`,
                  background: form.kind === k ? C.curtain : C.card,
                  color: form.kind === k ? C.onCurtain : C.inkSoft,
                  fontSize: "0.75rem"
                }}>{k}</button>
            ))}
          </div>

          {/* ★★時間（★裁定 その89 Q1）。★終わりは 入れなくて よい です。 */}
          <p style={{ ...small, margin: "0 0 4px" }}>時間</p>
          <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
            <input type="time" step={TIME_STEP_MIN * 60} value={form.startTime}
              onChange={(e) => setForm((f) => ({ ...f, startTime: e.target.value }))}
              style={時計の枠(false)} />
            <span style={{ color: C.inkSoft }}>〜</span>
            <input type="time" step={TIME_STEP_MIN * 60} value={form.endTime}
              onChange={(e) => setForm((f) => ({ ...f, endTime: e.target.value }))}
              style={時計の枠(timeReversed(form))} />
            {TIME_STEPS.map((m) => (
              <button key={m} type="button"
                onClick={() => setForm((f) => ({ ...f, endTime: 足した時刻(f.startTime, m) }))}
                disabled={!form.startTime}
                style={{
                  minHeight: 44, padding: "0 10px", borderRadius: 999,
                  border: `1px solid ${C.line}`, background: C.card,
                  color: form.startTime ? C.inkSoft : C.ink4, fontSize: "0.75rem"
                }}>+{m < 60 ? `${m}分` : `${m / 60}時間`}</button>
            ))}
          </div>
          {/* ★★前後が 逆なら、★その場で 言います。★出す ときまで 待ちません。 */}
          {timeReversed(form) ? (
            <p style={{ ...small, color: C.curtain, margin: "6px 0 10px" }}>{TIME_REVERSED_LINE}</p>
          ) : endWithoutStart(form) ? (
            <p style={{ ...small, color: C.curtain, margin: "6px 0 10px" }}>{END_WITHOUT_START_LINE}</p>
          ) : (
            <p style={{ ...small, margin: "6px 0 10px" }}>{TIME_HINT}</p>
          )}

          {/* ★★場所（★裁定 その89 Q2）。★自由に 打ちます。★一覧は 作りません。 */}
          <p style={{ ...small, margin: "0 0 4px" }}>場所</p>
          <input type="text" value={form.place}
            onChange={(e) => setForm((f) => ({ ...f, place: e.target.value.slice(0, 40) }))}
            placeholder="れい：第1ホール"
            style={{
              width: "100%", minHeight: 48, borderRadius: 12, padding: "0 13px",
              border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
              fontSize: "1rem", marginBottom: 10
            }} />

          {/* ★★対象（★裁定 その89 Q3）。★2軸 です。★選ばなければ みなさん です。 */}
          {対象の列("対象 ── 学年", grades, form.grades,
            (v) => setForm((f) => ({ ...f, grades: 入れ替え(f.grades, v) })))}
          {対象の列("対象 ── 学科・コース", courses, form.courses,
            (v) => setForm((f) => ({ ...f, courses: 入れ替え(f.courses, v) })))}

          <p style={{ ...small, margin: "0 0 4px" }}>行事の 名前</p>
          <input type="text" value={form.title}
            onChange={(e) => setForm((f) => ({ ...f, title: e.target.value.slice(0, 60) }))}
            placeholder="れい：実技試験"
            style={{
              width: "100%", minHeight: 48, borderRadius: 12, padding: "0 13px",
              border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
              fontSize: "1rem", marginBottom: 10
            }} />

          {/* ★★★出す 前の 下見（★見本の `warn`・★お決め G3）。
               ★★押して から「ちがった」と 気づく のを 減らします。
               ★★人数は ここで 数えません。★渡された ものを 出します。 */}
          {(() => {
            const 下見 = previewLines(form);
            return (
              <div style={{
                ...card, background: C.paper, borderColor: C.line, margin: "0 0 10px"
              }}>
                <p style={{ fontSize: "0.8125rem", color: C.ink, fontWeight: 700, margin: 0 }}>
                  {下見.head}
                </p>
                <p style={{ ...small, margin: "2px 0 0" }}>{下見.when}　{下見.where}</p>
                <p style={{ ...small, margin: 0 }}>{tx("だれに")}　{下見.who}</p>
              </div>
            );
          })()}

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
                color: C.onCurtain, fontSize: "0.90625rem"
              }}>出す</button>
            <button type="button" onClick={() => setForm(null)}
              style={{
                minHeight: 48, padding: "0 16px", borderRadius: 12,
                border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
                fontSize: "0.90625rem"
              }}>やめる</button>
          </div>

          <div style={{ marginTop: 10 }}>
            {/* ★★注記の 印（★段3a 段階2・2026-09-20）。★見た目は 変わりません。 */}
            {EVENT_NOTES.map((t) => (
              <p key={t} className="note" style={{ ...small, margin: 0 }}>{t}</p>
            ))}
            {NOT_YET.map((x) => (
              <p key={x.key} style={{ ...small, margin: 0, color: C.inkSoft }}>
                {`${x.label} …… ${x.say}`}
              </p>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
