"use client";

import { C } from "@/lib/tokens";
import { TYPE, rem, FONT_STACK } from "@/lib/uiKit";
import { H3, Card, Li, Note, Warn } from "@/components/UiV2";
import {
  SCALES, SCALE_LABELS, SCALE_SAMPLE_PX, SCALE_SAMPLE_LINES,
  SCALE_NOTE, normalizeScale
} from "@/lib/displayPrefs";

// ============================================================================
// ★見やすさ（文字の 大きさ）── ★見本 `stMiyasu`
//
//   ★★決めは lib/displayPrefs.js が 持ちます。★ここでは 決めません。
//   ★★★この 設定は **その 端末 だけ** に かかります。
//     ★★ほかの 方には かかりません。★そこを いちばん 先に 書きます。
//   ★★★画面の 大きさは 変わりません。★中の 字と 押しどころが 大きく なります。
//     ★★その ぶん、★1画面に 入る 量が 減ります。★それも 書きます。
//
//   ★見張り components/tests/ops-miyasu.test.js
// ============================================================================

const 小 = { ...TYPE.mini, color: C.inkSoft, lineHeight: 1.8 };

export default function OpsMiyasu({ scale, onPick }) {
  const いま = normalizeScale(scale);

  return (
    <div style={{ fontFamily: FONT_STACK }}>
      <H3>文字の 大きさ</H3>
      <Warn>
        <span style={{ display: "block" }}>
          この 設定は、<b>あなたの 端末だけ</b>に かかります。ほかの 方には かかりません。
        </span>
        <span style={{ display: "block" }}>
          <b>画面の 大きさは 変わりません。</b>
          中の 字と ボタンが 大きく なり、その ぶん 1画面に 入る 量が 減ります。
        </span>
        <span style={{ display: "block" }}>
          上の 帯の <b>「あ」</b>からも、いつでも 変えられます。
        </span>
      </Warn>

      <Card style={{ padding: 0, maxWidth: 560, marginTop: rem(8) }}>
        {SCALES.map((s, i) => {
          const これ = s === いま;
          const px = SCALE_SAMPLE_PX[s] || 13.5;
          return (
            <Li key={s} last={i === SCALES.length - 1}
              onClick={これ ? undefined : () => onPick && onPick(s)}
              right={これ
                ? <span style={{ color: C.sage }}>✓ いま これです</span>
                : "これに する"}>
              {/* ★★★見本 …… ★その 大きさ そのもので 見せます。
                   ★★名前だけ 並べても、★どれが 良いか 決められません。 */}
              <span style={{ fontSize: rem(px), color: C.ink }}>
                {SCALE_LABELS[s] || s}
              </span>
              <div style={{ fontSize: rem(Math.max(11, px - 2)), color: C.inkSoft }}>
                {SCALE_SAMPLE_LINES[0]}
              </div>
            </Li>
          );
        })}
      </Card>

      <Note>
        {SCALE_NOTE.map((t) => <span key={t} style={{ display: "block" }}>{t}</span>)}
      </Note>
    </div>
  );
}
