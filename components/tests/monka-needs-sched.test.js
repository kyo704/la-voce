// ============================================================================
// ★見張り ── ★「門下」だけ の 役職を 作らない（★台帳 08-12・2026-09-19）
//
//   ★★★2026-09-19 に 台帳へ 尋ねて 分かった こと。
//     ★★`lessons` を 読む 決まりは、★`teacher_id = auth.uid()` の 枝に
//       ★`sched_mine` を **併せて** 求めます。
//     ★★だから `monka_write` だけ の 役職は、★ご自分の 門下の コマすら
//       ★1行も 読めません。★誤りは 出ません。★0 と 出る だけ です。
//
//   ★★★この 見張りは **数え直します**。★測った 数を 写しません。
//     ★★備えの 役職を 書き換えた 日に、★ここが 止まります。
//
//   ★下に「わざと 外した もの」を 1つ 置きます（★道具の 較正）。
// ============================================================================

const assert = require("assert");
const { loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const P = await loadLib("lib/opsPerms.js");

  // ★★★較正 ── ★わざと 1つ 該当させて、★道具が 見つける ことを 確かめます。
  見る("道具の 較正 ── ★わざと 外した 役職を 見つけられる", () => {
    const 偽 = [{ name: "★ためし", perms: ["monka_write", "shukketsu"] }];
    const 見つけた = 偽.filter((r) =>
      r.perms.includes("monka_write")
      && !r.perms.includes("sched_mine")
      && !r.perms.includes("sched_all"));
    assert.strictEqual(見つけた.length, 1, "★道具が 壊れて います");
  });

  見る("備えの 役職 ── ★門下を 持つ なら 日程も 持つ", () => {
    const 備え = P.TEMPLATE_POSTS;
    assert.ok(Array.isArray(備え) && 備え.length > 0, "★備えの 役職が 読めません");
    const 悪い = 備え.filter((r) => {
      const a = r.perms || [];
      return a.includes("monka_write")
        && !a.includes("sched_mine") && !a.includes("sched_all");
    });
    assert.deepStrictEqual(悪い.map((r) => r.name), [],
      "★門下だけ の 役職が あります。★出席が 静かに 0 に なります（★台帳 08-12）");
  });

  見る("できことの 札が 揃って いる", () => {
    for (const k of ["monka_write", "sched_mine", "sched_all"]) {
      assert.ok(P.PERM_KEYS.includes(k), "★できことが ありません: " + k);
    }
  });

  見る("引き金の 覚え書きが、★その 行の すぐ 上に ある", () => {
    const { readRaw } = require("./_source");
    const 生 = readRaw("lib/opsPerms.js").split("\n");
    const i = 生.findIndex((l) => l.includes('key: "monka_write"'));
    assert.ok(i > 0, "★`monka_write` の 行が ありません");
    const 上 = 生.slice(Math.max(0, i - 12), i).join("\n");
    assert.ok(上.includes("08-12"), "★台帳の 番号が 書いて ありません");
    assert.ok(上.includes("静かに 0"), "★何が 起きるかが 書いて ありません");
  });

  見る("台帳に 08-12 が ある", () => {
    const { readRaw } = require("./_source");
    const 台 = readRaw("docs/ledgers/08-保留している決め.md");
    assert.ok(台.includes("## 08-12"), "★台帳に 08-12 が ありません");
    assert.ok(台.includes("引き金"), "★引き金が 書いて ありません");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
