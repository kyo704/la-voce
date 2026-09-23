"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  understudyRows, hasUnderstudy,
  US_HEAD, US_WHY, US_ABSENT, US_CALL, US_NONE, US_CALLED, US_NOTE
} from "@/lib/understudy";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★代役を 立てる ── ★見本 `SC['代役を 立てる']`
//   ★出どころ 裁定178
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//
//   ★★★自動では 呼びません。★押した ときだけ 入ります。
//     ★「おすすめ」も「自動で 立てる」も 作りません。
//     ★★並べ替えません ── ★上に 出た 方が 選ばれ やすく なります。
//
//   ★★★体の 記録を 1つも 読みません。
//     ★「声の 調子」は その日の 判断の 中に ありますが、
//     ★★それは **人が 聞いて** 決める こと です。★仕組みが 当てる ことでは ありません。
//
//   ★見張り components/tests/understudy-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function Understudy({ supabase, koenId, sessionId, onBack }) {
  const [rows, setRows] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [word, setWord] = useState("");

  const 読む = useCallback(async () => {
    if (!supabase || !sessionId) return;
    try {
      const { data, error: e } = await supabase.rpc("koen_understudy_needed",
        { p_session: sessionId });
      if (e) throw e;
      setRows(data || []);
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase, sessionId]);

  useEffect(() => { 読む(); }, [読む]);

  // ★★台帳が 返した 順の まま です。★並べ替えません。
  const 枠 = useMemo(() => understudyRows(rows), [rows]);

  const 呼ぶ = useCallback(async (r) => {
    if (!supabase || !koenId || !hasUnderstudy(r)) return;
    setBusy(true); setError("");
    try {
      const { error: e } = await supabase.from("koen_calls").insert({
        koen_id: koenId, member_id: r.understudyId,
        call_at: new Date().toISOString()
      });
      if (e) throw e;
      setWord(r.understudyName + tx(US_CALLED));
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, koenId, 読む]);

  return (
    <div>
      {onBack ? (
        <button type="button" onClick={onBack}
          style={{
            minHeight: 44, padding: `0 ${rem(11)}`, borderRadius: 999, marginBottom: rem(6),
            border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
            fontFamily: FONT_STACK, ...TYPE.usual
          }}>‹ {tx("公演の出欠")}</button>
      ) : null}
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(6)}` }}>{tx(US_HEAD)}</h2>
      <div style={{ ...小, marginBottom: rem(10) }}>{tx(US_WHY)}</div>

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden"
      }}>
        {枠.length === 0 ? (
          <div style={{ padding: rem(12), ...小 }}>{tx("休みの 方は いません。")}</div>
        ) : 枠.map((r) => (
          hasUnderstudy(r) ? (
            <button key={r.slotId} type="button" disabled={busy} onClick={() => 呼ぶ(r)}
              style={{
                width: "100%", minHeight: 44, display: "flex", alignItems: "center",
                justifyContent: "space-between", gap: rem(8), textAlign: "left",
                padding: `${rem(10)} ${rem(12)}`, background: "transparent",
                border: "none", borderBottom: `1px solid ${C.line2}`,
                color: C.ink, fontFamily: FONT_STACK, ...TYPE.li
              }}>
              <span>
                {r.slotLabel}
                <span style={{ ...小, display: "block" }}>{tx(US_ABSENT)}{r.absentName}</span>
              </span>
              <span style={{ color: C.curtain }}>{r.understudyName}{tx(US_CALL)} ›</span>
            </button>
          ) : (
            <div key={r.slotId} style={{
              display: "flex", justifyContent: "space-between", alignItems: "center",
              gap: rem(8), padding: `${rem(10)} ${rem(12)}`,
              borderBottom: `1px solid ${C.line2}`, ...TYPE.li
            }}>
              <span>
                {r.slotLabel}
                <span style={{ ...小, display: "block" }}>{tx(US_ABSENT)}{r.absentName}</span>
              </span>
              <span style={小}>{tx(US_NONE)}</span>
            </div>
          )
        ))}
      </div>

      {word ? <p style={{ ...小, marginTop: rem(8) }}>{word}</p> : null}
      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {US_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
