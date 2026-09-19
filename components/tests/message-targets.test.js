#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★お知らせの 宛先（★見本 `P_write`・2026-09-19）
//
//   ★★守る こと
//     ★① 空＝しぼらない。★`null` を 入れない（★裁定 その89 と 同じ 形）
//     ★② 届く 人数を いつも 出す。★0人では 出せない
//     ★③ 休会・退会の 方には 届かない
//     ★④ 台帳の 決まりも 宛先を 見る（★画面だけ では 守れません）
//     ★⑤ 学部を 選ばせない（★学科の 上に つないで ある）
//
//   ★★★較正 ── ★わざと 当たる ものを 作り、★見つかる ことを 確かめます。
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadLib, readCode } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

const ROOT = path.join(__dirname, "..", "..");
const SQL = path.join(ROOT, "supabase", "migration_message_targets.sql");
if (!fs.existsSync(SQL)) {
  console.log("★★ありません: supabase/migration_message_targets.sql");
  console.log("　★数えません。★止まります。");
  process.exit(1);
}
const 素 = fs.readFileSync(SQL, "utf8")
  .split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");

(async () => {
  const R = await loadLib("lib", "renraku.js");
  const 画面 = readCode("components", "AnnouncementCompose.jsx");
  const 蔵 = readCode("components", "VocalTracker.jsx");

  const 名簿 = [
    { user_id: "a", division_id: "d1", grade_year: 1, counted: true },
    { user_id: "b", division_id: "d2", grade_year: 2, counted: true },
    { user_id: "c", division_id: "d1", grade_year: 2, counted: true },
    { user_id: "x", division_id: "d1", grade_year: 1, counted: false }
  ];

  見る("道具の 較正", () => {
    assert.strictEqual(R.reachOf(名簿, { divisionIds: ["d1"] }).length, 2,
      "★道具が 壊れて います");
    assert.strictEqual(R.reachOf(名簿, { divisionIds: ["ありえない"] }).length, 0,
      "★道具が 壊れて います");
  });

  見る("① 空＝しぼらない", () => {
    assert.ok(R.isWholeSchool(R.EMPTY_TARGET), "★空が しぼって います");
    assert.ok(R.isWholeSchool(null), "★何も 無い ときが しぼって います");
    assert.ok(!R.isWholeSchool({ gradeYears: [1] }), "★しぼって いるのに 全員 です");
    // ★★台帳の 既定も 空の 配列 です。
    assert.ok(/default '\{\}'/.test(素), "★既定が 空の 配列で ありません");
    assert.ok(!/target_[a-z_]+ [a-z\[\]]+ (null|default null)/.test(素),
      "★`null` を 既定に して います");
    // ★★画面も `null` を 入れません。
    const i = 蔵.indexOf("async function handlePostRenraku");
    const 手 = 蔵.slice(i, i + 1400);
    assert.ok(/target_division_ids: 宛\.divisionIds \|\| \[\]/.test(手),
      "★空の 配列に して いません");
  });

  見る("② 0人では 出せない", () => {
    assert.ok(!R.mayPostAnnouncement(0, "ほんぶん"), "★0人で 出せます");
    assert.ok(!R.mayPostAnnouncement(3, "   "), "★空の 本文で 出せます");
    assert.ok(R.mayPostAnnouncement(3, "ほんぶん"), "★出せる はずが 出せません");
    assert.ok(/誰にも 届きません/.test(R.reachWord(0)), "★0人の 字が ちがいます");
    assert.ok(/3人に 届きます/.test(R.reachWord(3)), "★人数の 字が ちがいます");
    assert.ok(/mayPostAnnouncement/.test(画面), "★画面が 判じて います");
  });

  見る("③ 休会・退会の 方には 届かない", () => {
    // ★★`counted: false` の 方は、★どの しぼり方でも 出ません。
    assert.ok(!R.reachOf(名簿, R.EMPTY_TARGET).includes("x"), "★届いて います");
    assert.ok(!R.reachOf(名簿, { divisionIds: ["d1"] }).includes("x"), "★届いて います");
    assert.ok(!R.reachOf(名簿, { userIds: ["x"] }).includes("x"),
      "★名ざしでも 届いて います");
    assert.ok(/counted: \(e\.status \|\| "active"\) === "active"/.test(蔵),
      "★蔵が ようすを 見て いません");
  });

  見る("④ 台帳の 決まりも 宛先を 見る", () => {
    const 決 = 素.slice(素.indexOf("create policy org_messages_select"));
    assert.ok(/cardinality\(org_messages\.target_division_ids\) = 0/.test(決),
      "★空の ときの 枝が ありません");
    assert.ok(/auth\.uid\(\) = any \(org_messages\.target_user_ids\)/.test(決),
      "★名ざしの 枝が ありません");
    assert.ok(/e\.division_id = any \(org_messages\.target_division_ids\)/.test(決),
      "★学科の 枝が ありません");
    assert.ok(/e\.grade_year = any \(org_messages\.target_grade_years\)/.test(決),
      "★学年の 枝が ありません");
    // ★★運営と 事故の ときの 枝は 残って いる こと。
    assert.ok(/has_can\(org_id, 'renraku_all'\)/.test(決), "★運営の 枝が 消えました");
    assert.ok(/has_can\(org_id, 'monka_read'\)/.test(決), "★事故の ときの 枝が 消えました");
    // ★★いま 在る 方 だけ を 見る こと。
    assert.ok(/e\.status = 'active'/.test(決), "★やめた 方にも 届きます");
  });

  見る("⑤ 学部を 選ばせない", () => {
    assert.ok(/choosableFor\(divisions\)/.test(画面), "★lib を 通して いません");
    assert.ok(!/kind === "faculty"/.test(画面), "★画面が 学部を 見て います");
  });

  見る("★どれか 1つでも 当てはまれば 届く（★狭めすぎない）", () => {
    // ★★「学科 かつ 学年」では ありません。★or です。
    const 出 = R.reachOf(名簿, { divisionIds: ["d2"], gradeYears: [1] });
    assert.deepStrictEqual(出.sort(), ["a", "b"], "★and に なって います");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
