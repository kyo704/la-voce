#!/usr/bin/env node

// ============================================================================
// ★書き出しの 見出し
//
//   ★出どころ 見本 `SC['書き出す']` の `.wl`
//     「病気の 名前・尺度の 名前は、見出しにも 入れません。」
//     「見出しは、画面と 同じ ことばです（のどの調子／声の出来 …）。」
//   ★裁定 2026-09-15・Opus（坂本さん 経由）
//     「㋒ 採用。最初に着手」
//     「追加1 — 見出しは『列名の意味』では なく
//        『実際に 格納されて いる 中身』を 表す こと」
//     「追加2 — 禁止語は 見張りで『警告』では なく **失敗** に する」
//     「㋓の PROMISE 文言は、この 見張りが 緑に なるまで 追加しない こと」
//
//   ★★なぜ 失敗に するか。
//     ★★この ファイルは、★お医者さんに 渡される ことが あります。
//       ★誤った 見出しは、★誤った 情報を 医師の 前に 出す ことに なります。
//     ★★警告は 見過ごせます。★失敗は 見過ごせません。
//
//   ★★★列名と 中身が 食い違う ものが あります（★裁定 その29／その49）。
//     ★`throat_condition` に 入って いるのは **bodyFeel** です。
//     ★★列の 改名は 別途 あと。★それまで 見出しだけを 正しく します。
//     ★★この 見張りは、★その 3つが **元に 戻って いない** ことも 見ます。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const NEED = [["lib", "exportData.js"], ["components", "VocalTracker.jsx"]];
const missing = NEED.filter((p) => !fs.existsSync(path.join(__dirname, "..", "..", ...p)));
if (missing.length) {
  missing.forEach((p) => console.log("★★ありません: " + p.join("/")));
  console.log("　★数えません。★止まります。");
  process.exit(1);
}

const b64 = (...p) => "data:text/javascript;base64," + Buffer.from(
  fs.readFileSync(path.join(__dirname, "..", "..", ...p), "utf8")).toString("base64");

(async () => {
  const E = await import(b64("lib", "exportData.js"));
  const vt = readCode("components", "VocalTracker.jsx");

  // ★★書き出しに 出る 列を、★`entryToRow` から 機械で 取ります。
  //   ★★手で 写しません。★写すと、★増えた 列に 気づけません。
  //     ★★`entriesToCsv` は 行に 入って いる 鍵を そのまま 見出しに します。
  //       ★だから 見るべきは「何を 書いて いるか」── `entryToRow` です。
  const i = vt.indexOf("function entryToRow");
  let cols = [];
  if (i >= 0) {
    let j = vt.indexOf("{", i), d = 0, k = j;
    for (;;) {
      if (vt[k] === "{") d++;
      else if (vt[k] === "}") d--;
      if (d === 0) break;
      k++;
    }
    const blk = vt.slice(i, k + 1);
    const seen = new Set();
    (blk.match(/^ {4}[a-z][a-z_0-9]*:/gm) || []).forEach((m) => {
      const c = m.trim().replace(":", "");
      if (!seen.has(c)) { seen.add(c); cols.push(c); }
    });
  }

  console.log("① 列を 取り出せたこと");
  t(cols.length >= 60, "entryToRow から " + cols.length + " 列 取れた（60以上）");
  ["throat_condition", "voice_quality", "resonance_score", "cpps_value"].forEach((c) => {
    t(cols.includes(c), c + " が 取れて いる");
  });

  console.log("\n② ★名前の 無い 列が ないこと");
  // ★★足りなければ、★その 列名を 出します。★数だけ 言いません。
  const miss = E.unlabeledColumns(cols);
  miss.forEach((c) => console.log("    ✗ 名前が ありません: " + c));
  t(miss.length === 0, "書き出しに 出る " + cols.length + " 列 すべてに 名前が ある");

  console.log("\n③ ★★禁止語が 見出しに 入って いないこと（★警告では なく 失敗）");
  // ★★病名・尺度名を 見出しに 出さない、★という 見本の 約束です。
  const bad = E.forbiddenHeadings();
  bad.forEach((b) => console.log("    ✗ " + b.column + " →「" + b.heading + "」に「" + b.word + "」"));
  t(bad.length === 0, "禁止語を 含む 見出しが 0件");
  t(E.FORBIDDEN_IN_HEADING.length >= 6, "禁止語の 一覧が ある（" + E.FORBIDDEN_IN_HEADING.length + "語）");
  ["CPPS", "score", "index", "偏差値", "点数", "スコア"].forEach((w) => {
    t(E.FORBIDDEN_IN_HEADING.includes(w), "「" + w + "」が 禁止語に ある");
  });

  console.log("\n④ ★★中身と 名前が 食い違う 列（★裁定 その29／その49）");
  // ★★列名を そのまま 日本語に すると、★嘘を 印刷します。
  //   ★★改名は 別途 あと。★それまで 見出しだけを 正しく します。
  t(E.headingOf("throat_condition") === "からだの 感じ",
    "throat_condition →「からだの 感じ」（★のどでは ない・中身は bodyFeel）");
  t(!E.headingOf("throat_condition").includes("のど"),
    "その 見出しに「のど」が 入って いない");
  t(E.headingOf("voice_quality") === "声の 出来（5段階）", "voice_quality →「声の 出来（5段階）」");
  t(E.headingOf("resonance_score") === "声の 出来（0〜10）", "resonance_score →「声の 出来（0〜10）」");
  // ★★食い違いが 本当に あることを、★コードで 確かめます。
  //   ★★見張りが 前提を 自分で 確かめない と、★前提が 崩れた ときに 気づけません。
  t(/bodyFeel:\s*typeof row\.throat_condition/.test(vt),
    "rowToEntry が throat_condition を bodyFeel に 入れて いる（★前提の 確認）");

  console.log("\n⑤ ★正しく 名づけられて いる `note`（★音名で あって メモでは ない）");
  ["wake_note", "routine_note", "pianissimo_high_note"].forEach((c) => {
    const h = E.headingOf(c);
    t(h.includes("音名"), c + " →「" + h + "」に「音名」が ある");
    t(!h.includes("メモ"), c + " の 見出しに「メモ」が 無い");
  });

  console.log("\n⑥ 名前の 無い 列は、★列名の まま（★空に しない）");
  t(E.headingOf("zzz_brand_new_column") === "zzz_brand_new_column", "知らない 列は 列名の まま");
  t(E.headingOf("") === "", "空の 鍵は 空の まま");
  t(E.headingOf(null) === "", "null も 落ちない");

  console.log("\n⑦ CSV が 実際に その 見出しを 使うこと");
  const csv = E.entriesToCsv([{ date: "2026-09-15", throat_condition: 3, zzz_new: 1 }]);
  const head = csv.split("\n")[0];
  t(head.startsWith("日づけ"), "1列目が「日づけ」");
  t(head.includes("からだの 感じ"), "見出しが 日本語に なって いる");
  t(head.includes("zzz_new"), "知らない 列は 列名の まま 出る");
  t(!head.includes("throat_condition"), "列名が そのまま 出て いない");
  // ★★中身の 行は 変わって いないこと。★見出しだけを 直しました。
  t(csv.split("\n")[1] === "2026-09-15,3,1", "中身の 行は 変わって いない");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
