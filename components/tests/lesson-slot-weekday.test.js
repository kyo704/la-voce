#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★曜日を 数え はじめる ところが、★台帳と 揃って いる
//
//   ★出どころ 2026-09-23 ──
//     ★レッスン割の 3画面は 曜日を **1 から** 数えて いました。
//     ★★台帳の `my_timetable.weekday` は **0 から** です
//       （`my_timetable_weekday_ok` … weekday >= 0 and weekday <= 6）。
//     ★★`seed_prefs_from_timetable` は その 生の 値で 鍵を 作ります ──
//         t.weekday::text || '-' || t.period_id::text
//     ★★★1日 ずれて いました。★月曜に 付けた 希望は "1-…"、
//       ★授業の × は "0-…"。★先生の 地図も 1日 ずれます。
//     ★★さらに ── ★土（5）が 6 に なり、★日曜と 同じ 鍵に なります。
//
//   ★★この 見張りは 数を 覚えません。★**紙を 読んで** 確かめます ──
//     ① 台帳の 縛りが「0 から」で ある ことを、★SQL の 紙 から 読む
//     ② 画面と lib が `+ 1` して いない ことを、★中の 字 から 読む
//     ③ `slotKey(0, …)` が 鍵を 返す（★0 を「無い」と 見なさない）
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

(async () => {
  console.log("① 台帳の 縛りを 紙 から 読む");
  const 置場 = path.join(ROOT, "supabase", "migrations");
  let 縛 = null, 種 = null;
  fs.readdirSync(置場).filter((f) => f.endsWith(".sql")).forEach((f) => {
    const s = fs.readFileSync(path.join(置場, f), "utf8");
    const m = s.match(/my_timetable_weekday_ok[\s\S]{0,120}?weekday\s*>=\s*(\d+)/i);
    if (m && 縛 === null) 縛 = Number(m[1]);
    if (/seed_prefs_from_timetable/.test(s) && /t\.weekday::text\s*\|\|\s*'-'/.test(s)) 種 = f;
  });
  t(縛 !== null, "★縛りを 読めた（weekday >= " + 縛 + "）");
  t(縛 === 0, "★台帳は **0 から** 数える");
  t(種 !== null, "★鍵を 作る 関数を 読めた（" + (種 || "★無し") + "）");

  console.log("\n② 画面と lib が ずらして いない");
  const 見 = [
    ["components", "LessonPrefs.jsx"],
    ["components", "LessonPrefMap.jsx"],
    ["lib", "lessonRound.js"]
  ];
  見.forEach(([d, f]) => {
    const s = readCode(d, f);
    // ★★`di + 1` を どこにも 書かない、で 見ます。
    //   ★`slotKey(di + 1, …)` でも `const wd = di + 1;` でも 同じ ずれ です。
    //   ★★形を 数え上げると 漏れます。★**ずらす 字 そのもの**を 禁じます。
    t(!/\bdi\s*\+\s*1\b/.test(s), "★" + f + " ── `di + 1` を どこにも 書いて いない");
    // ★★鍵を 作る ときに 渡して いるのが、★その まま の 番号か
    //   ★★`slotKey` を **決めて いる** ファイルは 別 です（★引数の 名前が 当たります）。
    const 渡 = /export function slotKey\(/.test(s) ? [] : s.match(/slotKey\(\s*([A-Za-z_$][\w$]*)\s*,/g) || [];
    渡.forEach((x) => {
      const nm = x.replace(/slotKey\(\s*/, "").replace(/\s*,$/, "");
      const 代 = new RegExp("(?:const|let|var)\\s+" + nm + "\\s*=\\s*([^;\\n]+)");
      const m = s.match(代);
      t(nm === "di" || (m && /^di\s*$/.test(m[1].trim())),
        "★" + f + " ── slotKey に 渡すのは その ままの 番号（" + nm
          + (m ? " = " + m[1].trim() : "") + "）");
    });
  });

  console.log("\n③ 0 を「無い」と 見なさない");
  const src = fs.readFileSync(path.join(ROOT, "lib", "lessonRound.js"), "utf8")
    .replace(/from "@\/lib\/([a-zA-Z0-9]+)"/g, (mm, n) =>
      `from "${"file://" + path.join(ROOT, "lib", n + ".js")}"`);
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  t(L.slotKey(0, "p1") === "0-p1", "★slotKey(0, …) は '0-p1'（★null に しない）");
  t(L.slotKey(null, "p1") === null, "★曜日が 無ければ null");
  t(L.slotKey(0, null) === null, "★コマが 無ければ null");

  console.log("\n④ 置ける 枠も 0 から");
  const 枠 = L.placeableSlots({
    prefs: { "0-p1": L.MARU, "5-p1": L.SANKAKU },
    placed: {}, busy: {},
    periods: [{ id: "p1", name: "1限" }], days: 6
  });
  t(枠.length === 2, "★来られる 枠が 2つ（" + 枠.length + "）");
  t(枠[0].key === "0-p1" && 枠[0].weekday === 0, "★はじめの 曜日は 0");
  t(枠[1].weekday === 5, "★おわりの 曜日は 5（★6 に しない ＝ 日曜と 重ねない）");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
