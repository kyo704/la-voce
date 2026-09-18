// ============================================================================
// ★見張り ── ★出欠の 言葉は、★学校の 言葉（★坂本さんの お決め・2026-09-18）
//
//   ★★見本（4本 とも）が `['出席','休み','休講']` です。
//   ★★★台帳は 変えません。★`came` / `absent` / `canceled` の まま です。
//     ★★字だけの 話 です。
//
//   ★★測る のは 4つ です。
//     ★一 ★3つの 字が 見本と 同じ か（★見本から 引きます。★書き写しません）
//     ★二 ★鍵（台帳の 値）は 変わって いない か
//     ★三 ★「欠席」を 作って いない か
//     ★四 ★★別の 画面（回数を 数える）の 言葉を、★巻き込んで いない か
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { readCode, loadLib } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
const 見本の道 = path.join(ROOT, "docs/design/pack-final/00-動く見本-PC・iPad（運営）.html");

let 数 = 0;
function ok(cond, 名) {
  数 += 1;
  assert.ok(cond, "★落ちました ── " + 名);
  console.log("  ok  " + 名);
}

(async () => {
  if (!fs.existsSync(見本の道)) {
    console.error("★止まりました ── 見本が ありません: " + 見本の道);
    process.exit(1);
  }
  const 見本 = fs.readFileSync(見本の道, "utf8");

  // ★★★字は 見本から 引きます。★書き写しません。
  const m = /\[\s*'([^']+)'\s*,\s*'([^']+)'\s*,\s*'([^']+)'\s*\]\.map\(function\(x\)/.exec(見本);
  assert.ok(m, "★止まりました ── 見本の 3つの 字を 読めません。");
  const 見本の3つ = [m[1], m[2], m[3]];
  ok(見本の3つ.join("／") === "出席／休み／休講",
    "見本の 3つ（" + 見本の3つ.join("／") + "）");

  const T = await loadLib("lib", "todayBand.js");
  ok(T.ATTENDANCE.length === 3, "実装も 3つ");
  ok(T.ATTENDANCE.map((a) => a.label).join("／") === 見本の3つ.join("／"),
    "字が 見本と 同じ（" + T.ATTENDANCE.map((a) => a.label).join("／") + "）");

  // ★★鍵は 台帳の まま。★字を 変えて、★値を 変えて いない こと。
  ok(T.ATTENDANCE.map((a) => a.key).join(",") === "came,absent,canceled",
    "鍵は 台帳の まま（came / absent / canceled）");
  ok(T.attendanceLabel("came") === "出席", "came → 出席");
  ok(T.attendanceLabel("canceled") === "休講", "canceled → 休講");
  ok(T.attendanceLabel("absent") === "休み", "absent → 休み");

  // ★★「欠席」を 作って いない（★見本も 作って いません）。
  ok(!T.ATTENDANCE.some((a) => a.label.includes("欠席")),
    "「欠席」を 作って いない");
  // ★★見本の 注 ──「休講＝その回を しなかった とき。生徒の 欠席に なりません」
  ok(/休講＝[\s\S]{0,40}欠席に なりません/.test(見本),
    "★較正 ── 見本に その 断りが ある");

  // ------------------------------------------------------------------------
  // ★四 ★別の 画面を 巻き込んで いない か
  // ------------------------------------------------------------------------
  //   ★★`components/VocalTracker.jsx` に「実施した／しなかった」が あります。
  //   ★★★あれは **回数を 数える 画面** です。★出欠を 見る 画面では ありません。
  //     ★★その 場に、こう 書いて あります ──
  //       ★「帯（§4-2）は 3つです。あちらは 出欠を 見る 画面で、
  //         ★ここは 回数を 数える 画面です。★問いが 違います。」
  //   ★★★一括の 置き換えで 巻き込むと、★問いが 1つに つぶれます。
  //     ★★（★裁定 その81 §9-1 ── ★一括置換で 階層が 消えた、と 同じ 形）
  const 本体 = readCode("components", "VocalTracker.jsx");
  ok(/label: "実施した"/.test(本体), "★回数の 画面の 言葉が 残って いる");
  ok(/label: "しなかった"/.test(本体), "★もう 1つも 残って いる");

  // ★★古い 字が どこにも 残って いない。
  ["lib/todayBand.js"].forEach((f) => {
    数 += 1;
    const src = readCode(f);
    assert.ok(!/label: "来た"|label: "中止"/.test(src),
      "★落ちました ── 古い 字が 残って います: " + f);
  });
  console.log("  ok  古い 字（来た／中止）が 残って いない");

  console.log("\n★" + 数 + "件 通りました ── 出欠の 言葉");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
