"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  MODES, DEFAULT_MODE, COUNT_PRESETS, MIN_COUNT, MAX_COUNT, WEEKDAYS,
  defaultDue, checkForm, canStart, skipReason, startResult,
  RS_HEAD, RS_SUB, RS_DECIDE_HEAD, RS_WHOSE, RS_ALL, RS_WHOSE_NOTE_1,
  RS_WHOSE_NOTE_2, RS_WHOSE_NOTE_3, RS_NAME, RS_NAME_EX, RS_PERIOD, RS_DUE,
  RS_DUE_NOTE, RS_COUNT, RS_COUNT_UNIT, RS_COUNT_NOTE, RS_MODE_HEAD,
  RS_WHEN_HINT, RS_WHEN_NOTE, RS_START, RS_ASK_HEAD, RS_ASK_1, RS_ASK_2,
  RS_ASK_3, RS_ASK_4, RS_NEED_TEACHER, RS_MODE_NOTE, RS_NOTE, startedLine,
  orgRows, showsOrgTabs, selectedOrg, RS_ORG_1, RS_ORG_2
} from "@/lib/roundStart";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★回を 始める ── ★見本 `SC['回を始める']`
//   ★出どころ 裁定185 ／ sql/69
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//
//   ★★★日づけは ここで 決めません。★曜日・時こくは **目安** です。
//     ★学生の「出られない日」を 集める前に 決めたら、★集める 意味が ありません。
//   ★★★まとめて 始めても、★止まるのは その 先生 だけ です（`start_lesson_rounds`）。
//     ★1人の 重なりで、★ほかの 先生まで 止めません。
//   ★★★お知らせは 送りません。★催促も しません。
//
//   ★見張り components/tests/round-start-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };
const 札 = {
  background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
  padding: rem(12), flex: 1, minWidth: 260
};
const 入 = {
  width: "100%", minHeight: 44, borderRadius: 10, padding: `0 ${rem(10)}`,
  border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
  fontFamily: FONT_STACK, ...TYPE.li
};

function 選札({ on, children, onClick }) {
  return (
    <button type="button" onClick={onClick}
      style={{
        minHeight: 44, padding: `0 ${rem(12)}`, borderRadius: 999,
        border: `1px solid ${on ? C.curtain : C.line}`,
        background: on ? C.curtain : C.card, color: on ? C.onCurtain : C.inkSoft,
        fontFamily: FONT_STACK, ...TYPE.usual
      }}>{children}</button>
  );
}

