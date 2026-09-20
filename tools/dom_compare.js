/**
 * ★段3a ── ★見本と 実機を、★絵では なく **骨組み（DOM）** で くらべます。
 *
 *   ★★★なぜ 絵で くらべないか（★Opus の 見立て・2026-09-20）。
 *     ★★見本の 中身は 作りもの、★実機は 本物の 記録 です。
 *     ★★★同じ 画面でも、★絵は 必ず ちがいます。★くらべても 何も 言えません。
 *   ★★★骨組みなら くらべられます ── ★見出し・札・行・表の **並び** です。
 *     ★★中身の 字（お名前・数）は 落とします。★そこは ちがって 当たり前 です。
 *
 *   ★★出す もの（★3つに 分けます）
 *     ①見本に あって 実機に 無い
 *     ②実機に あって 見本に 無い
 *     ③並びが ちがう
 *
 *   ★★★較正 ── ★自分で 自分を 試します。
 *     ★同じ 骨組み どうしを くらべて 0件、
 *     ★わざと 1つ 抜いた ものと くらべて 1件。★出なければ 止まります。
 *
 *   ★使い方  node tools/dom_compare.js [画面の 名 …]
 *   ★合言葉は `.env.e2e` から 道具が 読みます（★人の 目に 触れません）。
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MAP = JSON.parse(fs.readFileSync(path.join(__dirname, "dom_ops_map.json"), "utf8"));
const MIHON = path.join(ROOT, "docs/design/pack-final/00-動く見本-PC・iPad（運営）.html");

const env = {};
fs.readFileSync(path.join(ROOT, ".env.e2e"), "utf8").split("\n").forEach((l) => {
  const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
  if (m) env[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
});

/**
 * ★骨組みを 取り出す 式（★見本にも 実機にも、★同じ ものを 当てます）。
 *
 *   ★★★同じ 式で なければ、★くらべた ことに なりません。
 *     ★★2026-09-17 の 一件 ──「同じ 名前でも、★引数が ちがえば 別の 式」。
 */
const HONE = `(root) => {
  const out = [];
  const 字 = (el, n) => (el.textContent || "").replace(/\\s+/g, " ").trim().slice(0, n || 40);
  // ★★中身の 字は 落とします（★数・日づけ・お名前）。
  const 素 = (s) => s
    .replace(/[0-9０-９]+/g, "#")
    .replace(/[A-Za-z]{2,}/g, "@")
    .trim();
  const 見る = (el) => {
    const tag = el.tagName.toLowerCase();
    if (tag === "script" || tag === "style") return;
    const cls = (el.getAttribute("class") || "");
    // ★★★種を 細かく 分けません（★2026-09-20 に 直しました）。
    //   ★★見本は 行を div.li、★実機は button で 出して います。
    //     ★★同じ ものが、★別の 種に なって いました。★1つも 合いません。
    //   ★★くらべるのは「題か、そうでないか」だけ に します。
    // ★★★種を 細かく 分けません（★2026-09-20 に 直しました）。
    //   ★★見本は 行を \'div.li\'、★実機は \'button\' で 出して います。
    //     ★★同じ ものが、★別の 種に なって いました。★1つも 合いません。
    //   ★★くらべるのは「題か、そうでないか」だけ に します。
    let kind = null;
    // ★★★注記は 別に 取ります（★段階2・2026-09-20）。
    //   ★★注記は 約束 そのもの です。★いちばん 重い ところ です。
    //   ★★見本も 実機も、★同じ 名（note ／ warn ／ usu）を 使って います。
    // ★★★'wl' を 足しました（★2026-09-20）。★見本にも '.wl' が 在ります。
    //   ★★'--band2' の 箱 です。★'warn'（#F6F1E4）とは 別 です。
    if (/\\bnote\\b|\\bwarn\\b|\\busu\\b|\\bwl\\b/.test(cls)) kind = "注";
    else if (tag === "h1" || tag === "h2" || tag === "h3"
        || /\\bh3\\b|\\bsh3\\b|\\bfl\\b/.test(cls)) kind = "題";
    else if (tag === "button" || tag === "th" || tag === "li"
             || /\\bbtn\\b|\\bpill\\b|\\bli\\b/.test(cls)) kind = "文";
    if (kind === "注") {
      // ★★★注記は **文**に 割ってから くらべます（★2026-09-20・坂本さんの お決め）。
      //   ★★見本は 1つの かたまりに 何行も 入れて います。
      //   ★★実機は 行ごとに 分けて 出して います。
      //   ★★★かたまり どうしを くらべると、★同じ 約束でも 別物に なります。
      //     ★★初回、★一致が **0件** でした。★それは 差では なく 割り方 でした。
      //   ★★短すぎる かけらは 落とします（★「です。」などが 並ばない ように）。
      const 全 = 字(el, 4000);
      全.split("。").map((s) => 素(s.trim()))
        .filter((s) => s.length >= 6)
        .forEach((s) => out.push("注｜" + s + "。"));
      return;
    }
    if (kind) {
      const t = 素(字(el));
      if (t) out.push(kind + "｜" + t);
      if (kind === "文") return;
    }
    for (const c of el.children) 見る(c);
  };
  for (const c of root.children) 見る(c);

  // ★★★約束の 文（★裁定 その117・2026-09-20）。★**class では なく 字** で 拾います。
  //   ★★★なぜ class を やめたか ── ★坂本さんの お決め。
  //     ★★class で 拾うと、★見せ方を 変える たびに 差が 出ます。
  //     ★★約束は 字 であって、★class では ありません。
  //   ★★★きっかけ ── ★行事の「出欠は 集めません」。
  //     ★★実機は 題の 下の 1行（'.sub'）、★見本は '.note'。
  //     ★★同じ 字が 出て いるのに、★段階2 で 拾えません でした。
  //   ★★★形 ──「〜しません」「〜できません」「〜は 見られません」。★'ません' で 終わる 文。
  //   ★★★'／' でも 割ります。★1行に 2つ 入って いる ことが あります（'.sub'）。
  const ブロック = new Set(["div", "p", "li", "h1", "h2", "h3", "h4", "section",
    "article", "tr", "td", "th", "button", "ul", "ol", "header", "footer",
    "nav", "label", "table", "span", "br"]);
  const 箱 = [];
  const あつめ = (el) => {
    for (const n of el.childNodes) {
      if (n.nodeType === 3) { 箱.push(n.textContent); continue; }
      if (n.nodeType !== 1) continue;
      const t = n.tagName.toLowerCase();
      if (t === "script" || t === "style") continue;
      if (ブロック.has(t)) { 箱.push("\\n"); あつめ(n); 箱.push("\\n"); }
      else あつめ(n);
    }
  };
  あつめ(root);
  const 済 = new Set();
  箱.join("").split(/[\\n。／]/).forEach((x) => {
    const t = 素(x.replace(/\\s+/g, " ").trim());
    if (t.length < 6 || !/ません$/.test(t)) return;
    if (済.has(t)) return;
    済.add(t);
    out.push("約｜" + t + "。");
  });
  return out;
}`;

