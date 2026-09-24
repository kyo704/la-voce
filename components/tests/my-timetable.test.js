#!/usr/bin/env node
// ============================================================================
// 個人の時間割の見張り
//
//   lib/myTimetable.js の表作りと、MyTimetable.jsx の表示契約を確認します。
//   実行: node components/tests/my-timetable.test.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(condition, label) {
  if (condition) console.log("  ✓ " + label);
  else { console.log("  ✗ " + label); failed++; }
}
function eq(actual, expected, label) {
  ok(JSON.stringify(actual) === JSON.stringify(expected),
    label + `（実際: ${JSON.stringify(actual)}）`);
}

async function loadLib() {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "..", "lib", "myTimetable.js"), "utf8"
  );
  return import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
}

(async () => {
  const m = await loadLib();
  const ui = readCode("components", "MyTimetable.jsx");
  const raw = readRaw("components", "MyTimetable.jsx");

  console.log("① 曜日の決まり");
  eq(m.DAYS, ["月", "火", "水", "木", "金", "土"], "月〜土の6列");
  ok(m.DAYS.includes("金"), "金曜日がある");
  ok(!m.DAYS.includes("日"), "日曜日を出さない");

  console.log("\n② はじめのコマ");
  const defaults = m.periodsOf([]);
  eq(defaults.length, 6, "既定のコマは6限まで");
  ok(defaults.every((p, i) => p.ord === i + 1), "コマ番号が1から順番");
  ok(defaults.every((p) => p.id === null), "既定のコマは台帳へ書かない");
  ok(!m.isOwnPeriods([]), "空の台帳は自分で決めた扱いにしない");
  ok(m.isOwnPeriods([{ id: "p1", ord: 1 }]), "台帳にあれば自分のコマ");

  console.log("\n③ マスの状態");
  eq(m.cellState(null), "free", "行が無ければ空き");
  eq(m.cellState({ unavailable: true }), "unavailable", "来られない");
  eq(m.cellState({ title: "声楽" }), "class", "授業名があれば授業");
  eq(m.cellState({ teacher: "先生" }), "class", "先生だけでも授業");
  eq(m.cellState({ title: "  " }), "free", "空白だけは空き");

  console.log("\n④ 曜日×コマの表");
  const periods = [{ id: "p1", ord: 1, name: "1限", start_min: 540, end_min: 630 }];
  const rows = [
    { weekday: 0, period_id: "p1", title: "声楽" },
    { weekday: 4, period_id: "p1", unavailable: true },
    { weekday: 4, period_id: "other", title: "別のコマ" }
  ];
  const grid = m.buildGrid(rows, periods);
  eq(grid.length, 1, "コマごとに1行");
  eq(grid[0].cells.length, 6, "1行に月〜土の6マス");
  eq(grid[0].cells[0].state, "class", "月曜の授業");
  eq(grid[0].cells[4].state, "unavailable", "金曜の来られない");
  eq(grid[0].cells[5].state, "free", "土曜の空き");
  eq(m.freeCount(rows, periods), 4, "空きは授業・来られないを除いて数える");

  console.log("\n⑤ 時刻と入力検証");
  eq(m.hhmm(540), "9:00", "分を時刻へ");
  eq(m.hhmm(10 * 60 + 5), "10:05", "1桁の分を0埋め");
  eq(m.toMin("9:05"), 545, "時刻を分へ");
  eq(m.toMin("x"), null, "不正な時刻はnull");
  eq(m.periodError({ name: "1限", start_min: 540, end_min: 630 }), null, "正しいコマ");
  ok(m.periodError({ name: "", start_min: 540, end_min: 630 }), "名前が無ければエラー");
  ok(m.periodError({ name: "1限", start_min: 630, end_min: 540 }), "逆順の時刻はエラー");

  console.log("\n⑥ 画面は曜日列とマスの大きさを固定");
  ok(/tableLayout: "fixed"/.test(ui), "表のレイアウトが固定");
  // ★★2026-09-14、★数を 決め打ちして いたので 落ちました。
  //   ★★坂本さんの お決めで、★表を 広げました（★コマ列 15%→12%、★高さ 58→64）。
  //   ★★見張りが 見る べきは「**固定して いるか**」です。★数では ありません。
  //     ★★数を 書くと、★広げる たびに 見張りを 直す ことに なります。
  //       ★それは 同じ 決めが 2か所に ある、という いつもの 形です。
  ok(/<colgroup>/.test(ui) && /\/ DAYS\.length/.test(ui), "曜日列の幅をcolで固定");
  {
    const koma = (ui.match(/<col style=\{\{ width: "(\d+)%" \}\} \/>/) || [])[1];
    ok(!!koma, "コマ列の幅を固定（" + koma + "%）");
    // ★★曜日の ぶんと 合わせて 100% に なること。
    const days = (ui.match(/\$\{(\d+) \/ DAYS\.length\}%/) || [])[1];
    ok(!!days && Number(koma) + Number(days) === 100,
      "コマ列と 曜日列で 100%（" + koma + " + " + days + "）");
  }
  {
    const m = ui.match(/height: (\d+), minHeight: (\d+)/);
    ok(!!m && m[1] === m[2], "予定マスの高さを固定（" + (m ? m[1] : "?") + "px）");
  }
  ok(/overflow: "hidden"/.test(ui), "長い文字でマスを伸ばさない");
  ok(!/overflowX: "auto"/.test(ui), "横スクロールに依存しない");
  ok(/DAYS\.map/.test(ui), "曜日はlibのDAYSから描く");
  ok(/DAYS\.length/.test(raw), "6曜日を直書きしていない");

  // -------------------------------------------------------------------------
  // ★2026-09-24 ── ★見本 `SC['時間割']` と 読みくらべて（★段3a A群）
  // -------------------------------------------------------------------------
  console.log("★表の 下の 1行");
  ok(m.TT_FREE_LABEL === "先生に 見える あき", "★だれに 見えるかを 言って いる");
  ok(m.TT_EDIT_HINT === "押すと 直せます", "★押せる ことを 言って いる");
  ok(ui.includes("TT_FREE_LABEL") && ui.includes("TT_EDIT_HINT"), "★画面が 出して いる");
  ok(!/空いて いる コマ/.test(ui), "★前の 字が 残って いない");

  console.log("★凡例 ── ★在る マスの ぶん だけ");
  {
    ok(m.TT_LEGEND.length === 3, "★3つ（★見本の 4つ目は 作って いない）");
    const 名 = m.TT_LEGEND.map((g) => g.label).join("／");
    ["あき", "あきだが 来られない", "授業"].forEach((w) =>
      ok(名.includes(w), "★" + w + " が ある"));
    ok(!/ほかの 教室/.test(名), "★出ない マスの 色見本を 置いて いない");
    // ★★色見本の 色は、★本当に その マスの 色で ある こと。
    const 色 = readRaw("components", "MyTimetable.jsx");
    ok(/background: CELL_BG\[g\.state\]/.test(色), "★色見本が マスと 同じ 色");
    // ★★lib が 知らない 姿を 並べて いない こと。
    const 姿 = m.TT_LEGEND.map((g) => g.state);
    ok(姿.every((x) => ["free", "unavailable", "class"].includes(x)), "★姿が 3つの どれか");
  }

  console.log("★表の 下の 註 ── ★本当の こと だけ");
  {
    const 註 = m.TT_GRID_NOTES.join("\n");
    ok(m.TT_GRID_NOTES.length === 3, "★3行（★見本は 4行）");
    ok(/先生に 送るのは「空いているか どうか」だけ/.test(註), "★何が 送られるか");
    ok(/理由を 聞きません。どこに いるかも 送りません。/.test(註), "★聞かない ことを 書いて ある");
    // ★★★「端末」と 書かない こと。★中身は 台帳に あります。
    ok(!/端末/.test(註), "★端末の 中だけ、と 書いて いない");
    ok(/あなたの 画面にしか 出ません/.test(註), "★していることを 書いて いる");
    // ★★★まだ 無い「設定」へ 送って いない こと。
    ok(!/時間の 割り方/.test(註), "★まだ 無い 設定へ 送って いない");
    ok(ui.includes("TT_GRID_NOTES"), "★画面が 出して いる");
    // ★★`TT_COPY.notes` は `SC['授業を入れる']` の 註 です。★あちらでは 正しい。
    //   ★★見るのは「表の 画面で 出して いない こと」── ★1度きり で、
    //     ★★その 1度が、★マスの 画面（`TT_COPY.fName` の あと）で ある こと。
    ok((ui.match(/TT_COPY\.notes\.map/g) || []).length === 1, "★註を 2か所で 出して いない");
    ok(ui.indexOf("TT_GRID_NOTES") < ui.indexOf("TT_COPY.notes.map"),
      "★表の 註が 先（★表の 画面で 別の 註を 出して いない）");
    ok(ui.indexOf("TT_COPY.fName") < ui.indexOf("TT_COPY.notes.map"),
      "★その 註は マスの 画面の もの");
  }

  console.log("★書いた 約束が 本当か（★台帳の 側）");
  {
    // ★★決まりは ご本人だけ。★先生の 道も、★`security definer` の 道も ない こと。
    const rls = readRaw("supabase", "migrations", "20260101000009_base_09_rls.sql");
    const i = rls.indexOf('create policy "my_timetable_own"');
    ok(i > 0, "★較正 ── ★決まりが 読めて いる");
    ok(/auth\.uid\(\) = user_id/.test(rls.slice(i, i + 260)), "★ご本人だけ");
    ok((rls.match(/create policy "my_timetable_/g) || []).length === 1,
      "★決まりが 1つ だけ");
    // ★★先生へ 渡る 道は、★空きの 印 しか 書かない こと。
    const fn = readRaw("supabase", "migrations", "20260101000007_base_07_functions_3.sql");
    const j = fn.indexOf("FUNCTION public.seed_prefs_from_timetable");
    ok(j > 0, "★較正 ── ★道が 読めて いる");
    const 本 = fn.slice(j, fn.indexOf("$function$;", j));
    ok(/insert into public\.lesson_prefs\(round_id, user_id, slot_key, level\)/.test(本),
      "★書くのは 枠の 印 だけ");
    ["title", "teacher", "room", "memo", "note"].forEach((w) =>
      ok(!new RegExp("t\\." + w).test(本), "★" + w + " を 読んで いない"));
  }

  console.log(failed === 0 ? "\n★すべて通りました" : `\n★${failed}件、落ちました`);
  process.exit(failed === 0 ? 0 : 1);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
