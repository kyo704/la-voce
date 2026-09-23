"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  COLS_SETTINGS, studentCanChoose, needsOk, teacherRows, requestReason, requestState,
  askLines, PICK_HEAD, PICK_DONE_HEAD, PICK_PICK, PICK_STUDENTS, PICK_UNIT,
  PICK_ASK_HEAD, PICK_YES, PICK_NO, PICK_WAITING, PICK_WAITING_TAG, PICK_CANCEL,
  PICK_CANCELED, PICK_WAITING_NOTE, PICK_MINE, PICK_DONE_NOTE, PICK_NOTE
} from "@/lib/monkaWay";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★担当の 先生を 選ぶ（★学生）── ★見本 `SC['担当の先生を選ぶ']`
//   ★出どころ 裁定186 ／ sql/68
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-iPhoneで開く用.html（md5 67c56244）
//
//   ★★★4つの 姿が あります（★見本の とおり）──
//     ① 選ぶ ② この 先生に しますか ③ お返事を 待って います ④ 担当の 先生
//
//   ★★★学校が「学生が 選ぶ」に して いる ときだけ 出ます。
//   ★★★並べ替えません。★台帳が 名前の 順で 返します。
//   ★★★空き・人気を 出しません。★人数を そのまま 出す だけ です。
//   ★★★決まった あとは、★ここから 外せません（★外すのは 事務か 先生）。
//     ★待って いる あいだ だけ、★取り消して 選び直せます。
//
//   ★見張り components/tests/monka-way-screens.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };
const 箱 = {
  background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden"
};
const 行 = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  gap: rem(8), padding: `${rem(9)} ${rem(12)}`,
  borderBottom: `1px solid ${C.line2}`, ...TYPE.li
};
const 大 = {
  width: "100%", minHeight: 44, borderRadius: 13, border: "none",
  background: C.curtain, color: C.onCurtain, fontFamily: FONT_STACK,
  fontWeight: 700, marginTop: rem(10), ...TYPE.body
};

