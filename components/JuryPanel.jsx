"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  COLS_JUDGE, eventTitle, eventLine, judgesOf, candidates, isEmpty,
  JURY_NOW_HEAD, JURY_NONE, JURY_ADD_HEAD, JURY_ADD, JURY_ALREADY,
  JURY_REMOVE, JURY_ADDED, JURY_REMOVED, JURY_NOTE
} from "@/lib/juryPanel";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★審査員を 足す ── ★見本 `P_addJudge`
//   ★出どころ 裁定165 ／ design-v36 の 直し（★題名が undefined）
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//
//   ★★★採点の 札を 持たない 方は **出しません**。
//     ★灰色で 並べません。★押せない ものは 不具合に 見えます。
//   ★★★止めるのは 台帳 です（`evaluation_judges_insert`）。
//     ★画面が 抜けても、★台帳が 止めます。★2か所で 止めます。
//
//   ★★★外しても、★その方が すでに 入れた 点は 消えません。
//     ★`evaluation_scores` を 触りません。★触る 形も 書きません。
//
//   ★見張り components/tests/jury-panel-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };
const 行 = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  gap: rem(8), padding: `${rem(9)} ${rem(12)}`,
  borderBottom: `1px solid ${C.line2}`, ...TYPE.li
};
const 箱 = {
  background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
  overflow: "hidden", marginTop: rem(6)
};

export default function JuryPanel({ supabase, orgId, event, postLabel }) {
  const [judges, setJudges] = useState([]);
  const [members, setMembers] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [word, setWord] = useState("");

  const eventId = event && event.id;

  const 読む = useCallback(async () => {
    if (!supabase || !orgId || !eventId) return;
    try {
      const [{ data: ju }, { data: me }] = await Promise.all([
        supabase.from("evaluation_judges").select(COLS_JUDGE)
          .eq("org_id", orgId).eq("event_id", eventId),
        supabase.rpc("get_org_member_names", { p_org_id: orgId })
      ]);
      setJudges(ju || []);
      // ★★採点の 札を 持つ 方だけ を 台帳に 尋ねます。★画面で 役職から 当てません。
      const 人 = me || [];
      const 札 = await Promise.all(人.map(async (m) => {
        const { data } = await supabase.rpc("has_can_user",
          { p_user_id: m.user_id, p_org_id: orgId, p_perm: "saiten" });
        return { ...m, can_saiten: data === true };
      }));
      setMembers(札);
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase, orgId, eventId]);

  useEffect(() => { 読む(); }, [読む]);

  const 名 = useMemo(() => {
    const o = {};
    members.forEach((m) => { o[m.user_id] = m.display_name; });
    return o;
  }, [members]);

  const いま = useMemo(() => judgesOf(judges, 名), [judges, 名]);
  const 足せる = useMemo(() => candidates(members, judges), [members, judges]);

  const 組む = useCallback(async (id, name) => {
    if (!supabase) return;
    setBusy(true); setError("");
    try {
      const { data: u } = await supabase.auth.getUser();
      const { error: e } = await supabase.from("evaluation_judges").insert({
        org_id: orgId, event_id: eventId, judge_id: id,
        added_by: u && u.user ? u.user.id : null
      });
      if (e) throw e;
      setWord(name + tx(JURY_ADDED));
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, orgId, eventId, 読む]);

  const 外す = useCallback(async (id, name) => {
    if (!supabase) return;
    setBusy(true); setError("");
    try {
      // ★★★外すのは この 表 だけ です。★点には 触りません。
      const { error: e } = await supabase.from("evaluation_judges")
        .delete().eq("org_id", orgId).eq("event_id", eventId).eq("judge_id", id);
      if (e) throw e;
      setWord(name + tx(JURY_REMOVED));
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, orgId, eventId, 読む]);

  if (!eventId) return null;

  return (
    <div style={{ maxWidth: 720 }}>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(4)}` }}>{tx("審査員を 足す")}</h2>
      {/* ★★★題名が 無い ときは「行事」。★`undefined` と 書きません。 */}
      <div style={{ ...小, marginBottom: rem(10) }}>
        {eventLine(event)}{postLabel ? "　／　" + postLabel : ""}
      </div>

      <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(JURY_NOW_HEAD)}</div>
      <div style={箱}>
        {isEmpty(judges) ? (
          <div style={{ ...行, color: C.inkSoft }}>{tx(JURY_NONE)}</div>
        ) : いま.map((j) => (
          <div key={j.id} style={行}>
            <span>{j.name}</span>
            <button type="button" onClick={() => 外す(j.id, j.name)} disabled={busy}
              style={{
                minHeight: 44, padding: `0 ${rem(12)}`, borderRadius: 999,
                border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
                fontFamily: FONT_STACK, ...TYPE.usual
              }}>{tx(JURY_REMOVE)}</button>
          </div>
        ))}
      </div>

      <div style={{ ...TYPE.h3 }}>{tx(JURY_ADD_HEAD)}</div>
      <div style={箱}>
        {足せる.length === 0 ? (
          <div style={{ ...行, color: C.inkSoft }}>
            {tx("採点の 札を お持ちの 先生が いません。")}
          </div>
        ) : 足せる.map((p) => (
          <div key={p.id} style={行}>
            <span>
              {p.name}
              <span style={{ ...小, display: "block" }}>{p.title}</span>
            </span>
            {p.already ? (
              <span style={小}>{tx(JURY_ALREADY)}</span>
            ) : (
              <button type="button" onClick={() => 組む(p.id, p.name)} disabled={busy}
                style={{
                  minHeight: 44, padding: `0 ${rem(12)}`, borderRadius: 999,
                  border: `1px solid ${C.line}`, background: C.card, color: C.curtain,
                  fontFamily: FONT_STACK, ...TYPE.usual
                }}>{tx(JURY_ADD)}</button>
            )}
          </div>
        ))}
      </div>

      {word ? <p style={{ ...小, marginTop: rem(8) }}>{word}</p> : null}
      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。★3行 とも 約束 です。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {JURY_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
