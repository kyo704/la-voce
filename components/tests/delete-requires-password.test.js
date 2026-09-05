#!/usr/bin/env node
/**
 * アカウントの削除に、パスワードを要求する（2026-08-30）
 *
 * 出典 docs/lavoce-判断の回答-年齢確認とアカウント削除-20260830.md §2
 *
 * ★なぜ確認の入力だけでは足りないか
 *   これまでの確認は「登録メールアドレス」か「削除します」でした。
 *   ★どちらも画面に出ています。端末を一時的に触れる人なら、誰でも通せます。
 *   確認の入力は「間違えて押していないか」を確かめるもので、
 *   ★「本人かどうか」は確かめていません。目的が違います。
 *
 * ★猶予つきの削除にも要求します。
 *   猶予中でも severConnections がすぐ走り、先生との共有は戻りません。
 *   「今すぐ」だけ守っても意味がありません。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const route = readCode("app/api/account/delete", "route.js");
const vt = readCode("components", "VocalTracker.jsx");
const tr = readRaw("lib", "translations.js");

console.log("=== ★サーバ側で確かめる ===");
assertTrue(/signInWithPassword\(\{/.test(route), "パスワードを検証している");
// ★★2026-09-05、★5分以内に確かめてあれば、二度聞かない形にしました（Opus の指定）。
//   ★書き出してすぐ削除する、といったときのためです。
//   ★★覚えているのはサーバです（profiles.reauth_at）。★画面の言い分は聞きません。
assertTrue(/if \(!password && !alreadyConfirmed\) \{/.test(route),
  "★パスワードも、5分以内の確かめも無ければ、その時点で止める");
assertTrue(/reauthStillValid\(/.test(route), "★確かめの時刻は、1か所の決めで見る");
assertTrue(/reauth_at/.test(route), "★確かめの時刻を、サーバから読んでいる");
assertTrue(/status: 401/.test(route), "合わなければ 401");

console.log("\n=== ★削除より前に確かめる（順番） ===");
const pwAt = route.indexOf("signInWithPassword");
const purgeAt = route.indexOf("purgeAccount(admin");
const severAt = route.indexOf("severConnections(admin");
const adminAt = route.indexOf("createAdminClient()");
assertTrue(pwAt > 0 && purgeAt > pwAt, "★purgeAccount より前に確かめる");
assertTrue(severAt > pwAt, "★severConnections より前に確かめる（猶予つきでも共有は戻らない）");
assertTrue(adminAt > pwAt, "★service role のクライアントを作るより前に確かめる");

console.log("\n=== ★いまのセッションを壊さない ===");
assertTrue(/createPlainClient\(/.test(route), "セッションを持たないクライアントで確かめる");
assertTrue(/persistSession: false/.test(route), "★セッションを保存しない");
assertTrue(!/createClient\(\)\.auth\.signInWithPassword/.test(route),
  "★cookie 付きのクライアントで検証していない（いまのセッションを書き換えてしまう）");

console.log("\n=== ★理由を細かく分けない ===");
assertTrue(/パスワードが一致しません/.test(readRaw("app/api/account/delete", "route.js")),
  "合わないときの文が1つだけ");
assertTrue(!/ユーザーが見つかりません|存在しません/.test(route),
  "★「このメールは存在する」を漏らす文を返していない");

console.log("\n=== 画面側 ===");
assertTrue(/const \[deletePassword, setDeletePassword\] = useState\(""\)/.test(vt), "パスワードの欄がある");
assertTrue(/type="password"/.test(vt), "★伏せ字で入力する");
assertTrue(/password: deletePassword/.test(vt), "送信に含めている");
// ★2つのボタン（猶予つき・今すぐ）とも、パスワードが無ければ押せないこと
const disabled = (vt.match(/disabled=\{deleteStatus === "working" \|\| !deleteConfirmOk \|\| !deletePassword\}/g) || []);
assertTrue(disabled.length >= 2, `★猶予つきと今すぐ、両方のボタンで要求している（${disabled.length}件）`);
// ★手元に残さないこと
assertTrue(/setDeletePassword\(""\)/.test(vt), "★送ったら手元から消す");
const sendAt = vt.indexOf("const data = await res.json()");
assertTrue(/setDeletePassword\(""\)/.test(vt.slice(sendAt, sendAt + 300)),
  "★成否にかかわらず消している");

console.log("\n=== 文言（9言語） ===");
["deletePasswordPrompt", "deletePasswordPlaceholder"].forEach((k) => {
  const m = tr.match(new RegExp(`\\n  ${k}: \\{([^}]*)\\}`));
  const n = m ? (m[1].match(/\w+: "/g) || []).length : 0;
  assertTrue(n === 9, `${k} が9言語ある（${n}）`);
});

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
