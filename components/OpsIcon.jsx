"use client";

import { iconBody, ICON_BOX, ICON_STROKE, ICON_SIZE } from "@/lib/opsIcons";

// ============================================================================
// ★しるし 1つ（★裁定 その81 §3-5）
//
//   ★★`fill="none"` ／ `stroke="currentColor"`。★色は 親から 受け取ります。
//     ★★だから ここに 色を 書きません。★1か所も です。
//
//   ★★★選んだ ときに、★しるしを **塗りつぶしません**（★§3-6）。
//     ★★前の 実装は `.tb.on i{background:var(--enji)}` でした。
//       ★★元が 2px の 棒 だった ので 正しかった のです。
//       ★★★そこへ 絵を 入れると、★絵の 後ろが 塗られ、★四角に 見えます。
//     ★★この 部品は 地を 持ちません。★呼ぶ 側も 塗らないで ください。
//
//   ★★`aria-hidden`。★しるしは 飾り です。★名は 隣の 字が 持ちます。
//     ★★裁定 その78 §2-2 ──「★ナビゲーションでは、単語は 千の絵に 値する」
//
//   ★見張り components/tests/ops-icons.test.js
// ============================================================================

export default function OpsIcon({ name, size }) {
  const 中身 = iconBody(name);
  // ★★知らない 名は、★何も 出しません。★空の 四角を 置きません。
  if (!中身) return null;
  const s = size || ICON_SIZE;
  return (
    <svg viewBox={`0 0 ${ICON_BOX} ${ICON_BOX}`} width={s} height={s}
      fill="none" stroke="currentColor" strokeWidth={ICON_STROKE}
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
      dangerouslySetInnerHTML={{ __html: 中身 }} />
  );
}
