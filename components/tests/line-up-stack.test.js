// ============================================================================
// ふりかえる ／ ならべる ── 上下に 並べる（★2026-09-11 の 点検）
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//             の narabe()
//   ★きっかけ Opus の 指摘（★坂本さん経由・2026-09-11）
//     「1本の 線では なく、複数の 項目を 上下に 並べる 形に」
//
//   ★★見張るのは 4つ。
//     ① 見本の 4つが、★見本の 順で 並ぶ
//     ② 札の 名前と、★出している 値が 合っている（★点検で 見つけた 不具合）
//     ③ ご本人が 書いた ものを 消していない（★歌った 時間）
//     ④ 判定・基準線・良し悪しの 色を 出していない
// ============================================================================

const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) console.log("  ok  " + label);
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const src = readRaw("lib", "lineUp.js")
    .replace(/from "@\/lib\/([a-zA-Z0-9]+)"/g, (m, n) => `from "${
      "file://" + path.join(__dirname, "..", "..", "lib", n + ".js")}"`);
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 見本の 順");
  const titles = L.STACK_ROWS.map((r) => r.title);
  ok(titles.slice(0, 4).join("／") === "こえの ちょうし／のどの 調子／昨夜の 睡眠／気になったこと",
    "★見本の 4つが、見本の 順（いまは " + titles.slice(0, 4).join("／") + "）");
  ok(titles.length === 5 && titles[4] === "歌った 時間",
    "★見本に 無い「歌った 時間」は、あとに 置く（★消さない）");

  console.log("② 札の 名前と 値が 合っている");
  // ★★これが 2026-09-11 の 点検で 見つけた 不具合です。
  //   ★「こえの ちょうし」の 札で、★のどの 値を 出していました。
  const byTitle = Object.fromEntries(L.STACK_ROWS.map((r) => [r.title, r.field]));
  ok(byTitle["こえの ちょうし"] === "voiceQuality", "★こえ は voiceQuality（★声の調子）");
  ok(byTitle["のどの 調子"] === "throatCondition", "★のど は throatCondition（★喉の状態）");
  ok(byTitle["昨夜の 睡眠"] === "sleepHours", "★ねむり は sleepHours");
  // ★★言葉の 出どころも 確かめます。★取り違えの 元は ここでした。
  const tr = readRaw("lib", "translations.js");
  ok(/labelThroatCondition: \{ ja: "喉の状態"/.test(tr), "★throatCondition ＝ 喉の状態");
  ok(/labelVoiceQuality: \{ ja: "声の調子/.test(tr), "★voiceQuality ＝ 声の調子");

  console.log("③ 画面は 並べるだけ");
  const ui = readCode("components", "LookBackV2.jsx");
  ok(/STACK_ROWS\.map/.test(ui), "★並びを lib から 取っている");
  ok(!/title="こえの ちょうし"/.test(ui), "★札の 名前を 画面に 書き写していない");
  ok(/sungMinutes/.test(ui), "★歌った 時間が 残っている");

  console.log("④ 下の 3行");
  ok(L.LINE_UP_STACK_NOTE.length === 3, "★3行");
  ok(L.LINE_UP_STACK_NOTE[0] === "同じ 日付の 軸に、書いたことを 縦に 並べます（鏡です）。",
    "★1行目は 見本の まま");
  ok(/LINE_UP_STACK_NOTE\.map/.test(ui), "★画面が それを 出している");

  console.log("⑤ 出さないもの");
  // ★★但し書き そのものを 数えない こと。
  //   ★見本の 下の 3行は「判定・基準線・良い/悪いの 色を 出しません」と
  //   ★★言っています。★その 文を 数えると、★自分の 断りで 落ちます。
  //   ★★注記では なく ★画面に 出る 文字列なので、readCode では 消えません。
  //     ★_source.js の 冒頭が、★この 形を 名指しで 断っています。
  //   ★だから、★断りの 3行を 外してから 数えます。
  let raw = readCode("lib", "lineUp.js") + ui;
  L.LINE_UP_STACK_NOTE.forEach((line) => { raw = raw.split(line).join(""); });
  L.LINE_UP_NOTE.split("\n").forEach((line) => { raw = raw.split(line).join(""); });
  // ★★見本⑫の 凡例も、★同じ かたちの 断りです。
  //   「目では見えますが、判定には 入れていません」── ★判定を していない、と
  //   ★★言っている 文です。★数えたら、★断りで 落ちます。
  raw = raw.split("○は あとから書いた日です。目では見えますが、判定には 入れていません。").join("");
  ["点数", "順位", "判定", "基準線", "良い/悪い", "予報", "おすすめ"].forEach((w) => {
    ok(!raw.includes(w), `★「${w}」を 出していない`);
  });
  // ★★色で 良し悪しを 言わない。★1色の 濃淡だけ。
  ok(!/red|green|信号/.test(ui), "★信号の 色を 使っていない");

  console.log("⑥ 目もりの 断り");
  ok((L.STACK_ROWS.find((r) => r.key === "sleep") || {}).foot === "4〜9時間",
    "★ねむりに「4〜9時間」");
  ok(/foot \? \(/.test(ui), "★渡されたときだけ 出す（★空の 断りを 置かない）");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
