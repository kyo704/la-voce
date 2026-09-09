import { webp } from "@/lib/imageFormat";
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
export const HEAD_NOFACE = "/sheep/sheep_head_noface.webp";

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
  // ★★WebP を 先に（★2026-09-09）。★読めなければ PNG に 戻ります。
  const f = FACES[name] || FACES.normal;
  return webp(FACE_BASE + f);
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

/**
 * ★顔を 出しておく 長さ（★2026-09-09・坂本さんの ご承認）。
 *
 *   ★★にっこり・大喜び・照れ は 4.0秒。
 *     ★あいづちの 吹き出しは 3.0秒です。★同じにすると 一緒に 消えます。
 *     ★★1秒 長くすると、★吹き出しが 消えたあとも 少し 笑っています。
 *       ★「言ったあとに 笑っている」に 見えます。
 *   ★★眠い・眠り は、★間では なく「状態」です。★時間で 消しません。
 *     ★時刻が 変わるまで、★起きるまで、★そのままです。
 */
export const REPLY_FACE_MS = 4000;

/** ★眠い顔に する 時刻（★22:00〜翌05:00）。 */
export const SLEEPY_FROM_HOUR = 22;
export const SLEEPY_TO_HOUR = 5;

/** ★何もしないで いると 眠る まで（★60秒）。 */
export const IDLE_SLEEP_MS = 60000;

/** ★いま その時刻か。 */
export function isSleepyHour(hour) {
  if (typeof hour !== "number") return false;
  return hour >= SLEEPY_FROM_HOUR || hour < SLEEPY_TO_HOUR;
}

/**
 * ★いま 出す顔を、★1か所で 決めます。
 *
 *   ★★強いほうから 見ます。★2つの決めを 混ぜないためです。
 *     ① あいづち（★4.0秒だけ）
 *     ② 眠っている（★ねどこ・寝ている）
 *     ③ 何もしないで 60秒
 *     ④ 22:00〜翌05:00
 *     ⑤ ふだん
 *   ★★体調や 記録の中身では、★1つも 変えません（★禁 7）。
 */
export function faceNow({ reply, isLying, idle, hour }) {
  if (reply) return reply;
  if (isLying) return "sleep";
  if (idle) return "sleep";
  if (isSleepyHour(hour)) return "sleepy";
  return "normal";
}

/**
 * ★先に 読んでおく顔（★2026-09-09・軽くするため）。
 *
 *   ★★もとは 9枚とも 先に 読んでいました（★152KB）。
 *     ★★はじめに 要るのは、★01 通常 と 02 まばたき の 2枚だけです。
 *       ★まばたきは 3〜7秒に1回 来ます。★これは 先に 要ります。
 *     ★残り7枚は、★出す場面が 来てから で 間に合います。
 *       ★にっこりは 記録を保存したとき。★眠りは 60秒 たってから。
 *       ★★どれも「いま すぐ」では ありません。
 *   ★★これで 152KB → 34KB。★118KB 減ります。
 */
export const FIRST_FACES = Object.freeze(["normal", "blink"]);

/**
 * ★はじめに 読んでおく 2枚。
 *
 *   ★★かならず faceSrc を 通すこと（★2026-09-09 の 直し）。
 *     ★★ここだけ FACE_BASE + FACES[k] と 直に 書いていました。
 *       ★それは .png です。★出すのは .webp です。
 *     ★★だから、★同じ顔を 2度 取りに 行っていました。
 *       ★先読みで .png、★描くときに .webp。
 *     ★実機の 記録で、★9枚とも .png で 読まれていました。★そのとおりです。
 *   ★★出すものと、先に読むものを、★2か所で 作らないこと。
 */
export function preloadList() {
  return FIRST_FACES.map((k) => faceSrc(k));
}

/**
 * ★残りの 7枚。
 *
 *   ★★2026-09-09、★先読みを やめました。
 *     ★★手が空いたときに 読む形に していましたが、
 *       ★結局 9枚とも 読まれます。★実機の 記録の とおりです。
 *     ★★出す場面が 来てから、★そのとき 読めば 足ります。
 *       ★にっこりは 記録を保存したとき。★眠りは 60秒 たってから。
 *       ★どれも「いま すぐ」では ありません。
 *   ★★この関数は 残します。★どの顔が「あと」なのかを 示すためです。
 *     ★呼ぶ側は ありません。★先読みは しません。
 */
export function laterFaces() {
  return Object.keys(FACES).filter((k) => !FIRST_FACES.includes(k));
}
