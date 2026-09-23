#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★出演者を 招く ── ★見本 `P_koenInvite`
//   ★出どころ 裁定141 ／ 裁定148 ／ sql/67
//     ／ woolsong-2026-09-21_8.zip ／ 00-動く見本-PC・iPad（運営）.html（md5 b5c54333）
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない
//     ② ★段と 金額を 画面にも lib にも 書いて いない（★台帳が 持つ）
//     ③ ★名簿は `koen_invitable` から（★決め打ちの 3人 では ない）
//     ④ ★体の ことを 1つも 読んで いない（★裁定141・但し書きの 約束）
//     ⑤ ★名前だけで 置いた 方も 1人と 数える（★ご請求と 食い違わない）
//     ⑥ 但し書きが 見本の まま ／ ⑦ 字は tx() ／ ⑧ 押す ところは 44 以上
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
  const 画 = readCode("components", "KoenInvite.jsx");
  const 生 = readRaw("components", "KoenInvite.jsx");
  const libCode = readCode("lib", "koenInvite.js");
  const src = fs.readFileSync(path.join(ROOT, "lib", "koenInvite.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["codeParts", "countMembers", "isFull", "tierDiff", "isFreeTier", "yen"]
    .forEach((n) => t(new RegExp("\\b" + n + "\\b").test(画), "★" + n + " を 借りて いる"));
  t(!/\.select\(\s*["'`]\*/.test(画), "★`select('*')` を 書いて いない");

  console.log("\n② 段と 金額を 書いて いない");
  t(/rpc\(\s*"koen_tier_price"/.test(画), "★台帳の `koen_tier_price` を 呼ぶ");
  [/\b20000\b/, /\b50000\b/, /\b100000\b/, /\b150000\b/].forEach((re, i) =>
    t(!re.test(画) && !re.test(libCode), "★金額 " + [20000, 50000, 100000, 150000][i] + " を 書いて いない"));
  // ★★段の 数（15/40/120/300/600）も 書きません ── ★1つでも 写すと 2か所に なります
  t(!/\[\s*15\s*,\s*0\s*\]/.test(libCode) && !/TIERS\s*=/.test(libCode),
    "★段の 一覧を lib に 写して いない");
  // ★★「15人までは 無料です。」は 見本の **言葉** です。★数では なく 字 として 持ちます
  t(/15人までは 無料です。/.test(libCode), "★但し書きの 言葉は そのまま 持つ");

  console.log("\n③ 名簿は 台帳から");
  t(/rpc\(\s*"koen_invitable"/.test(画), "★`koen_invitable` を 呼ぶ");
  ["井上 かなで", "村上 ひかる", "菊地 せな"].forEach((n) =>
    t(!画.includes(n) && !libCode.includes(n), "★決め打ちの 名前が ない …… " + n));

  console.log("\n④ 体の ことを 読んで いない");
  ["entries", "体調", "throat", "voice_quality", "condition"].forEach((w) =>
    t(!new RegExp(w, "i").test(画), "★「" + w + "」が ない"));

  console.log("\n⑤ 数え方");
  t(L.countMembers([{}, { left_at: "x" }, {}]) === 2, "★出て いる 方 だけ 数える");
  t(L.countMembers([{ user_id: null, name_at: "山田" }]) === 1,
    "★名前だけで 置いた 方も 1人（★ご請求の 段と 同じ）");
  t(L.isFull(40, 40) === true && L.isFull(39, 40) === false, "★上限の 見方");
  const T = [{ tier: 15, yen: 0 }, { tier: 40, yen: 20000 }];
  t(L.tierDiff(T, 15, 16).yen === 20000, "★差額は 渡された 段から 引く");
  t(L.tierDiff(T, 40, 16) === null, "★上げる 要が なければ null");

  console.log("\n⑥ 但し書きが 見本の まま");
  const 見 = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-PC・iPad（運営）.html"), "utf8");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　]+/g, "");
  L.INVITE_NOTE.forEach((l) => t(素(見).includes(素(l)), "★見本に ある …… " + l.slice(0, 20)));
  t(L.INVITE_NOTE.some((x) => /体調の 記録は、制作にも 舞台監督にも 見えません/.test(x)),
    "★★約束の 1行が ある");

  console.log("\n⑦ 字は tx() を 通す");
  const 裸 = (生.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
    .filter((s) => !/^>\s*<$/.test(s));
  t(裸.length === 0, "★JSX に 裸の 日本語が ない" + (裸.length ? "（" + 裸[0].slice(0, 30) + "）" : ""));

  console.log("\n⑧ 押す ところは 44 以上");
  const 高 = 生.match(/minHeight:\s*(\d+)/g) || [];
  t(高.length > 0 && 高.every((h) => Number(h.replace(/\D/g, "")) >= 44), "★どれも 44 以上");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
