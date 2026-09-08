"use client";

import { TIMING, BUBBLE } from "@/lib/sheepSpeech";

// ============================================================================
// 羊の 吹き出し（2026-09-08 夜）
//
//   ★出どころ woolsong-仕様-羊のしゃべり方・3本に分ける（9月8日）§③
//
//   ★★羊の 頭の 右上から 出します。★しっぽ（三角）を 頭のほうへ 向けます。
//     ★★上の帯では ありません。★羊から 出ていることが 大事です。
//     ★「出どころが 体と つながっていない」というのが、★直しの きっかけでした。
//
//   ★★2種類あります。
//     ★あいづち（②）　20px 太字・3.0秒
//     ★ひとりごと（③）16px 細字・うすく・2.5秒
//
//   ★★同時に 2つ 出しません。★出す側（羊の画面）が 止めます。
//   ★★動きを 減らす設定の方には、★ふわっとを やめます。
//     ★ただし「出しっぱなし」にも しません。★消える時間は 同じです。
//
//   ★見張り components/tests/sheep-speech.test.js
// ============================================================================

export default function SpeechBubble({ text, small = false, leaving = false }) {
  if (!text) return null;
  // ★★2行までに 収めます（★2026-09-08 夜・実機「読みにくい」）。
  //   ★★数は lib が 持ちます。★ここで 決めません。
  //   ★★見張りが、★70文すべてを 2行で 数え直します。
  const sp = small ? BUBBLE.solo : BUBBLE.reply;
  return (
    <div
      aria-live="polite"
      style={{
        position: "absolute",
        // ★★羊の 頭の 右上。★頭の bbox は (228, 71, 795, 598) です。
        //   ★羊の箱に対する 割合で 置きます。★画素で 決め打ちしません。
        // ★★幅を、はっきり 決めます（★2026-09-08 夜・実機「縦書きに 見える」）。
        //
        //   ★★writing-mode は、★1度も 書いていません。
        //     ★縦書きに 見えたのは、★幅が 足りていなかったからです。
        //   ★★吹き出しの 入れ物は、★羊の箱（★部屋の 26％＝100px ほど）です。
        //     ★left:72% だけを 決めて、★幅を 決めていませんでした。
        //     ★★すると 幅は「入れ物の 残り」に 縮みます。
        //       ★100px の 72％ から 右は、★28px しか ありません。
        //       ★★28px では、★1行に 1文字しか 入りません。
        //       ★それが 縦書きに 見えていました。
        //   ★★幅を 数で 決めれば、★入れ物より 広くても かまいません。
        //     ★はみ出したぶんは、★部屋の中に 出ます。
        //   ★左を 50％に 寄せました。★右端にいる羊でも、部屋に 収まりやすくなります。
        left: "50%", bottom: "62%",
        width: sp.maxWidthPx,
        // ★★かぶりもの（60）より 上に 出します。
        zIndex: 100,
        maxWidth: sp.maxWidthPx,
        // ★★横書きです。★縦書きに しません。
        writingMode: "horizontal-tb",
        pointerEvents: "none",
        opacity: leaving ? 0 : (small ? 0.85 : 1),
        transform: leaving ? "translateY(0)" : "translateY(0)",
        transition: `opacity ${leaving ? TIMING.fadeMs : TIMING.riseMs}ms ease-out, transform ${TIMING.riseMs}ms ease-out`,
        animation: leaving ? "none" : `sheepBubbleIn ${TIMING.riseMs}ms ease-out`
      }}>
      <div style={{
        background: "#FCF9F3",
        border: "2px solid #E2D6C4",
        borderRadius: 16,
        padding: small ? `5px ${sp.padXPx}px` : `7px ${sp.padXPx}px`,
        fontSize: sp.fontPx,
        fontWeight: small ? 400 : 700,
        color: small ? "#807466" : "#483A2E",
        lineHeight: 1.5,
        // ★★長い ひと続きでも、★はみ出させません。
        overflowWrap: "anywhere",
        whiteSpace: "pre-wrap"
      }}>
        {text}
      </div>
      {/* ★★しっぽ。★頭のほうへ 向けます（★左下）。 */}
      <div aria-hidden="true" style={{
        position: "absolute", left: 12, bottom: -9,
        width: 0, height: 0,
        borderLeft: "8px solid transparent",
        borderRight: "8px solid transparent",
        borderTop: "10px solid #E2D6C4"
      }} />
      <div aria-hidden="true" style={{
        position: "absolute", left: 14, bottom: -6,
        width: 0, height: 0,
        borderLeft: "6px solid transparent",
        borderRight: "6px solid transparent",
        borderTop: "8px solid #FCF9F3"
      }} />
    </div>
  );
}
