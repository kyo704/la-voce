"use client";

import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  COLS_KOEN, EDITABLE, isExpired, canEditInfo, canExtend, extendLimit, extendReason,
  INFO_EDIT_NOTE, INFO_LIMIT_HEAD, INFO_LIMIT, INFO_NOT_PAID, INFO_HOW, INFO_HOW_VALUE,
  INFO_EXT, INFO_EXT_DONE, INFO_EXT_YET, INFO_EXT_BUTTON, INFO_EXT_ASK_HEAD,
  INFO_EXT_ASK, INFO_NOTE
} from "@/lib/koenInfo";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★公演の 情報 ── ★見本 `P_koenInfo`
//   ★出どころ 裁定141 ／ 裁定144 ／ design-v36 の 直し ⑤
//     ／ woolsong-2026-09-21_8.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333）
//
//   ★★★design-v36 の 直し ── ★題名・本番の 日・会場が **実際に 入ります**。
//     ★前は 打っても 入りませんでした。★直した ことが 台帳に 残ります。
//
//   ★★期限は 台帳が 決めます。★画面で 日数を 数えません。
//     ★延ばすのも 台帳の `extend_koen` です。★止めるのは あちら、★隠すのが こちら。
//
//   ★★★「見本：期限が 過ぎた ことに する」は 出しません。
//     ★見本を 動かして 見せる ための 札 です。★本物の 期限を 動かす ものでは ありません。
//
//   ★見張り components/tests/koen-info-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };
const 札 = {
  background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
  padding: rem(12), flex: 1, minWidth: 260
};
const 行 = {
  display: "flex", justifyContent: "space-between", alignItems: "center",
  gap: rem(8), padding: `${rem(7)} 0`, borderBottom: `1px solid ${C.line2}`, ...TYPE.li
};

