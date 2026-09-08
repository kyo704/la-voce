// ============================================================================
// さがす（絞り込み）── 2026-09-08
//
//   ★★守ること
//     ・★かんじは 6つ。★増やさないこと
//     ・★「けす」が いつでも 押せること（★絞ったまま 戻れなくならないため）
//     ・★数を 表に 出さないこと（★「12点 見つかりました」と 書かない）
//     ・★0件になる かんじは、★押せない灰色に すること
//     ・★いろの絞り込みは、★持っている品にだけ 当てること
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "drawerSearch.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ ★かんじと、はじめの状態");
  ok("★かんじは 6つ", m.KANJI.length === 6);
  ok("★何も絞っていない状態が、空", m.isEmptyQuery(m.emptyQuery()));
  ok("★1つ選ぶと、空でなくなる",
    !m.isEmptyQuery(m.toggleKanji(m.emptyQuery(), "ゆるい")));
  ok("★もう一度押すと、外れる",
    m.isEmptyQuery(m.toggleKanji(m.toggleKanji(m.emptyQuery(), "ゆるい"), "ゆるい")));

  console.log("■ ★数を、出していないこと");
  // ★★禁じた言葉の検めは、★注釈を外してから 見ること（★CLAUDE.md）。
  //   ★★仕様は 注釈の中に 引いてあります。
  //     ★外さずに 見ると、★自分の説明で 落ちます。★この罠は 3度目です。
  const code = readCode("components", "DrawerSearch.jsx");
  ok("★「◯点 見つかりました」と 書いていない", !/見つかりました/.test(code));
  ok("★「けす」が ある", /COPY\.clear/.test(code));

  console.log("■ ★0件になる かんじ／いろの当て方（★2026-09-08 夜・Opus の決め）");
  {
    const idx = JSON.parse(fs.readFileSync(
      path.join(ROOT, "docs", "assets", "sheep-items-index.json"), "utf-8"));
    const list = Array.isArray(idx) ? idx : idx.items;
    // ★★Opus が 名指しした 4本と、★数えた結果が 合うこと。
    //   ★★決め打ちの一覧を 持ちません。★数えます。★品が増えたら 追いつきます。
    const off = (slot) => m.disabledKanji(list.filter((i) => i.slot === slot));
    ok("★ぼうし × 和 は 0件", off("hat").includes("和"));
    ok("★くつ × 和 は 0件", off("shoes").includes("和"));
    ok("★めもと × 和 は 0件", off("eyes").includes("和"));
    ok("★めもと × あたたかい は 0件", off("eyes").includes("あたたかい"));
    // ★★それ以外を、★勝手に 塞がないこと。
    ok("★ぼうし で 塞ぐのは 和 だけ", off("hat").length === 1, off("hat").join("・"));
    ok("★くつ で 塞ぐのは 和 だけ", off("shoes").length === 1, off("shoes").join("・"));
    ok("★めもと で 塞ぐのは 2つだけ", off("eyes").length === 2, off("eyes").join("・"));
    ok("★首元は、1つも 塞がない", off("neck").length === 0, off("neck").join("・"));

    // ★★いろは、★持っている品にだけ 当てること。
    //   ★★まだの品は 24色 どれにでも なれるので、色で絞る意味が ありません。
    const items = [{ key: "a", kanji: [] }, { key: "b", kanji: [] }];
    const ctx = { owned: ["a"], colorOf: () => "enji" };
    const got = m.applySearch(items, { text: "", color: "enji", kanji: [], show: m.SHOW_ALL }, ctx);
    ok("★★まだの品は、いろで 絞ったとき 出さない",
      got.length === 1 && got[0].key === "a");
    const gui = readCode("components", "DrawerSearch.jsx");
    ok("★いろを押すと、みせかたが「もっているもの」になる",
      /color: c\.key, show: SHOW_OWNED/.test(gui));
    ok("★0件の かんじは、押せない", /disabled=\{dead\}/.test(gui));
  }

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
