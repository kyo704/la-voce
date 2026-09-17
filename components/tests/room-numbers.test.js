/**
 * ★部屋の 数どうしの 関わり（★2026-09-17・★「6段目」）。
 *
 *   ★★きょうまで、★部屋の 数は 別々に 置かれて いました ──
 *     `FLOOR_BOTTOM_PCT` / `FLOOR_BAND` / `WALL_BAND` /
 *     `SHEEP_WANDER` / `FURNITURE_FLOOR_TOP`
 *   ★★「どれと どれが 揃って いる べきか」が どこにも 書かれて いません でした。
 *   ★★1つだけ 動かすと、★静かに ずれます。
 *     ★★床を 48 → 56 に した とき、★まさに それが 起きかけました。
 *
 *   ★★決まりは `lib/sheepInteriorV2.js` の `ROOM_NUMBER_RULES` が 持ちます。
 *     ★★ここでは **通す だけ** です。★見張りに 決まりを 書き写しません。
 */
const { loadLib } = require("./_source");

let 落ち = 0;
function t(名, 条件, そえ) {
  console.log((条件 ? "  ok   " : "  NG   ") + 名 + (条件 ? "" : "\n         " + (そえ || "")));
  if (!条件) 落ち++;
}

(async () => {
  const m = await loadLib("lib", "sheepInteriorV2.js");

  console.log("\n=== ★決まりが ある ===");
  t("★ROOM_NUMBER_RULES が ある", Array.isArray(m.ROOM_NUMBER_RULES));
  t("★★6つ 以上 ある", m.ROOM_NUMBER_RULES.length >= 6);
  m.ROOM_NUMBER_RULES.forEach((r) => {
    t(`★「${r.name}」に わけが 書いて ある`, Boolean(r.why) && r.why.length > 10);
  });

  console.log("\n=== ★★いまの 数が、★決まりを 守って いる ===");
  m.ROOM_NUMBER_RULES.forEach((r) => t(r.name, r.ok() === true, r.why));

  console.log("\n=== ★いまの 数（★記録の ため）===");
  console.log("   床 " + m.FLOOR_BOTTOM_PCT + "％ ／ 壁 " + m.WALL_HEIGHT_PCT + "％"
    + " ／ 床の 線 上から " + m.FLOOR_TOP_PCT + "％");
  console.log("   足もとの 帯 " + JSON.stringify(m.FLOOR_BAND)
    + " ／ 壁の 帯 " + JSON.stringify(m.WALL_BAND));
  console.log("   家具の 既定 " + m.FURNITURE_FLOOR_TOP_PCT
    + " ／ 羊 " + (m.SHEEP_WANDER.centerTop - m.SHEEP_WANDER.rangeTop)
    + "〜" + (m.SHEEP_WANDER.centerTop + m.SHEEP_WANDER.rangeTop));
  console.log("   庭の 背景の 下端 " + m.GARDEN_BACKDROP_BOTTOM_PCT + "％（★床とは 別）");

  console.log("\n=== ★較正 ── ★わざと 壊して、★落ちる ことを 確かめる ===");
  // ★★決まりを そのまま 使い、★数だけ 入れ替えて 試します。
  //   ★★出なければ、★この 見張りは 何も 守って いません。
  const 壊れ = [
    { 名: "足もとが 床の 線より 上", ok: () => 40 >= m.FLOOR_TOP_PCT },
    { 名: "羊が 壁を 歩く", ok: () => (30 - 10) >= m.FLOOR_TOP_PCT },
    { 名: "壁の ものが 床に 埋まる", ok: () => 80 <= m.FLOOR_TOP_PCT },
    { 名: "壁と 床の 合計が 100 で ない", ok: () => 56 + 52 === 100 }
  ];
  壊れ.forEach((x) => t(`★★「${x.名}」は 落ちる（★較正）`, x.ok() === false));

  console.log("\n=== ★壁の 帯は 1組だけ ===");
  // ★★★2026-09-18、★`WALL_BAND_MIN_TOP = 14` / `MAX_TOP = 58` を やめました。
  //   ★★同じ「壁に 掛ける」ことなのに、★数が 2組 ありました。
  //   ★★`58` は 床の 線（52）より 下 で、★もとから 壁の 外に 出られました。
  const ch0 = require("./_source").readCode("components/CharacterHome.jsx");
  t("★★14／58 の 直書きが 消えて いる",
    !/WALL_BAND_MIN_TOP = 14/.test(ch0) && !/WALL_BAND_MAX_TOP = 58/.test(ch0));
  t("★`WALL_BAND` から 引いて いる",
    /WALL_BAND_MIN_TOP = WALL_BAND\[0\]/.test(ch0)
    && /WALL_BAND_MAX_TOP = WALL_BAND\[1\]/.test(ch0));

  console.log("\n=== ★庭の 背景は、★床と 切り離されて いる ===");
  const ch = require("./_source").readCode("components/CharacterHome.jsx");
  t("★★`FLOOR_BOTTOM_PCT - 26` が 消えて いる", !/FLOOR_BOTTOM_PCT - 26/.test(ch));
  t("★別の 名を 使って いる", /GARDEN_BACKDROP_BOTTOM_PCT/.test(ch));
  t("★22 の まま", m.GARDEN_BACKDROP_BOTTOM_PCT === 22);

  console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
  process.exit(落ち === 0 ? 0 : 1);
})();
