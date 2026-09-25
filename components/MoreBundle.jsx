// ============================================================================
// ★束の 入口 ── ★7つ とも これ 1つ（★2026-09-25・D群）
//
//   ★見本 `SC['しらべる機能']`〜`SC['アカウントと設定']`（★design-v63）。
//
//   ★★★7つを 7つの 部品に しません。★形が 同じ だから です。
//     ★★分けると、★1つだけ 直る 日が 来ます。
//   ★★中身は `lib/moreBundles.js` が 持ちます。★ここでは 決めません。
//   ★★★行き先の 無い 行は 出ません（`readyAt`）。★押せない 札を 置きません。
//   ★★★右の 字は 呼ぶ 側が 渡します（`rights`）。★書き写しません。
//     ★★中身は 2種 です ── ★数（「216人」「3つ」）と、★値段（「580円／月」）。
//     ★★★値段は `lib/plans.js` から 渡して ください。★字で 書かないこと。
//       ★2026-09-25 に、★同じ 値段が 2か所に あって 片方だけ 古い ことが 起きました。
//     ★★公演の 名（「フィガロの結婚」）も 呼ぶ 側 です。★見本の 見せかけ です。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import {
  BACK_TO, isBundle, groupsOf, headOf, leadOf, notesOf
} from "@/lib/moreBundles";

export default function MoreBundle({ bundle, rights, onGo, onBack }) {
  // ★★知らない 束は 出しません。★勝手な 字を 画面に 通しません。
  if (!isBundle(bundle)) return null;
  const 節 = groupsOf(bundle);
  const 右 = rights || {};

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={headOf(bundle)} />
      {leadOf(bundle) ? (
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "0 0 10px", lineHeight: 1.85 }}>
          {leadOf(bundle)}
        </p>
      ) : null}

      {節.map((g, gi) => (
        <div key={gi}>
          {/* ★★節の 見出し。★行が 1つも 無い 節は 上で 落として います。 */}
          {g.title ? (
            <p style={{
              fontSize: "0.8125rem", color: C.ink, fontWeight: 600,
              margin: gi === 0 ? "0 0 6px" : "14px 0 6px"
            }}>{g.title}</p>
          ) : null}
          <Box style={{ marginBottom: 11 }}>
            {g.rows.map((r, i) => (
              <button key={r.to} type="button" onClick={() => onGo && onGo(r.to)}
                style={{
                  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                  gap: 12, width: "100%", minHeight: 44, padding: "12px 14px",
                  border: "none", background: "none", textAlign: "left",
                  borderTop: i === 0 ? "none" : `1px solid ${C.line}`, cursor: "pointer"
                }}>
                <span style={{ flex: 1 }}>
                  <span style={{ fontSize: "0.875rem", color: C.ink }}>{r.name}</span>
                  {r.sub ? (
                    <span style={{
                      display: "block", fontSize: "0.75rem", color: C.inkSoft,
                      marginTop: 2, lineHeight: 1.8
                    }}>{r.sub}</span>
                  ) : null}
                </span>
                {/* ★★右の 字は 呼ぶ 側から。★無ければ 何も 出しません（★0を 出しません）。 */}
                <span style={{ fontSize: "0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>
                  {右[r.to] ? 右[r.to] + " " : ""}›
                </span>
              </button>
            ))}
          </Box>
        </div>
      ))}

      {notesOf(bundle).length > 0 ? (
        <div style={{ marginTop: 3 }}>
          {notesOf(bundle).map((l, i) => (
            <p key={i} style={{ fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.9 }}>{l}</p>
          ))}
        </div>
      ) : null}
    </div>
  );
}
