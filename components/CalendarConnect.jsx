"use client";

import { useCallback, useEffect, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { Back, Card, Li, Note } from "@/components/UiV2";
import {
  mayShowSubscribe, COLS_TOKEN, addressOf,
  SUB_HEAD, SUB_LEAD, SUB_ADDR_LABEL, SUB_COPY, SUB_ROTATE, SUB_COPIED, SUB_ROTATED,
  SUB_MAKING, SUB_NONE, SUB_NONE_HOW, SUB_MAKE, SUB_INCLUDED, SUB_NOTES,
  ONE_HEAD, ONE_LEAD, ONE_PUT, ONE_EMPTY, ONE_NOTES
} from "@/lib/calendarSub";
import { tx } from "@/lib/t";

// ============================================================================
// ★カレンダーに つなぐ（★裁定195・2026-09-24）── ★見本 `SC['カレンダーにつなぐ']`
//
//   ★★★切り替え（`cal_sub`）が 閉じて いる あいだは「1件ずつ」を 出します。
//     ★★両方は 出しません（★見本の 註 …「迷わせません」）。
//
//   ★★★住所は **読む だけ** です。★開く たびに 作り直しません。
//     ★★作り直すのは 押した ときだけ ── ★前の 住所が 毎回 死ぬのを 防ぎます。
//
//   ★★決めは 1つも ここで 作りません ── ★字も 住所の 形も `lib/calendarSub.js`。
//
//   ★見張り components/tests/calendar-connect.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function CalendarConnect({
  supabase, features, items = [], onPutOne, onBack
}) {
  const 開 = mayShowSubscribe(features);
  const [token, setToken] = useState(null);
  const [busy, setBusy] = useState(false);
  const [word, setWord] = useState("");
  const [error, setError] = useState("");

  const 読む = useCallback(async () => {
    if (!supabase || !開) return;
    try {
      // ★★読む だけ です。★作りません（★`calendar_tokens` の 決まりは select 1つ）。
      const { data, error: e } = await supabase
        .from("calendar_tokens").select(COLS_TOKEN).maybeSingle();
      if (e) throw e;
      setToken((data && data.token) || null);
    } catch (e) { setError(String((e && e.message) || e)); }
  }, [supabase, 開]);

  useEffect(() => { 読む(); }, [読む]);

  const 作る = useCallback(async (直し) => {
    if (!supabase) return;
    setBusy(true); setError(""); setWord("");
    try {
      const { data, error: e } = await supabase.rpc("rotate_calendar_token");
      if (e) throw e;
      setToken(data || null);
      setWord(直し ? SUB_ROTATED : "");
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase]);

  const 写す = useCallback(async (addr) => {
    try {
      if (navigator && navigator.clipboard) await navigator.clipboard.writeText(addr);
      setWord(SUB_COPIED);
    } catch { setWord(""); }
  }, []);

  // ==========================================================================
  // ★切り替えが 閉じて いる とき ── ★1件ずつ
  // ==========================================================================
  if (!開) {
    return (
      <div style={{ fontFamily: FONT_STACK }}>
        {onBack ? <Back onClick={onBack}>{tx("公演")}</Back> : null}
        <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(4)}` }}>{tx(ONE_HEAD)}</h2>
        <p style={{ ...小, margin: `0 0 ${rem(10)}` }}>{tx(ONE_LEAD)}</p>

        {items.length === 0 ? (
          <p style={{ ...TYPE.li, color: C.ink }}>{tx(ONE_EMPTY)}</p>
        ) : (
          <Card style={{ padding: 0 }}>
            {items.map((x, i) => (
              <Li key={x.id || i} last={i === items.length - 1} right={tx(ONE_PUT) + " ›"}
                onClick={onPutOne ? () => onPutOne(x) : undefined}>
                {x.title || ""}
                {x.sub ? <span style={{ ...小, display: "block" }}>{x.sub}</span> : null}
              </Li>
            ))}
          </Card>
        )}

        {/* ★★★「もう一度 入れて ください」が 肝 です。
            ★★カレンダーの ほうは ひとりでに 変わりません。 */}
        <Note style={{ marginTop: rem(10) }}>
          {ONE_NOTES.map((t) => (
            <span key={t} style={{ display: "block" }}>{tx(t)}</span>
          ))}
        </Note>
      </div>
    );
  }

  // ==========================================================================
  // ★切り替えが 開いて いる とき ── ★住所を お見せします
  // ==========================================================================
  const addr = addressOf(token, typeof window !== "undefined" ? window.location.origin : "");

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      {onBack ? <Back onClick={onBack}>{tx("公演")}</Back> : null}
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(4)}` }}>{tx(SUB_HEAD)}</h2>
      <p style={{ ...小, margin: `0 0 ${rem(10)}` }}>{tx(SUB_LEAD)}</p>

      <Card>
        <p style={{ ...小, margin: 0 }}>{tx(SUB_ADDR_LABEL)}</p>
        {token ? (
          <>
            <p style={{
              fontFamily: "ui-monospace, monospace", fontSize: rem(13.5),
              margin: `${rem(6)} 0 ${rem(10)}`, wordBreak: "break-all", color: C.ink
            }}>{addr}</p>
            <div style={{ display: "flex", gap: rem(6) }}>
              <button type="button" onClick={() => 写す(addr)}
                style={{
                  flex: 1, minHeight: 44, borderRadius: 10, border: `1px solid ${C.line}`,
                  background: C.card, color: C.ink, fontFamily: FONT_STACK, ...TYPE.li
                }}>{tx(SUB_COPY)}</button>
              <button type="button" disabled={busy} onClick={() => 作る(true)}
                style={{
                  flex: 1, minHeight: 44, borderRadius: 10, border: `1px solid ${C.line}`,
                  background: C.card, color: C.inkSoft, fontFamily: FONT_STACK, ...TYPE.li
                }}>{busy ? tx(SUB_MAKING) : tx(SUB_ROTATE)}</button>
            </div>
          </>
        ) : (
          <>
            <p style={{ ...TYPE.li, color: C.ink, margin: `${rem(6)} 0 ${rem(2)}` }}>
              {tx(SUB_NONE)}
            </p>
            <p style={小}>{tx(SUB_NONE_HOW)}</p>
            <button type="button" disabled={busy} onClick={() => 作る(false)}
              style={{
                width: "100%", minHeight: 48, marginTop: rem(8), borderRadius: 12,
                border: `1px solid ${C.curtain}`, borderBottomWidth: 3,
                background: C.curtain, color: C.onCurtain,
                fontFamily: FONT_STACK, ...TYPE.li
              }}>{busy ? tx(SUB_MAKING) : tx(SUB_MAKE)}</button>
          </>
        )}
        {word ? <p style={{ ...小, margin: `${rem(6)} 0 0` }}>{word}</p> : null}
      </Card>

      <p style={{ ...TYPE.li, color: C.ink, margin: `${rem(12)} 0 ${rem(4)}` }}>
        {tx("入るもの")}
      </p>
      <Card style={{ padding: 0 }}>
        {SUB_INCLUDED.map((t, i) => (
          <Li key={t} last={i === SUB_INCLUDED.length - 1}>{tx(t)}</Li>
        ))}
      </Card>

      {/* ★★5行 とも 確かめて から 書いて います（★わけは lib の 覚え書き）。 */}
      <Note style={{ marginTop: rem(10) }}>
        {SUB_NOTES.map((t) => (
          <span key={t} style={{ display: "block" }}>{tx(t)}</span>
        ))}
      </Note>

      {error ? (
        <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(10) }}>{error}</p>
      ) : null}
    </div>
  );
}
