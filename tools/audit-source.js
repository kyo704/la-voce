#!/usr/bin/env node

// ============================================================================
// 一斉の 確かめ ── ★どの 画面が、★取り下げられた 見本から 作られて いるか
//
//   ★出どころ 坂本さん経由 Opus の お指図（★2026-09-11）
//     「A01を、直す前に、A02〜A11、B群、C群、D群、J群、すべてを、確かめて
//       ください。各画面が、古いscreens/を、参照して、作られていないか」
//     「結果を、1枚の表（画面／参照元（古いor正）／構成の一致／直す量）に」
//
//   ★★確かめる ことは 2つです。
//     ★① 参照元　★帳面の 中に「screens/」と 書いて あるか。
//       ★★screens/*.html は、★9月11日に 無効と お決めに なりました。
//       ★★正は 4本の 動く見本 だけです。
//     ★② 構成の 一致　★見本の 字が、★実装の 画面に 出て いるか。
//       ★★撮った ときの 書き出し（json）を、★そのまま くらべます。
//       ★★字の 中身では なく、★出て いるか どうかと、★並び順を 見ます。
//
//   ★★「直す量」は、★①と ②から 出します。★私の 感想では ありません。
//
//   使い方  node tools/audit-source.js
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MI = path.join(ROOT, "docs", "design", "compare", "all", "mihon");
const FR = path.join(ROOT, "docs", "design", "compare", "all", "frames");

/**
 * ★画面と、★それを 作って いる 帳面。
 *
 *   ★★1つの 画面を、★2つ 以上の 帳面が 作って いる ことが あります。
 *     ★どれか 1つでも 古い ものを 見て いれば、★その 画面は「古い」です。
 */
const SCREEN_FILES = [
  ["画面-きょう", ["components/HomeV2.jsx", "components/TodayBand.jsx", "components/TabBarV2.jsx"]],
  ["画面-記録", ["components/VocalTracker.jsx", "components/RecordV2Head.jsx", "lib/recordV2.js"]],
  ["SH-ねむり", ["components/RecordSheets.jsx", "lib/recordSheets.js"]],
  ["SH-こえ", ["components/RecordSheets.jsx", "lib/recordSheets.js"]],
  ["SH-honban", ["components/RecordSheets.jsx", "lib/recordSheets.js"]],
  ["SH-tabe", ["components/RecordSheets.jsx", "lib/recordSheets.js"]],
  ["SH-karada", ["components/RecordSheets.jsx", "lib/recordSheets.js"]],
  ["SH-hito", ["components/RecordSheets.jsx", "lib/recordSheets.js"]],
  ["画面-ふりかえる-並べる", ["components/LookBackV2.jsx", "components/LineUpChart.jsx", "lib/lineUp.js"]],
  ["画面-ふりかえる-さかのぼる", ["components/LookBackV2.jsx", "components/LookBackPanel.jsx", "lib/lookBack.js"]],
  ["画面-ふりかえる-くらべる", ["components/CompareV2.jsx", "lib/compareView.js", "lib/compareOrder.js"]],
  ["画面-ふりかえる-かぞえる", ["components/CountV2.jsx", "lib/countView.js"]],
  ["SC-順番", ["components/CompareV2.jsx", "lib/compareOrder.js"]],
  ["画面-ノート-稽古", ["components/NotesV2.jsx", "lib/notes.js"]],
  ["画面-ノート-レパートリー", ["components/NotesV2.jsx", "lib/repertoireLog.js"]],
  ["画面-ノート-連絡", ["components/NotesV2.jsx", "components/OpsPosts.jsx"]],
  ["画面-ノート-1枚", ["components/NotesV2.jsx"]],
  ["SC-稽古を書く", ["components/NotesV2.jsx", "lib/notes.js"]],
  ["SC-曲を足す", ["components/NotesV2.jsx", "lib/repertoireLog.js"]],
  ["SC-まだ", ["components/VocalTracker.jsx", "lib/homeDrawer.js"]],
  ["SC-全部", ["components/VocalTracker.jsx", "lib/homeDrawer.js"]],
  ["SC-たな", ["components/SheepShelf.jsx", "lib/repertoireLog.js"]],
  ["SH-したく", ["components/HomeDrawer.jsx", "lib/homeDrawer.js", "lib/roomSlots.js"]],
  ["SC-台帳", ["components/OwnedLedger.jsx", "lib/itemLedger.js"]],
  ["SC-もっと", ["components/VocalTracker.jsx", "lib/moreMenu.js"]],
  ["SC-設定", ["components/VocalTracker.jsx"]],
  ["SC-聞いてほしいこと", ["components/DailyAskPicker.jsx", "lib/dailyAsk.js"]],
  ["SC-プラン", ["components/VocalTracker.jsx"]],
  ["SC-学ぶ", ["components/VocalTracker.jsx", "lib/learnContent.js"]],
  ["SC-書き出す", ["components/VocalTracker.jsx", "lib/exportData.js"]],
  ["SC-退会", ["components/VocalTracker.jsx", "lib/accountDeletion.js"]]
];

