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
  // ★列がまだ無い環境で、答えても保存できない1枚を出さないこと。
  assertTrue(/ageColumnsReady && shouldAskAgeQuestion\(profile\)/.test(vt),
    "★移行が済んでいない環境では、そもそもたずねない");
  assertTrue(/setAgeColumnsReady\(!ageError && !!ageRow\)/.test(vt),
    "★読めたときだけ、たずねてよい状態にする");
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
  // ★「18歳未満ですか？」は、列が無いときの警告文にも出ます。そちらが先に
  //   見つかるので、字面ではなく、1枚の出し分けそのものを目印にします。
  const cardAt = vtRaw.indexOf("{showAgeQuestion && (");
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

  console.log("\n=== ★論拠は「害の非対称」であること（2026-08-30 の差し替え） ===");
  const gateSrc = readRaw("lib", "ageGate.js");
  assertTrue(/安全に関わる判定を、他の目的の欄と混ぜないため/.test(gateSrc),
    "★新しい論拠が書いてある");
  assertTrue(/間違えたときの害が、まったく違う/.test(gateSrc), "★害の非対称が書いてある");
  assertTrue(/集める情報が最小限だから/.test(gateSrc) && /✗ 旧い理由/.test(gateSrc),
    "★古い論拠が「もう成り立たない」と明示してある（黙って消していない）");
  assertTrue(/配布前の暫定/.test(gateSrc), "★暫定であることが書いてある");
  assertTrue(/生年月日を含めて設計し直します/.test(gateSrc), "★いつ作り直すかが書いてある");

  console.log("\n=== ★本人が答えを変えられる（永久に弾かれない） ===");
  const vt2 = readCode("components", "VocalTracker.jsx");
  assertTrue(/async function handleChangeAgeAnswer\(nextIsUnder18\)/.test(vt2), "設定から変えられる");
  assertTrue(/from\("age_answer_changes"\)\.insert\(\{/.test(vt2), "★変更を記録に残す");
  assertTrue(/from_value: before \?\? null, to_value: nextIsUnder18/.test(vt2),
    "★どちらからどちらへ、を残す（null も残す）");
  // ★記録が書けなくても、変更そのものは通すこと（19歳の人が弾かれたままになる）
  const at = vt2.indexOf("年齢の答えの変更を記録できませんでした");
  assertTrue(at > 0 && !/return;/.test(vt2.slice(at, at + 200)),
    "★記録に失敗しても、変更は巻き戻さない");
  assertTrue(/hasAnsweredAgeQuestion\(profile\)/.test(vt2), "画面は ageGate を通して状態を出す");

  console.log("\n=== ★年齢の欄と、この答えを混ぜていない ===");
  assertTrue(/ここは「身体データ」の年齢とは別のもの/.test(readRaw("components", "VocalTracker.jsx")),
    "★別物であることを、画面にも書いてある");
  // profiles.age を年齢判定に使っていないこと（既存の見張りを再確認）
  assertTrue(!/profile\.age[^_]/.test(gateSrc.replace(/\/\/.*$/gm, "")),
    "★ageGate は profiles.age を読まない");

  console.log("\n=== 記録の表（書き出し・削除に入っている） ===");
  assertTrue(readCode("lib", "exportData.js").includes("age_answer_changes"), "★書き出しに含まれる");
  assertTrue(readCode("lib", "accountDeletion.js").includes("age_answer_changes"), "★削除で消える");
  const changeSql = readCode("supabase", "migration_age_answer_changes.sql");
  assertTrue(/create table if not exists public\.age_answer_changes/.test(changeSql), "表を作る");
  assertTrue(!/for delete|for update/.test(changeSql), "★消す・書き換えるポリシーを作っていない");
  // ★字面で "ip" を探さないこと。「★IPを保存しないこと」という自分の注意書きに当たります。
  //   （SQLの文字列なので `--` のコメント除去では消えません）
  //   列の定義として ip があるかどうかを見ます。
  assertTrue(!/^\s*ip(_address)?\s+\w/mi.test(changeSql), "★IPの列を作っていない");
  assertTrue(/IPを保存しないこと/.test(readRaw("supabase", "migration_age_answer_changes.sql")),
    "★保存しない、と書いてある");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
