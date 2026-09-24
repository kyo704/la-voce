#!/usr/bin/env node
// STRIP: A
// ============================================================================
// ★カレンダーに つなぐ（★裁定195・2026-09-24）
//
//   ★★★仕組みは もう できて いました。★足りなかったのは この 1枚 だけ です。
//     ★★2026-09-24、★私は「購読の 道が 1本も ない」と 申し上げました。★誤り でした。
//       ★字で 探して、★`app/api/calendar/` を 見て いません でした。
//
//   ★見る 5つ ──
//     ① 切り替えが 閉じて いる ときは「1件ずつ」を 出す（★両方 出さない）
//     ② 住所は **読む だけ**。★開く たびに 作り直さない
//     ③ 体調は 1文字も 通らない（★台帳の 側でも 確かめる）
//     ④ 書いた 註が 本当
//     ⑤ 決めを 画面で 作って いない
// ============================================================================

const assert = require("assert");
const { readCode, readRaw, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const L = await loadLib("lib", "calendarSub.js");
  const 画 = readCode("components", "CalendarConnect.jsx");
  const 親 = readCode("components", "KoenMine.jsx");

  見る("較正 ── ★読めて いる", () => {
    assert.ok(画.includes("CalendarConnect"), "★画面が 読めて いません");
    assert.ok(Array.isArray(L.SUB_NOTES), "★束が 読めて いません");
  });

  見る("① 閉じて いれば「1件ずつ」。★両方 出さない", () => {
    assert.strictEqual(L.mayShowSubscribe({ cal_sub: true }), true, "★開いても 出ません");
    assert.strictEqual(L.mayShowSubscribe({ cal_sub: false }), false, "★閉じても 出します");
    assert.strictEqual(L.mayShowSubscribe(null), false, "★読み込み中に 出します");
    // ★★閉じて いる ときは **先に 返す** こと（★両方 描かない）。
    const i = 画.indexOf("if (!開) {");
    // ★★取り込みの 行にも 名が 出ます。★**描く ところ** で くらべます。
    const j = 画.indexOf("tx(SUB_HEAD)");
    assert.ok(i > 0 && j > i, "★両方を 1度に 描いて います");
    // ★★1件ずつ の 註に「もう一度 入れて ください」が ある こと。
    assert.ok(L.ONE_NOTES.join("").includes("もう一度 入れて ください"),
      "★入れ直しの ことを 書いて いません");
  });

  見る("② 住所は 読む だけ。★開く たびに 作り直さない", () => {
    // ★★読む ところ …… `select`。★作る ところ …… 押した ときだけ。
    assert.ok(/from\("calendar_tokens"\)\.select\(COLS_TOKEN\)/.test(画),
      "★住所を 読んで いません");
    const 読 = 画.indexOf("const 読む = useCallback");
    const 読終 = 画.indexOf("}, [supabase, 開]);", 読);
    assert.ok(読 > 0 && 読終 > 読, "★較正 ── ★読む ところが 見つかりません");
    assert.ok(!/rotate_calendar_token/.test(画.slice(読, 読終)),
      "★開く たびに 作り直して います");
    // ★★作り直しは 押した ときだけ。
    assert.ok(/onClick=\{\(\) => 作る\(true\)\}/.test(画), "★作り直す 札が ありません");
    assert.ok(/rpc\("rotate_calendar_token"\)/.test(画), "★作り直しの 道を 呼んで いません");
  });

  見る("③ 体調は 1文字も 通らない（★台帳の 側）", () => {
    // ★★返す 列が 6つ だけ で ある こと。
    const 道 = readRaw("app", "api", "calendar", "[token]", "route.js");
    assert.ok(/my_calendar_items/.test(道), "★較正 ── ★道が 読めて いません");
    ["throat", "voice", "sleep", "condition", "health", "entries"].forEach((w) =>
      assert.ok(!new RegExp(w).test(道), "★" + w + " が 道に あります"));
    // ★★送る 列の 決めも 狭い こと。
    const ce = readCode("lib", "calendarExport.js");
    assert.ok(/CALENDAR_ALLOWED = \["start", "end", "title"\]/.test(ce),
      "★送って よい 列が 広がって います");
  });

  見る("④ 書いた 註が 本当", () => {
    const 字 = L.SUB_NOTES.join("");
    ["体調の ことは 入りません", "住所を 人に 教えると",
      "作り直す", "お使いの アプリが 決めます", "変わったもの"].forEach((w) =>
        assert.ok(字.includes(w), "★" + w + " が ありません"));
    // ★★★「作り直すと 前の 住所は すぐ 使えなく なる」── ★台帳が そう なって いる こと。
    //   ★`rotate_calendar_token` は 1人 1つ（`on conflict (user_id) do update`）。
    assert.ok(/前の 住所は すぐ 使えなく なります/.test(字), "★取り替えの ことを 書いて いません");
  });

  見る("⑤ 決めを 画面で 作って いない", () => {
    assert.ok(!/"cal_sub"/.test(画), "★鍵の 名を 画面に 書いて います");
    assert.ok(/mayShowSubscribe\(features\)/.test(画), "★束に 尋ねて いません");
    assert.ok(/addressOf\(token/.test(画), "★住所を 画面で 組み立てて います");
    assert.ok(!/webcal:\/\//.test(画), "★住所の 形を 画面に 書いて います");
    // ★★入口が ある こと。
    assert.ok(/<CalendarConnect/.test(親), "★呼ばれて いません");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
