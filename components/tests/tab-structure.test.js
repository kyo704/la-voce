// ============================================================================
// 下の帯（タブ）の作り（2026-09-07・案い）
//
//   ★★坂本さんの決め：★「もっと」を、下の帯から外す。
//     ★入口は2つ、★中身はちがう（★2026-09-07・Opus の裁定）。
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
// ★★2026-09-08、★第1便（§1-2）で「もっと」を TABS から外しました。
//   ★★もともと displayTabs が more を除いていたので、★帯には出ていませんでした。
//     ★TABS に残っていた1行は、★どこからも描かれない ★死んだ値でした。
//   ★入口は「きょう」の右上の歯車です。★条件なしで出ています。
// ★★レッスンは、★まだ外しません。★第2便で「きょう」の帯ができてからです。
//   ★いま外すと、★教室に入っていない方から、★入口が1つも無くなります。
// ★★2026-09-09、★レッスンを 下タブから 外しました（★第1便・§9）。
//   ★★見本（2026-09-09 の 11画面）も、★5つで 固定と 書いています。
ok("並びは home / today / analysis / lesson / garden / notes",
  keys.join(",") === "home,today,analysis,lesson,garden,notes", keys.join(","));
// ★★「もっと」を外しても、★行き先が消えていないこと。
ok("★もっと を開く道が、残っている", /setActiveTab\("more"\)/.test(src));
ok("★歯車から開ける", /aria-label=\{`\$\{t\("tabMore"\)\}を開く`\}/.test(src));
// ★★おうち（garden）を、消さないこと。
//   ★羊とおうちは、ここからしか行けません。
ok("★おうち（garden）が入っている", keys.includes("garden"));

console.log("■ 「もっと」は、帯から外れているか");
// ★★2026-09-09、★門で 帯を 選ぶ形に しました（★名簿の方だけ 5つ）。
//   ★★「more を 除く」ことは 変わりません。★選び方が 増えただけです。
ok("帯を作るとき、more を除いている",
  /\(layoutV2 \? TABS_V2 : TABS\)\.filter\(\(tb\) => tb\.key !== "more"\)/.test(code));
