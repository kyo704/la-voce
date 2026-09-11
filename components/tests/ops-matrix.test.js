#!/usr/bin/env node

// ============================================================================
// A3　権限の 総当たり ── ★10役職 × 12画面 ＝ 120通り（★第2段）
//
//   ★出どころ Woolsong 総合評価（Opus・9月10日）§2
//     「足りない 検査が 2つ ── ①権限の 総当たり（10役職 × 主要12画面 ＝ 120通り）
//       ②営業資料の 売り文句と 画面の 突き合わせ」
//     「職員が 名簿を 書き出せた 事故は、★これが あれば 当日に 出ていた」
//   ★台帳-保留していること（9月10日・第1版）A3
//
//   ★★components/tests/ops-perms.test.js が すでに 120通りを 見て います。
//     ★★けれど、★あちらが くらべるのは
//       ★見本の PERM の 表　⇔　lib/opsPerms.js の 出し分け
//     ★★どちらも「決めごと」です。★実際に 描く 道を 見て いません。
//
//   ★★この 見張りは、★描く 道の ほうを 見ます。
//     ★① 2つの「タブを 決める 関数」が、★120通り とも 同じ 答えを 返すか
//       ★lib/opsShell.js の tabsFor　⇔　lib/opsPerms.js の tabsForPerms
//       ★★同じ 決めが 2か所に 住んで います。★この 帳面で いちばん 多い 不具合の 形です。
//     ★② 画面の 出し分けが、★役職の 名前で 分かれて いないか
//       ★引き継ぎ「画面の 出し分けは 権限から 導いてください。
//         　　　　役職名で 分岐しないでください」
//     ★③ 運営の 画面が、★門（mayEnterOps）の 中からしか 描かれないか
//     ★④ 表を 1枚 書き出す（★docs/reports/_ops-matrix.md）
//
//   ★★できない こと（★はっきり 書いて おきます）
//     ★★台帳の 側（RLS・GRANT）は、★ここでは 見られません。
//       ★私に 台帳を 読む 手が ありません。
//     ★★「職員が 名簿を 書き出せた」は、★台帳の 側の 穴でした。
//       ★★だから、★この 見張りが 通っても、★A3 は 半分です。
//         ★残り半分は、★坂本さんに SQL を 流して いただく 必要が あります。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

