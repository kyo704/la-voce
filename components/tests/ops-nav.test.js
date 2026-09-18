// ============================================================================
// ★左の ナビの 見張り（★裁定 その78 §1 §2 §4 ／ その81 §4）
//
//   ★★見る の は 6つ。
//     ★【一】★まとまりは 5つ。★`TAB_RULES` を 1つ 残らず 拾って いる か
//     ★【二】★幅（232 ⇄ 68）
//     ★【三】★たたむ 決め（★手 ＋ 表の 画面 ＋ iPad）
//     ★【四】★たたんでも ラベルを 消して いない か
//     ★【五】★しるしを 塗りつぶして いない か
//     ★【六】★入口が 2つに なって いない か
// ============================================================================

const { readCode, readRaw, loadLib } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

(async () => {
  const m = await loadLib("lib", "opsNav.js");
  const P = await loadLib("lib", "opsPerms.js");

  // -------------------------------------------------------------------------
  // 【一】★まとまり
  // -------------------------------------------------------------------------
  console.log("【一】まとまりは 5つ。★決めは 1つ の 表から");
  t(m.NAV_GROUPS.length === 5, "5つ の まとまり");
  t(m.NAV_GROUPS.map((g) => g.head).join("/") === "/ひと/とき/やりとり/しらべ",
    "見出しの 順が 裁定の とおり");
  // ★★★2階層まで。★3階層を 作りません（★Carbon）。
  t(m.NAV_GROUPS.every((g) => g.items.every((x) => typeof x === "string")),
    "2階層まで（★まとまりの 中に まとまりが ない）");

  // ★★★`TAB_RULES` を 1つ 残らず 拾って いる こと。
  //   ★★これが いちばん 大事 です。★きょう、★6行の 古い 表が
  //     ★「門下」を 落として いました。★2つ目の 表を 作らない ため の 見張り です。
  t(m.coversAllTabs(), "★`TAB_RULES` の 7つ を 1つ 残らず 並べて いる");
  t(P.TAB_RULES.length === 7, "決めの 表は 7行");
  // ★★道具の 較正 ── ★わざと 1つ 落として、★見つかる こと。
  const 落とした = m.NAV_GROUPS.map((g) => g.items).flat().filter((k) => k !== "monka");
  t(!P.TAB_RULES.map((x) => x.key).every((k) => 落とした.includes(k)),
    "★わざとの 1件（1つ 落とす）を 見つけられる");

  // ★★字は `TAB_RULES` が 持つ こと。★まとまりの 表に 書き写して いない こと。
  //   ★★★見る の は **まとまりの 表 だけ** です（★2026-09-18）。
  //     ★★はじめ、★ファイル 全体を 見て 落ちました ──
  //       ★★`WIDE_SCREENS` に「名簿」が あった から です。
  //     ★★あれは 画面の 名 です。★ナビの 字の 写しでは ありません。
  //     ★★★見る 場所を 間違えると、★正しい ものを 落とします。
  const 元 = readCode("lib", "opsNav.js");
  const 表 = 元.slice(元.indexOf("export const NAV_GROUPS"),
    元.indexOf("export function navGroupsFor"));
  t(表.length > 100, "まとまりの 表を 切り出せた");
  ["ホーム", "名簿", "門下", "日程", "行事", "連絡", "設定"].forEach((w) => {
    t(!表.includes(w), "まとまりの 表が「" + w + "」を 書き写して いない");
  });
  // ★★道具の 較正 ── ★わざと 1件 混ぜて、★見つかる こと。
  t(('{ head: "ひと", items: ["名簿"] }').includes("名簿"), "★わざとの 1件を 見つけられる");
  // ★★字が `TAB_RULES` から 来て いる こと。
  const 学長の字 = m.navGroupsFor(["meibo", "sched_all", "gyoji", "renraku_all",
    "koma", "monka_write"]).reduce((a, g) => a.concat(g.items.map((x) => x.label)), []);
  t(学長の字.every((L) => P.TAB_RULES.some((r) => r.label === L)),
    "出る 字は ぜんぶ `TAB_RULES` の もの");

  // ★★出す／出さないは できことの とおり。
  const 学長 = ["meibo", "sched_all", "gyoji", "renraku_all", "koma", "monka_write"];
  const g1 = m.navGroupsFor(学長);
  t(g1.reduce((a, g) => a + g.items.length, 0) === 7, "学長は 7つ 出る");
  const g2 = m.navGroupsFor(["sched_mine"]);
  t(g2.reduce((a, g) => a + g.items.length, 0) === 2, "自分の 日程だけ は 2つ");
  t(g2.every((g) => g.items.length > 0), "空の まとまりを 出さない");
  t(m.navGroupsFor([]).length === 0, "できことが 無ければ 何も 出ない");
  // ★★しるしが 抜けて いない こと。
  g1.forEach((g) => g.items.forEach((it) => {
    t(!!it.icon, it.label + " に しるしが ある");
  }));

  // -------------------------------------------------------------------------
  // 【二】★幅
  // -------------------------------------------------------------------------
  console.log("【二】幅（★裁定 §2-3）");
  t(m.SIDE_WIDTH === 232, "ひらくと 232");
  t(m.RAIL_WIDTH === 68, "たたむと 68");
  t(m.navWidth(true) === 68 && m.navWidth(false) === 232, "幅が 切り替わる");

  // -------------------------------------------------------------------------
  // 【三】★たたむ
  // -------------------------------------------------------------------------
  console.log("【三】たたむ（★裁定 §4-3）");
  t(m.isRail({ manual: true, screen: "ホーム", width: 1280 }) === true, "手で たためる");
  // ★★★PC では 自動に しません。★幅が 足りて いるから です。
  t(m.isRail({ screen: "名簿", width: 1280 }) === false, "★PC では 自動で たたまない");
  t(m.isRail({ screen: "名簿", width: 1024 }) === true, "iPad ＋ 表の 画面は たたむ");
  t(m.isRail({ screen: "ホーム", width: 1024 }) === false, "iPad でも 表で なければ たたまない");
  t(m.WIDE_SCREENS.length === 5, "自動で たたむ 画面は 5つ");
  t(m.FOLD_KEY === "b", "押しどころは ⌘B");

  // ★★端末の 見当。
  t(m.deviceOf(1280) === "pc" && m.deviceOf(1024) === "pad" && m.deviceOf(390) === "phone",
    "端末の 見当が 合って いる");
  t(m.deviceOf(null) === "phone", "★分からない うちは 狭い ほうへ 倒す");
  t(m.showSideNav(390) === false, "iPhone には 左の ナビを 出さない");
  t(m.showSideNav(null) === false, "★分からない うちは 出さない");
  t(m.showSideNav(834) === true && m.showSideNav(1280) === true, "iPad・PC には 出す");

  // -------------------------------------------------------------------------
  // 【四】★たたんでも ラベルを 消さない（★§4-4）
  // -------------------------------------------------------------------------
  console.log("【四】たたんでも ラベルを 消さない");
  const 部品 = readRaw("components", "OpsNav.jsx");
  t(部品.includes("clip: \"rect(0 0 0 0)\""), "読み上げには 残して いる");
  t(部品.includes("title={rail ? it.label : undefined}"), "指を 乗せると 名前が 出る");
  // ★★★`display: none` で 消して いない こと。★消すと 読み上げからも 消えます。
  t(!/display: "none"/.test(部品), "★ラベルを `display:none` で 消して いない");
  // ★★道具の 較正。
  t(/display: "none"/.test('style={{ display: "none" }}'), "★わざとの 1件を 見つけられる");

  // -------------------------------------------------------------------------
  // 【五】★しるしを 塗りつぶさない（★その81 §3-6）
  // -------------------------------------------------------------------------
  console.log("【五】しるしを 塗りつぶさない");
  t(部品.includes("boxShadow: on ?"), "選んだ ことは 線で 示す");
  t(!/background: on \?/.test(部品), "★選んでも 地を 塗らない");
  t(!/#[0-9A-Fa-f]{6}/.test(readCode("components", "OpsNav.jsx")),
    "色を 直に 書いて いない（★名で 呼ぶ）");

  // -------------------------------------------------------------------------
  // 【六】★入口が 2つに ならない
  // -------------------------------------------------------------------------
  console.log("【六】入口が 2つに ならない");
  const 殻 = readRaw("components", "OpsShell.jsx");
  t(殻.includes("{横に出す ? null : ("), "★左に ナビが 出る ときは 下の 帯を 出さない");
  t(殻.includes("<OpsNav"), "殻が ナビを 出して いる");
  t(殻.includes("showSideNav"), "出す／出さないは lib が 決める");
  t(!/innerWidth/.test(殻), "殻が 自分で 幅を 測って いない");

  console.log(`\n○ ${ok}　✗ ${ng}`);
  process.exit(ng === 0 ? 0 : 1);
})();
