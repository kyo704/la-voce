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
    // ★★★見本に 合わせて 並びが 増えました（★2026-09-20・第7版）。
    //   ★★「消えない もの」は 別の 一覧に なりました（`WITHDRAW_KEPT`）。
    assert.strictEqual(m.WITHDRAW_KEPT.length, 5, "★消えない ものが 5つ ありません");
    ["声の 記録", "ノート", "ひつじ"].forEach((w) =>
      assert.ok(m.WITHDRAW_KEPT.includes(w), "★" + w + " が ありません"));
    assert.ok(m.WITHDRAW_KEPT_LINE.includes("消えません"),
      "★消えない ことを 書いて いません");
    assert.strictEqual(m.WITHDRAW_GONE.length, 3, "★消える ものが 3つ ありません");
    const 字 = m.WITHDRAW_NOTES.join("");
    assert.ok(字.includes("記録として 残ります"), "★残る ことを 書いて いません");
    assert.ok(字.includes("聞き直しません"), "★聞き直さない ことを 書いて いません");
  });

  見る("★保護者に 記録を 見せない", () => {
    // ★★見本の 字に 合わせました（★2026-09-20）──「からだの こと」。
    ["声の 記録", "からだの こと", "ノート", "レパートリー", "ひつじ"].forEach((w) =>
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

  const vt = readRaw("components", "VocalTracker.jsx");
  const req = readRaw("app", "api", "guardian", "request", "route.js");
  const acc = readRaw("app", "api", "guardian", "accept", "route.js");
  const 保 = readRaw("app", "guardian", "[token]", "page.js");
  const ask = readRaw("components", "GuardianAsk.jsx");
  const enr = readRaw("app", "api", "enrollment", "accept", "route.js");

  見る("Q1 ★学校に 入る 道が 止まる", () => {
    assert.ok(/has_guardian_consent/.test(enr), "★在籍の 道が 見て いません");
    assert.ok(/guardian_consent_required/.test(enr), "★わけを 返して いません");
    // ★★止めるのは 在籍の 手前 で ある こと。
    const i = enr.indexOf("has_guardian_consent");
    const j = enr.indexOf('.from("enrollments")');
    assert.ok(i > 0 && j > i, "★在籍を 作った あとで 見て います");
  });

  見る("★合言葉を 画面に 返さない", () => {
    // ★★★`lib/tokens`（色の 名）は 別 です（★2026-09-20・道具が 鳴りました）。
    //   ★★合言葉の `token` だけ を 見ます。
    assert.ok(!/\btoken\b(?!s)/.test(ask.replace(/@\/lib\/tokens/g, "")),
      "★画面が 合言葉を 触って います");
    assert.ok(/return NextResponse\.json\(\{ ok: true, sent \}\)/.test(req),
      "★合言葉を 返して います");
  });

  見る("★通らない ときの 答えを 分けない", () => {
    assert.ok(/FAILED_LINE/.test(acc), "★1つの 字に して いません");
    // ★★番（status）も 同じ に する こと。
    assert.ok(!/status: 40[13]/.test(acc), "★番で 分けて います");
  });

  見る("★保護者の 画面に 記録を 出さない", () => {
    ["声の 記録", "体調", "ノート"].forEach((w) => {
      // ★★出て よいのは「見えない もの」の 一覧 だけ です。
      const 回 = (保.match(new RegExp(w, "g")) || []).length;
      assert.ok(回 <= 1, "★" + w + " を いくつも 出して います");
    });
    assert.ok(/SCHOOL_NEVER_SEES/.test(保), "★見えない ものの 一覧が ありません");
    assert.ok(!/entries|my_timetable/.test(保), "★記録の 表に 触って います");
  });

  見る("★催促しない（★閉じる ところが ある）", () => {
    assert.ok(/onClose/.test(ask), "★閉じられません");
    assert.ok(/setGuardianAsk\(null\)/.test(vt), "★閉じても 残ります");
    // ★★こちらから 2度 出さない こと（★出すのは 在籍が 断られた ときだけ）。
    assert.strictEqual((vt.match(/setGuardianAsk\(\{/g) || []).length, 1,
      "★いくつもの ところから 出して います");
  });

  const wd = readRaw("app", "api", "guardian", "withdraw", "route.js");
  const wui = readRaw("components", "GuardianWithdraw.jsx");

  見る("★取り消し ── ★3つを 1つの 道で", () => {
    assert.ok(/withdraw_guardian_consent/.test(wd), "★印を 付けて いません");
    assert.ok(/leave_enrollment/.test(wd), "★学校から 出て いません");
    assert.ok(/WITHDRAW_MAIL_SUBJECT/.test(wd), "★お知らせを 送って いません");
    // ★★順 ── ★印 → 出る → お知らせ。
    assert.ok(wd.indexOf("withdraw_guardian_consent") < wd.indexOf("leave_enrollment"),
      "★順が ちがいます");
  });

  見る("★取り消しても 記録に 触らない（★道）", () => {
    ["entries", "notes", "repertoire", "my_timetable"].forEach((w) =>
      assert.ok(!new RegExp('from\\("' + w + '"').test(wd), "★" + w + " に 触って います"));
    assert.ok(!/\.delete\(/.test(wd), "★消して います");
  });

  見る("★取り消しの 画面に 両方 並べる", () => {
    assert.ok(/WITHDRAW_GONE/.test(wui), "★消える ものが ありません");
    assert.ok(/WITHDRAW_KEPT/.test(wui), "★消えない ものが ありません");
    assert.ok(/WITHDRAW_CANCEL/.test(wui), "★やめる ところが ありません");
  });

  見る("★取り消しは 15〜17歳 だけ に 出す", () => {
    assert.ok(/needsGuardianConsent\(profile\)/.test(vt),
      "★誰にでも 出して います／判じて いません");
  });

  見る("★保護者の 画面に「いまは やめて おく」が ある", () => {
    assert.ok(/GUARDIAN_LATER/.test(保), "★その 札が ありません");
    assert.strictEqual(m.GUARDIAN_NOTES.length, 3, "★断りが 3つ ありません");
    assert.ok(m.GUARDIAN_NOTES.join("").includes("7日で 切れます"),
      "★期限を 書いて いません");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
