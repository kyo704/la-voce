// ============================================================================
// 背の高い品（兜8点）── 2026-09-08 夜
//
//   ★出どころ Opus の裁定 kabuto-v10（★woolsong-荷物-兜8点v10）
//
//   ★★何が 起きていたか
//     ★兜8点だけ、★絵の高さが 1024 では なく 1280 です。
//       ★前立（三日月・角・鹿の角）が、★頭より 上に 出るためです。
//     ★★上ぞろえ（inset:0）で 重ねていたので、★中身が 256px 下に ずれていました。
//
//   ★★守ること
//     ・★着ているときは、★下ぞろえで 重ねること（★bottom:0／height:auto）
//     ・★objectFit:contain を 使わないこと（★枠に収める＝はみ出させない、の逆）
//     ・★名簿の 大きさが、★絵の 実物と 合っていること
//     ・★一覧の 小さい絵は、★これまでどおり 切り抜いてよい
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

// ★PNG の 頭から、★幅と高さを 読みます（★絵の道具を 使いません）。
function pngSize(file) {
  const b = fs.readFileSync(file);
  return [b.readUInt32BE(16), b.readUInt32BE(20)];
}

console.log("■ ★絵の 大きさ");
const idx = JSON.parse(fs.readFileSync(
  path.join(ROOT, "docs", "assets", "sheep-items-index.json"), "utf-8"));
const items = Array.isArray(idx) ? idx : idx.items;

const tall = [];
let checked = 0;
for (const i of items) {
  if (!i.file) continue;
  const f = path.join(ROOT, "public", "sheep", i.file);
  if (!fs.existsSync(f)) continue;
  const [w, h] = pngSize(f);
  checked++;
  // ★★名簿と 実物が 合っていること。★ここが ずれると、置き方を 誤ります。
  if (Array.isArray(i.size) && (i.size[0] !== w || i.size[1] !== h)) {
    failed++;
    console.log(`  ✗ ★${i.key} の 大きさが 名簿と違う（名簿 ${i.size} ／ 実物 ${w}×${h}）`);
  }
  if (h > w) tall.push([i.key, w, h]);
}
ok(`★${checked} 点の 大きさが、名簿と 合っている`, true);
// ★★兜8点が、★1024×1280 であること。
const kab = tall.filter(([k]) => k.startsWith("hatKabuto"));
ok(`★背の高い品は 8点（いま ${tall.length}）`, tall.length === 8, tall.map((t) => t[0]).join(" "));
ok("★8点とも 兜", kab.length === 8);
ok("★8点とも 1024×1280", kab.every(([, w, h]) => w === 1024 && h === 1280));
// ★★上が切れた 古い版に 戻っていないこと。
ok("★政宗が 1024×1024 に 戻っていない",
  !kab.some(([k, , h]) => k === "hatKabutoMasamune" && h === 1024));

console.log("■ ★重ね方");
const sd = readCode("components", "SheepDressed.jsx");
ok("★下ぞろえ（bottom:0）で 重ねている",
  /position: "absolute", left: 0, bottom: 0,/.test(sd));
ok("★たては 絵なり（height:auto）", /width: "100%", height: "auto",/.test(sd));
// ★★枠に収める指定を、★着ている絵に 使わないこと。
ok("★★objectFit:contain を 使っていない", !/objectFit: "contain"/.test(sd));

console.log("■ ★一覧は、これまでどおり");
// ★★一覧の 小さい絵は、★切り抜いて よい（★坂本さんのお決め）。
//   ★1辺 144 の 四角に そろっていること。
for (const [k] of kab) {
  const t = path.join(ROOT, "public", "sheep", "thumbs", k + ".png");
  if (!fs.existsSync(t)) { failed++; console.log("  ✗ ★" + k + " の 小さい絵が 無い"); continue; }
  const [w, h] = pngSize(t);
  if (w !== 144 || h !== 144) { failed++; console.log(`  ✗ ★${k} の 小さい絵が 144×144 でない（${w}×${h}）`); }
}
ok("★兜8点の 小さい絵が、144×144 でそろっている", true);

console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
process.exit(failed === 0 ? 0 : 1);
