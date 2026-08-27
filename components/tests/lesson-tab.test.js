#!/usr/bin/env node
/**
 * 「レッスン」タブが2つ並ばないことを固定するテスト。
 *
 * 【何が起きていたか】
 * 1人が先生でもあり生徒でもある場合（自分も誰かに習っている先生）、
 * 教える側のタブと習う側のタブの出現条件が独立していたため、
 * 同じ「レッスン」というラベルのタブが横に2つ並んでいた。
 *
 * これは試験用アカウント特有の話ではなく、正当な想定です。
 * タブは1つにして、中で「習う」「教える」を切り替えます。
 *
 * 【呼び名について】
 * 「生徒として／担当として」ではなく「習う／教える」を使います。
 * 生徒の画面に既に「担当の先生」（assignedTeacherLabel）があり、
 * 「担当」が両側で逆向きの意味になるためです。
 */
const fs = require("fs");
const path = require("path");
// ★コメント除去は components/tests/_source.js の1か所から使う。
//   各テストが自前で持つと、除去の仕方が少しずつずれていく。
const { stripComments } = require("./_source");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}`); console.log(`      期待値: ${JSON.stringify(b)}`); console.log(`      実際値: ${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const SRC_PATH = path.join(__dirname, "..", "VocalTracker.jsx");
const src = fs.readFileSync(SRC_PATH, "utf-8");

// コメントを外してから調べる（仕様をコメントに引用しているため、
// そのままだと自分の説明文に引っかかる）

function loadFunctions(names) {
  const parts = names.map((name) => {
    const start = src.indexOf(`function ${name}(`);
    if (start < 0) throw new Error(`${name} が VocalTracker.jsx に見つかりません`);
    // ★引数の分割代入（{ canTeach, canLearn }）を本体の { と間違えないこと。
    //   先に引数リストの ) を閉じてから、本体の { を探す。
    let p = src.indexOf("(", start), pd = 0, bodyStart = -1;
    for (let k = p; k < src.length; k++) {
      if (src[k] === "(") pd++;
      else if (src[k] === ")") { pd--; if (pd === 0) { bodyStart = src.indexOf("{", k); break; } }
    }
    if (bodyStart < 0) throw new Error(`${name} の本体が見つかりません`);
    let depth = 0, i = bodyStart, end = -1;
    for (; i < src.length; i++) {
      if (src[i] === "{") depth++;
      else if (src[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    if (end < 0) throw new Error(`${name} の終わりが見つかりません`);
    return src.slice(start, end);
  });
  // eslint-disable-next-line no-new-func
  return new Function(`${parts.join("\n")}\nreturn { ${names.join(", ")} };`)();
}

function main() {
  const { resolveLessonRole, shouldShowLessonRoleSwitch } = loadFunctions([
    "resolveLessonRole", "shouldShowLessonRoleSwitch"
  ]);
  const BOTH = { canTeach: true, canLearn: true };
  const TEACH_ONLY = { canTeach: true, canLearn: false };
  const LEARN_ONLY = { canTeach: false, canLearn: true };

  console.log("=== テスト1: ★タブは1つだけ（同じラベルが2つ並ばない） ===");
  const code = stripComments(src);
  const lessonPushes = (code.match(/displayTabs\.push\(\{[^}]*t\("tabLesson"\)/g) || []).length;
  assertEqual(lessonPushes, 1, "★「レッスン」タブを積む箇所は1つだけ");
  assertTrue(!/key: "students"/.test(code), "古い students タブの定義が残っていない");
  assertTrue(!/key: "mylessons"/.test(code), "古い mylessons タブの定義が残っていない");
  assertTrue(!/activeTab === "students"/.test(code), "古い students の出し分けが残っていない");
  assertTrue(!/activeTab === "mylessons"/.test(code), "古い mylessons の出し分けが残っていない");

  console.log("\n=== テスト2: 両方の立場を持つ人 ===");
  assertEqual(resolveLessonRole(null, BOTH), "teach", "初めて開いたときは「教える」");
  assertEqual(resolveLessonRole("learn", BOTH), "learn", "「習う」を選べば習う側");
  assertEqual(resolveLessonRole("teach", BOTH), "teach", "「教える」を選べば教える側");
  assertEqual(shouldShowLessonRoleSwitch(BOTH), true, "★このときだけ切り替えが出る");

  console.log("\n=== テスト3: 片方だけの人には、切り替えを出さない（大多数） ===");
  assertEqual(shouldShowLessonRoleSwitch(TEACH_ONLY), false, "先生だけの人には出さない");
  assertEqual(shouldShowLessonRoleSwitch(LEARN_ONLY), false, "生徒だけの人には出さない");
  assertEqual(shouldShowLessonRoleSwitch({ canTeach: false, canLearn: false }), false, "どちらでもない人にも出さない");
  assertEqual(resolveLessonRole(null, TEACH_ONLY), "teach", "先生だけの人は、そのまま教える側");
  assertEqual(resolveLessonRole(null, LEARN_ONLY), "learn", "生徒だけの人は、そのまま習う側");

  console.log("\n=== テスト4: ★選んだ立場が使えなくなったとき（連携の解除など） ===");
  assertEqual(resolveLessonRole("learn", TEACH_ONLY), "teach",
    "★習う側を選んでいた人の先生連携が切れたら、教える側に戻る（空白を出さない）");
  assertEqual(resolveLessonRole("teach", LEARN_ONLY), "learn",
    "★教える側を選んでいた人の生徒がいなくなったら、習う側に戻る");
  assertEqual(resolveLessonRole("なにか変な値", BOTH), "teach", "知らない値でも、必ずどちらかを返す");

  console.log("\n=== テスト5: どんな入力でも、必ずどちらかを返す（空白の画面を出さない） ===");
  [null, undefined, "", "teach", "learn", "x"].forEach((choice) => {
    [BOTH, TEACH_ONLY, LEARN_ONLY, { canTeach: false, canLearn: false }].forEach((caps) => {
      const r = resolveLessonRole(choice, caps);
      if (r !== "teach" && r !== "learn") { console.log(`  ✗ ${JSON.stringify(choice)} / ${JSON.stringify(caps)} → ${r}`); failCount++; }
    });
  });
  assertTrue(true, "全24通りが teach か learn のどちらかになる");

  console.log("\n=== テスト6: 呼び名が9言語そろっている ===");
  const tr = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "translations.js"), "utf-8");
  ["lessonRoleLearn", "lessonRoleTeach"].forEach((key) => {
    const m = tr.match(new RegExp(`${key}:\\s*\\{([^}]*)\\}`));
    assertTrue(!!m, `${key} が定義されている`);
    if (m) {
      const missing = ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"].filter((l) => !new RegExp(`\\b${l}:`).test(m[1]));
      assertEqual(missing, [], `${key} に9言語すべてある`);
    }
  });
  assertTrue(/lessonRoleLearn:\s*\{[^}]*ja:\s*"習う"/.test(tr), "日本語は「習う」");
  assertTrue(/lessonRoleTeach:\s*\{[^}]*ja:\s*"教える"/.test(tr), "日本語は「教える」");
  assertTrue(!/lessonRole(Learn|Teach):\s*\{[^}]*"担当として"/.test(tr),
    "★「担当として」を使っていない（生徒側の「担当の先生」と逆向きになるため）");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main();
