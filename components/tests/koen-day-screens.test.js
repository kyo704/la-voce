#!/usr/bin/env node
// STRIP: B（見える 字）
// ============================================================================
// ★★★本番の 日の 流れ ／ スタッフの 自分の 予定 ／ 公演の 自分の 予定 ── ★3画面
//   ★出どころ 裁定148 Q6 ／ 裁定178
//     ／ woolsong-2026-09-21_1.zip（md5 67c56244 ／ 0132714e）
//
//   ★★守る こと
//     ① 決めを 画面で 作って いない
//     ② ★出演者か スタッフかを **画面で** 分けて いない（★台帳が 決める）
//     ③ ★ほかの 方の 入りの 時刻を 出さない
//     ④ ★スタッフに 出番を 出さない（★裁定148 Q6）
//     ⑤ ★体の ことを 1つも 読んで いない
//     ⑥ ★お知らせを 送る 形が ない
//     ⑦ 但し書きが 見本の まま ／ ⑧ tx() ／ ⑨ 44 以上
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

(async () => {
  const 流 = readCode("components", "KoenDayFlow.jsx");
  const 流生 = readRaw("components", "KoenDayFlow.jsx");
  const 予 = readCode("components", "KoenMySchedule.jsx");
  const 予生 = readRaw("components", "KoenMySchedule.jsx");
  const src = fs.readFileSync(path.join(ROOT, "lib", "myKoenDay.js"), "utf8");
  const L = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 決めを 画面で 作って いない");
  ["dayRows", "myCallTime", "hasAny", "myRoomName"].forEach((n) =>
    t(new RegExp("\\b" + n + "\\b").test(流), "★流れ ── " + n + " を 借りて いる"));
  ["scheduleRows", "hhmm"].forEach((n) =>
    t(new RegExp("\\b" + n + "\\b").test(予), "★予定 ── " + n + " を 借りて いる"));
  t(!/\.select\(\s*["'`]\*/.test(流) && !/\.select\(\s*["'`]\*/.test(予),
    "★`select('*')` を 書いて いない");

  console.log("\n② 誰に 何を 見せるかは 台帳が 決める");
  t(/rpc\(\s*"my_runsheet"/.test(流), "★`my_runsheet` を 呼ぶ");
  // ★★`isStaff` は **見せ方** だけ に 使います。★行を 絞る ために 使いません。
  const 絞 = 流.match(/isStaff[^\n]*filter|filter[^\n]*isStaff/g) || [];
  t(絞.length === 0, "★`isStaff` で 行を 絞って いない");
  t(!/from\("koen_runsheet"\)/.test(流), "★区切りの 表を 直に 読んで いない");
  t(!/from\("koen_runsheet_calls"\)/.test(流), "★呼び出しの 表も 直に 読んで いない");

  console.log("\n③ ほかの 方の 入りの 時刻を 出さない");
  t(/myCallTime\(行\)/.test(流), "★自分の 入りだけ を 出す");
  t(L.myCallTime([{ mine: false, time: "09:00" }]) === null, "★呼ばれて いなければ null");
  t(L.myCallTime([{ mine: true, time: "12:00" }, { mine: true, time: "10:00" }]) === "10:00",
    "★いちばん はやい 自分の 時刻");
  t(L.myRoomName([{ id: "r1", name: "B楽屋" }], [{ member_id: "m1", room_id: "r1" }], "m2") === null,
    "★ほかの 方の 楽屋は 返さない");
  t(L.myRoomName([{ id: "r1", name: "B楽屋" }], [{ member_id: "m1", room_id: "r1" }], "m1") === "B楽屋",
    "★自分の 楽屋は 返す");

  console.log("\n④ スタッフに 出番を 出さない");
  t(/ほかの スタッフの 時刻も、出演者の 出番も 出ません。/.test(L.STAFF_NOTE[1]),
    "★★裁定148 Q6 の 約束が ある");
  t(/rpc\(\s*"my_koen_schedule"/.test(予), "★予定は `my_koen_schedule` から");
  t(!/my_koen_schedule/.test(流), "★流れの 画面は 出番を 引いて いない");

  console.log("\n⑤ 体の ことを 読んで いない");
  ["entries", "体調", "throat", "voice_quality", "condition"].forEach((w) => {
    t(!new RegExp(w, "i").test(流.replace(/体調の ことも 出ません/g, "")),
      "★流れ ── 「" + w + "」が ない");
    t(!new RegExp(w, "i").test(予.replace(/体調の ことも 出ません/g, "")),
      "★予定 ── 「" + w + "」が ない");
  });

  console.log("\n⑥ お知らせを 送らない");
  ["notify", "push(", "sendMail", "org_messages", "resend"].forEach((w) => {
    t(!new RegExp(w.replace(/[()]/g, "\\$&"), "i").test(流), "★流れ ── 「" + w + "」が ない");
    t(!new RegExp(w.replace(/[()]/g, "\\$&"), "i").test(予), "★予定 ── 「" + w + "」が ない");
  });
  t(/お知らせは 送りません/.test(L.DAY_NOTE[2]), "★★約束の 字が ある");

  console.log("\n⑦ 但し書きが 見本の まま");
  const 素 = (s) => s.replace(/<[^>]*>/g, "").replace(/[\s　'"+★]/g, "");
  const 見P = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-PC・iPad（運営）.html"), "utf8");
  const 見S = fs.readFileSync(path.join(ROOT, "docs", "design", "pack-final",
    "00-動く見本-iPhoneで開く用.html"), "utf8");
  const 両 = 素(見P) + 素(見S);
  [...L.DAY_NOTE, ...L.STAFF_NOTE, ...L.MINE_NOTE].forEach((l) =>
    t(両.includes(素(l)), "★見本に ある …… " + l.slice(0, 18)));

  console.log("\n⑧⑨ 字と 押しどころ");
  [["流れ", 流生], ["予定", 予生]].forEach(([n, g]) => {
    const 裸 = (g.match(/>[^<>{}\n]*[ぁ-んァ-ヶ一-龠][^<>{}\n]*</g) || [])
      .filter((s) => !/^>\s*<$/.test(s));
    t(裸.length === 0, "★" + n + " ── 裸の 日本語が ない"
      + (裸.length ? "（" + 裸[0].slice(0, 26) + "）" : ""));
    const 高 = g.match(/minHeight:\s*(\d+)/g) || [];
    t(高.length > 0 && 高.every((h) => Number(h.replace(/\D/g, "")) >= 44),
      "★" + n + " ── どれも 44 以上");
  });

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
