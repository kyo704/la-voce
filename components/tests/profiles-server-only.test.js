#!/usr/bin/env node
/**
 * profiles の「サーバの側からだけ変える列」の確かめ（2026-09-05）
 *
 *   出どころ supabase/2026-09-05-profiles-server-only-columns.sql
 *
 *   ★★これは、★流れの検査です。
 *     ★SQL の中の「止める列」と、
 *     ★アプリが実際に書いている列を、★突き合わせます。
 *
 *   ★★片方だけ直すと、★ここが落ちます。それが目的です。
 *     ・止める列をアプリが書きはじめたら → ★本番で保存できなくなります
 *     ・アプリが書くのをやめた列は → ★止める側に足せます
 *
 *   実行  node components/tests/profiles-server-only.test.js
 */

const fs = require("fs");
const path = require("path");
const { readRaw, readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}

// ---------------------------------------------------------------------------
// ★アプリが profiles に書いている列を、★数え上げます
//
//   ★★中かっこは、数えて閉じます。★正規表現で切らないこと。
//     ★このリポジトリで、★何度も同じところを壊しました。
// ---------------------------------------------------------------------------
function writtenColumns() {
  const cols = new Set();
  const viaVariable = [];
  for (const file of ["components/VocalTracker.jsx", "components/MinorConsentGate.jsx"]) {
    const s = fs.readFileSync(path.join(ROOT, file), "utf-8");
    const re = /from\("profiles"\)/g;
    let m;
    while ((m = re.exec(s)) !== null) {
      const window = s.slice(m.index + m[0].length, m.index + m[0].length + 900);
      const u = window.indexOf(".update(");
      if (u === -1) continue;
      const rest = window.slice(u + ".update(".length).replace(/^\s+/, "");
      if (rest.startsWith("{")) {
        let depth = 0;
        let end = -1;
        for (let i = 0; i < rest.length; i += 1) {
          if (rest[i] === "{") depth += 1;
          else if (rest[i] === "}") { depth -= 1; if (depth === 0) { end = i; break; } }
        }
        if (end === -1) continue;
        const body = rest.slice(1, end);
        const kr = /(?:^|[,{\s])([a-z_][a-z0-9_]*)\s*:/g;
        let k;
        while ((k = kr.exec(body)) !== null) cols.add(k[1]);
      } else {
        const name = rest.match(/^([A-Za-z_][A-Za-z0-9_]*)\s*\)/);
        if (name) viaVariable.push(name[1]);
      }
    }
  }
  return { cols, viaVariable };
}

// ★SQL の中で「止める」と書いてある列を拾います。
function guardedColumns(file) {
  const sql = readRaw("supabase", file || "2026-09-05-profiles-server-only-columns.sql");
  const out = new Set();
  const re = /guarded\s*:=\s*'([a-z_][a-z0-9_]*)'/g;
  let m;
  while ((m = re.exec(sql)) !== null) out.add(m[1]);
  return out;
}

console.log("\n① ★止める列が、決まっていること");
const guarded = guardedColumns();
// ★2026-09-05 の後半で、reauth_at を足した SQL です。★関数ごと入れ替えます。
const guardedLater = guardedColumns("2026-09-05-reauth-at.sql");
const guardedAll = new Set([...guarded, ...guardedLater]);
ok(`★止める列がある（${guarded.size} 列）`, guarded.size > 0);
// ★★これがいちばん重い列です。★外さないこと。
//   ★app/admin/page.js は、profiles.is_admin だけを見て通し、
//   ★その先で service_role を使って全員の一覧を出しています。
ok("★★is_admin を止めている（★管理画面の鍵です）", guarded.has("is_admin"));
ok("★deleted_at を止めている（★30日の猶予を飛ばせないように）", guarded.has("deleted_at"));
ok("★teacher_beta_access を止めている", guarded.has("teacher_beta_access"));
// ★★2026-09-05 追加。★本人が書けると、確かめが意味を失います。
//   ★確かめずに、書き出しも削除もできてしまいます。
ok("★★reauth_at を止めている", guardedAll.has("reauth_at"));