export default function MonkaPickTeacher({ supabase, orgId, orgLabel }) {
  const [setting, setSetting] = useState(null);
  const [teachers, setTeachers] = useState([]);
  const [requests, setRequests] = useState([]);
  const [確, set確] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [word, setWord] = useState("");

  const 読む = useCallback(async () => {
    if (!supabase || !orgId) return;
    try {
      const [{ data: st }, { data: tc }, { data: rq }] = await Promise.all([
        supabase.from("org_settings").select(COLS_SETTINGS).eq("org_id", orgId).limit(1),
        supabase.rpc("monka_teachers", { p_org: orgId }),
        supabase.from("monka_requests")
          .select("id, org_id, teacher_id, teacher_name_at, status").eq("org_id", orgId)
      ]);
      setSetting((st || [])[0] || null);
      setTeachers(tc || []);
      setRequests(rq || []);
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase, orgId]);

  useEffect(() => { 読む(); }, [読む]);

  const 一覧 = useMemo(() => teacherRows(teachers), [teachers]);
  const 具合 = useMemo(() => requestState(requests), [requests]);
  const 要 = needsOk(setting);

  const お願い = useCallback(async (t) => {
    if (!supabase || !orgId) return;
    setBusy(true); setError("");
    try {
      const { error: e } = await supabase.rpc("request_monka",
        { p_org: orgId, p_teacher: t.id });
      if (e) throw e;
      set確(null);
      await 読む();
    } catch (e) { setError(tx(requestReason(e))); }
    finally { setBusy(false); }
  }, [supabase, orgId, 読む]);

  const 取り消す = useCallback(async () => {
    if (!supabase || !具合.row) return;
    setBusy(true); setError("");
    try {
      const { error: e } = await supabase.from("monka_requests")
        .update({ status: "withdrawn" }).eq("id", 具合.row.id);
      if (e) throw e;
      setWord(tx(PICK_CANCELED));
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, 具合, 読む]);

  // ★★★学校が そう して いない ときは、★何も 出しません。
  if (!studentCanChoose(setting)) return null;

  const 名 = (id) => (一覧.find((t) => t.id === id) || {}).name
    || (具合.row && 具合.row.teacher_name_at) || "";

  // ★④ 決まった あと
  if (具合.state === "accepted") {
    return (
      <div>
        <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(8)}` }}>{tx(PICK_DONE_HEAD)}</h2>
        <div style={箱}>
          <div style={行}>
            <span>
              <b>{名(具合.row.teacher_id)}</b> {tx("先生")}
              <span style={{ ...小, display: "block" }}>{tx(PICK_MINE)}</span>
            </span>
          </div>
        </div>
        {/* ★★★ここに 外す ところは ありません。 */}
        <div style={{ ...小, marginTop: rem(12) }}>
          {PICK_DONE_NOTE.map((l) => (
            <span key={l} style={{ display: "block" }}>{tx(l)}</span>
          ))}
        </div>
      </div>
    );
  }

  // ★③ 待って いる
  if (具合.state === "waiting") {
    return (
      <div>
        <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(8)}` }}>{tx(PICK_DONE_HEAD)}</h2>
        <div style={箱}>
          <div style={行}>
            <span>
              <b>{名(具合.row.teacher_id)}</b> {tx("先生")}
              <span style={{ ...小, display: "block" }}>{tx(PICK_WAITING)}</span>
            </span>
            <span style={小}>{tx(PICK_WAITING_TAG)}</span>
          </div>
        </div>
        <div style={{ ...箱, marginTop: rem(11) }}>
          <button type="button" onClick={取り消す} disabled={busy}
            style={{
              width: "100%", minHeight: 44, display: "flex", alignItems: "center",
              justifyContent: "space-between", padding: `${rem(9)} ${rem(12)}`,
              background: "transparent", border: "none", color: C.ink,
              fontFamily: FONT_STACK, textAlign: "left", ...TYPE.li
            }}>
            <span>{tx(PICK_CANCEL)}</span><span style={{ color: C.inkSoft }}>›</span>
          </button>
        </div>
        {word ? <p style={{ ...小, marginTop: rem(8) }}>{word}</p> : null}
        <div style={{ ...小, marginTop: rem(12) }}>
          {PICK_WAITING_NOTE.map((l) => (
            <span key={l} style={{ display: "block" }}>{tx(l)}</span>
          ))}
        </div>
      </div>
    );
  }

  // ★② この 先生に しますか
  if (確) {
    return (
      <div>
        <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(8)}` }}>{tx(PICK_ASK_HEAD)}</h2>
        <div style={箱}>
          <div style={行}><span><b>{確.name}</b> {tx("先生")}</span></div>
        </div>
        <div style={{ ...小, marginTop: rem(10) }}>
          {askLines(確.name, 要).map((l) => (
            <span key={l} style={{ display: "block" }}>{tx(l)}</span>
          ))}
        </div>
        <button type="button" onClick={() => お願い(確)} disabled={busy} style={大}>
          {tx(PICK_YES)}
        </button>
        <button type="button" onClick={() => set確(null)}
          style={{
            ...大, background: C.card, color: C.inkSoft,
            border: `1px solid ${C.line}`, fontWeight: 400, marginTop: rem(8)
          }}>{tx(PICK_NO)}</button>
        {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}
      </div>
    );
  }

  // ★① 選ぶ
  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(4)}` }}>{tx(PICK_HEAD)}</h2>
      <div style={{ ...小, marginBottom: rem(10) }}>{orgLabel || ""}</div>

      <div style={箱}>
        {一覧.map((t) => (
          <button key={t.id} type="button" onClick={() => set確(t)} disabled={busy}
            style={{
              width: "100%", minHeight: 44, display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: rem(8), textAlign: "left",
              padding: `${rem(9)} ${rem(12)}`, background: "transparent",
              border: "none", borderBottom: `1px solid ${C.line2}`,
              color: C.ink, fontFamily: FONT_STACK, ...TYPE.li
            }}>
            <span>
              {t.name}
              {/* ★★人数 だけ。★空き・人気は 出しません。 */}
              <span style={{ ...小, display: "block" }}>
                {tx(PICK_STUDENTS)}{t.students}{tx(PICK_UNIT)}
              </span>
            </span>
            <span style={{ color: C.inkSoft }}>{tx(PICK_PICK)} ›</span>
          </button>
        ))}
      </div>

      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {PICK_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
