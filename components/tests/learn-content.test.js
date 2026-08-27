#!/usr/bin/env node
/**
 * 学ぶ記事の取り込み（職業別項目の再設計と学ぶ画面.md §6〜§9）。
 *
 * ★用意されていた67本が、1本もアプリに入っていませんでした。
 *   書かれて、置かれて、繋がれていなかった、という状態です。
 *
 * ★取り込むときに、元からあった10本を失わないこと。
 *   67本のうち8本は「既存記事を移動・統合する」という指示で、本文を
 *   持っていません（10〜242字の覚え書き）。そのまま入れると、記事が
 *   覚え書きに置き換わって中身が消えます。
 */
const { readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

async function main() {
  const raw = readRaw("lib", "learnContent.js");
  const m = await import("data:text/javascript;base64," + Buffer.from(raw, "utf-8").toString("base64"));
  const src = JSON.parse(readRaw("docs", "learn-content", "articles.json"));

  console.log("=== 用意された記事が、アプリに入っていること ===");
  const prose = src.articles.filter((a) => a.status === "new" || a.status === "new_replacement");
  assertTrue(prose.length >= 55, `本文のある記事が${prose.length}本ある`);
  const ids = new Set(m.ARTICLES.map((a) => a.id));
  const missing = prose.filter((a) => !ids.has(a.id));
  assertEqual(missing.map((a) => a.id), [], "★本文のある記事が、1本残らず入っている");

  console.log("\n=== ★元からあった記事を失っていないこと ===");
  const originals = [
    "声区とパッサッジョ ― 通過点で何が起きているか", "衣装と姿勢 ― コルセットが呼吸に与えるもの",
    "話声位（SFF）とは ― あなたが普段しゃべっている高さ", "長時間しゃべるということ ― 歌より過酷な理由",
    "叫びの生理と、そこからの戻り方", "ささやきと息漏れ ― 「楽な芝居」という誤解",
    "ベルティングの仕組み", "打ち上げという最大の落とし穴",
    "声帯という器官のこと", "逆流性食道炎と声"
  ];
  const titles = new Set(m.ARTICLES.map((a) => a.title));
  const lost = originals.filter((t) => !titles.has(t));
  assertEqual(lost, [], "★元からあった10本が、すべて残っている");

  console.log("\n=== ★覚え書きが、記事の本文になっていないこと ===");
  // 「※既存記事。移動のみ」のような指示文が本文に入っていたら、中身が消えている。
  const notes = m.ARTICLES.filter((a) => /^※既存記事|移動のみ|健康情報から移動/.test(a.bodyMd || ""));
  assertEqual(notes.map((a) => a.id), [], "★指示の覚え書きが本文になっている記事が無い");
  // ★覚え書きは10〜75字、いちばん短い実記事でも190字ある。
  //   200字で切ると、元からある短い記事（192〜199字）まで不合格にしてしまう。
  //   実際にそうなったので、覚え書きだけを捕まえる幅にしている。
  const tooShort = m.ARTICLES.filter((a) => (a.bodyMd || "").length < 150);
  assertEqual(tooShort.map((a) => a.id), [], "★覚え書きの長さ（150字未満）の記事が無い");

  console.log("\n=== どの職業でも、職業別の記事が届くこと ===");
  ["singer", "announcer", "voice_actor", "pop_musical"].forEach((p) => {
    const arts = m.getArticlesForProfession(p);
    const own = arts.filter((a) => a.professions !== "all");
    assertTrue(arts.length >= 30, `${p}: ${arts.length}本 届く`);
    assertTrue(own.length >= 5, `${p}: ★職業別が${own.length}本ある（0本だと意味が無い）`);
  });

  console.log("\n=== 章の割り当て（統合設計書 §2-3） ===");
  const byCh = {};
  m.ARTICLES.forEach((a) => { byCh[a.chapter] = byCh[a.chapter] || { n: 0, prof: 0 }; byCh[a.chapter].n++; if (a.professions !== "all") byCh[a.chapter].prof++; });
  [1, 2, 4, 5].forEach((c) => {
    assertTrue((byCh[c] || {}).prof > 0, `★第${c}章に職業別の記事がある（${(byCh[c] || {}).prof || 0}本）`);
  });
  [3, 6, 7].forEach((c) => {
    assertEqual((byCh[c] || { prof: 0 }).prof, 0, `第${c}章は共通のみ（設計どおり）`);
  });

  console.log("\n=== §9 表現の境界 ===");
  // 記事の中に、個人の数値を差し込まない
  assertTrue(!/\$\{/.test(raw.replace(/\\\$\{/g, "")), "★本文に値の差し込みが無い");
  const banned = ["診断します", "治療します", "早期発見", "予防できます"];
  const hits = [];
  m.ARTICLES.forEach((a) => banned.forEach((w) => { if ((a.bodyMd || "").includes(w)) hits.push(`${a.id}:${w}`); }));
  assertEqual(hits, [], "★断定的な医療表現が入っていない");

  console.log("\n=== 作り直せること ===");
  assertTrue(/scripts\/build-learn-content\.js/.test(raw), "★生成元が書いてある（直接編集しないため）");
  assertTrue(/C2-1 \/ C2-2 \/ C4-1 \/ C4-6 \/ C4-7/.test(raw), "★入れていない5本を明記している");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
