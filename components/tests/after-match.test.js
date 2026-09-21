#!/usr/bin/env node
// STRIP: A（振る舞い）── ★落とすのは 註 だけ です（★裁定 その137）。
/**
 * ★成立後 の 見張り（★裁定 その94 §4・§5・§8・2026-09-21）。
 *
 *   ★★★守りたいのは 4つ ──
 *     ★① 「落ちました」を 作らない（★ほかの 応募の 状態を 触らない）
 *     ★② 通報の 口を 残す（★§5-4）
 *     ★③ 無い もの（連絡先・誘う・90日）を 在ると 言わない
 *     ★④ 決められるのは 募集の 持ち主 だけ
 *
 *   ★★較正 ── ★2件。
 */
const fs = require("fs");
const path = require("path");
const { stripCode, stripSqlCode, stripCounts, readRaw } = require("./_source");
const ROOT = path.join(__dirname, "..", "..");
let pass = 0, fail = 0;
function t(c, label) {
  if (c) { console.log(`  ✓ ${label}`); pass++; } else { console.log(`  ✗ ${label}`); fail++; }
}
/** ★負けた、と 伝えて いないか。 */
function 落ちたと言う(src) {
  return /(落ちました|選ばれませんでした|不採用|ほかの方に 決ま|他の人に 決ま)/.test(src);
}

