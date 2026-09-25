// ============================================================================
// ★記録の 上に 出す ものは 重ねる ── ★下に 積まない（★2026-09-25）
//
// STRIP: A   ★出し方（★動き）を 見ます。
//
//   ★★★坂本さんの 実機の ご報告（2026-09-25）──
//     「★『?』を 押すと 画面の 一番下に 出る。★レイアウト的に 不自然で、
//       ★表示された ことに 気づきにくい」
//
//   ★★★わけ ── ★`recordSheet` の 中身は、★記録の 画面が **出た まま** 描かれます。
//     ★だから 重ねる 形を 持って いないと、★記録の 続きとして 下に 積まれます。
//     ★★ほかの `recordSheet`（ねむり・たべ・からだ …）は `BottomSheet` を
//       ★使って いて、★あれは `position: fixed` です。★だから 重なります。
//     ★★★`きまり` だけ ふつうの `<div>` でした。★それが この 不具合 です。
//
//   ★★★だから 見る ものは 1つ です ──
//     ★`recordSheet === "…"` で 出す 部品は みな、
//     ★`BottomSheet` を 使うか、★自分で `position: fixed` を 持つ こと。
//
//   ★★`Back` を 使う 画面 ぜんぶ を 見る のでは ありません ──
//     ★★★親が **入れ替えて** 出す 画面（NotesV2 など）は 重ねる 必要が ありません。
//       ★二重に 重ねると 戻れなく なります。
//       ★2026-09-25 に 一度 そう 書いて、★26件 赤く なりました。★直しました。
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let 済 = 0, 悪 = [];
const よし = (b, m) => { 済 += 1; if (!b) 悪.push(m); };

const 根 = path.join(__dirname, "..", "..");
const vt = readCode("components", "VocalTracker.jsx");

// ── ★`recordSheet === "…"` で 出して いる 部品を 集めます ──────────
const 組 = [];
const re = /recordSheet === "([^"]+)"[\s\S]{0,400}?<([A-Z]\w+)/g;
let m;
while ((m = re.exec(vt)) !== null) 組.push({ 名: m[1], 部品: m[2] });

よし(組.length > 0, "★`recordSheet` で 出して いる ところが 見つかりません");

for (const { 名, 部品 } of 組) {
  const f = path.join(根, "components", 部品 + ".jsx");
  if (!fs.existsSync(f)) continue;           // ★外から 来た 部品
  const s = readCode("components", 部品 + ".jsx");
  const 重ね = /position:\s*"fixed"/.test(s) || /<BottomSheet\b/.test(s);
  よし(重ね, "★" + 名 + "（" + 部品 + "）が 下に 積まれます ── "
       + "★`BottomSheet` を 使うか、★`position: fixed` を 持って ください");
  if (/position:\s*"fixed"/.test(s)) {
    // ★★★`C.bg` は ありません。★書くと 下が 透けます（★2026-09-11・OwnedLedger）。
    よし(!/background:\s*C\.bg\b/.test(s),
         "★" + 部品 + " が `C.bg` を 使って います（★そんな 色は ありません）");
    よし(/background:\s*C\.(paper|card)\b/.test(s),
         "★" + 部品 + " に 地の 色が ありません（★下が 透けます）");
  }
}

// ── ★目盛り合わせ ──────────────────────────────────────
function わざと() {
  const s = readCode("components", "KirokuNoKimari.jsx");
  const 壊 = s.replace(/position:\s*"fixed"/, 'position: "static"');
  return [
    ["重ねるのを やめる", !(/position:\s*"fixed"/.test(壊) || /<BottomSheet\b/.test(壊))],
    ["地の 色を C.bg に する",
     /background:\s*C\.bg\b/.test(s.replace(/background:\s*C\.paper/, "background: C.bg"))]
  ];
}

console.log("PUSHED_SCREEN_OVERLAY");
console.log("  ★`recordSheet` で 出す 部品 …… " + 組.length);
for (const { 名, 部品 } of 組) console.log("    " + 名 + " → " + 部品);
console.log("\n★目盛り合わせ");
let 目悪 = [];
for (const [n, ok] of わざと()) {
  console.log("  " + (ok ? "○" : "×") + " " + n);
  if (!ok) 目悪.push(n);
}
if (目悪.length) {
  console.log("\n★★止まりました ── " + 目悪.join("／"));
  console.log("RESULT: NG");
  process.exit(1);
}
console.log("\n★見た …… " + 済 + "件");
if (悪.length) {
  for (const m2 of 悪) console.log("  NG   " + m2);
  console.log("RESULT: NG（" + 悪.length + "件）");
  process.exit(1);
}
console.log("RESULT: OK");
