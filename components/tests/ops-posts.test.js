// ============================================================================
// 役職と できることの 画面 ── 見張り（★権限の 作り直し・2段目）
//
//   ★出どころ 裁定-9月10日夜の7点（役職への一本化ほか）.md §7-3・§7-4
//            見本 SC['役職の一覧'] ／ SC['役職の中身']
//
//   ★★いちばん 大事なのは ②です。
//     ★渡せる／渡せないの 守りが、★画面だけでは なく ★サーバに あること。
//     ★★見た目だけの 守りは、★守りでは ありません。
// ============================================================================

const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) console.log("  ok  " + label);
  else { console.log("  NG  " + label); failed++; }
}

const ui = readCode("components", "OpsPosts.jsx");
const api = readCode("app", "api", "org", "posts", "route.js");

console.log("① 画面は 判じない");
ok(/mayGrant\(myPerms, p\.key\)/.test(ui), "★渡せるかは lib の mayGrant が 決める");
ok(!/schoolWide\s*&&/.test(ui), "★画面の 中で 決まりを 組み立てていない");
ok(/tabsForPerms/.test(ui), "★出る タブも lib から");

console.log("② 守りは サーバに ある（★いちばん 大事）");
ok(/isSchoolWide\(key\)/.test(api), "★サーバが「学校ぜんぶか」を 見ている");
ok(/perms && perms\.has\(key\)/.test(api), "★サーバが「自分が 持っているか」を 見ている");
ok(/status: 403/.test(api), "★渡せないときは 403");
// ★★画面の 灰色だけに していない こと。
ok(/if \(on && isSchoolWide\(key\) && !\(perms && perms\.has\(key\)\)\)/.test(api),
  "★足すときだけ 止める（★外すのは 止めない）");

console.log("③ よその 学校を 触れない");
ok(/target\.org_id !== orgId/.test(api), "★その学校の 役職か 確かめている");
ok(/見つかりませんでした/.test(api), "★名簿に いない 方には、無いと しか 言わない");

console.log("④ 人が いる 役職を 消せない");
ok(/eq\("post_id", postId\)/.test(api), "★その役職の 人数を 数えている");
ok(/この役職の方がいるので、消せません/.test(api), "★消せない と 言う");
ok(/status: 409/.test(api), "★409 で 返す");

console.log("⑤ ひな型は、押した 人の 手で 作る");
// ★★こちらで 勝手に 作りません（★器の SQL §4）。
ok(/action === "template"/.test(api), "★ひな型を 作る 道が ある");
ok(/もう役職があります/.test(api), "★2度 作らない（★消した ものが 戻らない）");
ok(/はじめの ひな型を 作る/.test(ui), "★1つも 無いときだけ 出す ボタン");
const sql = readRaw("supabase", "2026-09-11-役職とできることの器.sql");
ok(!/insert into public\.org_posts/i.test(sql), "★SQL では 1行も 作っていない");

console.log("⑥ できことは true だけ しまう");
// ★★false を 並べません。★「持っていない」と「false と 書いた」を 1つの 形に します。
ok(/if \(on\) next\[key\] = true; else delete next\[key\];/.test(api),
  "★外したら 消す（★false を 置かない）");

