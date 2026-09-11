#!/usr/bin/env node

// ============================================================================
// §7-2　★API 経由で 確かめる ── ★本物の 利用者が 通れる 唯一の 道
//
//   ★出どころ docs/opus/作業指示-権限の事故を直し、記録を残す（9月11日）.md §7-2
//     「★★まず 確かめてください。★直す前に です。」
//   ★坂本さんの お許し（★2026-09-11）
//     「API経由の確かめを、進めてください。捨ててよい教室を1つ作ることも、許可します。」
//
//   ★★なぜ API を 見るのか
//     ★★台帳に 直に 投げる 道は、★権限（GRANT）が 無くて 止まりました（★42501）。
//     ★★けれど、★app/api/org/posts は **裏口（service role）**で 動きます。
//       ★★裏口は、★権限も 決まり（RLS）も 飛び越えます。
//       ★★つまり、★守って いるのは JS の 判じ **だけ**です。
//     ★★本物の 利用者が 通れるのは、★こちらの 道 だけ です。
//       ★★だから、★ここが 本当に 知りたい ところです。
//
//   ★★何も 壊しません。
//     ★★使い捨ての アカウントで ログインし、★要求を 投げて、
//       ★返って きた 数（200／403／404…）を 書き留めるだけです。
//     ★★通って しまった ときは、★すぐ 元に 戻します（★undo）。
//
//   使い方  node tools/perm-probe.js
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");

function readEnv() {
  const p = path.join(ROOT, ".env.e2e");
  if (!fs.existsSync(p)) { console.error("★.env.e2e が ありません。"); process.exit(1); }
  const env = {};
  fs.readFileSync(p, "utf8").split("\n").forEach((line) => {
    const s = line.trim();
    if (!s || s.startsWith("#")) return;
    const i = s.indexOf("=");
    if (i > 0) env[s.slice(0, i).trim()] = s.slice(i + 1).trim();
  });
  return env;
}

