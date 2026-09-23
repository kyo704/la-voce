#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// ★★★障害の お知らせの 訓練の 道
//
//   ★★守る こと
//     ① 合言葉が 無ければ 503（★ほかの cron と 同じ）
//     ② ★本番で 使う 道を 通る（`incident_recipients` ／ ★表を 直に 読まない）
//     ③ ★1人に 何通も 送らない（★住所で まとめる）
//     ④ ★送れて から 日を 入れる（★先に 入れない）
//     ⑤ ★「訓練」と はっきり 書く
//     ⑥ ★毎日 送らない（★時計に 載せない ／ ★`ops/` に 置く）
//     ⑦ ★**実際に 走らせて** 確かめる（★台帳と 送り口を 差し替えて）
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let 落ち = 0;
function t(cond, label) {
  if (cond) console.log("  ok   " + label);
  else { console.log("  NG   " + label); 落ち++; }
}

(async () => {
  const 道 = readCode("app/api/ops/incident-test", "route.js");
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "incidentNotice.js"), "utf8");
  const N = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 合言葉");
  const 読 = 道.indexOf("process.env.CRON_SECRET"), 五 = 道.indexOf("503"),
        比 = 道.search(/authHeader !==/), 台 = 道.search(/createAdminClient\(\)/);
  t(読 >= 0 && 五 > 読 && 五 < 比, "★読んで → 503 → くらべる の 順");
  t(台 > 比, "★台帳に 触るのは くらべた あと");

  console.log("\n② 本番で 使う 道");
  t(/rpc\("incident_recipients"\)/.test(道), "★incident_recipients を 呼ぶ");
  t(!/from\("org_contacts"\)[\s\S]{0,40}\.select/.test(道), "★宛先の 表を 直に 読んで いない");
  t(/api\.resend\.com\/emails/.test(道), "★ほかの 便りと 同じ 送り口");

  console.log("\n③ 何通も 送らない");
  t(/住所ごと|new Map\(\)/.test(道), "★住所で まとめて いる");
  t(/toLowerCase\(\)/.test(道), "★大文字小文字を そろえて いる");

  console.log("\n④ 送れて から 日を 入れる");
  const 送 = 道.indexOf("結.sent += 1"), 日 = 道.indexOf("verified_at");
  t(送 >= 0 && 日 > 送, "★`verified_at` は 送れた あと");
  t(/\.in\("email", 送れた\)/.test(道), "★送れた 住所 だけ に 入れる");

  console.log("\n⑤ 訓練と 書く");
  t(/^【訓練】/.test(N.incidentTestSubject()), "★件名の 頭が 【訓練】");
  const 本 = N.incidentTestBody(["○○学校"]);
  t(/これは 訓練の 便りです。障害は 起きて いません。/.test(本), "★1行目で そう 言う");
  t(/○○学校/.test(本), "★どの 学校の 宛先かを 書く");
  t(!/お詫び|申し訳/.test(本), "★お詫びを 書かない（★何も 起きて いない）");

  console.log("\n⑥ 毎日 送らない");
  const v = JSON.parse(fs.readFileSync(path.join(__dirname, "..", "..", "vercel.json"), "utf8"));
  t(!(v.crons || []).some((c) => /incident-test/.test(c.path)),
    "★時計に 載せて いない（★呼んだ ときだけ）");
  t(fs.existsSync(path.join(__dirname, "..", "..", "app", "api", "ops", "incident-test", "route.js")),
    "★手で 呼ぶ 棚（app/api/ops/）に 置いて いる");
  t(!fs.existsSync(path.join(__dirname, "..", "..", "app", "api", "cron", "incident-test")),
    "★時計の 棚に 置いて いない");

  // ==========================================================================
  // ⑦ ★実際に 走らせる
  //
  //   ★★読んだ だけでは、★並びは 分かっても **結果** は 分かりません。
  //     ★台帳と 送り口を 差し替えて、★道そのものを 1度 走らせます。
  //   ★★（★物差し M22 ── ★書いたら、★動かして 数える）
  // ==========================================================================
  console.log("\n⑦ 実際に 走らせる");
  const 走 = 道
    .replace(/import \{ createAdminClient \} from "@\/lib\/supabase\/admin";/,
      "const createAdminClient = () => globalThis.__台帳;")
    .replace(/from "@\/lib\/incidentNotice"/,
      'from "file://' + path.join(__dirname, "..", "..", "lib", "incidentNotice.js") + '"');
  const R = await import("data:text/javascript;base64," + Buffer.from(走).toString("base64"));

  function 台帳(rows) {
    const 記 = { 更新: [] };
    globalThis.__台帳 = {
      rpc: async () => ({ data: rows, error: null }),
      from: () => ({
        update: (v) => ({ eq: () => ({ in: async (col, list) => {
          記.更新.push({ v, list }); return { error: null };
        } }) })
      })
    };
    return 記;
  }
  function 送り口(判定) {
    const 記 = [];
    globalThis.fetch = async (url, opt) => {
      const b = JSON.parse(opt.body);
      記.push(b);
      const ok = 判定 ? 判定(b) : true;
      return { ok, status: ok ? 200 : 500, text: async () => "だめ" };
    };
    return 記;
  }
  const 呼 = (秘) => new Request("https://x/api/ops/incident-test", {
    headers: 秘 === null ? {} : { authorization: 秘 } });

  const 元 = { c: process.env.CRON_SECRET, r: process.env.RESEND_API_KEY, f: process.env.FEEDBACK_FROM_EMAIL };
  const 元fetch = globalThis.fetch;

  delete process.env.CRON_SECRET;
  台帳([]); 送り口();
  t((await R.GET(呼("Bearer undefined"))).status === 503,
    "★合言葉が 無い とき ── 503（★「Bearer undefined」でも 通らない）");

  process.env.CRON_SECRET = "aikotoba-test";
  t((await R.GET(呼(null))).status === 401, "★合言葉が 違う とき ── 401");

  delete process.env.RESEND_API_KEY;
  process.env.FEEDBACK_FROM_EMAIL = "woolsong@example.test";
  const 記1 = 台帳([{ org_name: "あ", email: "a@x.test" }]);
  t((await R.GET(呼("Bearer aikotoba-test"))).status === 503, "★送り口の 設定が 無い とき ── 503");
  t(記1.更新.length === 0, "★送れて いないので、★日を 入れて いない");

  process.env.RESEND_API_KEY = "re_test";
  const 記2 = 台帳([
    { org_name: "あ学校", email: "a@x.test" },
    { org_name: "い学校", email: "A@X.test" },
    { org_name: "う学校", email: "b@x.test" }
  ]);
  const 便2 = 送り口();
  const 答2 = await (await R.GET(呼("Bearer aikotoba-test"))).json();
  t(答2.orgs === 3 && 答2.addresses === 2, "★3学校・2住所 → まとめて 2通（orgs=" + 答2.orgs + " addresses=" + 答2.addresses + "）");
  t(答2.sent === 2 && 答2.failed === 0 && 答2.ok === true, "★2通 送れた（sent=" + 答2.sent + "）");
  t(便2.length === 2, "★送り口を 呼んだ のは 2回（" + 便2.length + "回）");
  t(便2.every((b) => /^【訓練】/.test(b.subject)), "★どの 便りも 件名が 【訓練】");
  const 甲 = 便2.find((b) => /a@x/i.test(b.to));
  t(/あ学校/.test(甲.text) && /い学校/.test(甲.text), "★まとめた 2校 とも 本文に ある");
  t(記2.更新.length === 1 && 記2.更新[0].list.length === 3,
    "★送れた 2住所に 日を 入れた（★大小 ちがいの 3行 とも ── " + 記2.更新[0].list.length + "行）");
  t(記2.更新[0].list.includes("a@x.test") && 記2.更新[0].list.includes("A@X.test"),
    "★`JOHO@` と `joho@` の どちらの 字でも 日が 入る");
  t(typeof 記2.更新[0].v.verified_at === "string" && 記2.更新[0].v.verified_at.length > 10,
    "★入れた のは 日（" + String(記2.更新[0].v.verified_at).slice(0, 10) + "）");

  const 記3 = 台帳([
    { org_name: "あ学校", email: "a@x.test" },
    { org_name: "う学校", email: "b@x.test" }
  ]);
  送り口((b) => !/b@x/i.test(b.to));
  const 答3 = await (await R.GET(呼("Bearer aikotoba-test"))).json();
  t(答3.sent === 1 && 答3.failed === 1 && 答3.ok === false, "★1通 落ちた とき ── ok は false");
  t(記3.更新[0].list.length === 1 && /a@x/i.test(記3.更新[0].list[0]),
    "★日が 入る のは 送れた 方 だけ（★落ちた 方には 入れない）");

  const 記4 = 台帳([]);
  const 便4 = 送り口();
  const 答4 = await (await R.GET(呼("Bearer aikotoba-test"))).json();
  t(答4.sent === 0 && 便4.length === 0, "★宛先が 無い とき ── 1通も 送らない");
  t(記4.更新.length === 0, "★宛先が 無い とき ── 日も 入れない");

  globalThis.fetch = 元fetch;
  if (元.c === undefined) delete process.env.CRON_SECRET; else process.env.CRON_SECRET = 元.c;
  if (元.r === undefined) delete process.env.RESEND_API_KEY; else process.env.RESEND_API_KEY = 元.r;
  if (元.f === undefined) delete process.env.FEEDBACK_FROM_EMAIL; else process.env.FEEDBACK_FROM_EMAIL = 元.f;

  console.log(落ち === 0 ? "\n★すべて 通りました" : "\n★" + 落ち + "件 落ちました");
  process.exit(落ち === 0 ? 0 : 1);
})();
