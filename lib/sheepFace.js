// ============================================================================
// 羊の顔（face-v1）── 2026-09-08
//
//   ★出どころ woolsong-納品-羊の顔9種（9月8日）
//
//   ★★これまでの羊は、★目・鼻・口・ほおが 頭に 焼きこまれた1枚でした。
//     ★表情が 1つだけで、★まばたきも ありませんでした。
//   ★★顔を 頭から 外しました（★鼻は 立体なので 残してあります）。
//     ★sheep_head_noface.png ＋ face/sheep-face-01〜09.png。
//     ★★「顔なしの頭 ＋ 01 通常」と、★もとの頭の ちがいは 平均 0.58
//       （★256階調・中身のある所だけ）。★見分けが つきません。★測りました。
//
//   ★★いま入れているのは、★まばたきだけです（★坂本さんのお決め）。
//     ★残り8つは、★教室の第2〜5便の あとに まわします。
//     ★★絵は 9枚とも 置いてあります。★出す場面だけが まだです。
//
//   ★★禁じられていること（★8つ・manifest.json にも 入っています）
//     1 かなしい・こまった・がっかりした顔を 作らない・出さない
//     2 記録がないことを 顔で表さない
//     3 顔 × 帽子 × 首元 を あらかじめ合成した画像を 作らない
//     4 位置合わせの数値を コードに持たない（★ぜんぶ inset:0）
//     5 体の動きのために 顔を増やさない（★CSS transform でやる）
//     6 prefers-reduced-motion を 無視しない
//     7 ★顔で 体調や分析結果を 表さない
//         ★羊は「★記録した行為」に反応し、「★記録の中身」には 反応しません
//     8 装いを 既定でオンにしない
//
//   ★★7番が いちばん大事です。★てんの規則（★記録した行為にだけ 応える）と
//     ★同じ線です。★2026-09-08、★坂本さんに 確かめて いただきました。
//     ★しゃべる言葉（★ひとりごと）にも、★同じ線を 引きます。
//
//   ★見張り components/tests/sheep-face.test.js
// ============================================================================

/** ★顔の絵の 置き場所。 */
export const FACE_BASE = "/sheep/face/";

/** ★顔を外した頭。 */
export const HEAD_NOFACE = "/sheep/sheep_head_noface.png";

/**
 * ★顔の 重ね順（★Opus の決め）。
 *
 *   ★体0 → 服 → 頭45 → ★顔46 → 首元50 → 目元55 → かぶりもの60。
 *   ★★45 と 50 の あいだが 空いています。★46 が そのまま 入ります。
 */
export const FACE_Z = 46;

/**
 * ★9つの顔。
 *
 *   ★★かなしい・こまった・がっかり は、★1つも ありません。
 *     ★作らない、と 決まっています（★禁じられていること 1）。
 *     ★「3日 記録がないと 羊が寂しそうにする」は、★記録の催促そのものです。
 *     ★★記録が続かない人ほど、★罪悪感で 離れます。
 *     ★そして いちばん見たいのは「★調子が悪い日の記録」です。
 */
export const FACES = Object.freeze({
  normal: "sheep-face-01-normal.png",
  blink: "sheep-face-02-blink.png",
  smile: "sheep-face-03-smile.png",
  joy: "sheep-face-04-joy.png",
  sing: "sheep-face-05-sing.png",
  surprise: "sheep-face-06-surprise.png",
  sleepy: "sheep-face-07-sleepy.png",
  sleep: "sheep-face-08-sleep.png",
  shy: "sheep-face-09-shy.png"
});

/** ★顔の絵の みちすじ。★知らない名前なら、★通常を 返します。 */
export function faceSrc(name) {
  const f = FACES[name] || FACES.normal;
  return FACE_BASE + f;
}

/**
 * ★まばたきの 間（★納品書のとおり）。
 *
 *   ★★3〜7秒に1回、★120ms だけ 02 に 差し替えます。
 *   ★★おうち画面が 見えているときだけ 動かします。
 *     ★ほかのタブや、★画面を 伏せているときは 止めます。
 *   ★★動きを 減らす設定の方には、★まばたきも しません（★禁 6）。
 */
export const BLINK = Object.freeze({
  minMs: 3000,
  maxMs: 7000,
  holdMs: 120
});

/** ★つぎに まばたきするまでの 間（ミリ秒）。 */
export function nextBlinkMs(random) {
  const r = typeof random === "function" ? random() : Math.random();
  return BLINK.minMs + r * (BLINK.maxMs - BLINK.minMs);
}

/** ★先に 読んでおく絵（★切り替えの瞬間に 白が出ないように）。 */
export function preloadList() {
  return Object.values(FACES).map((f) => FACE_BASE + f);
}