console.log("\n② ★★止める列を、アプリが書いていないこと");
const { cols, viaVariable } = writtenColumns();
ok(`★アプリの書き込みを数えられた（${cols.size} 列）`, cols.size > 10);
const collide = [...guardedAll].filter((c) => cols.has(c));
// ★★ここが落ちたら、★本番でその保存が失敗します。
//   ★引き金を直すか、★アプリの側を route に移すか、どちらかです。
ok(`★ぶつかっている列が無い${collide.length ? "（★" + collide.join(" ") + "）" : ""}`,
  collide.length === 0);

console.log("\n③ ★変数で渡している所を、見落としていないこと");
// ★update(patch) の形は、列名が見えません。★中身を作る関数を、名前で追います。
//   ★★この一覧が増えたら、★その関数が止める列を入れていないか、見てください。
console.log("    " + [...new Set(viaVariable)].join(" "));
const builders = ["ageBandToProfilePatch", "answerToProfilePatch", "skipToProfilePatch",
  "adoptSignupAnswer", "adoptSignupOccupation"];
const src = readRaw("components", "VocalTracker.jsx");
const builderText = builders.map((b) => {
  const i = src.indexOf(`function ${b}`);
  return i === -1 ? "" : src.slice(i, i + 1500);
}).join("\n") + readRaw("lib", "ageGate.js");
const fromBuilders = [...guardedAll].filter((c) => new RegExp(`\\b${c}\\s*:`).test(builderText));
ok(`★patch を作る関数も、止める列を入れていない${fromBuilders.length ? "（★" + fromBuilders.join(" ") + "）" : ""}`,
  fromBuilders.length === 0);

console.log("\n④ ★止め方が、正しいこと");
const sql = readRaw("supabase", "2026-09-05-profiles-server-only-columns.sql");
// ★★service_role を止めると、route も cron も動かなくなります。
ok("★service_role と postgres は通している",
  /current_user not in \('anon', 'authenticated'\)/.test(sql));
// ★★黙って無視しないこと。★アプリが「保存できた」と思い込みます。
ok("★止めるときは、例外を投げている（★黙って通さない）",
  /raise exception 'SERVER_ONLY_COLUMN/.test(sql));
ok("★どの列で止めたかを、返している", /SERVER_ONLY_COLUMN: %/.test(sql));
// ★is distinct from を使うこと。★<> だと、null との比較で素通りします。
ok("★null でも比べられる形（is distinct from）",
  !/new\.\w+\s*<>\s*old\./.test(sql) && /is distinct from/.test(sql));
ok("★何度実行してもよい（drop trigger if exists がある）",
  /drop trigger if exists/.test(sql));

console.log("\n⑤ ★anon を、profiles から剥がしていること");
// ★★TRUNCATE には RLS が効きません。★RLS が守らない、唯一の権限です。
ok("★anon から、丸ごと剥がしている", /revoke all on public\.profiles from anon/.test(sql));
ok("★authenticated から TRUNCATE を剥がしている",
  /revoke truncate on public\.profiles from authenticated/.test(sql));
// ★★UPDATE と SELECT は、今日は触らないこと。★何が壊れるか分かりません。
// ★★禁止語の検査は、★必ずコメントを外した本文に対して行うこと。
//   ★§5 に「別の日にすること」として同じ文を書いてあります。
//   ★生のまま検査すると、★自分の説明文で落ちます（このセッションで5回め）。
ok("★authenticated の UPDATE は、まだ剥がしていない",
  !/revoke update on public\.profiles from authenticated;/.test(
    readCode("supabase", "2026-09-05-profiles-server-only-columns.sql")));

console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
process.exit(fail === 0 ? 0 : 1);
