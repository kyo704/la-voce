#!/usr/bin/env node
// ============================================================================
// ノート（見本⑥・Apple メモ方式）の 見張り
//
//   ★出どころ docs/opus/woolsong-見本-画面11点（9月9日）.png ⑥
//     「★タイトル欄は ありません。★保存ボタンも ありません。」
//     「★開いてから 1文字目までを、★いちばん短く。」
//
//   ★★確かめること
//     ① 見出しを、★本文の 1行目から 作ること（★列に しない）。
//     ② タイトルの 欄が 無いこと。★保存ボタンが 無いこと。
//     ③ 送れなかったら、★閉じないこと（★書いたものを 消さない）。
//     ④ 消しても、★行を 消さないこと（★deleted_at だけ）。
//     ⑤ 帯は 4つ。★増やさないこと。
//     ⑥ 門の中だけ。★38人には これまでの ノートが 出ること。
//     ⑦ 台帳（書き出し・退会）に 入っていること。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

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
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "notes.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const ui = readCode("components", "NotesV2.jsx");
  const raw = readRaw("components", "NotesV2.jsx");
  const vt = readCode("components", "VocalTracker.jsx");

  console.log("=== ① 見出しは 本文の 1行目 ===");
  eq(m.titleOf("下降形で 喉が上がる。\n肋骨をひらいたまま"), "下降形で 喉が上がる。", "1行目から");
  eq(m.titleOf("\n\n  二行目から"), "二行目から", "★空行から 書いても 諦めない");
  eq(m.titleOf("   \n  "), null, "★何も 無ければ null");
  eq(m.titleOf(""), null, "空も null");
  eq(m.titleOf(null), null, "無くても 落ちない");
  t(m.titleOf("あ".repeat(80)).length === m.TITLE_MAX, `★長いときは ${m.TITLE_MAX} で 切る`);
  eq(m.previewOf("一行目\n二行目\n三行目"), "二行目 三行目", "つづきも 出せる");
  eq(m.previewOf("一行だけ"), null, "つづきが 無ければ null");
  // ★★列に していないこと
  t(!/title/i.test(readCode("lib", "notes.js").replace(/titleOf|TITLE_MAX/g, "")),
    "★title という 列を 持っていない");
  const sql = readRaw("supabase", "2026-09-09-ノートの表.sql");
  t(!/\btitle\b\s+text/.test(sql), "★表にも title の 列が 無い");
  t(/見出しの 列は 作らない|見出しの列は作らない/.test(sql), "★作らない、と 書いてある");

  console.log("\n=== ② タイトル欄が 無い・保存ボタンが 無い ===");
  // ★★禁じた語は 注記を 外した本文で（★CLAUDE.md）。
  //   ★注記に「タイトル欄は ありません」と 書いてあります。
  t(!/タイトル/.test(ui), "★タイトルの 欄が 無い");
  t(/タイトルの 欄が ありません/.test(raw), "★無いことを、注記に 残してある");
  t(!/>保存</.test(raw) && !/保存する/.test(raw), "★保存ボタンが 無い");
  t(/AUTOSAVE_MS/.test(ui), "★手が 止まってから 送る");
  t(/onChange=\{\(e\) => setEditing/.test(ui), "★打つたびに 覚える");
  // ★★1文字目までを いちばん短く
  t(/boxRef\.current\.focus\(\)/.test(ui), "★開いたら すぐ 書ける");
  t(/setEditing\(\{ id: null, body: "" \}\)/.test(ui), "★＋で すぐ 書ける（★名前を 先に 聞かない）");

  console.log("\n=== ③ 送れなかったら 閉じない ===");
  t(/if \(ok\) \{ setEditing\(null\)/.test(ui), "★送れたときだけ 閉じる");
  t(/開いたまま/.test(raw), "★開いたままに する、と 書いてある");
  t(/const ok = await onSave/.test(ui), "★送れたかを 受け取っている");
  t(/return true;[\s\S]{0,200}catch/.test(readCode("components", "VocalTracker.jsx")
    .slice(readCode("components", "VocalTracker.jsx").indexOf("handleSaveNote"))),
    "★呼ぶ側が、送れたかを 返している");
  t(/\.select\("id"\)/.test(vt.slice(vt.indexOf("handleSaveNote"), vt.indexOf("handleSaveNote") + 900)),
    "★0行を 成功と 数えない");

  console.log("\n=== ④ 消しても 行を 消さない ===");
  const del = vt.slice(vt.indexOf("handleDeleteNote"), vt.indexOf("handleDeleteNote") + 500);
  t(/deleted_at: new Date/.test(del), "★deleted_at を 入れるだけ");
  t(!/\.delete\(\)/.test(del), "★行を 消していない");
  eq(m.alive([{ id: 1 }, { id: 2, deleted_at: "x" }]).map((n) => n.id), [1], "★消したものは 出さない");
  t(/is\("deleted_at", null\)/.test(vt), "★読むときも 外している");

  console.log("\n=== ⑤ 帯は 4つ ===");
  // ★★3つ目は「連絡」です（★見本④・2026-09-10）。
  //   ★見本⑥は「門下」でしたが、★見本④で「連絡」に なりました。
  //   ★★これだけ、★ノートでは ありません。★門下の 連絡板が 開きます。
  //     ★見本④「★ノートの中。★タブは 増やしません」。
  eq(m.NOTE_KINDS.map((k) => k.label), ["稽古", "レパートリー", "連絡", "1枚"], "★見本④の 4つ");
  eq(m.isRenrakuKind("studio"), true, "★「連絡」は ノートでは ない");
  ["practice", "repertoire", "clinic"].forEach((k) =>
    eq(m.isRenrakuKind(k), false, `★「${k}」は ノート`));
  eq(m.kindOrDefault("うそ"), "practice", "★知らない帯は 既定に 戻す");
  eq(m.kindOrDefault("clinic"), "clinic", "知っている帯は そのまま");
  t(/kind text not null default 'practice'/.test(sql), "★表の 既定も 同じ");
  t(/'practice', 'repertoire', 'studio', 'clinic'/.test(sql), "★表も 4つだけ 許す");

  console.log("\n=== さがす・並び ===");
  const N = [
    { id: 1, kind: "practice", body: "フィガロ 2幕", updated_at: "2026-09-05" },
    { id: 2, kind: "practice", body: "高音が乗らない", updated_at: "2026-09-08" },
    { id: 3, kind: "clinic", body: "受診のこと", updated_at: "2026-09-09" },
    { id: 4, kind: "practice", body: "消したもの", updated_at: "2026-09-09", deleted_at: "x" }
  ];
  eq(m.visibleNotes(N, "practice", "").map((n) => n.id), [2, 1], "★新しい順・消したものは 出ない");
  eq(m.visibleNotes(N, "practice", "高音").map((n) => n.id), [2], "★ことばで さがせる");
  eq(m.visibleNotes(N, "clinic", "").map((n) => n.id), [3], "★帯で 分かれる");
  eq(m.searchNotes(N, "フィガロ").map((n) => n.id), [1], "大文字小文字を 分けない");

  console.log("\n=== ⑥ 門の中だけ ===");
  t(/activeTab === "notes" && layoutV2 &&[\s\S]{0,120}<NotesV2/.test(readRaw("components", "VocalTracker.jsx")),
    "★NotesV2 は 門の中だけ");
  // ★★これまでの ノートが、★門の外に そろって 残っていること
  ["repertoire", "own", "practice", "calendar", "memo"].forEach((k) => {
    t(new RegExp(`activeTab === "notes" && !layoutV2 && notesSubTab === "${k}"`)
      .test(readRaw("components", "VocalTracker.jsx"))
      || new RegExp(`notes" && !layoutV2 && notesSubTab === "${k}"`).test(readRaw("components", "VocalTracker.jsx")),
      `★これまでの「${k}」が 門の外に 残っている`);
  });
  t(!/NEXT_PUBLIC/.test(ui), "★画面じしんは 環境変数を 読まない");
  t(ui.indexOf("この中から さがす") < Math.max(ui.indexOf("list.map"), ui.indexOf("rows.map")),
    "★見本どおり、検索欄を一覧より上に置く");
  t(/まだ、稽古の メモが ありません。/.test(raw)
    && /曲を 足す/.test(raw)
    && /まだ、受診用の 1枚が ありません。/.test(raw),
    "★種類ごとに空状態を案内する");

  console.log("\n=== ⑦ 台帳に 入っている ===");
  t(/table: "notes"/.test(readRaw("lib", "exportData.js")), "★書き出しに ある");
  t(/"notes",/.test(readRaw("lib", "accountDeletion.js")), "★退会の 消し込みに ある");

  console.log("\n=== はじめの 尋ねごとを 増やさない ===");
  t(/if \(activeTab !== "notes"\) return;/.test(vt), "★その帯を 開いたときに はじめて 読む");

  {
    // ★★読みに行く useEffect を、★名前で 探します。
    //   ★はじめ fetchNotes(); の まわりを 切りましたが、
    //   ★handleSaveNote の 中の 呼び出しに 当たっていました。
    const at = vt.indexOf("void fetchNotes();");
    const block = at > 0 ? vt.slice(Math.max(0, at - 300), at) : "";
    t(/if \(!layoutV2\) return;/.test(block), "★門の外の方は 1度も 読まない");
    t(/if \(activeTab !== "notes"\) return;/.test(block), "★その帯のときだけ 読む");
  }

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
