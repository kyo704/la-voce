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

  見る("★0行を 成功に しない", () => {
    const i = 蔵.indexOf("async function handleAddDivision");
    const 手 = 蔵.slice(i, i + 1200);
    assert.ok(/data\.length === 0/.test(手), "★0行を 成功に して います");
    const j = 蔵.indexOf("async function handleRemoveDivision");
    assert.ok(/data\.length === 0/.test(蔵.slice(j, j + 1000)), "★消すほうも");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
