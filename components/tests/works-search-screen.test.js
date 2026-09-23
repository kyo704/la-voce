#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★作品を さがす（★運営）── ★見本 `SC['作品をさがす']`
//   ★出どころ woolsong-2026-09-21_8.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333）
//     ★2026-09-23 に 展開・docs/design/pack-final/ に 反映
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない（`lib/worksSearch.js` から 借りる）
//     ② ★しぼりこみ・並べ替えを 画面で して いない（★台帳が する）
//     ③ ★種類を 選び直す 欄が 無い（★見本 …「前の画面で 決めています」）
//     ④ ★「下書き あり」は 札 だけ。★別の 画面へ 行かない（design-v36 ①）
//     ⑤ ★演劇 だけ「作者・分野」（design-v36 ③）
//     ⑥ ★「こだわらない」を 台帳に 0／'' で 渡さない（★しぼって しまう）
//     ⑦ 但し書きが 見本の まま ／ ⑧ 字は tx() ／ ⑨ 押す ところは 44 以上
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

(async () => {
  const 画 = readCode("components", "WorksSearch.jsx");
  const 生 = readRaw("components", "WorksSearch.jsx");
  const src = fs.readFileSync(path.join(ROOT, "lib", "worksSearch.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["composersFor", "composerLabel", "ROLE_MAXES", "CHORUS_CHOICES", "showsChorusFilter",
   "toSearchParams", "hasDraft", "workLine", "footNotes"].forEach((n) =>
    t(new RegExp("\\b" + n + "\\b").test(画), "★" + n + " を 借りて いる"));
  t(!/\bCOMPOSERS\s*=/.test(画), "★作曲家の 一覧を 画面で 作って いない");

  console.log("\n② しぼりこみ・並べ替えを 画面で して いない");
  t(!/\.sort\s*\(/.test(画), "★画面で 並べ替えて いない");
  t(!/\.filter\s*\(\s*\(?\s*w\b/.test(画), "★画面で しぼって いない");
  t(/rpc\(\s*"search_works"/.test(画), "★台帳の `search_works` を 呼ぶ");
  t(/toSearchParams\(/.test(画), "★渡す 形も lib が 作る");

  console.log("\n③ 種類を 選び直す 欄が 無い");
  t(!/setKind\s*\(/.test(画), "★種類を 変える 仕掛けが ない");
  t(/kind\s*=\s*"opera"/.test(画) || /kind\s*=\s*"opera"/.test(生),
    "★種類は 受け取る だけ（props）");

  console.log("\n④ 「下書き あり」は 札 だけ");
  t(/hasDraft\(w\)/.test(画), "★`hasDraft` で 判じる");
  const 下 = 画.indexOf("hasDraft(w)");
  const 区 = 画.slice(下, 下 + 400);
  t(!/onClick/.test(区), "★札に 押す ところが ない（★別の 画面へ 行かない）");
  t(L.hasDraft({ completeness: "full" }) === true, "★full は 下書き あり");
  t(L.hasDraft({ completeness: "roles" }) === false, "★roles は 下書き なし");

  console.log("\n⑤ 演劇 だけ 「作者・分野」");
  t(L.composerLabel("drama") === "作者・分野", "★drama → 作者・分野");
  t(L.composerLabel("opera") === "作曲家", "★opera → 作曲家");
  t(L.composerLabel("chorus") === "作曲家", "★chorus → 作曲家");

  console.log("\n⑥ 「こだわらない」を そのまま 渡さない");
  const p0 = L.toSearchParams({ q: "  ", kind: "opera", composer: "", maxRoles: 0, chorus: "" });
  t(p0.p_q === null, "★空の 言葉は null");
  t(p0.p_composer === null, "★「ぜんぶ」は null");
  t(p0.p_max_roles === null, "★「こだわらない」は null（★0 では ない）");
  t(p0.p_needs_chorus === null, "★合唱「こだわらない」は null");
  const p1 = L.toSearchParams({ kind: "opera", maxRoles: 8, chorus: "no" });
  t(p1.p_max_roles === 8 && p1.p_needs_chorus === false, "★しぼる ときは そのまま 渡す");

  console.log("\n⑦ 但し書きが 見本の まま");
  const 見 = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-PC・iPad（運営）.html"), "utf8");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　]+/g, "");
  L.footNotes("drama").forEach((line) =>
    t(素(見).includes(素(line)), "★見本に ある …… " + line.slice(0, 22)));
  t(L.footNotes("opera").length === 2 && L.footNotes("drama").length === 3,
    "★演劇の ときだけ 1行 増える");
  t(素(見).includes(素(L.EMPTY_WORD)), "★見つからない ときの 字も 見本の まま");

  console.log("\n⑧ 字は tx() を 通す");
  const 裸 = (生.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
    .filter((s) => !/^>\s*<$/.test(s));
  t(裸.length === 0, "★JSX に 裸の 日本語が ない" + (裸.length ? "（" + 裸[0].slice(0, 30) + "）" : ""));

  console.log("\n⑨ 押す ところは 44 以上");
  const 高 = 生.match(/minHeight:\s*(\d+)/g) || [];
  t(高.length > 0, "★高さを 決めて いる（" + 高.length + "か所）");
  t(高.every((h) => Number(h.replace(/\D/g, "")) >= 44), "★どれも 44 以上");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
