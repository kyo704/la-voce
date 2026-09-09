// ============================================================================
// くらべる ── 「いつのことを 調べるか」（2026-09-09・査読 §2）
//
//   ★出どころ docs/opus/woolsong-裁定-分析機能へのFableの査読（9月9日・夜）.md §2
//     「★Fable の指摘は 正しく、★私の穴でした。
//        しらべていること 5つ × 時間差 4種 ＝ ★20回の検定
//        固定順序法は「5つの順番」しか 扱っていませんでした。」
//
//   ★★何を するのか
//     ★項目ごとに「★いつのことを調べるか」を、★1つだけ 選びます。
//     ★★表示は 4種すべて 出します。★判定だけを 絞ります。
//       ★見本⑫「判定に使うのは『前の夜』だけです。
//        　　　　ほかの3つは、見るためのものです。」
//     ★★これで 検定が 20回 → 5回に 減ります（★§2-3）。
//
//   ★★既定を、★一律に しません（★§2-1）。
//     ★項目の 性質で 決めます。★「前日」に そろえません。
//       ★夜の おこない　→ ★前の夜
//       ★昼の おこない　→ ★前の日
//       ★その日の こと　→ ★その日の朝
//     ★★お酒を「その日の朝」で 調べても、★意味が ありません。
//       ★飲むのは 夜だからです。★既定は、★体の道理に 合わせます。
//
//   ★★変えたら、そこから 数え直します（★§2-2）。
//     ★★事前に 決めることに 意味が あります。
//     ★見てから 選び直すと、★いちばん よく見える 組を 選べてしまいます。
//
//   ★見張り components/tests/lag-choice.test.js
// ============================================================================

/**
 * ★時間差 4種（★見本⑫の 並びの まま）。
 *
 *   ★★すべて 表示します。★判定に 使うのは、★このうち 1つだけです。
 */
export const LAGS = Object.freeze([
  { key: "prevNight", label: "前の夜" },
  { key: "prevDay", label: "前の日" },
  { key: "twoDaysAgo", label: "2日まえ" },
  { key: "sameMorning", label: "その日の朝" }
]);

/**
 * ★項目の 性質。★既定の 時間差は、これで 決まります（★§2-1）。
 *
 *   ★night … ★夜の おこない　（★夕食の時刻・お酒・脂・就寝時刻・寝る向き）
 *   ★day　 … ★昼の おこない　（★練習量・話した時間・レッスン数・移動）
 *   ★ambient … ★その日の こと（★湿度・気温）
 */
export const NATURE_DEFAULT = Object.freeze({
  night: "prevNight",
  day: "prevDay",
  ambient: "sameMorning"
});

/**
 * ★しらべられる 項目と、その 性質。
 *
 *   ★★ここが、★「何を 調べているか」の 台帳です。
 *     ★項目を 足すときは、★性質も 一緒に 決めること。
 *     ★決めないまま 足すと、★既定が どれに なるか 分かりません。
 */
export const ITEMS = Object.freeze([
  // ★夜の おこない
  { key: "dinnerToBed", label: "食べ終えてから 寝るまでの間", nature: "night" },
  { key: "bedtime", label: "寝た 時刻", nature: "night" },
  { key: "markFat", label: "脂の多い 食事", nature: "night" },
  { key: "markAlcohol", label: "お酒", nature: "night" },
  { key: "sleepSide", label: "寝るときの 向き", nature: "night" },
  // ★昼の おこない
  { key: "sungMinutes", label: "歌った 時間", nature: "day" },
  { key: "speechMinutes", label: "話した 時間", nature: "day" },
  { key: "lessonCount", label: "レッスンの 数", nature: "day" },
  { key: "travel", label: "移動", nature: "day" },
  // ★その日の こと
  { key: "humidity", label: "湿度", nature: "ambient" },
  { key: "temperature", label: "気温", nature: "ambient" },
  // ★眠りは 昼でも 夜でもなく、★その日の朝に 分かることです
  { key: "sleepHours", label: "寝た 時間の長さ", nature: "day" }
]);

/** ★その項目の 既定の 時間差。★知らない項目は null。 */
export function defaultLagOf(itemKey) {
  const it = ITEMS.find((x) => x.key === itemKey);
  if (!it) return null;
  return NATURE_DEFAULT[it.nature] || null;
}

/**
 * ★判定に 使う 時間差。
 *
 *   @param itemKey ★項目
 *   @param chosen  ★その方が 選んだ 時間差（★選んでいなければ null）
 *
 *   ★★1つだけです。★4つ 全部を 判定に 使いません（★§2）。
 *   ★★知らない 時間差を 選んでいたら、★既定に 戻します。★勝手に 通しません。
 */
export function judgingLagOf(itemKey, chosen) {
  const ok = LAGS.some((l) => l.key === chosen);
  return ok ? chosen : defaultLagOf(itemKey);
}

/**
 * ★その項目で、★いくつ 検定するか。
 *
 *   ★★いつでも 1 です。★これが §2 の 芯です。
 *   ★★見張りが、★この関数が 1 以外を 返さないことを 確かめます。
 */
export function testsPerItem() {
  return 1;
}

/**
 * ★時間差を 変えたら、★そこから 数え直します（★§2-2）。
 *
 *   @returns true なら ★数え直しが 要る
 *
 *   ★★順番を 変えたときと 同じ扱いです（★§3）。
 *   ★★事前に 決めることに 意味が あります。★見てから 選び直せません。
 */
export function needsRecount(prevLag, nextLag) {
  if (!prevLag || !nextLag) return false;
  return prevLag !== nextLag;
}
