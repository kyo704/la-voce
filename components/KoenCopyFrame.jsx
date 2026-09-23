"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { COLS_WORDS, wordsOf } from "@/lib/koenSheet";
import { COLS_KOEN } from "@/lib/koenInfo";
import {
  copyCandidates, COPY_HEAD, COPY_WARN_1, COPY_WARN_2, COPY_WARN_3,
  COPY_WHICH, COPY_EMPTY, COPY_DO, COPY_NOTE
} from "@/lib/koenExport";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★前の 公演から 写す ── ★見本 `SC['前の公演から写す']`
//   ★出どころ 裁定178
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//
//   ★★★写すのは **形だけ** です。
//     ★人・配役・稽古・出欠・呼び出し・期限は 写りません。
//     ★★止めて いるのは 台帳の `koen_copy_frame(p_from, p_to)` です。
//     ★★★この 画面は 写す 中身を 選びません。★選べる ように すると、
//       ★「人も 写す」が いつか 足されます。★選ばせない ことが 守り です。
//
//   ★★前の 公演は そのまま 残ります。★期限も 延びません（★見本の 註）。
//
//   ★見張り components/tests/koen-copy-frame-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function KoenCopyFrame({ supabase, koen, onDone }) {
  const [list, setList] = useState([]);
  const [words, setWords] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [word, setWord] = useState("");

  useEffect(() => {
    if (!supabase || !koen) return;
    let 生 = true;
    (async () => {
      try {
        const [{ data: ks }, { data: kw }] = await Promise.all([
          supabase.from("koen").select(COLS_KOEN).order("opens_on", { ascending: false }).limit(20),
          supabase.from("koen_kind_words").select(COLS_WORDS)
        ]);
        if (!生) return;
        setList(ks || []); setWords(kw || []);
      } catch (e) { if (生) setError(String((e && e.message) || e)); }
    })();
    return () => { 生 = false; };
  }, [supabase, koen]);

  const 語 = useMemo(() => wordsOf(words, koen && koen.kind), [words, koen]);
  const 候 = useMemo(() => copyCandidates(list, koen && koen.id), [list, koen]);

  const 写す = useCallback(async (from) => {
    if (!supabase || !koen) return;
    setBusy(true); setError(""); setWord("");
    try {
      // ★★写す 中身を 渡しません。★形だけ、は 台帳が 決めて います。
      const { data, error: e } = await supabase.rpc("koen_copy_frame",
        { p_from: from.id, p_to: koen.id });
      if (e) throw e;
      setWord(tx("写しました") + "　" + (Number(data) || 0) + tx("件"));
      if (onDone) onDone();
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, koen, onDone]);

  if (!koen) return null;

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(8)}` }}>{tx(COPY_HEAD)}</h2>

      <div style={{
        background: C.band, border: `1px solid ${C.line3}`, borderRadius: 12,
        padding: rem(12), marginBottom: rem(10), ...TYPE.li
      }}>
        {tx(COPY_WARN_1)}{tx(語.row_word)}{tx("と ")}{tx(語.col_word)}{tx(COPY_WARN_2)}
        <br />
        {tx(COPY_WARN_3)}
      </div>

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden"
      }}>
        <div style={{ ...TYPE.h3, margin: 0, padding: `${rem(10)} ${rem(12)} 0` }}>
          {tx(COPY_WHICH)}
        </div>
        {候.length === 0 ? (
          <div style={{ padding: `${rem(12)}`, ...小 }}>{tx(COPY_EMPTY)}</div>
        ) : 候.map((k) => (
          <button key={k.id} type="button" disabled={busy} onClick={() => 写す(k)}
            style={{
              width: "100%", minHeight: 44, display: "flex", alignItems: "center",
              justifyContent: "space-between", padding: `${rem(10)} ${rem(12)}`,
              background: "transparent", border: "none",
              borderBottom: `1px solid ${C.line2}`, color: C.ink,
              fontFamily: FONT_STACK, textAlign: "left", ...TYPE.li
            }}>
            <span>
              {k.title}
              <span style={{ ...小, display: "block" }}>{k.opens_on}</span>
            </span>
            <span style={{ color: C.curtain }}>{tx(COPY_DO)} ›</span>
          </button>
        ))}
      </div>

      {word ? <p style={{ ...小, marginTop: rem(8) }}>{word}</p> : null}
      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {COPY_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
