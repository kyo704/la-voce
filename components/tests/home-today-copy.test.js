#!/usr/bin/env node

// ============================================================================
// きょう（A01）── ★見本の 字と 並びの 見張り
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     の S_kyou（★575〜614行・git hash 7c7c720）
//
//   ★★2026-09-11、★坂本さんの ✗ を 受けて 作りました。
//     ★比較画像で 見つかった もの ──
//       ★① 羊の ひとことに 句点が 2つ（「…ありがとう。。」）
//       ★② 見本に 句点は ない
//       ★③ 下の 1行（羊は「記録した行為」に…）が 出ていない
//       ★④ いちばん下の 3行（.note）が 出ていない
//       ★⑤ 羊の 地（.stage）が ない
//
//   ★★実装は、★取り下げられた 見本（docs/design/pack/screens/A01-…）から
//     ★作られて いました。★正は 4本の 動く見本 だけです。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

(async () => {
  const load = async (rel) => {
    const src = fs.readFileSync(path.join(__dirname, "..", "..", rel), "utf-8");
    return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  };
  const tc = await load("lib/todayCard.js");
  const mihon = fs.readFileSync(path.join(__dirname, "..", "..",
    "docs", "design", "pack-final", "00-動く見本（さわれる・全画面）.html"), "utf8");

  console.log("① 羊の ひとこと（★見本の 字の まま）");
  [tc.SHEEP_THANKS_YET, tc.SHEEP_THANKS_DONE, tc.SHEEP_SUB].forEach((w) => {
    t(mihon.includes(w), "「" + w.slice(0, 28) + "」が 見本に ある");
  });
  // ★★句点を 付けません。★見本に ありません。
  t(!/。$/.test(tc.SHEEP_THANKS_YET), "★まだの 文に 句点を 付けない");
  t(!/。$/.test(tc.SHEEP_THANKS_DONE), "★書いた 文に 句点を 付けない");

  console.log("\n② 書いたか どうかで 変わる こと");
  // ★★見本は S.R.nodo か S.R.deki の どちらかで 変わります。
  t(tc.sheepThanks(null) === tc.SHEEP_THANKS_YET, "★何も 無ければ「来てくれて」");
  t(tc.sheepThanks({}) === tc.SHEEP_THANKS_YET, "★空でも「来てくれて」");
  t(tc.sheepThanks({ throatCondition: 3 }) === tc.SHEEP_THANKS_DONE,
    "★のどの調子が あれば「書いてくれて」");
  t(tc.sheepThanks({ voiceQuality: 2 }) === tc.SHEEP_THANKS_DONE,
    "★声の出来が あれば「書いてくれて」");
  // ★★中身を 見ません。★「わるい」でも 同じ 文です。
  t(tc.sheepThanks({ voiceQuality: 2 }) === tc.sheepThanks({ voiceQuality: 5 }),
    "★中身で 文を 変えない（★行為にだけ 応える）");

  console.log("\n③ いちばん下の 3行（★見本 .note）");
  t(tc.TODAY_NOTE.length === 3, "★3行（" + tc.TODAY_NOTE.length + "）");
  tc.TODAY_NOTE.forEach((w) => {
    t(mihon.includes(w), "「" + w.slice(0, 24) + "」が 見本に ある");
  });

  console.log("\n④ 画面が 使っている こと");
  const home = readCode("components", "HomeV2.jsx");
  const band = readCode("components", "TodayBand.jsx");
  const vt = readCode("components", "VocalTracker.jsx");
  t(/TODAY_NOTE\.map/.test(home), "★きょうの 画面が 3行を 出している");
  t(/<Note fold>/.test(home), "★3行を 畳んでいる（★見本 foldNotes）");
  t(/SHEEP_SUB/.test(band), "★羊の 下の 1行を 出している");
  t(/sheepThanks\(entries\[realTodayDate\]\)/.test(vt), "★門の中は 見本の 文を 使う");
  // ★★門の外（38人）は、★これまでどおりです。
  t(/SHEEP_LINE \+ "。"/.test(vt), "★門の外は これまでどおり");
  // ★★羊の 地（.stage）。
  t(/linear-gradient\(#F6EEDC,#EFE4CC\)/.test(home), "★羊の 地が 見本の 色");
  t(mihon.includes("linear-gradient(#F6EEDC,#EFE4CC)"), "★その 色が 見本に ある");

  console.log("\n⑤ 本番の 朝の ことば（★裁定 2026-09-11・その15 ②）");
  // ★★見本 577〜582行。★アプリは 1文字も 足しません。
  t(tc.MORNING_WORDS_FOOT === "前に あなたが 書いた ことばです", "★下の 1行が 見本の まま");
  t(mihon.includes(tc.MORNING_WORDS_FOOT), "★その 字が 見本に ある");
  // ★★★2026-09-23（★段3a A群）── ★字を 覚えるのを やめました。
  //   ★★もとは `mihon.includes("border-color:#CFC0A4;background:#FDFAF3")` と 書いて ありました。
  //     ★★`#CFC0A4` は、★**どの 見本にも 1度も 出て きません**（★9本 数えました）。
  //       ★見本は 変数で 書いて います ── border-color:var(--ink4);background:var(--card2)
  //     ★★2026-09-11 の 一度きりの 読み違い が、★実装と 見張りの 両方に 入って いました。
  //       ★見張りは その日から きょうまで、★**一度も 通って いません**。
  //   ★★★いまは 見本の `:root` から 値を 引いて くらべます。
  const 変数 = (n) => (mihon.match(new RegExp("--" + n + "\\s*:\\s*([^;}]+)"))
    || [])[1] && (mihon.match(new RegExp("--" + n + "\\s*:\\s*([^;}]+)")))[1].trim();
  const ink4 = 変数("ink4"), card2 = 変数("card2");
  t(Boolean(ink4 && card2), "★見本の :root から 色を 読めた（--ink4 " + ink4 + " / --card2 " + card2 + "）");
  t(mihon.includes("border-color:var(--ink4);background:var(--card2)"),
    "★見本は その 2つを 使って いる");
  const 実背 = (home.match(/borderColor: "(#[0-9A-Fa-f]{6})", background: "(#[0-9A-Fa-f]{6})"/) || []);
  t(実背[2] && card2 && 実背[2].toUpperCase() === card2.toUpperCase(),
    "★地の 色は 見本と 同じ（" + 実背[2] + " / " + card2 + "）");
  // ★★★枠の 色は ちがいます（★実装 #CFC0A4 ／ 見本 --ink4）。
  //   ★★見た目の お決め なので、★勝手に 変えません。★台帳に 書いて 置きます。
  //   ★★★書いて 置く ことを、★ここで 見ます。★消したら 赤く なります。
  const 除 = JSON.parse(require("fs").readFileSync(
    require("path").join(__dirname, "..", "..", "tools", "excluded_by_design.json"), "utf8"));
  const 枠 = ((除.__diff__ || {})["home.morningWords.borderColor"]) || null;
  t(Boolean(枠 && 枠.why && 枠.reopen_when),
    "★枠の 色の ちがいが、★わけと 開き直す 引き金つきで 書いて ある");
  t(Boolean(枠) && 枠.mihon && ink4 && 枠.mihon.toUpperCase() === ink4.toUpperCase(),
    "★書いて ある 見本の 値が、★いまの 見本と 同じ（★見本が 変わったら 赤く なります）");
  t(Boolean(枠) && 実背[1] && 枠.app.toUpperCase() === 実背[1].toUpperCase(),
    "★書いて ある 実装の 値が、★いまの 実装と 同じ");
  // ★★その日の 本番だけ。★前の日も 次の日も 出しません。
  const P = [{ performed_on: "2026-09-11", label: "秋の 演奏会", morning_words: "ことば" }];
  t(tc.morningWordsFor(P, "2026-09-11").words === "ことば", "★その日は 出す");
  t(tc.morningWordsFor(P, "2026-09-10") === null, "★前の日は 出さない");
  t(tc.morningWordsFor(P, "2026-09-12") === null, "★次の日は 出さない");
  // ★★書いて いない 方には、★枠ごと 出しません。
  t(tc.morningWordsFor([{ performed_on: "2026-09-11" }], "2026-09-11") === null,
    "★書いて いなければ 出さない");
  t(tc.morningWordsFor([{ performed_on: "2026-09-11", morning_words: "  " }], "2026-09-11") === null,
    "★空白だけなら 出さない");
  t(tc.morningWordsFor(null, "2026-09-11") === null, "★予定が 無くても 落ちない");
  // ★★1文字も 足しません。★要約しません。
  const long = "あ\nい\nう";
  t(tc.morningWordsFor([{ performed_on: "2026-09-11", morning_words: long }], "2026-09-11").words === long,
    "★書かれた ままを 返す（★改行も そのまま）");
  t(/whiteSpace: "pre-wrap"/.test(home), "★改行を 画面でも そのまま 出す");
  // ★★誘いません。★知らせません。
  t(!/書きませんか|書いてみ|おすすめ/.test(home), "★書くように 誘って いない");

  console.log("\n⑥ 消した もの（★お決め ㋑・㋒）");
  t(!/こえの調子/.test(home), "★2枚の カードが 無い");
  t(!/みつけたこと/.test(home), "★見出し「みつけたこと」が 無い");
  // ★★出す ために だけ あった 計算も 外して います（★N-1 の 決まり）。
  t(!/const cond = /.test(home), "★出す ための 計算も 残して いない");
  // ★★記録も 列も 消して いません。★計算は lib に 残って います。
  t(/export function conditionWord/.test(readCode("lib", "todayCard.js")),
    "★conditionWord は lib に 残って いる");
  // ★★topDiscoveries は 門の外で 使われて います。★消して いません。
  const vt2 = readCode("components", "VocalTracker.jsx");
  t(/const topDiscoveries = useMemo/.test(vt2), "★みつけたことの 計算は 残って いる");

  console.log("\n⑦ 切替の 条件（★裁定 ㋐ の 4つ）");
  // ★④ 役職の ない人には 出さない。
  t(/const mayChooseViewAs = layoutV2 && canTeachLessons;/.test(vt2),
    "★④ 教える 立場の 方だけに 出す");
  t(/canChooseViewAs=\{mayChooseViewAs\}/.test(vt2), "★それを 渡して いる");
  // ★③ 既定は じどう。
  const va = readCode("lib", "viewAs.js");
  t(/return KEYS\.includes\(v\) \? v : "auto";/.test(va), "★③ 知らない 値は じどう");
  t(/\{ key: "auto", label: "じどう" \}/.test(va), "★じどう が 1つめ");
  // ★① 見え方だけ。★台帳を 分けません。
  t(!/supabase|from\("/.test(va), "★① 台帳に 触って いない（★見え方だけ）");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
