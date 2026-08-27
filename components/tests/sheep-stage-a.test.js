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
// ★影の付け方は2通りあり、それぞれ理由がある。
//   家具: 外から1枚敷く（アイテムごとに絵が違い、共通の楕円で足りる）
//   羊  : 自分のSVGの中に持つ（足元の位置が絵ごとに違い、外からでは合わない）
//   ★羊に外から足すと、SVGの下端を基準に2枚目ができて滑って見える。実機で報告された。
const uses = (ui.match(/\.\.\.CONTACT_SHADOW/g) || []).length;
assertTrue(uses >= 1, `家具が共通の定義から影を作っている（${uses}件）`);
assertTrue(/anchor !== "wall"/.test(ui), "★壁掛け・窓には影を付けない");

console.log("\n=== A-3: 3層のスケール ===");
assertTrue(/back: \{ z: \d+, scale: 0\.85 \}/.test(ui), "back のスケール 0.85");
assertTrue(/mid: \{ z: \d+, scale: 1\.00 \}/.test(ui), "mid のスケール 1.00");
assertTrue(/front: \{ z: \d+, scale: 1\.15 \}/.test(ui), "front のスケール 1.15");

console.log("\n=== A-4: 配置のスナップ ===");
assertTrue(/const GRID_COLUMNS = 12/.test(ui), "12分割のグリッド");
// 目印と着地点は同じ関数から出す（resolveFinalLeft）。押しのけまで含む。
assertTrue(/onDragEnd\(resolveFinalLeft\(/.test(ui), "★ドラッグ終了時に、落ちる先を計算している");
assertTrue(/resolveSnap \? resolveSnap\(l\) : snapToGrid\(l\)/.test(ui),
  "既定はグリッドへのスナップ。呼び出し側が押しのけ込みの関数を渡せる");
assertTrue(/snapPreviewLeft/.test(ui), "★ドラッグ中に、落ちる先が目印で見える（A-4）");

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

console.log("\n=== ★羊の影は1枚だけ（実機で「浮いて滑って見える」と報告） ===");
console.log("     SVGの中に足元の影があるのに、外からもう1枚足していた。");
// 立ち姿のSVGの中に、足元の影がある
assertTrue(/<ellipse cx="80" cy="192"[^>]*opacity="0\.14"/.test(ui),
  "立ち姿は、SVGの中の足元（cy=192）に影を持っている");
// PositionedCharacter が外から影を足していないこと
const posChar = ui.slice(ui.indexOf("function PositionedCharacter"), ui.indexOf("function PositionedCharacter") + 2200);
assertTrue(!/CONTACT_SHADOW/.test(posChar),
  "★羊に外から影を足していない（2枚が少しずれて重なると、滑って見える）");
// 寝姿もSVGの中に持つ
const sleep = ui.slice(ui.indexOf("function SheepSleepingHead"), ui.indexOf("function SheepSleepingHead") + 1600);
assertTrue(/<ellipse cx="31" cy="52"/.test(sleep), "寝姿も、SVGの中に影を持っている");
// 家具は引き続き外から
assertTrue(/\.\.\.CONTACT_SHADOW/.test(ui), "家具の影は共通の定義から作っている");

console.log("\n=== ★寝ているときは動かない ===");
assertTrue(/const SLEEP_DURATION_MS = /.test(ui), "寝ている時間が定数になっている");
const dur = Number((ui.match(/const SLEEP_DURATION_MS = (\d+)/) || [])[1]);
assertTrue(dur >= 20000, `寝ている時間が${dur / 1000}秒（短いと寝たそばから起きて、休んで見えない）`);
assertTrue(/busyRef\.current\) \{ scheduleWander\(\); return; \}/.test(ui),
  "★寝ている間は歩き回らない（busyRef で止めている）");
// 寝姿に動きを付けていないこと
assertTrue(!/animation/.test(sleep), "★寝姿にアニメーションを付けていない");
assertTrue(/丸くなった体/.test(readRaw("components", "CharacterHome.jsx")),
  "丸くなって休む形になっている（顔だけが浮いていない）");

console.log("\n=== 羊はドラッグできない（仕様どおり） ===");
// ★仕様に羊のドラッグは無い。羊は自分で歩く。
//   DraggableItem は家具・お庭のアイテム用で、羊には使っていない。
assertTrue(!/<DraggableItem[^>]*SheepCharacter/.test(readRaw("components", "CharacterHome.jsx")),
  "羊をドラッグ対象にしていない（自分で歩く）");
assertTrue(/function useRoomLife|scheduleWander/.test(ui), "羊は自分で歩く仕組みを持っている");

console.log("\n=== ★予定どうしが割り込まない（実機で3症状すべての原因だった） ===");
// scheduleWander だけに番人があり、椅子・ベッドの予定には無かった。
// そのため寝ている羊を椅子へ歩かせ、歩いている途中に別の移動が上書きしていた。
// ★お部屋には3つの予定（歩く・座る・寝る）、お庭には1つ（歩く）。
const roomHook = ui.slice(ui.indexOf("function useRoomLife"), ui.indexOf("function useGardenLife"));
const gardenHook = ui.slice(ui.indexOf("function useGardenLife"), ui.indexOf("function useGardenLife") + 4000);
["Wander", "Sitting", "Lying"].forEach((name) => {
  assertTrue(new RegExp(`if \\(busyRef\\.current\\) \\{ schedule${name}\\(\\); return; \\}`).test(roomHook),
    `★お部屋の schedule${name} に番人がある`);
});
assertTrue(/if \(busyRef\.current\) \{ scheduleWander\(\); return; \}/.test(gardenHook),
  "お庭の scheduleWander にも番人がある");

console.log("\n=== ★古いタイマーが、新しい移動の「歩いている」を消さない ===");
assertTrue(/const myToken = \+\+moveToken/.test(ui), "移動ごとに札を持たせている");
assertTrue(/myToken === moveToken/.test(ui), "★最後の移動だけが「歩き終わり」を決める");
// 部屋と庭の両方に入っていること
assertTrue((ui.match(/let moveToken = 0;/g) || []).length === 2, "部屋とお庭の両方に入っている");

console.log("\n=== 寝るにはベッドを『置いて』いる必要がある ===");
// ★持っているだけでは寝ない。置いていないと lying は一度も起きない。
// ★「持っているか」ではなく「置いてあるか」で判定すること。
//   いまは furniturePos(key) の中で見ている（key を引数にした共通の形）。
assertTrue(/placedFurniture\.includes\(key\)/.test(ui),
  "★置いてあるかどうかで判定している（持っているだけでは寝ない）");
assertTrue(/furniturePos\("furniture_bed"\)/.test(ui), "ベッドの位置を渡している");
assertTrue(/furniturePos\("furniture_chair"\)/.test(ui), "椅子の位置も渡している");

console.log("\n=== お庭には寝る仕組みが無い（仕様どおり） ===");
const garden = ui.slice(ui.indexOf("function useGardenLife"), ui.indexOf("function useGardenLife") + 2600);
assertTrue(!/isLying/.test(garden), "★お庭では寝ない（ベッドはお部屋のものなので）");

console.log("\n=== A-3: ★配置できるアイテムは、全部 layer を持つ ===");
// 新しいアイテムを足したとき、layout への追加を忘れると層が既定(mid)に落ちる。
// 忘れても気づけるよう、SHOP_ITEMS 側と突き合わせる。
const character = readRaw("lib", "character.js");
const placeable = [...character.matchAll(/key: "((?:furniture|garden|wallhang)_[a-z_]+)"/g)].map((m) => m[1]);
const layers = {};
["FURNITURE_LAYOUT", "GARDEN_LAYOUT", "WALLHANG_LAYOUT"].forEach((tbl) => {
  const body = (ui.match(new RegExp(`const ${tbl} = \\{([\\s\\S]*?)\\n\\};`)) || [])[1] || "";
  [...body.matchAll(/(\w+):\s*\{[^}]*layer:\s*"(\w+)"/g)].forEach((m) => { layers[m[1]] = m[2]; });
});
assertTrue(placeable.length > 0, `配置できるアイテムが${placeable.length}件見つかった`);
const missing = placeable.filter((k) => !layers[k]);
assertEqual(missing, [], "★layer を持たないアイテムが無い（足し忘れると既定の mid に落ちる）");

console.log("\n=== A-3: 仕様の表どおりの層に入っている ===");
// 作業指示 A-3 の表: back=壁掛け / mid=家具・噴水・ベッド・本棚 / front=ラグ・池・ベンチ・羊
const expected = {
  wallhang_clock: "back", wallhang_lamp: "back", wallhang_painting: "back",
  furniture_bed: "mid", furniture_shelf: "mid", garden_fountain: "mid",
  furniture_rug: "front", garden_pond: "front", garden_bench: "front"
};
Object.entries(expected).forEach(([k, want]) => {
  assertEqual(layers[k], want, `${k} は ${want} 層`);
});
// ★羊は常に最前面。front より前の層は無い。
assertTrue(!Object.values(layers).includes("overlay"), "front より前の層を作っていない");

console.log("\n=== A-3: 層をまたぐドラッグができない ===");
// layer は layout テーブルから来る固定値で、ドラッグでは変わらない。
assertTrue(/layer=\{layout\.layer\}/.test(ui), "★層はレイアウト表から渡され、ドラッグでは変わらない");
assertTrue(!/setLayer|layer:\s*drag/.test(ui), "ドラッグ中に層を書き換えていない");
// 押しのけは同じ層の中だけで起きる
assertTrue(/FURNITURE_LAYOUT\[ok\]\.layer === layout\.layer/.test(ui),
  "★押しのけの相手を、同じ層のアイテムだけに絞っている");
assertTrue(/GARDEN_LAYOUT\[ok\]\.layer === layout\.layer/.test(ui), "お庭でも同じ");

console.log("\n=== ★寝る場所・座る場所は、家具の実際の位置から求めること ===");
console.log("     実機で「ベッドの横で寝ている」と報告されました。");
// 家具はドラッグで動かせる。既定の座標を決め打ちすると、動かしたときに
// 羊は「元あった場所」で寝る。
assertTrue(!/const bedApproachLeft = \d+/.test(ui), "★寝る場所を決め打ちしていない");
assertTrue(!/const chairLeft = \d+,/.test(ui), "★座る場所も決め打ちしていない");
assertTrue(/const pillowLeft = bedPos\.left - PILLOW_LEFT_OFFSET/.test(ui),
  "枕は、ベッドの実際の位置から求めている");
assertTrue(/chairPos\.top - SEAT_ABOVE_FLOOR/.test(ui),
  "座面も、椅子の実際の位置から求めている");
// ★休む場所が床の外へ出ないよう、下限をかけている
assertTrue(/Math\.max\(ROOM_FLOOR_LINE, bedPos\.top - PILLOW_ABOVE_FLOOR\)/.test(ui),
  "★枕が床の外へ出ない（すでに高い位置に保存されたベッドにも効く）");
assertTrue(/Math\.max\(ROOM_FLOOR_LINE, chairPos\.top - SEAT_ABOVE_FLOOR\)/.test(ui),
  "★座面も同じ（椅子でも同じことが起きうる）");
assertTrue(/const BED_MIN_TOP = ROOM_FLOOR_LINE \+ PILLOW_ABOVE_FLOOR/.test(ui),
  "ベッドを上げられる限界が決まっている");
assertTrue(/const CHAIR_MIN_TOP = ROOM_FLOOR_LINE \+ SEAT_ABOVE_FLOOR/.test(ui),
  "椅子にも同じ限界がある");
assertTrue(/k === "furniture_bed" \? BED_MIN_TOP : k === "furniture_chair" \? CHAIR_MIN_TOP/.test(ui),
  "★ドラッグの範囲にも、その限界がかかっている");

console.log("\n=== 見た目（zzz と本） ===");
assertTrue(!/fill="#B8863B"[^>]*>z</.test(ui), "★zzz が濃い黄土色でなくなった（背景に埋もれていた）");
assertTrue(/showBook \? 61 : 35/.test(ui), "★本を持つときは、腕を本の縁まで寄せる");
assertTrue(/showBook \? "" : "animation: idleBob/.test(ui), "★本を持つあいだは腕を揺らさない");
assertTrue(/useRoomLife\(centerLeft, centerTop, rangeLeft, rangeTop, chairPos, bedPos\)/.test(ui),
  "★真偽値ではなく、位置そのものを受け取っている");
assertTrue(/const hasBed = !!bedPos/.test(ui), "置いてあるかどうかは、位置の有無で決まる");
// 動かしたら追随すること（依存配列に位置が入っている）
assertTrue(/bedPos && bedPos\.left/.test(ui), "★家具を動かしたら、寝る場所も追随する");
// 呼び出し側が、保存済みの位置を解決して渡していること
assertTrue(/resolvePos\(\(equipped\.furniturePositions \|\| \{\}\)\[key\], FURNITURE_LAYOUT\[key\]\)/.test(ui),
  "★保存済みの位置を読んでいる（既定値のままにしていない）");

console.log("\n=== 既定の配置では、これまでと同じ座標になること ===");
// ★直したことで見え方が変わってしまうと、別の不具合になる。
const off = Number((ui.match(/PILLOW_LEFT_OFFSET = (\d+)/) || [])[1]);
const above = Number((ui.match(/PILLOW_ABOVE_FLOOR = (\d+)/) || [])[1]);
const seat = Number((ui.match(/SEAT_ABOVE_FLOOR = (\d+)/) || [])[1]);
const floor = Number((ui.match(/const FURNITURE_FLOOR_TOP = (\d+)/) || [])[1]);
const bedLeft = Number((ui.match(/furniture_bed: \{ left: (\d+)/) || [])[1]);
assertEqual(bedLeft - off, 7, "既定のベッドなら、枕は left 7（従来どおり）");
assertEqual(floor - above, 82, "既定のベッドなら、枕は top 82（従来どおり）");
assertEqual(floor - seat, 89, "既定の椅子なら、座面は top 89（従来どおり）");

console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
console.log("\n✓ すべて成功しました。");
