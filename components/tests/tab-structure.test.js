// ============================================================================
// 下の帯（タブ）の作り（2026-09-07・案い）
//
//   ★★坂本さんの決め：★「もっと」を、下の帯から外し、★歯車へ移す。
//     ★★2026-09-07、★注釈を実物に合わせました。
//       ★決めたときは「おうちの右上」でしたが、★実際に置かれたのは★ホームです。
//       ★坂本さんの判断で、★画面はそのまま、★言葉のほうを直しました。
//       ★「文書と実装が食い違ったら、実装のほうが事実」（憲章 §13）。
//     ★帯が7つになると、★1つ1つが押しにくくなります。
//
//   ★★本番で動いているものを、ここに写しておきます。
//     ★871行の仕様書は、★Woolsong に名前を変える前のもので、
//     ★おうち（羊の家）が入っていません。
//     ★仕様書だけを見て直すと、★おうちを消してしまいます。
// ============================================================================

const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

const src = readRaw("components", "VocalTracker.jsx");
const code = readCode("components", "VocalTracker.jsx");

console.log("■ 帯に並ぶもの");
const block = src.slice(src.indexOf("const TABS = ["), src.indexOf("];", src.indexOf("const TABS = [")));
const keys = [...block.matchAll(/key: "([a-z]+)"/g)].map((m) => m[1]);
// ★★2026-09-07、★レッスンを帯に固定しました（坂本さんの決め）。
//   ★教える方・習う方だけでなく、★誰にでも見えます。
ok("並びは home / today / analysis / lesson / garden / notes / more",
  keys.join(",") === "home,today,analysis,lesson,garden,notes,more", keys.join(","));
// ★★おうち（garden）を、消さないこと。
//   ★羊とおうちは、ここからしか行けません。
ok("★おうち（garden）が入っている", keys.includes("garden"));

console.log("■ 「もっと」は、帯から外れているか");
ok("帯を作るとき、more を除いている",
  /TABS\.filter\(\(tb\) => tb\.key !== "more"\)/.test(code));
// ★★画面そのものは、消していないこと。★入口が変わっただけです。
ok("★「もっと」の画面は、消していない", /activeTab === "more"/.test(code));
ok("歯車から開く", /setActiveTab\("more"\)/.test(code));
// ★★歯車が、どの画面にあるか（★2026-09-07・坂本さんの決め）。
//   ★いちどホームに置いてありましたが、★おうちの右上へ移しました。
//   ★★ここで場所を留めます。★黙って動かないように。
{
  const raw = readRaw("components", "VocalTracker.jsx");
  const gardenAt = raw.indexOf('activeTab === "garden"');
  const gearAt = raw.indexOf("<Settings size=");
  ok("★歯車は、おうちの中にある", gardenAt > 0 && gearAt > gardenAt,
    `おうち ${gardenAt} / 歯車 ${gearAt}`);
  // ★★おうちの、いちばん上にあること（＝右上）。
  //   ★羊の絵より下に埋もれると、★見つけていただけません。
  const gardenBlock = raw.slice(gardenAt, gearAt);
  ok("★歯車は、おうちの いちばん上にある",
    !/<CharacterHome/.test(gardenBlock) && !/<WardrobePanel/.test(gardenBlock),
    "羊や着せかえより後ろに来ています");
  ok("★右に寄せてある", /justify-end[\s\S]{0,600}<Settings size=/.test(raw));
  // ★ホームからは、外れていること（★2か所に置かないこと）
  ok("★歯車は、1つだけ", (raw.match(/<Settings size=/g) || []).length === 1);
}

console.log("■ 歯車の作り");
ok("歯車の絵を使っている", /<Settings size=/.test(code));
// ★★絵だけでは、★何が開くのか分かりません。
ok("★字も添えている", /<Settings[\s\S]{0,120}\{t\("tabMore"\)\}/.test(code));
ok("読み上げの名前がある", /aria-label=\{`\$\{t\("tabMore"\)\}を開く`\}/.test(src));
// ★指で押せる大きさ（44）を守ること。
ok("押せる大きさがある", /minHeight: 44[\s\S]{0,400}<Settings/.test(src));

console.log("■ レッスンについて");
ok("★レッスンは、帯に固定で入っている", keys.includes("lesson"));
// ★★条件つきの差しこみは、もうしないこと。
ok("条件つきの差しこみを、やめている",
  !/if \(tab\.key === "garden" && hasLessonTab\)/.test(code));
// ★★教室に入っていない方に、空の画面を見せないこと。
//   ★招待コードの入力は「もっと」の中にあり、そのままでは見つかりません。
ok("★何もない方に、案内を出している",
  /先生や教室とつながると、レッスンの予定がここに出ます。/.test(code));
ok("★入口が、押せるようになっている", /招待コードを入れる/.test(code));
// ★★勧誘しないこと。★つながらなくてよい、と書いてあること。
ok("★つながらなくてよい、と書いてある",
  /つながらなくても、記録も分析も/.test(code));

console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
process.exit(failed === 0 ? 0 : 1);
