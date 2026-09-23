// ============================================================================
// ★文字の 大きさの 設定が、★ちゃんと 効くか（★2026-09-11）
//
//   ★出どころ docs/design/pack-final/文字の大きさ.md §3
//     「html { font-size: calc(16px * var(--scale)) }」
//     「★文字と、文字に付く 余白・高さ　→ ★rem
//       ★枠線・角丸・影・絵の大きさ　　 → ★px のまま」
//
//   ★★この 見張りが 生まれた いきさつ（★実機の 写真・2026-09-11）。
//     ★見本の tokens.md は px で 書かれています（17px・13.5px …）。
//     ★★それを その まま px で 入れていました。
//     ★★px は、★文字の 大きさの 設定で 1つも 変わりません。
//     ★★しかも 古い ところは rem の ままです。
//       ★★同じ 画面に、★大きくなる 字と ならない 字が 混じりました。
//       ★注記だけが 大きく 見えていたのは、★これです。
//
//   ★★確かめること
//     ① 文字の 大きさが、★ぜんぶ rem で あること。
//     ② 枠線・角丸・押せる 大きさは px の ままで あること。
//     ③ 数が 見本の px と 合っていること（★1rem ＝ 16px）。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

const ROOT = path.join(__dirname, "..", "..");
const src = readRaw("lib", "uiKit.js");
const code = readCode("lib", "uiKit.js");

