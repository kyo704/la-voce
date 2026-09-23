#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★機能の 切り替え ── ★判じるのは `lib/featureOn.js` だけ か
//
//   ★出どころ 裁定176 ／ sql/30 ／ 坂本さんの お決め（2026-09-23）
//   ★★守る こと
//     ① 無い 鍵・読めて いない ときは ★false（★迷ったら 閉じる）
//     ② 画面が 台帳に 直に 尋ねて いない（★判じを 2か所に 置かない）
//     ③ 台帳の 側の 道が ある（`my_features` ／ `feature_on`）
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

(async () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "featureOn.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 迷ったら 閉じる");
  const F = Object.freeze({ koen: true, pricing: false });
  t(L.featureOn(F, "koen") === true, "★on の 鍵は true");
  t(L.featureOn(F, "pricing") === false, "★off の 鍵は false");
  t(L.featureOn(F, "nai_kagi") === false, "★★無い 鍵は false");
  t(L.featureOn(null, "koen") === false, "★★読めて いない ときは false");
  t(L.featureOn(undefined, "koen") === false, "★★まだ 読み込み中も false");
  t(L.featureOn({}, "koen") === false, "★★空でも false");
  t(L.featureOn(F, "") === false, "★空の 鍵は false");
  t(L.featureOn(F, null) === false, "★鍵が 無ければ false");
  t(Object.keys(await L.loadFeatures(null)).length === 0, "★台帳が 無ければ 空（＝ぜんぶ 閉じる）");
  t(JSON.stringify(L.hiddenFeatures(F)) === JSON.stringify(["pricing"]), "★隠れて いる 鍵を 並べる");

  console.log("\n② 判じは 1か所");
  // ★★★画面や ほかの lib が、★台帳に 直に 尋ねて いない こと。
  //   ★★`rpc("feature_on")` も `from("feature_flags")` も、★ここ 以外に 置きません。
  const 場所 = [];
  for (const dir of ["components", "lib", "app"]) {
    const 積 = [path.join(__dirname, "..", "..", dir)];
    while (積.length) {
      const d = 積.pop();
      for (const name of fs.readdirSync(d)) {
        const p = path.join(d, name);
        const st = fs.statSync(p);
        if (st.isDirectory()) { if (name !== "node_modules" && name !== "tests") 積.push(p); continue; }
        if (!/\.(js|jsx)$/.test(name)) continue;
        if (p.endsWith(path.join("lib", "featureOn.js"))) continue;
        const rel = path.relative(path.join(__dirname, "..", ".."), p);
        const code = readCode(...rel.split(path.sep));
        if (/rpc\("(feature_on|my_features)"\)|rpc\("(feature_on|my_features)",|from\("feature_flags"\)|from\("feature_flag_testers"\)/.test(code)) {
          場所.push(rel);
        }
      }
    }
  }
  t(場所.length === 0, "★台帳に 直に 尋ねて いる ところが ない" +
    (場所.length ? "（" + 場所.join("／") + "）" : ""));

  console.log("\n③ 台帳の 側の 道");
  const mig = fs.readFileSync(path.join(__dirname, "..", "..", "supabase", "migrations",
    "20260923330000_my_features.sql"), "utf8");
  t(/create or replace function public\.my_features\(\)/.test(mig), "★my_features が ある");
  t(/revoke all on function public\.my_features\(\) from public, anon/.test(mig),
    "★未ログインからは 呼べない");
  t(/security definer/.test(mig), "★security definer");
  t(/public\.feature_on\(f\.key\)/.test(mig), "★判じは feature_on に 任せて いる（★写して いない）");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