// ★★★字の まま 渡すと、★Playwright は `undefined` を 返しました（★2026-09-20）。
//   ★★本当の 関数に してから 渡します。★中身は 1つ の まま です。
const HONE_FN = new Function("return " + HONE)();

// ============================================================================
// ★差の 仕分け（★裁定 その118・2026-09-20）
//
//   ★★★意味が 変わるか どうかで 分けます。
//     ★㋒ …… ★空白の 有る 無し・全角半角・改行の 位置。★意味は 1ミリも 変わりません。
//     ★㋐ …… ★助詞の ちがい。★約束の **範囲** が 変わります。
//       ★★「出欠を 集めません」── ★この 機能が 集めません。
//       ★★「出欠は 集めません」── ★ほかは 集めるかも、と 読めます（★「は」は 対比）。
//       ★★営業の 紙・契約の 紙と 突き合わせる とき、★この 差が 効きます。
//
//   ★★★寄せ先（★裁定 その118 DIRECTION）
//     ★約束の 文（「〜しません」「〜できません」）→ ★**見本に** 合わせます。
//     ★それ以外の 文 → ★**実機の まま**。★見本を 直します（★Opus の 側）。
// ============================================================================

/** ★空白と 全角半角を ならします（★意味を 変えない ところ）。 */
function ならす(s) {
  return s
    .replace(/[\s\u3000]/g, "")
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xFEE0))
    .replace(/[（）]/g, (c) => (c === "（" ? "(" : ")"))
    .replace(/[、。]/g, "");
}

/** ★助詞を 落とします（★助詞 だけの ちがいを 見つける ため）。 */
const ジョシ = /[はがをにへとでもやのかねよ]/g;
function 助詞をおとす(s) { return ならす(s).replace(ジョシ, ""); }

/** ★約束の 文か（★「〜しません」「〜できません」── ★ません で 終わる）。 */
function 約束か(s) { return /ません$/.test(ならす(s).replace(/[。]/g, "")); }

/**
 * ★見本のみ と 実機のみ を 突き合わせて、★3つに 分けます。
 *
 *   ★★㋒空白 …… ★空白・全角半角 だけの ちがい
 *   ★★㋐助詞 …… ★助詞 だけの ちがい
 *   ★★未仕分け …… ★それ以外（★人が 見ます）
 */
function 仕分け(onlyMihon, onlyImpl) {
  const 見 = onlyMihon.map((x) => x.replace(/^[^｜]*｜/, ""));
  const 実 = onlyImpl.map((x) => x.replace(/^[^｜]*｜/, ""));
  const 使った = new Set();
  const 空白 = [], 助詞 = [], 未 = [];
  見.forEach((m) => {
    let あたり = -1, 種 = null;
    実.forEach((i, k) => {
      if (使った.has(k) || あたり >= 0) return;
      if (ならす(m) === ならす(i)) { あたり = k; 種 = "空白"; }
      else if (助詞をおとす(m) === 助詞をおとす(i)) { あたり = k; 種 = "助詞"; }
    });
    if (あたり < 0) { 未.push({ 見本: m, 実機: null }); return; }
    使った.add(あたり);
    (種 === "空白" ? 空白 : 助詞).push({ 見本: m, 実機: 実[あたり], 約束: 約束か(m) });
  });
  実.forEach((i, k) => { if (!使った.has(k)) 未.push({ 見本: null, 実機: i }); });
  return { 空白, 助詞, 未 };
}

/**
 * ★もう 1度 ── ★**実機の ぜんぶ** と 突き合わせます（★2026-09-20 に 足しました）。
 *
 *   ★★★行事の「出欠を／出欠は」が 未仕分けに 落ちて いました。
 *     ★★見本に「を」と「は」の 2つが あり、★実機の「は」は **同じ** に 数えられます。
 *     ★★残った「を」は、★実機のみ の 中に 相手が 居ません。
 *   ★★★だから、★同じ に なった ぶん も 含めて もう 1度 見ます。
 *     ★★「見本に 2つ、★実機に 1つ」── ★これも 助詞の ちがい です。
 */
