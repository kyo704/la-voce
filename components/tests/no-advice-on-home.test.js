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

  console.log("■ ② 声の予報（★2026-09-07 に、まるごとやめました）");
  // ★★実機で、★予報の線と実測の線が大きく離れていました。
  //   ★予報は1〜5を大きく振れ、★実測は2〜4に収まり、★ほとんど重なりません。
  //   ★「この精度の低さでは必要ありません」との坂本さんのご判断です。
  //   ★★9月7日の「残す」という決めを、★上書きしたものです。
  //
  //   ★★これからは「無いこと」を守ります。★戻ってきたら、ここで止めます。
  //     ★戻すときは、★精度を先に確かめてください。
  ok("★的中率という言葉が、無い", !/的中率/.test(vt));
  ok("★予報の計算が、無い", !/const todayForecast = /.test(vt));
  ok("★個人化（リッジ回帰）が、無い", !/fitRidgeRegression/.test(vt));
  ok("★「◯%個人化された式」の文が、無い", !/個人化された式/.test(vt));
  ok("★予測区間が、無い", !/forecastResidualSD/.test(vt));
  ok("★当たった日の一言も、一緒に消えている", !/あ、あたりました。/.test(vt));
  // ★★行列の道具も、予報だけのものでした。
  ok("★行列の道具も、消えている", !/function matMultiply/.test(vt));
  // ★★残すべきものが、消えていないこと。
  ok("★声の使用量の数えは、残っている", /const acwrSeries = useMemo/.test(vt));

  console.log("■ 前日の記録（★理屈だけ外し、事実は残す・案い）");
  // ★★1日分の記録からの推論に、★理屈を付けないこと。
  //   ★3ゲートを通りようがありません。★1日分に、群の比較はありません。
  ok("★逆流の理屈が、無い", !/食道へ逆流しやすく/.test(vt));
  ok("★explainKey を、画面で使っていない", !/t\(explainKey\)/.test(vt));
  // ★★事実は、残すこと。★消すと、書いたものが返りません。
  ok("★書かれた事実は、残っている", /flagText\(t, flagKey/.test(vt));
  ok("★注意の印（⚠）を、付けていない",
    !/⚠ \{flagText/.test(vt));

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
