"use client";

import { useEffect, useMemo, useState } from "react";
import { C } from "@/lib/tokens";
import { TYPE, rem } from "@/lib/uiKit";
import {
  onboardItems, doneCount, isFinished,
  ONBOARD_HEAD, ONBOARD_DONE, ONBOARD_YET, ONBOARD_COUNT, ONBOARD_NOTE
} from "@/lib/orgSummary";
import { tx } from "@/lib/t";

// ============================================================================
// ★★★はじめの 1週間 ── ★見本 `SC['はじめの1週間']`
//   ★出どころ 裁定183 P4
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 0132714e）
//
//   ★★★4つ 終わると **消えます**。★「おめでとう」を 出しません。
//     ★終わった ことを 祝うと、★終わらせる ことが 目当てに なります。
//   ★★★急かしません。★お知らせも 送りません。
//     ★残りの 数を 大きく 出しません。★「あと n 個」と 書きません（★台帳の 決め）。
//   ★★★押せる ところを 作りません。★ここは **見る だけ** です。
//     ★台帳が 数えた ことを 写すだけ で、★この 画面から 印を つけません。
//
//   ★見張り components/tests/org-summary-screen.test.js
// ============================================================================

const 小 = { ...TYPE.usual, color: C.inkSoft, lineHeight: 1.8 };

export default function OrgFirstWeek({ supabase, orgId }) {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!supabase || !orgId) return;
    let 生 = true;
    (async () => {
      try {
        const { data, error: e } = await supabase.rpc("onboarding_state", { p_org: orgId });
        if (e) throw e;
        if (生) setRows(data || []);
      } catch (e) { if (生) setError(String((e && e.message) || e)); }
    })();
    return () => { 生 = false; };
  }, [supabase, orgId]);

  const 項 = useMemo(() => (rows === null ? [] : onboardItems(rows)), [rows]);

  // ★★★4つ 終わったら 出しません。★読み込み中も 出しません。
  if (rows === null) return null;
  if (isFinished(項)) return null;

  return (
    <div>
      <h2 style={{ ...TYPE.title, margin: `${rem(2)} 0 ${rem(6)}` }}>{tx(ONBOARD_HEAD)}</h2>
      <div style={{ ...小, marginBottom: rem(10) }}>
        {doneCount(項)} / {項.length} {tx(ONBOARD_COUNT)}
      </div>

      <div style={{
        background: C.card, border: `1px solid ${C.line}`, borderRadius: 12, overflow: "hidden"
      }}>
        {項.map((x) => (
          <div key={x.key} style={{
            display: "flex", justifyContent: "space-between", alignItems: "center",
            gap: rem(8), padding: `${rem(9)} ${rem(12)}`,
            borderBottom: `1px solid ${C.line2}`, ...TYPE.li
          }}>
            <span>
              {tx(x.label)}
              <span style={{ ...小, display: "block" }}>{tx(x.hint)}</span>
            </span>
            <span style={{ color: x.done ? C.ink : C.inkSoft }}>
              {x.done ? tx(ONBOARD_DONE) : tx(ONBOARD_YET)}
            </span>
          </div>
        ))}
      </div>

      {error ? <p style={{ ...TYPE.li, color: C.curtain, marginTop: rem(8) }}>{error}</p> : null}

      {/* ★★★見本の 但し書き。★1字 も 足しません。 */}
      <div style={{ ...小, marginTop: rem(12) }}>
        {ONBOARD_NOTE.map((l) => (
          <span key={l} style={{ display: "block" }}>{tx(l)}</span>
        ))}
      </div>
    </div>
  );
}
