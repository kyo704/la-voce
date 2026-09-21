#!/usr/bin/env node
// STRIP: A（振る舞い）── ★落とすのは 註 だけ です（★裁定 その137）。
/**
 * ★この人との やりとり の 見張り（★裁定 その94 §5・§5-4・2026-09-21）。
 *
 *   ★★★守りたいのは 4つ ──
 *     ★① わけを 聞かない・確認を 挟まない（★§5「1タップ」）
 *     ★② 相手に 知らせない（★通知の 道が ない）
 *     ★③ 切った あとでも 通報の 口が 残る（★§5-4）
 *     ★④ 切った ことは ご本人 だけ が 見られる
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
/** ★知らせる 道が あるか。 */
function 知らせる(src) {
  return /user_notices|notice_targets|sendBeacon|Notification|push\(.*notify|mail|resend/i.test(src);
}

async function main() {
  const libRaw = fs.readFileSync(path.join(ROOT, "lib", "cutSheet.js"), "utf-8");
  const lib = stripCode(libRaw);
  const jsx = stripCode(readRaw("components", "CutSheet.jsx"));
  const vt = stripCode(readRaw("components", "VocalTracker.jsx"));
  const sql = stripSqlCode(fs.readFileSync(path.join(ROOT, "supabase", "migration_matching_cuts.sql"), "utf-8"));
  console.log("  " + stripCounts(libRaw).line);
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(libRaw.replace(/import[^;]*;/, "const tx=(s)=>s;"), "utf-8").toString("base64"));
  const 見本 = fs.readFileSync(path.join(ROOT, "docs/design/pack-final/00-動く見本-iPhoneで開く用.html"), "utf-8");
  const 見本素 = 見本.replace(/<[^>]+>/g, "").replace(/\\n|\+'|'\+/g, "");

  console.log("=== 一 ★1押し（★確認を 挟まない・§5） ===");
  t(!/<Ask|set聞く/.test(jsx), "★お尋ねの 1枚を 挟んで いない");
  t(!/window\.confirm|confirm\(/.test(jsx), "★確認の 窓も 出して いない");
  t(/理由は うかがいません。/.test(lib), "★わけを 聞かない と 書いて ある");
  // ★★間違えても 戻せる こと（★だから 確認が 要りません）。
  t(/delete\(\)/.test(vt.slice(vt.indexOf("handleUndoCut"), vt.indexOf("handleUndoCut") + 700)),
    "★戻す 道が ある");

  console.log("=== 二 ★相手に 知らせない（★§5） ===");
  t(!知らせる(lib) && !知らせる(jsx), "★知らせる 道が 無い");
  const 切 = vt.slice(vt.indexOf("async function handleCut"), vt.indexOf("async function handleCut") + 900);
  t(!知らせる(切), "★切る ときにも 知らせて いない");
  t(/相手には 知らせません。/.test(lib), "★そう 書いて ある");

  console.log("=== 三 ★切った あとでも 通報できる（★§5-4） ===");
  t(/onReport/.test(jsx), "★通報の 口が 同じ 板に ある");
  t(/切ったあとでも、ここから お知らせいただけます。/.test(lib), "★そう 書いて ある");
  // ★★切りと 通報は 別の 道 で ある こと。
  t(/setReportTo/.test(vt) && /from\("matching_reports"\)/.test(vt), "★通報の 道が 別に ある");

  console.log("=== 四 ★ご本人 だけ が 見られる（★§5） ===");
  t(/auth\.uid\(\) = user_id/.test(sql), "★門は ご本人 だけ");
  t(!/is_org_owner|has_can|admin/.test(sql), "★運営にも 道が 無い");
  t(/あなただけが 見られます/.test(lib), "★そう 書いて ある");

  console.log("=== 五 ★決まって いない ものを 出さない ===");
  t(m.KINDS.length === 2, `★出すのは 2つ（いま ${m.KINDS.length}）`);
  t(!m.KINDS.some((k) => k.key === "withdraw"), "★取り下げは 出して いない");
  t(m.NOT_YET.some((x) => x.key === "withdraw" && x.when), "★when つきで 控えて ある");
  // ★★台帳の 縛りには 4つ ある こと（★出さない だけ です）。
  t(/'withdraw'/.test(sql), "★台帳には 在る（★使って いない だけ）");

  console.log("=== 六 ★字が 見本と 同じ ===");
  [m.HEAD, m.REPORT, m.REPORT_NOTE, ...m.KINDS.map((k) => k.label)].forEach((s) =>
    t(見本素.indexOf(s) >= 0, `★見本に「${s.slice(0, 18)}」が ある`));

  console.log("=== 七 ★較正（★2件） ===");
  const 語 = "kariNoGo3";
  t(!new RegExp(語).test(stripCode(`// ${語}\nconst a = 1;`)), "★① 註の 中は 出ない");
  t(new RegExp(語).test(stripCode(`const a = ${語};`)), "★② 中身は 出る");
  t(知らせる('supabase.from("user_notices").insert({})'), "★知らせる 道を 見つける");
  t(!知らせる('supabase.from("matching_cuts").insert({})'), "★切る だけでは 当たらない");

  console.log(`\n${pass} 通り ／ ${fail} 落ち`);
  if (fail > 0) process.exit(1);
}

main();