(async () => {
  // ★★別名（@/lib/…）は Next の 組み立てが 解きます。★ここでは 道を 書き換えます。
  //   ★★2026-09-11、★opsShell が opsPerms を 取り寄せる ように なりました。
  //     ★書き換えないと、★data: の 中から 解けません。
  const load = async (rel) => {
    const src = fs.readFileSync(path.join(__dirname, "..", "..", rel), "utf-8")
      .replace(/from "@\/lib\/([a-zA-Z0-9]+)"/g, (mm, n) => `from "${
        "file://" + path.join(__dirname, "..", "..", "lib", n + ".js")}"`);
    return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  };
  const P = await load("lib/opsPerms.js");
  const S = await load("lib/opsShell.js");

  /** ★主要 12画面（★総合評価 §2 の 数）。★ops-perms.test.js と 同じ 表です。 */
  const SCREENS = [
    { key: "home", label: "ホーム" },
    { key: "schedule", label: "日程" },
    { key: "roster", label: "名簿" },
    { key: "events", label: "行事" },
    { key: "threads", label: "連絡" },
    { key: "settings", label: "設定" },
    { key: "attend", label: "出欠つけ" },
    { key: "monka", label: "門下" },
    { key: "bill", label: "ご請求" },
    { key: "pay", label: "支払い方法" },
    { key: "post", label: "役職を変える" },
    { key: "koma", label: "コマを決める" }
  ];

  console.log("① 2つの「タブを 決める 関数」が 同じ 答えを 返すこと");
  // ★★lib/opsShell.js の tabsFor は、★できことを 渡されたら
  //   ★lib/opsPerms.js の tabsForPerms に 渡します。★同じで なければ なりません。
  let mismatch = 0;
  P.TEMPLATE_POSTS.forEach((post) => {
    const a = S.tabsFor(post.perms).map((x) => x.key).sort().join(",");
    const b = P.tabsForPerms(post.perms).map((x) => x.key).sort().join(",");
    if (a !== b) {
      mismatch++;
      console.log("    ✗ " + post.name + "　opsShell[" + a + "]　opsPerms[" + b + "]");
    }
  });
  t(mismatch === 0, "★10役職 とも 同じ（食い違い " + mismatch + "）");

  console.log("\n② 空の できことでも 開かないこと");
  // ★★役職を 持たない 方（★生徒）は、★1つも 開きません。
  t(S.tabsFor([]).length === 0, "★できことが 0なら タブも 0");
  t(S.mayEnterOps([]) === false, "★できことが 0なら 運営に 入れない");
  t(S.mayEnterOps(new Set()) === false, "★空の 集まりでも 入れない");
  // ★★知らない 役職名を 渡しても 開きません。
  t(S.mayEnterOps("だれか") === false, "★知らない 名前では 入れない");

  console.log("\n③ 役職の 名前で 分けて いないこと");
  // ★★引き継ぎ §「画面の 出し分けは 権限から 導いてください。
  //   　役職名で 分岐しないでください」
  const NAMES = P.TEMPLATE_POSTS.map((p) => p.name);
  ["OpsShell.jsx", "OpsHome.jsx", "OpsRoster.jsx", "OpsSchedule.jsx",
    "OpsSettings.jsx", "OpsEvents.jsx", "OpsPosts.jsx"].forEach((f) => {
    const src = readCode("components", f);
    const hit = NAMES.filter((n) => src.includes('"' + n + '"') || src.includes("'" + n + "'"));
    t(hit.length === 0, "★" + f + " が 役職名で 分けて いない"
      + (hit.length ? "（" + hit.join("／") + "）" : ""));
  });

  console.log("\n④ 運営の 画面が、★門の 中からしか 描かれないこと");
  const vt = readCode("components", "VocalTracker.jsx");
  t(/if \(mayEnterOps\(gate\)\) \{/.test(vt), "★mayEnterOps を 通ってから 描く");
  // ★★門は「できこと」から 作ります。★役職名から 作りません。
  t(/permsOfMember\(opsMembership, opsPostsById\)/.test(vt), "★門は できことから 作る");
  // ★★運営の 画面は、★OpsShell の 中だけで 描かれること。
  ["OpsHome", "OpsRoster", "OpsSchedule", "OpsSettings", "OpsEvents", "OpsPosts"].forEach((n) => {
    const uses = (vt.match(new RegExp("<" + n + "\\b", "g")) || []).length;
    t(uses <= 1, "★" + n + " を 描く ところは 1か所（" + uses + "）");
  });

  console.log("\n⑤ 表を 書き出す（★120通り）");
  const rows = [];
  rows.push("| 役職 | " + SCREENS.map((s) => s.label).join(" | ") + " |");
  rows.push("|---|" + SCREENS.map(() => "---").join("|") + "|");
  let cells = 0;
  P.TEMPLATE_POSTS.forEach((post) => {
    const set = new Set(post.perms);
    const tabs = S.tabsFor(post.perms).map((x) => x.key);
    const line = SCREENS.map((sc) => {
      let can;
      if (sc.key === "bill") can = P.maySeeBill(post.perms);
      else if (sc.key === "pay") can = P.mayPay(post.perms);
      else if (sc.key === "attend") can = set.has("shukketsu");
      else if (sc.key === "post") can = set.has("post");
      else if (sc.key === "koma") can = set.has("koma") || set.has("koma_mine");
      else can = tabs.includes(sc.key);
      cells++;
      return can ? "○" : "－";
    });
    rows.push("| " + post.name + " | " + line.join(" | ") + " |");
  });
  t(cells === 120, "★120通り 数えた（" + cells + "）");

  const out = [
    "# A3　権限の 総当たり ── 10役職 × 12画面 ＝ 120通り",
    "",
    "★この 表は components/tests/ops-matrix.test.js が 書き出します。",
    "★手で 書いて いません。★決めが 変われば、★ここも 変わります。",
    "",
    "★○ 開く ／ － 開かない",
    "",
    ...rows,
    "",
    "## ★この 表が 見て いない こと",
    "",
    "★★台帳の 側（RLS・GRANT）は 見て いません。",
    "　★私に 台帳を 読む 手が ありません。",
    "★★「職員が 名簿を 書き出せた」は、★台帳の 側の 穴でした。",
    "　★だから、★この 表が 埋まっても A3 は **半分**です。",
    "　★残り半分は、★SQL を 流して いただく 必要が あります。",
    ""
  ].join("\n");
  fs.writeFileSync(path.join(__dirname, "..", "..", "docs", "reports", "_ops-matrix.md"),
    out, "utf8");
  console.log("  ★docs/reports/_ops-matrix.md に 書き出しました");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
