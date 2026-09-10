"use client";

// ============================================================================
// たな ── 歌ってきたもの（★見本 J04）
//
//   ★出どころ docs/design/pack-final/screens/J04-たな.html
//            docs/design/pack-final/screens/J04-たな.txt
//            docs/design/pack-final/screens/J04-たな.notes.md
//
//   ★注記（★そのまま）
//     「★これは 飾りでは ありません。
//       ★ノートの レパートリーと つながっています。
//       ★出来や 点数は 出しません。★数えるのは 日数と 回数だけ。」
//
//   ★★出さないもの
//     ・出来・点数・順位・評価　★1つも ありません
//     ・「よく歌っていますね」　★褒めるのも 評価です（★lib/repertoireLog.js 冒頭）
//     ・「そろそろ◯◯を」　　　★助言です
//     ・「あと◯日」　　　　　  ★2026-09-10 に 消した ものです
//
//   ★★この一枚は 数えません。★数は lib/repertoireLog.js の shelfRows() が 出します。
//     ★同じ 数え方が、★ノートの レパートリーと ここの 2か所に 分かれない ためです。
// ============================================================================

import { C } from "@/lib/tokens";
import { TYPE, FONT_STACK, RADIUS, rem } from "@/lib/uiKit";
import { Note } from "@/components/UiV2";

export default function SheepShelf({ rows = [] }) {
  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <Note style={{ marginBottom: rem(11) }}>歌ってきたものが、ここに 並びます。</Note>

      {rows.length === 0 ? (
        // ★★まだ 1曲も ない とき。
        //   ★★急かしません。★「書きましょう」と 言いません。
        //     ★何を すれば 並ぶかだけを、★静かに 書きます。
        <div style={{
          background: C.card, border: `1px solid ${C.line}`,
          borderRadius: RADIUS.card, padding: `${rem(11)} ${rem(12)}`,
          ...TYPE.li, color: C.inkSoft
        }}>
          記録に 曲の 名前を 書くと、ここに 並びます。
        </div>
      ) : rows.map((r) => (
        <div key={r.name} style={{
          background: C.card, border: `1px solid ${C.line}`,
          borderRadius: 13, padding: `${rem(11)} ${rem(12)}`, marginBottom: rem(8)
        }}>
          <div style={{ fontSize: rem(14), fontWeight: 700, color: C.ink }}>{r.name}</div>
          {r.sub ? (
            <div style={{ fontSize: rem(10.5), color: C.inkSoft, marginTop: rem(2) }}>{r.sub}</div>
          ) : null}
          <div style={{
            fontSize: rem(10.5), color: C.inkSoft, marginTop: rem(6), lineHeight: 1.7
          }}>
            {r.firstText ? <>{r.firstText}<br /></> : null}
            {r.countText}
          </div>
        </div>
      ))}
    </div>
  );
}
