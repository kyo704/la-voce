"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { C } from "@/lib/tokens";
import { TYPE, SPACE, FONT_STACK, rem } from "@/lib/uiKit";
import {
  ScreenHead, Card, Box, Li, Btn, Two, FieldLabel, Input, TextArea,
  Switch, Back, Warn, Note, Usu, H3, EmptyBox, StateBlock
} from "@/components/UiV2";
import {
  DAYS, TT_COPY, hhmm, toMin, periodsOf, isOwnPeriods,
  buildGrid, freeCount, cellLabel, cellState, periodError, DEFAULT_PERIODS
} from "@/lib/myTimetable";

// ============================================================================
// 時間割（★個人の もの）── ★見本 SC['時間割']・SC['授業を入れる']・SC['自分のコマ']
//
//   ★出どころ Opus の 裁定（★2026-09-11・その15）⑦
//     「時間割：個人のものとして、作ってください。「重なり◯件」は、後回しで
//       構いません。」
//
//   ★★教室（D＋E＋F＋G＋H）には 1つも 触れません。
//     ★学校の コマも、★ほかの 方の 予定も、★ここには 出て きません。
//     ★「重なり ◯件」も 出しません。★後回しです。
//
//   ★★台帳　my_periods ／ my_timetable
//     ★supabase/2026-09-11-個人の時間割.sql
//     ★★どちらも ご本人だけの 決まり（RLS）です。★先生の 決まりは ありません。
//
//   ★★字と 数は lib/myTimetable.js が 持ちます。★ここで 決めません。
//
//   ★見張り components/tests/my-timetable.test.js
// ============================================================================

/** ★マスの 地の 色（★見本 3311行）。 */
const CELL_BG = {
  class: "#FFFFFF",
  unavailable: "#F5EFE1",
  free: "#F4F8F5"
};

