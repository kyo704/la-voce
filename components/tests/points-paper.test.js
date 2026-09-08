// ============================================================================
// v3追補 ── みせかた・うすく・のこり◆てん・てんの紙（2026-09-08 夜）
//
//   ★出どころ woolsong-仕様-おうち画面v3追補・ショップと説明とてん（9月8日）
//
//   ★★守ること
//     ・★店を 作らない（★同じ棚に 混ぜる）
//     ・★既定は「もっているもの」
//     ・★まだの品は 不透明度 45%。★錠前を 出さない
//     ・★てんは「買う場面」にだけ 出す
//     ・★★「あと◆てん」を 書かない（★§8-3②）
//     ・★紙の文は 4行。★事実と違う2つを 直したもの
//     ・★累計の記録日数は、★紙の中に 1行だけ
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  const src = fs.readFileSync(path.join(ROOT, "lib", "homeDrawer.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ ★みせかた（★①）");
  ok("★2つの言葉がある", m.COPY.showOwned === "もっているもの" && m.COPY.showAll === "まだのものも");
  const vt = readCode("components", "VocalTracker.jsx");
  ok("★既定は「もっているもの」", /useState\(false\);/.test(vt) && /drawerShowAll/.test(vt));
  // ★★みせかたは 1つの決めです。★棚と さがすで 2つ持たないこと。
  ok("★棚と さがすが、同じ1つを 指している",
    /show: drawerShowAll \? SHOW_ALL : SHOW_OWNED/.test(vt)
    && /setDrawerShowAll\(\(q\.show \|\| SHOW_ALL\) === SHOW_ALL\)/.test(vt));

  console.log("■ ★うすく（★②）");
  const grid = readCode("components", "DrawerItemGrid.jsx");
  ok("★まだの品は 不透明度 45%", /opacity: owned \? 1 : 0\.45/.test(grid));

  console.log("■ ★てん（★③④）");
  ok("★「のこり ◆てん」の言い方", m.COPY.pointsLeft(142) === "のこり 142てん");
  const dr = readCode("components", "HomeDrawer.jsx");
  // ★★「まだのものも」を 見ているあいだ だけ 出すこと。
  ok("★買う場面にだけ 出す", /showAll && points != null &&/.test(dr));
  // ★★「あと◆てん」を、★どこにも 書かないこと。
  const paper = readCode("components", "PointsPaper.jsx");
  for (const [name, code] of [["lib", readCode("lib", "homeDrawer.js")],
                              ["引き出し", dr], ["紙", paper], ["一覧", grid]]) {
    ok(`★${name}に「あと◯てん」を 書いていない`,
      !/あと\s*[0-9$｛{]/.test(code) && !/もう少しで/.test(code));
  }

  console.log("■ ★てんの紙（★⑤）");
  ok("★4行", m.POINTS_PAPER.lines.length === 4);
  ok("★各25字以内", m.POINTS_PAPER.lines.every((l) => l.length <= 25),
    m.POINTS_PAPER.lines.map((l) => l.length).join(" "));
  // ★★事実と違う2つを、★直してあること。
  const joined = m.POINTS_PAPER.lines.join("");
  ok("★★「自由に選んで買え」と 書いていない", !/自由に選んで買え/.test(joined));
  ok("★★「続けた」と 書いていない（★連続記録の言い方）", !/続けた/.test(joined));
  ok("★「記録をつけた」に なっている", /記録をつけた日に/.test(joined));
  ok("★体調では 変わらない、と 書いてある", /体調の良し悪しでは 変わりません/.test(joined));
  ok("★累計の日数は、紙の中の 1行", m.POINTS_PAPER.days(88) === "これまで 88日 記録しました");
  ok("★とじる が ある", m.POINTS_PAPER.close === "とじる");
  // ★★累計の日数を、★棚に 出さないこと。
  ok("★★累計の日数を、引き出しに 出していない", !/記録しました/.test(dr));
  // ★★ふだんは 出さないこと。★はじめの1回と、★数字を押したときだけ。
  ok("★はじめて開いた日だけ 1回", /pointsPaperShownOnce/.test(vt));
  ok("★数字を押したら 出る", /onPoints=\{\(\) => setPointsPaperOpen\(true\)\}/.test(vt));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
