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

console.log("⑨ 生徒の 記録に たどりつかない");
["entries", "throat", "voice_quality", "sleep_hours", "throat_symptoms"].forEach((w) => {
  ok(!ui.includes(w) && !api.includes(w), `★「${w}」を 触っていない`);
});

console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
process.exit(failed === 0 ? 0 : 1);
