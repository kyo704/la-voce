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
import { ScreenHead, Back, Box, Li } from "@/components/UiV2";
import {
  BACK_TO, TITLE, HEAD_AMOUNT, HEAD_BREAKDOWN, HEAD_HANDED,
  handedWord, amountWord, breakdownOf, subLineOf,
  EMPTY_LINE, EMPTY_HOW, NOTES, NOTES_STRONG
} from "@/lib/watashiNoGaku";

// ★★★行は `components/UiV2.jsx` の `Li` を 使います（★2026-09-26）。
//   ★★前は ここで 自分の `行(i)` を 組んで いました。
//     ★★同じ「1行」の 見せ方が 2つ に なって いました（★この 蔵の 繰り返しの 形）。
//   ★★★見比べでも それが 出ました ── ★見本の 行は `div.li.plain` です。
//     ★★こちらの 行は class を 持たず、★骨組みの 道具が 1行も 拾えません でした
//       （★2026-09-26 ── ★3行 とも ①に 出て いました）。

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
        <Box>
          {/* ★★額は そのまま。★引きません。★割りません。 */}
          <Li right={amountWord(row)}>{HEAD_AMOUNT}</Li>
          {/* ★★内わけは `memo` を そのまま。★組み立てません。★無ければ 出しません。 */}
          {breakdownOf(row) ? (
            <Li right={breakdownOf(row)}>{HEAD_BREAKDOWN}</Li>
          ) : null}
          {/* ★★「まだ」を 赤く しません。★催促でも 遅れの 印でも ありません。 */}
          <Li right={handedWord(row)} last>{HEAD_HANDED}</Li>
        </Box>
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
