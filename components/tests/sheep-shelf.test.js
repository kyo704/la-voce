// ============================================================================
// たな ── 歌ってきたもの（★見本 J04）── 見張り
//
//   ★出どころ docs/design/pack-final/screens/J04-たな.html / .txt / .notes.md
//
//   ★★何を 見張るか
//     ① 見本の 3行に なる（曲名／作曲家・役／はじめて・日数と回数）
//     ② 数えるのは 日数と 回数だけ（★出来・点数・順位を 出さない）
//     ③ 「記録した日」は ★日の数 で、★回数では ない
//     ④ 0回を「0回」と 書かない（★見本は「なし」）
//     ⑤ 古い順（★歌ってきた 道の 順）
//     ⑥ 数え方が 1か所（★画面が 自分で 数えていない）
//     ⑦ 4つの 札が ぜんぶ 押せる
// ============================================================================

const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) console.log("  ok  " + label);
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const load = async (...parts) => {
    const src = readRaw(...parts)
      .replace(/from "@\/lib\/([a-zA-Z0-9]+)"/g, (m, n) => `from "${
        "file://" + path.join(__dirname, "..", "..", "lib", n + ".js")}"`);
    return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  };
  const R = await load("lib", "repertoireLog.js");

  // ★★1日に 2度 歌った 日を 1つ 入れます。★count と days が 分かれる ことの 確かめです。
  const act = (kind, names) => ({ kind, items: names.map((n) => ({ repertoireName: n })) });
  const entries = {
    "2026-04-12": { activities: [act("練習", ["ラ・ボエーム"])] },
    "2026-04-13": { activities: [act("練習", ["ラ・ボエーム"]), act("練習", ["ラ・ボエーム"])] },
    "2026-06-03": { activities: [act("練習", ["冬の旅"])] },
    "2026-07-20": { activities: [act("本番", ["ラ・ボエーム"])] },
    "2026-07-21": { activities: [act("本番", ["ラ・ボエーム"])] }
  };

  console.log("① 数え方");
  const log = R.repertoireLog(entries);
  const bo = log.find((x) => x.name === "ラ・ボエーム");
  ok(bo.count === 5, "★書かれた 回数は 5（1日に 2度 歌った 日が ある）");
  ok(bo.days === 4, "★書いた 日は 4（★回数では ない）");
  ok(bo.firstDate === "2026-04-12", "★はじめて 記録した日");
  ok(bo.lastDate === "2026-07-21", "★最後の 日は これまでどおり");
  ok(bo.kinds["本番"] === 2, "★本番は 2回");

  console.log("② 見本の 1枚ぶん");
  const rows = R.shelfRows(entries, {
    "ラ・ボエーム": { composer: "プッチーニ", positionIn: "ミミ" },
    "冬の旅": { composer: "シューベルト" }
  });
  ok(rows.length === 2, "★2曲");
  ok(rows[0].name === "ラ・ボエーム", "★古い順（4月が 先）");
  ok(rows[0].sub === "プッチーニ　ミミ", "★作曲家と 役を 全角の あきで つなぐ");
  ok(rows[1].sub === "シューベルト", "★役が 無ければ 作曲家だけ");
  ok(rows[0].firstText === "はじめて 記録した日　2026年4月12日", "★はじめての 行");
  ok(rows[0].countText === "記録した日　4日　／　本番　2回", "★日数と 回数の 行");

  console.log("③ 本番が 無い 曲");
  ok(rows[1].countText === "記録した日　1日　／　本番　なし", "★0回を「なし」と 書く");
  ok(!/0回/.test(rows.map((r) => r.countText).join("")), "★「0回」と 書いていない");

  console.log("④ 曲の 台帳が 空でも 落ちない");
  const bare = R.shelfRows(entries, null);
  ok(bare.length === 2 && bare[0].sub === "", "★作曲家が 無ければ、その行を 出さない");
  ok(R.shelfRows(null, {}).length === 0, "★記録が 無ければ 0");

  console.log("⑤ 年の 出し方");
  ok(R.longDate("2026-04-12") === "2026年4月12日", "★たなでは 年を 出す");
  ok(R.shortDate("2026-04-12") === "4/12", "★ノートは これまでどおり 年を 出さない");

  console.log("⑥ 出来・点数・順位を 出さない");
  const screen = readCode("components", "SheepShelf.jsx");
  ["点数", "順位", "ランキング", "評価", "上手", "よく歌"].forEach((w) => {
    ok(!screen.includes(w), `★「${w}」が 画面に 出ない`);
  });
  [/あと\s*[0-9０-９]/, /残り\s*[0-9０-９]/].forEach((re) => {
    ok(!re.test(screen), `★「${re.source}」の 形が 出ない`);
  });

  console.log("⑦ 画面は 数えない");
  // ★★数え方が 2か所に 分かれると、★ノートと たなで ちがう 数が 出ます。
  ok(!/repertoireLog|\.filter\(|\.reduce\(/.test(screen), "★画面の 中で 数えていない");
  ok(/rows\.map/.test(screen), "★渡された ものを 並べるだけ");

  console.log("⑧ 4つの 札");
  const hd = await load("lib", "homeDrawer.js");
  ok(hd.SEG_TABS.length === 4, "★札は 4つ");
  ok(hd.SEG_TABS.map((t) => t.label).join("／") === "ながめる／おうち／したく／たな",
    "★見本の 4つと 同じ 言葉・同じ 順");
  const vt = readCode("components", "VocalTracker.jsx");
  // ★★押せない 札を 置かないこと。★4つの 鍵が すべて 行き先を 持つこと。
  const seg = vt.slice(vt.indexOf("<Seg items={SEG_TABS}"), vt.indexOf("<Seg items={SEG_TABS}") + 900);
  ok(/setHomeState\(SHELF\)/.test(seg), "★たな に 行ける");
  ok(/setHomeState\(VIEW\)/.test(seg), "★ながめる に 行ける");
  ok(/setDrawerCat\(k === "home" \? "place" : "wear"\)/.test(seg),
    "★おうち と したく が、別の 棚を 開ける");
  ok(hd.STATES.includes(hd.SHELF), "★たな が 状態の 一覧に ある");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
