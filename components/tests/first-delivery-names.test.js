#!/usr/bin/env node
// ============================================================================
// 第1便 ── 名前を直す（2026-09-09）
//
//   ★出どころ docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §15
//            docs/opus/woolsong-裁定-全体レイアウトと教室機能（9月8日）.md §9
//
//     □ ホーム → ★「きょう」　おうち → ★「ひつじ」　分析 → ★「ふりかえる」
//     □ ★ルーティングは ★変えない。★表示名だけ
//     □ ★タブを 6つ → ★5つに（★レッスンタブを 外す）
//
//   ★★3つ目は、★門の中だけです（★2026-09-09・坂本さんのお指図）。
//     ★★一般の 38人の 画面を、★1つも 変えません。
//     ★★一度、★外したものを 38人にも 配ってしまい、★戻しました。
//       ★この見張りは、★同じことを 二度 しないために あります。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}
function eq(a, b, label) {
  const ja = JSON.stringify(a), jb = JSON.stringify(b);
  t(ja === jb, label + (ja === jb ? "" : `  期待:${jb} 実際:${ja}`));
}

(async () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "translations.js"), "utf8");
  const tr = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const t_ = tr.createTranslator("ja");

  console.log("=== ① 表示名（日本語） ===");
  const want = {
    tabHome: "きょう",      // ★ホーム → きょう
    tabToday: "記録",
    tabAnalysis: "ふりかえる", // ★分析 → ふりかえる
    tabCharacter: "ひつじ",   // ★おうち → ひつじ
    tabNotes: "ノート",
    tabMore: "もっと"
  };
  Object.keys(want).forEach((k) => eq(t_(k), want[k], `${k} は「${want[k]}」`));
  // ★古い名前に 戻っていないこと
  ["ホーム", "おうち", "分析", "今日"].forEach((old) => {
    const hit = Object.keys(want).filter((k) => t_(k) === old);
    eq(hit, [], `★「${old}」に 戻っていない`);
  });

  console.log("\n=== ② 鍵（key）は 変えない ===");
  const vt = readRaw("components", "VocalTracker.jsx");
  // ★★表示名だけを 直す、という 決めです。
  //   ★鍵を 変えると、★覚えている画面（localStorage・戻る道）が ずれます。
  ["home", "today", "analysis", "garden", "notes"].forEach((k) => {
    t(new RegExp(`key: "${k}"`).test(vt), `★鍵 "${k}" は そのまま`);
  });

  console.log("\n=== ③ タブ 6つ→5つ は、門の中だけ ===");
  const tabs = vt.slice(vt.indexOf("const TABS = ["), vt.indexOf("const TABS_V2"));
  t(/key: "lesson"/.test(tabs), "★一般の方の TABS に レッスンが 残っている（★38人の画面を 変えない）");
  const v2 = vt.slice(vt.indexOf("const TABS_V2"), vt.indexOf("const TABS_V2") + 400);
  // ★★2026-09-10、★見本の 並びに 合わせて 書き方を 変えました。
  //   ★前は TABS.filter(… !== "lesson") でした。
  //   ★★確かめるのは 書き方では なく、★結果です。
  //     ★「レッスンが 入っていないこと」を、★一覧そのもので 見ます。
  t(/TABS_V2_ORDER = \["home", "today", "analysis", "notes", "garden"\]/.test(vt),
    "★門の中は 5つ、★見本の 並び（きょう／記録／ふりかえる／ノート／ひつじ）");
  t(!/TABS_V2_ORDER = \[[^\]]*"lesson"/.test(vt), "★レッスンが 入っていない");
  t(/mayUseLayoutV2/.test(vt), "★門を 通して 選んでいる");

  console.log("\n=== ④ 見本の 5つと 合っているか ===");
  // ★見本①〜⑮の 下の帯：きょう／記録／ふりかえる／ノート／ひつじ
  eq([t_("tabHome"), t_("tabToday"), t_("tabAnalysis"), t_("tabNotes"), t_("tabCharacter")],
    ["きょう", "記録", "ふりかえる", "ノート", "ひつじ"], "★見本の 帯と 同じ 5つ");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
