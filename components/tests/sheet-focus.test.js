#!/usr/bin/env node

// ============================================================================
// 1枚（BottomSheet）の 焦点 ── ★打つたびに 閉じない こと
//
//   ★出どころ 坂本さんの 実機の ご報告（★2026-09-11）
//     「ひとことを 入力する 画面で、1文字、打つたびに、キーボードが、
//       閉じてしまいます。文章を、入力すること自体が、事実上、できません。」
//
//   ★★何が 起きて いたか
//     ★BottomSheet の 効き目（useEffect）の 頼りが [onClose] でした。
//     ★★呼ぶ 側は onClose={() => { … }} と、★その場で 作って います。
//       ★★描き直すたびに 別の ものに なります。
//     ★★1文字 打つ → setFormData → 描き直し → 効き目が また 走る
//       ★→ ref.current.focus() が 焦点を 1枚の 枠へ 移す
//       ★→ 入力欄が 焦点を 失う → 端末が キーボードを 閉じる
//
//   ★★直し
//     ★焦点を 移すのは、★開いた とき **1度だけ**（★頼りを 空に）。
//     ★Esc の 聞き取りは、★いちばん 新しい onClose を ref で 持ちます。
//
//   ★★この 見張りは 字を 読みます。★実際に 打った わけでは ありません。
//     ★★実機で お確かめ ください。
// ============================================================================

const { readCode } = require("./_source");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const s = readCode("components", "BottomSheet.jsx");

console.log("① 焦点を 移すのは、★開いた とき 1度だけ");
// ★★focus() を 含む 効き目の 頼りが、★空 で ある こと。
const blocks = s.split("useEffect(");
const focusBlock = blocks.find((b) => b.includes("ref.current.focus()"));
t(!!focusBlock, "★focus() を 呼ぶ 効き目が ある");
if (focusBlock) {
  // ★★その 塊の 終わりの「}, [ … ]);」を 探します。
  //   ★★中に 返す 片づけ（return）が あるので、★最初の }); では ありません。
  const m = focusBlock.match(/\}\s*,\s*\[([^\]]*)\]\s*\)\s*;/);
  t(!!m, "★頼りの 書き方が 読み取れる");
  if (m) {
    t(m[1].trim() === "", "★その 頼りが 空（[]）── ★描き直しでは 走らない");
    t(!/onClose/.test(m[1]), "★onClose を 頼りに して いない");
  }
}

console.log("\n② onClose は ref で 持つ");
t(/const closeRef = useRef\(onClose\);/.test(s), "★いちばん 新しい onClose を 持って いる");
t(/closeRef\.current = onClose;/.test(s), "★描き直しごとに 入れ替えて いる");
t(/closeRef\.current\(\)/.test(s), "★Esc は ref ごしに 呼ぶ");

console.log("\n③ 頼りに onClose が 1つも 残って いない こと");
// ★★同じ 形が 戻って こない ように 見ます。
t(!/\}, \[onClose\]\)/.test(s), "★[onClose] の 頼りが 無い");

console.log("\n④ 打つ ところが ある 1枚");
// ★★ひとこと・稽古の メモ ── ★字を 打つ 1枚です。
//   ★★ここが 閉じると、★書く ことが できません。
const rs = readCode("components", "RecordSheets.jsx");
t(/<textarea/.test(rs), "★ひとことに 打つ ところが ある");
t(/onChange=\{\(e\) => onChange\(e\.target\.value\)\}/.test(rs),
  "★打つたびに 上へ 渡して いる（★保存は して いない）");
// ★★1文字ごとに 保存して いない ことも 見ます。
const vt = readCode("components", "VocalTracker.jsx");
t(/<HitokotoSheet[\s\S]{0,200}onChange=\{\(v\) => setFormData/.test(vt),
  "★ひとことの onChange は 覚えるだけ（★保存を 呼んで いない）");
t(/<HitokotoSheet[\s\S]{0,260}onClose=\{\(\) => \{ handleSave\(\)/.test(vt),
  "★保存は 閉じる ときに 1度だけ");

console.log("\n⑤ 保存の 1枚は、★毎回 出さない こと");
// ★★出どころ 坂本さんの 実機の ご報告（★2026-09-11）
//   「記録するたびに、『保存しました』という、画面が、出て、鬱陶しいです。」
//   「これは、以前の 決まり（保存ボタンを作らない。選んだ瞬間に保存）に、
//     反している、可能性があります。」
// ★★門の中の 記録画面は「選んだ 瞬間に 保存」です。
//   ★★3択を 1つ 押すたびに 全画面の 1枚が 出て いました。
//   ★★ボタンを 消した のに、★知らせだけが 残って いました。
t(/const wantCard = !layoutV2/.test(vt), "★門の中と 外を 分けて いる");
t(/opts && opts\.card/.test(vt), "★「出す」を 押した ときは 出す");
t(/clean\.date < realTodayDate/.test(vt), "★きょうより 前の 日は 出す");
t(/onSubmit=\{\(\) => handleSave\(null, \{ card: true \}\)\}/.test(vt),
  "★「出す」が それを 渡して いる");
// ★★門の外（38人）は、★これまでどおり 毎回 出ます。
t(/!layoutV2\s*$|!layoutV2\s*\n/.test(vt.split("const wantCard =")[1].slice(0, 120)),
  "★門の外は これまでどおり");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
