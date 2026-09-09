// ============================================================================
// はじめの 問い合わせを 減らす（2026-09-09・案A／案B）
//
//   ★★もとは、★おうち画面を 開くまでに 19回、★1つずつ 順に 引いていました。
//     ★profiles だけで 10回。★うち 6回は 1〜2列の 読みです。
//     ★1回 170ms として、★約3.2秒。
//
//   ★★守ること
//     ・★列が 揃っていれば、★1回で 読むこと（★案B）
//     ・★列が 無い環境では、★これまでどおり 組ごとに 読み直すこと
//     ・★互いに 待つ理由の 無いものは、★同時に 走らせること（★案A）
//     ・★1つ 失敗しても、★ほかは 進むこと
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  const src = fs.readFileSync(path.join(ROOT, "lib", "profileExtras.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ ★組");
  ok("★7つの組", Object.keys(m.EXTRA_GROUPS).length === 7);
  ok("★列は 10", m.allExtraColumns().length === 10, String(m.allExtraColumns().length));
  ok("★同じ列を 2度 数えていない",
    new Set(m.allExtraColumns()).size === m.allExtraColumns().length);

  console.log("■ ★① 列が 揃っていれば、1回で");
  {
    let calls = 0;
    const fake = { from: () => ({ select: () => ({ eq: () => ({
      maybeSingle: async () => { calls += 1; return { data: {
        record_mode: "simple", deleted_at: null, cycle_show_on_home: true,
        is_under_18: false, age_question_shown_at: null,
        cohort: "a", is_internal: false, is_tester: true,
        allergies: [], regular_medications: []
      }, error: null }; }
    }) }) }) };
    const r = await m.readProfileExtras(fake, "u1");
    ok("★★1回で 済んでいる", calls === 1, `${calls} 回`);
    ok("★まとめた、と 返す", r.merged === true);
    ok("★組ごとに 切り分けている",
      r.rows.mode.record_mode === "simple" && r.rows.tester.is_tester === true
      && r.rows.health.allergies.length === 0);
    ok("★誤りは 無い", Object.values(r.errors).every((e) => e === null));
  }

  console.log("■ ★② 列が 無ければ、組ごとに 読み直す");
  {
    let calls = 0;
    const fake = { from: () => ({ select: (cols) => ({ eq: () => ({
      maybeSingle: async () => {
        calls += 1;
        // ★★1回目（まとめて）は 失敗させます。
        if (cols.includes("record_mode") && cols.includes("is_tester")) {
          return { data: null, error: { code: "42703", message: "does not exist" } };
        }
        // ★★1つの組だけ、★まだ 無いことに します。
        if (cols.includes("is_tester")) {
          return { data: null, error: { code: "42703", message: "does not exist" } };
        }
        return { data: { ok: 1 }, error: null };
      }
    }) }) }) };
    const r = await m.readProfileExtras(fake, "u1");
    ok("★まとめられなかった、と 返す", r.merged === false);
    ok("★★組ごとに 読み直している（1 ＋ 7 ＝ 8回）", calls === 8, `${calls} 回`);
    // ★★1つ 失敗しても、★ほかは 進むこと。
    ok("★★読めた組は 読めている", r.rows.mode !== null && r.rows.health !== null);
    ok("★読めなかった組は null", r.rows.tester === null && r.errors.tester !== null);
  }

  console.log("■ ★案A ── 同時に 走らせる");
  const vt = readCode("components", "VocalTracker.jsx");
  ok("★同時に 走らせている", /const \[noticeRes, perfRes, resultRes, markerRes, inventoryRes\] = await Promise\.all\(\[/.test(vt));
  // ★★見るのは「はじめの読み込み」の ところだけです。
  //   ★★ほかの場所（★あとから 押したときの 読み書き）は、★順で かまいません。
  //   ★全体を 見ると、★関わりのない所で 落ちます。
  const startAt = vt.indexOf("PROFILE_BASE_COLUMNS");
  const endAt = vt.indexOf("setProfileLoading(false)", startAt);
  const boot = vt.slice(startAt, endAt > 0 ? endAt : startAt + 12000);
  // ★★1つずつ 順に 待つ形が、★はじめの読み込みに 残っていないこと。
  for (const t of ["user_notices", "performances", "performance_results",
                   "period_markers", "character_inventory"]) {
    ok(`★${t} を、順に 待っていない`,
      !new RegExp(`await supabase\\s*\\n?\\s*\\.from\\("${t}"\\)`).test(boot));
  }
  console.log("■ ★案B ── 1回で 読む");
  ok("★lib を 使っている", /await readProfileExtras\(supabase, userId\)/.test(vt));
  for (const g of ["mode", "deleted", "cycle", "age", "cohort", "tester", "health"]) {
    ok(`★${g} を lib から 受け取っている`, new RegExp(`extras\\.rows\\.${g}`).test(vt));
  }
  // ★★1〜2列の 読みが、★残っていないこと。
  ok("★★1〜2列の 読みが 残っていない",
    !/\.from\("profiles"\)\.select\("record_mode"\)/.test(vt)
    && !/\.from\("profiles"\)\.select\("is_tester"\)/.test(vt)
    && !/\.from\("profiles"\)\.select\("cohort, is_internal"\)/.test(vt));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
