// ============================================================================
// ★さがす（⌘K）の 見張り（★裁定 その78 §6 ／ その81 §4-5）
//
//   ★★★いちばん 大事な こと ──
//     ★★「★パレットは ★ナビを 補強する もので、★置き換えでは ない」
//     ★★だから、★ナビに 出る ものは さがすにも 出ます。
//     ★★そして、★さがすに あるから と いって ナビから 外しません。
// ============================================================================

const { readCode, readRaw, loadLib } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

(async () => {
  const m = await loadLib("lib", "opsSearch.js");
  const N = await loadLib("lib", "opsNav.js");

  const 学長 = ["meibo", "sched_all", "gyoji", "renraku_all", "koma",
    "monka_write", "shukketsu", "post", "master"];

  // -------------------------------------------------------------------------
  // 【一】★まとまりは 3つ
  // -------------------------------------------------------------------------
  console.log("【一】まとまりは 3つ（★裁定 §6-2）");
  t(m.GROUP_HEADS.join("/") === "画面/よく する こと/決まり", "見出しが 裁定の とおり");
  const g = m.searchGroups(学長);
  t(g.length === 3, "学長には 3つ とも 出る");
  t(m.OPEN_KEY === "k" && m.CLOSE_KEY === "Escape", "⌘K で 開き、Esc で 閉じる");

  // -------------------------------------------------------------------------
  // 【二】★ナビの 代わりでは ない ── ★同じ 出どころ
  // -------------------------------------------------------------------------
  console.log("【二】画面の まとまりは、★ナビと 同じ 出どころ");
  const ナビ = N.navGroupsFor(学長).reduce((a, x) => a.concat(x.items.map((i) => i.key)), []);
  const さがす = (g.find((x) => x.head === "画面") || { items: [] }).items.map((i) => i.key);
  t(JSON.stringify(ナビ) === JSON.stringify(さがす), "★ナビと 同じ 並び・同じ 数");
  // ★★道具の 較正 ── ★わざと 1つ 違えて、★見つかる こと。
  t(JSON.stringify(ナビ) !== JSON.stringify(さがす.slice(1)), "★わざとの 1件を 見つけられる");

  // -------------------------------------------------------------------------
  // 【三】★持って いない ものを 出さない（★§8⑤）
  // -------------------------------------------------------------------------
  console.log("【三】持って いない ものは 出さない");
  const 講師 = m.searchGroups(["sched_mine", "shukketsu", "monka_write"]);
  const 字 = 講師.reduce((a, x) => a.concat(x.items.map((i) => i.label)), []);
  t(!字.includes("役職の一覧"), "役職を 持たない 方に「役職の一覧」を 出さない");
  t(!字.includes("招く"), "名簿を 持たない 方に「招く」を 出さない");
  t(字.includes("出欠つけ"), "出欠を 持つ 方には 出す");
  t(m.searchGroups([]).length === 0, "できことが 無ければ 何も 出ない");

  // ★★★行き先の 無い 行を 置いて いない こと。
  //   ★★裁定 §6-2 は「採点」を 挙げて いますが、★この 蔵に 画面が ありません。
  //   ★★押せるのに 何も 起きない のが、★いちばん 悪い 形 です（★裁定 その84）。
  const 元 = readCode("lib", "opsSearch.js");
  t(!元.includes("採点"), "★行き先の 無い「採点」を 置いて いない");
  t(readRaw("lib", "opsSearch.js").includes("08-6"), "★台帳に 覚えが ある（★引き金つき）");
  t(readRaw("docs", "ledgers", "08-保留している決め.md").includes("## 08-6"),
    "★台帳に その 行が ある");

  // ★★行き先が ぜんぶ、★ほんとうに ある 帯 か。
  const 帯 = ["home", "roster", "monka", "schedule", "events", "threads", "settings"];
  m.ACTIONS.concat(m.RULES).forEach((r) => {
    t(帯.includes(r.tab), r.label + " の 行き先が ある（" + r.tab + "）");
  });

  // -------------------------------------------------------------------------
  // 【四】★しぼり込み
  // -------------------------------------------------------------------------
  console.log("【四】しぼり込み");
  t(m.countItems(m.filterGroups(g, "")) === m.countItems(g), "空の ときは ぜんぶ 出る");
  const 絞 = m.filterGroups(g, "名簿");
  t(m.countItems(絞) >= 1, "「名簿」で 見つかる");
  t(m.countItems(m.filterGroups(g, "そんなものはない")) === 0, "無ければ 0");
  t(m.filterGroups(g, "そんなものはない").length === 0, "空の まとまりを 残さない");
  t(typeof m.NOTHING_LINE === "string" && !m.NOTHING_LINE.includes("0件"),
    "★「0件」と 出さない");

  // -------------------------------------------------------------------------
  // 【五】★部品
  // -------------------------------------------------------------------------
  console.log("【五】部品");
  const 部品 = readCode("components", "OpsSearch.jsx");
  t(!/#[0-9A-Fa-f]{6}/.test(部品), "色を 直に 書いて いない");
  t(部品.includes("CLOSE_KEY"), "閉じる 押しどころを 書き写して いない");
  t(部品.includes("fontSize: rem(16)"), "★打つ ところは 16px（★iOS が 寄りません）");
  const 殻 = readRaw("components", "OpsShell.jsx");
  t(殻.includes("<OpsSearch"), "殻が さがすを 出して いる");
  t(殻.includes("OPEN_KEY"), "殻が 押しどころを lib から もらって いる");

  console.log(`\n○ ${ok}　✗ ${ng}`);
  process.exit(ng === 0 ? 0 : 1);
})();