function 仕分けもう一度(未, 実ぜんぶ) {
  const 実 = 実ぜんぶ.map((x) => x.replace(/^[^｜]*｜/, ""));
  const 空白 = [], 助詞 = [], のこり = [];
  未.forEach((x) => {
    if (!x.見本) { のこり.push(x); return; }
    const m = x.見本;
    const あ = 実.find((i) => ならす(m) === ならす(i));
    const い = 実.find((i) => 助詞をおとす(m) === 助詞をおとす(i));
    if (あ) 空白.push({ 見本: m, 実機: あ, 約束: 約束か(m), 二重: true });
    else if (い) 助詞.push({ 見本: m, 実機: い, 約束: 約束か(m), 二重: true });
    else のこり.push(x);
  });
  return { 空白, 助詞, 未: のこり };
}

/** ★並びを くらべます（★いちばん 長い 共通の 並びを 取ります）。 */
function kuraberu(a, b) {
  const n = a.length, m = b.length;
  const d = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
  for (let i = n - 1; i >= 0; i--) {
    for (let j = m - 1; j >= 0; j--) {
      d[i][j] = a[i] === b[j] ? d[i + 1][j + 1] + 1 : Math.max(d[i + 1][j], d[i][j + 1]);
    }
  }
  const 同 = [];
  let i = 0, j = 0;
  const 見本のみ = [], 実機のみ = [];
  while (i < n && j < m) {
    if (a[i] === b[j]) { 同.push(a[i]); i++; j++; }
    else if (d[i + 1][j] >= d[i][j + 1]) { 見本のみ.push(a[i]); i++; }
    else { 実機のみ.push(b[j]); j++; }
  }
  while (i < n) 見本のみ.push(a[i++]);
  while (j < m) 実機のみ.push(b[j++]);
  // ★★★「並びが ちがう」── ★どちらにも 在るのに、★片側にしか 残らなかった もの。
  const 順ちがい = 見本のみ.filter((x) => 実機のみ.includes(x));
  return {
    same: 同.length,
    onlyMihon: 見本のみ.filter((x) => !順ちがい.includes(x)),
    onlyImpl: 実機のみ.filter((x) => !順ちがい.includes(x)),
    order: [...new Set(順ちがい)]
  };
}

/**
 * ★作りものの 骨組み（★較正の ため だけ）。
 *
 *   ★★★`HONE` を、★本物の 画面 なしで 試します（★裁定 その117・2026-09-20）。
 *     ★★字で 拾う ように 変えました。★その 拾い方 じたいを 試します。
 *     ★★道具が 何も 見つけない とき、★世の中では なく 道具が 壊れて います。
 */
function 作り(tag, cls, 中) {
  const 子 = (中 || []).map((x) => (typeof x === "string"
    ? { nodeType: 3, textContent: x } : x));
  return {
    nodeType: 1,
    tagName: tag.toUpperCase(),
    childNodes: 子,
    children: 子.filter((x) => x.nodeType === 1),
    getAttribute: (k) => (k === "class" ? (cls || "") : null),
    get textContent() {
      return 子.map((x) => (x.nodeType === 3 ? x.textContent : x.textContent)).join("");
    }
  };
}

function 較正の骨組み() {
  const root = 作り("div", "", [
    // ★小見出し（★印は ありません）。★／ の 後ろだけが 約束 です。
    作り("p", "sub", ["日と 時間と 場所と 対象を 知らせます　／　出欠は 集めません"]),
    // ★印の ある 注記。
    作り("p", "note", ["生徒の 健康に関するものは、この画面に 1つも ありません。"]),
    // ★約束では ない 文。★拾っては いけません。
    作り("button", "btn", ["行事を 出す"])
  ]);
  const 出 = HONE_FN(root);
  const 約 = 出.filter((x) => x.startsWith("約｜"));
  const 注 = 出.filter((x) => x.startsWith("注｜"));
  return (
    // ★① 印の 無い 小見出しから、★約束を 拾えて いる こと。
    約.includes("約｜出欠は 集めません。")
    // ★② 印の ある 注記も 拾えて いる こと。
    && 約.some((x) => x.indexOf("#つも ありません") >= 0)
    // ★③ 約束で ない 文を 拾って いない こと。
    && !約.some((x) => x.indexOf("行事を 出す") >= 0)
    // ★④ 印（class）の くらべも、★これまで どおり 動いて いる こと。
    && 注.length === 1
  );
}

function 較正の仕分け() {
  const r = 仕分け(
    ["約｜出欠を 集めません。", "約｜決めるのは 先生です。", "約｜混ざりません。"],
    ["約｜出欠は 集めません。", "約｜決めるのは先生です。", "約｜まだ行事はありません。"]
  );
  return (
    // ★助詞 だけの ちがい 1件。★約束の 文 と 判じて いる こと。
    r.助詞.length === 1 && r.助詞[0].約束 === true
    && r.助詞[0].見本 === "出欠を 集めません。"
    // ★空白 だけの ちがい 1件。★約束の 文 では ない こと。
    && r.空白.length === 1 && r.空白[0].約束 === false
    // ★残り 2件は 突き合わせません。
    && r.未.length === 2
  );
}

