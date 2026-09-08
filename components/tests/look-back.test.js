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
  ["でしょう", "かもしれません", "傾向", "原因", "せい", "%", "確率", "割合", "順位"].forEach((w) => {
    ok(!panel.includes(w), "★画面に「" + w + "」が無い");
  });
  ok(!/toFixed|Math\.round|reduce\(/.test(lib.replace(/^import[\s\S]*?;$/gm, "")),
    "★数を、作っていない（★合計も平均も出さない）");
  // ★★色を、値で変えないこと。
  ok(!/value.*[<>].*C\.|LEVEL_COLORS/.test(panel), "★値の大小で、色を変えていない");

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

  console.log(fail === 0 ? "\n★すべて通りました" : "\n★" + fail + "件、落ちました");
  process.exit(fail === 0 ? 0 : 1);
})();
