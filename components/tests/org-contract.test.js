#!/usr/bin/env node
// ============================================================================
// ★契約者（★裁定 その115 Q2 ／ その116）の 見張り
//
//   ★★確かめる こと
//     Q1 契約者は、★引き継いで からでないと 退会できない
//     Q2 `master` を 持たない 方には 引き継げない
//     Q3 引き継ぎは 1度で 移る（★承諾を 待たない）
//     Q4 移された 方に 1行 出る
//     Q5 移した 記録は 消せない
//     Q6 学校を 閉じた あとは 退会できる
//     ★できことに して いない（★DO_NOT）
//
//   ★★較正 ── ★当たる 例と、★当たらない 例で 試します。
// ============================================================================

const assert = require("assert");
const { readRaw, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "orgContract.js");
  const 紙 = readRaw("supabase", "migration_contract_owner.sql");
  const 無註 = 紙.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");

  見る("Q1 契約者は、★引き継ぐ まで 退会できない", () => {
    const 私 = "u1";
    const 学校 = [{ id: "o1", contract_owner_user_id: 私 }];
    const r = m.mayLeave({ orgs: 学校, userId: 私 });
    assert.strictEqual(r.ok, false);
    assert.strictEqual(r.blocked.length, 1);
    assert.ok(m.LEAVE_BLOCKED.includes("引き継いで"), "★言い方が ちがいます");
    assert.ok(m.LEAVE_BLOCKED_HOW.includes("契約者を 変える"), "★行き先を 示して いません");
    // ★★較正 ── ★契約者で なければ 止めません。
    assert.strictEqual(m.mayLeave({ orgs: 学校, userId: "u2" }).ok, true);
  });

  見る("Q2 `master` を 持たない 方には 引き継げない", () => {
    const 面々 = [{ user_id: "a" }, { user_id: "b" }, { user_id: "me" }];
    const 権 = (mm) => ({ a: ["master", "meibo"], b: ["meibo"], me: ["master"] }[mm.user_id]);
    const 候 = m.candidates(面々, 権, "me").map((x) => x.user_id);
    assert.deepStrictEqual(候, ["a"], "★候補が ちがいます: " + 候.join(","));
    // ★★台帳の 側でも 止めて いる こと。
    assert.ok(/has_can_user\(p_to_user_id, p_org_id, 'master'\)/.test(無註),
      "★台帳で 見て いません");
    assert.ok(/NO_MASTER/.test(無註), "★わけを 返して いません");
  });

  見る("Q3 1度で 移る（★承諾を 待たない）", () => {
    // ★★承諾を しまう 列が 無い こと。
    assert.ok(!/accepted|承諾|pending/.test(無註), "★承諾を 待って います");
    assert.ok(/update organizations[\s\S]{0,120}contract_owner_user_id = p_to_user_id/.test(無註),
      "★その場で 移して いません");
  });

  見る("Q4 移された 方に 1行 出る", () => {
    assert.ok(/insert into user_notices/.test(無註), "★お伝えして いません");
    assert.ok(/'contract_owner:'/.test(無註), "★鍵が ちがいます");
    assert.strictEqual(m.NOTICE_KEY, "contract_owner:");
    assert.ok(m.noticeLine("たろう").includes("引き継ぎました"), "★字が ちがいます");
    // ★★学校ごとに 1度（★鍵に 学校の 番号が 入る）。
    assert.ok(/p_org_id::text/.test(無註), "★学校ごとに なって いません");
  });

  見る("Q5 移した 記録は 消せない", () => {
    assert.ok(/revoke all on table public\.contract_owner_log[^\n]*from public, anon, authenticated/
      .test(無註), "★先に 取り上げて いません");
    const g = /grant ([^\n]+) on table public\.contract_owner_log to authenticated/.exec(無註);
    assert.ok(g, "★渡して いません");
    assert.ok(!/update|delete|insert/.test(g[1]), "★消せます: " + g[1]);
  });

  見る("Q6 閉じた あとは 退会できる", () => {
    // ★★★閉じた 学校は、★行ごと 消えます（★2026-09-20・試しの 台帳で 実測）。
    //   ★★`CLOSE_ORG_DELETE_ORDER` の 最後が `organizations` の 行 です。
    //   ★★だから「並びに 無い」＝「閉じた」です。★印は 立てません。
    assert.strictEqual(m.mayLeave({ orgs: [], userId: "u1" }).ok, true);
    // ★★較正 ── ★残って いれば 止まる こと。
    assert.strictEqual(
      m.mayLeave({ orgs: [{ id: "o1", contract_owner_user_id: "u1" }], userId: "u1" }).ok,
      false);
    // ★★`closed_at` を 見て いない こと（★2つの 道を 作らない）。
    const 生 = readRaw("lib", "orgContract.js");
    assert.ok(!/o\.closed_at/.test(生), "★印を 見て います（★道が 2つ に なります）");
  });

  見る("★できことに して いない（★DO_NOT）", () => {
    const perms = readRaw("lib", "opsPerms.js");
    assert.ok(!/"owner"|'owner'/.test(perms.split("export const PERMS")[1].split("]")[0]),
      "★できことの 一覧に `owner` が あります");
    assert.ok(!/has_can\([^)]*'owner'\)/.test(無註), "★できことの 形に して います");
    assert.ok(m.WHY_NOT_A_PERM.why.includes("渡せない"), "★わけを 書いて いません");
    const 台帳 = readRaw("docs/ledgers", "08-保留している決め.md");
    assert.ok(/08-30/.test(台帳), "★台帳に 書いて いません");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