// ★★画面そのものは、消していないこと。★入口が変わっただけです。
ok("★「もっと」の画面は、消していない", /activeTab === "more"/.test(code));
ok("歯車から開く", /setActiveTab\("more"\)/.test(code));
// ★★入口は2つ、★中身はちがう（★2026-09-07・Opus の裁定）。
//   ホーム … アプリ全体（設定・アカウント・書き出し・同意の撤回・プラン・学ぶ）
//   おうち … 家の中だけ（着せかえ・置きかた・お店）
//   ★★同じ絵を2か所に置かないこと。★どちらが何か、分からなくなります。
{
  const raw = readRaw("components", "VocalTracker.jsx");
  const homeAt = raw.indexOf('activeTab === "home"');
  // ★★2026-09-08 夜、★ひつじの画面を「捨てない」形に しました（★案A）。
  //   ★★そのため activeTab === "garden" が、★2か所に 出ます。
  //     ① 1度開いたかを 覚える useEffect（★画面の ずっと前）
  //     ② 画面そのもの（★{wardrobeMountedOnce && ( … )}）
  //   ★★ここで 欲しいのは ② です。★はじめの1つでは ありません。
  //     ★はじめの1つを 取ると、★前後の 比べが すべて 狂います。
  const gardenAt = raw.indexOf("{wardrobeMountedOnce && (");
  const gearAt = raw.indexOf("<Settings size=");

  ok("★歯車は、1つだけ", (raw.match(/<Settings size=/g) || []).length === 1);
  ok("★歯車は、ホームの中にある", homeAt > 0 && gearAt > homeAt && gearAt < gardenAt,
    `ホーム ${homeAt} / 歯車 ${gearAt} / おうち ${gardenAt}`);

  // ★★アプリ全体の設定が、★おうちの奥に無いこと。
  //   ★同意の撤回と、記録の書き出しは、★法で求められる道です。
  //   ★プライバシーポリシーも「もっと ＞ …」と案内しています。
  const gardenBlock = raw.slice(gardenAt, gardenAt + 4000);
  // ★★2026-09-10、★見本 A07（design.zip）に、★ひつじの 画面にも 歯車が ありました。
  //   ★★もとの 言い分は「★アプリ全体の 設定が、★おうちの 奥に 無いこと」でした。
  //     ★つまり、★ホームから 行けなく なっていないこと、です。
  //     ★★おうちにも 入口が ある のは、★埋めることでは ありません。★増やすことです。
  //   ★★同意の 撤回と 書き出しは、★法で 求められる 道です。
  //     ★★だから 見るべきは「★ホームから 行けるか」です。★そちらを 確かめます。
  ok("★ホームから「もっと」へ 行ける", /setActiveTab\("more"\)/.test(raw.slice(homeAt, gardenAt)));
  ok("★おうちの 歯車は、★同じ「もっと」へ 行く（★別の 設定を 作っていない）",
    !/setActiveTab\("settings"|activeTab === "settings"/.test(gardenBlock));

  // ★おうちの側は、家の中の行き先だけ
  for (const label of ["着せかえ", "置きかた", "お店"]) {
    ok(`おうちに「${label}」の入口がある`, gardenBlock.includes(label));
  }
  // ★★行き先が、実際にあること。★押しても何も起きない、を作らないこと。
  const home = readRaw("components", "CharacterHome.jsx");
  for (const [id, where] of [["wardrobe-anchor", raw], ["room-anchor", home], ["shop-anchor", home]]) {
    ok(`目印「${id}」が、実際に置かれている`, where.includes(`id="${id}"`));
  }
  // ★★無い画面への入口を、作らないこと。
  //   ★「記念のものの棚」は、2026-09-07 の時点で、画面がありません。
  // ★★禁じ手の検査は、★必ずコメントを剥がしてから（CLAUDE.md の罠）。
  //   ★2026-09-07、★「記念のものの棚は入れていません」という
  //     ★自分の説明文で落ちました。★今日4度目です。
  const gardenCode = readCode("components", "VocalTracker.jsx")
    .slice(readCode("components", "VocalTracker.jsx").indexOf('activeTab === "garden"'));
  ok("★無い行き先（記念のものの棚）を出していない",
    !gardenCode.slice(0, 3000).includes("記念のもの"));
}

console.log("■ 歯車の作り");
ok("歯車の絵を使っている", /<Settings size=/.test(code));
// ★★絵だけでは、★何が開くのか分かりません。
ok("★字も添えている", /<Settings[\s\S]{0,120}\{t\("tabMore"\)\}/.test(code));
ok("読み上げの名前がある", /aria-label=\{`\$\{t\("tabMore"\)\}を開く`\}/.test(src));
// ★指で押せる大きさ（44）を守ること。
ok("押せる大きさがある", /minHeight: 44[\s\S]{0,400}<Settings/.test(src));

console.log("■ レッスンについて");
  // ★★2026-09-09、★新しい帯（5つ）は、★名簿の方だけです（★お指図）。
  //   ★★一般の 38人には、★これまでどおり 6つ 出ます。★1つも 変えません。
  //   ★見るのは、★一般の方の TABS です（★TABS_V2 では ありません）。
ok("★★一般の方の 帯には、レッスンが 残っている", keys.includes("lesson"));
// ★★2026-09-10、★見本の 並びに 合わせて 書き方を 変えました。
//   ★確かめるのは 書き方では なく、★結果です。
ok("★名簿の方は、外れている（TABS_V2）",
  /TABS_V2_ORDER = \["home", "today", "analysis", "notes", "garden"\]/.test(src)
  && !/TABS_V2_ORDER = \[[^\]]*"lesson"/.test(src));
// ★★外した先が、必ず在ること。★出口のない画面を 作らないこと。
ok("★レッスンを開く道が、残っている", /setActiveTab\("lesson"\)/.test(src));
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
