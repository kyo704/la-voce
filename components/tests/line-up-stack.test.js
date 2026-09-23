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

  const ui = readCode("components", "LookBackV2.jsx");

  console.log("① 見本の 5本 ＋ 営業資料の 2本");
  // ★出どころ 動く見本-PC・iPad（個人）.html の var ITEMS（★5本）
  //          ＋ 営業資料 v5 1ページ目「眠りと、夕食の時刻と、湿度を」（★2本）
  ok(L.LANES.length === 7, "★7本から えらぶ（いまは " + L.LANES.length + "）");
  ok(L.LANES.slice(0, 5).map((x) => x.label).join("／")
    === "声の 出来／のどの 調子／起きたときの むくみ／声を 使った 時間／昨夜の 睡眠",
    "★はじめの 5本は 見本の とおり・同じ 順");
  ok(L.LANES.slice(5).map((x) => x.label).join("／") === "食べ終えてから 寝るまで／湿度",
    "★営業資料の 2本を 足してある");
  ok(L.LANE_MAX === 5, "★同時に 出せるのは 5本まで（★裁定 §1-2）");
  ok(L.LANE_MIN === 1, "★1つは 残す");

  console.log("② 札の 名前と 値が 合っている");
  // ★★2026-09-11 の 点検で 見つけた 不具合です。
  //   ★「こえの ちょうし」の 札で、★のどの 値を 出していました。
  const byLabel = Object.fromEntries(L.LANES.map((x) => [x.label, x.field]));
  ok(byLabel["声の 出来"] === "voiceQuality", "★こえ は voiceQuality");
  ok(byLabel["のどの 調子"] === "throatCondition", "★のど は throatCondition");
  ok(byLabel["起きたときの むくみ"] === "morningEdema", "★むくみ は morningEdema");
  ok(byLabel["昨夜の 睡眠"] === "sleepHours", "★ねむり は sleepHours");
  ok(byLabel["湿度"] === "humidity", "★湿度 は humidity");
  const tr = readRaw("lib", "translations.js");
  ok(/labelThroatCondition: \{ ja: "喉の状態"/.test(tr), "★throatCondition ＝ 喉の状態");
  ok(/labelVoiceQuality: \{ ja: "声の調子/.test(tr), "★voiceQuality ＝ 声の調子");

  console.log("③ 出し入れの 決まり");
  ok(L.toggleLane([...L.LANE_DEFAULT], "shitsu") === null, "★5本の ときは 足せない");
  ok(L.toggleLane(["voice"], "voice") === null, "★1本の ときは 外せない");
  const after = L.toggleLane(L.toggleLane([...L.LANE_DEFAULT], "muku"), "shitsu");
  ok(after.length === 5 && after.includes("shitsu") && !after.includes("muku"),
    "★外してから 足せる");
  // ★★並びは いつも 同じ（★押した 順に しない）。
  ok(after.join(",") === L.LANES.filter((x) => after.includes(x.key)).map((x) => x.key).join(","),
    "★並びは LANES の 順");
  ok(L.LANE_MIN_REASON === "1つは 残します", "★わけの 言葉（少ない側）");
  ok(L.LANE_MAX_REASON === "同時に 出せるのは 5つまでです", "★わけの 言葉（多い側）");

  console.log("③-2 食べ終えてから 寝るまで");
  ok(L.laneValue({ dinnerTime: "19:00", bedtime: "23:30" }, "yuu") === 4.5, "★4.5時間");
  ok(L.laneValue({ dinnerTime: "21:00", bedtime: "0:30" }, "yuu") === 3.5, "★日を またいでも 出る");
  ok(L.laneValue({ dinnerTime: "", bedtime: "23:30" }, "yuu") === null, "★片方 無ければ 出さない");
  // ★★12時間を 超えるのは、★書き間違いか、★昼に 食べた 日です。
  ok(L.laneValue({ dinnerTime: "8:00", bedtime: "23:00" }, "yuu") === null, "★15時間は 出さない");

  console.log("③-3 数えたもの（★平均を 出さない）");
  const E = {
    "2026-09-01": { sleepHours: 7.2 }, "2026-09-02": { sleepHours: 5.5 },
    "2026-09-03": {}, "2026-09-04": { sleepHours: 6.0 }
  };
  const D = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04"];
  const sum = L.laneSummary(E, D, "sleep");
  ok(sum.most === 7.2 && sum.least === 5.5, "★いちばん 多い日・少ない日");
  ok(sum.middle === 6.0, "★まんなか");
  ok(sum.days === 3, "★書いていない 日は 数えない（★0 で 埋めない）");
  ok(!("average" in sum) && !("mean" in sum), "★★平均を 出していない");
  ok(L.laneSummary(E, ["2026-09-03"], "sleep") === null, "★1日も 無ければ null");

  console.log("④ 下の 3行");
  ok(L.LINE_UP_STACK_NOTE.length === 3, "★3行");
  ok(L.LINE_UP_STACK_NOTE[0] === "同じ 日付の 軸に、書いたことを 縦に 並べます（鏡です）。",
    "★1行目は 見本の まま");
  ok(/LINE_UP_STACK_NOTE\.map/.test(ui), "★画面が それを 出している");
  // ★★★2026-09-23・裁定111追補（design-v31）── ★帯・レーン・凡例は 無く なりました。
  //   ★見本（woolsong-2026-09-21.zip・aaa791aa）が 正 と 決まりました。
  //   ★★代わりに 守る ものは、★追補 §2 の もの です ──
  //     ★「原因かどうかは 分かりません」を いつも 出す
  ok(/原因かどうかは 分かりません/.test(ui) || /原因かどうかは 分かりません/.test(readCode("lib", "lineUp.js")),
    "★「原因かどうかは 分かりません」を 出して いる");

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

  console.log("⑥ 図の 決まり（★見本 stackSVG）");
  const chart = readCode("components", "LineUpChart.jsx");
  // ★★本番・レッスンの 日は、★縦の 帯が 全部の レーンを 貫きます（★裁定 §1-2）。
  // ★★★裁定111追補 …… ★1つの 指標＝1枚の カード。★中は 横棒。
  ok(/function Metric\(/.test(chart), "★1つの 指標＝1枚の カード（Metric）");
  ok(/horizontal/.test(chart), "★14日・4週は 横棒、★3か月は 縦棒");
  // ★★色は 2系統だけ（★追補 §2 で そのまま 残る）。
  ok(/tint = C\.curtain/.test(chart) && /tint=\{C\.sage\}/.test(chart),
    "★えんじ と みどり の 2つだけ（★tint で 分ける）");
  ok(!/#[0-9a-fA-F]{6}/.test(chart.replace(/#FFFDF8/g, "")), "★色を べた書きしていない");
  // ★★書いていない 日で 線を つながない こと。
  //   ★つなぐと、★書いていない 日にも 値が あったように 見えます。
  // ★★★裁定111追補 ── ★線が 無く なりました。★棒 です。
  //   ★★「書いて いない 日で 線を つながない」は、★棒では **起こりえません**。
  //     ★守る 中身は 変わりません ── ★書いて いない 日に 何も 出さない こと。
  ok(/value == null \? 0/.test(chart) || /value != null &&/.test(chart),
    "★書いて いない 日には 何も 出さない");
  // ★★★裁定111追補 ── ★SVG の 寸法は 無く なりました（★レーンが 無い ため）。
  //   ★代わりに、★期間の 分かれ目を 見ます（★14日・4週は 横棒／3か月は 縦棒）。
  ok(/dates\.length <= 28/.test(chart), "★28日を 境に 見せ方を 変える（★見本の とおり）");

  console.log("⑥-2 ★消したつもりの なかった もの（★2026-09-11 に 戻しました）");
  // ★★5本レーンに 作り直した とき、★2つを 巻き込んで 消していました。
  //   ★★静止画 A04 の 札は「こえの ちょうし／歌った 時間／気になったこと」です。
  //   ★どちらも ご本人が 書いた ものです。★消しません。
  // ★★★2026-09-23 ── ★「歌った 時間」は、★いまの 見本に ありません（★0件）。
  //   ★正式な zip（woolsong-2026-09-21.zip・aaa791aa）で 数えました。
  //   ★★だから ここでは 求めません。★「気になったこと」は 見本に 8件 あります。★残します。
  ok(/気になったこと/.test(ui), "★気になったこと が 出ている");
  ok(/function Symptoms/.test(ui), "★部品も 残っている");
  // ★★2つは 別の ものです。★1つに まとめないこと。
  // ★★★「歌った 時間」は いまの 見本に ありません。★この 確かめも 外します。
  //   ★`lib/lineUp.js` の `sungMinutes` は 残して あります（★消して いません）。
  ok(/sungMinutes/.test(readCode("lib", "lineUp.js")), "★数え方は lib に 残して ある");
  ok(L.LANES.some((x) => x.field === "nonPerformanceSpeechMinutes"),
    "★声を 使った 時間 は 別の 欄");

  console.log("⑦ 画面は 並べるだけ");
  // ★★★裁定111追補 ── ★レーンの 札（「並べるもの」）は 無く なりました。
  //   ★見本（aaa791aa）に「並べるもの」は 0件 です。
  //   ★★`lib/lineUp.js` の LANES・toggleLane・laneSummary は **消して いません**。
  //     ★裁定111 §1-2 が まだ 生きて いる ぶん が あるか、★Opus の お決め 待ち です。
  //     ★★ここでは「★lib に 残って いる こと」だけ を 見ます。
  const lineUpLib = readCode("lib", "lineUp.js");
  ok(/LANES/.test(lineUpLib), "★レーンの 決めは lib に 残って いる");
  ok(/toggleLane/.test(lineUpLib), "★出し入れの 決めも lib に 残って いる");
  ok(/laneSummary/.test(lineUpLib), "★数え方も lib に 残って いる");
  ok(!/平均|average/.test(ui + chart), "★平均を 出していない");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