export default function KoenInfo({ supabase, koenId, onChanged }) {
  const [koen, setKoen] = useState(null);
  const [下, set下] = useState({});
  const [ask, setAsk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [word, setWord] = useState("");

  const 読む = useCallback(async () => {
    if (!supabase || !koenId) return;
    try {
      const { data, error: e } = await supabase.from("koen").select(COLS_KOEN).eq("id", koenId).limit(1);
      if (e) throw e;
      const k = (data || [])[0] || null;
      setKoen(k);
      if (k) {
        const d = {};
        EDITABLE.forEach((f) => { d[f.key] = k[f.key] == null ? "" : String(k[f.key]); });
        set下(d);
      }
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase, koenId]);

  useEffect(() => { 読む(); }, [読む]);

  const 書く = useCallback(async (key, v) => {
    if (!supabase || !koen) return;
    if (String(koen[key] == null ? "" : koen[key]) === String(v)) return;
    setBusy(true); setError("");
    try {
      // ★★0行を 見ます。★RLS で 弾かれた 直しは、★誤りに なりません。
      const { data, error: e } = await supabase.from("koen")
        .update({ [key]: v === "" ? null : v }).eq("id", koen.id).select("id");
      if (e) throw e;
      if (!data || data.length === 0) throw new Error(tx("直せませんでした。"));
      await 読む();
      if (onChanged) onChanged();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, koen, 読む, onChanged]);

  const 延ばす = useCallback(async () => {
    if (!supabase || !koen) return;
    const 先 = extendLimit(koen);
    if (!先) return;
    setBusy(true); setError(""); setAsk(false);
    try {
      const { data, error: e } = await supabase.rpc("extend_koen",
        { p_koen: koen.id, p_new_until: 先 });
      if (e) throw e;
      const r = (data || [])[0] || {};
      if (!r.ok) { setError(tx(extendReason(r.reason))); return; }
      setWord(先 + tx("まで 延ばしました"));
      await 読む();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, koen, 読む]);

  if (!koen) return null;
  const 直せる = canEditInfo(koen);
  const 過 = isExpired(koen);

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(8)}` }}>{tx("公演の 情報")}</h2>

      <div style={{ display: "flex", gap: rem(12), alignItems: "flex-start", flexWrap: "wrap" }}>
        <div style={{ ...札, flex: 1.3, minWidth: 290 }}>
          {EDITABLE.map((f) => (
            <div key={f.key} style={{ marginBottom: rem(8) }}>
              <div style={{ ...小, marginBottom: rem(3) }}>{tx(f.label)}</div>
              <input value={下[f.key] || ""} disabled={!直せる || busy}
                onChange={(e) => set下((s) => ({ ...s, [f.key]: e.target.value }))}
                onBlur={(e) => 書く(f.key, e.target.value)}
                style={{
                  width: "100%", minHeight: 44, borderRadius: 10, padding: `0 ${rem(10)}`,
                  border: `1px solid ${C.line}`, background: C.paper, color: C.ink,
                  fontFamily: FONT_STACK, ...TYPE.li
                }} />
            </div>
          ))}
          <div style={小}>{tx(INFO_EDIT_NOTE)}</div>
        </div>

        <div style={札}>
          <div style={{ ...TYPE.h3, marginTop: 0 }}>{tx(INFO_LIMIT_HEAD)}</div>
          <div style={行}>
            <span>{tx(INFO_LIMIT)}</span>
            <span style={{ color: C.ink, fontWeight: 700 }}>
              {koen.valid_until || tx(INFO_NOT_PAID)}
            </span>
          </div>
          <div style={行}>
            <span>{tx(INFO_HOW)}</span><span>{tx(INFO_HOW_VALUE)}</span>
          </div>
          <div style={行}>
            <span>{tx(INFO_EXT)}</span>
            <span>{koen.extended_at ? tx(INFO_EXT_DONE) : tx(INFO_EXT_YET)}</span>
          </div>

          {canExtend(koen) ? (
            ask ? (
              <div style={{
                background: C.band, border: `1px solid ${C.line3}`, borderRadius: 12,
                padding: rem(12), marginTop: rem(10)
              }}>
                <div style={{ ...TYPE.li }}>{tx(INFO_EXT_ASK_HEAD)}</div>
                <div style={{ ...小, marginTop: rem(4) }}>{tx(INFO_EXT_ASK)}</div>
                <div style={{ display: "flex", gap: rem(6), marginTop: rem(8) }}>
                  <button type="button" onClick={延ばす} disabled={busy}
                    style={{
                      minHeight: 44, padding: `0 ${rem(14)}`, borderRadius: 999, border: "none",
                      background: C.curtain, color: C.onCurtain, fontFamily: FONT_STACK,
                      fontWeight: 700, ...TYPE.li
                    }}>{extendLimit(koen)}{tx("まで 延ばす")}</button>
                  <button type="button" onClick={() => setAsk(false)}
                    style={{
                      minHeight: 44, padding: `0 ${rem(14)}`, borderRadius: 999,
                      border: `1px solid ${C.line}`, background: C.card, color: C.inkSoft,
                      fontFamily: FONT_STACK, ...TYPE.li
                    }}>{tx("やめる")}</button>
                </div>
              </div>
            ) : (
              <button type="button" onClick={() => setAsk(true)}
                style={{
                  minHeight: 44, padding: `0 ${rem(14)}`, borderRadius: 13, marginTop: rem(10),
                  border: `1px solid ${C.line}`, background: C.card, color: C.ink,
                  fontFamily: FONT_STACK, ...TYPE.li
                }}>{tx(INFO_EXT_BUTTON)}</button>
            )
          ) : null}
        </div>
      </div>

      {過 ? (
        <p style={{ ...小, marginTop: rem(8) }}>{tx("期限が 過ぎて います。直せません。")}</p>
      ) : null}
      {word ? <p style={{ ...小, marginTop: rem(8) }}>{word}</p> : null}
      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。★1行目・2行目は 約束 です。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {INFO_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
