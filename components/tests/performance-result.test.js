// ============================================================================
// D+1 の一問（本番モード §7）── 2026-09-07
//
//   出どころ docs/opus/lavoce-仕様-本番モードの実装（9月6日・詳細版）.md §7
//
//   ★★これが無いと「前も、こうでした」が永久に作れません。
//     ★予報のための機能ではありません。★本番モードの芯です。
//
//   ★★決まり（★ここが肝）
//     ・これ以上、何も聞かない　・3つだけ　・あとでを押せる
//     ・どの答えでも同じ言葉　★「良かったですね」と書かない
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  const src = fs.readFileSync(path.join(ROOT, "lib", "performanceResult.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const p = { id: "1", kind: "honban", performed_on: "2026-10-19", label: "ミラノ・椿姫" };

  console.log("■ 3つだけ");
  ok("答えは3つ", m.RESULTS.length === 3);
  ok("出た／途中まで／出なかった",
    m.RESULTS.map((r) => r.label).join("/") === "出た/途中まで/出なかった");
  // ★★「まあまあ」などを足さないこと。
  ok("★あいまいな選択肢が無い",
    !m.RESULTS.some((r) => /まあまあ|ふつう|どちらとも/.test(r.label)));
  ok("保存する値は3つだけ",
    m.RESULT_KEYS.join(",") === "out,partial,not_out");

  console.log("■ いつ聞くか");
  ok("当日は聞かない", m.shouldAsk({ performance: p, todayISO: "2026-10-19" }) === false);
  ok("D+1 は聞く", m.shouldAsk({ performance: p, todayISO: "2026-10-20" }) === true);
  ok("D+7 まで聞く", m.shouldAsk({ performance: p, todayISO: "2026-10-26" }) === true);
  // ★★D+8 からは聞かないこと。★記憶があいまいになります。
  ok("★D+8 からは聞かない", m.shouldAsk({ performance: p, todayISO: "2026-10-27" }) === false);
  // ★★逆算の基準は、本番だけ（§1.1）。
  ok("★リハーサルには聞かない",
    m.shouldAsk({ performance: { ...p, kind: "rehearsal" }, todayISO: "2026-10-20" }) === false);
  ok("移動にも聞かない",
    m.shouldAsk({ performance: { ...p, kind: "travel" }, todayISO: "2026-10-20" }) === false);
  ok("もう答えていたら聞かない",
    m.shouldAsk({ performance: p, answered: true, todayISO: "2026-10-20" }) === false);
  // ★★「あとで」を押した日は、もう出さない。★翌日また出す。
  ok("★あとでを押した日は、出さない",
    m.shouldAsk({ performance: p, snoozedOn: "2026-10-20", todayISO: "2026-10-20" }) === false);
  ok("★翌日は、また出す",
    m.shouldAsk({ performance: p, snoozedOn: "2026-10-20", todayISO: "2026-10-21" }) === true);

  console.log("■ どれを聞くか");
  // ★★1つだけ。★2つ並べると、どちらの話か分からなくなります。
  const two = [p, { id: "2", kind: "honban", performed_on: "2026-10-21" }];
  const picked = m.pickToAsk(two, { answeredIds: [], todayISO: "2026-10-22" });
  ok("★1つだけ選ぶ", picked && picked.id === "2", picked && picked.id);
  ok("答え済みは飛ばす",
    m.pickToAsk(two, { answeredIds: ["2"], todayISO: "2026-10-22" }).id === "1");
  ok("何も無ければ null", m.pickToAsk([], { todayISO: "2026-10-22" }) === null);

  console.log("■ 時計を、lib の中で引いていないか");
  const code = readCode("lib", "performanceResult.js");
  ok("★今日を、呼ぶ側から受け取っている", !/new Date\(\)/.test(code));

  console.log("■ 言い方");
  ok("羊の一言がある", m.SHEEP_LINE === "おつかれさま");
  ok("お礼の2行がある", m.THANKS_LINES.length === 2);
  ok("2行目が、この一問の意味", /次の本番の前に思い出せます/.test(m.THANKS_LINES.join("")));
  // ★★評価しないこと。
  const words = code + m.THANKS_LINES.join("") + m.SHEEP_LINE;
  for (const w of ["良かったですね", "残念でしたね", "惜しい", "すごい", "よくやり"]) {
    ok(`★「${w}」と書いていない`, !words.includes(w));
  }
  ok("D+1 なら「昨日の」", /昨日の/.test(m.askTitle(p, "2026-10-20")));
  // ★★D+7 まで聞くので、「昨日」と決め打たないこと。
  ok("★D+3 では「昨日」と言わない", !/昨日/.test(m.askTitle(p, "2026-10-22")));
  ok("日付と名前を出す", m.performedLabel(p) === "10月19日　ミラノ・椿姫");
  ok("名前が無くても出る",
    m.performedLabel({ performed_on: "2026-10-19" }) === "10月19日");

  console.log("■ 画面");
  const ask = readCode("components", "PerformanceResultAsk.jsx");
  ok("★「あとで」がある", /あとで/.test(ask));
  // ★★これ以上、何も聞かないこと。
  ok("★理由を聞いていない", !/理由|なぜ|どうして/.test(ask));
  ok("★点数を聞いていない", !/点|score|1〜5/.test(ask));
  ok("★lib から引いている（画面に書き写していない）",
    /from "@\/lib\/performanceResult"/.test(ask) && !/出なかった"/.test(ask));

  console.log("■ つながっているか");
  const vt = readCode("components", "VocalTracker.jsx");
  ok("ホームに出している", /<PerformanceResultAsk/.test(vt));
  ok("performances を読んでいる", /from\("performances"\)/.test(vt));
  ok("答えを保存している", /from\("performance_results"\)/.test(vt));
  // ★★押し直しは上書き。★1つの本番に1件だけ。
  ok("★押し直しは上書き", /onConflict: "performance_id"/.test(vt));
  ok("★保存に失敗したら、黙らない", /本番の答えを保存できませんでした/.test(vt));

  console.log("■ 表の名前が、行動ログとぶつかっていないか");
  const sql = readCode("supabase", "2026-09-07-performances-と-D+1の一問.sql");
  ok("★events という名前を使っていない", !/create table if not exists public\.events/.test(sql));
  // ★★仕様書の load_coef は、列ごと落とすこと（001 の訂正2）。
  ok("★load_coef が無い", !/load_coef +numeric/.test(sql));
  ok("★WITH CHECK がある", (sql.match(/with check/g) || []).length >= 2);

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