/** ★この 帳面は、★取り下げられた 見本を 見て いるか。 */
function sourceOf(files) {
  const old = [];
  files.forEach((f) => {
    const p = path.join(ROOT, f);
    if (!fs.existsSync(p)) return;
    const src = fs.readFileSync(p, "utf8");
    // ★★「screens/」と 書いて あって、★かつ「外れました」「無効」と
    //   ★★断って いない ものだけを 数えます。
    //   ★★私が あとから 書いた 断り書きで 数が 増えるのを 防ぎます。
    const lines = src.split("\n").filter((l) => l.includes("screens/"));
    const live = lines.filter((l) =>
      !/外れました|無効|使いません|取り下げ|参照しません|もう 見ません/.test(l));
    if (live.length) old.push(f + "（" + live.length + "行）");
  });
  return old;
}

/** ★書き出しから、★出て いる 字を 順に 取り出します。 */
function textsOf(p) {
  if (!fs.existsSync(p)) return null;
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"))
      .map((d) => String(d.text || "").replace(/\s+/g, "").trim())
      .filter((x) => x.length >= 3);
  } catch (e) { return null; }
}

/**
 * ★見本の 字が、★実装に 出て いるか。
 *
 *   ★★下の 帯（きょう／記録／…）は、★どの 画面にも 出ます。★数えません。
 *   ★★見本の 電話の 飾り（9:41 など）も 数えません。
 */
const IGNORE = /^(きょう|記録|ふりかえる|ノート|ひつじ|9:41|●●●▮|あ|◐|↻)$/;

function compare(key) {
  const mi = textsOf(path.join(MI, key + ".json"));
  const im = textsOf(path.join(FR, key + "@390.json"));
  if (!mi) return { state: "見本なし" };
  if (!im) return { state: "実装なし" };
  const m = mi.filter((x) => !IGNORE.test(x));
  const i = im.filter((x) => !IGNORE.test(x));
  const iSet = new Set(i);
  const hit = m.filter((x) => iSet.has(x));
  const mSet = new Set(m);
  const extra = i.filter((x) => !mSet.has(x));
  // ★★並び順。★見本に ある 字だけを 取り出して、★順が 同じか 見ます。
  const order = i.filter((x) => mSet.has(x));
  let inOrder = 0;
  let k = 0;
  order.forEach((x) => {
    const at = m.indexOf(x, k);
    if (at >= 0) { inOrder++; k = at + 1; }
  });
  return {
    state: "ある",
    mihon: m.length,
    hit: hit.length,
    extra: extra.length,
    inOrder,
    pct: m.length ? Math.round((hit.length / m.length) * 100) : 0
  };
}

const rows = SCREEN_FILES.map(([key, files]) => {
  const old = sourceOf(files);
  const c = compare(key);
  return { key, files, old, c };
});

// ── 表を 出します
const line = (a, b, cc, d, e, f) =>
  "| " + a + " | " + b + " | " + cc + " | " + d + " | " + e + " | " + (f || "") + " |";

const out = [];
out.push("| 画面 | 参照元 | 構成の 一致 | 余分な もの | 直す量 | 備考 |");
out.push("|---|---|---|---|---|---|");
rows.forEach((r) => {
  const src = r.old.length ? "**★古い screens/**" : "正（動く見本）";
  let fit, extra, work;
  if (r.c.state !== "ある") {
    fit = "── " + r.c.state; extra = "──";
    work = r.c.state === "実装なし" ? "**作る**" : "──";
  } else {
    fit = r.c.hit + " / " + r.c.mihon + "（" + r.c.pct + "%）";
    extra = r.c.extra + " 件";
    // ★★直す量は、★②（構成の 一致）だけから 出します。
    //   ★★参照元は 別の 列です。★混ぜません。
    //     ★★1行の 覚え書きが 古い ことと、★画面の 形が ちがう ことは、
    //       ★別の 問題です。★混ぜると、★どちらの 大きさも 分からなく なります。
    //   ★★「大」は、★見本の 半分も 出て いない、という 意味です。
    const heavy = r.c.pct < 60 || r.c.extra > 20;
    const mid = r.c.pct < 85 || r.c.extra > 5;
    work = heavy ? "**大**" : (mid ? "中" : "小");
  }
  // ★★後回しに した ぶん（★E群・教室と 組織）が 抜けて いる 画面は、
  //   ★★数が 低く 出ます。★不具合では ありません。★お決めどおりです。
  const POSTPONED = {
    "画面-きょう": "きょうの よてい・時間割・近い 行事 は E群（★後回し）",
    "画面-ノート-連絡": "連絡は 教室の 機能（★E群）",
    "SC-もっと": "学校の 行は E群",
    "SC-プラン": "学校の 値段は E群"
  };
  out.push(line(r.key, src, fit, extra, work, POSTPONED[r.key] || ""));
});

out.push("");
out.push("## 取り下げられた 見本を 見て いる 帳面");
out.push("");
const seen = new Set();
rows.forEach((r) => r.old.forEach((f) => {
  if (seen.has(f)) return;
  seen.add(f);
  out.push("- " + f);
}));
if (!seen.size) out.push("（★1つも ありません）");

fs.writeFileSync(path.join(ROOT, "docs", "reports", "_audit-table.md"),
  out.join("\n") + "\n", "utf8");
console.log(out.join("\n"));
