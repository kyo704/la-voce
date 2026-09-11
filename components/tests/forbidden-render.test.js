#!/usr/bin/env node

// ============================================================================
// ★出ては いけない ものが、★画面に 出ていないこと
//
//   ★出どころ Fable の 決まり ⑤（★2026-09-11・坂本さん 経由）
//     「(b) a forbidden-components list (legacy cards must not render)」
//
//   ★★これまでの 見張りは、★コードの 文字を 読んでいました。
//     ★★だから「書いてある か」は 分かっても、
//       ★★「画面に 出る か」は 分かりませんでした。
//     ★★A03 は 261本 すべて 通って、★それでも 古い 節が 出ていました。
//
//   ★★この見張りは、★実際に 描かれた 画面の 中身を 読みます。
//     ★docs/design/compare/all/frames/<画面>@390.json
//     ★★tools/compare.js が、★絵と いっしょに 書き出します。
//     ★★見える ものだけです（★display:none は 入りません）。
//
//   ★★書き出しが 無いときは、★落としません。★「見ていない」と 言います。
//     ★★通信の 要る 撮影を、★毎回の 見張りの 条件に しないためです。
//     ★★ただし「通った」とも 言いません。★黙って 通すのが いちばん 危ない。
// ============================================================================

const fs = require("fs");
const path = require("path");

const FRAMES = path.join(__dirname, "..", "..",
  "docs", "design", "compare", "all", "frames");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

/**
 * ★門の中の 画面に、★出ては いけない もの。
 *
 *   ★★どれも「消した」「隠した」と 報告した ものです。
 *     ★★報告が 本当か、★描かれた 画面で 確かめます。
 *   ★where … その 字が 出ては いけない 画面（★null なら どこにも）
 */
const FORBIDDEN = [
  // ★①消す（★2026-09-11）
  { text: "つづいています", why: "連続日数（★見本が 2か所で 禁じています）" },
  { text: "pt →", why: "点数（★点数化しない という 原則）" },
  { text: "日続いています", why: "連続日数（★分析タブ）" },
  // ★①消す（★2026-09-11・仕分けの §3）
  { text: "前日からのコンディション背景", why: "見本に ありません" },
  // ★㋐ 画面から 隠す（★2026-09-11）
  //   ★★同じ日の 夜、★一度「畳む」に 変わり、★また ㋐ に 戻りました。
  //     ★★畳む しくみ（foldNotes）は、★見本に ある 注記の ための ものです。
  //     ★★パッサッジョの通りにくさ などの 専門項目は、★見本に ありません。
  //       ★2つは 別の 話でした（★坂本さんの ご指摘）。
  //   ★★列も 記録も 消していません。★画面に 出さないだけです。
  //   ★★where … その 字が 出ては いけない 画面。★null なら どこにも。
  //     ★★2026-09-11、★設定の 画面で つまずきました。
  //       ★「『食事の詳細記録（食品別のPFC）』を30日間 記録していません。
  //         畳みますか？」という、★別の 機能の お誘いの 文でした。
  //       ★★節が 出ている わけでは ありません。★記録の 画面だけを 見ます。
  { text: "睡眠の質", where: /^(画面-記録|SH-)/, why: "1枚に 入る 節（★門の中では 出しません）" },
  { text: "今日の体重", where: /^(画面-記録|SH-)/, why: "同上" },
  { text: "食事の詳細記録", where: /^(画面-記録|SH-)/, why: "同上" },
  { text: "運動記録", where: /^(画面-記録|SH-)/, why: "同上" },
  { text: "心の余裕", where: /^(画面-記録|SH-)/, why: "同上" },
  { text: "パッサッジョの通りにくさ", where: /^(画面-記録|SH-)/,
    why: "見本に ない 専門項目（★お決め ①）" },
  { text: "高音の出しやすさ", where: /^(画面-記録|SH-)/, why: "同上" },
  { text: "お仕事に合わせた記録", where: /^(画面-記録|SH-)/, why: "見本の 足す は 4行です" },
  // ★★気候・滞在地（★2026-09-11・坂本さんの お決め ①消す）。
  //   ★★見本に 入力欄が 1つも ありません（★気温・天気・滞在地 … すべて 0件）。
  //   ★★画面が 自分と 食い違って いました ──
  //     ★「この2つは 聞きません」と 約束した すぐ下で、★気温と 天気を 聞いて いました。
  //   ★★列も 記録も 消して いません。★画面に 出さないだけです。
  { text: "気候・滞在地", where: /^(画面-記録|SH-)/, why: "見本に ありません" },
  { text: "滞在地・公演地", where: /^(画面-記録|SH-)/, why: "同上" },
  { text: "環境騒音レベル", where: /^(画面-記録|SH-)/, why: "同上" },
  { text: "今日の環境", where: /^(画面-記録|SH-)/, why: "同上" },
  { text: "移動・時差の記録", where: /^(画面-記録|SH-)/, why: "同上" },
  { text: "フライト時間", where: /^(画面-記録|SH-)/, why: "同上" },
  // ★節の 外に 残っていた もの（★B-1〜B-4）
  { text: "この日の記録を保存", why: "見本は［きょうは 書かない］［出す］だけ" },
  { text: "夜に、睡眠や食事をまとめて記録します", why: "押しても 何も 起きませんでした" },
  // ★私が 独自に 足した もの
  // ★★2026-09-11、★この 見張り自身が 誤っていました。
  //   ★★「詳しく」で 探すと、★見本の 正しい 部品
  //     「詳しく 書く（分で）」に つまずきます。
  //   ★★探すのは、★私が 足した 仕切りの ほうです。
  //     ★仕切りは <summary> の 中に、★単独の「詳しく」として 出ていました。
  { text: "ひらく", why: "私が 足した「詳しく」の 仕切り（★見本に ありません）" }
];

