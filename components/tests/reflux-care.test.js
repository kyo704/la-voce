// ============================================================================
// 寝るときの姿勢と、締めつけ（2026-09-08）
//
//   ★出どころ docs/opus/woolsong-仕様-分析機能の全体（9月7日・夜）§5-2
//            docs/lavoce-食事と就寝の設計.md §13-1・§14
//
//   ★★これは要配慮個人情報です。★守ることは5つ。
//     ・★既定オフ。★同意が無ければ、記録させない
//     ・★オンにする前に、専用の同意画面
//     ・★先生からは完全に隔離
//     ・★病名を、画面のどこにも書かない
//     ・★閾値・判定・色分けを、付けない
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
  const src = fs.readFileSync(path.join(ROOT, "lib", "refluxCare.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ 聞くのは3つだけ");
  ok("寝る向きは5つ（覚えていない を含む）", m.SLEEP_SIDES.length === 5);
  ok("★「覚えていない」がある", m.SLEEP_SIDES.some((s) => s.key === "unknown"));
  ok("頭の側は3つ", m.HEAD_RAISED.length === 3);
  ok("締めつけは3つ", m.BELLY_TIGHT.length === 3);
  // ★★高さ（cm）も、点数も、聞かないこと（§14-4・§14-5）。
  //   ★★見るのは「出す言葉」だけです。★注釈は見ません。
  //     ★2026-09-08、★「高さ（cm）を聞きません」という自分の説明文で
  //     ★落ちました。★今日5度目の、同じ罠です。
  const allLabels = [...m.SLEEP_SIDES, ...m.HEAD_RAISED, ...m.BELLY_TIGHT]
    .map((x) => x.label).join(" ");
  ok("★高さや点数を聞いていない", !/cm|センチ|点数|段階|[0-9０-９]/.test(allLabels), allLabels);

  console.log("■ ★同意が無ければ、記録させない（§13-1）");
  const input = { sleepSide: "left", headRaised: "yes", bellyTight: "no" };
  const off = m.sanitize(input, false);
  ok("★同意が無ければ、3つとも空",
    off.sleepSide === null && off.headRaised === null && off.bellyTight === null);
  const on = m.sanitize(input, true);
  ok("同意があれば、入る", on.sleepSide === "left" && on.headRaised === "yes");
  // ★★知らない値は、落とすこと。★画面から何が来ても、ここで揃えます。
  const junk = m.sanitize({ sleepSide: "ななめ", headRaised: "たぶん" }, true);
  ok("★知らない値は、落とす", junk.sleepSide === null && junk.headRaised === null);

  console.log("■ 行に書く形");
  const row = m.toRow(input, true);
  ok("列の名前で返る", "sleep_side" in row && "head_raised" in row && "belly_tight" in row);
  const rowOff = m.toRow(input, false);
  ok("★同意が無ければ、3つとも null",
    rowOff.sleep_side === null && rowOff.head_raised === null && rowOff.belly_tight === null);

  console.log("■ ★既定オフ（門は profile の日時）");
  ok("何も無ければ、オフ", m.refluxCareOn(null) === false && m.refluxCareOn({}) === false);
  ok("日時があれば、オン", m.refluxCareOn({ reflux_care_consent_at: "2026-09-08T00:00:00Z" }) === true);
  ok("撤回（null）で、オフ", m.refluxCareOn({ reflux_care_consent_at: null }) === false);

  console.log("■ ★先生には、渡さない（§14-9）");
  const share = fs.readFileSync(path.join(ROOT, "lib", "shareScope.js"), "utf-8");
  for (const col of m.REFLUX_CARE_COLUMNS) {
    ok(`「${col}」が、先生に渡さない一覧にある`, new RegExp(`"${col}"`).test(share));
  }
  ok("「meal_marks」も、渡さない", /"meal_marks"/.test(share));
  // ★★先生に渡す RPC が、★列を並べていないこと。
  const rpc = fs.readFileSync(path.join(ROOT, "supabase", "migration_teacher_student_entries_rpc.sql"), "utf-8");
  for (const col of [...m.REFLUX_CARE_COLUMNS, "meal_marks"]) {
    ok(`RPC が「${col}」を渡していない`, !rpc.includes(col));
  }

  console.log("■ ★病名を、書かない（§14-1〜3）");
  const consentUi = readCode("components", "RefluxCareConsent.jsx");
  const vt = readCode("components", "VocalTracker.jsx");
  for (const w of m.FORBIDDEN_WORDS) {
    ok(`同意画面に「${w}」が無い`, !consentUi.includes(w));
  }
  // ★★lib 自身にも、機能名として書かないこと。★説明の注釈は別なので、
  //   ★見るのは、出す文字（label / text）だけです。
  const labels = [...m.SLEEP_SIDES, ...m.HEAD_RAISED, ...m.BELLY_TIGHT].map((x) => x.label).join(" ");
  for (const w of m.FORBIDDEN_WORDS) {
    ok(`選ぶ言葉に「${w}」が無い`, !labels.includes(w));
  }

  console.log("■ 同意画面の作り（§13-1）");
  ok("★文面は lib から取っている", /purposeByKey\("health\.reflux_care"\)/.test(consentUi));
  ok("★押しただけで同意にしていない", /type="checkbox"/.test(consentUi) && /!checked \|\| busy/.test(consentUi));
  ok("★出口がある（やめておく）", consentUi.includes("やめておく"));
  ok("★保存先の国を書いている", /日本国内/.test(fs.readFileSync(path.join(ROOT, "lib", "consent.js"), "utf-8")));
  ok("★第三者へ渡さないと書いている",
    /第三者へ提供することもありません/.test(fs.readFileSync(path.join(ROOT, "lib", "consent.js"), "utf-8")));
  ok("★先生に共有しないと書いている",
    /先生や教室には、一切共有されません/.test(fs.readFileSync(path.join(ROOT, "lib", "consent.js"), "utf-8")));

  console.log("■ ★同意の文面を、あとから書き替えていない");
  // ★★textHash があるので、文面を変えると、同意ずみの方の記録が合わなくなります。
  const consentLib = fs.readFileSync(path.join(ROOT, "lib", "consent.js"), "utf-8");
  ok("版を、上げていない", /CONSENT_POLICY_VERSION = "2026-08-v2"/.test(consentLib));
  ok("もとからある4つの目的が、残っている",
    ["health.record", "health.cycle", "health.meal_sleep", "research.anonymized"]
      .every((k) => consentLib.includes(`key: "${k}"`)));

  console.log("■ 画面と、行のやり取り");
  ok("行から読んでいる", /sleepSide: row\.sleep_side \|\| null/.test(vt));
  ok("★同意を見てから書いている", /refluxToRow\(/.test(vt) && /refluxCareAllowed === true/.test(vt));

  console.log("■ 画面に、3つの欄が出る（★同意があるときだけ）");
  ok("★門は refluxCareOn ただ1つ", /refluxCareOn\(profile\)/.test(vt));
  // ★★画面が profile を直に見ていないこと（★2か所で判定しない）。
  ok("★profile を直に見ていない", !/profile\.reflux_care_consent_at/.test(vt));
  for (const label of ["寝るときの向き", "頭の側を上げたか", "おなかの締めつけ"]) {
    ok(`「${label}」の欄がある`, vt.includes(label));
  }
  ok("★押して選べる（読み上げにも分かる）", /aria-pressed=\{on\}/.test(vt));
  ok("★同じものを押したら、外せる", /fd\[key\] === o\.key \? null : o\.key/.test(vt));
  // ★★良し悪しを言わないこと（§14-2・§14-4）。
  ok("★良し悪しを言わないと、書いてある", vt.includes("良し悪しは申しません"));
  ok("★保存のときに、同意を渡している", /clean\.refluxCareAllowed = refluxCareOn\(profile\)/.test(vt));

  console.log("■ 設定の入口（★同意画面を、必ず通る）");
  ok("★切り替えだけで立てていない", /if \(v\) setShowRefluxConsent\(true\)/.test(vt));
  ok("★同意画面を押したときだけ立つ",
    /onAgree=\{\(\) => \{\s*onChange\(\{ reflux_care_consent_at: new Date\(\)/.test(vt));
  ok("★やめるときは、null に戻す", /onChange\(\{ reflux_care_consent_at: null \}\)/.test(vt));

  console.log("■ SQL");
  const sql = readCode("supabase", "2026-09-08-寝るときの姿勢と締めつけ.sql");
  ok("3つの列を足している", /add column if not exists sleep_side/.test(sql));
  ok("★門の列を足している", /add column if not exists reflux_care_consent_at/.test(sql));
  ok("★決まった言葉しか入らない", /entries_sleep_side_ok/.test(sql));
  ok("★いっせいに埋めていない", !/\bupdate public\.entries\b/.test(sql));
  ok("BEGIN / ROLLBACK に頼っていない", !/\bbegin\s*;/i.test(sql) && !/\brollback\b/i.test(sql));
  ok("★先生に渡っていないことを、確かめる照会がある", /get_student_entries/.test(sql));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
