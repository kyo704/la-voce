#!/usr/bin/env node
/**
 * アイテムシステム B-1〜B-5（作業指示-羊StageAとアイテム.md）。
 *
 * ★禁止事項（同 D）を機械で守る:
 *   ・professions を購入制限に使わない（並び順の優先のみ）
 *   ・season を入手期限に使わない
 *   ・ポイントを体調に連動させない
 *   ・連続記録が途切れたときに、取り上げない
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

async function main() {
  const raw = readRaw("lib", "character.js");
  const src = readCode("lib", "character.js");
  const m = await import("data:text/javascript;base64," + Buffer.from(raw, "utf-8").toString("base64"));
  const ui = readCode("components", "CharacterHome.jsx");

  console.log("=== B-2: 並び順 ===");
  const items = [
    { key: "cheap", cost: 10 }, { key: "near", cost: 40 },
    { key: "far", cost: 500 }, { key: "owned", cost: 5 },
    { key: "new", cost: 20, season: "spring" }
  ];
  const sorted = m.sortShopItems(items, { balance: 20, owned: new Set(["owned"]) });
  assertEqual(sorted.map((i) => i.key), ["new", "cheap", "near", "far", "owned"],
    "買える→あと少し→遠い→購入済み。同組では今月の新作が先");
  assertEqual(m.shopSortRank({ cost: 10 }, { balance: 20, owned: new Set() }), 0, "いま買える");
  assertEqual(m.shopSortRank({ cost: 40 }, { balance: 20, owned: new Set() }), 1, "あと少し");
  assertEqual(m.shopSortRank({ cost: 500 }, { balance: 20, owned: new Set() }), 2, "遠い");
  assertEqual(m.shopSortRank({ key: "x", cost: 5 }, { balance: 20, owned: new Set(["x"]) }), 3, "購入済みは最後");
  // 所持ポイントが変わると並びが変わる
  // ★ポイントが増えると「買えない組」から「買える組」へ移る。
  //   同じ組の中では安い順なので、順位そのものは値段で決まる。
  assertEqual(m.shopSortRank({ cost: 500 }, { balance: 20, owned: new Set() }), 2, "20pt では遠い組");
  assertEqual(m.shopSortRank({ cost: 500 }, { balance: 600, owned: new Set() }), 0,
    "★600pt になると「いま買える組」に上がる");

  console.log("\n=== B-2: 職業は並び順の優先だけ ===");
  const withProf = [{ key: "a", cost: 10 }, { key: "b", cost: 10, professions: ["announcer"] }];
  assertEqual(m.sortShopItems(withProf, { balance: 100, professions: ["announcer"] }).map((i) => i.key),
    ["b", "a"], "職業が合うものが先に来る");
  // ★買えなくする条件に使っていないこと
  assertEqual(m.sortShopItems(withProf, { balance: 100, professions: ["singer"] }).length, 2,
    "★職業が合わなくても、一覧から消えない（購入制限に使わない）");
  assertTrue(!/professions[\s\S]{0,120}(disabled|cannotBuy|locked|購入不可)/.test(src),
    "★professions を購入の可否に使っていない");

  console.log("\n=== B-5: ★季節に入手期限を作らない ===");
  console.log("     期間限定は「いま買わないと損」を生み、罰になります（羊のおうち仕様 §1）。");
  assertTrue(!/expiresAt|availableUntil|deadline|残り\d|カウントダウン/.test(src),
    "★入手期限の仕組みが無い");
  assertTrue(!/season[\s\S]{0,140}(expire|until|終了|締切)/.test(src), "★season を期限に使っていない");
  const seasonSorted = m.sortShopItems(
    [{ key: "old", cost: 10 }, { key: "s", cost: 10, season: "winter" }],
    { balance: 100 });
  assertEqual(seasonSorted.map((i) => i.key), ["s", "old"], "season は「先頭に出す」だけに使う");
  assertEqual(m.sortShopItems([{ key: "s", cost: 10, season: "winter" }], { balance: 100 }).length, 1,
    "★季節が過ぎても、一覧から消えない（常設）");

  console.log("\n=== B-3: 値段の帯が1か所にある ===");
  assertTrue(!!m.PRICE_BANDS, "PRICE_BANDS がある");
  ["hat", "outfit", "furniture", "floor", "scenery"].forEach((c) => {
    assertTrue(Array.isArray(m.PRICE_BANDS[c]) && m.PRICE_BANDS[c].length === 2, `${c} の帯がある`);
  });
  assertEqual(m.PRICE_BANDS.outfit, [30, 50], "服は 30〜50pt（仕様の表どおり）");
  assertEqual(m.PRICE_BANDS.scenery, [80, 120], "景色は 80〜120pt");
  // 既存の値段は変えていないこと（経済を勝手に動かさない）
  assertTrue(/key: "hat_straw", category: "hat", cost: 5\b/.test(raw),
    "★既存の値段を付け替えていない（麦わら帽子は 5pt のまま）");

  console.log("\n=== B-4: ★解放は累計だけで決まる（連続記録では決めない） ===");
  // 日付が重ならないように作る（重なると件数が足りず、テストの前提が崩れる）
  const perf = (n) => Object.fromEntries(Array.from({ length: n }, (_, i) => {
    const d = new Date(Date.UTC(2026, 0, 1 + i));
    return [d.toISOString().slice(0, 10), { activities: [{ kind: "本番" }] }];
  }));
  assertTrue(m.computeUnlocked(perf(1)).has("firstPerformance"), "初めての本番で解放される");
  assertTrue(!m.computeUnlocked({}).has("firstPerformance"), "記録が無ければ解放されない");
  assertTrue(m.computeUnlocked(perf(10)).has("performances10"), "本番10回で解放される");
  assertTrue(m.computeUnlocked({ "2026-01-01": { pianissimoHighNote: "A4" } }).has("firstPianissimo"),
    "弱声の最高音でも解放される");
  // ★連続記録は見ていない
  const fnBody = raw.slice(raw.indexOf("export function computeUnlocked"), raw.indexOf("export function computeUnlocked") + 1400);
  assertTrue(!/streak|連続/.test(fnBody), "★連続記録を見ていない（途切れても後退しない）");
  assertTrue(!/throatCondition|voiceQuality|score/.test(fnBody),
    "★体調の良し悪しで解放を変えていない（羊のおうち仕様 §1）");

  console.log("\n=== 画面が、並び順の規則を自前で書いていない ===");
  assertTrue(/sortShopItems\(/.test(ui), "★画面はモジュールを経由している");
  assertTrue(!/\.sort\(\(a, b\) =>[\s\S]{0,200}cost/.test(ui), "画面に並び替えの条件を書いていない");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