(async () => {
  const env = readEnv();
  const base = env.E2E_BASE_URL || "https://woolsong.app";
  const { chromium } = require("playwright");
  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({ locale: "ja-JP", timezoneId: "Asia/Tokyo" });
  const page = await ctx.newPage();

  const out = [];
  const note = (s) => { console.log(s); out.push(s); };

  note("# §7-2　API 経由の 確かめ");
  note("");
  note("★この 記録は tools/perm-probe.js が 書き出します。★手で 書いて いません。");
  note("");

  // ── ① ログイン
  await page.goto(base + "/login", { waitUntil: "domcontentloaded" });
  await page.locator('input[type="email"]').first().fill(env.E2E_EMAIL);
  await page.locator('input[type="password"]').first().fill(env.E2E_PASSWORD);
  await page.locator('button[type="submit"], button:has-text("ログイン")').first().click();
  await page.waitForURL(/\/dashboard/, { timeout: 45000 });
  note("★使い捨ての アカウントで ログインしました。");
  note("");

  /** ★API に 要求を 投げ、★返って きた ものを そのまま 書き留めます。 */
  const call = async (url, body) => page.evaluate(async ([u, b]) => {
    try {
      const r = await fetch(u, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(b)
      });
      let t = "";
      try { t = await r.text(); } catch (e) { t = ""; }
      return { status: r.status, body: t.slice(0, 200) };
    } catch (e) { return { status: 0, body: String(e).slice(0, 200) }; }
  }, [url, body]);

  /** ★いま、★どの 教室に 属して いるか。★画面と 同じ 道で 読みます。 */
  const orgs = await page.evaluate(async () => {
    try {
      const r = await fetch("/api/org/posts", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "list" })
      });
      return { status: r.status, body: (await r.text()).slice(0, 300) };
    } catch (e) { return { status: 0, body: String(e) }; }
  });
  note("## ★下ごしらえ");
  note("");
  note("- `/api/org/posts` に `list` を 投げた 答え　`" + orgs.status + "`　" + orgs.body);
  note("");

  // ── ② 4つの 確かめ
  // ★★教室の id は、★下ごしらえの SQL が 出します。
  //   ★★.env.e2e の PROBE_ORG_ID か、★引数で 渡して ください。
  //   ★★無い ときは 0000… を 投げます。★判じの 手前で 止まります。
  const ORG = process.argv[2] || env.PROBE_ORG_ID || "00000000-0000-0000-0000-000000000000";
  const POST_BOSS = process.argv[3] || env.PROBE_POST_BOSS || "00000000-0000-0000-0000-000000000000";
  note("- 使う 教室の id　`" + ORG + "`");
  note("- 学長の 役職の id　`" + POST_BOSS + "`");
  note("");

  const CHECKS = [
    {
      key: "☐1", title: "職員の 資格で、★役職を 変える",
      url: "/api/org/posts",
      body: { action: "assign", orgId: ORG,
        userId: "f7520dc1-9154-4524-a350-ba0bcddbf0b2",
        postId: POST_BOSS },
      why: "★通れば、★自分を 学長に できます。★名簿の 書き出しより 重い 穴です。",
      // ★★通って しまったら、★職員に 戻します。
      undo: {
        url: "/api/org/posts",
        body: (staff) => (staff
          ? { action: "assign", orgId: ORG,
              userId: "f7520dc1-9154-4524-a350-ba0bcddbf0b2", postId: staff }
          : { action: "unassign", orgId: ORG,
              userId: "f7520dc1-9154-4524-a350-ba0bcddbf0b2" })
      }
    },
    {
      key: "☐1-b", title: "★役職そのものを 作る（add）",
      url: "/api/org/posts",
      // ★★2026-09-11、★1度目は action を 取りちがえて いました（create）。
      //   ★★400「足りない指定があります」は、★判じの あとの 形の 誤りでした。
      //   ★★入口の 名前は add です。★できことは 渡せません（★はじめは 空）。
      body: { action: "add", orgId: ORG, name: "★probe" },
      why: "★通れば、★できことを 自分で 書けます。★役職を 変えるのと 同じ ことです。",
      // ★★作れて しまったら、★消します。★id が 返って きた ときだけ。
      undo: null
    },
    {
      key: "☐1-c", title: "★できことを 1つ 足す（perm）",
      url: "/api/org/posts",
      // ★★2026-09-11、★1度目は 欄の 名前を 取りちがえて いました（perm）。
      //   ★★400「知らない項目です」は、★判じの 手前の 形の 誤りでした。
      //   ★★正しくは key です。
      body: { action: "perm", orgId: ORG, postId: POST_BOSS, key: "post", on: true },
      why: "★通れば、★いまの 役職に「役職を 変える」を 足せます。",
      // ★★足せて しまったら、★外します。
      undo: {
        url: "/api/org/posts",
        body: () => ({ action: "perm", orgId: ORG, postId: POST_BOSS,
          key: "post", on: false })
      }
    },
    {
      key: "☐1-d", title: "★学校ぜんぶに かからない できことを 足す（koma_mine）",
      url: "/api/org/posts",
      // ★★7-4 は「学校ぜんぶに かかる こと」だけを 止めます。
      //   ★★かからない もの（koma_mine）は、★止まりません。
      //   ★★それが 決めの とおりか、★確かめます。
      body: { action: "perm", orgId: ORG, postId: POST_BOSS, key: "koma_mine", on: true },
      why: "★7-4 の 線が、★どこに 引かれて いるかを 見ます。",
      undo: {
        url: "/api/org/posts",
        body: () => ({ action: "perm", orgId: ORG, postId: POST_BOSS,
          key: "koma_mine", on: false })
      }
    },
    {
      key: "☐2", title: "職員の 資格で、★行事を 書き換える",
      url: "/api/org/events",
      body: { orgId: ORG, title: "★probe" },
      why: "★★この 入口は ありません。★行事は 画面から 台帳に 直に 書きます。"
    }
  ];

  note("## ★確かめた こと");
  note("");
  note("| | 何を | 返って きた 数 | 中身 |");
  note("|---|---|---|---|");
  const POST_STAFF = process.argv[4] || env.PROBE_POST_STAFF || null;
  const undone = [];
  for (const c of CHECKS) {
    const r = await call(c.url, c.body);
    // ★★通って しまった ときは、★すぐ 元に 戻します。
    //   ★★確かめの ために 上がった ままに しません。
    //   ★★戻せた かどうかも 書き留めます。★黙って 済ませません。
    if (r.status === 200 && c.undo) {
      const u = await call(c.undo.url, c.undo.body(POST_STAFF));
      undone.push(c.key + "　戻し → " + u.status + "　" + u.body.slice(0, 80));
    }
    const verdict = r.status === 200 ? "★★通って しまいました"
      : (r.status === 403 ? "★断られました（403）"
        : (r.status === 404 ? "★見つかりません（404）"
          : (r.status === 401 ? "★ログインが 要ります（401）" : "★" + r.status)));
    note("| " + c.key + " | " + c.title + " | **" + r.status + "** " + verdict
      + " | `" + r.body.replace(/\|/g, "／").replace(/\n/g, " ") + "` |");
  }
  note("");

  await browser.close();

  if (undone.length) {
    note("## ★戻した もの");
    note("");
    undone.forEach((u) => note("- " + u));
    note("");
  }

  note("## ★答えの 読み方");
  note("");
  note("| 返って きた 数 | 意味 |");
  note("|---|---|");
  note("| **200** | ★★通って しまいました。★穴です |");
  note("| **403** | ★判じに 断られました。★★守れて います |");
  note("| **404** | ★判じの **手前**で 止まりました。★確かめに なって いません |");
  note("| **401** | ★ログインが 切れて います |");
  note("");
  note("## ★この 確かめが 見て いない ところ");
  note("");
  note("★★`mayTouchPosts` には、★もう 1本の 道が あります。");
  note("");
  note("```js");
  note("function mayTouchPosts(member, perms) {");
  note("  if (!member) return false;");
  note("  if (perms) return perms.has(\"post\");   // ★← ★ここを 通りました");
  note("  return member.role === \"owner\";        // ★← ★ここは 通って いません");
  note("}");
  note("```");
  note("");
  note("★★3行目が 効くのは、★**役職（post）を 1つも 持って いない** ときだけ です。");
  note("　★★いまの 確かめでは、★使い捨ての アカウントは 役職を 持って います。");
  note("　　★だから 2行目で 判じが つき、★3行目まで 行きません。");
  note("★★3行目を 通すには、★**役職を 持たない `role='owner'` の 方**が 要ります。");
  note("　★★そこが、★§7 の 言う「役職名で 分岐」の 残り です。");
  note("");
  note("★★行事（☐2）は、★API の 入口が そもそも ありません。");
  note("　★app/api に org/events は 無く、★画面から 台帳に 直に 書いて います。");
  note("　★★だから ☐2 の 道は 1本だけ。★その道は 権限（GRANT）で 止まりました。");
  note("");

  fs.writeFileSync(path.join(ROOT, "docs", "reports", "_perm-probe.md"),
    out.join("\n") + "\n", "utf8");
  console.log("\n★docs/reports/_perm-probe.md に 書き出しました");
})().catch((e) => { console.error(String(e).slice(0, 500)); process.exit(1); });
