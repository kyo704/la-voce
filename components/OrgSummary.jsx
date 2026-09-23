"use client";

import { useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import {
  COLS_STATS, STAT_COLUMNS, cellText, periodLabel, sortedRows,
  SUM_HEAD, SUM_WARN, SUM_SMALL_HEAD, SUM_SMALL_WHY, HIDDEN_MARK,
  SUM_PAPER, SUM_PAPER_WHY, SUM_NOTE
} from "@/lib/orgSummary";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★半年の まとめ ── ★見本 `SC['半年のまとめ']`
//   ★出どころ 裁定183 P3
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//
//   ★★★数だけ です。★体調の ことは 1つも 入りません。
//     ★台帳の `org_monthly_stats` は 5つの 数 しか 持って いません。
//   ★★★5人 未満の 月は「―」です。★`0` と 書きません。
//     ★伏せたのと、★1人も いなかったのは、★ちがいます。
//   ★★★順位も、先生ごとの 比べも、点数も 出しません。
//     ★並べ替える 仕掛けも 作りません ── ★並べ替えは 順位の もと です。
//
//   ★見張り components/tests/org-summary-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };
const マス = { padding: `${rem(7)} ${rem(9)}`, textAlign: "left", ...TYPE.li };

export default function OrgSummary({ supabase, orgId, orgName }) {
  const [rows, setRows] = useState([]);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase || !orgId) return;
    let 生 = true;
    (async () => {
      try {
        const { data, error: e } = await supabase.from("org_monthly_stats")
          .select(COLS_STATS).eq("org_id", orgId).order("ym", { ascending: false }).limit(6);
        if (e) throw e;
        if (生) setRows(data || []);
      } catch (e) { if (生) setError(String((e && e.message) || e)); }
    })();
    return () => { 生 = false; };
  }, [supabase, orgId]);

  const 並 = useMemo(() => sortedRows(rows), [rows]);

  // ★★紙に 出す …… ★見て いる 表を その まま 字に します。
  //   ★★体の ことは もとから 入って いません（★台帳が 5つの 数しか 持ちません）。
  function 紙に出す() {
    const 頭 = STAT_COLUMNS.map((c) => c.label);
    const 字 = [頭.join(",")].concat(
      並.map((r) => STAT_COLUMNS.map((c) => '"' + cellText(r, c.key) + '"').join(","))
    ).join("\n");
    const url = URL.createObjectURL(new Blob(["\ufeff" + 字], { type: "text/csv" }));
    const a = document.createElement("a");
    a.href = url;
    a.download = (orgName || "org") + "_matome.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(6)}` }}>{tx(SUM_HEAD)}</h2>
      <div style={{ ...小, marginBottom: rem(10) }}>
        {orgName || ""}　{periodLabel(並)}
      </div>

      <div style={{
        background: C.band, border: `1px solid ${C.line3}`, borderRadius: 12,
        padding: rem(12), marginBottom: rem(10), ...TYPE.li
      }}>
        {SUM_WARN.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>

      <div style={{ overflowX: "auto", border: `1px solid ${C.line}`, borderRadius: 12 }}>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: C.band2 }}>
              {STAT_COLUMNS.map((c) => (
                <th key={c.key} style={{ ...マス, fontWeight: 500, color: C.inkSoft }}>
                  {tx(c.label)}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {並.map((r) => (
              <tr key={r.ym} style={{ borderTop: `1px solid ${C.line}` }}>
                {STAT_COLUMNS.map((c) => (
                  <td key={c.key} style={マス}>{cellText(r, c.key)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
        padding: rem(12), marginTop: rem(11), display: "flex",
        justifyContent: "space-between", alignItems: "center", gap: rem(8)
      }}>
        <span style={TYPE.li}>
          {tx(SUM_SMALL_HEAD)}
          <span style={{ ...小, display: "block" }}>{tx(SUM_SMALL_WHY)}</span>
        </span>
        <span style={{ color: C.inkSoft }}>{HIDDEN_MARK}</span>
      </div>

      {/* ★★紙に 出す …… ★いまは 字（CSV）で 出します。
          ★印刷は お使いの 道具です。★押せない 札を 置きません。 */}
      <button type="button" onClick={紙に出す}
        style={{
          width: "100%", minHeight: 44, display: "flex", alignItems: "center",
          justifyContent: "space-between", gap: rem(8), textAlign: "left",
          padding: `${rem(10)} ${rem(12)}`, marginTop: rem(11),
          background: C.card, border: `1px solid ${C.line}`, borderRadius: 12,
          color: C.ink, fontFamily: FONT_STACK, ...TYPE.li
        }}>
        <span>
          {tx(SUM_PAPER)}
          <span style={{ ...小, display: "block" }}>{tx(SUM_PAPER_WHY)}</span>
        </span>
        <span style={{ color: C.inkSoft }}>›</span>
      </button>

      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {SUM_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
