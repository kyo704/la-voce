// 控えの片づけ（30日）— 順番と、消さない条件（2026-09-03）
//
//   ★消す仕掛けは、条件より★順番のほうが大事です。
//     検査に通らなかった日に古い控えを消すと、
//     ★「新しいのが壊れているのに、古いのを捨てた」が起きます。
const fs = require("fs");
const path = require("path");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const 根 = path.join(__dirname, "..", "..");
const sh = fs.readFileSync(path.join(根, "scripts", "backup-dump.sh"), "utf8");

console.log("\n① 日数が決まっていること");
ok("RETENTION_DAYS がある", /^RETENTION_DAYS=\d+$/m.test(sh));
ok("★30日である", /^RETENTION_DAYS=30$/m.test(sh));

console.log("\n② ★順番（これがいちばん大事）");
const 検査 = sh.indexOf("node scripts/backup-verify.js");
const 片づけ = sh.indexOf("古い控えの片づけ");
const 削除 = sh.indexOf("rm -f \"$f\"");
ok("検査を走らせている", 検査 !== -1);
ok("★片づけは、検査より後にある", 検査 !== -1 && 片づけ !== -1 && 検査 < 片づけ);
ok("★削除も、検査より後にある", 検査 !== -1 && 削除 !== -1 && 検査 < 削除);
ok("★set -e が効いている（検査が落ちたら止まる）", /^set -euo pipefail$/m.test(sh));
// ★取得そのものより後であることも見ます。取る前に消してはいけません。
const 取得 = sh.indexOf('"$PGBIN/pg_dump"');
ok("★片づけは、控えを取ったあとにある", 取得 !== -1 && 取得 < 片づけ);

console.log("\n③ ★消さない条件");
ok("いま作ったものは避ける", /\[ "\$f" = "\$OUT" \] && continue/.test(sh));
ok("★名前から日付が読めないものは残す", /名前から日付が読めないので残します/.test(sh));
ok("日付が計算できなければ何もしない", /日付の計算ができませんでした。★何も消しません/.test(sh));
// ★ファイルの更新時刻ではなく、名前の日付を見ること。
//   写したり戻したりすると更新時刻は変わりますが、名前は変わりません。
ok("★-mtime を使っていない", !/-mtime/.test(sh));
ok("名前から日付を取り出している", /sed -n 's\/\^woolsong-/.test(sh));

console.log("\n④ 黙って消さないこと");
ok("消したものの名前を出す", /消しました: \$f/.test(sh));
ok("★0件でも件数を出す（「やった」と「やって0件」は別の事実）",
  /片づけた数: \$\{REMOVED\}/.test(sh));

console.log("\n⑤ 文法");
const { execFileSync } = require("child_process");
let 文法 = true;
try { execFileSync("bash", ["-n", path.join(根, "scripts", "backup-dump.sh")]); }
catch { 文法 = false; }
ok("bash -n が通る", 文法);

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
