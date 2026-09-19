#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★学校の 形（★見本 `stOrg`・裁定 その98 BLOCKER_1）
//
//   ★★守る こと
//     ★① 形を 列の 名に 埋め込まない（★`parent_id` で つなぐ）
//     ★② 使われて いる ものは 消せない
//     ★③ 下に ぶら下がる ものが あれば 消せない
//     ★④ 同じ 名を 2つ 作らない
//     ★⑤ 書けるのは 名簿の できこと だけ（★画面も 台帳も）
//     ★⑥ 並べ替えない
//
//   ★★★較正 ── ★わざと 当たる ものを 作り、★見つかる ことを 確かめます。
// ============================================================================

const assert = require("assert");
const { loadLib, readCode } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const D = await loadLib("lib", "orgDivisions.js");
  const 画面 = readCode("components", "OpsOrgShape.jsx");
  const 蔵 = readCode("components", "VocalTracker.jsx");

  const 形 = [
    { id: "f1", kind: "faculty", name: "音楽学部" },
    { id: "d1", kind: "department", name: "声楽", parent_id: "f1" },
    { id: "d2", kind: "department", name: "ピアノ", parent_id: "f1" },
    { id: "b1", kind: "field", name: "広報" }
  ];

  見る("道具の 較正", () => {
    assert.strictEqual(D.ofKind(形, "department").length, 2, "★道具が 壊れて います");
    assert.strictEqual(D.ofKind(形, "ありえない").length, 0, "★道具が 壊れて います");
  });

  見る("① 形は `parent_id` で つなぐ", () => {
    assert.strictEqual(D.parentNameOf(形, 形[1]), "音楽学部");
    assert.strictEqual(D.parentNameOf(形, 形[0]), "");
    const k = D.KINDS.find((x) => x.key === "department");
    assert.strictEqual(k.parent, "faculty", "★上に つく 種が ちがいます");
    assert.strictEqual(D.KINDS.find((x) => x.key === "field").parent, null);
  });

  見る("② 使われて いる ものは 消せない", () => {
    assert.ok(!D.mayDelete(形, 形[1], 1), "★使われて いるのに 消せます");
    assert.ok(D.mayDelete(形, 形[1], 0), "★誰も 使って いないのに 消せません");
    assert.ok(/人 います。消せません/.test(D.whyCannotDelete(形, 形[1], 3)),
      "★わけが 出ません");
  });

  見る("③ 下に ぶら下がる ものが あれば 消せない", () => {
    assert.ok(!D.mayDelete(形, 形[0], 0), "★学部を 消せて しまいます");
    assert.ok(/下に ぶら下がる/.test(D.whyCannotDelete(形, 形[0], 0)), "★わけが 出ません");
  });

  見る("④ 同じ 名を 2つ 作らない", () => {
    assert.ok(!D.mayAdd(形, "faculty", "音楽学部"), "★同じ 名が 足せます");
    assert.ok(D.mayAdd(形, "faculty", "大学院"), "★ちがう 名が 足せません");
    // ★★上が ちがえば、★同じ 名でも よい（れい：どちらの 学部にも「作曲」）。
    assert.ok(D.mayAdd(形, "department", "声楽", "f2"), "★上が ちがうのに 足せません");
    assert.ok(!D.mayAdd(形, "department", "声楽", "f1"), "★同じ 上で 同じ 名が 足せます");
    // ★★上が 要る 種で、★上が 無ければ 足せない。
    assert.ok(!D.mayAdd(形, "department", "作曲", null), "★上 無しで 足せます");
    assert.ok(/上の もの/.test(D.whyCannotAdd(形, "department", "作曲", null)),
      "★わけが 出ません");
    assert.ok(/名を お書き/.test(D.whyCannotAdd(形, "faculty", "  ", null)), "★空の わけ");
  });

  見る("⑤ 書けるのは 名簿の できこと だけ", () => {
    assert.ok(/mayEdit/.test(画面), "★画面が 門を 見て いません");
    assert.ok(!/"meibo"|'meibo'/.test(画面), "★画面が できことを 名ざしで 見て います");
    const i = 蔵.indexOf("<OpsOrgShape");
    assert.ok(i > 0, "★画面を 呼んで いません");
    const 枝 = 蔵.slice(i, 蔵.indexOf("/>", i));
    assert.ok(/mayEdit=\{canOps\(gate, "meibo"\)\}/.test(枝), "★門が ちがいます");
    assert.ok(/usedCount=/.test(枝), "★使われて いる 数を 渡して いません");
  });

  見る("⑥ 並べ替えない", () => {
    const もと = readCode("lib", "orgDivisions.js");
    assert.ok(!/\.sort\(/.test(もと), "★もとに 並べ替えが あります");
    assert.ok(!/\.sort\(/.test(画面), "★画面に 並べ替えが あります");
  });

  見る("★学年は ここに 無い、と 書いて ある", () => {
    assert.ok(/学年/.test(D.GRADE_NOT_HERE), "★学年の 断りが ありません");
    assert.ok(!D.KINDS.some((k) => k.key === "grade"), "★学年の 種が あります");
    assert.ok(/GRADE_NOT_HERE/.test(画面), "★画面に 断りが ありません");
  });

  見る("★ひとりの 方の 形 ── ★学部は 学科から 出す", () => {
    const 人 = { user_id: "u1", division_id: "d1" };
    const 行 = D.shapeLineOf(形, 人);
    assert.strictEqual(行.faculty, "音楽学部", "★学部が 出ません");
    assert.strictEqual(行.department, "声楽");
    assert.strictEqual(行.field, "—", "★分野に 字が 入って います");
    // ★★事務の 方 ── ★分野 だけ。
    const 事務 = D.shapeLineOf(形, { user_id: "u2", division_id: "b1" });
    assert.strictEqual(事務.field, "広報");
    assert.strictEqual(事務.faculty, "—");
    // ★★決めて いない 方 ── ★3つ とも「—」。
    const 無 = D.shapeLineOf(形, { user_id: "u3" });
    assert.deepStrictEqual(無, { faculty: "—", department: "—", field: "—" });
  });

  見る("★選ばせるのは 学科と 分野 だけ（★学部は 選ばせない）", () => {
    const 選 = D.choosableFor(形).map((x) => x.kind);
    assert.ok(!選.includes("faculty"), "★学部を 選ばせて います");
    assert.deepStrictEqual(選.sort(), ["department", "department", "field"].sort());
    const 画 = readCode("components", "OpsPeople.jsx");
    assert.ok(/choosableFor/.test(画), "★画面が lib を 呼んで いません");
    assert.ok(/shapeLineOf/.test(画), "★3つの 行を 出して いません");
    assert.ok(!/"faculty"|'faculty'/.test(画), "★画面が 種を 名ざしで 見て います");
  });

  見る("★形は 1つ だけ 持つ（★2つに しない）", () => {
    const 蔵2 = readCode("components", "VocalTracker.jsx");
    const i = 蔵2.indexOf("async function handleSetDivision");
    const 手 = 蔵2.slice(i, i + 1200);
    assert.ok(/division_id: divisionId/.test(手), "★形を 書いて いません");
    assert.ok(!/faculty_id|department_id|field_id/.test(手), "★列を 分けて います");
    assert.ok(/data\.length === 0/.test(手), "★0行を 成功に して います");
  });

  見る("★消す 前に 1度 確かめる（★2026-09-19・実機の ご報告）", () => {
    // ★★★1度 押すと 消えて いました。★戻せません。
    //   ★★同じ ところが「もう一度 押すと 消えます」に 変わります。
    assert.ok(/もう一度 押すと 消えます/.test(画面), "★確かめが ありません");
    assert.ok(/消すと、戻せません/.test(画面), "★戻せない ことを 書いて いません");
    // ★★窓（confirm）は 使いません。★読まずに 押される ことが あります。
    assert.ok(!/window\.confirm/.test(画面), "★窓を 出して います");
    // ★★1度目で 消えない こと。
    assert.ok(/if \(!確かめ中\) \{ set消す\(r\.id\); return; \}/.test(画面),
      "★1度目で 消えます");
  });

  見る("★0行を 成功に しない", () => {
    const i = 蔵.indexOf("async function handleAddDivision");
    const 手 = 蔵.slice(i, i + 1200);
    assert.ok(/data\.length === 0/.test(手), "★0行を 成功に して います");
    const j = 蔵.indexOf("async function handleRemoveDivision");
    assert.ok(/data\.length === 0/.test(蔵.slice(j, j + 1000)), "★消すほうも");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