console.log("⑦ 灰色に する。★隠さない（★裁定 §7-4）");
ok(/#A0917F/.test(ui), "★灰色に している");
ok(/CANNOT_GRANT_REASON/.test(ui), "★押すと わけを 出す");
ok(!/display: "none"/.test(ui), "★隠していない");

console.log("⑧ 言葉は tx() で 包む");
// ★★2026-09-11 から の 決まり。★これから 書く ものは ぜんぶ 包みます。
ok(/from "@\/lib\/t"/.test(ui) && /from "@\/lib\/t"/.test(api), "★2つとも 取り寄せている");
ok((ui.match(/tx\(/g) || []).length >= 20, "★画面の 言葉を 包んでいる");
// ★★中に 変数を 入れない。
ok(/tx\("\{n\}人"\)\.replace\("\{n\}", held\)/.test(ui), "★数は replace で 入れる");
ok(!/tx\([^)]*\+/.test(ui + api), "★つないだ 文字を 包んでいない");

console.log("⑧-2 人に 役職を 付ける（★3段目）");
// ★★決まりは 2つ（★裁定 §7-4）。★どちらも サーバで 確かめること。
ok(/action === "assign"/.test(api), "★付ける 道が ある");
ok(/action === "unassign"/.test(api), "★外す 道が ある");
ok(/mayGrantPost\(perms, target\)/.test(api), "★① 付ける 役職を、自分が 渡せるか");
ok(/mayChangePerson\(perms, cur\)/.test(api), "★② いま 付いている 役職を、自分が 触れるか");
// ★★②が 無いと、★自分より 強い 方を 降ろせて しまいます。
ok((api.match(/mayChangePerson\(perms, cur\)/g) || []).length === 2,
  "★付けるときも 外すときも、両方で 確かめている");
ok(/update\(\{ post_id: null \}\)/.test(api), "★外すのは 役職だけ（★人を 消さない）");
const roster = readCode("components", "OpsRoster.jsx");
ok(/mayGrantPost\(myPerms, p\)/.test(roster), "★画面も lib に 尋ねている");
ok(/mayChangePerson\(myPerms, mine\)/.test(roster), "★触れるかも lib に 尋ねている");
ok(/CANNOT_CHANGE_REASON/.test(roster), "★渡せない わけを 出す");
ok(/#A0917F/.test(roster), "★灰色に する。★隠さない");
ok(/posts && posts\.length > 0/.test(roster), "★役職が 無ければ、行を 出さない");

console.log("⑧-3 ★黙って 失敗しない（★2026-09-11・実機の ご報告）");
// ★★0件の ときに、★わけを 出す 場所が ありませんでした。
//   ★★押しても 何も 起きない、に なっていました。
const opsUi = readRaw("components", "OpsPosts.jsx");
const zeroBranch = opsUi.indexOf("{posts.length === 0 ? (");
const msgAt = opsUi.indexOf("{message ? (");
ok(msgAt > 0 && msgAt < zeroBranch, "★わけは、枝の 外に ある（★どの姿でも 見える）");
ok(/送っています…/.test(opsUi), "★押した ことが すぐ 目に 見える");
const vt = readCode("components", "VocalTracker.jsx");
ok(/console\.error\("役職の道が断りました:"/.test(vt), "★断られたら 記録に 残す");
ok(/\$\{res\.status\}/.test(vt), "★番号も 出す（★どこで 止まったか 分かる）");
ok(/console\.error\("名簿を読めませんでした:"/.test(api), "★名簿の 読み落ちを 黙らせない");
ok(/はじめの ひな型は、学校を 作った方が 作れます/.test(api), "★なぜ だめかを 言う");

console.log("⑧-4 ★色を、あとから 上書きされていない");
// ★★TYPE.li は color を 持ちます。★白を 先に 書くと、★黒が 勝ちます。
//   ★実機で「ボタンの 中の 文字が 黒」と ご報告を いただきました。★そのとおりです。
[["OpsPosts", opsUi], ["RecordSheets", readRaw("components", "RecordSheets.jsx")]]
  .forEach(([n, src]) => {
    ok(!/color: "#FFFDF8", \.\.\.TYPE/.test(src),
      `★${n}：白の あとに TYPE を 展開していない`);
  });

console.log("⑨ 生徒の 記録に たどりつかない");
["entries", "throat", "voice_quality", "sleep_hours", "throat_symptoms"].forEach((w) => {
  ok(!ui.includes(w) && !api.includes(w), `★「${w}」を 触っていない`);
});

console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
process.exit(failed === 0 ? 0 : 1);
