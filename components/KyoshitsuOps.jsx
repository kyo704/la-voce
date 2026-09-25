// ============================================================================
// ★この 教室の 運営 ── ★入口の 1枚（★2026-09-25・design-v76）
//
//   ★見本 `SC['教室の運営']`。
//   ★★字と 決めは `lib/kyoshitsuOps.js` が 持ちます。★ここでは 決めません。
//
//   ★★★`entries` を 1度も 引きません。★健康の 値を 1つも 受け取りません。
//     ★下の 2行目が その 約束 です。
//   ★★右の 字（「216人」「10役職」）は 呼ぶ 側が 渡します。★書き写しません。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box, Li } from "@/components/UiV2";
import {
  BACK_TO, titleOf, subLineOf, rowsOf, NOTES, NOTES_STRONG
} from "@/lib/kyoshitsuOps";

export default function KyoshitsuOps({
  orgName, postName, myName, perms, rights, canGo, onGo, onBack
}) {
  const 行 = rowsOf({ perms, canGo });
  const 右 = rights || {};

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={titleOf(orgName)} />
      <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "-2px 0 11px", lineHeight: 1.85 }}>
        {subLineOf({ postName, myName, perms })}
      </p>

      <Box>
        {行.map((r, i, all) => (
          <button key={r.to} type="button" onClick={() => onGo && onGo(r.to)}
            style={{
              display: "block", width: "100%", textAlign: "left",
              background: "transparent", border: "none", padding: 0, minHeight: 44
            }}>
            {/* ★★右の 字は 呼ぶ 側から。★無ければ 矢印 だけ です（★0を 出しません）。 */}
            <Li right={右[r.to] ? 右[r.to] + " ›" : "›"} last={i === all.length - 1}>
              {r.name}
              {r.sub ? (
                <span style={{
                  display: "block", fontSize: "0.75rem", color: C.inkSoft, lineHeight: 1.8
                }}>{r.sub}</span>
              ) : null}
            </Li>
          </button>
        ))}
      </Box>

      {/* ★★2行 とも 約束 です。★消さないこと。 */}
      <div style={{ marginTop: 14 }}>
        {NOTES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", lineHeight: 1.9,
            color: NOTES_STRONG.includes(i) ? C.ink : C.inkSoft,
            fontWeight: NOTES_STRONG.includes(i) ? 600 : 400
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
