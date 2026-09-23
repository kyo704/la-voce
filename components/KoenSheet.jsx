"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { COLS_SLOT, COLS_CELL, canEditKoen } from "@/lib/koenCast";
import {
  COLS_ROW, COLS_WORDS, wordsOf, sheetGrid, rowLabel, totalMinutes,
  canAddRow, newRow, readMinutes, SHEET_NEED_CAST, SHEET_NEED_CAST_SUB,
  SHEET_ROWS_FIRST_HEAD, SHEET_ROWS_FIRST_NOTE, SHEET_IS_TRUTH,
  SHEET_EDIT_ON, SHEET_EDIT_OFF, SHEET_ADD_ROW_NEED, SHEET_ADDED, SHEET_NOW,
  sheetNotes
} from "@/lib/koenSheet";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★香盤表 ── ★見本 `P_kouban`
//   ★出どころ 裁定141 ／ design-v36 の 直し ②
//     ／ woolsong-2026-09-21_8.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333）
//
//   ★★★design-v36 の 直し ② ── ★配役が まだでも **場面を 先に 作れます**。
//     ★前は「先に 配役を 決めてください」で 止まり、★何も できませんでした。
//     ★★実際の 順は 逆の ことが 多い です ── ★台本を 見ながら 場面を 割り、
//       ★誰が 出るかは あとで 決まります。
//
//   ★★言葉（場面／役／香盤表）は **台帳** から 引きます（`koen_kind_words`）。
//     ★画面に 写しません。★`lib/koenSheet.js` が 引き方を 持ちます。
//
//   ★★★体の ことは 1つも 出しません（★裁定141）。
//
//   ★見張り components/tests/koen-sheet-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };
const マス = {
  padding: `${rem(7)} ${rem(9)}`, borderBottom: `1px solid ${C.line2}`,
  textAlign: "left", verticalAlign: "top", ...TYPE.li
};

