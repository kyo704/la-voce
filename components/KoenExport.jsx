"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { COLS_WORDS, wordsOf } from "@/lib/koenSheet";
import {
  exportKinds, hasBodyWords, EXPORT_HEAD, EXPORT_WHY, EXPORT_WHAT, EXPORT_NOTE
} from "@/lib/koenExport";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★書き出す（香盤表）── ★見本 `SC['書き出す（香盤表）']`
//   ★出どころ 裁定178
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//
//   ★★★体調の ことは 1文字も 入りません（★見本の 註）。
//     ★台帳の 関数は どれも 体の 列を 返しません ── ★1つ目の 守り。
//     ★★出す 前に **数えます** ── ★2つ目の 守り（`hasBodyWords`）。
//     ★★★1つでも 見つかったら 出しません。★約束は 字だけでは 守れません。
//
//   ★★出すのは 字（CSV）です。★紙に するのは お使いの 道具です。
//     ★★見本は「PDF ›」と 書いて います。★PDF を 作る 仕組みは まだ ありません ──
//       ★`tools/excluded_by_design.json` に わけを 書いて あります。
//
//   ★見張り components/tests/koen-export-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function KoenExport({ supabase, koen }) {
  const [words, setWords] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [word, setWord] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let 生 = true;
    (async () => {
      const { data } = await supabase.from("koen_kind_words").select(COLS_WORDS);
      if (生) setWords(data || []);
    })();
    return () => { 生 = false; };
  }, [supabase]);

  const 語 = useMemo(() => wordsOf(words, koen && koen.kind), [words, koen]);
  const 種 = useMemo(() => exportKinds(語), [語]);

  const 出す = useCallback(async (k) => {
    if (!supabase || !koen) return;
    setBusy(true); setError(""); setWord("");
    try {
      const { data, error: e } = await supabase.rpc(k.fn, { p_koen: koen.id });
      if (e) throw e;
      const 行 = Array.isArray(data) ? data : [];
      // ★★★出す 前に 数えます。★1つでも 体の ことが あれば 出しません。
      if (hasBodyWords(行)) {
        setError(tx("体の ことが 混ざって いました。出しません。"));
        return;
      }
      if (行.length === 0) { setWord(tx("出す ものが ありません。")); return; }
      const 頭 = Object.keys(行[0]);
      const 字 = [頭.join(",")].concat(行.map((r) =>
        頭.map((h) => '"' + String(r[h] == null ? "" : r[h]).replace(/"/g, '""') + '"').join(","))
      ).join("\n");
      const url = URL.createObjectURL(new Blob(["﻿" + 字], { type: "text/csv" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = (koen.title || "koen") + "_" + k.key + ".csv";
      a.click();
      URL.revokeObjectURL(url);
      setWord(tx("出しました") + "　" + 行.length + tx("行"));
    } catch (e) { setError(String((e && e.message) || e)); }
    finally { setBusy(false); }
  }, [supabase, koen]);

  if (!koen) return null;

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(6)}` }}>{tx(EXPORT_HEAD)}</h2>
      <div style={{ ...小, marginBottom: rem(10) }}>{tx(EXPORT_WHY)}</div>

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden"
      }}>
        <div style={{ ...TYPE.h3, margin: 0, padding: `${rem(10)} ${rem(12)} 0` }}>
          {tx(EXPORT_WHAT)}
        </div>
        {種.map((k) => (
          <button key={k.key} type="button" disabled={busy} onClick={() => 出す(k)}
            style={{
              width: "100%", minHeight: 44, display: "flex", alignItems: "center",
              justifyContent: "space-between", padding: `${rem(10)} ${rem(12)}`,
              background: "transparent", border: "none",
              borderBottom: `1px solid ${C.line2}`, color: C.ink,
              fontFamily: FONT_STACK, textAlign: "left", ...TYPE.li
            }}>
            <span>{tx(k.label)}</span>
            <span style={{ color: C.inkSoft }}>{tx("字で 出す")} ›</span>
          </button>
        ))}
      </div>

      {word ? <p style={{ ...小, marginTop: rem(8) }}>{word}</p> : null}
      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>{tx(EXPORT_NOTE)}</div>
    </div>
  );
}
