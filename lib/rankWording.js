// ============================================================================
// 「この期間で何番目か」の言い方
//
//   ★2026-09-01 まで、こう書いていました。
//
//     この14日間で【12番目に良い日】です（上から86%）
//                  ↑ 強調
//
//   position は「上から数えた順位」なので、14日中12位は★悪い日です。
//   それを「良い日」と呼び、しかも太字にしていました。
//   ★悪い日ほど、褒められているように見える形になっていました。
//
//   ★直し方：どちら側にいるかで、数える向きを変えます。
//     上半分なら「上から◯番目」、下半分なら「低いほうから◯番目」。
//     ★強調は、実際に当てはまる側にだけ付けます。
//
//   ★「良い日」「悪い日」という言葉を使わないこと。
//     順位は順位であって、その日の価値ではありません。
// ============================================================================

/**
 * 順位の言い方を決める。
 *
 * @param {number} position  上から数えた順位（1 = いちばん高い）
 * @param {number} n         期間の日数
 * @returns {{text:string, side:"high"|"low"|"middle", rank:number}}
 *
 * ★rank は、その言い方での順位です。
 *   上半分なら position そのまま、下半分なら下から数え直した数。
 */
export function rankPhrase(position, n) {
  if (typeof position !== "number" || typeof n !== "number" || n < 1) {
    return { text: "", side: "middle", rank: 0 };
  }
  const p = Math.min(Math.max(Math.round(position), 1), n);
  const fromBottom = n - p + 1;

  // ちょうど真ん中は、どちらにも寄せません。
  if (n % 2 === 1 && p === (n + 1) / 2) {
    return { text: `この${n}日のうち、今日はちょうど真ん中です。`, side: "middle", rank: p };
  }
  if (p <= n / 2) {
    return { text: `この${n}日のうち、今日は高いほうから${p}番目です。`, side: "high", rank: p };
  }
  return { text: `この${n}日のうち、今日は低いほうから${fromBottom}番目です。`, side: "low", rank: fromBottom };
}
