#!/usr/bin/env node
// ============================================================================
// ★書き出す（★見本 `stExport`・裁定 その97 C群）の 見張り
//
//   ★★★いちばん 大事な こと ── ★健康に かかわる ものが **一覧に 無い** こと。
//     ★★選んで 外す のでは ありません。★はじめから 無い のです。
//     ★★「切り忘れ」が 起きない、★という 作り その もの を 見張ります。
//
//   ★★★確かめる こと
//     ①体・声・ノート・連絡の 本文が、★1つも 出せる ものに 入って いない
//     ②できことで 出し分ける（★見られない ものは 出せない）
//     ③出す たびに 記録が 残る。★残せなければ 出さない
//     ④記録の 表は 消せない（★`update` `delete` を 渡して いない）
//     ⑤できない 形（Shift_JIS・Excel・ics）を 札に しない。★字で お伝えする
//     ⑥CSV の 組み立て（★引用符・改行・日付）
//
//   ★★較正 ── ★当たる はずの ものと、★当たらない はずの もので 試します。
// ============================================================================

const assert = require("assert");
const { readCode, readRaw, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }
async function 見る非同期(名, f) { await f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "opsExport.js");
  const ui = readCode("components", "OpsExport.jsx");
  const vt = readCode("components", "VocalTracker.jsx");
  const 紙 = readRaw("supabase", "migration_export_log.sql");

  見る("①健康に かかわる ものが、★一覧に 1つも ない", () => {
    const 名 = m.EXPORT_SETS.map((x) => x.label).join("／");
    ["声", "からだ", "ノート", "受診", "連絡", "くらべる"].forEach((語) =>
      assert.ok(!名.includes(語), "★出せる ものに 入って います: " + 語));
    // ★★★言葉の 一部で 判じません（★2026-09-20 に 誤りました）。
    //   ★★`status`（在籍の 様子）が `stat` に 当たって いました。
    //   ★★台帳の 列の 名 その ものと 見比べます。
    const 鍵 = m.EXPORT_SETS.flatMap((x) => x.cols.map((c) => String(c[1])));
    m.FORBIDDEN_COLUMNS.forEach((列) =>
      assert.ok(!鍵.includes(列), "★列に 入って います: " + 列));
    assert.strictEqual(m.neverExportIsAbsent(), true);
    // ★★較正 ── ★在籍の 様子（`status`）は 出せます。★止めて いない こと。
    assert.ok(鍵.includes("status"), "★出せる はずの 列が ありません");
    // ★★名ざしで お伝えして いる こと（★黙って 隠しません）。
    assert.ok(m.NEVER_EXPORT.length >= 5, "★出せない ものを 書いて いません");
    assert.ok(/NEVER_EXPORT/.test(ui), "★画面に 出して いません");
    // ★★較正 ── ★わざと 混ぜたら 見つかる こと。
    const 偽 = { label: "生徒の 声の記録", cols: [["声", "voice_score"]] };
    assert.ok(偽.cols.some((c) => c[1].includes("voice")), "★較正が 効いて いません");
  });

  見る("②できことで 出し分ける", () => {
    const 事務 = m.exportSets(["meibo"]).map((x) => x.key);
    assert.deepStrictEqual(事務, ["meibo"], "★名簿 だけ で ありません: " + 事務);
    // ★★出席は 2つ 要ります（★`shukketsu` と、★`sched_all` か `meibo`）。
    assert.deepStrictEqual(m.exportSets(["shukketsu"]).map((x) => x.key), [],
      "★出席の 門が ゆるい です");
    assert.ok(m.exportSets(["shukketsu", "meibo"]).some((x) => x.key === "attend"),
      "★出席が 出ません");
    // ★★持って いない ものは、★名ざしで お伝えします。
    assert.ok(m.cannotExport(["meibo"]).includes("行事"), "★出せない ものを 言いません");
    assert.ok(/cannotExport/.test(ui), "★画面に 出して いません");
  });

  見る("③出す たびに 記録が 残る。★残せなければ 出さない", () => {
    // ★★★`handleExportData`（ご本人の 書き出し）が 先に あります。
    //   ★★名の 頭だけ で 探すと、★そちらに 当たります（★2026-09-20）。
    //   ★★丈も 数で 決めません ── ★次の `async function` の 手前 まで。
    const i = vt.indexOf("async function handleExport(orgId");
    assert.ok(i > 0, "★書き出しの 手が ありません");
    const 次 = vt.indexOf("async function ", i + 20);
    const 中 = vt.slice(i, 次 > i ? 次 : vt.length);
    const 記 = 中.indexOf('from("export_log")');
    const 落 = 中.indexOf("URL.createObjectURL");
    assert.ok(記 > 0 && 落 > 0, "★記録か 落としが ありません");
    assert.ok(記 < 落, "★先に 落として います（★記録の 無い 持ち出し）");
    assert.ok(/data\.length === 0\) throw/.test(中.slice(0, 落)),
      "★0行でも 出して います");
    // ★★較正 ── ★字だけ 書いて 済ませて いない こと。
    assert.ok(/insert\(/.test(中.slice(0, 落)), "★記録して いません");
  });

  見る("④記録の 表は 消せない", () => {
    const 無註 = 紙.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
    assert.ok(/revoke all on table public\.export_log[^\n]*from public, anon, authenticated/
      .test(無註), "★先に 取り上げて いません");
    const g = /grant ([^\n]+) on table public\.export_log to authenticated/.exec(無註);
    assert.ok(g, "★渡して いません");
    assert.ok(!/update|delete/.test(g[1]), "★消せます: " + g[1]);
    // ★★較正（★当たらない はず）── ★中身は しまって いない こと。
    ["body", "content", "csv", "file"].forEach((語) =>
      assert.ok(!new RegExp("\\b" + 語 + "\\b").test(無註), "★中身を しまって います: " + 語));
  });

  見る("⑤できない 形を 札に しない", () => {
    assert.ok(!m.ENCODINGS.includes("Shift_JIS"), "★選べない ものを 出して います");
    assert.ok(!/Excel|\.xlsx|iCalendar|\.ics/.test(
      m.ENCODINGS.join(",") + m.DATE_FORMATS.join(",")), "★選べない 形が 札に あります");
    const 鍵 = m.EXPORT_NOT_YET.map((x) => x.key);
    ["shift_jis", "xlsx", "ics"].forEach((k) =>
      assert.ok(鍵.includes(k), "★書き残しが ありません: " + k));
    m.EXPORT_NOT_YET.forEach((x) =>
      assert.ok(x.why && x.needs, "★わけと 要る ものが ありません: " + x.key));
    assert.ok(/EXPORT_NOT_YET/.test(ui), "★画面に 出して いません");
  });

  見る("⑥組み立て（★引用符・改行・日付）", () => {
    const 組 = m.EXPORT_SETS.find((x) => x.key === "meibo");
    const csv = m.buildCsv({
      set: 組,
      rows: [{ student_number: "S1", name: 'たか"し', kana: "タカシ" }],
      preset: "そのまま", newline: "CRLF"
    });
    assert.ok(csv.includes('"たか""し"'), "★引用符を 逃がして いません");
    assert.ok(csv.includes("\r\n"), "★改行が ちがいます");
    assert.ok(!m.buildCsv({ set: 組, rows: [], preset: "そのまま", newline: "LF" })
      .includes("\r"), "★LF に なって いません");
    // ★★見出しの 対応表。
    const b = m.buildCsv({ set: 組, rows: [], preset: "BLEND", newline: "LF" });
    assert.ok(b.includes("生徒コード"), "★見出しを 変えて いません");
    // ★★日付の 形。
    assert.strictEqual(m.formatDate("2026-09-14", "2026/09/14"), "2026/09/14");
    assert.strictEqual(m.formatDate("2026-09-14", "20260914"), "20260914");
    assert.strictEqual(m.formatDate("2026-09-14", "令和8年9月14日"), "令和8年9月14日");
    assert.strictEqual(m.formatDate("", "20260914"), "", "★読めなければ 空");
    // ★★較正 ── ★令和より 前は 西暦の まま。
    assert.strictEqual(m.formatDate("2015-04-01", "令和8年9月14日"), "2015年4月1日");
  });

  見る("⑦素は 台帳の 列から 作る（★無い ものを 作らない）", () => {
    const 行 = m.rowsFor("meibo", {
      enrollments: [{ student_id: "s1", student_number: "S1", grade_label: "2年",
        status: "active", division_id: "d1", enrolled_at: "2026-04-01T00:00:00Z" }],
      assignments: [{ teacher_id: "t1", student_id: "s1", ended_at: null }],
      divisions: [{ id: "d1", name: "声楽", parent_id: "d0" },
        { id: "d0", name: "音楽学部" }],
      nameOf: (id) => ({ s1: "たかぎ", t1: "さいとう" })[id] || "",
      kanaOf: () => "タカギ",
      dateFmt: "2026-09-14"
    });
    assert.strictEqual(行.length, 1);
    assert.strictEqual(行[0].division, "声楽");
    assert.strictEqual(行[0].division_parent, "音楽学部");
    assert.strictEqual(行[0].teacher, "さいとう");
    assert.strictEqual(行[0].status, "在籍");
    // ★★較正 ── ★終わった 受け持ちは 出しません。
    const 行2 = m.rowsFor("meibo", {
      enrollments: [{ student_id: "s1" }],
      assignments: [{ teacher_id: "t1", student_id: "s1", ended_at: "2026-08-01" }],
      nameOf: () => "さいとう"
    });
    assert.strictEqual(行2[0].teacher, "", "★終わった 受け持ちを 出して います");
    // ★★出欠は、★台帳の 値を そのまま 出しません。
    assert.strictEqual(m.ATTEND_WORD.came, "出席");
  });

  見る("⑧節の 紙が、★できた ものと 合って いる", () => {
    const nav = readCode("lib", "opsSettingsNav.js");
    const 出 = /{ key: "export"[\s\S]{0,200}?}/.exec(nav)[0];
    assert.ok(/ready: true/.test(出), "★まだ の ままです");
    assert.ok(!/needs:/.test(出), "★足りない ものが 残って います");
    assert.ok(/<OpsExport/.test(vt), "★置かれて いません");
  });

  await 見る非同期("⑨自分の 予定は、★2枚目を 作って いない", async () => {
    // ★★★`my_periods` ／ `my_timetable` の 画面は もとから あります。
    //   ★★同じ 決めを 2か所に 置くと、★片方だけ 直る 日が 来ます。
    assert.ok(/<MyTimetable userId=\{userId\}/.test(vt), "★もとの 1枚を 出して いません");
    const 蔵 = require("fs").readdirSync(
      require("path").join(__dirname, "..")).filter((f) => /Timetable/.test(f));
    assert.deepStrictEqual(蔵, ["MyTimetable.jsx"], "★2枚目が あります: " + 蔵.join(","));
    // ★★守れない ことを、★守れる ように 書いて いない こと。
    const tt = await loadLib("lib", "myTimetable.js");
    assert.ok(tt.MINE_HERE_LINE.includes("まだ 効きません"),
      "★事務が 組む ときの ことを 書いて いません");
    const nav = readCode("lib", "opsSettingsNav.js");
    const 節 = /{ key: "mine"[\s\S]{0,200}?}/.exec(nav)[0];
    assert.ok(/ready: true/.test(節), "★まだ の ままです");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
