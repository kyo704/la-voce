#!/usr/bin/env node
/**
 * テスター先行公開の出し分け（2026-08-30）
 *
 * ★★★ これは課金の試験ではありません ★★★
 *   docs/lavoce-権利と課金の線引き.md は「G3 が終わるまで1行も実装しない」と
 *   書いています。★その凍結は破っていません。売っていません。
 *   ここで確かめるのは「仕上がった機能を、テスターに先に見せる」出し分けです。
 *
 * ★守りたいこと
 *   ① 線引き §3「絶対にゲートしないもの」に触れていない（例外なし）
 *   ② 仕上がっていない3件は、誰にでも見える（analysis.range / metrics.history /
 *      learn.advanced）。★できていない機能を隠しても意味がありません
 *   ③ 機能 × 区分の全組み合わせで、答えが決まっている（§2-1）
 *   ④ 画面が profile.is_tester を直に見ていない
 *   ⑤ is_admin の既存の動き（全職業の切り替え）に触れていない
 *   ⑥ ぼかし・モーダル・勧誘を作っていない（§6-3）
 */
const fs = require("fs");
const path = require("path");
const { ROOT, readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "entitlements.js"), "utf-8");
  const E = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));

  console.log("=== ★これは課金ではない、と書いてあること ===");
  const raw = readRaw("lib", "entitlements.js");
  assertTrue(/これは課金の実装ではありません/.test(raw), "★冒頭に明記されている");
  assertTrue(/その凍結は破っていません/.test(raw), "★凍結を破っていないと書いてある");
  assertTrue(/課金を作るときは、線引き文書 §1 のデータモデルから作り直してください/.test(raw),
    "★次に読む人への申し送りがある");
  assertTrue(!/価格|月額|支払|Stripe|plan/i.test(src.replace(/\/\/.*$/gm, "").replace(/\/\*[\s\S]*?\*\//g, "")),
    "★本文に価格・支払いの概念が無い");

  console.log("\n=== ★機能 × 区分の全組み合わせ（§2-1） ===");
  E.VIEWERS.forEach((v) => {
    E.FEATURES.forEach((f) => {
      assertTrue(typeof E.can(v, f) === "boolean", `${v} × ${f} に答えがある`);
    });
  });

  console.log("\n=== ★出し分けるのは、仕上がった5件だけ ===");
  assertEqual([...E.PREVIEW_FEATURES].sort(),
    ["analysis.cycle", "analysis.reflux", "analysis.relations", "export.doctorSheet", "repertoire.multi"],
    "★5件ちょうど");
  ["analysis.range", "metrics.history", "learn.advanced"].forEach((f) => {
    assertTrue(!E.PREVIEW_FEATURES.includes(f), `★${f} は出し分けない（未完成）`);
    assertEqual(E.can("general", f), true, `★${f} は誰にでも見える`);
  });
  ["teacher.viewStudents", "studio.multiTeacher"].forEach((f) => {
    assertEqual(E.can("general", f), true, `${f} は出し分けない（教室そのものが未完成）`);
  });

  console.log("\n=== ★絶対にゲートしないもの（線引き §3・例外なし） ===");
  E.NEVER_GATED.forEach((f) => {
    assertEqual(E.can("general", f), true, `★${f} は誰にでも`);
    assertTrue(!E.PREVIEW_FEATURES.includes(f), `★${f} が出し分けの一覧に入っていない`);
  });
  assertTrue(E.NEVER_GATED.includes("export.legal"), "★法定の書き出しが一覧にある");
  assertTrue(E.PREVIEW_FEATURES.includes("export.doctorSheet"), "受診用の1枚は出し分ける");
  assertTrue(!E.NEVER_GATED.includes("export.doctorSheet"),
    "★法定の書き出しと、受診用の1枚を混同していない");

  console.log("\n=== ★群のラベル（先行公開と群のラベル.md §3） ===");
  assertEqual([...E.VIEWERS].sort(), ["founder", "general", "tester"], "★群は3つ");
  assertEqual(E.viewerOf({ cohort: "tester" }), "tester", "cohort を読む");
  assertEqual(E.viewerOf({ cohort: "founder" }), "founder", "founder も読む");
  assertEqual(E.viewerOf({ cohort: "general" }), "general", "general も読む");
  assertEqual(E.can("founder", "analysis.relations"), true, "★founder にも見える");
  // ★cohort が正。is_tester は列がまだ無い環境の後ろ盾。
  assertEqual(E.viewerOf({ cohort: "general", is_tester: true }), "general",
    "★cohort が入っていれば is_tester を見ない");
  assertEqual(E.viewerOf({ is_tester: true }), "tester", "★cohort が無ければ古い印に落ちる（移行中）");

  console.log("\n=== ★フェイルクローズ ===");
  assertEqual(E.viewerOf(null), "general", "★プロフィールが無ければ一般");
  assertEqual(E.viewerOf({}), "general", "★印が無ければ一般");
  assertEqual(E.viewerOf({ cohort: "nope" }), "general", "★知らない群は一般に倒す");
  assertEqual(E.viewerOf({ cohort: "" }), "general", "★空文字も一般");
  assertEqual(E.viewerOf({ is_tester: null }), "general", "★null でも一般");
  assertEqual(E.viewerOf({ is_tester: "true" }), "general", "★文字列を真と見なさない");
  assertEqual(E.can("tester", "analysis.relations"), true, "テスターは全部見える");
  assertEqual(E.can("general", "analysis.relations"), false, "一般には出さない");
  assertEqual(E.can("nope", "analysis.relations"), false, "★知らない群にも出さない");

  console.log("\n=== 画面側 ===");
  const vt = readCode("components", "VocalTracker.jsx");
  assertTrue(!/profile\.is_tester\s*===/.test(vt), "★画面が is_tester を直に比べていない");
  assertTrue(/const viewer = useMemo\(\(\) => viewerOf\(profile\), \[profile\]\);/.test(vt),
    "区分は1か所で作っている");
  // 5件とも出し分けている
  ["analysis.relations", "analysis.cycle", "analysis.reflux", "export.doctorSheet", "repertoire.multi"]
    .forEach((f) => assertTrue(vt.includes(`can(viewer, "${f}")`), `${f} を画面で通している`));

  console.log("\n=== ★何も描かない（先行公開 §4「隠すのではなく、無い」） ===");
  // ★2026-08-30、「開発中」の1枚をやめました。
  //   ✗ 鍵アイコン ／ ✗ バッジ ／ ✗ グレーアウト ／ ✗ 近日公開の予告
  //   「存在するのに開かない」がいちばん不快で、
  //   「あなたはテスターではありません」と分かる表示は屈辱を与えます。
  assertTrue(!/この機能は、いま開発中です/.test(raw), "★「開発中」の文が消えている");
  assertTrue(E.IN_DEVELOPMENT_NOTE === undefined, "★文言そのものが無い");
  assertTrue(E.isInDevelopmentFor === undefined, "★その関数も無い");
  assertTrue(!/InDevelopmentCard/.test(vt.replace(/\/\/.*$/gm, "")), "★1枚を描く部品が無い");
  // ★「鍵」で探さないこと。「鍵盤」（ピアノ）に当たります。実際に当たりました。
  //   予告・限定・ロックを表す語だけを見ます。
  const shown = vt.replace(/\/\/.*$/gm, "");
  assertTrue(!/開発中|近日公開|テスター限定|ロック中|鍵アイコン/.test(shown),
    "★非テスターに、機能の存在をにおわせる語が無い");
  assertTrue(!/有料プラン|プレミアム|課金してください|アップグレード/.test(vt),
    "★「有料プランです」と書いていない");
  // ★字面で blur を探さないこと。
  //   ・e.target.blur() は入力欄のフォーカスを外す DOM の関数で、見た目と無関係
  //   ・ロック中のカードには飾りのぼかしがありますが、aria-hidden の
  //     作り物の棒（高さ固定）で、★本物の数字ではありません。
  //     §6-3 が禁じているのは「数字をぼかして『見るには課金』と出す」ことです。
  //   ここでは「開発中」の1枚に、ぼかしも数字も無いことを見ます。
  // ★窓を決め打ちしないこと。次の関数（Chip）の onClick が入ってしまいます。
  //   関数の終わりまでを、波かっこの数で取ります。
  const cardAt = vt.indexOf("function InDevelopmentCard");
  let depth = 0, cardEnd = cardAt;
  for (let i = cardAt; i < vt.length; i++) {
    if (vt[i] === "{") depth++;
    else if (vt[i] === "}") { depth--; if (depth === 0) { cardEnd = i + 1; break; } }
  }
  const card = vt.slice(cardAt, cardEnd);
  assertTrue(!/blur|opacity: *0\.[0-4]/.test(card), "★「開発中」の1枚にぼかしが無い");
  assertTrue(!/\{[a-zA-Z]+\.toFixed|\d+点|\d+日ぶん/.test(card), "★数字を出していない");
  assertTrue(!/fixed inset-0|Modal/.test(card), "★画面を覆うモーダルではない");
  assertTrue(!/onClick/.test(card), "★押させる誘導が無い（勧誘しない）");

  console.log("\n=== ★is_admin の既存の動きに触れていない ===");
  assertTrue(/\(profile\.is_admin && adminShowAllProfessions\)/.test(vt),
    "★管理者の全職業の切り替えは、そのまま");
  assertTrue(!/is_admin.*can\(|can\(.*is_admin/.test(vt),
    "★is_admin が出し分けに関与していない（管理者だからといって先に見えない）");

  console.log("\n=== 移行のSQL ===");
  const sql = readCode("supabase", "migration_is_tester.sql");
  assertTrue(/add column if not exists is_tester boolean not null default false/.test(sql),
    "★既定は false");
  assertTrue(!/^\s*update public\.profiles set is_tester/m.test(sql),
    "★立てる update は、コメントのまま（誤実行を防ぐ）");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