function 較正のもう一度() {
  // ★見本に「を」と「は」の 2つ、★実機に「は」1つ。★「を」が 残ります。
  const 未 = [{ 見本: "出欠を 集めません。", 実機: null }];
  const r = 仕分けもう一度(未, ["約｜出欠は 集めません。"]);
  return r.助詞.length === 1 && r.助詞[0].約束 === true && r.未.length === 0;
}

function calibrate() {
  if (!較正の骨組み()) return false;
  if (!較正の仕分け()) return false;
  if (!較正のもう一度()) return false;
  // ★★★題だけ の くらべも 試します（★2026-09-20）。
  //   ★★行を 落として、★題の 差 だけ が 残る こと。
  const 題 = (x) => x.filter((s) => s.startsWith("題｜"));
  const m1 = ["題｜あ", "文｜作りもの#", "題｜い"];
  const i1 = ["題｜あ", "文｜本物@", "題｜い"];
  const t1 = kuraberu(題(m1), 題(i1));
  if (t1.onlyMihon.length !== 0 || t1.onlyImpl.length !== 0 || t1.same !== 2) return false;
  const t2 = kuraberu(題(m1), 題(["題｜あ"]));
  if (t2.onlyMihon.length !== 1) return false;

  const a = ["題｜あ", "札｜い", "行｜う"];
  const 同 = kuraberu(a, a.slice());
  const 欠 = kuraberu(a, ["題｜あ", "行｜う"]);
  const 順 = kuraberu(a, ["札｜い", "題｜あ", "行｜う"]);
  return 同.same === 3 && 同.onlyMihon.length === 0
    && 欠.onlyMihon.length === 1 && 欠.onlyMihon[0] === "札｜い"
    && 順.order.length >= 1;
}

