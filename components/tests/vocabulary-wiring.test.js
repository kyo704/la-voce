#!/usr/bin/env node
/**
 * 用語辞書が、画面につながっていること（用語辞書の拡張 §1・§2・§4・§8）
 *
 * ★§8「新しい語は VOCAB にまとめる。画面に文字列を書かない」。
 *   辞書を作っても、画面が自前の文字列を出していたら意味がありません。
 *
 * ★とくに §2「テッシトゥーラという語を、声楽・ミュージカル以外に出さない」。
 *   呼び名が空の職業では、欄ごと出しません（§6：想像で埋めない）。
 *   ★ただし3択（低め／真ん中／高め）は、全職業で残します。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const vt = readCode("components", "VocalTracker.jsx");
const raw = readRaw("components", "VocalTracker.jsx");

console.log("=== §1 カードの見出しと追加ボタン ===");
assertTrue(/\{term\(occupation, "repertoireCard"\)\}/.test(vt), "見出しが辞書を通っている");
assertTrue(/\{term\(occupation, "repertoireAdd"\)\}/.test(vt), "追加ボタンが辞書を通っている");
// ★画面に直接書かれた見出しが残っていないこと
assertTrue(!/activity\.kind === "本番" \? "演目・曲目"/.test(vt), "★古い決め打ちの見出しが無い");
assertTrue(!/<Plus size=\{12\} \/>曲を追加/.test(vt), "★古い決め打ちの追加ボタンが無い");

console.log("\n=== §4 開始ボタンは、職業ごとの呼び名 ===");
assertTrue(/\{activityKindLabel\(kind, currentOccupation, language, t\)\}を始める/.test(vt),
  "開始ボタンが辞書を通っている");
assertTrue(!/\{kind\}を始める/.test(vt), "★保存する値をそのまま出していない");

console.log("\n=== ★§2 テッシトゥーラの呼び名 ===");
assertTrue(/const tessituraLabel = termLabel\(occupation, "tessitura", language, t, null\);/.test(vt),
  "呼び名を辞書から取っている");
assertTrue(/\{tessituraLabel\}も入力する（任意）/.test(vt), "見出しが呼び名になっている");
assertTrue(!/テッシトゥーラも入力する（任意）/.test(vt), "★「テッシトゥーラ」の決め打ちが無い");
// ★呼び名が空の職業では、欄ごと出さない
assertTrue(/\{tessituraLabel && \(/.test(vt), "★呼び名が空なら、欄ごと出さない");
// 「登録済み：」の表示も呼び名に合わせる
assertTrue(/`・\$\{tessituraLabel \|\| ""\}\$\{record\.tessituraNote\}`/.test(vt),
  "「登録済み」の表示も呼び名に合わせている");
assertTrue(!/・テッシトゥーラ\$\{record\.tessituraNote\}/.test(vt), "★そちらの決め打ちも無い");

console.log("\n=== ★3択の逃げ道は、全職業で残っている（§2） ===");
// 3択は tessituraLabel の外側にあること（呼び名が空でも出る）
const tessAt = vt.indexOf("{tessituraLabel && (");
const closeAt = vt.indexOf("</details>", tessAt);
const threeAt = vt.indexOf('setDOverrideChoice(0)');
assertTrue(threeAt > closeAt, "★3択は、テッシトゥーラの欄の外にある（空の職業でも出る）");
assertTrue(/音名で答えられない場合はこちら/.test(raw), "3択への入口が残っている");

console.log("\n=== §1-1 声優は、作品名を上部に ===");
const roleTopAt = vt.indexOf("{name && isVoiceActor && (() => {");
const nameInputAt = vt.indexOf("placeholder={t(\"placeholderRepertoireExample\")}");
assertTrue(roleTopAt > 0, "上部の作品名の欄がある");
assertTrue(roleTopAt > nameInputAt, "★役名の入力より下（＝すぐ下）にある");
const accAt = vt.indexOf("showExtraAccordion && isVoiceActor");
assertTrue(roleTopAt < accAt, "★畳まれる「役の情報」より上にある");
// ★仕様書の handleSaveProject は誤り。作品名は handleSaveRole が保存する。
assertTrue(/handleSaveRole\(name, \{ \.\.\.roleRec, workTitle: e\.target\.value \}\)/.test(vt),
  "★作品名は handleSaveRole が保存する（仕様書の handleSaveProject は誤り）");
assertTrue(/仕様書 §1-1 は handleSaveProject と書いていますが/.test(raw),
  "★その食い違いが、コードのそばに書いてある");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
