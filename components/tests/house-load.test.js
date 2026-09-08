// ============================================================================
// おうち画面の 出かた（2026-09-09）
//
//   ★出どころ 実機のご報告
//     ★「脚だけ 先に 出て、体と服が あとから 出る」
//     ★「装備の返事が 来ないと、服が いつまでも 出ない」
//
//   ★★守ること
//     ・★前に着ていた姿で、★先に 描くこと
//     ・★ぜんぶ 描ける状態に なるまで、★出さないこと（★脚だけを 見せない）
//     ・★1枚 読めなくても、★止まらないこと
//     ・★覚えは この端末の中だけ。★サーバへ 送らないこと
//     ・★保存できてから 覚えること（★失敗した姿を 覚えない）
//     ・★動かすのは かたまりの外側だけ（★1枚ずつ 動かさない）
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "equippedCache.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ ★① 前の姿で、先に 描く");
  ok("★画面が 無ければ null", m.recallEquipped("abc") === null);
  ok("★人が 分からなければ null", m.recallEquipped(null) === null);
  ok("★書けなくても 落ちない", (() => { try { m.rememberEquipped("a", {}); return true; } catch (e) { return false; } })());
  const vt = readCode("components", "VocalTracker.jsx");
  ok("★はじめから 前の姿を 使っている",
    /useState\(\(\) => recallEquipped\(userId\) \|\| \{\}\)/.test(vt));
  ok("★返事が 来たら、覚えを 新しくする",
    /rememberEquipped\(userId, data\.character_equipped \|\| \{\}\)/.test(vt));
  // ★★保存できてから 覚えること。★失敗した姿を 覚えないため。
  ok("★★保存できてから 覚えている",
    /setCharacterDirty\(false\);[\s\S]{0,400}rememberEquipped\(userId, characterEquipped\)/.test(vt));
  // ★★サーバへ 送らないこと。
  const cache = readCode("lib", "equippedCache.js");
  ok("★★サーバへ 送っていない",
    !/supabase|fetch\(|axios/.test(cache) && /localStorage/.test(cache));
  ok("★人ごとに 分けている", /KEY_PREFIX \+ String\(userId/.test(cache));

  console.log("■ ★② ぜんぶ そろってから 出す");
  const sd = readCode("components", "SheepDressed.jsx");
  ok("★描ける状態に なるまで 待つ", /useLayersReady\(/.test(sd));
  ok("★decode\\(\\) を 待っている", /im\.decode\(\)\.then\(done, done\)/.test(sd));
  ok("★★1枚 読めなくても 止まらない", /im\.onerror = \(\) => done\(\);/.test(sd));
  // ★★消さずに、見えなくするだけ（★出た瞬間の がたつきを 避ける）。
  ok("★★消さずに 見えなくしている", /opacity: ready \? 1 : 0/.test(sd));
  ok("★見本では 待たない", /useLayersReady\(layers\.map\(\(l\) => l\.src\)\.filter\(Boolean\), !thumb\)/.test(sd));

  console.log("■ ★⑥ 動かすのは、かたまりの外側だけ");
  // ★★1枚ずつ 動かすと、★服と体が ずれます。
  const layerStyle = sd.slice(sd.indexOf("<ClothImage"), sd.indexOf("<ClothImage") + 900);
  ok("★★重ねる絵に、動きを 付けていない", !/animation:/.test(layerStyle));
  ok("★かたまりの外側で 動かしている", /animation: travelAnim/.test(sd));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
