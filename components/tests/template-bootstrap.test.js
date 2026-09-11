#!/usr/bin/env node

// ============================================================================
// ★はじめの 1人が、★行き止まりに ならないこと
//
//   ★出どころ 2026-09-11、★⑦（はじめの1人）の 確かめで 見つかった 穴。
//     ★★template は 通りました（200・made:10）。
//     ★★けれど その方は、★作った 10の どれも 名乗れませんでした。
//       ★mayGrantPost が、★学校ぜんぶに かかる できことを 落とすためです。
//       ★名乗れるのは 教授・准教授・講師だけ。
//     ★★新しい 学校が、★学長の いない まま 始まっていました。
//
//   ★★直し ── template が 10を 作る その場で、★作った方に「学長」を 付けます。
//     ★★力は 増えません。★その方は たった今 10すべてを 決められたのですから。
// ============================================================================

const { readRaw, readCode } = require("./_source");

let ok = 0, ng = 0;
const t = (c, l) => { if (c) { console.log("  ✓ " + l); ok++; } else { console.log("  ✗ " + l); ng++; } };

const raw = readRaw("app", "api", "org", "posts", "route.js");
const code = readCode("app", "api", "org", "posts", "route.js");

console.log("① 行き止まりが 直っていること");
t(/insert\(rows\)\.select\("id, name"\)/.test(code), "★作った 役職の id を 受け取っている");
t(/TEMPLATE_POSTS\[0\]\.name/.test(code), "★いちばん 上の 役職を 探している");
t(/\.update\(\{ post_id: top\.id \}\)/.test(code), "★作った方に 付けている");
t(/made: rows\.length, mine/.test(code), "★付いたかどうかを 返している");

console.log("\n② 上書きしないこと（★黙って 消さない）");
t(/!member\.post_id/.test(code), "★すでに 役職が ある 方には 付けない");

console.log("\n③ 自分にだけ 付けること（★他人に 付けない）");
const seg = raw.slice(raw.indexOf('action === "template"'), raw.indexOf('action === "add"'));
t(/\.eq\("user_id", user\.id\)/.test(seg), "★付け先は 自分（user.id）");
t(!/body\.userId/.test(seg), "★要求の 中の 誰かに 付けない");
t(/\.eq\("org_id", orgId\)/.test(seg), "★その学校の 名簿に 限っている");

console.log("\n④ 10が できたことは 巻き戻さないこと");
t(/if \(!e2\) mine = top\.name/.test(code), "★付けられなくても 10は そのまま");

console.log("\n⑤ 門は そのまま（★役職の 無い owner だけ）");
t(/return member\.role === "owner"/.test(code), "★ひな型は 学校を 作った方だけ");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
