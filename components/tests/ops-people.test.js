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
// ★★★2026-09-19（★裁定 その98）── ★学校の 形の 表が できました。
//   ★★きょうまで、★学部・学科・分野は「置き場が 無い」ので 出して いません でした。
//   ★★★いまは `org_divisions` が あります。★決めが 変わりました。
//     ★★一覧の 絞りに 出ます（★学科・分野）。
//     ★★開いた 1枚に、★学部・学科・分野の 3行が 出ます。
//     ★★★学部は **選ばせません**。★学科の 上から 出します（★食い違いを 作らない）。
//   ★★「確かめ」だけ は、★まだ しまう 列が ありません。
// ★★★2026-09-19 ── ★「確かめ」も 出来ました（★`memberships.verified_at`）。
//   ★★きょうまで「まだ お作りして いません」と 書いて いました。
//   ★★★いまは、★確かめて いない 方に だけ 出ます。
t("★形の 絞りが ある（学科・分野）", /choosableFor\(divisions\)/.test(ui));
t("★開いた 1枚に 3行 出す", /shapeLineOf\(divisions, target\)/.test(ui));
t("★★学部を 選ばせて いない", !/kind === "faculty"/.test(ui));
t("★確かめる 道が ある", /onVerify/.test(ui));
t("★確かめて いない 方に だけ 出す", /!target\.verified_at/.test(ui));
t("★確かめた あとは、★いつ 確かめたかを 出す", /確かめました/.test(ui));
t("★★責める 言い方に して いない", !/間違|誤り|正しく ありません/.test(ui));
t("★★出して いない ことを、★黙って いない",
  /ご自分で 選んだ ままです/.test(ui));

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

// ============================================================================
// ★★★役職を 決める 1枚（★見本 `P_setPost`・2026-09-18）
//
//   ★★★はじめ、★この 塊を 紙の いちばん 下に 足しました。★走りません でした。
//     ★★上が `process.exit()` で 終わって います。
//     ★★★きょう 2度目 です（★`ops-perms.test.js` でも 同じ ことを しました）。
//     ★★足した のに 通った ように 見える ── ★いちばん 危ない 形 です。
// ============================================================================
console.log("\n=== ★役職を 決める 1枚（見本 P_setPost）===");
{
  const 画面 = ui;
  const 生 = readRaw("components/OpsPeople.jsx");
  t("★役職の 名の 下に、できことが 出る", /permLine\(p\.perms\)/.test(画面));
  t("★画面が 自分で 字を 作って いない", !/\.join\("・"\)/.test(画面));
  const m = /const PEOPLE_NOTE = Object\.freeze\(\[([\s\S]*?)\]\)/.exec(画面);
  t("★注が 1か所に ある", !!m);
  const 行 = m ? (m[1].match(/"/g) || []).length / 2 : 0;
  t("★注は 3行（いま " + 行 + "）", 行 === 3);
  // ★★★「変えた記録は 残ります」は、★台帳に 記録が できた ので 書けます。
  //   ★★書いた なら、★記録が 本当に 残る ことも 見ます。
  //   ★★★言葉だけ 先に 足す ことを、★ここで 止めます。
  t("★「変えた記録は 残ります」と 書いて ある",
    !!m && /変えた記録は 残ります/.test(m[1]));
  const 紙 = readRaw("supabase/migration_post_change_log.sql");
  t("★記録の 表が ある（post_change_log）", /create table if not exists public\.post_change_log/.test(紙));
  t("★誰が・いつ・誰を が そろって いる",
    /changed_by/.test(紙) && /changed_at/.test(紙) && /target_user_id/.test(紙));
  t("★役職の 名も 残す（番号だけ だと 消えた とき 読めません）",
    /from_post_name/.test(紙) && /to_post_name/.test(紙));
  const 道 = readCode("app/api/org/posts/route.js");
  // ★★★`記録する(admin` は **作った ところ** にも 当たります。
  //   ★★3 と 出て 落ちました。★呼ぶ ところ だけ を 数えます。
  t("★付けた とき・外した とき の 2か所で 記録を 書いて いる",
    (道.match(/await 記録する\(admin/g) || []).length === 2);
  t("★記録は 直せない（update も delete も 渡して いない）",
    !/grant[^;]*update[^;]*post_change_log|grant[^;]*delete[^;]*post_change_log/i.test(紙));
  t("★ご本人も 読める（黙って 変えられない）", /target_user_id = auth\.uid\(\)/.test(紙));
}

console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
process.exit(落ち === 0 ? 0 : 1);
