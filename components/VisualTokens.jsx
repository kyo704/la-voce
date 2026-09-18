"use client";

import { tokensCss, SCOPE_CLASS } from "@/lib/visualTokens";

// ============================================================================
// ★見た目の 土台を、★画面に 敷く（★裁定 その78・その81・2026-09-18）
//
//   ★★★これ 1枚で、★色・文字の 段・表の 貼り付けが 入ります。
//     ★★裁定 その81 §8 ──「★1〜3が いちばん 効く。★一度 入れると、
//       ★以後の 画面は 何も しなくても 揃います」
//
//   ★★★`:root` に 置きません。★`.wsv` の 中 だけ です。
//     ★★門の 外の 38人の 画面には、★1つも かかりません（★2026-09-09 の お指図）。
//     ★★敷いた 入れ物の 中 だけ で 効きます。
//
//   ★★決めは lib/visualTokens.js が 持ちます。★ここでは 決めません。
//     ★★この 部品は、★その 文字を 置く だけ です。
//
//   ★見張り components/tests/visual-tokens.test.js
// ============================================================================

export default function VisualTokens() {
  // ★★`dangerouslySetInnerHTML` を 使います。
  //   ★★中身は こちらで 組み立てた 文字 です。★外から 来ません。
  //   ★★`<style>{...}` だと、★React が 中の `>` を 逃がして 壊します。
  return <style dangerouslySetInnerHTML={{ __html: tokensCss() }} />;
}

export { SCOPE_CLASS };
