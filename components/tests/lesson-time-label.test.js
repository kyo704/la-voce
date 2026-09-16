/**
 * ★次の レッスン ── ★日づけと 時刻を、★同じ 時計で 出す。
 *
 *   ★★2026-09-16、★実機に「2026年9月18日（金）00:00」と 出ました。
 *     ★★入れた のは 15時 です。
 *   ★★わけ ── ★1行の 中で 時計が 2つ 混ざって いました。
 *     ★日づけ … `at.toISOString().slice(0, 10)` ── ★**世界時**
 *     ★時刻   … `at.toLocaleTimeString("ja-JP", …)` ── ★**お手元の 時計**
 *   ★★9月18日 15:00（世界時）は、★日本では 9月19日 0:00 です。
 *     ★★時刻だけ 日本に なり、★日づけは 世界時の まま でした。
 *
 *   ★★これは 夜の 予定 ぜんぶで 起きます。★見せかけの データ だけの 話では ありません。
 */
const { readCode } = require("./_source");

let 落ち = 0;
function t(名, 条件) {
  console.log((条件 ? "  ok   " : "  NG   ") + 名);
  if (!条件) 落ち++;
}

const vt = readCode("components/VocalTracker.jsx");

console.log("\n=== ★時計を 混ぜて いない ===");
// ★★節の 中だけ を 見ます。★ほかの 場所の `toISOString` は 別の 話 です。
const 始 = vt.indexOf("const next = nextLesson(classroom.lessons");
const 節 = 始 < 0 ? "" : vt.slice(始, 始 + 1600);
t("★次の レッスンの 節が ある", 節.length > 0);
t("★★世界時の 日づけを 使って いない",
  !/toISOString\(\)\.slice\(0, 10\)/.test(節));
t("★お手元の 時計で 日づけを 作って いる", /toISODate\(at\)/.test(節));
t("★時刻も お手元の 時計", /toLocaleTimeString\("ja-JP"/.test(節));

console.log("\n=== ★較正 ── ★ずれが 本当に 起きるか ===");
// ★★日本の 時計で 動かして、★2つの 出し方が 食い違う ことを 見ます。
//   ★★食い違わなければ、★この 見張りは 何も 守って いません。
const at = new Date("2026-09-18T15:00:00Z");   // ★日本では 9月19日 0:00
const utc日 = at.toISOString().slice(0, 10);
const 時刻 = at.toLocaleTimeString("ja-JP", {
  hour: "2-digit", minute: "2-digit", timeZone: "Asia/Tokyo"
});
const 日本日 = new Intl.DateTimeFormat("sv-SE", {
  timeZone: "Asia/Tokyo", year: "numeric", month: "2-digit", day: "2-digit"
}).format(at);
t("★世界時の 日づけは 9月18日", utc日 === "2026-09-18");
t("★日本の 日づけは 9月19日", 日本日 === "2026-09-19");
t("★日本の 時刻は 00:00", 時刻 === "00:00");
t("★★2つを 並べると 食い違う（★較正）", utc日 !== 日本日);

console.log("\n=== ★ほかに 同じ 混ぜ方が 無いか ===");
// ★★`toISOString().slice(0, 10)` を 画面に 出して いる ところ。
//   ★★打刻（保存する 値）に 使うのは 正しい ので、★節の 中だけ を 見ます。
const 混ざり = [];
const re = /toISOString\(\)\.slice\(0, 10\)/g;
let m;
while ((m = re.exec(vt))) {
  const 前後 = vt.slice(Math.max(0, m.index - 260), m.index + 260);
  if (/toLocaleTimeString|toLocaleString/.test(前後)) {
    混ざり.push("…" + vt.slice(Math.max(0, m.index - 60), m.index + 40).replace(/\s+/g, " "));
  }
}
t("★★日づけ（世界時）と 時刻（お手元）を 並べて いる ところが ない"
  + (混ざり.length ? "\n         " + 混ざり.join("\n         ") : ""),
  混ざり.length === 0);

console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
process.exit(落ち === 0 ? 0 : 1);
