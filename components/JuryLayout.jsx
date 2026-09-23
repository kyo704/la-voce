"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  COLS_SLOT, MINUTES, GAPS, ROOMS, DEFAULTS, isTime, startAt, endsAround,
  noticeCounts, isMonka, hasClash, placeName, accompanistCount,
  JL_HEAD, JL_HOW_HEAD, JL_START, JL_PER, JL_GAP, JL_ROOM, JL_ORDER, JL_ORDER_NOW,
  JL_END, JL_END2, JL_NOTICE_HEAD, JL_CLASH, JL_MONKA, JL_TIME, JL_WHO,
  JL_ROOM_ACCOMP, JL_MONKA_TAG, JL_MAKE, JL_PAPER, JL_CLASH_TAG, JL_ACCOMP_PRE,
  JL_ACCOMP, JL_JUDGES, JL_ACCOMP_COUNT,
  JL_NOTICE_NOTE, JL_NOTE
} from "@/lib/juryLayout";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★実技試験を 組む ── ★見本 `SC['実技試験を組む']`
//   ★出どころ 裁定183 P5 ／ 裁定165
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//
//   ★★★気づいた ことは **お知らせする だけ** です。
//     ★動かしません。★外しません。★決めるのは 運営 です。
//     ★★だから「重なりを 避けて 組み直す」「門下を 外す」を 作りません。
//
//   ★★★点を 1つも 読みません。★順位・成績で 並べません。
//     ★`evaluation_scores` に 触る 形が ありません。
//
//   ★★並べるのは 台帳（`jury_layout`）です。★時刻を 画面で 数えません。
//
//   ★見張り components/tests/jury-layout-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };
const 札 = {
  background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
  padding: rem(12), flex: 1, minWidth: 260
};
const 行ス = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  gap: rem(8), padding: `${rem(7)} 0`, borderBottom: `1px solid ${C.line2}`, ...TYPE.li
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

