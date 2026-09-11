#!/usr/bin/env node
const { readRaw, readCode } = require("./_source");

const raw = readRaw("components", "VocalTracker.jsx");
const code = readCode("components", "VocalTracker.jsx");
let failed = 0;

function ok(condition, label) {
  if (condition) console.log("  ✓ " + label);
  else {
    console.log("  ✗ " + label);
    failed++;
  }
}

console.log("① パスワード変更の状態と処理");
ok(/const \[passwordPanel, setPasswordPanel\] = useState\(false\)/.test(code), "変更欄の開閉状態を持つ");
ok(/async function submitPasswordChange\(\)/.test(code), "変更処理がコンポーネントの関数として存在する");
ok(/supabase\.auth\.updateUser\(\{ password: newPasswordInput \}\)/.test(code), "Supabase Authのパスワード更新を使う");
ok(/newPasswordInput\.length < 8 \|\| newPasswordInput !== newPasswordInput2\) return/.test(code), "短い値と不一致を送信しない");
ok(/setNewPasswordInput\(""\);\s*setNewPasswordInput2\(""\);/.test(code), "送信後にパスワード入力を消す");
ok(/パスワードを変更できませんでした/.test(code) && /パスワードを変更しました/.test(code), "成功と失敗を画面へ知らせる");

console.log("\n② パスワード変更UI");
ok(/name="new-password"/.test(raw) && /name="new-password-confirm"/.test(raw), "新しいパスワードを2回入力する");
ok(/8文字以上にしてください/.test(raw) && /2つのパスワードが、そろっていません/.test(raw), "入力エラーを表示する");
ok(/disabled=\{passwordBusy[\s\S]*?newPasswordInput\.length < 8[\s\S]*?newPasswordInput !== newPasswordInput2\}/.test(raw), "条件が揃うまで変更ボタンを無効にする");
ok(/<button type="button" onClick=\{\(\) => \{ setPasswordPanel\(true\)/.test(raw)
  && /パスワードを変える/.test(raw), "アカウント欄から変更を開ける");
ok(/setPasswordPanel\(false\)[\s\S]*?setNewPasswordInput\(""\)[\s\S]*?setNewPasswordInput2\(""\)/.test(raw), "やめる操作で入力を消す");

console.log("\n③ アカウント一覧の配線");
ok(/ACCOUNT_ROWS\.map\(\(label\) =>/.test(raw), "アカウント行を操作可能な形へ変換する");
ok(/label === "パスワードを 変える"[\s\S]*?openAccountAction\("password"\)/.test(raw), "パスワード変更行を変更欄へつなぐ");
ok(/label === "ログアウト"[\s\S]*?onClick: handleSignOut/.test(raw), "ログアウト行を維持する");

process.exit(failed ? 1 : 0);
