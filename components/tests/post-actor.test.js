// STRIP: A（振る舞い）
//
// ★役職を 変えた「誰が」を 残す（★裁定173 ／ 3点セットの ㋑-3）。
//
//   ★★★`app/api/` の どこにも `.update({ post_id` を 書かない こと。
//     ★★直に 書くと、★引き金の 中の `actor_id()` が **null** に なります。
//     ★★`supabase-js` は 1つの 呼びを 1つの 取引で 走らせます。
//       ★別の 呼びで `set_config('app.actor_id', …)` を しても、★印は もう 消えて います。
//       ★★2026-09-23、★試しの 台帳で 並べて 確かめました（★別々＝null ／ 同じ取引＝残る）。
//   ★★だから、★`set_member_post`（★中で 印を 置いてから 変える）だけ を 使います。
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");
const ROOT = path.resolve(__dirname, "..", "..");

let 数 = 0, 落 = 0;
const t = (名, ok, 註) => { 数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "✓" : "✗"} ${名}${註 ? "  -- " + 註 : ""}`); };

function 集める(dir, out) {
  for (const f of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name);
    if (f.isDirectory()) 集める(p, out);
    else if (f.name.endsWith(".js") || f.name.endsWith(".jsx")) out.push(p);
  }
  return out;
}

const 道 = 集める(path.join(ROOT, "app", "api"), []);
console.log("=== 一 直に 書いて いない ===");
{
  const 当 = [];
  for (const p of 道) {
    const s = stripComments(fs.readFileSync(p, "utf8"));
    if (/\.update\(\{\s*post_id/.test(s)) 当.push(path.relative(ROOT, p));
  }
  t("★`app/api/` に `.update({ post_id` が 0件", 当.length === 0, 当.join(" / "));
}

console.log("\n=== 二 道を 通って いる ===");
{
  const p = path.join(ROOT, "app/api/org/posts/route.js");
  const s = stripComments(fs.readFileSync(p, "utf8"));
  const n = (s.match(/rpc\("set_member_post"/g) || []).length;
  t("★`set_member_post` を 3か所で 呼んで いる", n === 3, `${n}か所`);
  t("★「誰が」を 必ず 渡して いる",
    (s.match(/p_actor:\s*user\.id/g) || []).length === n, "p_actor: user.id");
}

console.log("\n=== 三 較正 ── ★わざと 1件 作ったら 見つかる ===");
{
  const にせ = 'const x = await admin.from("memberships").update({ post_id: null });';
  t("★直の 書き方を 見つけられる", /\.update\(\{\s*post_id/.test(stripComments(にせ)));
  const 註 = '// ★むかしは .update({ post_id: null }) と 書いて いました';
  t("★註の 中は 見つけない", !/\.update\(\{\s*post_id/.test(stripComments(註)));
}

console.log(`\n  ${数 - 落} / ${数}`);
process.exit(落 ? 1 : 0);
