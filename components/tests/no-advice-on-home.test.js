// ============================================================================
// ホームで、助言をしていないか（2026-09-07）
//
//   ★★坂本さんの決め
//     ② 的中率の数字を、どこにも出さない。
//        ★天気予報も、自分の的中率を出しません。★それと同じ立場です。
//        ★外した日は何も言わず、★当たった日だけ、ときどき小さく喜ぶ。
//     ③ 「今日やるといいこと」の助言をやめ、数えて並べるだけにする。
// ============================================================================

const path = require("path");
const { readCode } = require("./_source");

let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  const fs = require("fs");
  const ROOT = path.join(__dirname, "..", "..");
  const vt = readCode("components", "VocalTracker.jsx");

  console.log("■ ② 的中率の数字");
  ok("★「的中率」という言葉が、画面に無い", !/的中率/.test(vt));
  ok("★％で出していない", !/forecastHitRate\.rate/.test(vt));
  ok("当たった日の一言はある", /あ、あたりました。/.test(vt));
  // ★★外した日は、何も言わないこと。★お詫びも言い訳もしない。
  //   ★予報のあたりだけを見ます（★曲名を外した、などは別の話です）。
  const fi = vt.indexOf("forecastHitToday");
  const forecastBlock = fi >= 0 ? vt.slice(fi, fi + 1200) : "";
  ok("★外した日に、何も言っていない",
    !/はずれ|当たりませんでした|すみません|ごめん/.test(forecastBlock));
  // ★★描き直すたびに出たり消えたりしないこと。
  ok("★乱数で決めていない", !/Math\.random/.test(forecastBlock));
  ok("★日付から決めている", /sum % 4 === 0/.test(forecastBlock));

  console.log("■ ③ 今日やるといいこと");
  ok("★「今日やるといいこと」が、もう無い", !/今日やるといいこと/.test(vt));
  ok("助言の一覧が、もう無い", !/const HOME_SUGGESTION_TEXT = \{/.test(vt));
  ok("助言の計算が、もう無い", !/const todaySuggestion = /.test(vt));
  ok("代わりに、数えて並べている", /recentlyWritten\(entries, realTodayDate\)/.test(vt));

  const src = fs.readFileSync(path.join(ROOT, "lib", "recentlyWritten.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ 数え方");
  ok("14日ぶんを見る", m.RECENT_DAYS === 14);
  ok("3つまで", m.TOP_N === 3);
  ok("1回だけのものは出さない", m.MIN_COUNT >= 2);
  // ★★お薬のことは、数えないこと。★先生にも共有しない11列の1つ。
  ok("★お薬を数えていない", !m.COUNTED_FIELDS.includes("medicationTags"));
  ok("自由記述を数えていない",
    !m.COUNTED_FIELDS.some((f) => /note|memo|diary/i.test(f)));
  // ★★時計は、lib の中で引かないこと（★試験で確かめられなくなります）。
  const code = readCode("lib", "recentlyWritten.js");
  ok("★今日を、呼ぶ側から受け取っている", !/new Date\(\)/.test(code));

  console.log("■ 言い方に、助言が混ざっていないか");
  ok("見出しは「よく書いていること」", /よく書いていること/.test(m.RECENT_TITLE));
  // ★★「よくあること」と書かないこと。★書いた回数を数えているだけです。
  ok("★「よくあること」と書いていない", !/よくあること/.test(m.RECENT_TITLE));
  const line = m.recentLine({ label: "辛いもの", count: 3 });
  ok("回数だけを出す", line === "辛いもの（3回）", line);
  ok("★「しましょう」を付けていない", !/しましょう|ましょう|おすすめ/.test(code));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
