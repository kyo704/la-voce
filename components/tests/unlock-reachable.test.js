// ============================================================================
// ★解放は、★1つ残らず 手が 届くか（★2026-09-10）
//
//   ★出どころ docs/opus/woolsong-訂正-古い機能の扱い（9月10日）.md §7-2
//     「★消したあとに、★同じ形の 穴が 空いていないか 確かめる
//       （★条件が 厳しすぎて 0件になる入口が できていないか）」
//
//   ★★9月9日の notOutDates が、まさに その形でした。
//     ★コードは 在ったのに、★誰にも 1日も 開いていませんでした。
//   ★★9月10日、★同じ形が もう1つ 見つかりました。
//     ★practiceGoalDone ── ★条件も 札も 品（hatCamellia）も 揃っているのに、
//     ★computeUnlocked が、★1度も 配っていませんでした。
//
//   ★★この見張りは、★3つを 突き合わせます。
//     ① 条件の 一覧（UNLOCK_CONDITIONS）
//     ② 実際に 配る ところ（computeUnlocked）
//     ③ その鍵で 開く 品（lib/sheepWardrobe.js の UNLOCKS）
//   ★★どれか 1つでも 欠けたら、★誰かの 手が 届きません。
// ============================================================================

const fs = require("fs");
const path = require("path");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  const src = fs.readFileSync(path.join(ROOT, "lib", "character.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const { UNLOCK_CONDITIONS, computeUnlocked } = m;

  const keys = Object.keys(UNLOCK_CONDITIONS);
  console.log("① 条件の 一覧　（" + keys.length + "件）");
  ok(keys.length > 0, "★条件が 書いてある");

  console.log("② 実際に 配る ところ");
  const body = src.slice(src.indexOf("export function computeUnlocked"));
  const granted = new Set([...body.matchAll(/unlocked\.add\("([A-Za-z0-9]+)"\)/g)].map((x) => x[1]));
  keys.forEach((k) => ok(granted.has(k), "★「" + k + "」を 配る 道が ある"));
  // ★逆も 見ます。★一覧に 無いものを 配っていないか。
  [...granted].forEach((k) => ok(keys.includes(k), "★「" + k + "」は 一覧に ある"));

  console.log("③ その鍵で 開く 品");
  const ward = fs.readFileSync(path.join(ROOT, "lib", "sheepWardrobe.js"), "utf8");
  keys.forEach((k) => {
    ok(new RegExp("\\b" + k + ":\\s*\\[").test(ward), "★「" + k + "」で 開く 品が ある");
  });

  console.log("④ ★実際に 動かして 確かめる");
  // ★★書き方を 読むだけでは、★条件が 厳しすぎる ことに 気づけません。
  //   ★だから、★その条件を 満たす 記録を 作って 通します。
  const entries = {};
  for (let i = 1; i <= 12; i++) {
    entries["2026-08-" + String(i).padStart(2, "0")] = {
      date: "2026-08-" + String(i).padStart(2, "0"),
      activities: [{ kind: "本番" }],
      pianissimoHighNote: true,
      sleepHours: 7, throatCondition: 3, voiceQuality: 3, waterMl: 1200,
      bodyWeight: 50, mood: 3, notes: "あ", steps: 100, roomHumidity: 40
    };
  }
  const profile = { practice_goal: "高音を 楽に", practice_reviews: [{ at: "2026-08-05", text: "すこし 楽に" }] };
  const got = computeUnlocked(entries, profile);
  keys.forEach((k) => ok(got.has(k), "★「" + k + "」が、実際に 開いた"));

  console.log("⑤ ★減らない（★訂正 §8-1「増える方向にだけ」）");
  const withoutProfile = computeUnlocked(entries);
  ok([...withoutProfile].every((k) => got.has(k)),
    "★profile を 渡さなくても、★渡したときより 減らない");
  ok(computeUnlocked({}, {}).size === 0, "★記録が 無ければ 0（★勝手に 配らない）");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
