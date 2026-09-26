#!/usr/bin/env node
// STRIP: B（言葉）── ★約束の 文を 見ます。★何も 落としません。
/**
 * ★お支払いの こと ／ 届いたもの の 見張り（★2026-09-26・D群）。
 *
 *   ★★★見る もの ──
 *     ①★約束の 文が 1文字も 変わって いない か
 *     ②★税の 式を 1つも 書いて いない か（★裁定201）
 *     ③★一覧を 受け取る 形に なって いない か（★「ほかの 出演者の 額は 出ません」）
 *     ④★返信の 欄が 無い か（★「ここに 返信の 欄は ありません」）
 *     ⑤★メールを 画面に 出して いない か
 *     ⑥★90日を 書き写して いない か（★`HIDE_AFTER_DAYS` から 出す）
 *
 *   ★★較正 ── ★各節の 下に、★わざと 壊した ときに 落ちる 見方を 置いて います。
 */
const fs = require("fs");
const path = require("path");
const { stripComments, readRaw, libUrl, inMihon } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}

async function main() {
  const g = await import(libUrl("watashiNoGaku"));
  const m = await import(libUrl("todoitaMono"));
  const ren = await import(libUrl("renraku"));
  const gJsx = readRaw("components", "WatashiNoGaku.jsx");
  const mJsx = readRaw("components", "TodoitaMono.jsx");
  const gCode = stripComments(gJsx);
  const mCode = stripComments(mJsx);

  console.log("=== 一 ★お支払いの こと …… 下の 4行（★約束） ===");
  // ★★★覚えません ── ★見本から 数えます（★`_source.js` の `inMihon`・2026-09-26）。
  //   ★★写して 持つと、★見張りが 間違った 字を 守ります。★実際に 起きました。
  const 約1 = g.NOTES;
  t(約1.length === 4, `★4行（いま ${約1.length}）`);
  約1.forEach((l) => t(inMihon(l), `★見本に 同じ 字が ある …… 「${l.slice(0, 16)}…」`));
  t(g.TITLE === "お支払いの こと", "★題は「お支払いの こと」（★出演料 では ない）");

  console.log("=== 二 ★税の 式を 1つも 書いて いない（★裁定201） ===");
  // ★★割る・引く・掛ける が 額に 触れて いない こと。
  // ★★★「源泉」「消費税」の 字 そのもの は 探しません ──
  //   ★★約束の 文が その 語を 含みます（★「計算は しません」）。
  //     ★★探すと、★自分の 約束で 落ちます。★この 蔵で 2度 踏んだ 罠 です。
  //   ★★★だから **式** を 探します ── ★割る・掛ける・率の 数。
  const 式 = gCode + stripComments(readRaw("lib", "watashiNoGaku.js"));
  t(!/0\.1\b|1\.1\b|\*\s*0\.|\/\s*1\.1|Math\.(floor|round)\([^)]*\*/.test(式),
    "★税の 式（率・割る・掛ける）が 無い");
  // ★★額に 触る 算が 1つも 無い こと（★`toLocaleString` は 区切りだけ）。
  t(!/amount_yen\s*[*/+-]/.test(式), "★額を 計算して いない");
  t(g.amountWord({ amount_yen: 50000 }) === "50,000円", "★額を そのまま 出す");
  t(g.amountWord({}) === "", "★無い ときは 空（★0円と 書かない）");
  // ★★内わけは `memo` の まま。★組み立てて いない。
  t(g.breakdownOf({ memo: "本番1回 ＋ 稽古3回 まとめて" }) === "本番1回 ＋ 稽古3回 まとめて",
    "★内わけは memo の まま");
  t(g.breakdownOf({}) === "", "★無ければ 空（★「—」で 埋めない）");

  console.log("=== 三 ★一覧を 受け取らない（★ほかの 方の 額を 混ぜない） ===");
  t(/\{ row, koenTitle, orgName, onBack \}/.test(gJsx), "★受け取るのは 1行 だけ");
  t(!/rows/.test(gCode), "★`rows` を 受け取って いない");
  t(!/member_name_at/.test(stripComments(readRaw("lib", "watashiNoGaku.js"))),
    "★ほかの 方の お名前を 読む 列が 無い");
  t(g.COLS === "id, koen_id, amount_yen, memo, paid_on", "★読む 列は 5つ だけ");
  // ★★直す 口を 置いて いない（★書けるのは 制作 だけ）。
  t(!/<input|<textarea|onChange/.test(gCode), "★直す 口が 1つも 無い");

  console.log("=== 四 ★届いたもの …… 下の 4行（★約束） ===");
  // ★★★覚えません ── ★見本から 数えます（★2026-09-26）。
  //   ★★ここには 前、★4行を 写して 置いて いました。
  //     ★★その 写しに **空きが 1つ 多く** 入って いました
  //       （★「受け付けない ことも」／★見本は「受け付けないことも」）。
  //     ★★★見張りが 間違った 字を 守って いました ── ★台帳「見張りは 測る。覚えない」。
  //   ★★だから 今は「出して いる 字が、★見本の 中に あるか」を 見ます。
  const 行 = m.noteLines();
  t(行.length === 4, `★4行（いま ${行.length}）`);
  行.forEach((l) => t(inMihon(l),
    `★見本に 同じ 字が ある …… 「${l.slice(0, 16)}…」`));

  console.log("=== 五 ★返信の 欄が 無い ／ メールを 出さない ===");
  t(!/<textarea|<input/.test(mCode), "★返信の 欄が 1つも 無い");
  t(!/from_email/.test(mCode + stripComments(readRaw("lib", "todoitaMono.js"))),
    "★メールを 読んで いない");
  t(m.COLS.indexOf("from_email") < 0, "★読む 列に メールが 無い");
  // ★★迷いの ものは 出さない。
  t(m.visibleRows([{ spam: true }, { spam: false }]).length === 1, "★迷いの ものを 出さない");

  console.log("=== 六 ★90日を 書き写して いない ===");
  t(行[1] === `${ren.HIDE_AFTER_DAYS}日で 消えます。残したいものは、お手元に お写しください。`,
    `★日数は `.concat(`\`HIDE_AFTER_DAYS\`（${ren.HIDE_AFTER_DAYS}）から`));
  t(!/90日/.test(stripComments(readRaw("lib", "todoitaMono.js"))), "★90を 書き写して いない");
  t(!/90/.test(mCode), "★画面にも 書いて いない");

  console.log("=== 七 ★字を 画面に 書き写して いない ===");
  約1.concat(行).forEach((l) => t(!(gJsx + mJsx).includes(l),
    `★直書きして いない …… ${l.slice(0, 12)}…`));
  t(/from "@\/lib\/watashiNoGaku"/.test(gJsx) && /from "@\/lib\/todoitaMono"/.test(mJsx),
    "★字は lib から 受け取って いる");
  // ★★tx() で 包んで いる こと（★9言語の 下ごしらえ）。
  t(/tx\(/.test(readRaw("lib", "watashiNoGaku.js")), "★お支払いの 字は tx() で 包んで ある");
  t(/tx\(/.test(readRaw("lib", "todoitaMono.js")), "★届いたもの の 字も tx() で 包んで ある");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail) process.exit(1);
}
main();
