#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★点を 入れる ── ★見本 `SC['点を入れる']`
//   ★出どころ 裁定50 ／ 裁定165
//     ／ woolsong-2026-09-21_1.zip ／ 00-動く見本-iPhoneで開く用.html（md5 67c56244）
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない
//     ② ★点は 札。★打ち込む 欄を 作って いない（★見本の 註）
//     ③ ★満点を 超える 札を 作らない（★出して から 止めない）
//     ④ ★確定の あとに 直す ときは わけを うかがう（★裁定50）
//     ⑤ ★ほかの 審査員の 点を 求めて いない
//     ⑥ ★入って いない 項目を 0 と 数えない
//     ⑦ 但し書きが 見本の まま ／ ⑧ tx() ／ ⑨ 44 以上
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
  const 画 = readCode("components", "ScoreEntry.jsx");
  const 生 = readRaw("components", "ScoreEntry.jsx");
  const libCode = readCode("lib", "scoreEntry.js");
  const src = fs.readFileSync(path.join(ROOT, "lib", "scoreEntry.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["pointChoices", "itemsInUse", "pointOf", "total", "maxTotal", "canSubmit",
   "isConfirmed", "needsReason", "canEditWithReason", "typeLine"]
    .forEach((n) => t(new RegExp("\\b" + n + "\\b").test(画), "★" + n + " を 借りて いる"));
  t(!/\.select\(\s*["'`]\*/.test(画), "★`select('*')` を 書いて いない");

  console.log("\n② 点は 札。★打ち込ませない");
  const 点 = 画.slice(画.indexOf("pointChoices(it)"), 画.indexOf("pointChoices(it)") + 700);
  t(/<button/.test(点), "★札（押す もの）で 出す");
  t(!/<input/.test(点), "★点の ところに 打ち込む 枠が ない");
  // ★★講評と わけは 打ち込みます。★点だけが 札 です
  t(/<textarea/.test(画), "★講評は 打ち込める（★点とは ちがいます）");

  console.log("\n③ 満点を 超える 札を 作らない");
  const it10 = { max_points: 10, step: 1 };
  t(L.pointChoices(it10).length === 11, "★0〜10 で 11枚");
  t(L.pointChoices(it10).slice(-1)[0] === 10, "★最後は 満点");
  t(L.pointChoices({ max_points: 5, step: 0.5 }).length === 11, "★0.5 きざみも 出せる");
  t(L.pointChoices({ max_points: 0 }).length === 0, "★満点が 0 なら 1枚も 作らない");
  t(L.pointChoices(null).length === 0, "★項目が 無ければ 作らない");

  console.log("\n④ 直す ときは わけを うかがう");
  t(/rpc\(\s*"edit_confirmed_score"/.test(画), "★台帳の `edit_confirmed_score` を 通す");
  t(/canEditWithReason\(reason\)/.test(画), "★わけが 空なら 通さない");
  t(L.needsReason([{ confirmed_at: "x" }]) === true, "★確定の あとは 要る");
  t(L.needsReason([{}]) === false, "★入れる 前は 要らない");
  t(L.canEditWithReason("  ") === false, "★空白だけでは 直せない");
  t(/記録に 残り、学生に お知らせが 届きます/.test(生), "★何が 起きるかを 先に 書いて いる");

  console.log("\n⑤ ほかの 審査員の 点を 求めて いない");
  t(/\.eq\("judge_id", judgeId\)/.test(画), "★自分の 点だけ 求める");
  // ★★**読む** ところ だけ を 数えます。★書く（upsert）ところは 別 です。
  const 求 = (画.match(/from\("evaluation_scores"\)\s*\.select/g) || []).length;
  t(求 === 1, "★点を 読む ところは 1か所（" + 求 + "）");
  t(!/from\("evaluation_scores"\)[\s\S]{0,200}\.neq\("judge_id"/.test(画),
    "★ほかの 審査員の 点を 求めて いない");

  console.log("\n⑥ まだ と 0点 を 分ける");
  const items = [{ id: "a", max_points: 10, step: 1, ord: 1 }, { id: "b", max_points: 5, step: 1, ord: 2 }];
  t(L.total(items, [{ item_id: "a", points: 8 }]) === null, "★1つでも 空なら 合計を 出さない");
  t(L.total(items, [{ item_id: "a", points: 8 }, { item_id: "b", points: 0 }]) === 8,
    "★0点は 0点 として 数える");
  t(L.canSubmit(items, [{ item_id: "a", points: 8 }]) === false, "★空が あれば 入れられない");

  console.log("\n⑦ 但し書きが 見本の まま");
  const 見 = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-iPhoneで開く用.html"), "utf8");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　]+/g, "");
  L.SCORE_NOTE.forEach((l) => t(素(見).includes(素(l)), "★見本に ある …… " + l.slice(0, 20)));
  t(/点は 札で 選びます。手で 打ちません。/.test(L.SCORE_NOTE[0]), "★★札の 約束が ある");
  t(/締切の 前は、ほかの 審査員の 点は 見えません。/.test(L.SCORE_NOTE[3]), "★★締切の 約束が ある");

  console.log("\n⑧⑨ 字と 押しどころ");
  const 裸 = (生.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
    .filter((s) => !/^>\s*<$/.test(s));
  t(裸.length === 0, "★JSX に 裸の 日本語が ない" + (裸.length ? "（" + 裸[0].slice(0, 30) + "）" : ""));
  const 高 = 生.match(/minHeight:\s*(\d+)/g) || [];
  t(高.length > 0 && 高.every((h) => Number(h.replace(/\D/g, "")) >= 44), "★どれも 44 以上");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