async function main() {
  const libRaw = fs.readFileSync(path.join(ROOT, "lib", "afterMatch.js"), "utf-8");
  const lib = stripCode(libRaw);
  const jsx = stripCode(readRaw("components", "AfterMatch.jsx"));
  const sqlRaw = fs.readFileSync(path.join(ROOT, "supabase", "migration_choose_applicant.sql"), "utf-8");
  const sql = stripSqlCode(sqlRaw);
  console.log("  " + stripCounts(sqlRaw, true).line);
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(libRaw.replace(/import[^;]*;/, "const tx=(s)=>s;"), "utf-8").toString("base64"));
  const 見本 = fs.readFileSync(path.join(ROOT, "docs/design/pack-final/00-動く見本-iPhoneで開く用.html"), "utf-8");
  const 見本素 = 見本.replace(/<[^>]+>/g, "").replace(/\\n|\+'|'\+/g, "");

  console.log("=== 一 ★「落ちました」を 作らない ===");
  t(!落ちたと言う(lib) && !落ちたと言う(jsx), "★画面も lib も 言って いない");
  // ★★決める 関数が、★ほかの 応募の 状態を 触って いない こと。
  const fn = (sql.match(/create or replace function public\.choose_applicant[\s\S]*?\$\$;/) || [""])[0];
  const 書 = (fn.match(/update public\.applications[^;]*;/g) || []);
  t(書.length === 1, `★applications を 触るのは 1度 だけ（いま ${書.length}）`);
  t(/where id = p_application_id/.test(書[0] || ""), "★触るのは 決めた 1件 だけ");
  t(!/status = 'closed'[^;]*applications|applications[^;]*status = 'rejected'/.test(fn),
    "★ほかの 応募に 印を 付けて いない");
  t(/update public\.postings set status = 'closed'/.test(fn), "★募集を 閉じる ことで 終わらせる");

  console.log("=== 二 ★決められるのは 募集の 持ち主 だけ ===");
  t(/p\.owner_user_id = auth\.uid\(\)/.test(fn), "★持ち主だけ");
  t(/a\.status <> 'withdrawn'/.test(fn), "★取り下げられて いない こと");
  t(/matching_visible/.test(fn), "★切れて いない こと");
  t(/security definer/.test(fn) && /set search_path = public, pg_temp/.test(fn),
    "★security definer ＋ search_path 固定");
  t(/revoke all on function public\.choose_applicant\(uuid\) from public, anon/.test(sql),
    "★anon には 渡して いない");

  console.log("=== 三 ★成立した 組 だけ が 見られる ===");
  const gm = (sql.match(/create or replace function public\.get_match[\s\S]*?\$\$;/) || [""])[0];
  t(/a\.status = 'chosen'/.test(gm), "★決まった ものだけ");
  t(/a\.applicant_user_id = auth\.uid\(\) or p\.owner_user_id = auth\.uid\(\)/.test(gm),
    "★どちら側からも 見られる");
  t(/matching_visible/.test(gm), "★切れて いれば 見えない");
  t(!/select \*/.test(gm), "★select * を 書いて いない");
  // ★★連絡先の 列が 無い こと。
  t(!/contact|instagram|phone|email/i.test(gm), "★連絡先を 返して いない");

  console.log("=== 四 ★決まった ぶんを「終わったもの」に 落とさない ===");
  const ga = (sql.match(/create or replace function public\.get_my_applications[\s\S]*?\$\$;/) || [""])[0];
  t(/when a\.status = 'chosen' then null/.test(ga), "★決まった ぶんは 終わりでは ない");
  // ★★出す 側から 見れば、★閉じた ものは 終わり です。
  const gp = (sql.match(/create or replace function public\.get_my_postings[\s\S]*?\$\$;/) || [""])[0];
  t(/p\.status <> 'open'/.test(gp), "★閉じた 募集は 終わり");

  console.log("=== 五 ★無い ものを 在ると 言わない ===");
  t(m.NOTES.length === 1, `★断りは 1行 だけ（いま ${m.NOTES.length}）`);
  t(!/90日|誘えるのは/.test(lib.replace(/NOT_YET[\s\S]*?\]\)/, "")),
    "★90日・誘う回数を 約束して いない");
  ["contact", "slots", "invite", "close90", "cut"].forEach((k) =>
    t(m.NOT_YET.some((x) => x.key === k && x.when), `★${k} は when つきで 控えて ある`));
  // ★★見本には 在る こと（★ちがいの 証）。
  t(見本素.indexOf("90日で 自動的に 閉じます") >= 0, "★見本には 90日が 在る");
  t(見本素.indexOf("誘えるのは 3回までです") >= 0, "★見本には 誘う回数が 在る");

  console.log("=== 六 ★通報の 口が 残る（★§5-4） ===");
  t(/onReport/.test(jsx) && /REPORT/.test(jsx), "★通報の 札が ある");
  const vt = stripCode(readRaw("components", "VocalTracker.jsx"));
  t(/from\("matching_reports"\)/.test(vt), "★通報を 入れる 道が ある");
  // ★★★2026-09-21、★「この人との やりとり」の 板が できました。
  //   ★★切る のは ご本人の 動きです。★画面が 作って よい もの です。
  //   ★★★見るのは「**通報の ついでに** 切って いないか」です。
  //     ★★通報の 切りは 台帳の 引き金が 作ります（★裁定 その125）。
  //     ★★画面が 重ねて 作ると、★2つ 行が できます。
  const 報 = vt.slice(vt.indexOf("async function handleReport"),
    vt.indexOf("async function handleReport") + 1100);
  t(報.length > 100, "★通報の ところを 切り出せて いる");
  t(!/matching_cuts/.test(報), "★通報の ついでに 切って いない（★引き金が 作ります）");

  console.log("=== 七 ★読めなかった を 成立して いない に しない ===");
  t(m.isMatched(null) === null, "★null は null（★分からない）");
  t(m.isMatched({ application_id: "x" }) === true, "★在れば true");
  t(m.isMatched({}) === false, "★無ければ false");

  console.log("=== 八 ★較正（★2件） ===");
  const 語 = "kariNoGo2";
  t(!new RegExp(語).test(stripCode(`// ${語}\nconst a = 1;`)), "★① 註の 中は 出ない");
  t(new RegExp(語).test(stripCode(`const a = ${語};`)), "★② 中身は 出る");
  t(落ちたと言う("ほかの方に 決まりました"), "★負けたと 言う 字を 見つける");
  t(!落ちたと言う("この募集は 終わりました"), "★終わった だけでは 当たらない");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