export default function MyTimetable({ userId, onBack }) {
  // ★★台帳の 客は、★ここで 作ります。
  //   ★★呼ぶ 側から 渡しません。★VocalTracker は 場面ごとに 作って います。
  //     ★渡すと、★どの 客か 分からなく なります。
  const supabase = createClient();
  const [state, setState] = useState("読み込み中");
  const [periods, setPeriods] = useState([]);
  const [rows, setRows] = useState([]);
  // ★★どの 画面を 出して いるか。★見本の push と 同じ 積み方です。
  const [view, setView] = useState("grid");
  const [cell, setCell] = useState(null);
  const [help, setHelp] = useState(true);

  const load = useCallback(async () => {
    if (!supabase || !userId) return;
    setState("読み込み中");
    const [p, t] = await Promise.all([
      supabase.from("my_periods").select("*").eq("user_id", userId).order("ord"),
      supabase.from("my_timetable").select("*").eq("user_id", userId)
    ]);
    if (p.error || t.error) { setState("失敗"); return; }
    setPeriods(p.data || []);
    setRows(t.data || []);
    setState("ふつう");
  }, [supabase, userId]);

  useEffect(() => { load(); }, [load]);

  if (state !== "ふつう") {
    return (
      <div style={{ fontFamily: FONT_STACK }}>
        <Back onClick={onBack}>きょう</Back>
        <ScreenHead title={TT_COPY.title} />
        <StateBlock state={state} onRetry={load} />
      </div>
    );
  }

  const list = periodsOf(periods);
  const grid = buildGrid(rows, list);

  // ── 自分の コマ ──────────────────────────────────────────
  if (view === "periods") {
    return (
      <PeriodsScreen
        supabase={supabase} userId={userId} periods={periods}
        onBack={() => { setView("grid"); load(); }} />
    );
  }

  // ── 1つの マス ──────────────────────────────────────────
  if (view === "cell" && cell) {
    return (
      <CellScreen
        supabase={supabase} userId={userId}
        weekday={cell.weekday} period={cell.period} row={cell.row}
        onBack={() => { setView("grid"); setCell(null); load(); }} />
    );
  }

  // ── 表 ──────────────────────────────────────────────────
  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <Back onClick={onBack}>きょう</Back>
      <ScreenHead title={TT_COPY.title} />

      {/* ★★断り（★見本 3300行）。★閉じられます。★見本も そう して います。 */}
      {help ? (
        <Warn>
          {TT_COPY.help1}<br />{TT_COPY.help2}
          <button type="button" onClick={() => setHelp(false)}
            style={{
              display: "block", marginTop: 6, marginLeft: "auto",
              minHeight: SPACE.tapMin, padding: "0 10px",
              background: "transparent", border: "none",
              color: C.inkSoft, fontSize: rem(11), fontFamily: FONT_STACK
            }}>閉じる</button>
        </Warn>
      ) : (
        <button type="button" onClick={() => setHelp(true)}
          style={{
            display: "inline-block", marginBottom: 8, minHeight: SPACE.tapMin,
            padding: "0 10px", background: C.card,
            border: `1px solid ${C.line}`, borderRadius: 99,
            color: C.inkSoft, fontSize: rem(11.5), fontFamily: FONT_STACK
          }}>？ 説明</button>
      )}

      {/* ★★月〜土を、横に動かさず一画面へ収めます。列幅とマスの高さは固定です。 */}
      <Card style={{ padding: 7 }}>
        <div style={{ width: "100%", overflow: "hidden" }}>
          <table style={{
            borderCollapse: "collapse", width: "100%", tableLayout: "fixed",
            ...TYPE.usual
          }}>
            <colgroup>
              <col style={{ width: "15%" }} />
              {DAYS.map((d) => <col key={d} style={{ width: `${85 / DAYS.length}%` }} />)}
            </colgroup>
            <tbody>
              <tr>
                <th style={{
                  background: C.card, padding: "4px 2px", textAlign: "left", ...TYPE.mini
                }}>コマ</th>
                {DAYS.map((d) => (
                  <th key={d} style={{ padding: "4px 2px", ...TYPE.mini }}>{d}</th>
                ))}
              </tr>
              {grid.map((r) => (
                <tr key={r.period.ord}>
                  <td style={{
                    background: C.card, padding: "4px 2px", textAlign: "left",
                    whiteSpace: "nowrap", overflow: "hidden"
                  }}>
                    <b style={{ fontSize: rem(11.5), color: C.ink }}>{r.period.name}</b><br />
                    <span style={{ fontSize: rem(9), color: C.inkSoft }}>
                      {hhmm(r.period.start_min)}
                    </span>
                  </td>
                  {r.cells.map((c) => (
                    <td key={c.key} style={{ padding: 2, verticalAlign: "top" }}>
                      <button type="button"
                        onClick={() => {
                          setCell({ weekday: c.weekday, period: r.period, row: c.row });
                          setView("cell");
                        }}
                        aria-label={cellLabel(c.weekday, r.period)}
                        style={{
                          width: "100%", height: 58, minHeight: 58,
                          overflow: "hidden",
                          background: CELL_BG[c.state], border: `1px solid ${C.line2}`,
                          borderRadius: 6, padding: "4px 2px",
                          fontFamily: FONT_STACK, fontSize: rem(9.5),
                          lineHeight: 1.35, color: C.ink, textAlign: "center"
                        }}>
                        {c.state === "class" ? (
                          <>
                            <b>{String(c.row.title || "").slice(0, 8)}</b>
                            {c.row.room ? (
                              <span style={{ display: "block", color: C.inkSoft, fontSize: rem(9) }}>
                                {String(c.row.room).slice(0, 8)}
                              </span>
                            ) : null}
                          </>
                        ) : (c.state === "unavailable" ? "×" : "")}
                      </button>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {/* ★★空きの 数。★先生に 伝わるのは、★この 数だけ です。 */}
        <Usu style={{ marginTop: 7 }}>
          空いて いる コマ　{freeCount(rows, list)}／{list.length * DAYS.length}
        </Usu>
      </Card>

      <Two>
        <Btn ghost small onClick={() => setView("periods")} style={{ flex: 1 }}>
          {TT_COPY.periodsTitle}
        </Btn>
      </Two>

      {/* ★★見本 .note。★4行。★1文字も 変えないこと。 */}
      <Note fold>
        {TT_COPY.notes.map((line, i) => (
          <span key={i}>{i > 0 ? <br /> : null}{line}</span>
        ))}
      </Note>
    </div>
  );
}

/**
 * ★1つの マス（★見本 SC['授業を入れる']）。
 *
 *   ★★3つの 姿を 行き来します ── ★授業が ある／来られない／あき。
 *   ★★「来られない」に すると、★授業の 中身は 入れません。
 *     ★台帳の 決まり（my_timetable_either_ok）と 同じです。
 */
function CellScreen({ supabase, userId, weekday, period, row, onBack }) {
  const [form, setForm] = useState({
    title: (row && row.title) || "",
    teacher: (row && row.teacher) || "",
    room: (row && row.room) || "",
    memo: (row && row.memo) || "",
    unavailable: !!(row && row.unavailable)
  });
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const save = async () => {
    setBusy(true); setErr(null);
    const blank = (s) => (String(s || "").trim() === "" ? null : String(s).trim());
    const body = form.unavailable
      ? { title: null, teacher: null, room: null, memo: null, unavailable: true }
      : {
        title: blank(form.title), teacher: blank(form.teacher),
        room: blank(form.room), memo: blank(form.memo), unavailable: false
      };
    const empty = !body.unavailable && !body.title && !body.teacher && !body.room && !body.memo;
    let e = null;
    if (empty) {
      // ★★空に すると「あき」です。★行を 消します。
      //   ★★空の 行を 残すと、★「あき」が 2通りに なります。
      if (row && row.id) {
        const r = await supabase.from("my_timetable").delete().eq("id", row.id);
        e = r.error;
      }
    } else {
      const r = await supabase.from("my_timetable").upsert(
        { user_id: userId, weekday, period_id: period.id, ...body },
        { onConflict: "user_id,weekday,period_id" }
      );
      e = r.error;
    }
    setBusy(false);
    if (e) { setErr("いま、書けませんでした。"); return; }
    onBack();
  };

  // ★★コマが 台帳に 無い ときは、★先に コマを 作って いただきます。
  if (!period || !period.id) {
    return (
      <div style={{ fontFamily: FONT_STACK }}>
        <Back onClick={onBack}>{TT_COPY.title}</Back>
        <ScreenHead title={cellLabel(weekday, period)} />
        <EmptyBox
          title="先に、自分の コマを 決めて ください。"
          sub="いまは、はじめの コマを 出して います。台帳には まだ 入って いません。" />
      </div>
    );
  }

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <Back onClick={onBack}>{TT_COPY.title}</Back>
      <ScreenHead title={cellLabel(weekday, period)} />

      {!form.unavailable ? (
        <>
          <FieldLabel htmlFor="tt-n">{TT_COPY.fName}</FieldLabel>
          <Input id="tt-n" value={form.title} placeholder={TT_COPY.phName}
            onChange={(e) => set("title", e.target.value)} />
          <FieldLabel htmlFor="tt-t">{TT_COPY.fTeacher}</FieldLabel>
          <Input id="tt-t" value={form.teacher} placeholder={TT_COPY.phTeacher}
            onChange={(e) => set("teacher", e.target.value)} />
          <FieldLabel htmlFor="tt-r">{TT_COPY.fRoom}</FieldLabel>
          <Input id="tt-r" value={form.room} placeholder={TT_COPY.phRoom}
            onChange={(e) => set("room", e.target.value)} />
          <FieldLabel htmlFor="tt-m">{TT_COPY.fMemo}</FieldLabel>
          <TextArea id="tt-m" value={form.memo} placeholder={TT_COPY.phMemo}
            style={{ minHeight: 60 }}
            onChange={(e) => set("memo", e.target.value)} />
        </>
      ) : null}

      {/* ★★見本 3352行。★授業が 入って いる ときは 出しません。 */}
      {!form.title && !form.teacher && !form.room && !form.memo ? (
        <>
          <FieldLabel>{TT_COPY.ngHead}</FieldLabel>
          <Box>
            <Li last right={(
              <Switch on={form.unavailable} label={TT_COPY.ngTitle}
                onChange={(v) => set("unavailable", v)} />
            )}>
              {TT_COPY.ngTitle}
              <Usu>{TT_COPY.ngSub}</Usu>
            </Li>
          </Box>
        </>
      ) : null}

      {err ? <Warn>{err}</Warn> : null}

      <Two style={{ marginTop: 12 }}>
        <Btn ghost disabled={busy} style={{ flex: 1 }}
          onClick={() => { setForm({ title: "", teacher: "", room: "", memo: "", unavailable: false }); }}>
          {TT_COPY.del}
        </Btn>
        <Btn disabled={busy} onClick={save} style={{ flex: 1 }}>{TT_COPY.ok}</Btn>
      </Two>

      <Note fold>
        {TT_COPY.notes.map((line, i) => (
          <span key={i}>{i > 0 ? <br /> : null}{line}</span>
        ))}
      </Note>
    </div>
  );
}

/**
 * ★自分の コマ（★見本 SC['自分のコマ']）。
 *
 *   ★★台帳に 1行も 無ければ、★はじめの コマを 出します。
 *     ★★入れて いません。★読むときに 決めて います。
 *     ★★だから「自分で 決めた」かどうかが、★いつでも 分かります。
 */
function PeriodsScreen({ supabase, userId, periods, onBack }) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const list = periodsOf(periods);
  const own = isOwnPeriods(periods);

  const seed = async () => {
    setBusy(true); setErr(null);
    const r = await supabase.from("my_periods").insert(
      DEFAULT_PERIODS.map((p) => ({ ...p, user_id: userId }))
    );
    setBusy(false);
    if (r.error) { setErr("いま、書けませんでした。"); return; }
    onBack();
  };

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <Back onClick={onBack}>{TT_COPY.title}</Back>
      <ScreenHead title={TT_COPY.periodsTitle}
        right={<Usu style={{ marginTop: 0 }}>{own ? TT_COPY.periodsMine : TT_COPY.periodsNone}</Usu>} />

      <Box>
        {list.map((p, i) => (
          <Li key={p.ord} last={i === list.length - 1}
            right={hhmm(p.start_min) + " 〜 " + hhmm(p.end_min)}>
            {p.name}
          </Li>
        ))}
      </Box>

      {err ? <Warn>{err}</Warn> : null}

      {!own ? (
        <>
          <Btn ghost disabled={busy} onClick={seed}>自分の コマを 作る</Btn>
          <Note fold>
            いまは、はじめの コマを 出して います。台帳には まだ 入って いません。<br />
            作ると、あとから 1つずつ 直せます。
          </Note>
        </>
      ) : (
        <Note fold>
          直すには、台帳の コマを 消してから 作り直して ください。<br />
          1つずつ 直す 画面は、まだ ありません。
        </Note>
      )}
    </div>
  );
}
