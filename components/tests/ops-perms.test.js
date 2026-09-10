// ============================================================================
// 役職と「できること」── 見張り（★権限の 作り直し）
//
//   ★出どころ 裁定-9月10日夜の7点（役職への一本化ほか）.md §7
//            見本 00-動く見本（さわれる・全画面）.html の var PERM / var POSTS
//
//   ★★いちばん 大事なのは ①です。
//     ★lib に 書き写した 14 と 10 が、★見本と 1文字も ずれていないこと。
//     ★★書き写しは ずれます。★だから 毎回 見本と くらべます。
// ============================================================================

const path = require("path");
const fs = require("fs");
const { readCode, readRaw, ROOT } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) console.log("  ok  " + label);
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const src = readRaw("lib", "opsPerms.js");
  const P = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const mihon = fs.readFileSync(
    path.join(ROOT, "docs/design/pack-final/00-動く見本（さわれる・全画面）.html"), "utf8");

  console.log("① 見本と、1文字も ずれていない");
  const pi = mihon.indexOf("var PERM=[");
  const permBody = mihon.slice(pi, mihon.indexOf("];", pi));
  const mPerm = [...permBody.matchAll(/\['([a-z_]+)','([^']+)',([01])\]/g)]
    .map((m) => ({ key: m[1], label: m[2], schoolWide: m[3] === "1" }));
  ok(mPerm.length === 14, "★見本の できことは 14（いまは " + mPerm.length + "）");
  ok(P.PERMS.length === mPerm.length, "★数が 同じ");
  mPerm.forEach((m, i) => {
    const mine = P.PERMS[i] || {};
    ok(mine.key === m.key, `★${i + 1}番目の 鍵（${m.key}）`);
    ok(mine.label === m.label, `★${m.key} の 言葉が 同じ`);
    ok(mine.schoolWide === m.schoolWide,
      `★${m.key} の「学校ぜんぶか」が 同じ（${m.schoolWide}）`);
  });

  console.log("② ひな型の 10 も、見本と 同じ");
  const oi = mihon.indexOf("var POSTS=[");
  const postBody = mihon.slice(oi, mihon.indexOf("];", oi));
  const mPosts = [...postBody.matchAll(/\{n:'([^']+)',base:'([a-z]+)',p:\{([^}]*)\}\}/g)]
    .map((m) => ({ name: m[1], perms: [...m[3].matchAll(/([a-z_]+):1/g)].map((x) => x[1]) }));
  ok(mPosts.length === 10, "★見本の 役職は 10");
  ok(P.TEMPLATE_POSTS.length === mPosts.length, "★数が 同じ");
  mPosts.forEach((m, i) => {
    const mine = P.TEMPLATE_POSTS[i] || {};
    ok(mine.name === m.name, `★${i + 1}番目の 名前（${m.name}）`);
    const a = [...(mine.perms || [])].sort().join(",");
    const b = [...m.perms].sort().join(",");
    ok(a === b, `★${m.name} の できことが 同じ`);
  });

  console.log("③ タブは できことから 決まる（★裁定 §7-3）");
  ok(P.TAB_RULES.length === 7, "★タブは 7つ（★門下を 足しました）");
  ok(P.TAB_RULES.map((t) => t.label).join("／")
    === "ホーム／日程／名簿／門下／行事／連絡／設定", "★裁定の 順と 同じ");
  // ★★1つも 持っていなければ、★1つも 出ません。
  ok(P.tabsForPerms([]).length === 0, "★何も 持っていなければ、タブは 0");
  ok(P.mayEnterOpsByPerms([]) === false, "★運営に 入れない");
  // ★★先生（教授）は、★これまで 1歩も 入れませんでした。
  const kyoju = P.TEMPLATE_POSTS.find((p) => p.name === "教授");
  ok(P.mayEnterOpsByPerms(kyoju.perms), "★教授が 運営に 入れる（★前は 入れなかった）");
  ok(P.tabsForPerms(kyoju.perms).some((t) => t.key === "monka"), "★教授に 門下が 出る");
  ok(!P.tabsForPerms(kyoju.perms).some((t) => t.key === "roster"), "★教授に 名簿は 出ない");

  console.log("④ 渡せる／渡せないの 決まりは 1本（★裁定 §7-4）");
  const gakkacho = P.TEMPLATE_POSTS.find((p) => p.name === "学科長");
  ok(!P.mayGrant(gakkacho.perms, "bill"), "★学科長は ご請求を 渡せない（★持っていない）");
  ok(!P.mayGrant(gakkacho.perms, "post"), "★学科長は 役職を 渡せない");
  ok(P.mayGrant(gakkacho.perms, "sched_mine"), "★自分だけに かかる ものは 渡せる");
  const gakucho = P.TEMPLATE_POSTS.find((p) => p.name === "学長");
  ok(P.mayGrant(gakucho.perms, "bill"), "★学長は ご請求を 渡せる");
  // ★★持ち上げが 起きない こと。★自分に 無いものを、誰にも 渡せない。
  P.PERMS.filter((p) => p.schoolWide).forEach((p) => {
    if (!gakkacho.perms.includes(p.key)) {
      ok(!P.mayGrant(gakkacho.perms, p.key), `★学科長は「${p.label.slice(0, 12)}…」を 渡せない`);
    }
  });

  console.log("④-2 ★総当たり ── 10役職 × 12画面 ＝ 120通り");
  // ★出どころ 「Woolsong 総合評価（Opus・9月10日）」§2
  //   「足りない 検査が 2つ ── ①権限の 総当たり（10役職 × 主要12画面 ＝ 120通り）」
  // ★★見本が 言う「開ける」と、★できことから 出した「開ける」が、
  //   ★★120通り ぜんぶ 一致すること。
  //   ★とくに「見本は だめ、実装は 出す」（★漏れ）が 0で あること。
  const SCREENS = [
    { key: "home", label: "ホーム", need: null },
    { key: "schedule", label: "日程", need: ["sched_all", "sched_mine"] },
    { key: "roster", label: "名簿", need: ["meibo"] },
    { key: "events", label: "行事", need: ["gyoji"] },
    { key: "threads", label: "連絡", need: ["renraku_all", "monka_write"] },
    { key: "settings", label: "設定", need: ["master", "koma"] },
    { key: "attend", label: "出欠つけ", need: ["shukketsu"] },
    { key: "monka", label: "門下", need: ["monka_write"] },
    { key: "bill", label: "ご請求", need: ["bill"] },
    { key: "pay", label: "支払い方法", need: ["bill_pay"] },
    { key: "post", label: "役職を変える", need: ["post"] },
    { key: "koma", label: "コマを決める", need: ["koma", "koma_mine"] }
  ];
  let leaks = 0, diffs = 0;
  mPosts.forEach((post) => {
    const set = new Set(post.perms);
    SCREENS.forEach((sc) => {
      const want = sc.need === null ? true : sc.need.some((k) => set.has(k));
      const tabs = P.tabsForPerms(post.perms).map((t) => t.key);
      let have;
      if (sc.key === "bill") have = P.maySeeBill(post.perms);
      else if (sc.key === "pay") have = P.mayPay(post.perms);
      else if (sc.key === "attend") have = set.has("shukketsu");
      else if (sc.key === "post") have = set.has("post");
      else if (sc.key === "koma") have = set.has("koma") || set.has("koma_mine");
      else have = tabs.includes(sc.key);
      if (want !== have) {
        diffs++;
        if (!want && have) leaks++;
        console.log(`      ★${post.name} × ${sc.label}　見本 ${want} / 実装 ${have}`);
      }
    });
  });
  ok(leaks === 0, `★漏れ 0 通り（★実装が よけいに 出す）（いまは ${leaks}）`);
  ok(diffs === 0, `★120通り ぜんぶ 一致（食い違い ${diffs}）`);

  console.log("④-3 お金は 2つに 分かれている");
  // ★★1つに まとめると、★見るだけの 方が 支払い方法を 変えられます。
  const fukugakucho = P.TEMPLATE_POSTS.find((p) => p.name === "副学長");
  ok(P.maySeeBill(fukugakucho.perms), "★副学長は ご請求を 見られる");
  ok(!P.mayPay(fukugakucho.perms), "★★副学長は 支払い方法を 変えられない");

  console.log("⑤ 役職の 名前で 分けていない（★引き継ぎの 実装原則）");
  const code = readCode("lib", "opsPerms.js");
  // ★★判じる ところに、役職の 名前が 出てこない こと。
  const after = code.slice(code.indexOf("export function permSet"));
  ["学長", "副学長", "事務長", "学部長", "学科長", "教授", "准教授", "講師", "課長", "職員"]
    .forEach((n) => ok(!after.includes(n), `★判じる ところに「${n}」が 出てこない`));
  ok(!/owner|admin|teacher|staff/.test(after), "★古い 4つの 役割でも 分けていない");

  console.log("⑥ 渡せない わけを 隠していない");
  ok(/学校全部に かかる ことは、自分が 持っていないと 渡せません。/.test(readRaw("lib", "opsPerms.js")),
    "★わけが 書いてある");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