(async () => {
  if (!calibrate()) {
    console.error("★止まりました ── ★道具の 較正に 落ちました");
    process.exit(1);
  }
  const 選 = process.argv.slice(2).filter((x) => !x.startsWith("--"));
  const 的 = MAP.screens.filter((s) => 選.length === 0 || 選.includes(s.key));
  const { chromium } = require(path.join(ROOT, "node_modules/playwright"));
  const b = await chromium.launch({ channel: "chrome" });
  const ctx = await b.newContext({
    viewport: { width: 1280, height: 1000 }, locale: "ja-JP", timezoneId: "Asia/Tokyo"
  });

  // ── ★見本 ──
  const mp = await ctx.newPage();
  await mp.goto("file://" + MIHON, { waitUntil: "domcontentloaded" });
  await mp.waitForTimeout(600);

  // ── ★実機 ──
  const ap = await ctx.newPage();
  // ★★★手元の 開発サーバも 見られます（★2026-09-20・坂本さんの お決め D112）。
  //   ★★`node tools/dom_compare.js --local` ── ★http://localhost:3000
  //   ★★★配備を 待たずに 測れます。★きょう、★印を 足しても 測れません でした。
  //     ★★本番は「出た もの」、★手元は「いま 書いた もの」。★別の ものを 見ます。
  //   ★★どちらを 見たかを、★報告の 頭に 必ず 書きます。★取り違えない ため です。
  const ローカル = process.argv.includes("--local");
  // ★★★押す ときの 待ち（★裁定 その118 推奨2・2026-09-20）。
  //   ★★手元 90秒 ／ 本番 30秒。★無制限には しません（★DO_NOT）。
  //   ★★無制限に すると、★本当に 固まった とき 気づけません。
  const 待ちクリック = ローカル ? 90000 : 30000;
  const base = ローカル ? (process.env.E2E_LOCAL_URL || "http://localhost:3000")
    : (env.E2E_BASE_URL || "https://woolsong.app");
  // ★★★手元の サーバは、★はじめの 1回だけ 組み立てに 時間が かかります。
  //   ★★先に 開いて 温めて おきます。★待ち時間も 長めに します。
  const 待ち = ローカル ? 180000 : 45000;
  if (ローカル) {
    await ap.goto(base + "/dashboard", { waitUntil: "domcontentloaded", timeout: 180000 })
      .catch(() => {});
    await ap.waitForTimeout(2000);
  }
  await ap.goto(base + "/login", { waitUntil: "domcontentloaded", timeout: 待ち });
  // ★★★仕掛けが 動く まで 待ちます（★2026-09-20）。
  //   ★★手元の サーバは、★はじめに 組み立てます。★その 間は `onSubmit` が
  //     ★★まだ 付いて いません。★押すと 画面が そのまま 送られ、★入れません。
  //   ★★（★合言葉が 住所に 乗る 道は 塞ぎました。★`method="post"`）
  await ap.waitForLoadState("networkidle", { timeout: 待ち }).catch(() => {});
  await ap.waitForTimeout(ローカル ? 4000 : 800);
  // ★★★手元の 台帳は 本番と 別 です（★2026-09-20・D115）。
  //   ★★手元の 口は `.env.e2e` の `E2E_LOCAL_*` に あります。
  //   ★★道具が 自分で 読みます。★人の 目には 触れません。
  const 口 = ローカル
    ? { m: env.E2E_LOCAL_EMAIL, p: env.E2E_LOCAL_PASSWORD }
    : { m: env.E2E_EMAIL, p: env.E2E_PASSWORD };
  if (!口.m || !口.p) {
    console.error("★止まりました ── ★入る 口が ありません"
      + (ローカル ? "（.env.e2e の E2E_LOCAL_EMAIL / E2E_LOCAL_PASSWORD）" : ""));
    await b.close();
    process.exit(1);
  }
  if (ローカル) {
    // ★★★手元では、★画面の 札を 押しません（★2026-09-20）。
    //   ★★手元の サーバは 組み立てに 時間が かかります。★仕掛けが 付く 前に
    //     ★★押すと、★そのまま 送られ、★入れません。★何度も そう なりました。
    //   ★★★台帳に 直に 尋ねて、★しるし（session）を 画面に 置きます。
    //     ★★合言葉を 画面に 打ちません。★住所にも 残りません。
    const 台帳 = {};
    fs.readFileSync(path.join(ROOT, ".env.local"), "utf8").split("\n").forEach((l) => {
      const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*)$/.exec(l);
      if (m) 台帳[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
    });
    const しるし = await ap.evaluate(async ([u, k, m, pw]) => {
      const r = await fetch(u + "/auth/v1/token?grant_type=password", {
        method: "POST",
        headers: { apikey: k, "Content-Type": "application/json" },
        body: JSON.stringify({ email: m, password: pw })
      });
      if (!r.ok) return null;
      return await r.json();
    }, [台帳.NEXT_PUBLIC_SUPABASE_URL, 台帳.NEXT_PUBLIC_SUPABASE_ANON_KEY, 口.m, 口.p]);
    if (!しるし) {
      console.error("★止まりました ── ★手元の 台帳に 入れません");
      await b.close();
      process.exit(1);
    }
    const ref = String(台帳.NEXT_PUBLIC_SUPABASE_URL).replace(/^https:\/\//, "").split(".")[0];
    // ★★★しるしは **cookie** に 置きます（★2026-09-20）。
    //   ★★はじめ localStorage に 置きました。★入れません でした。
    //   ★★★この 蔵は `@supabase/ssr` です。★門（middleware）は cookie を 見ます。
    //     ★★画面の 中の 覚え書きでは、★台帳の 側から 見えません。
    const 生 = "base64-" + Buffer.from(JSON.stringify(しるし), "utf8").toString("base64");
    const 名 = "sb-" + ref + "-auth-token";
    // ★★長い ときは 分けて 置きます（★`…​.0` `.1`）。★あちらが つなぎます。
    const 塊 = [];
    for (let i = 0; i < 生.length; i += 3180) 塊.push(生.slice(i, i + 3180));
    const url = new URL(base);
    await ctx.addCookies(塊.length === 1
      ? [{ name: 名, value: 生, domain: url.hostname, path: "/" }]
      : 塊.map((v, i) => ({ name: `${名}.${i}`, value: v, domain: url.hostname, path: "/" })));
    await ap.goto(base + "/dashboard", { waitUntil: "domcontentloaded", timeout: 待ち });
  } else {
    await ap.locator('input[type="email"]').first().fill(口.m);
    await ap.locator('input[type="password"]').first().fill(口.p);
    await ap.locator('button[type="submit"], button:has-text("ログイン")').first().click();
  }
  await ap.waitForURL(/\/dashboard/, { timeout: 待ち });
  await ap.waitForTimeout(3000);
  for (let i = 0; i < 4; i++) {
    if (!(await ap.locator('[role="dialog"]').count())) break;
    await ap.keyboard.press("Escape").catch(() => {});
    await ap.waitForTimeout(400);
  }
  // ★★★運営の 入口は、★⚙ の 中に あります（★2026-09-20 に 測りました）。
  //   ★★はじめ「きょう」の 画面で 探して いました。★見つかりません でした。
  const 歯車 = ap.locator('button:has-text("⚙")').first();
  if (await 歯車.count()) { await 歯車.click(); await ap.waitForTimeout(1800); }
  // ★★★どの 学校に 入るか（★2026-09-20）。
  //   ★★★見本は いつも 中身が 入って います。★実機は 空の 節を 出しません。
  //     ★★中身の 無い 学校で くらべると、★「見本のみ」が 中身の 数 だけ 出ます。
  //     ★★★それは ちがい では ありません。★記録が 無い だけ です。
  //   ★★だから、★記録の ある 学校を 名で 選びます。
  const 学校 = process.env.E2E_ORG
    || (ローカル ? (MAP.localOrg || "★くらべ用") : (MAP.org || "★実機テスト"));
  const 運営札 = `button:has-text("${学校}")`;
  if (!(await ap.locator(運営札).count())) {
    console.error(`★止まりました ── ★「${学校}」の 運営の 入口が ありません`);
    await b.close();
    process.exit(1);
  }
  await ap.locator(運営札).first().click();
  await ap.waitForTimeout(ローカル ? 8000 : 3000);

  /** ★運営の 入口に 戻ります（★1画面ごとに、★まっさらから）。 */
  const もどる = async () => {
    await ap.goto(base + "/dashboard", { waitUntil: "domcontentloaded" });
    // ★★手元の サーバは 組み立てに 時間が かかります。★長めに 待ちます。
    await ap.waitForTimeout(ローカル ? 12000 : 2500);
    for (let i = 0; i < 3; i++) {
      if (!(await ap.locator('[role="dialog"]').count())) break;
      await ap.keyboard.press("Escape").catch(() => {});
      await ap.waitForTimeout(400);
    }
    const g = ap.locator('button:has-text("⚙")').first();
    if (await g.count()) { await g.click(); await ap.waitForTimeout(1500); }
    await ap.locator(運営札).first().click({ timeout: 待ちクリック });
    await ap.waitForTimeout(2500);
  };

  // ★★★温め（★裁定 その118 TECHNICAL_ISSUE・2026-09-20）。
  //   ★★手元の サーバは、★その 画面を **はじめて** 開く とき 組み立てます。
  //     ★★きょう、★日程・未送信・お知らせを書く の 3画面が 時間切れに なりました。
  //   ★★★測る 前に、★1度ずつ 開いて おきます。★2度目からは 速い です。
  //   ★★温めで 落ちても 止めません。★測るのは この 後 です。
  if (ローカル) {
    console.log("  …… ★温めて います（★1画面ずつ 1度）");
    for (const sc of 的) {
      try {
        await もどる();
        await ap.locator(`nav button:has-text("${sc.impl.tab}"), button:has-text("${sc.impl.tab}")`)
          .first().click({ timeout: 待ちクリック });
        await ap.waitForTimeout(1200);
        for (const st of (sc.impl.steps || [])) {
          await ap.locator(`button:has-text("${st}"), [role="button"]:has-text("${st}")`)
            .first().click({ timeout: 待ちクリック });
          await ap.waitForTimeout(900);
        }
      } catch (e) { /* ★温めです。★落ちても 進みます。 */ }
    }
  }

  const 出 = [];
  for (const sc of 的) {
    let mihon = null, impl = null, err = "";
    try {
      // ★★★`push` に 引数の 要る 画面が あります（★れい 役職の 中身）。
      //   ★★渡さないと、★見本の 側で 落ちます（★2026-09-20 に 落ちました）。
      await mp.evaluate(([tab, push, arg]) => {
        if (tab) window.go(tab);
        if (push) window.push(push, arg);
      }, [sc.tab || null, sc.push || null,
        sc.pushArg === undefined ? null : sc.pushArg]);
      await mp.waitForTimeout(350);
      mihon = await mp.$eval("#bodyEl", HONE_FN).catch(async () =>
        mp.$eval("body", HONE_FN));
    } catch (e) {
      err += "見本:" + String(e.message).replace(/\s+/g, " ").slice(0, 70) + " ";
    }
    // ★★★1度 だけ 取り直します（★裁定 その118 推奨3）。
    //   ★★待ちを 無しに しません。★本当に 固まった ときに 気づけなく なります。
    const 取る = async () => {
      const t = sc.impl.tab;
      await もどる();
      await ap.locator(`nav button:has-text("${t}"), button:has-text("${t}")`)
        .first().click({ timeout: 待ちクリック });
      await ap.waitForTimeout(1500);
      for (const s of (sc.impl.steps || [])) {
        await ap.locator(`button:has-text("${s}"), [role="button"]:has-text("${s}")`)
          .first().click({ timeout: 待ちクリック });
        await ap.waitForTimeout(1200);
      }
      // ★★★`data-ops-body` は 2026-09-20 に 足した 目じるし です。
      //   ★★本番に 出るまでは 無い ので、★そのときは 入れもの ごと 取り、
      //     ★★外がわ の 札（帯・もどる・たたむ）を 落とします。
      const 印あり = await ap.locator("[data-ops-body]").count();
      impl = await ap.$eval(印あり ? "[data-ops-body]" : "main, body", HONE_FN);
      if (!印あり) {
        const 外 = ["‹ もどる", "たたむ", "ひろげる", "あ ふつう", "あ 大きい",
          "ホーム", "名簿", "日程", "門下", "行事", "連絡", "設定"];
        impl = impl.filter((s) => !外.includes(s.split("｜")[1]));
      }
    };
    try {
      await 取る();
    } catch (e1) {
      // ★★その 画面 だけ、★もう 1度。★それでも 落ちたら 落ちた と 書きます。
      console.log(`  ……  ${sc.key} ★取り直します`);
      try { await 取る(); } catch (e) {
      err += "実機:" + String(e.message).replace(/\s+/g, " ").slice(0, 70);
      // ★★★押せなかった とき、★画面に **何が 在ったか** を 書き残します。
      //   ★★2026-09-20 の 覚え ──「無い」と「見つけられなかった」は ちがいます。
      //   ★★札の 字を 見ないと、★どちらか 決められません。
      try {
        const 札 = await ap.$$eval("button, [role=\"button\"]", (xs) => xs
          .map((x) => (x.textContent || "").replace(/\s+/g, " ").trim().slice(0, 18))
          .filter(Boolean).slice(0, 24));
        err += " ／ ★画面に 在った 札: " + 札.join(" · ");
      } catch (e2) { /* ★見られない ことも あります。 */ }
      }
    }

    if (!mihon || !impl) {
      出.push({ key: sc.key,
        err: err || `取れませんでした（見本 ${mihon ? mihon.length : "なし"}`
          + ` ／ 実機 ${impl ? impl.length : "なし"}）` });
      console.log(`  --  ${sc.key} … ${err}`);
      continue;
    }
    const r = kuraberu(mihon, impl);
    // ★★★題（見出し）だけ でも くらべます（★2026-09-20・坂本さんの お決め）。
    //   ★★見本の 中身は 作りもの です。★行を くらべると、★架空の お名前が
    //     ★★そのまま「見本のみ」に 並びます。★本当の 差が 埋もれます。
    //   ★★題は 作りもの では ありません。★書いた 字 その もの です。
    //     ★★だから「節が ある か」「順に 並んで いるか」を、★ここで 見ます。
    // ★★★画面 じたいの 名（★見本の `h2`）は 落とします。
    //   ★★実機では、★名は 上の 帯に 出て います（★中身の 外）。
    //   ★★残すと、★どの 画面でも「見本のみ … 名簿」が 並びます。★差では ありません。
    const 名たち = [sc.key, sc.tab, sc.push, (sc.impl || {}).tab].filter(Boolean);
    const 題 = (a) => a
      .filter((s) => s.startsWith("題｜"))
      .filter((s) => !名たち.includes(s.replace("題｜", "").trim()));
    const rt = kuraberu(題(mihon), 題(impl));
    // ★★★段階2 ── ★約束の 文（★裁定 その117 で class から 字 に 変えました）。
    //   ★★約束は 字 です。★見せ方（class）では ありません。
    const 約 = (a) => a.filter((s) => s.startsWith("約｜"));
    const rn = kuraberu(約(mihon), 約(impl));
    // ★★★印（class）の くらべも 残します。★参考 です。
    //   ★★消すと、★字の 形に 当てはまらない 注記が 見えなく なります。
    const 注 = (a) => a.filter((s) => s.startsWith("注｜"));
    const rc = kuraberu(注(mihon), 注(impl));
    // ★★★差を 3つに 分けます（★裁定 その118）。★㋒空白 ／ ㋐助詞 ／ 未仕分け。
    const wk0 = 仕分け(rn.onlyMihon, rn.onlyImpl);
    const wk1 = 仕分けもう一度(wk0.未, 約(impl));
    const wk = { 空白: wk0.空白.concat(wk1.空白), 助詞: wk0.助詞.concat(wk1.助詞), 未: wk1.未 };
    出.push({ key: sc.key, ...r, title: rt, note: rn, cls: rc, wake: wk,
      n: { mihon: mihon.length, impl: impl.length } });
    console.log(`  ok  ${sc.key} … 題 ${rt.same}/${rt.onlyMihon.length}/${rt.onlyImpl.length}`
      + `　約束 ${rn.same}/${rn.onlyMihon.length}/${rn.onlyImpl.length}`
      + `　｜　ぜんぶ ${r.same}/${r.onlyMihon.length}/${r.onlyImpl.length}`
      + "　（同じ/見本のみ/実機のみ）");
  }
  await b.close();

  const L = [];
  L.append = (s) => L.push(s);
  L.push("# ★段3a ── ★見本と 実機の 骨組み くらべ\n");
  L.push("★この 紙は `tools/dom_compare.js` が 書きました。★手で 足して いません。");
  L.push(`★見た 先 …… ${base}`
    + `（${ローカル ? "★手元の 開発サーバ ── いま 書いた もの"
      : "★本番 ── 出た もの"}）`);
  L.push("★道具の 較正 …… ○（★同じ もので 0件、★1つ 抜くと 1件、★並べ替えで 1件）\n");
  L.push(`★くらべた 画面 ${出.filter((x) => !x.err).length} ／ `
    + `★道が 無くて くらべて いない 画面 ${MAP.skip.length}\n`);
  L.push("\n## ★一 ★題（見出し）だけ の くらべ ── ★本当の 差\n");
  L.push("★★見本の 中身は 作りもの です。★行を くらべると、★架空の お名前が"
    + " そのまま 差に なります。★題は 書いた 字 その もの なので、★ここが 本当の 差 です。\n");
  L.push("| 画面 | 同じ | ★見本に あって 実機に 無い | ★実機に あって 見本に 無い | 並び |");
  L.push("|---|---|---|---|---|");
  出.forEach((x) => {
    if (x.err) { L.push(`| ${x.key} | — | — | — | ★${x.err} |`); return; }
    const a = x.title;
    L.push(`| ${x.key} | ${a.same} | ${a.onlyMihon.length} | ${a.onlyImpl.length} | ${a.order.length} |`);
  });

  L.push("\n### ★題の 中身（★差の ある 画面 だけ）\n");
  出.forEach((x) => {
    if (x.err) return;
    const a = x.title;
    if (!a.onlyMihon.length && !a.onlyImpl.length && !a.order.length) return;
    L.push(`**★${x.key}**\n`);
    a.onlyMihon.forEach((s) => L.push(`- ★見本のみ … ${s.replace("題｜", "")}`));
    a.onlyImpl.forEach((s) => L.push(`- ★実機のみ … ${s.replace("題｜", "")}`));
    a.order.forEach((s) => L.push(`- ★並びちがい … ${s.replace("題｜", "")}`));
    L.push("");
  });

  L.push("\n## ★二 ★約束の 文 だけ の くらべ（★段階2・裁定 その117）\n");
  L.push("★★拾い方は **字** です。★`class` では ありません（★裁定 その117）。");
  L.push("★★「〜しません」「〜できません」「〜は 見られません」── ★`ません` で 終わる 文。");
  L.push("★★見せ方（小見出しか 注記か）を 変えても、★この 数は 動きません。\n");
  L.push("| 画面 | 同じ | ★見本に あって 実機に 無い | ★実機に あって 見本に 無い |");
  L.push("|---|---|---|---|");
  出.forEach((x) => {
    if (x.err) { L.push(`| ${x.key} | — | — | — |`); return; }
    L.push(`| ${x.key} | ${x.note.same} | ${x.note.onlyMihon.length} | ${x.note.onlyImpl.length} |`);
  });
  L.push("\n### ★注記の 中身（★差の ある 画面 だけ）\n");
  出.forEach((x) => {
    if (x.err) return;
    const a = x.note;
    if (!a.onlyMihon.length && !a.onlyImpl.length) return;
    L.push(`**★${x.key}**\n`);
    a.onlyMihon.forEach((s) => L.push(`- ★見本のみ … ${s.replace("約｜", "")}`));
    a.onlyImpl.forEach((s) => L.push(`- ★実機のみ … ${s.replace("約｜", "")}`));
    L.push("");
  });

  L.push("\n## ★二の一 ★差の 仕分け（★裁定 その118）\n");
  L.push("★★意味が 変わるか どうかで 分けます。");
  L.push("★★㋒ … 空白・全角半角 だけ（★意味は 変わりません。★記録して 進みます）。");
  L.push("★★㋐ … 助詞 だけ（★約束の **範囲** が 変わります）。");
  L.push("★★★約束の 文（`ません` で 終わる）は **見本に** 合わせます。");
  L.push("★★★それ以外は **実機の まま**。★見本を 直します（★Opus の 側）。\n");
  L.push("| 画面 | ㋐助詞（約束） | ㋐助詞（約束でない） | ㋒空白 | 未仕分け |");
  L.push("|---|---|---|---|---|");
  出.forEach((x) => {
    if (x.err || !x.wake) { L.push(`| ${x.key} | — | — | — | — |`); return; }
    const y = x.wake.助詞.filter((z) => z.約束).length;
    const n = x.wake.助詞.length - y;
    L.push(`| ${x.key} | ${y} | ${n} | ${x.wake.空白.length} | ${x.wake.未.length} |`);
  });
  L.push("\n### ★㋐ 助詞の ちがい ── ★1件ずつ\n");
  出.forEach((x) => {
    if (x.err || !x.wake || !x.wake.助詞.length) return;
    L.push(`**★${x.key}**\n`);
    x.wake.助詞.forEach((z) => {
      L.push(`- ${z.約束 ? "★約束の 文" : "★約束では ない"}`);
      L.push(`    - 見本 … ${z.見本}`);
      L.push(`    - 実機 … ${z.実機}`);
    });
    L.push("");
  });
  L.push("\n### ★㋒ 空白・全角半角 だけ ── ★記録して 進みます\n");
  出.forEach((x) => {
    if (x.err || !x.wake || !x.wake.空白.length) return;
    L.push(`**★${x.key}**\n`);
    x.wake.空白.forEach((z) => {
      L.push(`- 見本 … ${z.見本}`);
      L.push(`    - 実機 … ${z.実機}`);
    });
    L.push("");
  });

  L.push("\n## ★二の二 ★印（class）で 拾った 注記 ── ★参考\n");
  L.push("★★字の 形に 当てはまらない 注記も、★ここで 見えます。");
  L.push("★★段階2 の 合否には 使いません（★裁定 その117）。\n");
  L.push("| 画面 | 同じ | 見本のみ | 実機のみ |");
  L.push("|---|---|---|---|");
  出.forEach((x) => {
    if (x.err) { L.push(`| ${x.key} | — | — | — |`); return; }
    L.push(`| ${x.key} | ${x.cls.same} | ${x.cls.onlyMihon.length} | ${x.cls.onlyImpl.length} |`);
  });
  出.forEach((x) => {
    if (x.err) return;
    const a = x.cls;
    if (!a.onlyMihon.length && !a.onlyImpl.length) return;
    L.push(`\n**★${x.key}**\n`);
    a.onlyMihon.forEach((s) => L.push(`- ★見本のみ … ${s.replace("注｜", "")}`));
    a.onlyImpl.forEach((s) => L.push(`- ★実機のみ … ${s.replace("注｜", "")}`));
  });

  L.push("\n## ★三 ★ぜんぶ（★行も 含む）── ★参考\n");
  L.push("| 画面 | 同じ | 見本のみ | 実機のみ | 並び |");
  L.push("|---|---|---|---|---|");
  出.forEach((x) => {
    if (x.err) L.push(`| ${x.key} | — | — | — | ★${x.err} |`);
    else L.push(`| ${x.key} | ${x.same} | ${x.onlyMihon.length} | ${x.onlyImpl.length} | ${x.order.length} |`);
  });
  出.forEach((x) => {
    if (x.err) return;
    if (!x.onlyMihon.length && !x.onlyImpl.length && !x.order.length) return;
    L.push(`\n### ★${x.key}（★行も 含む）\n`);
    if (x.onlyMihon.length) {
      L.push("★見本に あって 実機に 無い");
      x.onlyMihon.slice(0, 25).forEach((s) => L.push(`- ${s}`));
    }
    if (x.onlyImpl.length) {
      L.push("\n★実機に あって 見本に 無い");
      x.onlyImpl.slice(0, 25).forEach((s) => L.push(`- ${s}`));
    }
    if (x.order.length) {
      L.push("\n★並びが ちがう");
      x.order.slice(0, 15).forEach((s) => L.push(`- ${s}`));
    }
  });
  L.push("\n## ★道が 無くて くらべて いない 画面\n");
  MAP.skip.forEach((s) => L.push(`- ${s.key} …… ${s.why}`));

  const p = path.join(ROOT, "docs/reports/2026-09-20-段3a-骨組みくらべ.md");
  fs.writeFileSync(p, L.join("\n") + "\n", "utf8");
  console.log("\nREPORT: " + p);
})();
