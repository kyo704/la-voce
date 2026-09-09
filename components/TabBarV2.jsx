"use client";

import { C } from "@/lib/tokens";
import { TYPE, TAB_BAR_HEIGHT, FONT_STACK } from "@/lib/uiKit";

// ============================================================================
// ★下の タブ（★見本 A01〜A09 ／ design.zip・2026-09-10）
//
//   ★出どころ docs/design/pack/screens/A01-きょう生徒.html の .tabs / .tb
//
//   ★★見本の 形
//     <div class="tabs">
//       <div class="tb on"><i></i>きょう</div> …… 5つ
//     .tabs{flex:0 0 56px; border-top:1px solid var(--line); display:flex}
//     .tb  {flex:1; 縦並び; 中央; gap:5px; font-size:10px}
//     .tb i{width:16px; height:2px; ★選ばれた ときだけ 色が つく}
//     .tb.on{色 えんじ・太さ 700}
//
//   ★★なぜ 別に 作るか。
//     ★★門の外（38人）の 帯は、★横に 流れる 丸い札です。★絵の印も 付きます。
//       ★あれは 6つ以上 並ぶ 帯で、★流れる 必要が あります。
//     ★★門の中は 5つ 固定です。★流れる 必要が ありません。
//       ★2026-09-09 の 実機では、★いちばん右の「ひつじ」が 切れていました。
//       ★★5つ しか 無いのに 切れるのは、★流れる 帯を そのまま 使ったからです。
//     ★★同じ 帯に 分かれ道を 足すと、★1つの 部品が 2つの 顔を 持ちます。
//       ★この 製品で 何度も 直してきた 形です。★分けます。
//
//   ★★絵の印を 置きません。
//     ★tokens.md §8「★アイコン ── ★見本は 文字だけで 作っています。
//       ★絵の アイコンは まだ ありません」。★勝手に 決めません。
//
//   ★★高さ 56px は、★押せるところ 44px を 越えています。
//
//   ★見張り components/tests/tab-bar-v2.test.js
// ============================================================================

export default function TabBarV2({ tabs, activeKey, onSelect, label = "画面を えらぶ" }) {
  const list = (tabs || []).filter(Boolean);
  if (list.length === 0) return null;

  return (
    <nav
      aria-label={label}
      style={{
        position: "fixed", left: 0, right: 0, bottom: 0, zIndex: 20,
        display: "flex",
        height: TAB_BAR_HEIGHT,
        // ★★安全域の ぶんは、★高さの 外に 足します。
        //   ★中に 入れると、★指の 当たるところが その ぶん 減ります。
        paddingBottom: "env(safe-area-inset-bottom)",
        boxSizing: "content-box",
        background: C.card,
        borderTop: `1px solid ${C.line}`,
        fontFamily: FONT_STACK
      }}
    >
      {list.map((tab) => {
        const on = tab.key === activeKey;
        return (
          <button
            key={tab.key}
            type="button"
            onClick={() => onSelect(tab.key)}
            aria-current={on ? "page" : undefined}
            style={{
              // ★★5つ 等分。★流れません。★はみ出しません。
              flex: "1 1 0",
              minWidth: 0,
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center", gap: 5,
              background: "transparent", border: "none", padding: 0,
              ...TYPE.tab,
              fontWeight: on ? 700 : TYPE.tab.fontWeight,
              color: on ? C.curtain : C.inkSoft,
              whiteSpace: "nowrap"
            }}
          >
            {/* ★★選ばれた 目印は、★文字の 上の 短い線です。
                ★★選ばれていない ときも、★同じ 場所を 取ります。
                  ★取らないと、★押すたびに 文字が 上下に 跳ねます。 */}
            <span aria-hidden="true" style={{
              display: "block", width: 16, height: 2, borderRadius: 2,
              background: on ? C.curtain : "transparent"
            }} />
            {tab.label}
          </button>
        );
      })}
    </nav>
  );
}
