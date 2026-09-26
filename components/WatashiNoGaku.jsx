// ============================================================================
// ★お支払いの こと（★わたしの 出演料・2026-09-26・D群）
//
//   ★見本 `SC['わたしの出演料']`。
//   ★★字と 決めは `lib/watashiNoGaku.js` が 持ちます。★ここでは 決めません。
//
//   ★★★受け取るのは **1行 だけ** です（★`row`）。★一覧を 受け取りません。
//     ★★「ほかの 出演者の 額は 出ません」── ★渡せる 形を 残しません。
//   ★★★税の 式を 1つも 書きません（★約束③）。★額を そのまま 出します。
//   ★★直す 口を 置きません ── ★書けるのは 制作 だけ です（★約束④）。
// ============================================================================
"use client";

import { C } from "@/lib/tokens";
import { ScreenHead, Back } from "@/components/UiV2";
import {
  BACK_TO, TITLE, HEAD_AMOUNT, HEAD_BREAKDOWN, HEAD_HANDED,
  handedWord, amountWord, breakdownOf, subLineOf,
  EMPTY_LINE, EMPTY_HOW, NOTES, NOTES_STRONG
} from "@/lib/watashiNoGaku";

const box = {
  borderRadius: 10, border: `1px solid ${C.line}`, background: C.card, overflow: "hidden"
};
const 行 = (i) => ({
  display: "flex", alignItems: "flex-start", justifyContent: "space-between",
  gap: 12, padding: "11px 13px", borderTop: i === 0 ? "none" : `1px solid ${C.line}`
});

export default function WatashiNoGaku({ row, koenTitle, orgName, onBack }) {
  const 下 = subLineOf(koenTitle, orgName);

  return (
    <div>
      <Back onClick={onBack}>{BACK_TO}</Back>
      <ScreenHead title={TITLE} />
      {下 ? (
        <p style={{ fontSize: "0.75rem", color: C.inkSoft, margin: "-2px 0 10px" }}>{下}</p>
      ) : null}

      {!row ? (
        <div>
          <p style={{ fontSize: "0.9375rem", color: C.ink }}>{EMPTY_LINE}</p>
          <p style={{ fontSize: "0.8125rem", color: C.inkSoft, marginTop: 5 }}>{EMPTY_HOW}</p>
        </div>
      ) : (
        <div style={box}>
          {/* ★★額は そのまま。★引きません。★割りません。 */}
          <div style={行(0)}>
            <span style={{ fontSize: "0.875rem", color: C.inkSoft }}>{HEAD_AMOUNT}</span>
            <span style={{ fontSize: "0.9375rem", color: C.ink, fontWeight: 700 }}>
              {amountWord(row)}
            </span>
          </div>
          {/* ★★内わけは `memo` を そのまま。★組み立てません。★無ければ 出しません。 */}
          {breakdownOf(row) ? (
            <div style={行(1)}>
              <span style={{ fontSize: "0.875rem", color: C.inkSoft }}>{HEAD_BREAKDOWN}</span>
              <span style={{ fontSize: "0.875rem", color: C.ink, textAlign: "right" }}>
                {breakdownOf(row)}
              </span>
            </div>
          ) : null}
          {/* ★★「まだ」を 赤く しません。★催促でも 遅れの 印でも ありません。 */}
          <div style={行(1)}>
            <span style={{ fontSize: "0.875rem", color: C.inkSoft }}>{HEAD_HANDED}</span>
            <span style={{ fontSize: "0.875rem", color: C.ink }}>{handedWord(row)}</span>
          </div>
        </div>
      )}

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
