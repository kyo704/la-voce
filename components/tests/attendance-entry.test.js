// ============================================================================
// ★出欠の 入口は 2つ（★裁定 その79 ／ ★2026-09-18・段取り1）
//
//   ★★★見本 ── ★入口は 2つ です。
//     ★① ホーム → きょうの ながれ → その 行
//     ★② 日程 → コマを 押す
//   ★★きょうまで ① だけ でした。★日程を 見て いる 方は 一度 ホームへ 戻って いました。
//
//   ★★★見つけた こと ── ★出欠の 1枚が `tabKey === "home"` の 中に ありました。
//     ★★日程から 開いても、★日程の 画面が 描かれます。
//     ★★「押せるのに 何も 起きない」── ★いちばん 悪い 形 です。
//     ★★帯の 外に 出しました。★入口が 2つ でも、★出る ところは 1つ です。
// ============================================================================

const { readCode, readRaw, loadLib } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

(async () => {
  const A = await loadLib("lib", "opsAttendance.js");
  const 親 = readRaw("components", "VocalTracker.jsx");
  const 日程 = readRaw("components", "OpsSchedule.jsx");
  const 日程本文 = readCode("components", "OpsSchedule.jsx");

  // -------------------------------------------------------------------------
  // 【一】★行き先の 決め
  // -------------------------------------------------------------------------
  console.log("【一】コマを 押した ときの 行き先");
  t(A.tapGoesTo({ dup: true, perms: ["shukketsu"] }) === A.TAP_GOES.OVERLAP,
    "重なりの コマは 重なりへ");
  t(A.tapGoesTo({ dup: true, perms: [] }) === A.TAP_GOES.OVERLAP,
    "★出欠を 持たなくても、★重なりは 見られる");
  t(A.tapGoesTo({ dup: false, perms: ["shukketsu"] }) === A.TAP_GOES.ATTENDANCE,
    "ふつうの コマは 出欠へ");
  t(A.tapGoesTo({ dup: false, perms: [] }) === A.TAP_GOES.NOTHING,
    "★出欠を 持たなければ どこへも 行かない");
  t(A.tappable({ dup: false, perms: [] }) === false, "★行き先が 無ければ 押しどころに しない");
  t(A.tappable({ dup: false, perms: ["shukketsu"] }) === true, "持って いれば 押せる");
  t(A.tapGoesTo({ dup: false, perms: null }) === A.TAP_GOES.NOTHING, "★渡されなくても 落ちない");

  // -------------------------------------------------------------------------
  // 【二】★画面は 判じない
  // -------------------------------------------------------------------------
  console.log("【二】画面は 判じない");
  t(日程本文.includes("tapGoesTo({ dup, perms })"), "lib に 尋ねて いる");
  t(!/["']shukketsu["']/.test(日程本文), "★できことの 名を 直に 見て いない");
  // ★★★押せない ときは `<button>` に しない こと。
  t(/if \(!押せる\) return <div key=\{l\.id\} style=\{わく\}>/.test(日程),
    "★押せない ときは `<div>` の まま");
  t(/<button key=\{l\.id\} type="button"/.test(日程), "★押せる ときだけ 押しどころ");
  // ★★渡されて いない ときも 押しどころに しない こと。
  t(/&& \(\s*\n?\s*行き先 === TAP_GOES\.OVERLAP \? !!onOpenOverlap : !!onOpenAttendance/.test(日程),
    "★受け口が 無ければ 押しどころに しない");

  // -------------------------------------------------------------------------
  // 【三】★呼ぶ 側
  // -------------------------------------------------------------------------
  console.log("【三】呼ぶ 側が 渡して いる");
  const i = 親.indexOf("<OpsSchedule");
  const 塊 = 親.slice(i, 親.indexOf("/>", i));
  t(/onOpenAttendance=\{canOps\(gate, "shukketsu"\)/.test(塊), "★日程に 入口 ② を 渡して いる");
  t(/onOpenAttendance=\{canOps\(gate, "shukketsu"\)/.test(親), "★門は 入口 ① と 同じ");
  t((親.match(/onOpenAttendance=\{canOps\(gate, "shukketsu"\)/g) || []).length === 2,
    "★2つの 入口 とも、★同じ 門 です");

  // -------------------------------------------------------------------------
  // 【四】★出る ところは 1つ
  //
  //   ★★★これが きょうの 直し です。
  //     ★★1枚が 帯の 中に あると、★別の 帯から 開いても 出ません。
  // -------------------------------------------------------------------------
  console.log("【四】出る ところは 1つ（★帯の 外）");
  const 出欠の場所 = 親.indexOf("<OpsAttendance");
  const 日程の場所 = 親.indexOf('if (tabKey === "schedule")');
  const ホームの場所 = 親.indexOf('<OpsHome');
  t(出欠の場所 > 0 && 日程の場所 > 0, "どちらも ある");
  t(出欠の場所 < 日程の場所, "★出欠が 帯より 先（★どの 帯からでも 出ます）");
  t(出欠の場所 < ホームの場所, "★ホームより も 先");
  // ★★★2026-09-18、★裁定 その91 で 姿が 2つに なりました ──
  //   ★★`<OpsAttendanceBulk>`（まとめて）と `<OpsAttendance>`（1人ずつ）。
  //   ★★★どちらも **同じ 1か所**（帯の 外）から 出ます。★そこが 肝 です。
  t((親.match(/<OpsAttendanceBulk/g) || []).length === 1, "★まとめては 1か所");
  t((親.match(/<OpsAttendance\s/g) || []).length === 1, "★1人ずつも 1か所");
  t(親.indexOf("<OpsAttendanceBulk") > 0
    && 親.indexOf("<OpsAttendanceBulk") < 日程の場所, "★まとめても 帯より 先");
  // ★★★つける 道も 1つ だけ である こと。
  t((親.match(/const onOpsMark = async/g) || []).length === 1, "★つける 道は 1本");
  // ★★1人ずつは `onOpsMark` を 通します。★まとめては `onOpsSaveBulk` です。
  //   ★★★どちらも `.select()` を 付けて います（★下で 見ます）。
  t(親.includes("return onOpsMark(lesson, status);"), "★1人ずつは その 1本を 呼ぶ");
  t((親.match(/const onOpsSaveBulk = async/g) || []).length === 1, "★まとめては 1本");
  // ★★0行に 当たっても 成功に 見えない こと（★2026-09-08 の 一件）。
  t(/\.update\(patch\)\.eq\("id", lesson\.id\)\.select\("id"\)/.test(親),
    "★`.select()` が 付いて いる");

  console.log(`\n○ ${ok}　✗ ${ng}`);
  process.exit(ng === 0 ? 0 : 1);
})();
