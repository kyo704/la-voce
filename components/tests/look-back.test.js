// ============================================================================
// C1 ── 出なかった日の、前3日をひらく（2026-09-08）
//
//   ★★★文章を、添えません。
//     ★確率も、割合も、順位も、色分けも、出しません（★裁定 ⑦）。
//     ★書いたことを、そのまま縦に並べるだけです。
//   ★★ゲートは要りません。★何も主張しないためです。
//
//   node components/tests/look-back.test.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let fail = 0;
function ok(c, m) { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fail++; }

async function load(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8")
    .replace(/from\s+"@\/([^"]+)"/g, (m, r) => {
      const abs = path.join(ROOT, /\.[a-z]+$/.test(r) ? r : r + ".js");
      return `from "${pathToFileURL(abs).href}"`;
    });
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

(async () => {
  const L = await load("lib/lookBack.js");

  console.log("① さかのぼる3つ");
  ok(L.LOOK_BACK.length === 3, "3つ（★" + L.LOOK_BACK.map((s) => s.label).join("・") + "）");
  ok(L.LOOK_BACK.map((s) => s.label).join("") === "前の夜前の日2日前", "仕様の言葉のまま");
  const d = L.lookBackDates("2026-09-08");
  ok(d[0].date === "2026-09-07" && d[1].date === "2026-09-07" && d[2].date === "2026-09-06",
    "★前の夜と前の日は、同じ日付（★夜と昼で分ける）");
  ok(L.addDaysISO("2026-03-01", -1) === "2026-02-28", "月をまたいでも、正しい");
  ok(L.addDaysISO("2026-01-01", -2) === "2025-12-30", "年をまたいでも、正しい");
  ok(L.addDaysISO("こわれた値", -1) === null, "形の違う日付は、null");

  console.log("② ★「出なかった」は、ご本人が押した答え");
  const perfs = [{ id: "a", performed_on: "2026-09-08" }, { id: "b", performed_on: "2026-09-01" }];
  const res = [{ performance_id: "a", result: "not_out" }, { performance_id: "b", result: "out" }];
  ok(JSON.stringify(L.notOutDates(perfs, res)) === '["2026-09-08"]', "not_out の日だけ");
  ok(L.notOutDates(perfs, [{ performance_id: "b", result: "partial" }]).length === 0,
    "「途中まで」は、入れない");
  ok(L.notOutDates(null, null).length === 0, "null でも、落ちない");
  ok(L.notOutDates(perfs, [{ performance_id: "zzz", result: "not_out" }]).length === 0,
    "知らない本番は、飛ばす");
  const many = L.notOutDates(
    [{ id: "a", performed_on: "2026-09-01" }, { id: "b", performed_on: "2026-09-08" }],
    [{ performance_id: "a", result: "not_out" }, { performance_id: "b", result: "not_out" }]);
  ok(many[0] === "2026-09-08", "新しい順");

  console.log("③ ★書いたことを、そのまま並べる");
  const entries = {
    "2026-09-07": { bedtime: "01:30", dinnerTime: "22:00", throatCondition: 2, notes: "疲れた" },
    "2026-09-06": { sleepHours: 5 }
  };
  const secs = L.buildLookBack("2026-09-08", entries, L.LOOK_BACK_FIELDS);
  ok(secs.length === 3, "3つの節");
  const night = secs.find((s) => s.key === "prevNight");
  ok(night.rows.some((r) => r.key === "bedtime"), "★夜の欄は、前の夜に出る");
  ok(!night.rows.some((r) => r.key === "throatCondition"), "★昼の欄は、前の夜に出ない");
  const day = secs.find((s) => s.key === "prevDay");
  ok(day.rows.some((r) => r.key === "throatCondition"), "★昼の欄は、前の日に出る");
  ok(!day.rows.some((r) => r.key === "bedtime"), "★夜の欄は、前の日に出ない");
  ok(secs[2].rows.length === 1, "2日前は、書いたぶんだけ");

  console.log("④ ★空の欄を、並べない");
  ok(L.writtenOn({ notes: "" }, L.LOOK_BACK_FIELDS, "all").length === 0, "空文字は、出さない");
  ok(L.writtenOn({ notes: null }, L.LOOK_BACK_FIELDS, "all").length === 0, "null は、出さない");
  ok(L.writtenOn({ mealMarks: [] }, L.LOOK_BACK_FIELDS, "all").length === 0, "空の並びも、出さない");
  ok(L.writtenOn({ smokedToday: false }, L.LOOK_BACK_FIELDS, "all").length === 0, "false は、出さない");
  ok(L.writtenOn({ throatCondition: 0 }, L.LOOK_BACK_FIELDS, "all").length === 1, "★0 は、出す");
  ok(L.writtenOn(null, L.LOOK_BACK_FIELDS, "all").length === 0, "記録が無くても、落ちない");
  ok(L.hasAnything(secs) === true && L.hasAnything([]) === false, "何か在るか、答えられる");
  ok(L.hasAnything(L.buildLookBack("2026-01-01", {}, L.LOOK_BACK_FIELDS)) === false,
    "何も無ければ、false");

  console.log("⑤ ★出してはいけない欄");
  const keys = L.LOOK_BACK_FIELDS.map((f) => f.key);
  L.FORBIDDEN_FIELDS.forEach((f) => {
    ok(!keys.includes(f), "★" + f + " を、出していない");
  });

  console.log("⑤-2 ★欄の名前が、記録の欄と合っているか");
  // ★★bedTime と書いていて、★実際は bedtime でした。
  //   ★大文字1つで、★前の夜に何も出なくなります。★名前は、実物と突き合わせます。
  {
    const src = readRaw("components/VocalTracker.jsx");
    const i = src.indexOf("function rowToEntry");
    let dep = 0, j = src.indexOf("{", i), end = j;
    for (; end < src.length; end++) {
      if (src[end] === "{") dep++;
      else if (src[end] === "}") { dep--; if (dep === 0) break; }
    }
    const body = src.slice(i, end);
    const real = new Set((body.match(/^\s{4}(\w+):/gm) || [])
      .map((x) => x.trim().replace(":", "")));
    const missing = keys.filter((k) => !real.has(k));
    ok(missing.length === 0, "★出す欄が、すべて記録の欄にある"
      + (missing.length ? "：" + missing.join(",") : ""));
    const nightMissing = L.NIGHT_FIELDS.filter((k) => !real.has(k));
    ok(nightMissing.length === 0, "★夜の欄も、すべて記録の欄にある"
      + (nightMissing.length ? "：" + nightMissing.join(",") : ""));
  }

  console.log("⑥ ★1文も、添えていない");
  const lib = readCode("lib", "lookBack.js");
  const panel = readCode("components", "LookBackPanel.jsx");
  // ★★「%」は、★見た目の 単位でも 使います（★borderRadius: "50%"）。
  //   ★★2026-09-10、★丸い 点を 置いたら、★ここが 鳴りました。
  //     ★言い分は「★割合を 画面に 出さない」です。★CSS の 単位では ありません。
  //   ★★だから、★見た目の 決めごとを 外してから 数えます。
  const shown = panel
    .replace(/style=\{\{[\s\S]*?\}\}/g, "")   // ★見た目の かたまり
    .replace(/:\s*"[^"]*%"/g, "")               // ★"50%" のような 単位
    .replace(/\$\{[^}]*\}%/g, "");             // ★`${n}%` のような 単位
  ["でしょう", "かもしれません", "傾向", "原因", "せい", "%", "確率", "割合", "順位"].forEach((w) => {
    ok(!shown.includes(w), "★画面に「" + w + "」が無い");
  });
  // ★★2026-09-11、★言い分けました。
  //   ★★禁じているのは「★数を 作る」ことです ── ★合計・平均・割合。
  //   ★★1つの 値の「★書き方」は 別です ── ★7.2 を「7.2時間」に する、など。
  //     ★見本 SC['前3日'] が、★p.sleep.toFixed(1)＋'時間' と 書いています。
  //     ★これを 禁じると、★見本の とおりに 作れません。
  //   ★★だから、★足し合わせる 形だけを 止めます。
  // ★★但し書き そのものを 数えない こと。
  //   ★見本の 3行は「確率も 割合も 出しません」と 言っています。
  //   ★★注記では なく 画面に 出る 文字列なので、readCode では 消えません。
  //     ★_source.js の 冒頭が、★この 形を 名指しで 断っています。
  //   ★★この 取り違えは、★この家で 何度も 起きています。
  //     ★禁じた 語を 数えるときは、★先に 断りを 外すこと。
  let body = lib.replace(/^import[\s\S]*?;$/gm, "");
  [
    "書いたものを そのまま 出しています。",
    "文章を 添えません。確率も 割合も 出しません。「これが 原因です」と 言いません。",
    "見て、ご自分で 気づくための 画面です。"
  ].forEach((line) => { body = body.split(line).join(""); });
  ok(!/reduce\(/.test(body), "★足し合わせていない（★reduce が 無い）");
  ok(!/\+=/.test(body), "★数を 積み上げていない");
  ok(!/合計|平均|割合/.test(body), "★合計・平均・割合と 書いていない");
  // ★★書き方（toFixed／Math.round）は、★1つの 値に しか 使わない こと。
  //   ★lookBackValue の 中だけに あることを 見ます。
  const fmtAt = body.indexOf("export function lookBackValue");
  const fmtEnd = body.indexOf("\n}", fmtAt);
  const outside = body.slice(0, fmtAt) + body.slice(fmtEnd);
  ok(!/toFixed|Math\.round/.test(outside),
    "★書き方の 道具は、1つの 値の ところだけ");
  // ★★色を、値で変えないこと。
  //   ★★言い分は「★値の 大小で 色を 変えない」です。
  //     ★決まった 1色を 枠に 使うのは、★大小では ありません。
  //   ★★2026-09-10、★見本 A05 の 枠の 色（#E0C9CE に あたるもの）を
  //     ★手元の 濃淡から 取ったら、★名前だけで 鳴りました。
  //     ★★新しい色を 増やさないための 選び方でした。★見る先を 変えます。
  ok(!/(value|r\.value|v)\s*[<>]=?[\s\S]{0,60}(C\.|LEVEL_COLORS|#[0-9A-Fa-f]{3,6})/.test(panel),
    "★値の大小で、色を変えていない");
  ok(!/LEVEL_COLORS\[\s*(?!0\s*\])/.test(panel),
    "★段ごとの 色を 使っていない（★使うのは 1色だけ）");

  console.log("⑦ ★書いていない日も、そう書く");
  const raw = readRaw("components/LookBackPanel.jsx");
  ok(/書いていません。/.test(raw), "★黙って飛ばさない");
  ok(/まだ何も書かれていません/.test(raw), "★1つも無いときも、そう伝える");

  console.log("⑧ 画面につながっているか");
  const vt = readRaw("components/VocalTracker.jsx");
  ok(/<LookBackPanel dates=\{notOutDays\}/.test(vt), "分析の画面に、置いてある");
  ok(/notOutDates\(performances, perfResults\)/.test(vt), "出なかった日を、答えから取っている");
  ok(/select\("performance_id, result"\)/.test(vt), "★result も読んでいる");
  // ★★門をかけていないこと（★無料です）。
  const at = vt.indexOf("<LookBackPanel");
  const before = vt.slice(at - 700, at);
  ok(!/mayViewSummary|subscribed|freeTier/.test(before), "★門を、かけていない");

  
  console.log("★さかのぼる ── 見本 SC['前3日'] と 同じ（★2026-09-11 に 作り直しました）");
  {
    // ★★静止画 A05 は、★動く見本より 古い 版です。
    //   ★静止画　こえの ちょうし／歌った時間／寝るまでの間／印／ひとこと（★5行）
    //   ★動く版　声の 出来／のどの 調子／昨夜の 睡眠／声を使った 時間／
    //   　　　　　食べたもの／からだのこと（★6行 × 3日）
    //   ★★新しい ほうに 合わせました。
    const all2 = readCode("lib", "lookBack.js") + readCode("components", "LookBackPanel.jsx");
    [
      "声の 出来", "のどの 調子", "昨夜の 睡眠", "声を使った 時間", "食べたもの", "からだのこと",
      "前の日", "2日まえ", "3日まえ",
      "◎出た", "○ふつう", "△出づらい", "◎よい", "△わるい"
    ].forEach((w) => ok(all2.includes(w), "★「" + w + "」が ある"));
    // ★★24項目の 古い 形を、★この 画面に 渡していない こと。
    const v2 = readCode("components", "LookBackV2.jsx");
    ok(!/<LookBackPanel dates=\{days\} entries=\{entries\} fields=/.test(v2),
      "★さかのぼる に、古い 24項目を 渡していない");
    // ★★前から ある 画面は、★これまでどおり 動くこと。
    const vt2 = readCode("components", "VocalTracker.jsx");
    ok(/fields=\{LOOK_BACK_FIELDS\}/.test(vt2), "★前から ある 画面は これまでどおり");
    // ★★書いていない ものは「—」。★行ごと 消さない。
    ok(/LOOK_BACK_NONE = "—"/.test(readCode("lib", "lookBack.js")), "★書いていなければ「—」");
  }

console.log(fail === 0 ? "\n★すべて通りました" : "\n★" + fail + "件、落ちました");
  process.exit(fail === 0 ? 0 : 1);
})();
