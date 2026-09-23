"use client";

import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  COLS_SETTINGS, WAYS, wayOf, needsOk, showsNeedsOk,
  WAY_HEAD, WAY_SUB, WAY_OK_HEAD, WAY_OK_ON, WAY_OK_OFF, WAY_OK_HINT, WAY_OK_OFF_HINT
} from "@/lib/monkaWay";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★門下の 決め方（★学校の 設定）── ★裁定186
//   ★★★見本は まだ ありません（2026-09-24）。★字は 裁定の 本文から 取って います。
//
//   ★★★既定は「先生が 招く」。★「学生が 選ぶ」の とき、★承認は 既定で 要ります。
//     ★承認は「拒む」ためでは なく「気づく」ための ものです（★裁定186 §2）。
//
//   ★★書くのは 台帳の `set_monka_way` です。★表を 直に 直しません。
//     ★★記録が 残ります（`ops_audit_log`）。
//
//   ★見張り components/tests/monka-way-screens.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function MonkaWaySetting({ supabase, orgId }) {
  const [row, setRow] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const 読む = useCallback(async () => {
    if (!supabase || !orgId) return;
    try {
      const { data, error: e } = await supabase.from("org_settings")
        .select(COLS_SETTINGS).eq("org_id", orgId).limit(1);
      if (e) throw e;
      setRow((data || [])[0] || null);
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase, orgId]);

  useEffect(() => { 読む(); }, [読む]);

  const 決める = useCallback(async (way, ok) => {
    if (!supabase || !orgId) return;
    setBusy(true); setError("");
    try {
      // ★★書くのは 台帳の 道 だけ。★表を 直に 直しません（★記録が 残ります）。
      const { error: e } = await supabase.rpc("set_monka_way",
        { p_org: orgId, p_way: way, p_needs_ok: ok });
      if (e) throw e;
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, orgId, 読む]);

  const いま = wayOf(row);
  const 承 = needsOk(row);

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(4)}` }}>{tx(WAY_HEAD)}</h2>
      <div style={{ ...小, marginBottom: rem(10) }}>{tx(WAY_SUB)}</div>

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden"
      }}>
        {WAYS.map((w) => (
          <button key={w.key} type="button" disabled={busy}
            onClick={() => 決める(w.key, w.key === "student" ? 承 : true)}
            style={{
              width: "100%", minHeight: 44, display: "flex", alignItems: "center",
              justifyContent: "space-between", gap: rem(8), textAlign: "left",
              padding: `${rem(10)} ${rem(12)}`, background: "transparent",
              border: "none", borderBottom: `1px solid ${C.line2}`,
              color: C.ink, fontFamily: FONT_STACK, ...TYPE.li
            }}>
            <span>
              {tx(w.label)}
              <span style={{ ...小, display: "block" }}>{tx(w.hint)}</span>
            </span>
            <span style={{ color: C.curtain }}>{いま === w.key ? "●" : ""}</span>
          </button>
        ))}
      </div>

      {/* ★★★「学生が 選ぶ」の ときだけ 出します。 */}
      {showsNeedsOk(いま) ? (
        <div style={{
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
          padding: rem(12), marginTop: rem(11)
        }}>
          <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(WAY_OK_HEAD)}</div>
          <div style={{ display: "flex", gap: rem(6), marginTop: rem(6) }}>
            {[[true, WAY_OK_ON], [false, WAY_OK_OFF]].map(([v, ラ]) => (
              <button key={String(v)} type="button" disabled={busy}
                onClick={() => 決める("student", v)}
                style={{
                  minHeight: 44, padding: `0 ${rem(14)}`, borderRadius: 999,
                  border: `1px solid ${承 === v ? C.curtain : C.line}`,
                  background: 承 === v ? C.curtain : C.card,
                  color: 承 === v ? C.onCurtain : C.inkSoft,
                  fontFamily: FONT_STACK, ...TYPE.li
                }}>{tx(ラ)}</button>
            ))}
          </div>
          <div style={{ ...小, marginTop: rem(6) }}>{tx(WAY_OK_HINT)}</div>
          <div style={{ ...小 }}>{tx(WAY_OK_OFF_HINT)}</div>
        </div>
      ) : null}

      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}
    </div>
  );
}
