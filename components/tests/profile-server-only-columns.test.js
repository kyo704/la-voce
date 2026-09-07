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
                   "deleted_at", "reauth_at", "is_internal",
                   // ★★2026-09-07 追加。★ポイントを、自分で増やせないように。
                   "character_points_spent"]) {
    ok(`「${c}」が入っている`, LIST.includes(c));
  }

  console.log("■ ①トリガーと、そろっているか");
  // ★★2026-09-08 に is_internal、★2026-09-07 に character_points_spent を
  //   ★足しました。★これで8列そろいます。
  //   ★見るのは、いちばん新しいトリガーの SQL です。
  const trig = readRaw("supabase", "2026-09-08-profiles-サーバ側だけの列をトリガーで守る.sql");
  const guarded = [...trig.matchAll(/new\.([a-z_]+) is distinct from/g)].map((x) => x[1]);
  const notGuarded = LIST.filter((c) => !guarded.includes(c));
  ok("一覧の列が、すべてトリガーに入っている", notGuarded.length === 0,
    "入っていないもの: " + (notGuarded.join(", ") || "なし"));
  const extraGuard = guarded.filter((c) => !LIST.includes(c));
  ok("トリガーにだけ在る列が、無い", extraGuard.length === 0, extraGuard.join(", "));
  ok("引き金を、付け直している",
    /create trigger profiles_guard_server_only_columns/.test(trig));

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

  console.log("■ ③画面の側から、書いていないか");
  // ★★板が2枚あっても、★画面が書こうとしていれば、★保存がその場で失敗します。
  //   ★だから「守られている」だけでなく、★「書こうとしていない」も見ます。
  //   ★★コメントを外してから調べます。★この検査の説明文で落ちないように。
  const CLIENT_FILES = fs.readdirSync(path.join(ROOT, "components"))
    .filter((f) => f.endsWith(".jsx"));
  // ★★表を見ずに列の名前だけで探すと、★別の表を拾います。
  //   ★2026-09-07、★article_notes の deleted_at を、profiles と読み違えました。
  //   ★★だから、★from("profiles") の直後だけを見ます。
  function profileWriteChunks(code) {
    const out = [];
    let i = code.indexOf('from("profiles")');
    while (i >= 0) {
      out.push(code.slice(i, i + 600));
      i = code.indexOf('from("profiles")', i + 1);
    }
    return out;
  }
  for (const col of LIST) {
    const writers = CLIENT_FILES.filter((f) => {
      const code = readCode("components", f);
      return profileWriteChunks(code).some((chunk) =>
        new RegExp("update\\(\\s*\\{[^}]*\\b" + col + "\\b\\s*:").test(chunk));
    });
    ok(`画面から「${col}」を書いていない`, writers.length === 0, writers.join(", "));
  }
  // ★★この探し方そのものを、確かめます。
  //   ★何も見つけられない探し方は、★いつでも「合格」を返します。
  const canary = 'from("profiles").update({ is_admin: true })';
  ok("★この探し方は、実際に見つけられる",
    profileWriteChunks(canary).some((c) => /update\(\s*\{[^}]*\bis_admin\b\s*:/.test(c)));

  console.log("■ ポイントを引くのは、サーバの道だけか");
  const buyPath = path.join(ROOT, "app", "api", "character", "buy", "route.js");
  ok("受け取る道がある（app/api/character/buy）", fs.existsSync(buyPath));
  if (fs.existsSync(buyPath)) {
    const buy = readCode("app", "api", "character", "buy", "route.js");
    ok("本人を確かめてから動く", buy.indexOf("getUserWithTimeout") < buy.indexOf("character_inventory"));
    ok("値段を、受け取っていない（サーバ側で引く）",
      /SHOP_ITEMS\.find\(/.test(buy) && !/body\.cost|body\.points|body\.price/.test(buy));
    ok("admin の鍵を使っている", /createAdminClient/.test(buy));
    ok("書き替えるのは、確かめた本人の行だけ", /\.eq\("id", user\.id\)/.test(buy));
    // ★★品物を先に入れること。★逆だと、引かれたのに品物が無い日が来ます。
    ok("持ち物を入れてから、ポイントを引いている",
      buy.indexOf('.from("character_inventory")\n    .insert') > 0
      || buy.indexOf("character_inventory") < buy.lastIndexOf("character_points_spent"));
  }
  // ★画面は、fetch でこの道を呼んでいるか
  const vt = readCode("components", "VocalTracker.jsx");
  ok("画面が、その道を呼んでいる", /\/api\/character\/buy/.test(vt));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
