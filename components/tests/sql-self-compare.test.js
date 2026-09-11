#!/usr/bin/env node

// ============================================================================
// 決まりの 式に、★「x.列 = 列」の 形が 残って いないこと
//
//   ★出どころ 坂本さんの ご指摘（★2026-09-11）
//     「NOT (EXISTS (SELECT 1 FROM memberships m WHERE (m.org_id = m.org_id)))
//       これは、m.org_id = m.org_id、という、常にtrueになる、自己参照の、条件です。」
//
//   ★★何が 起きるか
//     ★決まりの 中で、★同じ 表を もう一度 引く とき、
//     ★★外の 行を 指す つもりの 列名が、★**中の 別名**に 吸われます。
//     ★★`where m.org_id = org_id` → `m.org_id = m.org_id` ＝ いつでも 真。
//
//   ★★この 帳面に、★同じ 形が **5か所** ありました。
//     ★1つ 見つけた とき、★探して いませんでした。★私の 落ち度です。
//     ★★作業指示 §6 に「同じ形が ほかに ないか grep」と 書いて あります。
//
//   ★★この 見張りは、★SQL の 字を 読みます。
//     ★★台帳の いまの 姿は 見て いません。★そこは SQL で 数えます。
// ============================================================================

const fs = require("fs");
const path = require("path");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const dir = path.join(__dirname, "..", "..", "supabase");
const files = fs.readdirSync(dir).filter((f) => f.endsWith(".sql"));

console.log("① 「x.列 = 列」の 形が 無いこと（★" + files.length + " 本）");

// ★★探すのは、★中の 別名つきの 列と、★裸の 同じ 列名を くらべて いる ところ。
//   ★れい　where m.org_id = org_id
//   ★★覚え書き（-- …）は 外します。★説明で 引いて いる ぶんに つまずかない ため。
const BAD = /\b([a-z])\.([a-z_]+)\s*=\s*(?!\1\.)([a-z_]+)\b/g;

const hits = [];
files.forEach((f) => {
  const raw = fs.readFileSync(path.join(dir, f), "utf8");
  raw.split("\n").forEach((line, i) => {
    if (/^\s*--/.test(line)) return;
    let m;
    BAD.lastIndex = 0;
    while ((m = BAD.exec(line))) {
      // ★★左右の 列名が 同じ ときだけ。★ちがう 名前なら ふつうの 結び です。
      if (m[2] !== m[3]) continue;
      // ★★表の 名前が 付いて いれば よいのです（memberships.org_id）。
      if (new RegExp("\\.\\s*" + m[3] + "\\b").test(line.slice(m.index + m[0].length - m[3].length - 3))) continue;
      hits.push(f + ":" + (i + 1) + "　" + line.trim().slice(0, 90));
    }
  });
});
hits.forEach((h) => console.log("    ✗ " + h));
t(hits.length === 0, "★1つも 残って いない（" + hits.length + "）");

console.log("\n② 直した ところに、★表の 名前が 付いて いること");
[
  ["migration_org_insert_policies.sql", "m.org_id = memberships.org_id"],
  ["URGENT_fix_owner_self_promotion.sql", "m.org_id = memberships.org_id"],
  ["migration_fix_memberships_update_policy.sql", "m.org_id = memberships.org_id"],
  ["migration_protect_owner_role.sql", "m.org_id = memberships.org_id"],
  ["migration_role_rank_no_self_promotion.sql", "m.org_id = memberships.org_id"]
].forEach(([f, want]) => {
  const p = path.join(dir, f);
  const has = fs.existsSync(p) && fs.readFileSync(p, "utf8").includes(want);
  t(has, "★" + f);
});

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