const files = fs.existsSync(FRAMES)
  ? fs.readdirSync(FRAMES).filter((f) => f.endsWith("@390.json"))
  : [];

console.log("★描かれた 画面の 書き出し: " + files.length + " 件");

if (files.length === 0) {
  // ★★見ていない、と はっきり 言います。★通ったとは 言いません。
  console.log("\n★★書き出しが ありません。★この見張りは 何も 見ていません。");
  console.log("　★node tools/compare.js --frames で 撮ってください。");
  console.log("　★★『通った』では ありません。★『見ていない』です。");
  process.exit(0);
}

console.log("\n① 出ては いけない ものが 出ていないこと");
const hits = [];
files.forEach((f) => {
  const key = f.replace(/@390\.json$/, "");
  let dump;
  try { dump = JSON.parse(fs.readFileSync(path.join(FRAMES, f), "utf8")); }
  catch (e) { return; }
  const texts = dump.map((d) => d.text).join("\n");
  FORBIDDEN.forEach((rule) => {
    if (rule.where && !rule.where.test(key)) return;
    if (texts.includes(rule.text)) {
      hits.push({ key, text: rule.text, why: rule.why });
    }
  });
});
hits.forEach((h) => console.log("    ✗ " + h.key + "  「" + h.text + "」  ── " + h.why));
t(hits.length === 0, "★消した／隠した ものが、★画面に 出ていない");

console.log("\n② 出ていなければ ならない ものが 出ていること");
// ★★出すべき ものを 消していないか。★片道の 見張りに しないため。
const MUST = [
  { key: "画面-記録", text: "足す（どれも 任意）" },
  { key: "画面-記録", text: "きょうは 書かない" },
  { key: "画面-記録", text: "出す" },
  { key: "SH-ねむり", text: "これでいい" },
  { key: "SH-honban", text: "本番（ソロ）" },
  { key: "SH-hito", text: "誰にも 送られません。先生にも、学校にも、運営にも 見えません。" },
  // ★★約束の 1行は、★そのまま 残して います。
  //   ★★これで、★書いて ある ことと、★して いる ことが 合いました。
  { key: "画面-記録", text: "この2つは 聞きません。" }
];
MUST.forEach((m) => {
  const p = path.join(FRAMES, m.key + "@390.json");
  if (!fs.existsSync(p)) { t(false, m.key + " の 書き出しが ありません"); return; }
  const texts = JSON.parse(fs.readFileSync(p, "utf8")).map((d) => d.text).join("\n");
  t(texts.includes(m.text), m.key + "「" + m.text.slice(0, 24) + "」が 出ている");
});

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
