#!/usr/bin/env node
/**
 * 羊のおうち Stage A（作業指示-羊StageAとアイテム.md A-1〜A-6）。
 *
 * ★§9 のゲート: A-1・A-2 が終わった時点で、実機での確認が要ります。
 *   柵と羊の重なり、接地の影は、画面で見ないと分かりません。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

const ui = readCode("components", "CharacterHome.jsx");
const raw = readRaw("components", "CharacterHome.jsx");

console.log("=== A-1: 柵と羊の重なり ===");
const layer = ui.match(/const LAYER_CONFIG = \{([\s\S]*?)\};/)[1];
const z = {};
layer.replace(/(back|mid|front):\s*\{\s*z:\s*(\d+)/g, (_, k, v) => { z[k] = Number(v); });
assertTrue(z.back < z.mid && z.mid < z.front, `層の順序が back(${z.back}) < mid(${z.mid}) < front(${z.front})`);
assertTrue(/zIndex: frontZ/.test(ui), "★羊は front 層に固定されている");
assertTrue(/zIndex: LAYER_CONFIG\.back\.z/.test(ui), "柵は back 層");
// ★場面の中に、羊より前に出る要素が無いこと（宅配便などが羊を横切らない）。
//   操作ボタン（模様替え）は場面の一部ではないので、対象から外す。
//   混同しないよう、コード側でも UI_CHROME_Z という別の名前にしてある。
assertTrue(/const UI_CHROME_Z = /.test(ui), "操作ボタンの重なりが、場面の層と別の名前になっている");
const zNums = (ui.match(/zIndex: (\d+)/g) || []).map((m) => Number(m.split(": ")[1]));
assertTrue(zNums.every((n) => n <= z.front),
  `★場面の要素が羊(front=${z.front})を超えていない（最大 ${Math.max(...zNums, 0)}）`);

console.log("\n=== A-2: ★接地の影（家具も羊も） ===");
console.log("     指示書は「家具も羊も床から浮いて見えます」と名指ししている。");
assertTrue(/const CONTACT_SHADOW = \{/.test(ui), "★影の定義が1か所にある（家具と羊で分かれていない）");
const sh = ui.match(/const CONTACT_SHADOW = \{([\s\S]*?)\};/)[1];
assertTrue(/width: "85%"/.test(sh), "幅はアイテム幅 × 0.85");
assertTrue(/1 \/ 0\.22/.test(sh), "高さは幅 × 0.22");
assertTrue(/rgba\(70,45,30,0\.18\)/.test(sh), "色 rgba(70,45,30,0.18)");
assertTrue(/blur\(6px\)/.test(sh), "ぼかし 6px");
// 家具・羊の両方が同じ定義から作られていること
const uses = (ui.match(/\.\.\.CONTACT_SHADOW/g) || []).length;
assertTrue(uses >= 3, `影を使っている箇所が${uses}件（家具・立ち姿・寝姿）`);
assertTrue(/anchor !== "wall"/.test(ui), "★壁掛け・窓には影を付けない");

console.log("\n=== A-3: 3層のスケール ===");
assertTrue(/back: \{ z: \d+, scale: 0\.85 \}/.test(ui), "back のスケール 0.85");
assertTrue(/mid: \{ z: \d+, scale: 1\.00 \}/.test(ui), "mid のスケール 1.00");
assertTrue(/front: \{ z: \d+, scale: 1\.15 \}/.test(ui), "front のスケール 1.15");

console.log("\n=== A-4: 配置のスナップ ===");
assertTrue(/const GRID_COLUMNS = 12/.test(ui), "12分割のグリッド");
assertTrue(/onDragEnd\(snapToGrid\(/.test(ui), "★ドラッグ終了時に実際にスナップしている");

console.log("\n=== A-5: 表示の階層 ===");
assertTrue(/fontSize: 32/.test(ui), "所持ポイントが 32px（主役）");
assertTrue(/labelTotalDaysRecorded/.test(ui), "★累計記録日数を出している（A-6 の木と対応）");
const statLine = raw.match(/labelCurrentStreak[\s\S]{0,220}/)[0];
assertTrue(/labelLongestStreak/.test(statLine) && /labelTotalDaysRecorded/.test(statLine),
  "★連続・最長・累計が1行にまとまっている");

console.log("\n=== A-6: ★累計で育つ木は、絶対に後退しない ===");
assertTrue(/totalDaysRecorded/.test(ui), "累計記録日数を使っている");
assertTrue(!/currentStreak[\s\S]{0,120}treeStage|treeStage[\s\S]{0,120}currentStreak/.test(ui),
  "★連続記録から木の段階を決めていない（途切れても後退しないため）");
assertTrue(/Object\.keys\(entries \|\| \{\}\)\.length/.test(ui),
  "累計は記録が存在する日の総数");
// 段階の境目（0-6 / 7-29 / 30-99 / 100-364 / 365-）
[7, 30, 100, 365].forEach((n) => {
  assertTrue(ui.includes(String(n)), `段階の境目 ${n} がコードにある`);
});
assertTrue(/prefers-reduced-motion/.test(ui) || /prefersReducedMotion/.test(ui),
  "★動きを減らす設定に対応している");

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
console.log("\n✓ すべて成功しました。");
