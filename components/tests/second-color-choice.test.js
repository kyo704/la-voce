// ============================================================================
// 柄の 2色目を 選び直す（2026-09-08 夜）
//
//   ★出どころ second-color-table.json（second-color-2026-09-08-final2）の override
//
//   ★★守ること
//     ・★既定は 全員 同じ（★表のとおり）。★例外は 1件も ない
//     ・★選び直せるのは、★門の名簿に ある方だけ（★名簿が空なら 誰にも 出さない）
//     ・★対比 2.2 未満の色は、★押せない灰色（★消さない）
//     ・★「もとにもどす」が いつでも ある
//     ・★選ばなければ、★これまでと 1画素も 変わらない
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
  const tbl = fs.readFileSync(path.join(ROOT, "docs", "assets", "second-color-table.json"), "utf-8");
  const cc = fs.readFileSync(path.join(ROOT, "lib", "clothColors.js"), "utf-8");
  const src = fs.readFileSync(path.join(ROOT, "lib", "secondColorChoice.js"), "utf-8")
    .replace('import table from "@/docs/assets/second-color-table.json";', "const table = " + tbl + ";")
    .replace('import { mayChooseSecondColorByTier } from "@/lib/tiers";',
      fs.readFileSync(path.join(ROOT, "lib", "tiers.js"), "utf-8").replace(/^export /gm, ""))
    .replace('import { CLOTH_COLORS } from "@/lib/clothColors";',
      "const CLOTH_COLORS = " + JSON.stringify(
        [...cc.matchAll(/\{\s*key:\s*"([a-zA-Z0-9_]+)"\s*,\s*name:\s*"([^"]+)"/g)]
          .map((m) => ({ key: m[1], name: m[2] }))) + ";");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ ★表");
  ok("★版は final2", m.TABLE_VERSION === "second-color-2026-09-08-final2");
  ok("★24色ぶん ある", Object.keys(m.SECOND_ALLOWED).length === 24);
  ok("★どの色も、1つ以上 選べる",
    Object.values(m.SECOND_ALLOWED).every((v) => v.length > 0));
  // ★★鍵に 直せていること（★名前のままなら、画面で 引けません）。
  ok("★★鍵に 直っている（名前のままでない）",
    Object.keys(m.SECOND_ALLOWED).every((k) => /^[a-z0-9_]+$/i.test(k))
    && Object.values(m.SECOND_ALLOWED).every((v) => v.every((x) => /^[a-z0-9_]+$/i.test(x))));

  console.log("■ ★選べる・選べない");
  const first = Object.keys(m.SECOND_ALLOWED)[0];
  ok("★選べる色は 通る", m.isSecondAllowed(first, m.SECOND_ALLOWED[first][0]));
  ok("★選べない色は 通らない", !m.isSecondAllowed(first, "__ないいろ__"));
  ok("★知らない1色目なら、空", m.allowedSecondKeys("__ない__").length === 0);
  ok("★1色目が 無ければ、空", m.allowedSecondKeys(null).length === 0);

  console.log("■ ★誰が 選べるか");
  ok("★★名簿が 空なら、誰にも 出さない",
    m.mayChooseSecondColor("abc", {}) === false
    && m.mayChooseSecondColor("abc", { NEXT_PUBLIC_SECOND_COLOR_USER_IDS: "" }) === false);
  ok("★名簿に ある方だけ",
    m.mayChooseSecondColor("abc", { NEXT_PUBLIC_SECOND_COLOR_USER_IDS: "abc,def" }) === true
    && m.mayChooseSecondColor("zzz", { NEXT_PUBLIC_SECOND_COLOR_USER_IDS: "abc,def" }) === false);

  console.log("■ ★覚え方");
  const e0 = {};
  const e1 = m.setSecond(e0, "top_01", "haiiro");
  ok("★選んだものが 入る", m.chosenSecond(e1, "top_01") === "haiiro");
  ok("★同じものを もう一度なら、既定に もどる",
    m.chosenSecond(m.setSecond(e1, "top_01", "haiiro"), "top_01") === null);
  ok("★もとにもどす", m.chosenSecond(m.clearSecond(e1, "top_01"), "top_01") === null);
  // ★★1色目にも、着ているものにも 触らないこと。
  const e2 = m.setSecond({ clothColors: { top_01: "enji" }, wardrobe: { top: "top_01" } }, "top_01", "kinari");
  ok("★★1色目と、着ているものに 触っていない",
    e2.clothColors.top_01 === "enji" && e2.wardrobe.top === "top_01");

  console.log("■ ★出し方");
  const row = readCode("components", "ClothSecondColorRow.jsx");
  ok("★押せない色は、灰色にする（★消さない）",
    /disabled=\{dead\}/.test(row) && /grayscale\(1\)/.test(row));
  ok("★もとにもどすが ある", /もとに もどす/.test(row));
  const vt = readCode("components", "VocalTracker.jsx");
  ok("★柄もの ＋ 名簿の方 のときだけ",
    /maySecondColor && hasPattern\(pickedItem\.key\)/.test(vt));
  ok("★1色目を えらんでいないときは 出さない",
    /&& \(characterEquipped\.clothColors \|\| \{\}\)\[pickedItem\.key\]/.test(vt));
  // ★★選ばなければ、これまでと 変わらないこと。
  const pc = readCode("lib", "patternColors.js");
  ok("★★選ばなければ、表のとおり", /const k = chosen \|\| secondColorKey\(firstKey\)/.test(pc));
  const cp = readCode("lib", "clothPaint.js");
  ok("★★覚え書きの鍵に、2色目が 入っている",
    /colorKey \+ \(second \? ":" \+ second : ""\)/.test(cp));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
