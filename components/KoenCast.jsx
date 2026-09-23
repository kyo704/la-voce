"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  COLS_SLOT, COLS_CELL, COLS_MEMBER, castRows, isGroupSlot, readPeople,
  canEditKoen, canAddRole, newRole, CAST_HOW, CAST_PICK_NOTE, CAST_EMPTY,
  CAST_ADD_HEAD, CAST_NEXT, CAST_NOTE, CAST_NEED_NAME, CAST_PUT, CAST_FIELDS
} from "@/lib/koenCast";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★配役を 決める ── ★見本 `P_haiyaku`
//   ★出どころ 裁定141 ／ design-v36 の 直し ①④
//     ／ woolsong-2026-09-21_8.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333）
//
//   ★★決めは `lib/koenCast.js` が 持ちます。★ここでは 1つも 決めません。
//
//   ★★★design-v36 の 直し ── ★A・B の マスを **押せる** ように しました。
//     ★押せないと、★名前を 入れる 道が ありません（★見本の 註 …「2026-09-23 に直した」）。
//   ★★★人数は **打ち込み** です（★直し ④）。★札では 37人 を 選べません。
//
//   ★★★体の ことは 1つも 出しません。★受け取る 形も ありません（★裁定141）。
//
//   ★見張り components/tests/koen-cast-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };
const マス = {
  padding: `${rem(8)} ${rem(10)}`, borderBottom: `1px solid ${C.line2}`,
  textAlign: "left", verticalAlign: "top", ...TYPE.li
};

