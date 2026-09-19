#!/usr/bin/env node
// ============================================================================
// ★保護者の 同意（★裁定 その107）の 見張り
//
//   ★★★裁定の VERIFY を、★そのまま 確かめます。
//     Q1 同意が 無い 状態で `enrollments` が 1行も 作られない
//     Q2 同意が 無くても、★個人で 使う ぶんは ぜんぶ 使える
//     Q3 事務・先生が `guardian_consents` を 1行も 引けない
//     Q4 合言葉が 7日で 切れる
//     Q5 1度 使った 合言葉が 使えない
//     Q6 取り消しても `entries` / `notes` が 1行も 消えない
//
//   ★★較正 ── ★在る ものと 無い ものの 両方で 試します。
// ============================================================================

const assert = require("assert");
const { readRaw, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "guardianConsent.js");
  const sql = readRaw("supabase", "migration_guardian_consent.sql");
  const 本文 = sql.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");

  見る("較正 ── ★読めて いる", () => {
    assert.strictEqual(typeof m.mayJoinSchool, "function");
    assert.ok(本文.includes("create table if not exists public.guardian_consents"));
  });

  見る("★同意が 要るのは 15〜17歳 だけ", () => {
    assert.strictEqual(m.needsGuardianConsent({ age_band: "teen" }), true);
    assert.strictEqual(m.needsGuardianConsent({ age_band: "adult" }), false);
    assert.strictEqual(m.needsGuardianConsent({ age_band: "under15" }), false);
  });

  見る("Q1 ★同意が 無ければ 学校に 入れない", () => {
    assert.strictEqual(m.mayJoinSchool({ age_band: "teen" }, { hasConsent: false }), false);
    assert.strictEqual(m.mayJoinSchool({ age_band: "teen" }, { hasConsent: true }), true);
    // ★★帯が 分からない 方も 入れません（★安全な 側）。
    assert.strictEqual(m.mayJoinSchool({}, { hasConsent: true }), false);
    // ★★18歳以上は そのまま 入れます。
    assert.strictEqual(m.mayJoinSchool({ age_band: "adult" }, {}), true);
  });

  見る("Q2 ★止まるのは 学校に 入る ことだけ", () => {
    const 字 = m.NOT_BLOCKED_LINES.join("");
    ["記録", "ノート", "レパートリー", "羊", "しらべる"].forEach((w) =>
      assert.ok(字.includes(w), "★" + w + " が 書かれて いません"));
    assert.ok(字.includes("学校に 入る こと"), "★止まる ところを 書いて いません");
  });

  見る("Q3 ★事務・先生は 1行も 引けない", () => {
    assert.ok(/enable row level security/.test(本文), "★決まりが 効いて いません");
    assert.ok(/auth\.uid\(\) = user_id/.test(本文), "★ご本人だけ に なって いません");
    assert.strictEqual((本文.match(/create policy/g) || []).length, 1,
      "★決まりが 2つ 以上 あります");
    assert.ok(!/has_can|teacher_id = auth/.test(本文.split("create policy")[1] || ""),
      "★学校の 方に 道を 作って います");
    assert.ok(/revoke all on table public\.guardian_consents from authenticated/.test(本文),
      "★取り上げて いません");
  });

  見る("Q4 ★7日で 切れる", () => {
    assert.ok(/interval '7 days'/.test(本文), "★期限が ありません");
    assert.ok(/expires_at > now\(\)/.test(本文), "★期限を 見て いません");
  });

  見る("Q5 ★1度 使ったら 終わり", () => {
    assert.ok(/consented_at is null/.test(本文), "★済んだ ものを 弾いて いません");
    assert.ok(/token text not null unique/.test(本文), "★合言葉が 重なれます");
    // ★★合言葉は 台帳で 作ります（★画面で 作りません）。
    assert.ok(/gen_random_bytes\(32\)/.test(本文), "★合言葉が 短い／画面で 作って います");
  });

  見る("Q6 ★取り消しても 記録は 消えない", () => {
    const i = 本文.indexOf("withdraw_guardian_consent");
    const なか = 本文.slice(i, i + 1200);
    assert.ok(!/delete from/.test(なか), "★消して います");
    assert.ok(!/entries|notes|repertoire/.test(なか), "★記録に 触って います");
    assert.ok(/withdrawn_at = now\(\)/.test(なか), "★印を 付けて いません");
    const 字 = m.WITHDRAW_NOTES.join("");
    assert.ok(字.includes("消えません"), "★消えない ことを 書いて いません");
  });

  見る("★保護者に 記録を 見せない", () => {
    ["声の 記録", "からだの 記録", "ノート", "レパートリー"].forEach((w) =>
      assert.ok(m.GUARDIAN_NEVER_SEES.includes(w), "★" + w + " が ありません"));
    // ★★見える ものに 記録が 混ざって いない こと。
    assert.ok(!m.GUARDIAN_SEES.join("").includes("記録"), "★記録を 見せて います");
  });

  見る("★メールの 字（★1度きり・記録は 見えない）", () => {
    const 行 = m.mailLines({ studentName: "み", orgName: "お", teacherName: "せ", url: "u" });
    const 字 = 行.join("\n");
    assert.ok(字.includes("1度きり"), "★1度きりと 書いて いません");
    assert.ok(字.includes("保護者の 方にも 見えません"), "★見えない ことを 書いて いません");
    assert.ok(字.includes("学校に 見えない もの"), "★見えない ものの 一覧が ありません");
    assert.ok(字.includes("u"), "★押す ところが ありません");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