export default function KoenSheet({ supabase, koen, onGoCast }) {
  const [rows, setRows] = useState([]);
  const [slots, setSlots] = useState([]);
  const [cells, setCells] = useState([]);
  const [words, setWords] = useState(null);
  const [編, set編] = useState(false);
  const [名, set名] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [word, setWord] = useState("");

  const 直せる = canEditKoen(koen);

  const 読む = useCallback(async () => {
    if (!supabase || !koen) return;
    try {
      const [{ data: rw }, { data: sl }, { data: kw }] = await Promise.all([
        supabase.from("koen_rows").select(COLS_ROW).eq("koen_id", koen.id).order("sort_order"),
        supabase.from("koen_slots").select(COLS_SLOT).eq("koen_id", koen.id).order("sort_order"),
        supabase.from("koen_kind_words").select(COLS_WORDS)
      ]);
      setRows(rw || []); setSlots(sl || []); setWords(kw || []);
      const ids = (rw || []).map((r) => r.id);
      if (ids.length > 0) {
        const { data: ce } = await supabase.from("koen_cells").select(COLS_CELL).in("row_id", ids);
        setCells(ce || []);
      } else { setCells([]); }
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase, koen]);

  useEffect(() => { 読む(); }, [読む]);

  const 語 = useMemo(() => wordsOf(words, koen && koen.kind), [words, koen]);
  const 表 = useMemo(() => sheetGrid(rows, slots, cells), [rows, slots, cells]);

  const 場面を足す = useCallback(async () => {
    if (!supabase || !koen) return;
    if (!canAddRow(名)) { setWord(tx(語.row_word) + tx(SHEET_ADD_ROW_NEED)); return; }
    setBusy(true); setError("");
    try {
      const { error: e } = await supabase.from("koen_rows")
        .insert({ koen_id: koen.id, ...newRow(名, rows.length + 1) });
      if (e) throw e;
      set名(""); setWord(tx(SHEET_ADDED));
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, koen, 名, rows.length, 読む, 語]);

  const 印をつける = useCallback(async (rowId, slotId, いま) => {
    if (!supabase) return;
    setBusy(true); setError("");
    try {
      if (いま) {
        const { error: e } = await supabase.from("koen_cells")
          .delete().eq("row_id", rowId).eq("slot_id", slotId);
        if (e) throw e;
      } else {
        const { error: e } = await supabase.from("koen_cells")
          .upsert({ row_id: rowId, slot_id: slotId }, { onConflict: "row_id,slot_id" });
        if (e) throw e;
      }
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, 読む]);

  const 分を書く = useCallback(async (rowId, v) => {
    if (!supabase) return;
    const n = readMinutes(v);
    if (n === null) return;
    setBusy(true); setError("");
    try {
      const { error: e } = await supabase.from("koen_rows").update({ minutes: n }).eq("id", rowId);
      if (e) throw e;
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, 読む]);

  if (!koen) return null;

  const 場面だけ先に = (
    <div style={{
      background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
      padding: rem(12), marginTop: rem(12), maxWidth: 620
    }}>
      <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(語.row_word)}{tx(SHEET_ROWS_FIRST_HEAD)}</div>
      <div style={{ ...小, marginBottom: rem(8) }}>
        {tx(語.col_word)}{tx(SHEET_ROWS_FIRST_NOTE)}
      </div>
      <div style={{ display: "flex", gap: rem(8), flexWrap: "wrap" }}>
        <input value={名} onChange={(e) => set名(e.target.value)}
          placeholder={tx(語.row_word) + tx("の 名前") + "　" + tx("れい：1幕 1場")}
          style={{
            flex: 1, minWidth: 150, minHeight: 44, borderRadius: 10,
            padding: `0 ${rem(10)}`, border: `1px solid ${C.line}`,
            background: C.paper, color: C.ink, fontFamily: FONT_STACK, ...TYPE.li
          }} />
        <button type="button" onClick={場面を足す} disabled={busy}
          style={{
            minHeight: 44, padding: `0 ${rem(16)}`, borderRadius: 999, border: "none",
            background: C.curtain, color: C.onCurtain, fontFamily: FONT_STACK,
            fontWeight: 700, ...TYPE.li
          }}>＋ {tx(語.row_word)}{tx("を 足す")}</button>
      </div>
      {rows.length > 0 ? (
        <div style={{ ...小, marginTop: rem(8) }}>
          {tx(SHEET_NOW)} {rows.length}{tx("つ")}：
          {rows.slice(0, 6).map((r) => rowLabel(r)).join("・")}
          {rows.length > 6 ? tx(" ほか") : ""}
        </div>
      ) : null}
    </div>
  );

  // ★★★役が まだ でも、★場面は 作れます（★直し ②）
  if (slots.length === 0) {
    return (
      <div>
        <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(8)}` }}>{tx(語.tbl_word)}</h2>
        <div style={{
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
          padding: `${rem(22)} ${rem(12)}`, textAlign: "center"
        }}>
          <div style={{ ...TYPE.li, color: C.ink }}>
            {tx("先に ")}{tx(語.cast_word)}{tx(SHEET_NEED_CAST)}
          </div>
          <div style={{ ...小, marginTop: rem(4) }}>
            {tx(語.col_word)}{tx(SHEET_NEED_CAST_SUB)}
          </div>
        </div>
        {onGoCast ? (
          <button type="button" onClick={onGoCast}
            style={{
              minHeight: 44, padding: `0 ${rem(16)}`, borderRadius: 13, marginTop: rem(10),
              border: "none", background: C.curtain, color: C.onCurtain,
              fontFamily: FONT_STACK, fontWeight: 700, ...TYPE.li
            }}>{tx(語.cast_word)}{tx("を 決める")}</button>
        ) : null}
        {直せる ? 場面だけ先に : null}
        {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}
      </div>
    );
  }

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(6)}` }}>{tx(語.tbl_word)}</h2>

      {直せる ? (
        <button type="button" onClick={() => set編((v) => !v)}
          style={{
            minHeight: 44, padding: `0 ${rem(13)}`, borderRadius: 999, marginBottom: rem(8),
            border: `1px solid ${編 ? C.curtain : C.line}`,
            background: 編 ? C.curtain : C.card, color: 編 ? C.onCurtain : C.inkSoft,
            fontFamily: FONT_STACK, ...TYPE.li
          }}>{編 ? tx(SHEET_EDIT_OFF) : tx(SHEET_EDIT_ON)}</button>
      ) : null}

      <div style={{ ...小, marginBottom: rem(8) }}>
        {tx(語.row_word)} × {tx(語.col_word)}　／　{tx(SHEET_IS_TRUTH)}
      </div>

      <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", ...TYPE.li }}>
          <thead>
            <tr>
              <th style={{ ...マス, color: C.inkSoft, fontWeight: 500 }}>{tx(語.row_word)}</th>
              <th style={{ ...マス, color: C.inkSoft, fontWeight: 500 }}>{tx("分")}</th>
              {表.slots.map((s) => (
                <th key={s.id} style={{ ...マス, color: C.inkSoft, fontWeight: 500, textAlign: "center" }}>
                  {s.label}
                  <div style={{ ...小, fontWeight: 400 }}>{s.group_kind || ""}</div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {表.rows.map((r) => (
              <tr key={r.id}>
                <td style={マス}>{rowLabel(r)}</td>
                <td style={{ ...マス, padding: 0 }}>
                  <input type="text" inputMode="numeric" defaultValue={r.minutes == null ? "" : String(r.minutes)}
                    disabled={!直せる || busy} onBlur={(e) => 分を書く(r.id, e.target.value)}
                    style={{
                      width: 64, minHeight: 44, border: "none", background: "transparent",
                      color: C.ink, fontFamily: FONT_STACK, padding: `0 ${rem(8)}`, ...TYPE.li
                    }} />
                </td>
                {表.slots.map((s) => {
                  const on = 表.on(r.id, s.id);
                  return (
                    <td key={s.id} style={{ ...マス, padding: 0, textAlign: "center" }}>
                      <button type="button" disabled={!編 || busy}
                        onClick={() => 印をつける(r.id, s.id, on)}
                        style={{
                          width: "100%", minHeight: 44, border: "none", background: "transparent",
                          // ★★`C.line` は **枠**の 色 です。★字に 使いません（★token-roles）。
                          //   ★見本は `var(--line)` で 薄い「・」を 出して います。
                          //   ★★字の 色は 字の 色から 選びます ── ★読めない 方が 出ます。
                          color: on ? C.ink : C.inkSoft, fontFamily: FONT_STACK,
                          cursor: 編 ? "pointer" : "default", ...TYPE.li
                        }}>{on ? "●" : (編 ? "・" : "")}</button>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...小, marginTop: rem(6) }}>
        {tx("ぜんぶで")} {totalMinutes(rows)} {tx("分")}
      </div>

      {直せる ? 場面だけ先に : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。
          ★「色ではなく 列の 中で」は 約束 です ── ★色だけで 分けません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {sheetNotes(語).map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>

      {word ? <p style={{ ...小, marginTop: rem(8) }}>{word}</p> : null}
      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}
    </div>
  );
}