export default function KoenCast({ supabase, koen, onNext }) {
  const [slots, setSlots] = useState([]);
  const [cells, setCells] = useState([]);
  const [members, setMembers] = useState([]);
  const [選, set選] = useState(null);      // ★[slotId, "a"|"b"]
  const [新, set新] = useState({ r: "", v: "", a: "", b: "" });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [word, setWord] = useState("");

  const 直せる = canEditKoen(koen);

  const 読む = useCallback(async () => {
    if (!supabase || !koen) return;
    try {
      const [{ data: sl }, { data: rw }, { data: me }] = await Promise.all([
        supabase.from("koen_slots").select(COLS_SLOT).eq("koen_id", koen.id).order("sort_order"),
        supabase.from("koen_rows").select("id, koen_id").eq("koen_id", koen.id),
        supabase.from("koen_members").select(COLS_MEMBER).eq("koen_id", koen.id)
      ]);
      setSlots(sl || []);
      setMembers(me || []);
      const ids = (rw || []).map((r) => r.id);
      if (ids.length > 0) {
        const { data: ce } = await supabase.from("koen_cells").select(COLS_CELL).in("row_id", ids);
        setCells(ce || []);
      } else {
        setCells([]);
      }
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase, koen]);

  useEffect(() => { 読む(); }, [読む]);

  const 行 = useMemo(() => castRows(slots, cells, members), [slots, cells, members]);
  const 招いた = useMemo(() =>
    members.filter((m) => !m.left_at && !m.is_understudy), [members]);

  // ★★A に 入れる …… ★その 役の マスに 入れます（★場面ごとの 行に）
  const 入れる = useCallback(async (slotId, どこ, memberId) => {
    if (!supabase || !koen) return;
    setBusy(true); setError("");
    try {
      if (どこ === "b") {
        // ★★B …… ★「その 役を 代わる」の 印 です。★別の 列では ありません
        await supabase.from("koen_members")
          .update({ is_understudy: false, covers_slot_id: null })
          .eq("koen_id", koen.id).eq("covers_slot_id", slotId);
        if (memberId) {
          const { error: e } = await supabase.from("koen_members")
            .update({ is_understudy: true, covers_slot_id: slotId }).eq("id", memberId);
          if (e) throw e;
        }
      } else {
        const { data: rw } = await supabase.from("koen_rows")
          .select("id").eq("koen_id", koen.id);
        const ids = (rw || []).map((r) => r.id);
        if (ids.length === 0) throw new Error(tx("先に 場面を 作って ください。"));
        const { error: e } = await supabase.from("koen_cells")
          .upsert(ids.map((rid) => ({ row_id: rid, slot_id: slotId, member_id: memberId || null })),
            { onConflict: "row_id,slot_id" });
        if (e) throw e;
      }
      set選(null); setWord(tx(CAST_PUT));
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, koen, 読む]);

  const 人数を書く = useCallback(async (slotId, v) => {
    if (!supabase || !koen) return;
    const n = readPeople(v);
    setBusy(true); setError("");
    try {
      const { data: rw } = await supabase.from("koen_rows").select("id").eq("koen_id", koen.id);
      const ids = (rw || []).map((r) => r.id);
      if (ids.length === 0) return;
      const { error: e } = await supabase.from("koen_cells")
        .upsert(ids.map((rid) => ({ row_id: rid, slot_id: slotId, people: n })),
          { onConflict: "row_id,slot_id" });
      if (e) throw e;
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, koen, 読む]);

  const 足す = useCallback(async () => {
    if (!supabase || !koen) return;
    if (!canAddRole(新.r)) { setWord(tx(CAST_NEED_NAME)); return; }
    setBusy(true); setError("");
    try {
      const { error: e } = await supabase.from("koen_slots")
        .insert({ koen_id: koen.id, ...newRole(新.r, 新.v, slots.length + 1) });
      if (e) throw e;
      set新({ r: "", v: "", a: "", b: "" });
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, koen, 新, slots.length, 読む]);

  const 外す = useCallback(async (slotId) => {
    if (!supabase) return;
    setBusy(true); setError("");
    try {
      const { error: e } = await supabase.from("koen_slots").delete().eq("id", slotId);
      if (e) throw e;
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, 読む]);

  if (!koen) return null;

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(8)}` }}>{tx("配役を 決める")}</h2>

      <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse", ...TYPE.li }}>
          <thead>
            <tr>
              {["役", "声", "A", "B", ""].map((h, i) => (
                <th key={i} style={{ ...マス, color: C.inkSoft, fontWeight: 500 }}>
                  {h ? tx(h) : ""}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {行.length === 0 ? (
              <tr><td colSpan={5} style={{ ...マス, textAlign: "center", color: C.inkSoft }}>
                {tx(CAST_EMPTY)}
              </td></tr>
            ) : 行.map((x) => (
              <tr key={x.slot.id}>
                <td style={マス}>{x.slot.label}</td>
                <td style={マス}>{x.slot.group_kind || "—"}</td>
                {["a", "b"].map((どこ) => (
                  <td key={どこ} style={{ ...マス, padding: 0 }}>
                    <button type="button" disabled={!直せる || busy}
                      onClick={() => set選([x.slot.id, どこ])}
                      style={{
                        width: "100%", minHeight: 44, textAlign: "left",
                        padding: `${rem(8)} ${rem(10)}`, border: "none",
                        background: 選 && 選[0] === x.slot.id && 選[1] === どこ ? C.band2 : "transparent",
                        color: x[どこ] ? C.ink : C.inkSoft, fontFamily: FONT_STACK, ...TYPE.li
                      }}>
                      {x[どこ] ? x[どこ].name : (どこ === "a" ? tx("まだ") : "—")}
                    </button>
                  </td>
                ))}
                <td style={マス}>
                  {直せる ? (
                    <button type="button" onClick={() => 外す(x.slot.id)} disabled={busy}
                      style={{
                        minHeight: 44, padding: `0 ${rem(11)}`, borderRadius: 999,
                        border: `1px solid ${C.line}`, background: C.card,
                        color: C.inkSoft, fontFamily: FONT_STACK, ...TYPE.usual
                      }}>{tx("外す")}</button>
                  ) : null}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{ ...小, marginTop: rem(6) }}>{tx(CAST_HOW)}</div>

      {/* ★★人数を 打ち込む 欄 …… ★合唱の ような 役 だけ（★直し ④） */}
      {行.filter((x) => isGroupSlot(x.slot)).map((x) => (
        <div key={x.slot.id} style={{
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
          padding: rem(12), marginTop: rem(10), display: "flex",
          alignItems: "center", gap: rem(8), flexWrap: "wrap"
        }}>
          <span style={TYPE.li}>{x.slot.label}　{tx("何人")}</span>
          <input type="text" inputMode="numeric" defaultValue={x.people == null ? "" : String(x.people)}
            disabled={!直せる || busy}
            onBlur={(e) => 人数を書く(x.slot.id, e.target.value)}
            style={{
              minHeight: 44, width: 120, borderRadius: 10, padding: `0 ${rem(10)}`,
              border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
              fontFamily: FONT_STACK, ...TYPE.li
            }} />
          <span style={小}>{tx("打ち込んで ください")}</span>
        </div>
      ))}

      {選 && 直せる ? (
        <div style={{
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
          padding: rem(12), marginTop: rem(10)
        }}>
          <div style={{ ...TYPE.h3, marginTop: 0 }}>
            {(行.find((x) => x.slot.id === 選[0]) || { slot: {} }).slot.label}
            （{選[1] === "a" ? "A" : "B"}）{tx("に 入れる 方")}
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: rem(6), marginTop: rem(6) }}>
            {招いた.map((m) => (
              <button key={m.id} type="button" disabled={busy}
                onClick={() => 入れる(選[0], 選[1], m.id)}
                style={{
                  minHeight: 44, padding: `0 ${rem(12)}`, borderRadius: 999,
                  border: `1px solid ${C.line}`, background: C.card, color: C.ink,
                  fontFamily: FONT_STACK, ...TYPE.usual
                }}>{m.name_at}</button>
            ))}
            <button type="button" disabled={busy} onClick={() => 入れる(選[0], 選[1], null)}
              style={{
                minHeight: 44, padding: `0 ${rem(12)}`, borderRadius: 999,
                border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
                fontFamily: FONT_STACK, ...TYPE.usual
              }}>{tx("空ける")}</button>
            <button type="button" onClick={() => set選(null)}
              style={{
                minHeight: 44, padding: `0 ${rem(12)}`, borderRadius: 999,
                border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
                fontFamily: FONT_STACK, ...TYPE.usual
              }}>{tx("やめる")}</button>
          </div>
          <div style={{ ...小, marginTop: rem(6) }}>{tx(CAST_PICK_NOTE)}</div>
        </div>
      ) : null}

      {直せる ? (
        <div style={{
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
          padding: rem(12), marginTop: rem(12)
        }}>
          <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(CAST_ADD_HEAD)}</div>
          <div style={{ display: "flex", gap: rem(8), flexWrap: "wrap", marginTop: rem(6) }}>
            {CAST_FIELDS.map((f) => (
              <input key={f.key} value={新[f.key]}
                onChange={(e) => set新((s) => ({ ...s, [f.key]: e.target.value }))}
                placeholder={tx(f.label) + (f.example ? "　" + tx(f.example) : "")}
                style={{
                  flex: 1, minWidth: 140, minHeight: 44, borderRadius: 10,
                  padding: `0 ${rem(10)}`, border: `1px solid ${C.line}`,
                  background: C.paper, color: C.ink, fontFamily: FONT_STACK, ...TYPE.li
                }} />
            ))}
            <button type="button" onClick={足す} disabled={busy}
              style={{
                minHeight: 44, padding: `0 ${rem(16)}`, borderRadius: 999,
                border: "none", background: C.curtain, color: C.onCurtain,
                fontFamily: FONT_STACK, fontWeight: 700, ...TYPE.li
              }}>{tx("足す")}</button>
          </div>
        </div>
      ) : null}

      {word ? <p style={{ ...小, marginTop: rem(8) }}>{word}</p> : null}
      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {onNext ? (
        <div style={{ marginTop: rem(12) }}>
          <button type="button" onClick={onNext}
            style={{
              minHeight: 44, padding: `0 ${rem(16)}`, borderRadius: 13,
              border: "none", background: C.curtain, color: C.onCurtain,
              fontFamily: FONT_STACK, fontWeight: 700, ...TYPE.li
            }}>{tx(CAST_NEXT)}</button>
        </div>
      ) : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {CAST_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
