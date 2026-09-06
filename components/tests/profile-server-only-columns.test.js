// ============================================================================
// profiles の「サーバの側だけ」の列が、2枚とも守られているか（2026-09-08 の作業）
//
//   ★★守りは2枚あります（Opus）。
//     「★ポリシーの不在は1枚の板。★権限の剥奪と合わせて2枚にすること。」
//     ① トリガー　　… 書こうとしたら、止める
//     ② 列ごとの権限… そもそも UPDATE を渡さない
//
//   ★★片方だけ直して、もう片方を忘れる、をここで止めます。
//     ★一覧の正は lib/profileServerOnlyColumns.js です。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readRaw, readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  const src = fs.readFileSync(path.join(ROOT, "lib", "profileServerOnlyColumns.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const LIST = m.SERVER_ONLY_COLUMNS;

  console.log("■ 一覧そのもの");
  ok("空ではない", LIST.length > 0);
  ok("重なりがない", LIST.length === new Set(LIST).size);
  ok("凍らせてある", Object.isFrozen(LIST));
  for (const c of ["is_admin", "is_tester", "cohort", "teacher_beta_access",
                   "deleted_at", "reauth_at", "is_internal"]) {
    ok(`「${c}」が入っている`, LIST.includes(c));
  }

  console.log("■ ①トリガー（既に当ててあるもの）と、そろっているか");
  const trig = readRaw("supabase", "2026-09-05-reauth-at.sql");
  const guarded = [...trig.matchAll(/new\.([a-z_]+) is distinct from/g)].map((x) => x[1]);
  const notGuarded = LIST.filter((c) => !guarded.includes(c));
  // ★★is_internal は、★トリガーにまだ入っていません（2026-09-06 に気づきました）。
  //   ★列ごとの権限のほうで先に塞ぎ、★トリガーはあとで足します。
  //   ★★ここに残しているのは、★忘れないためです。
  ok("トリガーに入っていない列は、is_internal だけ",
    notGuarded.length === 1 && notGuarded[0] === "is_internal",
    "入っていないもの: " + (notGuarded.join(", ") || "なし"));

  console.log("■ ②列ごとの権限の SQL と、そろっているか");
  const sql = readRaw("supabase", "2026-09-08-profiles-列ごとの権限.sql");
  const inSql = [...sql.matchAll(/'([a-z_]+)'/g)].map((x) => x[1]);
  const missing = LIST.filter((c) => !inSql.includes(c));
  ok("一覧の列が、すべて SQL に出てくる", missing.length === 0, missing.join(", "));
  // ★★逆も見ます。★SQL にだけ在る列名が混ざっていないこと。
  const colLike = inSql.filter((v) => /_/.test(v) && v !== "public" && v !== "profiles");
  const extra = [...new Set(colLike)].filter((c) => !LIST.includes(c));
  ok("SQL にだけ在る列名が、混ざっていない", extra.length === 0, extra.join(", "));

  console.log("■ SQL の作法");
  // ★★戻らないので、使わないこと（2026-09-05 の事故）。
  // ★★禁じ手の検査は、★コメントを外してから行うこと。
  //   ★この SQL は、★見出しに「BEGIN / ROLLBACK は使っていません」と
  //   ★書いてあります。★生のまま調べると、★自分の説明文で落ちます。
  //   ★★CLAUDE.md に、★同じ罠が2度あったと書かれています。
  const sqlCode = readCode("supabase", "2026-09-08-profiles-列ごとの権限.sql");
  ok("BEGIN / ROLLBACK に頼っていない",
    !/\bbegin\s*;/i.test(sqlCode) && !/\brollback\b/i.test(sqlCode));
  // ★★先に外さないと、広いほうが勝ちます。
  const iRevoke = sql.indexOf("revoke update on public.profiles");
  const iGrant = sql.indexOf("grant update (%s)");
  ok("剥奪が、付与より先にある", iRevoke >= 0 && iGrant > iRevoke,
    "revoke " + iRevoke + " / grant " + iGrant);
  // ★★列を手で並べていないこと。★増えたときに追いつけません。
  ok("渡す列は、その場で数えている", /information_schema\.columns/.test(sql));
  ok("確かめ方が、両側そろっている",
    /渡ってしまっている列/.test(sql) && /渡っていない列/.test(sql));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
