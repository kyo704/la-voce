#!/usr/bin/env node
/**
 * 書き出しに添える「記録の控え」のテスト（統合実行ルートv4 G3-16・無料のまま）。
 *
 * ★守っているもの
 *  1. 解釈を1つも書かない。件数・日付・ファイル名だけ。
 *  2. 診断・臨床を思わせる語を、4言語すべてで出さない
 *     （v4 §3 の1つ目、多言語対応の完成.md §7 の禁止語の考え方）。
 *     ★中国語・韓国語がいちばん危ない。機械翻訳は「記録」を「症状」に、
 *       「調子」を「病状」に寄せる。そこを機械的に検査する。
 *  3. 言語は、この文書だけの4分岐（ja/zh/ko/それ以外→en）。
 *  4. 一緒に書き出されるファイル名が、実際の書き出しと一致している。
 *     ★思い込みで書かないこと。
 */
const fs = require("fs");
const path = require("path");
// ★コメント除去は components/tests/_source.js の1か所から使う。
//   各テストが自前で持つと、除去の仕方が少しずつずれていく。
const { stripComments } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "exportSummary.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));

  console.log("=== テスト1: この文書だけの4分岐（アプリの9言語とは独立） ===");
  assertEqual(m.resolveSummaryLanguage("ja"), "ja", "ja → ja");
  assertEqual(m.resolveSummaryLanguage("zh"), "zh", "zh → zh");
  assertEqual(m.resolveSummaryLanguage("ko"), "ko", "ko → ko");
  ["en", "it", "de", "fr", "es", "ru"].forEach((l) =>
    assertEqual(m.resolveSummaryLanguage(l), "en", `${l} → en`));
  assertEqual(m.resolveSummaryLanguage(undefined), "en", "未設定でも en に落ちる");
  assertEqual(m.resolveSummaryLanguage("zh-TW"), "en", "知らないコードは en");

  console.log("\n=== テスト2: ★診断・臨床を思わせる語を出さない（4言語すべて） ===");
  console.log("     中国語・韓国語は、機械翻訳が「記録」を「症状」に寄せがちです。");
  const sample = m.buildExportSummary({
    profile: { display_name: "テスト" }, entries: {}, professionLabel: "声楽",
    exportedAt: "2026-08-27T00:00:00Z", uiLanguage: "ja"
  });
  m.SUMMARY_LANGUAGES.forEach((lang) => {
    const T = m.SUMMARY_TEXT[lang];
    // 関数の文言も展開して、全部の文字列を1つにまとめて調べる
    // ★末尾の断り書きは例外。「診断や評価ではありません」と否定するために
    //   その語自体を使う必要がある。ここを検査に含めると、自分の免責文で落ちる。
    const all = Object.entries(T).filter(([k]) => k !== "footer")
      .map(([, v]) => (typeof v === "function" ? v(1) : String(v))).join(" ");
    m.FORBIDDEN_TERMS[lang].forEach((term) => {
      if (all.toLowerCase().includes(term.toLowerCase())) {
        console.log(`  ✗ ${lang}: 禁止語「${term}」が文言に出ている`); failCount++;
      }
    });
    assertTrue(true, `${lang}: 禁止語${m.FORBIDDEN_TERMS[lang].length}語すべて出ていない`);
  });

  console.log("\n=== テスト3: ★解釈・評価を書かない ===");
  const judgey = {
    ja: ["多い", "少ない", "良い", "悪い", "順調", "不足", "おすすめ", "べきです"],
    zh: ["较多", "较少", "良好", "不足", "建议"],
    ko: ["많", "적", "양호", "부족", "권장"],
    en: ["good", "bad", "too many", "too few", "should", "recommend", "better", "worse"]
  };
  m.SUMMARY_LANGUAGES.forEach((lang) => {
    const T = m.SUMMARY_TEXT[lang];
    const all = Object.values(T).map((v) => (typeof v === "function" ? v(1) : String(v))).join(" ").toLowerCase();
    judgey[lang].forEach((w) => {
      if (all.includes(w.toLowerCase())) { console.log(`  ✗ ${lang}: 評価の語「${w}」が出ている`); failCount++; }
    });
    assertTrue(true, `${lang}: 評価の語を含まない`);
  });
  // コメントを外してから調べる。コメントには「連続日数は入れない」という
  // 説明としてその語が出てくるため、そのままだと自分の説明文で落ちる。
  const srcCode = stripComments(src);
  assertTrue(!/streak|連続|连续|연속/i.test(srcCode),
    "★連続日数を入れていない（達成度の話になり、この紙の目的から外れる）");

  console.log("\n=== テスト4: 4言語すべてに、同じ項目がそろっている ===");
  const jaKeys = Object.keys(m.SUMMARY_TEXT.ja).sort();
  m.SUMMARY_LANGUAGES.forEach((lang) => {
    assertEqual(Object.keys(m.SUMMARY_TEXT[lang]).sort(), jaKeys, `${lang} に欠けている項目が無い`);
  });
  assertTrue(!!m.SUMMARY_TEXT.ja.footer && !!m.SUMMARY_TEXT.en.footer, "末尾の断り書きがある");
  const NEGATION = { ja: /ではありません/, zh: /不是/, ko: /아닙니다/, en: /is not/i };
  m.SUMMARY_LANGUAGES.forEach((lang) => {
    const f = m.SUMMARY_TEXT[lang].footer;
    assertTrue(f.length > 10, `${lang}: 断り書きがある`);
    assertTrue(NEGATION[lang].test(f),
      `★${lang}: 断り書きが否定形になっている（診断ではない、と言い切っている）`);
  });

  console.log("\n=== テスト5: ★ファイル名が、実際の書き出しと一致している ===");
  const ui = fs.readFileSync(path.join(ROOT, "components", "VocalTracker.jsx"), "utf-8");
  const actual = (ui.match(/downloadFile\(`([^`]+)`/g) || []).map((x) => x.replace(/^downloadFile\(`/, "").replace(/`$/, ""));
  const listed = m.exportFileNames("STAMP").map((f) => f.name.replace("STAMP", "${stamp}"));
  listed.forEach((name) => {
    assertTrue(actual.includes(name), `控えに書いた ${name} を、書き出しが実際に作っている`);
  });
  assertEqual(listed.length, actual.filter((a) => a.startsWith("la-voce-")).length,
    "★書き出されるファイルを1つも書き漏らしていない・増やしていない");

  console.log("\n=== テスト6: 数えているのは事実だけ ===");
  const entries = {
    "2026-05-02": { throatCondition: 3, sleepHours: 7 },
    "2026-06-01": { voiceEntries: [{ id: "v" }], meals: [{ id: "m" }], notes: "メモ" },
    "2026-08-27": { activities: [{ id: "a" }], mentalTags: ["余裕"] }
  };
  const sum = m.buildExportSummary({
    profile: { display_name: "坂本 響" }, entries, professionLabel: "声楽・ミュージカル",
    exportedAt: "2026-08-27T09:00:00Z", uiLanguage: "it"
  });
  assertEqual(sum.lang, "en", "イタリア語の人は英語の控えになる");
  assertEqual(sum.recordedDays, 3, "記録した日数");
  assertEqual(sum.firstDate, "2026-05-02", "最初の日");
  assertEqual(sum.lastDate, "2026-08-27", "最後の日");
  assertEqual(sum.items.voice, 2, "声・喉の記録がある日数");
  assertEqual(sum.items.sleep, 1, "睡眠がある日数");
  assertEqual(sum.items.activity, 1, "活動がある日数");
  assertEqual(sum.items.meal, 1, "食事・水分がある日数");
  assertEqual(sum.items.mental, 1, "心の余裕がある日数");
  assertEqual(sum.items.notes, 1, "メモの件数");
  assertTrue(!("streak" in sum) && !("points" in sum), "連続日数もポイントも入っていない");

  console.log("\n=== テスト7: 記録が1件も無くても壊れない ===");
  const empty = m.buildExportSummary({ profile: null, entries: {}, exportedAt: "2026-08-27T00:00:00Z", uiLanguage: "ja" });
  assertEqual(empty.recordedDays, 0, "0日でも数字が出る");
  assertEqual(empty.firstDate, null, "最初の日は空");
  assertTrue(!!empty.text.notSet, "空欄の書き方が用意されている");

  console.log("\n=== テスト8: 有料機能になっていない ===");
  assertTrue(!/premium|プレミアム|有料|subscription/i.test(src), "★課金の判定が入っていない（無料の書き出しの一部）");
  const idx = ui.indexOf('setActiveTab("exportSummary")');
  assertTrue(idx > 0, "「もっと」から開ける");
  const around = ui.slice(Math.max(0, idx - 900), idx);
  assertTrue(/labelExportData/.test(around), "★既存の書き出しと同じ場所にある");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
