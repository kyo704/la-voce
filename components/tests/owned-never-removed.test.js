// ============================================================================
// 手に入れた ものを、★1点も 取り上げない
//
//   ★出どころ docs/opus/裁定-羊のおうち J02・J03（9月10日）.md §4 ⑤
//     「★台帳に「持っている」と 書かれたものを、★1点も 消さない。
//       ★名前を 直しても、★手に入れたものは 1点も 取り上げないでください」
//            docs/opus（9月4日 §4）
//
//   ★★なぜ 見張るか。
//     J02 で 置き場所の 名まえが 変わります（★たな → とだな）。
//     ★名まえを 直すと、★「あたらしい 名まえの 品しか 出さない」という
//     ★書き方に なりがちです。★そうすると、★古い 名まえで 持っておられる
//     ★品が、★画面から 消えます。★取り上げた のと 同じです。
//
//   ★★見張るのは 2つ。
//     ① 持ち物と 台帳を 消す コードが、★退会の 道いがいに 無いこと
//     ② 品の 一覧から 外した ものが、★持っている方には 出ること
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw, ROOT } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) console.log("  ok  " + label);
  else { console.log("  NG  " + label); failed++; }
}

console.log("① 消す コードが、どこにも 無い");
// ★★app と components と lib を ぜんぶ 見ます（★tests は のぞく）。
const files = [];
(function walk(d) {
  for (const f of fs.readdirSync(d, { withFileTypes: true })) {
    const p = path.join(d, f.name);
    if (f.isDirectory()) { if (f.name !== "tests" && f.name !== "node_modules") walk(p); }
    else if (/\.(js|jsx)$/.test(f.name)) files.push(p);
  }
})(path.join(ROOT, "components"));
["lib", "app"].forEach((d) => (function walk(x) {
  for (const f of fs.readdirSync(x, { withFileTypes: true })) {
    const p = path.join(x, f.name);
    if (f.isDirectory()) walk(p);
    else if (/\.(js|jsx)$/.test(f.name)) files.push(p);
  }
})(path.join(ROOT, d)));

// ★★退会の 道は 別です。★退会は「消す」ことが 仕事です。
//   ★一覧は lib/accountDeletion.js が 持ち、★消すのは その 道だけです。
const EXEMPT = ["lib/accountDeletion.js", "app/api/account"];
const offenders = [];
files.forEach((p) => {
  const rel = path.relative(ROOT, p);
  if (EXEMPT.some((e) => rel.startsWith(e))) return;
  const code = readCode(...rel.split(path.sep));
  ["character_inventory", "item_acquisitions", "LEDGER_TABLE"].forEach((t) => {
    if (!code.includes(t)) return;
    // ★その 表を 触る ところの 近くで、delete を 呼んでいないか。
    const re = new RegExp("from\\(\\s*[\"']?" + t + "[\"']?\\s*\\)[\\s\\S]{0,200}?\\.delete\\(");
    if (re.test(code)) offenders.push(rel + " → " + t);
  });
});
ok(offenders.length === 0,
  "★持ち物・台帳を 消す コードが ない" + (offenders.length ? "（" + offenders.join(" / ") + "）" : ""));

console.log("② 台帳は 上書きも しない");
const server = readCode("lib", "itemLedgerServer.js");
ok(/ignoreDuplicates: true/.test(server), "★2度目は 静かに 落ちる（★日を 動かさない）");
ok(!/\.update\(/.test(server), "★書き換えを 呼んでいない");

console.log("③ 棚から 下げた 品も、持っている方には 出る");
// ★★これが「取り上げない」の 中身です。
//   ★★scarf-v1 の とき、★neck_01〜03 を 棚から 下げました。
//     ★あのとき、★着ておられる方の ぶんは 残す、と 決めました。
// ★★注記そのものを 見るので readRaw です（★禁じた語の 検査では ありません）。
//   ★はじめ readCode で 見て、★自分の 注記を 読み落としました。
const retiredRaw = readRaw("lib", "retiredWardrobe.js");
ok(/いま 着ている方は、★そのまま 着ていられます/.test(retiredRaw),
  "★下げた 品の 決めに、残す ことが 書いてある");
const drawer = readCode("lib", "drawerItems.js");
ok(/withoutRetired/.test(drawer), "★棚の 側で 下げている（★持ち物からでは ない）");
// ★★言葉だけでは ありません。★実際に 残ることを 動かして 確かめます。
const rw = readRaw("lib", "retiredWardrobe.js")
  .replace(/^export /gm, "").replace(/import[^\n]*\n/g, "");
// eslint-disable-next-line no-new-func
const mod = new Function(rw + "; return { withoutRetired, isRetired };")();
const items = [{ key: "neck_01" }, { key: "scarf_01" }];
ok(mod.withoutRetired(items, {}).length === 1, "★着ていなければ、棚には 出ない");
ok(mod.withoutRetired(items, { neck: "neck_01" }).length === 2,
  "★★着ていれば、棚にも 出る（★外せるように）");

console.log("④ 名まえを 直しても、鍵は 変えない");
// ★★J02 の「たな」→「とだな」は、★人が 読む 言葉の 話です。
//   ★★品の 鍵（furniture_01 など）を 変えると、
//     ★台帳の item_key と 合わなくなり、★持ち物が 消えます。
const idx = require("../../docs/assets/sheep-interior-index.json");
const keys = idx.items.map((i) => i.key);
ok(new Set(keys).size === keys.length, "★品の 鍵に、重なりが ない");
ok(keys.every((k) => /^[a-z]+_[0-9]+$/.test(k)), "★鍵は ぜんぶ 英数（★言葉を 入れていない）");
// ★★鍵に 日本語が 入っていると、★言葉を 直したときに 鍵も 変わります。
ok(!keys.some((k) => /[ぁ-んァ-ン一-龥]/.test(k)), "★鍵に 日本語が 入っていない");

console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
process.exit(failed === 0 ? 0 : 1);