console.log("① 文字の 大きさは rem");
// ★★TYPE の 中に、★裸の px（数字だけ）の fontSize が 無いこと。
const typeAt = code.indexOf("export const TYPE = {");
const typeEnd = code.indexOf("\n};", typeAt);
const type = code.slice(typeAt, typeEnd);
const bare = [...type.matchAll(/fontSize: (\d)/g)].map((m) => m[0]);
ok(bare.length === 0, "★裸の px が ない" + (bare.length ? "（" + bare.join(", ") + "）" : ""));
// ★★2026-09-11、★note を 足して 12に なりました。
//   ★★数を 書き写す 見張りは、★足すたびに 落ちます。
//     ★見るべきは「★ぜんぶ rem を 通っている」ことです。★数では ありません。
const sizes = (type.match(/fontSize:/g) || []).length;
const rems = (type.match(/fontSize: rem\(/g) || []).length;
ok(sizes === rems && rems >= 11, `★${sizes} とも rem を 通している（rem ${rems}）`);

console.log("② 枠線・角丸・押せる 大きさは px の まま");
ok(/borderRadius: RADIUS\.card/.test(code), "★角丸は 数の まま");
ok(/1px solid/.test(code), "★枠線は px の まま");
ok(/tapMin: 44/.test(code), "★押せる 大きさは 44px の まま");
// ★★44 を rem に すると、★小さい 設定で 44 を 下回ります。
//   ★「どの段でも 44 以上」の 決めが 崩れます。
ok(!/tapMin: rem\(/.test(code), "★押せる 大きさを rem に していない");

console.log("③ 数は 決め（lib/uiKit.js）の とおり");
// ★★★2026-09-23、★坂本さんの お決めで、★見る 先を 変えました ──
//     「段3a A群の 検証対象切り替え（lib/visualTokens.js・lib/uiKit.js を 正とする）」
//
//   ★★もとは 見本の px を 書き写して いました（17・13.5・13・11 …）。
//     ★★`lib/uiKit.js` は **わざと 1段 大きく** して います（★同じ ファイルの 註）。
//       ★だから 見本と 同じに なる はずが ありません。★4つ 落ちて いました。
//       ★★実装が 正しい のに 赤い、★という 形 です。
//
//   ★★★いま 見るのは 3つ。★数を 書き写しません ──
//       ㋐ 註が「見本 A px → B px」と 書いて ある
//       ㋑ その B が、★すぐ 下の `rem(B)` と 同じ（★註が 古く ならない）
//       ㋒ B ≧ A（★上げ幅は 上向き。★見本より 小さく しない）
// ★★註を 見る ので、★註の 残って いる ほう（readRaw）を 使います。
//   ★`type` は 註を 落とした ほう です。★そちらでは 0組 に なります（2026-09-23）。
const typeRaw = src.slice(src.indexOf("export const TYPE = {"),
  src.indexOf("\n};", src.indexOf("export const TYPE = {")));
// ★★★註と 名前は **となり合わせ** で なければ なりません（2026-09-23）。
//   ★ゆるく 探すと、★`h3` の 註が `body` の 名前と 組んで しまいました。
//   ★★だから『*/ の すぐ 次の 行』だけ を 取ります。
const 段 = [...typeRaw.matchAll(
  /見本\s*([\d.]+)px\s*→\s*([\d.]+)px[^\n]*\*\/\s*\n\s*([A-Za-z][A-Za-z0-9]*):\s*\{\s*fontSize:\s*rem\(([\d.]+)\)/g)];
// ★★★名前に 数字が 入る ものが あります（`h3`）。★`[A-Za-z]+` では 拾えません（2026-09-23）。
// ★★★数を 覚えません。★註の ぶんだけ 組に なった かを 見ます（2026-09-23）。
const 註数 = (typeRaw.match(/見本\s*[\d.]+px\s*→\s*[\d.]+px/g) || []).length;
ok(段.length === 註数,
  "★『見本 A → B』の 註 " + 註数 + "件 すべてが 名前と 組に なった（" + 段.length + "組）");
段.forEach(([, a, b, 名, 実]) => {
  ok(b === 実, "★" + 名 + " ── 註の " + b + "px と 書いた " + 実 + "px が 同じ");
  ok(Number(実) >= Number(a), "★" + 名 + " ── 見本 " + a + "px より 小さく ない（いま " + 実 + "px）");
});
// ★★★註の 無い もの（big / bigUnit / tab / btn）は、★rem で 書いて ある ことだけ 見ます。
//   ★数は 決めの 側の もの です。★ここで 覚えません。
["big", "bigUnit", "obiTitle"].forEach((k) => {
  ok(new RegExp(k + ":\\s*\\{[^}]*fontSize:\\s*rem\\(").test(type),
    "★" + k + " も rem で 書いて ある");
});
// ★1rem ＝ 16px。★倍率 1 では、★見た目が 1つも 変わらないこと。
ok(/\(Number\(px\) \/ 16\)/.test(code), "★1rem ＝ 16px で 割っている");

console.log("④ 画面の 側に、★裸の px が 1つも 残っていないか");
// ★★はじめは「13 以上だけ」を 見ていました。★甘すぎました（★2026-09-11）。
//   ★11.5px の 札の 字も、★文字の 大きさの 設定で 変わるべき ものです。
//   ★★見本が px で 書いているのは、★見本が 1つの 大きさしか 持たないからです。
//     ★アプリには 3つの 大きさが あります。★ぜんぶ rem です。
[["UiV2"], ["HomeV2"], ["RecordV2Head"], ["LookBackV2"], ["NotesV2"],
 ["CompareV2"], ["CountV2"], ["TodayBand"], ["RangeCalendar"],
 ["WheelPicker"], ["DailyAskPicker"], ["OwnedLedger"]].forEach(([name]) => {
  const c = readCode("components", name + ".jsx");
  const bare = [...c.matchAll(/fontSize: (\d+(?:\.\d+)?)(?![\w.(])/g)].map((m) => m[1]);
  ok(bare.length === 0, "★" + name + " に 裸の px が ない"
    + (bare.length ? "（" + bare.join(", ") + "）" : ""));
});

console.log("⑤ 決めが 1か所に ある");
ok(/文字と、文字に付く 余白・高さ/.test(src), "★分け方が 書いてある");
ok(/rem\(15\)|rem\(11\)|rem\(SPACE\.cardPadY\)/.test(code), "★文字に 付く 余白も rem");

console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
process.exit(failed === 0 ? 0 : 1);
