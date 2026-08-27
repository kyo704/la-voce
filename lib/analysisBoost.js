// ============================================================================
// 「この分析を強くする」の出し方（記録と分析の順番設計.md §5.3）
//
// ★この画面が、記録項目を増やす本体です。
//   記録画面をいくら整えても、ユーザーは「なぜこれを入れるのか」を知りません。
//   分析の側から、名指しで、理由つきで頼む。それがこのカードの役目です。
//
// ★規則（§5.3）はすべてここが持ちます。画面側で条件を書かないこと。
//   R1 1度に2枚まで。足りない項目を全部並べない
//   R2 必ず「何が良くなるか」を書く。「記録してください」だけは禁止
//   R3 ボタンは記録画面の該当セクションへ直行する（画面側の責任）
//   R4 日数の条件と項目の条件を両方書く（待てば開くことを隠さない）
//   R5 足りない量が最も少なく、効果が最も大きいものを選ぶ
//   R6 一度も使っていない項目は3枚目以降（いきなり新項目を要求しない）
// ============================================================================

export const MAX_BOOST_CARDS = 2;    // R1
export const MAX_DAYS_NEEDED = 10;   // これより遠いものは動機にならないので出さない

// 見込みの改善量（§5.3 の選定ロジック）
export const IMPROVEMENT = {
  unlock: 1.0,     // ロックが開く
  star: 0.6,       // ★が1つ増える
  threshold: 0.4   // 確度係数がしきい値を超える
};

/** score = 見込みの改善量 / 必要な追加記録日数 */
export function scoreCandidate(improvement, daysNeeded) {
  const d = Math.max(1, Number(daysNeeded) || 0);
  return (Number(improvement) || 0) / d;
}

// ---------------------------------------------------------------------------
// R2: 「何が良くなるか」が書かれているか。
// ★「記録してください」「入力してください」だけの文言を出さないための検査。
//   お願いだけして見返りを言わないのは、この画面の趣旨と正反対です。
// ---------------------------------------------------------------------------
const BENEFIT_HINTS = ["なります", "開きます", "分かります", "見られます", "上がります", "強くなります"];
export function statesBenefit(body) {
  const text = String(body || "");
  if (!text) return false;
  return BENEFIT_HINTS.some((h) => text.includes(h));
}

// ---------------------------------------------------------------------------
// R4: 日数の条件と、項目の条件を両方書く。
// ★「あと8日で開きます」だけだと、待つ以外に手が無いように見えます。
//   実際には項目を足せば早く開くのに、それを隠していることになります。
// ---------------------------------------------------------------------------
export function describeUnlockCondition({ daysNeeded, itemLabel, itemDaysNeeded }) {
  const days = Math.max(0, Number(daysNeeded) || 0);
  if (itemLabel && itemDaysNeeded > 0) {
    return `あと${days}日、または ${itemLabel}を${itemDaysNeeded}日記録すると開きます`;
  }
  return `あと${days}日記録すると開きます`;
}

// ---------------------------------------------------------------------------
// R1・R5・R6: 出すものを選ぶ。
//
// candidate: { id, title, body, daysNeeded, improvement, section, neverUsed }
//   neverUsed … その項目を一度も使っていない場合 true（R6 で後ろへ回す）
// ---------------------------------------------------------------------------
export function selectBoostCandidates(candidates) {
  const list = (candidates || [])
    .filter((c) => c && c.daysNeeded > 0 && c.daysNeeded <= MAX_DAYS_NEEDED)
    // ★R2 を満たさないものは出さない。文言が用意できていないなら、黙って出さない。
    .filter((c) => statesBenefit(c.body))
    .map((c) => ({ ...c, score: scoreCandidate(c.improvement, c.daysNeeded) }));

  // R6: 一度も使っていない項目は、使ったことのある項目より必ず後ろ。
  //     スコアが高くても、いきなり新しい項目を要求しない。
  list.sort((a, b) => {
    if (!!a.neverUsed !== !!b.neverUsed) return a.neverUsed ? 1 : -1;
    if (b.score !== a.score) return b.score - a.score;
    // 同点なら、必要日数が少ないほうを先に（届きやすいものから）
    return a.daysNeeded - b.daysNeeded;
  });

  return list.slice(0, MAX_BOOST_CARDS);   // R1
}
