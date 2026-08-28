#!/usr/bin/env node
/**
 * 職業を声の型で切り直す §12「テストで固定すること」のうち、
 * ほかのテストが受け持っていない3つ。
 *
 *   □ 職業を変えても、過去の日次レコードが1行も変わらない
 *   □ 出力の文言に、職業名を使った比較が1つもない
 *   □ 削除対象の列について、行数を数えるクエリが実行された記録がある
 *
 * ★残りの4つは、それぞれの持ち場で固定しています。
 *     移行前後で分析結果が動かない … occupation.test.js テスト5
 *     辞書に無い職業のフォールバック … vocabulary.test.js テスト2
 *     閾値を超えた型のぶんだけ出る … type-fields.test.js テスト1
 *     型別項目が検定に入っていない … type-fields.test.js テスト5
 */
const fs = require("fs");
const path = require("path");
const { ROOT, readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

async function main() {
  const vt = readCode("components", "VocalTracker.jsx");
  const vtRaw = readRaw("components", "VocalTracker.jsx");

  console.log("=== §12-2: ★職業を変えても、過去の日次レコードが1行も変わらない ===");
  // 職業を選ぶところが書き込むのは、プロフィールの3つだけ。
  const at = vt.indexOf("occupation: occ");
  assertTrue(at >= 0, "選ぶ画面がある");
  const block = vt.slice(at, at + 220);
  assertTrue(!/entries/.test(block), "★選ぶ画面が entries に触れていない");
  assertTrue(!/upsert|\.delete\(/.test(block), "★選ぶ画面が記録を書き換えていない");

  // 記録の変換が、職業も配合も読んでいない。読んでいなければ、
  // 職業を変えても保存される中身は変わりようがない。
  const mapStart = vt.indexOf("function entryToRow");
  const mapEnd = vt.indexOf("\n}", vt.indexOf("return {", mapStart));
  const mapper = vt.slice(mapStart, mapEnd);
  ["occupation", "voice_mix", "voiceMix", "vocal_profession", "DEFAULT_MIX", "occupationOf"].forEach((w) => {
    assertTrue(!mapper.includes(w), `★entryToRow が ${w} を読んでいない`);
  });
  const readStart = vt.indexOf("function rowToEntry");
  const reader = vt.slice(readStart, vt.indexOf("\n}", vt.indexOf("return {", readStart)));
  ["occupation", "vocal_profession", "DEFAULT_MIX"].forEach((w) => {
    assertTrue(!reader.includes(w), `★rowToEntry が ${w} を読んでいない`);
  });

  console.log("\n=== §12-6: ★出力の文言に、職業名を使った比較が1つもない（§10-3・§10-4） ===");
  // 職業名 × 比較の語 が同じ文の中に出ていないこと。
  // ★コメントを外した本文だけを見る。禁止を説明したコメント自身で落ちるため。
  const OCC_WORDS = ["声楽家", "ミュージカル", "ポップス", "声優", "ナレーター",
                     "アナウンサー", "俳優", "落語", "司会"];
  const CMP_WORDS = ["の平均", "と比べ", "より高い", "より低い", "順位", "ランキング",
                     "の方は", "の人は傾向", "全体の"];
  const files = [["components", "VocalTracker.jsx"], ["lib", "occupation.js"],
                 ["lib", "vocabulary.js"], ["lib", "typeFields.js"],
                 ["lib", "analysisFamilies.js"], ["lib", "displayGates.js"]];
  files.forEach((f) => {
    const code = readCode(...f);
    const sentences = code.split(/[。\n]/);
    const bad = sentences.filter((s) =>
      OCC_WORDS.some((o) => s.includes(o)) && CMP_WORDS.some((c) => s.includes(c)));
    assertTrue(bad.length === 0,
      `★${f.join("/")} に職業名を使った比較が無い${bad.length ? `（${bad[0].trim().slice(0, 40)}…）` : ""}`);
  });

  console.log("\n=== §12-7: 数えた記録が残っている（§6・§10-9） ===");
  // ★「消す前に数えた」ことを、あとから確かめられる形で残す。
  const countingSql = ["check_dead_field_rows.sql", "check_detail_keys.sql"];
  countingSql.forEach((f) => {
    const p = path.join(ROOT, "supabase", f);
    assertTrue(fs.existsSync(p), `数えるSQL ${f} が置いてある`);
  });
  // 消した経緯が、コードの中に残っている（何を・いつ・何件だったか）
  assertTrue(/数えた結果/.test(vtRaw), "★消した経緯（数えた結果）がコードに残っている");
  assertTrue(/0件/.test(vtRaw), "★件数が書かれている");
  // 死んでいた項目が、こっそり復活していないこと
  ["passaggioCrossings", "vocalRangeLowUsed", "vocalRangeHighUsed", "dynamicsRange"].forEach((k) => {
    assertTrue(!vt.includes(k), `★${k} が復活していない`);
  });
  // ★名前が似ているだけの別物は、生きていること（間違えて消さない）
  assertTrue(vt.includes("passaggioFeel"), "★通過感（passaggioFeel）は残っている");
  assertTrue(vt.includes("passaggioStability"), "★通過感の分析も残っている");

  console.log("\n=== §4: 用語辞書が画面につながっている ===");
  // ★ファイルがあってテストが通っていても、呼ばれていなければ誰にも届きません。
  //   このセッションで、その形の抜けが実際に起きました。
  assertTrue(/function activityKindLabel/.test(vt), "呼び名を決める helper がある");
  assertTrue(/termLabel\(occupation, termKey, language, t, opt\.labelKey\)/.test(vt),
    "★helper が用語辞書を呼んでいる");
  const uses = (vt.match(/activityKindLabel\(/g) || []).length;
  assertTrue(uses >= 6, `★画面が helper 経由で呼び名を出している（${uses}箇所）`);
  assertTrue(!/t\(\(ACTIVITY_OPTIONS\.find\([^)]*\) \|\| \{\}\)\.labelKey\)/.test(vt),
    "★辞書を通さない古い書き方が残っていない");
  // ★保存される値は変えていない（§4）
  assertTrue(/ACTIVITY_KIND_TERM = \{/.test(vt), "kind と用語の対応表がある");
  assertTrue(/"本番": "performanceDay"/.test(vt), "「本番」という kind はそのまま");
  assertTrue(/ACTIVITY_LOAD_WEIGHT = \{ "休養": 0/.test(vt),
    "★発声負荷の重みが、これまでどおり kind を鍵にしている");

  console.log("\n=== §8③: 呼び方が変わったことを1回だけ知らせる ===");
  assertTrue(/呼び方をお仕事に合わせました。記録はそのままです。/.test(vt),
    "知らせの文面がある");
  assertTrue(/showOccupationNotice/.test(vt), "出す条件がある");
  assertTrue(/!profile\.occupation_notice_shown_at/.test(vt),
    "★まだ知らせていない人にだけ出す");
  assertTrue(/occupation_notice_shown_at: at/.test(vt), "★出したら記録する（1回だけ）");
  assertTrue(/\.update\(\{ occupation_notice_shown_at/.test(vt),
    "★profiles は update で書く（upsert は RLS が許していない）");

  console.log("\n=== 移行SQLが未実行でも、アプリが使えること ===");
  // ★2026-08-28に実際に起きた障害。職業の4列を1つの select に足したため、
  //   列が無い環境で 42703 が出て、プロフィールが1件も読めなくなりました。
  //   新しい機能のために、既存の全機能を巻き添えにしないこと。
  assertTrue(/42703/.test(vt), "★列が無いときの番号（42703）を見ている");
  assertTrue(/PROFILE_BASE_COLUMNS/.test(vt), "職業の列を分けて持っている");
  assertTrue(/select\(PROFILE_BASE_COLUMNS\)/.test(vt),
    "★列が無いときは、職業の列を外して読み直す");
  // 書き込み側も、本体と混ぜない
  assertTrue(/update\(\{ voice_occupation: profile\.voice_occupation \}\)/.test(vt),
    "★職業の保存は、本体の update と分けてある");
  const mainUpdate = vt.slice(vt.indexOf("vocal_profession: profile.vocal_profession"), 
                              vt.indexOf("track_cycle: !!profile.track_cycle"));
  assertTrue(!/occupation:/.test(mainUpdate),
    "★本体の update に職業を混ぜていない（混ぜると保存が丸ごと失敗する）");

  console.log("\n=== 列名が本番と一致していること ===");
  // ★2026-08-28の障害。本番の列は voice_mix_edited_at ですが、コードと
  //   migration が mix_edited_at を見ていて、42703 で落ちていました。
  //   接頭辞の付け忘れは、目で読んでも気づきにくい種類の間違いです。
  const nameFiles = [["components", "VocalTracker.jsx"], ["lib", "typeFields.js"],
                     ["supabase", "migration_occupation.sql"]];
  nameFiles.forEach((f) => {
    const raw = readRaw(...f);
    const bare = (raw.match(/(?<!voice_)\bmix_edited_at\b/g) || []).length;
    assertTrue(bare === 0, `★${f.join("/")} に voice_ の付かない mix_edited_at が無い`);
    assertTrue(!/voice_voice_mix/.test(raw), `★${f.join("/")} に接頭辞の重複が無い`);
  });
  // 読み出す列名と、プロパティ名が同じであること（片方だけ直す間違いを防ぐ）
  const vtRaw2 = readRaw("components", "VocalTracker.jsx");
  assertTrue(/PROFILE_OCCUPATION_COLUMNS = "voice_occupation, voice_mix, voice_mix_edited_at, occupation_notice_shown_at"/.test(vtRaw2),
    "★select の列名が本番と一致している");
  assertTrue(/voice_mix_edited_at: data\.voice_mix_edited_at/.test(vtRaw2),
    "★読み出したあとのプロパティ名も一致している");

  console.log("\n=== ★登録画面の自由記述 occupation を奪っていないこと ===");
  // ★2026-08-28。11分類の職業を profiles.occupation に入れようとしていました。
  //   あれは schema.sql の当初からある登録画面の自由記述の列で、
  //   「学生」「声楽家」「会社員のものまね」など、本人の回答が26人ぶん
  //   入っていました。選ぶ画面で保存した瞬間に、黙って消えるところでした。
  //   11分類は voice_occupation に入れます。

  // (a) 新機能が、接頭辞なしの occupation を読み書きしていないこと
  const occSrc = readCode("lib", "occupation.js");
  assertTrue(!/profile\.occupation\b/.test(occSrc),
    "★occupationOf が profile.occupation を読んでいない");
  assertTrue(/profile\.voice_occupation/.test(occSrc),
    "★occupationOf が voice_occupation を読んでいる");
  assertTrue(!/\bdata\.occupation\b/.test(vt), "★読み出しで data.occupation を使っていない");
  assertTrue(!/update\(\{ occupation:/.test(vt), "★occupation に書き込んでいない");
  assertTrue(!/PROFILE_OCCUPATION_COLUMNS = "occupation,/.test(vt),
    "★select の先頭が occupation になっていない");
  assertTrue(!/\boccupation: occ\b/.test(vt), "★選ぶ画面が occupation に入れていない");

  // (b) 制約は voice_occupation にだけ掛かっていること
  const migs = ["migration_occupation.sql", "migration_voice_occupation.sql"];
  migs.forEach((f) => {
    const raw = readRaw("supabase", f);
    const live = raw.split("\n").filter((l) => !l.trim().startsWith("--")).join("\n");
    assertTrue(!/check \(occupation is null or occupation in/.test(live),
      `★${f} の制約が occupation に掛かっていない`);
    assertTrue(!/^\s*update public\.profiles[\s\S]{0,80}set occupation\b/m.test(live),
      `★${f} が occupation を書き換えない`);
    assertTrue(!/add column if not exists occupation\b/.test(live),
      `★${f} が occupation を作ろうとしていない`);
  });
  const newMig = readRaw("supabase", "migration_voice_occupation.sql");
  assertTrue(/add column if not exists voice_occupation text/.test(newMig),
    "新しいSQLが voice_occupation を作る");
  assertTrue(/profiles_voice_occupation_check/.test(newMig),
    "★制約の名前も voice_occupation 側");

  // (c) 登録画面の自由記述は、そのまま残っていること
  const signup = readCode("components", "SignupForm.jsx");
  assertTrue(/occupation: form\.isStudent \? "学生" : form\.occupation/.test(signup),
    "★登録画面は、これまでどおり occupation に自由記述を書く");
  assertTrue(!/voice_occupation/.test(signup),
    "★登録画面は voice_occupation を触らない（別の機能）");
  const schema = readRaw("supabase", "schema.sql");
  assertTrue(/^\s*occupation text,/m.test(schema), "★schema.sql の occupation 列はそのまま");
  assertTrue(/raw_user_meta_data->>'occupation'/.test(schema),
    "★登録時のトリガーもそのまま");
  const exp = readCode("lib", "exportData.js");
  assertTrue(/"occupation"/.test(exp), "★本人の書き出しに occupation が残っている");
  const admin = readCode("app", "admin", "page.js");
  assertTrue(/u\.occupation/.test(admin), "★管理画面の表示もそのまま");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
}
main();
