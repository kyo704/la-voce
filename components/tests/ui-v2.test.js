#!/usr/bin/env node
// ============================================================================
// 共通UI部品の見張り
//
//   JSXをブラウザーなしで描画するテストではなく、共通契約（部品名・
//   押しやすさ・入力欄の大きさ・状態表示の文言）を静的に確認します。
//   実行: node components/tests/ui-v2.test.js
// ============================================================================

const { readCode, readRaw } = require("./_source");

const src = readCode("components", "UiV2.jsx");
const raw = readRaw("components", "UiV2.jsx");
let failed = 0;
function ok(condition, label) {
  if (condition) console.log("  ✓ " + label);
  else { console.log("  ✗ " + label); failed++; }
}
function hasExport(name) {
  return new RegExp(`export function ${name}\\b`).test(src);
}

console.log("① 共通部品がそろっている");
[
  "ScreenHead", "HeadRound", "H3", "Card", "Seg", "Pill", "Warn", "Note",
  "Li", "Kv", "Lock", "BarRow", "Box", "Usu", "FieldLabel", "Wl", "Two",
  "Input", "TextArea", "SheetTitle", "EmptyBox", "Skeleton", "StateBlock",
  "Switch", "Back", "Btn", "Tag"
].forEach((name) => ok(hasExport(name), `${name}をexportしている`));

console.log("\n② 押しやすさ");
ok(/HeadRound[\s\S]*?width: SPACE\.tapMin, height: SPACE\.tapMin/.test(src),
  "右上丸ボタンは44px以上");
ok(/Seg[\s\S]*?minHeight: SPACE\.tapMin/.test(src),
  "切替ボタンは44px以上");
ok(/Lock[\s\S]*?minHeight: SPACE\.tapMin/.test(src),
  "調べるボタンは44px以上");
ok(/Btn[\s\S]*?minHeight: SPACE\.tapMin/.test(src),
  "通常ボタンは44px以上");
ok(/Back[\s\S]*?minHeight: SPACE\.tapMin/.test(src),
  "戻るボタンは44px以上");
ok(/Switch[\s\S]*?minHeight: SPACE\.tapMin/.test(src),
  "切替スイッチの押し場が44px以上");

console.log("\n③ ボタンの安全な既定値");
ok(/<button type="button"/.test(src), "buttonにtypeを付ける");
ok(/Btn\(\{[^}]*type = "button"/.test(src), "Btnの既定typeがbutton");
ok(/Card[\s\S]*?<button type="button"/.test(src), "押せるCardもbutton");
ok(/Pill[\s\S]*?disabled=\{disabled\}/.test(src), "Pillのdisabledを伝える");

console.log("\n④ 入力部品");
ok(/export function Input/.test(src) && /<input/.test(src), "Inputを提供");
ok(/Input[\s\S]*?fontSize: rem\(16\)/.test(src), "Inputの文字を16pxにする");
ok(/export function TextArea/.test(src) && /<textarea/.test(src), "TextAreaを提供");
ok(/TextArea[\s\S]*?fontSize: rem\(16\)/.test(src), "TextAreaの文字を16pxにする");
ok(/FieldLabel[\s\S]*?htmlFor/.test(src), "FieldLabelが入力欄と結び付く");

console.log("\n⑤ 注記と状態表示");
ok(/NOTE_OPEN = "くわしい 決まりを 見る"/.test(src), "注記の開く文言");
ok(/NOTE_CLOSE = "閉じる"/.test(src), "注記の閉じる文言");
ok(/Note[\s\S]*?fold = false/.test(src), "Noteは既定では開く");
ok(/STATE_NOTE/.test(src) && /STATE_FAIL_LINES/.test(src), "状態文言を一か所で持つ");
ok(/StateBlock[\s\S]*?onRetry/.test(src), "失敗時の再試行を受け取る");
ok(/EmptyBox[\s\S]*?title[\s\S]*?sub/.test(src), "空状態に題と説明を持つ");

console.log("\n⑥ 見た目の契約");
ok(/ScreenHead[\s\S]*?TYPE\.title/.test(src), "画面見出しは共通文字設定");
ok(/Card[\s\S]*?cardStyle/.test(src), "Cardは共通カード設定");
ok(/Warn[\s\S]*?#F6F1E4[\s\S]*?#E8DFC8/.test(src), "Warnの地と枠を見本に合わせる");
ok(/Wl[\s\S]*?#F6EFDF[\s\S]*?#E8DFC8/.test(src), "Wlの地と枠をWarnと分ける");
ok(/Li[\s\S]*?borderBottom/.test(src) && /last/.test(src), "一覧の最後だけ線を消す");
ok(/Seg[\s\S]*?aria-current/.test(src), "選択中の切替をariaで示す");
ok(/Pill[\s\S]*?aria-pressed/.test(src), "選択中の札をariaで示す");
ok(/Switch[\s\S]*?aria-checked/.test(src), "スイッチ状態をariaで示す");

console.log("\n⑦ 危険な共通化をしない");
ok(!/catch\s*\{\s*\}/.test(raw), "空のcatchを置かない");
ok(!/as any|as unknown/.test(raw), "不要な型逃げをしない");

console.log(failed === 0 ? "\n★すべて通りました" : `\n★${failed}件、落ちました`);
process.exit(failed === 0 ? 0 : 1);
