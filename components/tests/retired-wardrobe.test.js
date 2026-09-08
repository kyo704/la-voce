// ============================================================================
// 棚から下げた 着せかえの品（2026-09-08 夜）
//
//   ★★守ること
//     ・★neck_01／02／03 は、★一覧に 出ないこと
//     ・★でも、★いま着ている方には 出ること（★外せるように）
//     ・★絵も 名簿も、★消していないこと
//     ・★scarf_01〜28 が、★首元として 出ること
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "retiredWardrobe.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ ★下げた品");
  ok("★neck_01／02／03 の 3点", Object.keys(m.RETIRED).length === 3
    && m.isRetired("neck_01") && m.isRetired("neck_02") && m.isRetired("neck_03"));
  ok("★理由が 書いてある", Object.values(m.RETIRED).every((v) => v.includes("scarf")));
  ok("★scarf は 下げていない", !m.isRetired("scarf_01"));

  console.log("■ ★一覧から 外れること");
  const items = [{ key: "neck_01" }, { key: "neck_09" }, { key: "scarf_01" }];
  const out = m.withoutRetired(items, {});
  ok("★下げた品が 消える", out.length === 2 && !out.some((i) => i.key === "neck_01"));
  // ★★着ているときは 残すこと。★でないと、外せなくなります。
  const worn = m.withoutRetired(items, { neck: "neck_01" });
  ok("★★着ているときは 残る（★外せるように）", worn.length === 3);

  console.log("■ ★消していないこと");
  const idx = JSON.parse(fs.readFileSync(
    path.join(ROOT, "docs", "assets", "sheep-items-index.json"), "utf-8"));
  const list = Array.isArray(idx) ? idx : idx.items;
  for (const k of Object.keys(m.RETIRED)) {
    ok(`★${k} は 名簿に 残っている`, list.some((i) => i.key === k));
    ok(`★${k} の 絵も 残っている`,
      fs.existsSync(path.join(ROOT, "public", "sheep", "items", k + ".png")));
  }

  console.log("■ ★マフラー28点");
  const sc = list.filter((i) => i.key.startsWith("scarf_"));
  ok(`★28点ある（いま ${sc.length}）`, sc.length === 28);
  ok("★ぜんぶ 首元", sc.every((i) => i.slot === "neck"));
  ok("★ぜんぶ かんじを 持っている", sc.every((i) => (i.kanji || []).length > 0));
  ok("★柄ものは 14点", sc.filter((i) => i.patterned).length === 14);
  ok("★絵が そろっている", sc.every((i) =>
    fs.existsSync(path.join(ROOT, "public", "sheep", "items", i.key + ".png"))
    && fs.existsSync(path.join(ROOT, "public", "sheep", "cloth", i.key + "_light.png"))
    && fs.existsSync(path.join(ROOT, "public", "sheep", "cloth", i.key + "_dark.png"))));
  ok("★柄ものの 型（mask）も そろっている", sc.filter((i) => i.patterned).every((i) =>
    fs.existsSync(path.join(ROOT, "public", "sheep", "mask", i.key + ".png"))));

  console.log("■ ★画面で 判じていないこと");
  const di = readCode("lib", "drawerItems.js");
  ok("★一覧を作る側が、lib を 見ている", /withoutRetired\(/.test(di));
  const vt = readCode("components", "VocalTracker.jsx");
  ok("★画面に、下げた品の 鍵を 書いていない", !/neck_01/.test(vt));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
