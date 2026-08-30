#!/usr/bin/env node
/**
 * 登録画面の職業（2026-08-30）
 *
 * ★なぜ要るか
 *   登録画面は長いあいだ「職業」を自由記述でたずね、その文字列が
 *   handle_new_user を通って profiles.occupation に入っていました。
 *   一方アプリの中では、11個から選ぶ voice_occupation を見ています。
 *   同じ「職業」が2か所にあり、片方だけが使われていました。
 *
 * ★このテストが守ること
 *   ① 新しい登録は profiles.occupation を書かない（鍵ごと送らない）
 *   ② 新しい登録は voice_occupation に、11個のうちの1つを書く
 *   ③ 選択肢を登録画面に書き写さない（正は lib/occupation.js）
 *   ④ すでに入っている26人ぶんの自由記述には、一切触れない
 *
 * ★「occupation」という語そのものは、コメントにも voice_occupation にも
 *   出てきます。語の有無ではなく、★鍵として送っているかを見ます。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function assertEqual(a, b, label) { assertTrue(JSON.stringify(a) === JSON.stringify(b), `${label}（${JSON.stringify(a)}）`); }

const signup = readCode("components", "SignupForm.jsx");
const tracker = readCode("components", "VocalTracker.jsx");

(async () => {
  const O = await import("../../lib/occupation.js");

  console.log("=== ★① 新しい登録は profiles.occupation を書かない ===");
  // signUp に渡す data の中身だけを見る。
  const dataBlock = signup.slice(signup.indexOf("options: {"), signup.indexOf("emailRedirectTo"));
  assertTrue(dataBlock.length > 0, "signUp の data のかたまりが見つかる");
  // ★voice_occupation: に当たらないよう、前の1文字で区切る。
  assertTrue(!/[^_a-zA-Z]occupation:/.test(dataBlock),
    "★occupation という鍵を送っていない（handle_new_user が書く道を断つ）");
  assertTrue(!/"学生"/.test(dataBlock),
    "★学生のときも occupation に「学生」を入れていない");
  assertTrue(!/form\.occupation/.test(signup),
    "★自由記述の状態そのものが残っていない");

  console.log("\n=== ★② voice_occupation に、11個のうちの1つを送る ===");
  assertTrue(/voice_occupation: form\.voiceOccupation/.test(dataBlock),
    "★選んだ職業を voice_occupation として送っている");
  assertTrue(/form\.voiceOccupation \?/.test(dataBlock),
    "選んでいなければ、鍵ごと送らない（年齢の答えと同じ作り）");
  // 選択肢の value は OCCUPATIONS そのもの。文字列を書き写していないこと。
  assertTrue(/OCCUPATIONS\.map\(\(occ\)/.test(signup),
    "★選択肢は lib/occupation.js の OCCUPATIONS から作る");
  assertTrue(/<option key=\{occ\} value=\{occ\}>/.test(signup),
    "★value は職業の鍵そのもの（表示名ではない）");
  O.OCCUPATIONS.forEach((k) => {
    assertTrue(!new RegExp(`value="${k}"`).test(signup), `${k} を直に書き写していない`);
  });

  console.log("\n=== ★③ 呼び名は9言語そろっている ===");
  assertEqual(Object.keys(O.OCCUPATION_LABELS_I18N).sort(), [...O.OCCUPATIONS].sort(),
    "i18n の職業が11個そろっている");
  const LANGS = ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"];
  O.OCCUPATIONS.forEach((k) => {
    const row = O.OCCUPATION_LABELS_I18N[k];
    assertTrue(LANGS.every((l) => typeof row[l] === "string" && row[l].length > 0),
      `${k} は9言語すべてに呼び名がある`);
  });
  O.OCCUPATIONS.forEach((k) => {
    assertTrue(O.OCCUPATION_LABELS_I18N[k].ja === O.OCCUPATION_LABELS[k],
      `${k} の日本語が、アプリの中の呼び名と一致`);
  });
  assertTrue(O.occupationLabelIn("classical", "zz") === O.OCCUPATION_LABELS.classical,
    "知らない言語でも空にならない（日本語に落ちる）");
  assertTrue(O.occupationLabelIn("しらない職業", "en") === O.OCCUPATION_LABELS_I18N.other.en,
    "知らない職業は「その他」として返る");

  console.log("\n=== ★④ 初回ログインで移すときの決まり ===");
  assertEqual(O.adoptSignupOccupation({ voice_occupation: null }, "pops"), { voice_occupation: "pops" },
    "まだ選んでいない人には、登録時の答えを入れる");
  assertEqual(O.adoptSignupOccupation({ voice_occupation: "mc" }, "pops"), null,
    "★すでに選んでいる人の値は、上書きしない");
  assertEqual(O.adoptSignupOccupation({ voice_occupation: null }, "しらない値"), null,
    "★11個にない値は入れない（DBの制約に当たる前に止める）");
  assertEqual(O.adoptSignupOccupation({ voice_occupation: null }, null), null,
    "答えていなければ何もしない");
  assertEqual(O.adoptSignupOccupation(null, "pops"), null, "プロフィールが無ければ何もしない");
  // 取り込む側が、書く列を1つに絞っていること
  const adoptBlock = tracker.slice(tracker.indexOf("const adoptedOcc ="), tracker.indexOf("const adoptedOcc =") + 400);
  assertTrue(/\.update\(adoptedOcc\)/.test(adoptBlock), "取り込みは adoptSignupOccupation の返り値だけを書く");
  assertTrue(!/[^_a-zA-Z]occupation:/.test(adoptBlock), "★取り込みで occupation を書いていない");

  console.log("\n=== ★⑤ ほかに profiles.occupation を書く場所が無い ===");
  // ★コメントを外した本文で見る（説明のコメントに当たらないため）。
  const writers = [];
  ["components/VocalTracker.jsx", "components/SignupForm.jsx"].forEach((f) => {
    const parts = f.split("/");
    const code = readCode(parts[0], parts[1]);
    // update({...}) / insert({...}) の中に occupation という鍵が無いこと
    const re = /\.(update|insert|upsert)\(\{([^}]*)\}/g;
    let m;
    while ((m = re.exec(code)) !== null) {
      if (/[^_a-zA-Z]occupation:|^occupation:/.test(" " + m[2])) writers.push(`${f}: ${m[0].slice(0, 60)}`);
    }
  });
  assertEqual(writers, [], "★アプリのコードで profiles.occupation に書いている場所は無い");

  console.log("\n=== ★⑥ すでにある26人ぶんの自由記述に触れていない ===");
  const schema = readRaw("supabase", "schema.sql");
  assertTrue(/insert into public\.profiles \(id, name, email, occupation, school\)/.test(schema),
    "★handle_new_user は変えていない（既存の行の作られ方はそのまま）");
  const exportCode = readCode("lib", "exportData.js");
  assertTrue(/"occupation"/.test(exportCode),
    "★本人の書き出しには、いまも occupation が含まれる（過去の回答を返せる）");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
