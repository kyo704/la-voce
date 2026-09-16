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
  // ★★★2026-09-16、★名前で 見るのを やめました。
  //
  //   ★★もとは 10本の **題**を 並べて、★それが 残って いるかを 見て いました。
  //   ★★同じ 日、★坂本さんの お決め（★決め ⑥）で 記事の 題を 書き直しました
  //     （★線を ── に、★分かち書きを 足す）。★中身は 1文字も 変えて いません。
  //   ★★すると この 見張りが 落ちました ── ★9本が「失われた」と 出ました。
  //     ★★失って いません。★**題が 変わった だけ** です。
  //   ★★同じ 日に、★取り込みの 道具も 同じ 形で 壊れました ──
  //     ★`build-learn-content.js` が 題で 突き合わせて いて、
  //     ★題を 変えた とたん 85本が **144本**に なりました（★57本の 二重）。
  //   ★★だから どちらも `id` で 見ます。★題は 変わる。★id は 変わらない。
  // ★★★`body-2` を 外しました（★2026-09-16・裁定その69）。
  //   ★★`articles.json` の C2-1 の 指示 ──
  //     「既存記事を統合。… **健康情報側の本文を採用**し、
  //       学ぶ側の記事は削除してください。」
  //   ★★同じ ことを 言う 記事が 2本 あり、★1本に しました。
  //     ★中身は C2-1 が 引き継いで います（★題も ほぼ 同じ）。
  //   ★★消した 控えは `docs/records/消した記事-body-2-逆流性食道炎と声.md`。
  //     ★★黙って 消して いません。★戻せる 形で 残して あります。
  const originals = [
    "V-1", "V-4", "announcer-1-1", "announcer-2-1",
    "voiceactor-1-1", "voiceactor-2-1", "poprock-1-1", "poprock-2-1",
    "C1-1"
  ];
  // ★★統合で 消えた ものは、★引き継ぎ先が 在る ことを 見ます。
  //   ★★「消えた」だけ を 見張ると、★引き継ぎ先が 無い 消し方も 通します。
  assertTrue(m.ARTICLES.some((a) => a.id === "C2-1" && /逆流/.test(a.title)),
    "★body-2 の 引き継ぎ先（C2-1）が 在る");
  const liveIds = new Set(m.ARTICLES.map((a) => a.id));
  const lost = originals.filter((i) => !liveIds.has(i));
  assertEqual(lost, [], "★元からあった10本が、すべて残っている（★id で 見ます）");

  // ★★二重に なって いないこと。★上の 取り込みの 壊れ方を 見張ります。
  const seen = new Set(), dup = [];
  m.ARTICLES.forEach((a) => { if (seen.has(a.id)) dup.push(a.id); else seen.add(a.id); });
  assertEqual(dup, [], "★同じ id の 記事が 2つ ない");

  console.log("\n=== ★覚え書きが、記事の本文になっていないこと ===");
  // 「※既存記事。移動のみ」のような指示文が本文に入っていたら、中身が消えている。
  const notes = m.ARTICLES.filter((a) => /^※既存記事|移動のみ|健康情報から移動/.test(a.bodyMd || ""));
  assertEqual(notes.map((a) => a.id), [], "★指示の覚え書きが本文になっている記事が無い");
  // ★覚え書きは10〜75字、いちばん短い実記事でも190字ある。
  //   200字で切ると、元からある短い記事（192〜199字）まで不合格にしてしまう。
  //   実際にそうなったので、覚え書きだけを捕まえる幅にしている。
  // ★★★短くても 本物、という 記事が あります（★2026-09-16）。
  //   ★★この 検査の ねらいは「指示の 覚え書きが 本文に なって いないか」です。
  //     ★★それは すぐ 上の 行で、★字そのもの を 見て 確かめて います。
  //     ★★150字は、★その 網の 二枚目 です。
  //   ★★`C4-1`（声の衛生の 基本）は、★健康情報から 引っ越して きた **箇条書き**です。
  //     ★6つの 点だけ で 146字。★これが 中身の 全部 です。
  //     ★★足して 150字に する ことは しません。★中身を 作るのは Code の 仕事では
  //       ありません（★坂本さんの お指図）。
  //   ★★だから、★名指しで 外します。★**名指し**です ── 新しく 短い 記事が
  //     ★出たら、★これまでどおり 落ちます。★網は ゆるめて いません。
  const SHORT_ON_PURPOSE = {
    "C4-1": "健康情報から 引っ越した 箇条書き（6点・146字）。これで 中身の 全部です。"
  };
  const tooShort = m.ARTICLES
    .filter((a) => (a.bodyMd || "").length < 150)
    .filter((a) => !SHORT_ON_PURPOSE[a.id]);
  assertEqual(tooShort.map((a) => a.id), [], "★覚え書きの長さ（150字未満）の記事が無い");
  // ★★名指しした ものが、★もう 短く ないなら ── ★紙が 古く なって います。
  const grown = Object.keys(SHORT_ON_PURPOSE)
    .filter((id) => {
      const a = m.ARTICLES.find((x) => x.id === id);
      return a && (a.bodyMd || "").length >= 150;
    });
  assertEqual(grown, [], "★名指しの一覧が古くなっていない（長くなったものは外す）");

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

  console.log("\n=== 実装者あての注記が本文に出ていないこと ===");
  console.log("     原稿の一部は「※ここは実装者向け」で始まり、区切り線のあとに本文が続く。");
  console.log("     取り込みでそこを落としておらず、記事の最初の段落が作業指示になっていた。");
  {
    const leaked = m.ARTICLES.filter((a) => /^\s*※/.test(a.bodyMd));
    assertTrue(leaked.length === 0,
      leaked.length === 0 ? "★どの記事も、※の注記で始まっていない"
        : `★注記が本文に残っている: ${leaked.map((a) => a.id).join(", ")}`);
    // ★狭く書く。「〜してください」は本文の助言（ご相談ください等）にも出るので、
    //   それだけを手がかりにしない。実装者にしか向かない言い回しだけを拾う。
    const IMPLEMENTER = /実装メモ|実装者向け|削除の理由[:：]|これに置き換えてください|既存の「[^」]*」を削除/;
    const orders = m.ARTICLES.filter((a) => IMPLEMENTER.test(a.bodyMd));
    assertTrue(orders.length === 0,
      orders.length === 0 ? "★本文のどこにも、作業指示の言い回しが残っていない"
        : `★作業指示が残っている: ${orders.map((a) => a.id).join(", ")}`);
  }

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
