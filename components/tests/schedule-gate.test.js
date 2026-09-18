// ============================================================================
// ★日程の 門（★裁定 その85 Q1 ／ Q3・2026-09-18）
//
//   ★★★きょうまで、★この 画面に 門が ありません でした。
//     ★★帯の 門（`TAB_RULES`）は `sched_all` **または** `sched_mine`。
//     ★★自分の 日程だけ の 先生に、★「学校 全部の 表」を 出して いました。
//
//   ★★★台帳は 漏らして いません（★2026-09-18・直に 確かめました）。
//     ★★`lessons` の 見える 決まりは `can_view_ops(見る人, 学校, 生徒)`。
//     ★★受け持ちの ない 生徒の コマは、★1行も 返りません。
//     ★★★漏れて いたのは 数では なく **姿** です。
//
//   ★★見る の は 4つ。
//     ★【一】★3つの 姿が できこと で 決まる こと
//     ★【二】★画面が 自分で 判じて いない こと
//     ★【三】★呼ぶ 側が できことを 渡して いる こと
//     ★【四】★重なりが 0件 の ときに 節を 出さない こと
// ============================================================================

const { readCode, readRaw, loadLib } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

(async () => {
  const S = await loadLib("lib", "opsSchedule.js");
  const P = await loadLib("lib", "opsPerms.js");

  // -------------------------------------------------------------------------
  // 【一】★3つの 姿
  // -------------------------------------------------------------------------
  console.log("【一】3つの 姿（★裁定 その85 Q1）");
  t(S.scheduleViewFor(["sched_all"]) === "all", "sched_all → 学校 全部");
  t(S.scheduleViewFor(["sched_mine"]) === "mine", "sched_mine → 自分だけ");
  t(S.scheduleViewFor([]) === "none", "どちらも 無ければ 出さない");
  t(S.scheduleViewFor(null) === "none", "★渡されなくても 落ちない（★閉じる 側へ 倒す）");
  t(S.scheduleViewFor(["sched_all", "sched_mine"]) === "all", "両方 なら 学校 全部");
  // ★★Set でも 配列でも 同じ こと。
  t(S.scheduleViewFor(new Set(["sched_mine"])) === "mine", "Set でも 同じ");
  t(S.scheduleViewFor({ sched_mine: true }) === "mine", "objectでも 同じ");
  // ★★★できこと の 名が 台帳の 決めと 合って いる こと。
  t(P.PERM_KEYS.includes("sched_all") && P.PERM_KEYS.includes("sched_mine"),
    "できことの 名が ある");
  // ★★道具の 較正 ── ★わざと 知らない 名で、★閉じる 側に 倒れる こと。
  t(S.scheduleViewFor(["しらない"]) === "none", "★知らない 名は 出さない");

  // -------------------------------------------------------------------------
  // 【二】★画面が 判じない
  // -------------------------------------------------------------------------
  console.log("【二】画面は 判じない（★決めは lib 1か所）");
  const 画面 = readCode("components", "OpsSchedule.jsx");
  t(画面.includes("scheduleViewFor(perms)"), "lib に 尋ねて いる");
  // ★★★できこと の 名を、★画面が 直に 見て いない こと。
  t(!/["']sched_all["']/.test(画面), "画面が `sched_all` を 直に 見て いない");
  t(!/["']sched_mine["']/.test(画面), "画面が `sched_mine` を 直に 見て いない");
  // ★★役割の 名（owner／admin／teacher）で 判じて いない こと。
  t(!/["'](owner|admin|teacher|staff)["']/.test(画面), "役割の 名で 判じて いない");
  t(画面.includes('if (何も出さない) return null'), "持って いなければ 何も 出さない");
  t(画面.includes("MINE_ONLY_LINE"), "自分だけ の ときに 断りを 出す");
  // ★★★その 断りが、★空の 文で ない こと。
  t(typeof S.MINE_ONLY_LINE === "string" && S.MINE_ONLY_LINE.length > 10,
    "断りの 字が ある ──「" + S.MINE_ONLY_LINE + "」");
  // ★★自分だけ の ときに、★先生の 列を しぼって いる こと。
  t(/出す先生 = 自分だけ \? ids\.filter\(\(x\) => x === myId\) : ids/.test(
    readRaw("components", "OpsSchedule.jsx")), "自分だけ の ときは 自分の 列 だけ");
  t(/dayGrid\(lessons, dateISO, 出す先生\)/.test(readRaw("components", "OpsSchedule.jsx")),
    "1日の 表も しぼって いる");
  t(/weekHeat\(lessons, weekDays \|\| \[\], 出す先生\)/.test(
    readRaw("components", "OpsSchedule.jsx")), "★週の 地図も しぼって いる");

  // -------------------------------------------------------------------------
  // 【三】★呼ぶ 側が 渡して いる
  //
  //   ★★★「書いた」と「効いて いる」は 別 です（★2026-09-11 の 覚え）。
  //     ★★渡して いなければ、★`perms` は undefined。★`none` に 倒れ、
  //       ★★日程が 1つも 出なく なります。★静かに 壊れます。
  // -------------------------------------------------------------------------
  console.log("【三】呼ぶ 側が 渡して いる");
  const 親 = readRaw("components", "VocalTracker.jsx");
  const i = 親.indexOf("<OpsSchedule");
  t(i > 0, "呼んで いる ところが ある");
  const 塊 = 親.slice(i, 親.indexOf("/>", i));
  t(/perms=\{gate\}/.test(塊), "★できことを 渡して いる");
  t(/myId=\{userId\}/.test(塊), "★見て いる 方を 渡して いる");

  // -------------------------------------------------------------------------
  // 【四】★重なりは 0件 なら 出さない（★裁定 その85 Q3）
  // -------------------------------------------------------------------------
  console.log("【四】重なり（★§8⑤ ── 空の 節を 出さない）");
  t(S.overlapChipLabel(0) === null, "0件 なら 出さない");
  t(S.overlapChipLabel(3) === "重なり 3件", "1件 以上 なら 札");
  t(S.overlapChipLabel(null) === null, "★数が 無ければ 出さない");
  t(画面.includes("overlapChipLabel(overlaps.length)"), "画面が lib に 尋ねて いる");
  // ★★★札の 「前」に 判じが あり、★すぐ 後ろが 押しどころ で ある こと。
  //   ★★2026-09-18、★はじめ 逆の 順（札 → 判じ）で 探して 落ちました。
  //   ★★見本と 同じ 形 ── ★`{判じ ? (<button …`。
  const 生 = readRaw("components", "OpsSchedule.jsx");
  const 位置 = 生.indexOf("{overlapChipLabel(overlaps.length) ? (");
  t(位置 > 0, "判じが 先に ある");
  t(/^\s*<button type="button"/m.test(生.slice(位置, 位置 + 200)),
    "★すぐ 後ろが 押しどころ に なって いる");

  // -------------------------------------------------------------------------
  // 【五】★見本と 合って いる
  // -------------------------------------------------------------------------
  console.log("【五】見本の 1行目と 同じ 形");
  const 見本 = readRaw("docs", "opus", "visual-2026-09-18", "pack",
    "00-動く見本-PC・iPad（運営）.html");
  t(見本.includes("if(!can('sched_all'))return P_kumu()"),
    "★見本も 同じ 門を 持って いる");

  console.log(`\n○ ${ok}　✗ ${ng}`);
  process.exit(ng === 0 ? 0 : 1);
})();
