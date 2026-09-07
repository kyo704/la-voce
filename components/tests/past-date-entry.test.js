// ============================================================================
// 過去の日を、続けて入れられること（2026-09-07）
//
//   ★手帳に1年ぶん書きためた記録を、★アプリへ写すための道です。
//
//   ★★過去の日を選ぶこと自体は、★前からできていました。
//     ★日付の欄に max（今日まで）はありますが、★min がありません。
//   ★足りていなかったのは、★速さです。
//     ★1日ぶん保存するたびに、★上へ戻って日付を選び直していました。
//     ★1年ぶんだと、★同じ動きを365回くり返すことになります。
//
//   ★守ること
//     ・★勝手に日付を進めない（押したときだけ）
//     ・★書いた日を、必ず出す（ちがう日に書いたことに気づけるように）
//     ・★今日を書いたときは、これまでどおり（余計なものを出さない）
//     ・★今日より先へは、進まない
// ============================================================================

const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

const code = readCode("components", "VocalTracker.jsx");
const raw = readRaw("components", "VocalTracker.jsx");

console.log("■ 過去の日を、選べること");
ok("日付の欄に、さかのぼれる下限が無い",
  /<input type="date" value=\{selectedDate\} max=\{todayISO\(\)\}/.test(code)
  && !/<input type="date"[^>]*\bmin=/.test(code));
ok("保存は、選んだ日を書いている", /const built = buildFormData\(selectedDate, entries\)/.test(code));
ok("記録の読み込みに、期間の絞り込みが無い",
  /from\("entries"\)\.select\("\*"\)\.eq\("user_id", userId\)/.test(code));
// ★過去の日に、昨日の天気が勝手に入らないこと
ok("過去の日には、天気を引き継がない", /realToday: realTodayDate/.test(code));

console.log("■ 保存したあと、次の日へ進めること");
ok("保存の結果が、書いた日を持っている", /date: clean\.date,/.test(code));
ok("次の日へ進む道がある", /次の日（\{formatDateLabel\(addDays\(saveCardData\.date, 1\), language\)\}）を書く/.test(code));
// ★★勝手に進めないこと。★押したときだけです。
//   ★保存の処理（handleSave）の中で日付を動かしていたら、それは自動です。
const saveFn = code.slice(code.indexOf("async function handleSave()"),
  code.indexOf("async function handleSave()") + 3000);
ok("★保存そのものは、日付を動かさない", !/setSelectedDate\(/.test(saveFn));
// ★今日より先へは行かない
ok("★今日より先へは進まない", /next > realTodayDate \? realTodayDate : next/.test(code));

console.log("■ 今日を書いたときは、これまでどおり");
ok("次の日への道は、過去の日のときだけ出る",
  (raw.match(/saveCardData\.date && saveCardData\.date < realTodayDate/g) || []).length >= 2);

console.log("■ ちがう日に書いたことに、気づけること");
ok("書いた日を、保存のあとに出している",
  /\{formatDateLabel\(saveCardData\.date, language\)\}/.test(code));

console.log("■ 押せるものになっていること");
// ★★「日付を選び直してください」と文で書いて終わり、にしないこと。
//   ★選べることは、必ず押せる形で出すこと。
ok("★文ではなく、押せるボタンである",
  /<button type="button"[\s\S]{0,900}次の日（/.test(code));

console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
process.exit(failed === 0 ? 0 : 1);
