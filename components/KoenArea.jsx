"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { featureOn } from "@/lib/featureOn";
import { COLS_WORDS, wordsOf } from "@/lib/koenSheet";
import { COLS_KOEN, isExpired } from "@/lib/koenInfo";
import { COLS_SLOT, COLS_MEMBER } from "@/lib/koenCast";
import {
  KOEN_KEY, nextSteps, tabs, KOEN_NEXT_HEAD, KOEN_DONE, KOEN_INFO,
  KOEN_UNTIL, KOEN_EXPIRED, KOEN_NONE, KOEN_NOTE
} from "@/lib/koenArea";
import KoenCast from "./KoenCast";
import KoenInvite from "./KoenInvite";
import KoenSheet from "./KoenSheet";
import KoenInfo from "./KoenInfo";
import KoenExport from "./KoenExport";
import KoenCopyFrame from "./KoenCopyFrame";
import KoenPay from "./KoenPay";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★公演の 運営 ── ★見本 `P_koen`
//   ★出どころ 裁定141 ／ 裁定176 ／ 裁定178
//     ／ woolsong-2026-09-21_3.zip ／ 00-動く見本-PC・iPad（運営）.html
//
//   ★★★7つの 画面を ここから 開きます。★作った ものだけ 出します。
//     ★見本の 行き先は 11 ── ★残り 4つは まだ です（`lib/koenArea.js` の 註）。
//     ★★押せない 札を 置きません（★裁定176 §3）。
//
//   ★★★鍵が 閉じて いれば 何も 出しません。★入口ごと 出しません。
//     ★判じるのは `featureOn` **だけ** です（★裁定176 §1）。
//
//   ★★★体の ことを 1つも 読みません（★裁定141）。
//
//   ★見張り components/tests/koen-area.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };
const 行 = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  gap: rem(8), padding: `${rem(10)} ${rem(12)}`,
  borderBottom: `1px solid ${C.line2}`, ...TYPE.li
};

export default function KoenArea({ supabase, koenId, features, onBack }) {
  const 開 = featureOn(features, KOEN_KEY);

  const [koen, setKoen] = useState(null);
  const [words, setWords] = useState(null);
  const [slots, setSlots] = useState([]);
  const [members, setMembers] = useState([]);
  const [rows, setRows] = useState([]);
  const [view, setView] = useState(null);
  const [error, setError] = useState("");

  const 読む = useCallback(async () => {
    if (!開 || !supabase || !koenId) return;
    try {
      const [{ data: k }, { data: kw }, { data: sl }, { data: me }, { data: rw }] =
        await Promise.all([
          supabase.from("koen").select(COLS_KOEN).eq("id", koenId).limit(1),
          supabase.from("koen_kind_words").select(COLS_WORDS),
          supabase.from("koen_slots").select(COLS_SLOT).eq("koen_id", koenId),
          supabase.from("koen_members").select(COLS_MEMBER).eq("koen_id", koenId),
          supabase.from("koen_rows").select("id, koen_id").eq("koen_id", koenId)
        ]);
      setKoen((k || [])[0] || null);
      setWords(kw || []); setSlots(sl || []); setMembers(me || []); setRows(rw || []);
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [開, supabase, koenId]);

  useEffect(() => { 読む(); }, [読む]);

  const 語 = useMemo(() => wordsOf(words, koen && koen.kind), [words, koen]);
  const 次 = useMemo(() => nextSteps({
    words: 語,
    roleCount: slots.length,
    memberCount: members.filter((m) => m && !m.left_at).length,
    rowCount: rows.length
  }), [語, slots, members, rows]);

  // ★★★鍵が 閉じて いれば、★何も 出しません。
  if (!開) return null;
  if (!koen) return null;

  const 戻 = (
    <button type="button" onClick={() => setView(null)}
      style={{
        minHeight: 44, padding: `0 ${rem(11)}`, borderRadius: 999, marginBottom: rem(6),
        border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
        fontFamily: FONT_STACK, ...TYPE.usual
      }}>‹ {koen.title || tx("公演")}</button>
  );

  if (view) {
    const 中 = {
      cast: <KoenCast supabase={supabase} koen={koen} onNext={() => setView("invite")} />,
      invite: <KoenInvite supabase={supabase} koen={koen} onNext={() => setView("sheet")}
                onSeePrice={() => setView("pay")} />,
      pay: <KoenPay supabase={supabase} koen={koen} onBack={() => setView("invite")} />,
      sheet: <KoenSheet supabase={supabase} koen={koen} onGoCast={() => setView("cast")} />,
      info: <KoenInfo supabase={supabase} koenId={koen.id} onChanged={読む} />,
      export: <KoenExport supabase={supabase} koen={koen} />,
      copy: <KoenCopyFrame supabase={supabase} koen={koen} onDone={読む} />
    }[view];
    return <div>{戻}{中 || null}</div>;
  }

  return (
    <div>
      {onBack ? (
        <button type="button" onClick={onBack}
          style={{
            minHeight: 44, padding: `0 ${rem(11)}`, borderRadius: 999, marginBottom: rem(6),
            border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
            fontFamily: FONT_STACK, ...TYPE.usual
          }}>‹ {tx("行事")}</button>
      ) : null}

      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(6)}` }}>{koen.title}</h2>
      <div style={{ ...小, marginBottom: rem(10) }}>
        {koen.opens_on || ""}　{koen.venue || ""}
      </div>

      {/* ★★上の 札 …… ★作った ものだけ */}
      <div style={{ display: "flex", gap: rem(6), flexWrap: "wrap", marginBottom: rem(11) }}>
        {tabs(語).map((t) => (
          <button key={t.key} type="button" onClick={() => setView(t.key)}
            style={{
              minHeight: 44, padding: `0 ${rem(13)}`, borderRadius: 999,
              border: `1px solid ${C.line}`, background: C.card, color: C.ink,
              fontFamily: FONT_STACK, ...TYPE.li
            }}>{tx(t.label)}</button>
        ))}
      </div>

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden"
      }}>
        <div style={{ ...TYPE.h3, margin: 0, padding: `${rem(10)} ${rem(12)} 0` }}>
          {tx(KOEN_NEXT_HEAD)}
        </div>
        {次.map((q) => (
          <button key={q.key} type="button" onClick={() => setView(q.key)}
            style={{
              width: "100%", minHeight: 44, display: "flex", alignItems: "center",
              justifyContent: "space-between", padding: `${rem(10)} ${rem(12)}`,
              background: "transparent", border: "none",
              borderBottom: `1px solid ${C.line2}`, color: C.ink,
              fontFamily: FONT_STACK, textAlign: "left", ...TYPE.li
            }}>
            <span>{tx(q.label)}</span>
            <span style={小}>{q.done ? tx(KOEN_DONE) + " ›" : "›"}</span>
          </button>
        ))}
      </div>

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
        marginTop: rem(11), overflow: "hidden"
      }}>
        <button type="button" onClick={() => setView("info")}
          style={{
            width: "100%", ...行, background: "transparent", border: "none",
            color: C.ink, fontFamily: FONT_STACK, textAlign: "left"
          }}>
          <span>{tx(KOEN_INFO)}</span>
          <span style={小}>
            {koen.valid_until ? koen.valid_until + tx(KOEN_UNTIL) : tx(KOEN_NONE)}
            {isExpired(koen) ? tx(KOEN_EXPIRED) : ""} ›
          </span>
        </button>
      </div>

      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {KOEN_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
