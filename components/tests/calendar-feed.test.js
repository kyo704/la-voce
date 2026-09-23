#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★カレンダーの 配り口 と ICS の 形
//
//   ★★守る こと
//     ① ★体の 記録が 1文字も 入らない
//     ② ★合って いない 住所と 合って いる 住所を、★返事で 見分けられない
//     ③ ★覚えさせない（no-store）── ★住所を 取り替えた あと 古い ものを 出さない
//     ④ ★台帳を 呼ぶのは サーバだけ（`my_calendar_items` は authenticated に 渡さない）
//     ⑤ ICS の 形（★折り返し・逃がし・時）
//     ⑥ ★取り消された 予定は 消さずに 取り消しと 書く
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

(async () => {
  const 道 = readCode("app/api/calendar/[token]", "route.js");
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "ics.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 体の 記録が 入らない");
  // ★★★`src` は 読み込む ため の 生の 字 です（★註が 残って います）。
  //   ★★語を 探す ときは、★註を 落とした ほう を 使います。
  //     ★★`lib/ics.js` の 註には「★体の 記録。★声の 調子。★のどの 様子。」と
  //       ★書いて あります ── ★**入れない と 書いた 字**です。
  //     ★★★それを 数えると、★禁じて いる ことを もって 禁を 破ったと 言う ことに なります。
  //   ★★きょう 7度目の 同じ 形 です。★語を 探す 見張りは、★必ず 註を 落とします。
  const icsCode = readCode("lib", "ics.js");
  ["voice", "throat", "sleep", "entries", "health", "体調", "のど", "声の"].forEach((w) => {
    t(!new RegExp(w).test(icsCode), "★ics.js に " + w + " が ない");
    t(!new RegExp(w).test(道), "★道に " + w + " が ない");
  });
  // ★★★渡した ところで 出ない こと（★列を 増やさない）。
  const r = L.itemsToIcs([{ uid: "x", starts_at: "2026-10-01T00:00:00Z",
    ends_at: "2026-10-01T01:00:00Z", title: "レッスン", place: "",
    voiceQuality: 5, sleepHours: 7, throat_condition: 3 }], { now: 0 });
  t(!/voiceQuality|sleepHours|throat/.test(r.text), "★★余計な 列を 渡しても、★出ません");

  console.log("\n② 見分けられない");
  t(!/404|status: 404|notFound/.test(道), "★404 を 返して いない");
  t((道.match(/return 返す\(/g) || []).length >= 3, "★どの 道でも 同じ 返し方（" +
    (道.match(/return 返す\(/g) || []).length + "か所）");
  t(/token\.length < 32/.test(道), "★短すぎる 住所は 台帳の 手前で 止める");

  console.log("\n③ 覚えさせない");
  t(/no-store/.test(道), "★Cache-Control に no-store");
  t(/force-dynamic/.test(道), "★force-dynamic");

  console.log("\n④ 台帳は サーバだけ");
  t(/createAdminClient/.test(道), "★admin（service role）で 呼ぶ");
  t(/rpc\("my_calendar_items"/.test(道), "★関数を 呼ぶ（★表を 直に 読まない）");
  t(!/from\("lessons"\)|from\("koen/.test(道), "★表を 直に 読んで いない");

  console.log("\n⑤ ICS の 形");
  t(L.icsTime("2026-10-01T09:00:00Z") === "20261001T090000Z", "★時の 形");
  t(L.icsTime("だめ") === null, "★読めない 時は null");
  t(L.escapeText("a;b,c\\d\ne") === "a\;b\\,c\\\\d\\ne", "★逃がし（; , \\ 改行）");
  t(L.fold("x".repeat(200)).split("\r\n").length === 3, "★75字で 折る");
  t(/BEGIN:VCALENDAR\r\n/.test(r.text) && /END:VCALENDAR\r\n$/.test(r.text), "★始めと 終わり");
  const bad = L.itemsToIcs([{ uid: "a", starts_at: "だめ", ends_at: null, title: "x" }], { now: 0 });
  t(bad.dropped === 1 && bad.count === 0, "★読めない 予定は 落として 数える");

  console.log("\n⑥ 取り消し");
  const c = L.itemsToIcs([{ uid: "k", starts_at: "2026-10-01T00:00:00Z",
    ends_at: "2026-10-01T01:00:00Z", title: "公演", canceled: true }], { now: 0 });
  t(/STATUS:CANCELLED/.test(c.text) && c.count === 1, "★消さずに 取り消しと 書く");

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
