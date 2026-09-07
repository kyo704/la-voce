// ============================================================================
// 着せかえの、印と絞り込み（2026-09-08）
//
//   ★出どころ assets/wardrobe-v2/lavoce-仕様-着せ替え画面のUI（9月6日）.md §4・§7・§11
//
//   ★★守ること
//     ・★1つだけ選べる絞り込み（★重ねない）
//     ・★「持っていないものを隠す」を作らない（§8）
//     ・★星は、一覧の先頭に集まる（§7）
//     ・★「少しだけ」の段では、よく着るもの4点だけ（§7）
//     ・★回数を、画面に出さない
//     ・★新しい列を、作らない（character_equipped の中に持つ）
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "wardrobeMarks.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const idx = JSON.parse(fs.readFileSync(path.join(ROOT, "docs", "assets", "sheep-items-index.json"), "utf-8"));

  console.log("■ 絞り込みの札（★§4）");
  ok("5つある", m.FILTERS.length === 5);
  ok("「すべて」が先頭", m.FILTERS[0].key === "all");
  // ★★「持っていないものを隠す」を作らないこと（★§8）。
  ok("★「隠す」という札が無い", !m.FILTERS.some((f) => /隠/.test(f.label)));

  console.log("■ 系統（★§4 の第2列）");
  ok("6つある", m.STYLES.length === 6);
  const byName = (n) => idx.items.find((i) => i.name === n);
  ok("和服 → 和風", m.stylesOf(byName("和服・赤（桜）")).includes("wa"));
  ok("スーツ → きれいめ", m.stylesOf(byName("スーツ（紺）")).includes("neat"));
  ok("大鎧 → 時代もの", m.stylesOf(byName("大鎧（源平のころ）")).includes("era"));
  // ★★1点が、2つの系統に入ってよい。★片方に決めないこと。
  ok("★2つに入ることがある", m.stylesOf(byName("もこもこパジャマ")).length === 2);
  // ★★どれにも当たらないものを、★無理に当てないこと。
  const none = idx.items.filter((i) => m.stylesOf(i).length === 0).length;
  ok(`★当てられないものは、空のまま（${none}点）`, none > 0);
  // ★並びは、いつも同じ
  ok("★並びが、いつも同じ",
    JSON.stringify(m.stylesOf(byName("春 うすもものカーディガン"))) === JSON.stringify(["soft", "season"]));

  console.log("■ お気に入り（★§7）");
  let eq = {};
  ok("はじめは、空", m.favoritesOf(eq).length === 0);
  eq = m.toggleFavorite(eq, "a");
  ok("入る", m.isFavorite(eq, "a"));
  eq = m.toggleFavorite(eq, "a");
  ok("もう一度で、外れる", !m.isFavorite(eq, "a"));
  // ★★星は、★先頭に集まること（★§7）。★落とさないこと。
  const sorted = m.favoritesFirst([{ key: "a" }, { key: "b" }, { key: "c" }], { favorites: ["c"] });
  ok("★星が先頭に来る", sorted[0].key === "c");
  ok("★1点も落ちていない", sorted.length === 3);

  console.log("■ よく着るもの（★§7・直近30日）");
  let w = {};
  w = m.countWear(w, "x", "2026-09-08");
  w = m.countWear(w, "x", "2026-09-08");
  w = m.countWear(w, "y", "2026-07-01");
  const recent = m.oftenWorn(w, { todayISO: "2026-09-08", limit: 1 });
  ok("★30日のうちのものが、先に来る", recent[0] === "x", recent.join(","));
  // ★★30日で足りなければ、それより前も足すこと（★空の棚を出さない）。
  ok("★足りなければ、古いものも足す",
    m.oftenWorn(w, { todayISO: "2026-09-08", limit: 4 }).includes("y"));
  // ★★古い形（数だけ）も、読めること。
  ok("★古い形も読める", m.oftenWorn({ wearCounts: { a: 5, b: 2 } }, { limit: 1 })[0] === "a");
  // ★★数を、返さないこと。
  ok("★返るのは鍵だけ（数は返らない）",
    m.oftenWorn(w, { limit: 4 }).every((k) => typeof k === "string"));
  // ★★lib が、自分で今日を作らないこと。
  const libCode = readCode("lib", "wardrobeMarks.js");
  ok("★lib が、自分で今日を作っていない", !/new Date\(\)|Date\.now\(\)/.test(libCode));

  console.log("■ ★新しい列を、作っていない（★§E）");
  ok("★character_equipped の中に持っている",
    /character_equipped/.test(src) && !/alter table/i.test(src));
  const sqls = fs.readdirSync(path.join(ROOT, "supabase"))
    .filter((f) => f.includes("2026-09-08") && /wardrobe|着せかえ|お気に入り/.test(f));
  ok("★そのための SQL を、作っていない", sqls.length === 0, sqls.join(", "));

  console.log("■ 画面（★§4・§7）");
  const wp = readCode("components", "WardrobePanel.jsx");
  ok("★絞り込みは、1つだけ選べる", /setFilter\(on && f\.key !== "all" \? "all" : f\.key\)/.test(wp));
  ok("★星を先頭に集めている", /favoritesFirst\(filtered, marks\)/.test(wp));
  ok("★着たときに数えている", /countWear\(marks, item\.key, todayISO\)/.test(wp));
  // ★★脱ぐときは、数えないこと。
  ok("★脱ぐときは、数えない", /wearing\[item\.slot\] !== item\.key/.test(wp));
  ok("★「少しだけ」の段で、4点に絞る", /snap === "peek"/.test(wp));
  // ★★黙って減らさないこと。
  ok("★絞っていることを、書いている", wp.includes("よく着るものだけを出しています"));
  ok("★戻り方も、書いている", wp.includes("上へ引き上げると、全部 出ます"));
  // ★★回数を、画面に出さないこと。
  for (const pat of [/[0-9０-９]\s*回\s*着/, /wearCounts\[[^\]]*\]\s*\}/]) {
    ok(`★回数を出していない（${pat}）`, !pat.test(wp));
  }

  console.log("■ 見本（サムネ）が、軽いこと");
  const sd = readCode("components", "SheepDressed.jsx");
  ok("★見本では、動きの定義を作らない", /\{!thumb && \(\s*<style>/.test(sd));
  ok("★見本では、脚を描かない", /const showLegs = !thumb/.test(sd));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
