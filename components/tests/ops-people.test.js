/**
 * ★ひとと 役職（★見本 `stPeople`／★2026-09-18・坂本さんの お決め ㋑）。
 *
 *   ★★役職（できこと）を **作れる**のに、★**人に 付けられません** でした。
 *     ★★`OpsPosts` は 役職の **型**を 作る 画面 です。
 *     ★★A2 で できことの 道が 1本に なった いま、★この 1枚が 要ります。
 *
 *   ★★見本は 6列。★台帳に 4列が ありません（★照会で 確定）。
 *     ★★出すのは 2列 だけ。★★空の 列を 並べません。
 */
const { readCode, readRaw } = require("./_source");

let 落ち = 0;
function t(名, 条件) {
  console.log((条件 ? "  ok   " : "  NG   ") + 名);
  if (!条件) 落ち++;
}

const ui = readCode("components/OpsPeople.jsx");
const vt = readCode("components/VocalTracker.jsx");
const api = readCode("app/api/org/posts/route.js");
const mihon = readRaw("docs/design/pack-final/00-動く見本-PC・iPad（運営）.html");

console.log("\n=== ① 出すのは 2列 だけ ===");
t("★お名前を 出して いる", /nameOf\(m\.user_id\)/.test(ui));
t("★役職を 出して いる", /post \? post\.name : "役職なし"/.test(ui));
["学部", "学科", "分野", "確かめ"].forEach((w) => {
  // ★★表の 列として 出して いない こと。★断りの 1文には 出ます。
  const 表 = ui.slice(0, ui.indexOf("学部・学科・事務の 分野・確かめは"));
  t(`★★「${w}」の 列を 出して いない`, !表.includes(w));
});
t("★★出して いない ことを、★黙って いない",
  /学部・学科・事務の 分野・確かめは、まだ お作りして いません/.test(ui));

console.log("\n=== ② 判じは lib が 持つ ===");
t("★変えられるかは mayChangePerson", /mayChangePerson\(myPerms/.test(ui));
t("★渡せるかは mayGrantPost", /mayGrantPost\(myPerms/.test(ui));
t("★★役職の 名を くらべて いない", !/\.name === "(学長|副学長|事務長)"/.test(ui));
t("★渡せない わけを 隠して いない",
  /あなたが 持って いない できことは、渡せません。/.test(ui));

console.log("\n=== ③ 押せない 札を 置かない（★§8⑤）===");
t("★変えられない 方は、押しどころを 出さない", /\{ok \? \(/.test(ui));
t("★送って いる あいだは 押せない", /disabled=\{busy\}/.test(ui));

console.log("\n=== ④ できなかった ことを 出す ===");
t("★失敗を 持って いる", /setFailed\(true\)/.test(ui));
t("★画面に 出して いる", /変えられませんでした。/.test(ui));
t("★★黙って 閉じて いない",
  /if \(r === false\) \{ setFailed\(true\); return; \}/.test(ui));

console.log("\n=== ⑤ 呼ぶ 側 ===");
t("★門は post か master（★見本と 同じ）",
  /canOps\(gate, "post"\) \|\| canOps\(gate, "master"\)/.test(vt));
t("★付ける ときは assign", /action: "assign", postId, userId/.test(vt));
t("★外す ときは unassign", /action: "unassign", userId/.test(vt));

console.log("\n=== ⑥ 0行を 成功に しない ===");
t("★★assign が 行数を 見て いる",
  /update\(\{ post_id: postId \}\)[\s\S]{0,120}\.select\("user_id"\)/.test(api));
t("★★unassign も 行数を 見て いる",
  /update\(\{ post_id: null \}\)[\s\S]{0,120}\.select\("user_id"\)/.test(api));
t("★0行なら 断る", (api.match(/done\.length === 0/g) || []).length >= 2);

console.log("\n=== ⑦ 見本と くらべる（★較正）===");
t("★見本に stPeople が ある", mihon.includes("function stPeople("));
t("★見本の 題と 同じ", mihon.includes("ひとと 役職"));
t("★★見本の 6列が 実在する（★較正）",
  mihon.includes("学部・研究科") && mihon.includes("事務の 分野"));

console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
process.exit(落ち === 0 ? 0 : 1);
