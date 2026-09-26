// ============================================================================
// ★しらべている こと（★2026-09-25・C群 束2）
//
//   ★見本 `SC['しらべていること']`（★design-v51・裁定197 で 直った あとの もの）。
//
//   ★★★おすすめを 出しません。★並べ替えません。★埋めません。
//     ★★これは 見た目の 話では なく、★約束 です（★裁定197 が 名指し）。
//   ★★時間差の 字は `lib/lagChoice.js` が 持ちます。★並びは `lib/shirabeteiru.js`。
//   ★★★選んだ ものは 台帳に 残りません ── ★しまう 列が ありません。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back, Box, H3, Li } from "@/components/UiV2";
import {
  TITLE, HEAD_LINES, pairHead, ROW_ACTION, LAG_HEAD, lagPills,
  BTN_ADD, FREE_LINE, mayAddPair, NOTE_LINES,
  VOICE_SIDE_LABEL, VOICE_SIDE_FIXED
} from "@/lib/shirabeteiru";

export default function Shirabeteiru({
  pairs, lag, paid, onChangeItem, onPickLag, onAddPair, onBack
}) {
  const 組 = Array.isArray(pairs) ? pairs : [];
  const 札 = lagPills();

  return (
    <div>
      <Back onClick={onBack}>もっと</Back>
      <ScreenHead title={TITLE} />

      <div style={{
        margin: "0 0 11px", padding: "11px 13px", borderRadius: 10,
        background: C.paper, border: `1px solid ${C.line}`
      }}>
        {HEAD_LINES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.8125rem", color: i === 1 ? C.ink : C.inkSoft, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>

      {/* ★★組は ご本人が 作った 順の まま です。★並べ替えません。 */}
      {組.map((p, n) => (
        <div key={n}>
          {/* ★★★小見出し です（★見本は `.sh3`）。★`p` に して いました。
              ★★`p` だと 骨組みの 道具が 註 として 数え、★見本の 題と 合いません
                （★2026-09-26 ── ★①に「題｜組 #」が 出て いました）。
              ★★見た目の 話では なく、★何の 字 かの 話 です。 */}
          <H3>{pairHead(n + 1)}</H3>
          <Box style={{ marginBottom: 11 }}>
            {/* ★★くらしの 側は 選べます。★声の 側は 1つ だけ です。
                ★★★だから 声の 行に「かえる ›」を 出しません ──
                  ★押せない 札を 置きません（★決めは lib/shirabeteiru.js）。 */}
            <button type="button" onClick={() => onChangeItem && onChangeItem(n, 0)}
              style={{
                display: "flex", alignItems: "center", justifyContent: "space-between",
                gap: 12, width: "100%", minHeight: 44, padding: "12px 14px",
                border: "none", background: "none", textAlign: "left", cursor: "pointer"
              }}>
              <span style={{ fontSize: "0.875rem", color: C.ink }}>{p.life || ""}</span>
              <span style={{ fontSize: "0.75rem", color: C.inkSoft, whiteSpace: "nowrap" }}>
                {ROW_ACTION}
              </span>
            </button>
            {/* ★★★行は `UiV2` の `Li` です（★2026-09-26）。
                ★★前は ここで 自分で 組んで いました ── ★class を 持たず、
                  ★骨組みの 道具が 1行も 拾えません でした。
                ★★見本の 声の 行は `div.li.plain` です。★押せません。★同じ です。 */}
            <Li last>{VOICE_SIDE_FIXED ? VOICE_SIDE_LABEL : (p.voice || "")}</Li>
          </Box>
        </div>
      ))}

      {/* ★★これも 小見出し です（★見本 `.sh3`）。★`。` を 付けません。 */}
      <H3>{LAG_HEAD}</H3>
      <Box>
        {札.map((l, i) => (
          <button key={l.key} type="button" onClick={() => onPickLag && onPickLag(l.key)}
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              gap: 12, width: "100%", minHeight: 44, padding: "12px 14px",
              border: "none", background: "none", textAlign: "left",
              borderTop: i === 0 ? "none" : `1px solid ${C.line}`, cursor: "pointer"
            }}>
            <span style={{ fontSize: "0.875rem", color: C.ink }}>{l.label}</span>
            {/* ★★選ばれた ものは 枠 です。★色だけに 意味を 持たせません。 */}
            <span style={{
              display: "inline-block", width: 17, height: 17, borderRadius: "50%",
              border: `1.6px solid ${lag === l.key ? C.curtain : C.line}`,
              background: lag === l.key ? C.curtain : "transparent",
              boxShadow: lag === l.key ? `inset 0 0 0 3px ${C.card}` : "none"
            }} />
          </button>
        ))}
      </Box>

      {/* ★★上限に 届いた ときは 押しどころを 出しません。
          ★★★「買ってください」と 書きません。★無料の 上限を 書くだけ です。 */}
      {mayAddPair(組.length, paid) ? (
        <button type="button" onClick={onAddPair}
          style={{
            display: "block", width: "100%", minHeight: 44, marginTop: 11,
            borderRadius: 10, border: `1px solid ${C.line}`, background: C.card,
            color: C.ink, fontSize: "0.9375rem", cursor: "pointer"
          }}>{BTN_ADD}</button>
      ) : null}
      {!paid ? (
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, marginTop: 6 }}>{FREE_LINE}</p>
      ) : null}

      <div style={{ marginTop: 14 }}>
        {NOTE_LINES.map((l, i) => (
          <p key={i} style={{
            fontSize: "0.75rem", color: i === 0 ? C.inkSoft : C.ink, lineHeight: 1.9
          }}>{l}</p>
        ))}
      </div>
    </div>
  );
}
