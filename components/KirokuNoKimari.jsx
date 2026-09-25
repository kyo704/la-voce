// ============================================================================
// ★この画面の きまり ── ★記録の 約束を 出す だけ の 画面（★2026-09-25）
//
//   ★見本 `SC['記録のきまり']`（★design-v49）。
//
//   ★★台帳を 1度も 引きません。★約束の 字を 出す だけ です。
//     ★★だから 読み込み中も ありません。★出ない ことが ありません。
//   ★★字は `lib/kirokuNoKimari.js` が 持ちます。★ここでは 決めません。
//
//   ★★★2026-09-25、★坂本さんの 実機の ご報告 ──
//     「★『?』を 押すと 画面の 一番下に 出る。★レイアウト的に 不自然で、
//       ★表示された ことに 気づきにくい」
//   ★★★わけ ── ★ふつうの `<div>` で 出して いました。
//     ★記録の 画面の **続き** として 下に 積まれて いました。
//   ★★見本は `bk('記録')` で 始まる **1枚の 画面** です ── ★重ねる もの です。
//   ★★★だから `components/OwnedLedger.jsx` と 同じ 形に します ──
//     ★`position: fixed` ／ `inset: 0` ／ `overflowY: auto` ／ `background: C.paper`。
//   ★★★`C.bg` と 書かない こと ── ★そんな 色は ありません。
//     ★2026-09-11 に それで 下の 画面が 透けました（★OwnedLedger の 覚え書き）。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box } from "@/components/UiV2";
import { TITLE, RULE_LINES, PROMISE_LINES, BACK_TO } from "@/lib/kirokuNoKimari";

export default function KirokuNoKimari({ onBack }) {
  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 60, overflowY: "auto",
      background: C.paper,
      padding: "0 15px calc(24px + env(safe-area-inset-bottom))"
    }}>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />

      <Box>
        <div style={{ padding: "12px 14px" }}>
          {RULE_LINES.map((r, i) => (
            <p key={i} style={{
              fontSize: "0.84375rem", color: C.ink, lineHeight: 1.95,
              paddingLeft: r.indent ? "1em" : 0,
              marginBottom: r.gap ? "0.95em" : 0
            }}>
              {r.indent ? "" : "・"}{r.text}
            </p>
          ))}
        </div>
      </Box>

      {/* ★★白い 帯（★見本 `.wl`）。★ここが この 画面の 核 です。
          ★★1文字も 変えないこと。★決めは lib/kirokuNoKimari.js。 */}
      <div style={{
        marginTop: 12, padding: "12px 14px", borderRadius: 10,
        background: C.paper, border: `1px solid ${C.line}`
      }}>
        {PROMISE_LINES.map((l, i) => (
          <p key={i} style={{ fontSize: "0.8125rem", color: C.ink, lineHeight: 1.95 }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
