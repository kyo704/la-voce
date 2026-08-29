#!/usr/bin/env node
/**
 * 年齢の確認（作業指示-公開前の実装.md A-7 の1行目・研究利用の同意.md §1-④）
 *
 * ★なぜ要るか
 *   坂本さんから、15〜20人のテスターに未成年が含まれると明言がありました。
 *   作業指示 §3 は「一人でも未成年が含まれるなら、配布前に必要」と書いています。
 *
 * ★守りたいこと
 *   ① 答えていない人は、未成年として扱う（フェイルクローズ）
 *   ② 一度たずねたら、飛ばされていても二度と出さない
 *   ③ 答えは義務にしない（登録も、アプリの利用も、止めない）
 *   ④ 判断が1か所にある（呼ぶ側で is_under_18 を直に見ない）
 *   ⑤ 任意の同意が、未成年に出ない
 *   ⑥ すでに同意している人から、撤回する手段を取り上げない
 */
const fs = require("fs");
const path = require("path");
const { ROOT, readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const src = fs.readFileSync(path.join(ROOT, "lib", "ageGate.js"), "utf-8");
  const A = await import("data:text/javascript;base64," + Buffer.from(src, "utf-8").toString("base64"));

  console.log("=== ★答えていない人は、未成年として扱う ===");
  assertEqual(A.isTreatedAsMinor({}), true, "★何も答えていなければ、未成年");
  assertEqual(A.isTreatedAsMinor(null), true, "★プロフィールが無くても、未成年側");
  assertEqual(A.isTreatedAsMinor({ is_under_18: null }), true, "★null は未成年");
  assertEqual(A.isTreatedAsMinor({ is_under_18: true }), true, "はいと答えたら未成年");
  assertEqual(A.isTreatedAsMinor({ is_under_18: false }), false, "いいえと答えた人だけ成人");
  // ★体組成のための age を、年齢の確認に流用していないこと。
  assertEqual(A.isTreatedAsMinor({ age: 40 }), true,
    "★profiles.age が40でも、答えていなければ未成年として扱う");
  assertEqual(A.isAdultConfirmed({ age: 40 }), false,
    "★profiles.age を成人の根拠にしない");
  // 文字列や数値が来ても、成人側へ倒れないこと。
  ["false", 0, "", 18].forEach((v) => {
    assertEqual(A.isAdultConfirmed({ is_under_18: v }), false, `★boolean でない値（${JSON.stringify(v)}）を成人と見なさない`);
  });

  console.log("\n=== ★一度たずねたら、二度と出さない ===");
  assertEqual(A.shouldAskAgeQuestion({}), true, "まだ答えておらず、出してもいなければ、出す");
  assertEqual(A.shouldAskAgeQuestion({ is_under_18: false }), false, "答えた人には出さない");
  assertEqual(A.shouldAskAgeQuestion({ is_under_18: true }), false, "はいと答えた人にも出さない");
  assertEqual(A.shouldAskAgeQuestion({ age_question_shown_at: "2026-08-29T00:00:00Z" }), false,
    "★飛ばした人にも、二度と出さない（催促にしない）");
  assertEqual(A.shouldAskAgeQuestion(null), false, "プロフィールが無ければ出さない");

  console.log("\n=== 保存する形 ===");
  const answered = A.answerToProfilePatch(true, "2026-08-29T00:00:00Z");
  assertEqual(answered.is_under_18, true, "はい を保存できる");
  assertTrue(!!answered.age_question_shown_at, "答えると同時に「出した」も記録する");
  assertEqual(A.answerToProfilePatch(false, "x").is_under_18, false, "いいえ を保存できる");
  const skipped = A.skipToProfilePatch("2026-08-29T00:00:00Z");
  assertEqual(skipped.is_under_18, null, "★飛ばしたときは null のまま（＝未成年として扱う）");
  assertTrue(!!skipped.age_question_shown_at, "飛ばしても「出した」は記録する");
  assertEqual(A.isTreatedAsMinor(skipped), true, "★飛ばした人は、そのまま未成年として扱われる");

  console.log("\n=== 登録画面の答えの受け取り ===");
  assertEqual(A.adoptSignupAnswer({}, false, "t").is_under_18, false, "登録画面の答えを受け取れる");
  assertEqual(A.adoptSignupAnswer({ is_under_18: true }, false, "t"), null,
    "★すでに答えが入っていれば、上書きしない");
  assertEqual(A.adoptSignupAnswer({}, null, "t"), null, "答えていなければ、何もしない");
  assertEqual(A.adoptSignupAnswer({}, "false", "t"), null, "★boolean でなければ受け取らない");

  console.log("\n=== ★任意の同意は、未成年に出さない（研究利用の同意 §1-④） ===");
  assertEqual(A.mayAskForConsent({ is_under_18: false }), true, "成人には求めてよい");
  assertEqual(A.mayAskForConsent({ is_under_18: true }), false, "未成年には求めない");
  assertEqual(A.mayAskForConsent({}), false, "★答えていなければ求めない");
  assertEqual(A.mayAskForConsent(null), false, "プロフィールが無くても落ちない");

  console.log("\n=== ★判断が1か所にある ===");
  const vt = readCode("components", "VocalTracker.jsx");
  // 呼ぶ側で is_under_18 を直に比べていないこと。そこだけ倒れる向きが逆になる。
  assertTrue(!/profile\.is_under_18\s*===/.test(vt),
    "★VocalTracker が is_under_18 を直に比べていない（lib/ageGate.js を通す）");
  assertTrue(!/is_under_18\s*===\s*false/.test(vt),
    "★「false なら成人」と書いていない");
  assertTrue(/mayAskForConsent\(profile\)/.test(vt), "任意の同意の出し分けが、ageGate を通っている");
  assertTrue(/shouldAskAgeQuestion\(profile\)/.test(vt), "質問の出し分けが、ageGate を通っている");
  // consent.js に同じ判断を作り直していないこと。
  const consent = readCode("lib", "consent.js");
  assertTrue(!/export function mayAskForConsent/.test(consent),
    "★consent.js に、年齢の判断を作り直していない");

  console.log("\n=== ★答えは義務ではない ===");
  const signup = readCode("components", "SignupForm.jsx");
  // ★窓の幅を決め打ちにしないこと。900字では次のパスワード欄の required まで
  //   入ってしまい、落ちました。質問の枠（fieldset）の中だけを見ます。
  // ★labelAgeQuestion は文言の表にも出るので、そこから手前を探すと見つかりません
  //   （表のほうが先にあります）。枠そのものを前から探します。
  const fsStart = signup.indexOf("<fieldset");
  const fsEnd = signup.indexOf("</fieldset>", fsStart);
  assertTrue(fsStart > 0 && fsEnd > fsStart, "質問の枠が1つある");
  const fieldset = signup.slice(fsStart, fsEnd);
  assertTrue(/name="isUnder18"/.test(fieldset), "枠の中に、はい／いいえがある");
  assertTrue(!/required/.test(fieldset), "★登録画面で必須になっていない");
  assertTrue(!/defaultChecked/.test(signup),
    "★既定で選ばれている選択肢が無い（答えていない状態が残る）");
  assertTrue(/isUnder18: null/.test(signup),
    "★登録画面の初期値が null（既定で「18歳以上」にしていない）");
  const vtRaw = readRaw("components", "VocalTracker.jsx");
  const cardAt = vtRaw.indexOf("18歳未満ですか？");
  assertTrue(cardAt > 0, "アプリの中に、一度だけの質問がある");
  const card = vtRaw.slice(cardAt, cardAt + 1600);
  assertTrue(/答えない/.test(card), "★「答えない」を選べる");
  assertTrue(!/Modal|fixed inset-0/.test(card), "★画面をふさぐ形にしていない");

  console.log("\n=== ★撤回する手段を取り上げない ===");
  assertTrue(/mayAskForConsent\(profile\) \|\| !!profile\.consent_stats_use_at/.test(vt),
    "★すでに同意している人には、欄が残る（外せる）");
  assertTrue(/if \(checked && !mayAskForConsent\(profile\)\) return;/.test(vt),
    "★未成年は、新たに入れられない（外すことだけできる）");

  console.log("\n=== 移行のSQL ===");
  const sql = readCode("supabase", "migration_age_question.sql");
  assertTrue(/add column if not exists is_under_18 boolean/.test(sql), "is_under_18 を足す");
  assertTrue(/add column if not exists age_question_shown_at timestamptz/.test(sql), "age_question_shown_at を足す");
  assertTrue(!/is_under_18 boolean[^;]*default/i.test(sql),
    "★既定値を入れていない（null が「まだ答えていない」の意味を持つ）");
  assertTrue(!/update public\.profiles/i.test(sql),
    "★既存の行を書き換えていない（勝手に成人扱いにしない）");
  assertTrue(!/\balter table public\.profiles[\s\S]{0,80}\bage\b\s/.test(sql.replace(/is_under_18|age_question_shown_at/g, "")),
    "★profiles.age に触っていない");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
