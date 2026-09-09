#!/usr/bin/env node
// ============================================================================
// 同意の 版と 文面（2026-09-09）
//
//   ★出どころ docs/opus/woolsong-裁定-分析機能へのFableの査読（9月9日・夜）.md §4-1
//            坂本さんのお決め（2026-09-09）
//              「①同意文から病名（逆流）を外す ②版を上げる
//                ③既存の同意者の記録は そのまま残す（取り上げない原則）」
//
//   ★★確かめること
//     ① 同意の文に、病名が 1つも 無いこと。
//     ② 版が 上がっていること。★1か所だけで 決まっていること。
//     ③ ★これまでの記録を 書き換える道が、★1つも 無いこと。
//     ④ 版を 上げても、★これまでの方に 再同意を 求めないこと。
//     ⑤ 取る中身が 増えても 減っても いないこと。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

(async () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "consent.js"), "utf8");
  const c = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const raw = readRaw("lib", "consent.js");

  console.log("=== ① 同意の文に 病名が 無い ===");
  const texts = c.CONSENT_PURPOSES.map((p) => p.text + " " + p.label);
  ["逆流", "逆流性食道炎", "咽喉頭逆流", "LPR", "疑い", "診断"].forEach((w) => {
    const hit = texts.filter((x) => x.includes(w));
    t(hit.length === 0, `「${w}」が 同意の文に 無い${hit.length ? "：" + hit[0].slice(0, 40) : ""}`);
  });

  console.log("\n=== ② 版 ===");
  t(c.CONSENT_POLICY_VERSION === "ja-2026-09-v1",
    `版は ja-2026-09-v1（得た値: ${c.CONSENT_POLICY_VERSION}）`);
  // ★★版を 決める所は、★1か所だけ（★昔、2か所あって 食い違いました）
  const defs = [];
  ["lib", "components", "app"].forEach((d) => {
    const walk = (p) => {
      fs.readdirSync(p, { withFileTypes: true }).forEach((e) => {
        const f = path.join(p, e.name);
        if (e.isDirectory()) { if (e.name !== "node_modules" && e.name !== "tests") walk(f); return; }
        if (!/\.(js|jsx)$/.test(e.name)) return;
        if (/CONSENT_POLICY_VERSION\s*=\s*"/.test(fs.readFileSync(f, "utf8"))) defs.push(f);
      });
    };
    const base = path.join(__dirname, "..", "..", d);
    if (fs.existsSync(base)) walk(base);
  });
  t(defs.length === 1, `★版を決める所は 1か所だけ（${defs.length}か所：${defs.join(", ")}）`);

  console.log("\n=== ③ これまでの記録を 書き換えない ===");
  // ★★同意の行を まとめて 更新する道が、★1つも 無いこと
  const all = [];
  const walk2 = (p) => {
    fs.readdirSync(p, { withFileTypes: true }).forEach((e) => {
      const f = path.join(p, e.name);
      if (e.isDirectory()) { if (e.name !== "node_modules") walk2(f); return; }
      if (/\.(js|jsx|sql)$/.test(e.name)) all.push(f);
    });
  };
  ["lib", "components", "app", "supabase"].forEach((d) => {
    const base = path.join(__dirname, "..", "..", d);
    if (fs.existsSync(base)) walk2(base);
  });
  const rewriters = all.filter((f) => {
    if (/tests\//.test(f)) return false;
    const body = fs.readFileSync(f, "utf8");
    return /update\s+public\.consent_records|from\("consent_records"\)[\s\S]{0,120}\.update\(/.test(body);
  });
  t(rewriters.length === 0,
    `★同意の記録を 書き換える道が 無い${rewriters.length ? "：" + rewriters.join(", ") : ""}`);
  const del = all.filter((f) => {
    if (/tests\//.test(f)) return false;
    const body = fs.readFileSync(f, "utf8");
    return /delete\s+from\s+public\.consent_records/i.test(body);
  });
  t(del.length === 0, "★同意の記録を 消す道も 無い（★取り上げない）");

  console.log("\n=== ④ 版を上げても、再同意を 求めない ===");
  const vt = readCode("components", "VocalTracker.jsx");
  // ★★版を くらべて 画面を 出す、という 書き方が 無いこと
  t(!/consent_policy_version\s*!==\s*CONSENT_POLICY_VERSION/.test(vt),
    "★版を くらべて 同意画面を 出していない");
  t(!/CONSENT_POLICY_VERSION\s*!==\s*profile/.test(vt), "★逆向きの くらべ方も していない");

  console.log("\n=== ⑤ 取る中身は 変えていない ===");
  ["health.record", "health.cycle", "health.meal_sleep", "research.anonymized"]
    .forEach((k) => t(c.CONSENT_PURPOSES.some((p) => p.key === k), `目的「${k}」が 残っている`));
  const meal = c.CONSENT_PURPOSES.find((p) => p.key === "health.meal_sleep");
  t(/食事の内容と時刻、就寝時刻を保存し/.test(meal.text), "★保存するものは 前と 同じ");
  t(/食事と夜の習慣/.test(meal.text), "★言い方だけを 直した（★§4「食事と 夜の習慣」）");

  console.log("\n=== 版を 上げてよい日か ===");
  // ★★lib/consent.js の 規則：★プライバシーポリシーと 利用規約が 開けること
  ["app/legal/privacy/page.js", "app/legal/terms/page.js"].forEach((f) => {
    t(fs.existsSync(path.join(__dirname, "..", "..", f)), `★${f} が ある`);
  });
  t(/href="\/legal\/privacy"/.test(readRaw("components", "VocalTracker.jsx")), "★同意の画面から 開ける");
  t(/href="\/legal\/terms"/.test(readRaw("components", "VocalTracker.jsx")), "★利用規約も 開ける");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
