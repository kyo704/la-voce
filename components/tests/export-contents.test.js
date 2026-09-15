#!/usr/bin/env node

// ============================================================================
// ★書き出しに 入れるものの 一覧
//
//   ★出どころ 見本 `SC['書き出す']` ──「入れるもの」の 5行
//   ★裁定 2026-09-15・Opus（坂本さん 経由）
//     「㋑ 19表 全て 表示（★5表のみでは なく）」
//       ★わけ ── 一部だけの 一覧は「残りは 含まれない」という 誤解を 招く。
//         ★医師に 渡す 可能性が ある 以上、★読み手は 中身の 全体を 知る 必要が ある。
//     「グループ分けして 読みやすく」「含まれないものが あれば 明記」
//     「㋓ 採用。約束として 扱う（★文言だけで なく 実際の 義務として）」
//     「㋐ 選択UIなし。『両方 落ちてきます』と 明記」
//
//   ★★この見張りの 芯は **両向き** です。
//     ★① 書き出す 表が、★一覧に 挙がって いること
//     ★② 一覧に 挙げた 表が、★本当に 書き出されて いること
//     ★★片向きだけだと、★表を 足した 人が 一覧を 直し忘れます。
//       ★★それが 2026-09-15 に 退会の 画面で 見つかった 欠けの 形です
//         （★レパートリーは 消えるのに、★画面に 名前が ありません でした）。
//
//   ★★㋓ は 約束 です。★言葉だけ 合って いても 足りません。
//     ★★「いつでも 無料」── ★書き出しの 道に 門が 無いこと も 見ます。
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

  const real = E.EXPORTED_TABLES.map((x) => x.table);
  const listed = E.EXPORT_CONTENT_GROUPS.flatMap((g) => g.items.flatMap((i) => i.tables));

  console.log("① ★書き出す 表が、★一覧に 挙がって いること");
  const notListed = real.filter((x) => !listed.includes(x));
  notListed.forEach((x) => console.log("    ✗ 一覧に ありません: " + x));
  t(notListed.length === 0, "EXPORTED_TABLES の " + real.length + " 表 すべてが 一覧に ある");

  console.log("\n② ★一覧に 挙げた 表が、★本当に 書き出されて いること");
  // ★★逆向きです。★「入れます」と 言って 入れて いない のが いちばん 悪い。
  const notExported = listed.filter((x) => !real.includes(x));
  notExported.forEach((x) => console.log("    ✗ 書き出して いません: " + x));
  t(notExported.length === 0, "一覧の " + listed.length + " 表 すべてが 書き出されて いる");

  console.log("\n③ 5行では なく、★19表 すべて（★㋑）");
  t(real.length >= 19, "書き出す 表が 19以上（いま " + real.length + "）");
  t(listed.length === real.length, "一覧の 数と 表の 数が 同じ");
  t(E.EXPORT_CONTENT_GROUPS.length >= 4, "かたまりに 分けて ある（" + E.EXPORT_CONTENT_GROUPS.length + "組）");
  // ★★見本の 5つが、★言い換えられて いても 入って いること。
  const all = E.EXPORT_CONTENT_GROUPS.flatMap((g) => g.items.map((i) => i.label)).join("／");
  [["entries", "記録"], ["notes", "ノート"], ["repertoire_tessitura", "レパートリー"],
   ["org_event_participants", "出欠"], ["item_acquisitions", "台帳"]].forEach(([tb, word]) => {
    t(all.includes(word), "見本の 行「" + word + "」が 一覧に ある（" + tb + "）");
  });

  console.log("\n④ 入って いないものを、★はっきり 書いて いること（★㋑）");
  t(E.EXPORT_EXCLUDED.length >= 3, "入って いないものを " + E.EXPORT_EXCLUDED.length + "件 挙げて いる");
  // ★★わけ の 無い 行を 置かない こと。★「入れません」だけ では 足りません。
  t(E.EXPORT_EXCLUDED.every((x) => x.why && x.why.length > 0), "どれにも わけが 書いて ある");
  t(E.EXPORT_EXCLUDED.some((x) => x.label.includes("先生")), "先生の メモを 挙げて いる");

  console.log("\n⑤ ★共有の 履歴は、★お相手を 落として いること");
  // ★★㋙（★現状維持・裁定で「特に 正しい 判断」と されました）。
  t(Array.isArray(E.SHARE_HISTORY_SAFE_COLUMNS), "通す 列を 並べて いる");
  t(!E.SHARE_HISTORY_SAFE_COLUMNS.includes("teacher_id"), "teacher_id を 通して いない");
  t(!E.SHARE_HISTORY_SAFE_COLUMNS.includes("student_id"), "student_id を 通して いない");
  const san = E.sanitizeShareHistory([{ teacher_id: "abc", status: "active", student_id: "me" }]);
  t(san.length === 1 && !("teacher_id" in san[0]), "実際に 落ちて いる");
  t(san[0].connection === "連携1", "番号だけ 振って いる");

  console.log("\n⑥ 形を 選ばせない こと（★㋐）");
  t(Array.isArray(E.EXPORT_FORMAT_NOTE) && E.EXPORT_FORMAT_NOTE.length >= 1, "形の 但し書きが ある");
  t(E.EXPORT_FORMAT_NOTE.join("").includes("両方"), "「両方 落ちてきます」と 書いて ある");
  t(/EXPORT_FORMAT_NOTE\.map\(/.test(vt), "画面が それを 描いて いる");
  // ★★選ばせる 札を 置いて いない こと。
  t(!/setExportFormat|exportFormat/.test(vt), "形を 選ぶ 覚えを 作って いない");

  console.log("\n⑦ ★★㋓ の 約束（★文言だけで なく 実際の 義務として）");
  t(typeof E.EXPORT_PROMISE === "string" && E.EXPORT_PROMISE.length > 0, "約束の 字が lib に ある");
  t(E.EXPORT_PROMISE === "書き出しは いつでも 無料です。退会された あとも、お手元の ファイルは あなたの ものです。",
    "裁定の 文言と 1文字も ちがわない");
  t(/\{EXPORT_PROMISE\}/.test(vt), "画面が それを 描いて いる");
  t(!vt.includes("書き出しは いつでも 無料です。退会された"), "画面側に 直書きして いない");

  // ★★①「いつでも 無料」── ★書き出しの 道に 門を 置いて いない こと。
  //   ★★`REQUIRE_SUBSCRIPTION` が true に なっても 通る、★という 約束です。
  //   ★★`startExport()` が 見るのは 本人確認だけ で、★支払いでは ありません。
  const si = vt.indexOf("function startExport()");
  const sblk = si >= 0 ? vt.slice(si, vt.indexOf("}", vt.indexOf("setReauthFor", si))) : "";
  t(si >= 0, "startExport() が ある");
  t(!/subscription|isPaid|paid|REQUIRE_SUBSCRIPTION/.test(sblk), "書き出しの 道に 支払いの 門が ない");
  t(/reauthStillValid/.test(sblk), "見るのは 本人確認だけ");

  console.log("\n⑧ 見出しの 約束（★㋒）が、★見張りの 通った あとに 出て いること");
  t(Array.isArray(E.EXPORT_HEADING_NOTE) && E.EXPORT_HEADING_NOTE.length === 2, "見本の 2行が ある");
  t(/EXPORT_HEADING_NOTE\.map\(/.test(vt), "画面が それを 描いて いる");
  // ★★この 2行は 約束 です。★裏づけが 無ければ 出しては いけません。
  //   ★★裏づけ = `export-headings.test.js`。★在ること を 見ます。
  t(fs.existsSync(path.join(__dirname, "export-headings.test.js")),
    "裏づけの 見張り（export-headings）が ある");
  t(E.forbiddenHeadings().length === 0, "禁止語を 含む 見出しが 0件（★約束が 守れて いる）");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