export default function JuryLayout({ supabase, event, eventDate }) {
  const [start, setStart] = useState(DEFAULTS.start);
  const [minutes, setMinutes] = useState(DEFAULTS.minutes);
  const [gap, setGap] = useState(DEFAULTS.gap);
  const [rooms, setRooms] = useState(DEFAULTS.rooms);
  const [slots, setSlots] = useState([]);
  const [places, setPlaces] = useState([]);
  const [judges, setJudges] = useState(0);
  const [clash, setClash] = useState([]);
  const [monka, setMonka] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const eventId = event && event.id;

  const 読む = useCallback(async () => {
    if (!supabase || !eventId) return;
    try {
      const [{ data: sl }, { data: cf }, { data: mk }] = await Promise.all([
        supabase.from("jury_slots").select(COLS_SLOT).eq("event_id", eventId).order("ord"),
        supabase.rpc("jury_conflicts", { p_event: eventId }),
        supabase.rpc("jury_monka_flags", { p_event: eventId })
      ]);
      setSlots(sl || []); setClash(cf || []); setMonka(mk || []);
      // ★★部屋は 名で 出します。★番号を 見せても 分かりません。
      const [{ data: pl }, { data: ju }] = await Promise.all([
        supabase.from("org_places").select("id, name"),
        supabase.from("evaluation_judges").select("judge_id").eq("event_id", eventId)
      ]);
      setPlaces(pl || []);
      setJudges((ju || []).length);
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase, eventId]);

  useEffect(() => { 読む(); }, [読む]);

  const 気 = useMemo(() => noticeCounts(clash, monka), [clash, monka]);

  const 組む = useCallback(async () => {
    if (!supabase || !eventId) return;
    const 刻 = startAt(eventDate, start);
    if (!刻) { setError(tx("はじまりの 時こくを 見直して ください。")); return; }
    setBusy(true); setError("");
    try {
      // ★★並べるのは 台帳 です。★時こくを ここで 数えません。
      const { error: e } = await supabase.rpc("jury_layout", {
        p_event: eventId, p_start: 刻, p_minutes: minutes, p_gap: gap, p_rooms: rooms
      });
      if (e) throw e;
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, eventId, eventDate, start, minutes, gap, rooms, 読む]);

  function 紙に出す() {
    const 字 = [["時こく", "受験する方", "部屋", "伴奏"].join(",")]
      .concat(slots.map((s) => [
        String(s.starts_at || "").slice(11, 16), s.student_name_at,
        placeName(places, s.place_id), s.accompanist_name_at || ""
      ].map((v) => '"' + String(v == null ? "" : v) + '"').join(","))).join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + 字], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = "jitsugi.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  if (!eventId) return null;
  const 終 = endsAround(slots);

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(6)}` }}>{tx(JL_HEAD)}</h2>
      <div style={{ ...小, marginBottom: rem(10) }}>
        {(event && event.name) || ""}　{eventDate || ""}　{slots.length}{tx("人")}
        　／　{tx(JL_JUDGES)}{judges}{tx("人")}
        　／　{tx(JL_ROOM)}{rooms}{tx("つ")}
      </div>

      <div style={{ display: "flex", gap: rem(12), alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ ...札, minWidth: 270 }}>
          <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(JL_HOW_HEAD)}</div>

          <div style={{ ...小, marginTop: rem(6) }}>{tx(JL_START)}</div>
          <input value={start} onChange={(e) => setStart(e.target.value)}
            style={{
              width: "100%", minHeight: 44, borderRadius: 10, padding: `0 ${rem(10)}`,
              border: `1px solid ${isTime(start) ? C.line : C.curtain}`,
              background: C.paper, color: C.ink, fontFamily: FONT_STACK, ...TYPE.li
            }} />

          {[[JL_PER, MINUTES, minutes, setMinutes, "分"],
            [JL_GAP, GAPS, gap, setGap, "分"],
            [JL_ROOM, ROOMS, rooms, setRooms, "つ"]].map(([ラ, 並, いま, 置, 単]) => (
            <div key={ラ} style={{ marginTop: rem(9) }}>
              <div style={小}>{tx(ラ)}</div>
              <div style={{ display: "flex", gap: rem(6), flexWrap: "wrap", marginTop: rem(4) }}>
                {並.map((v) => (
                  <選札 key={v} on={いま === v} onClick={() => 置(v)}>{v}{tx(単)}</選札>
                ))}
              </div>
            </div>
          ))}

          <div style={{ marginTop: rem(9) }}>
            <div style={小}>{tx(JL_ORDER)}</div>
            <div style={{ display: "flex", gap: rem(6), marginTop: rem(4) }}>
              <選札 on>{tx(JL_ORDER_NOW)}</選札>
            </div>
          </div>

          {終 ? (
            <div style={{ ...小, marginTop: rem(8) }}>
              {tx(JL_END)}{終}{tx(JL_END2)}（{slots.length}{tx("人")}・{rooms}{tx("部屋")}）
            </div>
          ) : null}

          <button type="button" onClick={組む} disabled={busy}
            style={{
              width: "100%", minHeight: 44, marginTop: rem(10), borderRadius: 13,
              border: "none", background: C.curtain, color: C.onCurtain,
              fontFamily: FONT_STACK, fontWeight: 700, ...TYPE.li
            }}>{tx(JL_MAKE)}</button>
        </div>

        <div style={札}>
          <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(JL_NOTICE_HEAD)}</div>
          <div style={行ス}><span>{tx(JL_CLASH)}</span><span>{気.clash}{tx("人")}</span></div>
          <div style={行ス}><span>{tx(JL_MONKA)}</span><span>{気.monka}{tx("件")}</span></div>
          <div style={行ス}>
            <span>{tx(JL_ACCOMP)}</span>
            <span>{accompanistCount(slots)}{tx(JL_ACCOMP_COUNT)}</span>
          </div>
          {/* ★★★数を 出す だけ です。★動かす 道は ありません。 */}
          <div style={{ ...小, marginTop: rem(8) }}>
            {JL_NOTICE_NOTE.map((l) => (
              <span key={l} style={{ display: "block" }}>{tx(l)}</span>
            ))}
          </div>
        </div>
      </div>

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
        marginTop: rem(11), overflow: "hidden"
      }}>
        <div style={{
          display: "flex", justifyContent: "space-between", gap: rem(8),
          padding: `${rem(9)} ${rem(12)}`, background: C.band2, ...TYPE.li
        }}>
          <span><b>{tx(JL_TIME)}</b>　{tx(JL_WHO)}</span>
          <span>{tx(JL_ROOM_ACCOMP)}</span>
        </div>
        {slots.map((s) => (
          <div key={s.id} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            gap: rem(8), padding: `${rem(9)} ${rem(12)}`,
            borderBottom: `1px solid ${C.line2}`, ...TYPE.li
          }}>
            <span>
              <b>{String(s.starts_at || "").slice(11, 16)}</b>　{s.student_name_at}
              {isMonka(monka, s.id) ? (
                <span style={{
                  marginLeft: rem(6), padding: `${rem(1)} ${rem(7)}`, borderRadius: 999,
                  border: `1px solid ${C.line}`, background: C.band2,
                  color: C.inkSoft, ...TYPE.usual
                }}>{tx(JL_MONKA_TAG)}</span>
              ) : null}
              {hasClash(clash, s.id) ? (
                <span style={{ ...小, marginLeft: rem(6) }}>{tx(JL_CLASH_TAG)}</span>
              ) : null}
              <span style={{ ...小, display: "block" }}>
                {placeName(places, s.place_id)}　／　
                {tx(JL_ACCOMP_PRE)}{s.accompanist_name_at || ""}
              </span>
            </span>
          </div>
        ))}
      </div>

      <button type="button" onClick={紙に出す}
        style={{
          minHeight: 44, padding: `0 ${rem(14)}`, borderRadius: 999, marginTop: rem(11),
          border: `1px solid ${C.line}`, background: C.card, color: C.ink,
          fontFamily: FONT_STACK, ...TYPE.li
        }}>{tx(JL_PAPER)}</button>

      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {JL_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
