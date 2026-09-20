#!/usr/bin/env node
// ============================================================================
// ★学校の 基本（★`stKoma` ／ `stPlace`）と 見やすさ（★`stMiyasu`）の 見張り
//
//   ★★★確かめる こと
//     ①直せるのは `koma` を 持つ 方 だけ（★台帳も 同じ 門）
//     ②学校の コマと、★ご自分の コマは 別の 表
//     ③重なりは 印だけ。★止めない
//     ④同じ 名前の 場所を 2つ 作らない
//     ⑤見やすさは その 端末 だけ、と 書いて ある
//
//   ★★較正 ── ★通る ものと 通らない ものの 両方で 試します。
// ============================================================================

const assert = require("assert");
const { readRaw, readCode, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "orgMaster.js");
  const sql = readRaw("supabase", "migration_org_master.sql");
  const 本文 = sql.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
  const ui = readCode("components", "OpsOrgMaster.jsx");
  const 見 = readCode("components", "OpsMiyasu.jsx");
  const vt = readCode("components", "VocalTracker.jsx");

  見る("較正 ── ★読めて いる", () => {
    assert.strictEqual(typeof m.periodOk, "function");
    assert.ok(本文.includes("create table if not exists public.org_periods"));
  });

  見る("①直せるのは `koma` だけ", () => {
    assert.strictEqual(m.mayEditMaster(["koma"]), true);
    assert.strictEqual(m.mayEditMaster(["meibo"]), false);
    assert.ok(/has_can\(org_id, 'koma'\)/.test(本文), "★台帳の 門が ちがいます");
    assert.ok(/mayEditMaster/.test(ui), "★画面が 判じて いません");
    // ★★読むのは 学校の 方 みな（★全員の 画面の もと だから です）。
    assert.ok(/from public\.memberships/.test(本文), "★読む 道が ありません");
  });

  見る("②学校の コマと ご自分の コマは 別の 表", () => {
    assert.ok(/org_periods/.test(本文), "★学校の 表が ありません");
    assert.ok(!/update public\.my_periods|insert into public\.my_periods/.test(本文),
      "★ご自分の コマに 触って います");
    assert.ok(m.KOMA_NOTE.join("").includes("自分の コマ"),
      "★先生が ご自分で 決められる ことを 書いて いません");
  });

  見る("③重なりは 印だけ（★止めない）", () => {
    const 行 = [
      { id: "a", start_min: 540, end_min: 630 },
      { id: "b", start_min: 600, end_min: 700 },
      { id: "c", start_min: 720, end_min: 800 }
    ];
    const 出 = m.overlaps(行);
    assert.strictEqual(出.length, 1, "★重なりを 見つけて いません");
    assert.strictEqual(m.overlaps([行[0], 行[2]]).length, 0, "★重なって いないのに 出ます");
    // ★★台帳で 止めて いない こと（★重ねる 学校も あります）。
    assert.ok(!/exclude using|overlap/i.test(本文), "★台帳で 止めて います");
    assert.ok(/OVERLAP_WORD/.test(ui), "★印を 出して いません");
  });

  見る("④同じ 名前の 場所を 2つ 作らない", () => {
    const 場 = [{ name: "第1練習室" }];
    assert.strictEqual(m.placeOk("第2練習室", 場), true);
    assert.strictEqual(m.placeOk("第1練習室", 場), false);
    assert.strictEqual(m.placeOk("  ", 場), false);
    assert.ok(/unique \(org_id, name\)/.test(本文), "★台帳でも 止めて いません");
  });

  見る("★時刻の 読み書き", () => {
    assert.strictEqual(m.toMin("9:00"), 540);
    assert.strictEqual(m.toMin("09:05"), 545);
    assert.strictEqual(m.toMin("25:00"), null, "★おかしな 時刻を 通して います");
    assert.strictEqual(m.hhmm(545), "9:05");
    assert.strictEqual(m.lengthWord({ start_min: 540, end_min: 630 }), "90分");
  });

  見る("★入れて よい コマか（★押す 前に 止める）", () => {
    assert.strictEqual(m.periodOk({ name: "2限", start: "9:00", end: "10:30" }), true);
    assert.strictEqual(m.periodOk({ name: "", start: "9:00", end: "10:30" }), false);
    assert.strictEqual(m.periodOk({ name: "2限", start: "10:30", end: "9:00" }), false);
    assert.ok(m.whyPeriodBad({ name: "2限", start: "10:30", end: "9:00" }).includes("あとに"),
      "★わけが ちがいます");
    assert.ok(/disabled=\{busy \|\| !periodOk/.test(ui), "★押せない ように して いません");
  });

  見る("⑤見やすさは その 端末 だけ", () => {
    assert.ok(/あなたの 端末だけ/.test(見), "★その 1行が ありません");
    assert.ok(/画面の 大きさは 変わりません/.test(見), "★何が 変わるかを 書いて いません");
    // ★★書く 道は 個人の 画面と 同じ もの（★2つ 作らない）。
    assert.ok(/handleSaveDisplayPref\(\{ display_scale: s \}\)/.test(vt),
      "★同じ 道を 使って いません");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
