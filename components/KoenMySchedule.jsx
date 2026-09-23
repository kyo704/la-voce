"use client";

import { useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  scheduleRows, hhmm, MINE_HEAD, MINE_NONE, MINE_PAPER, MINE_PAPER_WHY,
  MINE_MEET, MINE_NOTE
} from "@/lib/myKoenDay";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★公演の 自分の 予定 ── ★見本 `SC['公演の自分の予定']`
//   ★出どころ 裁定178
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-iPhoneで開く用.html（md5 67c56244）
//
//   ★★★出るのは **自分が 呼ばれて いる ところ だけ** です。
//     ★台帳の `my_koen_schedule` が 自分の 分しか 返しません。
//     ★★ほかの 出演者の 予定を 求める 形を 作りません。
//   ★★★体の ことも 出しません。
//
//   ★★取り消された 稽古は 出しません（`canceled`）。
//     ★★★けれど「消えた」と 分かる ように、★数は 変わります ──
//       ★お知らせは 送りません（★催促しない）。
//
//   ★見張り components/tests/koen-day-screens.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function KoenMySchedule({ supabase, koen, myRole }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase) return;
    let 生 = true;
    (async () => {
      try {
        const { data, error: e } = await supabase.rpc("my_koen_schedule",
          { p_koen: koen ? koen.id : null });
        if (e) throw e;
        if (生) setRows(data || []);
      } catch (e) { if (生) setError(String((e && e.message) || e)); }
    })();
    return () => { 生 = false; };
  }, [supabase, koen]);

  const 予 = useMemo(() => scheduleRows(rows, koen && koen.id), [rows, koen]);

  function 紙に出す() {
    const 字 = [["日", "集合", "終わり", "場所", "何"].join(",")]
      .concat(予.map((r) => [r.startsAt, r.callAt, r.dismissAt, r.place, r.kind]
        .map((v) => '"' + String(v == null ? "" : v) + '"').join(",")))
      .join("\n");
    const url = URL.createObjectURL(new Blob(["﻿" + 字], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = ((koen && koen.title) || "koen") + "_watashi.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(6)}` }}>{tx(MINE_HEAD)}</h2>
      <div style={{ ...小, marginBottom: rem(10) }}>
        {(koen && koen.title) || ""}{myRole ? "　" + myRole : ""}
      </div>

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden"
      }}>
        {予.length === 0 ? (
          <div style={{ padding: rem(12), ...小 }}>{tx(MINE_NONE)}</div>
        ) : 予.map((r) => (
          <div key={r.id} style={{
            padding: `${rem(9)} ${rem(12)}`, borderBottom: `1px solid ${C.line2}`, ...TYPE.li
          }}>
            <b>{String(r.startsAt || "").slice(0, 10)}</b>　{r.kind}
            <span style={{ ...小, display: "block" }}>
              {hhmm(String(r.callAt || "").slice(11, 16))}{tx(MINE_MEET)}　／　
              {hhmm(String(r.startsAt || "").slice(11, 16))}〜
              {hhmm(String(r.dismissAt || "").slice(11, 16))}
            </span>
            {r.place ? <span style={{ ...小, display: "block" }}>{r.place}</span> : null}
            {r.rowsLabel ? <span style={{ ...小, display: "block" }}>{r.rowsLabel}</span> : null}
          </div>
        ))}
      </div>

      <button type="button" onClick={紙に出す}
        style={{
          width: "100%", minHeight: 44, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: rem(8), textAlign: "left",
          padding: `${rem(10)} ${rem(12)}`, marginTop: rem(11),
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
          color: C.ink, fontFamily: FONT_STACK, ...TYPE.li
        }}>
        <span>
          {tx(MINE_PAPER)}
          <span style={{ ...小, display: "block" }}>{tx(MINE_PAPER_WHY)}</span>
        </span>
        <span style={{ color: C.inkSoft }}>›</span>
      </button>

      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {MINE_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
