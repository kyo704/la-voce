"use client";

import { useState, useEffect } from "react";
import { C } from "@/lib/tokens";
import {
  tabsFor, maySeeMoney, mayShowWideTable, WIDE_TABLE_NOTE
} from "@/lib/opsShell";

// ============================================================================
// 運営モード ── 別のシェル（見本⑪ ／ 2026-09-09・第3便）
//
//   ★出どころ docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §3-3
//
//   ★★この画面から、★生徒の健康の記録には たどりつけません。
//     ★★画面そのものが ありません（★§3-3）。
//     ★★出し分けでは ありません。★import して いません。
//       ★出し分けにすると、★条件を 1行 変えるだけで 出てしまいます。
//     ★見張り（ops-shell.test.js）が、★それを 確かめます。
//
//   ★★iPhone でも 使えます（★2026-09-09・坂本さんの お決め）。
//     ★見本⑪は PC・iPad ですが、★同じ6つの タブを iPhone の 幅に 収めます。
//     ★★「パソコン幅のときだけ」という 制限は 設けません。
//     ★★§4-7 の「先生を 横に並べる 一覧」だけが パソコンです。
//       ★これは 日程の 中の 1つの 見せ方の 話です。
//
//   ★★上から2番目に、★いつも この帯を 出します（★§3-3）。
//
//   ★数と 決めは lib/opsShell.js が 持ちます。★ここでは 決めません。
//
//   ★見張り components/tests/ops-shell.test.js
// ============================================================================

const card = { background: C.card, border: `1px solid ${C.line}`, borderRadius: 14, padding: 14 };
const small = { fontSize: "0.6875rem", color: C.inkSoft, lineHeight: 1.8 };

/** ★いまの 画面の 横はば。★§4-7 の 判定に 使います。 */
function useWidth() {
  const [w, setW] = useState(null);
  useEffect(() => {
    if (typeof window === "undefined") return undefined;
    const on = () => setW(window.innerWidth);
    on();
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return w;
}

export default function OpsShell({ orgName, role, onBack, children }) {
  const tabs = tabsFor(role);
  const [tab, setTab] = useState(tabs.length > 0 ? tabs[0].key : null);
  const width = useWidth();

  // ★★入れない役割に、★空のシェルを 出しません。
  //   ★呼ぶ側が 門を かけますが、★ここでも 止めます。★二重に します。
  if (tabs.length === 0) return null;
  const cur = tabs.some((t) => t.key === tab) ? tab : tabs[0].key;

  return (
    <div style={{ minHeight: "100dvh", background: C.paper, display: "flex", flexDirection: "column" }}>
      {/* ★★上の帯。★左上に「もどる」（★§3-3）。★個人のアプリへ 帰れます。 */}
      <div style={{
        background: C.curtain, color: "#FFFDF8", padding: "10px 14px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
        gap: 10, letterSpacing: "0.04em"
      }}>
        <button type="button" onClick={onBack}
          style={{
            background: "transparent", border: "none", color: "#FFFDF8",
            fontSize: "0.8125rem", minHeight: 40, padding: 0, flex: "none"
          }}>‹ もどる</button>
        <span style={{
          fontSize: "0.8125rem", overflow: "hidden", textOverflow: "ellipsis",
          whiteSpace: "nowrap", flex: 1, textAlign: "center"
        }}>{orgName} の運営</span>
        {/* ★役割を 出します。★お金の欄が 出る／出ないの わけが 分かるように。 */}
        <span style={{ fontSize: "0.6875rem", opacity: 0.8, flex: "none" }}>{role}</span>
      </div>

      <div style={{ flex: 1, overflowY: "auto", padding: "12px 14px 16px" }}>
        {cur === "schedule" ? (
          <div className="space-y-3">
            {children}
            {/* ★★§4-7。★先生を 横に並べる 表は パソコンだけ。
                ★★1行だけ 書きます。★責める言葉に しません。
                ★★運営モード 全体を 止めるものでは ありません。
                  ★この行が 出ていても、★日程の ほかの ことは できます。 */}
            {!mayShowWideTable(width) ? (
              <div style={{ ...card, background: C.paper }}>
                <p style={small}>{WIDE_TABLE_NOTE}</p>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="space-y-3">{children}</div>
        )}

        {/* ★★お金は owner だけ（★§1-1）。★admin には 出しません。 */}
        {cur === "settings" && !maySeeMoney(role) ? (
          <div style={card}>
            <p style={small}>お支払いのことは、教室の責任者の方がご覧になれます。</p>
          </div>
        ) : null}
      </div>

      {/* ★★下タブ。★役割で 数が 変わります（★§3-3）。
          ★★iPhone の 幅に 収めます。★6つでも 折り返しません。
            ★字を 小さくし、★はみ出す ぶんは 横に 送ります。 */}
      <div style={{
        display: "flex", borderTop: `1px solid ${C.line}`, background: "#FFF9F1",
        paddingBottom: "env(safe-area-inset-bottom)"
      }}>
        {tabs.map((t) => {
          const on = cur === t.key;
          return (
            <button key={t.key} type="button" onClick={() => setTab(t.key)}
              aria-current={on ? "page" : undefined}
              style={{
                flex: 1, minWidth: 0, minHeight: 56,
                display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", gap: 5, border: "none", background: "transparent",
                // ★★色だけで 示しません。★上の 線でも 示します。
                color: on ? C.curtain : C.inkSoft,
                fontWeight: on ? 700 : 400,
                fontSize: tabs.length >= 6 ? "0.5625rem" : "0.625rem"
              }}>
              <span aria-hidden="true" style={{
                width: 16, height: 2, borderRadius: 2,
                background: on ? C.curtain : "transparent", display: "block"
              }} />
              <span style={{ whiteSpace: "nowrap" }}>{t.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