// ★★★`onBack` を 外しました（★2026-09-24）。
//   ★この 画面は レッスン割の **中** に 出ます。★戻る 先は その 帯 です。
//   ★★渡さない `onBack` を 置くと、★出ない 札が 残ります（★`prop_not_passed`）。
export default function RoundStart({
  supabase, orgs = [], teachers = [], today, monkaCount, onStarted, onPickOrg
}) {
  // ★★★どの 学校の 回か（★裁定140・design-v42）。
  //   ★★「はじめの 1つ」を こちらで 選びません ── ★台帳が 名前の 順で 返します。
  //   ★★1校 だけの 方には 札も 註も 出しません（★裁定73）。
  const [orgSel, setOrgSel] = useState(null);
  const [選, set選] = useState([]);
  const [name, setName] = useState("");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [due, setDue] = useState("");
  const [count, setCount] = useState(12);
  const [mode, setMode] = useState(DEFAULT_MODE);
  const [wd, setWd] = useState(0);
  const [hhmm, setHhmm] = useState("16:00");
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [out, setOut] = useState(null);

  useEffect(() => { if (!due && today) setDue(defaultDue(today)); }, [due, today]);

  const 校 = useMemo(() => orgRows(orgs), [orgs]);
  const いま校 = useMemo(() => selectedOrg(orgs, orgSel), [orgs, orgSel]);
  const 形 = useMemo(() => checkForm({ from, to, due, count }), [from, to, due, count]);
  const 押せる = useMemo(() =>
    canStart({ teachers: 選, from, to, due, count }), [選, from, to, due, count]);

  const 始める = useCallback(async () => {
    if (!supabase || !いま校) return;
    if (選.length === 0) { setError(tx(RS_NEED_TEACHER)); return; }
    setBusy(true); setError(""); setAsk(false);
    try {
      // ★★1人ずつ 例外を 拾うのは 台帳 です。★止まった 人 だけ 返って きます。
      const { data, error: e } = await supabase.rpc("start_lesson_rounds", {
        p_org: いま校.id, p_teachers: 選, p_name: name,
        p_from: from, p_to: to, p_due: due, p_need: Number(count)
      });
      if (e) throw e;
      setOut(startResult(data));
      if (onStarted) onStarted();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, いま校, 選, name, from, to, due, count, onStarted]);

  const 名 = useMemo(() => {
    const o = {};
    teachers.forEach((t) => { o[t.id] = t.name; });
    return o;
  }, [teachers]);

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(4)}` }}>{tx(RS_HEAD)}</h2>

      {/* ★★★学校の 札 …… ★2校 以上の ときだけ（★裁定73）。 */}
      {showsOrgTabs(orgs) ? (
        <>
          <div style={{ display: "flex", gap: rem(6), flexWrap: "wrap", marginBottom: rem(10) }}>
            {校.map((o) => (
              <選札 key={o.id} on={いま校 && いま校.id === o.id}
                onClick={() => { setOrgSel(o.id); set選([]); if (onPickOrg) onPickOrg(o.id); }}>
                {o.name}
              </選札>
            ))}
          </div>
          <div style={{ ...小, marginBottom: rem(9) }}>
            {tx(RS_ORG_1)}{いま校 ? いま校.name : ""}{tx(RS_ORG_2)}
          </div>
        </>
      ) : null}

      <div style={{ ...小, marginBottom: rem(10) }}>{tx(RS_SUB)}</div>

      <div style={{ display: "flex", gap: rem(12), alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ ...札, flex: 1.2, minWidth: 300 }}>
          <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(RS_DECIDE_HEAD)}</div>

          <div style={{ ...小, marginTop: rem(6) }}>{tx(RS_WHOSE)}</div>
          <div style={{ display: "flex", gap: rem(6), flexWrap: "wrap", marginTop: rem(4) }}>
            {teachers.map((t) => (
              <選札 key={t.id} on={選.includes(t.id)}
                onClick={() => set選((s) =>
                  s.includes(t.id) ? s.filter((x) => x !== t.id) : [...s, t.id])}>
                {t.name}
              </選札>
            ))}
            <選札 on={false} onClick={() => set選(teachers.map((t) => t.id))}>{tx(RS_ALL)}</選札>
          </div>
          <div style={{ ...小, marginTop: rem(4) }}>
            {tx(RS_WHOSE_NOTE_1)}（{選.length}{tx("人")}）。{tx(RS_WHOSE_NOTE_2)}
            <br />
            {tx(RS_WHOSE_NOTE_3)}
          </div>

          <div style={{ ...小, marginTop: rem(9) }}>{tx(RS_NAME)}</div>
          <input value={name} onChange={(e) => setName(e.target.value)}
            placeholder={tx(RS_NAME_EX)} style={入} />

          <div style={{ ...小, marginTop: rem(9) }}>{tx(RS_PERIOD)}</div>
          <div style={{ display: "flex", gap: rem(8), alignItems: "center" }}>
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} style={入} />
            <span style={小}>〜</span>
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} style={入} />
          </div>

          <div style={{ ...小, marginTop: rem(9) }}>{tx(RS_DUE)}</div>
          <input type="date" value={due} onChange={(e) => setDue(e.target.value)}
            style={{ ...入, maxWidth: 220 }} />
          <div style={{ ...小, marginTop: rem(4) }}>{tx(RS_DUE_NOTE)}</div>

          <div style={{ ...小, marginTop: rem(9) }}>{tx(RS_COUNT)}</div>
          <div style={{ display: "flex", gap: rem(8), alignItems: "center", flexWrap: "wrap" }}>
            <input type="number" min={MIN_COUNT} max={MAX_COUNT} value={count}
              onChange={(e) => setCount(e.target.value)}
              style={{ ...入, width: 100, textAlign: "right" }} />
            <span style={小}>{tx(RS_COUNT_UNIT)}</span>
            {COUNT_PRESETS.map((p) => (
              <選札 key={p.n} on={Number(count) === p.n} onClick={() => setCount(p.n)}>
                {tx(p.label)}
              </選札>
            ))}
          </div>
          <div style={{ ...小, marginTop: rem(4) }}>{tx(RS_COUNT_NOTE)}</div>
        </div>

        <div style={札}>
          <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(RS_MODE_HEAD)}</div>
          {MODES.map((m) => (
            <button key={m.key} type="button" onClick={() => setMode(m.key)}
              style={{
                width: "100%", minHeight: 44, display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: rem(8), textAlign: "left",
                padding: `${rem(9)} 0`, background: "transparent", border: "none",
                borderBottom: `1px solid ${C.line2}`, color: C.ink,
                fontFamily: FONT_STACK, ...TYPE.li
              }}>
              <span>
                {tx(m.label)}
                <span style={{ ...小, display: "block" }}>{tx(m.hint)}</span>
              </span>
              <span style={{ color: C.curtain }}>{mode === m.key ? "●" : ""}</span>
            </button>
          ))}

          {mode === "weekly" ? (
            <>
              <div style={{ ...小, marginTop: rem(9) }}>{tx(RS_WHEN_HINT)}</div>
              <div style={{ display: "flex", gap: rem(5), flexWrap: "wrap", marginTop: rem(4) }}>
                {WEEKDAYS.map((w, i) => (
                  <選札 key={w} on={wd === i} onClick={() => setWd(i)}>{w}</選札>
                ))}
              </div>
              <input type="time" step="300" value={hhmm} onChange={(e) => setHhmm(e.target.value)}
                style={{ ...入, maxWidth: 150, marginTop: rem(8) }} />
              {/* ★★★目安 です。★実際の 日は 確定の ときに 決まります。 */}
              <div style={{ ...小, marginTop: rem(4) }}>{tx(RS_WHEN_NOTE)}</div>
            </>
          ) : null}

          <div style={{
            background: C.band, border: `1px solid ${C.line3}`, borderRadius: 12,
            padding: rem(12), marginTop: rem(10), ...TYPE.li
          }}>
            {RS_MODE_NOTE.map((l) => (
              <span key={l} style={{ display: "block" }}>{tx(l)}</span>
            ))}
          </div>
        </div>
      </div>

      {形 ? (
        <div style={{
          background: C.band, border: `1px solid ${C.line3}`, borderRadius: 12,
          padding: rem(12), marginTop: rem(11), ...TYPE.li
        }}>{tx(形)}</div>
      ) : null}

      {ask ? (
        <div style={{
          background: C.band, border: `1px solid ${C.line3}`, borderRadius: 12,
          padding: rem(12), marginTop: rem(11)
        }}>
          <div style={TYPE.li}>{tx(RS_ASK_HEAD)}</div>
          <div style={{ ...小, marginTop: rem(4) }}>
            {選.map((id) => 名[id]).filter(Boolean).join("・")}
            <br />
            {tx(RS_ASK_1)}
            <br />
            {tx(RS_ASK_2)}{due}{tx(RS_ASK_3)}
            <br />
            {tx(RS_ASK_4)}
          </div>
          <div style={{ display: "flex", gap: rem(6), marginTop: rem(8) }}>
            <button type="button" onClick={始める} disabled={busy}
              style={{
                minHeight: 44, padding: `0 ${rem(14)}`, borderRadius: 999, border: "none",
                background: C.curtain, color: C.onCurtain, fontFamily: FONT_STACK,
                fontWeight: 700, ...TYPE.li
              }}>{tx(RS_START)}（{選.length}{tx("人ぶん")}）</button>
            <button type="button" onClick={() => setAsk(false)}
              style={{
                minHeight: 44, padding: `0 ${rem(14)}`, borderRadius: 999,
                border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
                fontFamily: FONT_STACK, ...TYPE.li
              }}>{tx("やめる")}</button>
          </div>
        </div>
      ) : (
        <button type="button" onClick={() => setAsk(true)} disabled={!押せる || busy}
          style={{
            minHeight: 44, padding: `0 ${rem(16)}`, borderRadius: 13, marginTop: rem(12),
            border: "none", background: C.curtain, color: C.onCurtain,
            fontFamily: FONT_STACK, fontWeight: 700,
            opacity: 押せる && !busy ? 1 : 0.5, ...TYPE.li
          }}>{tx(RS_START)}（{選.length}{tx("人ぶん")}）</button>
      )}

      {/* ★★★止まった 先生 だけ を 出します。★ほかは 始まって います。 */}
      {out ? (
        <div style={{ ...小, marginTop: rem(10) }}>
          {out.started}{tx("人ぶん 始めました")}
          {out.skippedRows.map((r) => (
            <span key={r.teacher_id} style={{ display: "block" }}>
              {名[r.teacher_id] || ""}　{tx(skipReason(r.skipped))}
            </span>
          ))}
        </div>
      ) : null}

      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        <span style={{ display: "block" }}>{tx(startedLine(monkaCount))}</span>
        {RS_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
