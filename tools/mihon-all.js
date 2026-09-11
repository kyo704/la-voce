#!/usr/bin/env node

// ============================================================================
// 見本の 画面を、★ぜんぶ 撮る（★108コマ）
//
//   ★出どころ 坂本さんの お指図（★2026-09-11）
//     「このまま、108画面全体の、コンタクトシートの撮影に、進めてください。」
//   ★Opus の 数え方（★同日）
//     「スマホ版の内訳は、下位画面(SC)76、シート(SH)22です。」
//
//   ★正の 見本　docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//
//   ★★数え方
//     ★SC　76　見本の 中で 名前で 引ける 下位画面
//     ★SH　22　下から 出る 1枚
//     ★帯　10　5つの タブと、★その 切替（ふりかえる 4・ノート 4）
//     ★合わせて 108
//
//   ★★撮り方
//     ★見本 自身の 関数を 呼びます（go／setFk／push／openSheet）。
//     ★押す 場所を 探しません。★そのほうが 確かで 速いからです。
//     ★★引数の 要る 画面は、★0 を 渡します（★見本の 見本データの 1件目）。
//     ★★撮れなかった ものは、★理由を そのまま 残します。★黙って 飛ばしません。
//
//   ★★電話の 枠（.ph）は 高さ 812px で、★中（.bd）が 自分で 送ります。
//     ★上限を 外してから 撮ります。★下が 写らない のを 防ぎます。
//
//   使い方  node tools/mihon-all.js
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const MIHON = path.join(ROOT, "docs", "design", "pack-final",
  "00-動く見本（さわれる・全画面）.html");
const OUT = path.join(ROOT, "docs", "design", "compare", "all", "mihon");

/** ★帯（★タブと 切替）。★SC でも SH でもない 10コマ。 */
const TABS = [
  { key: "画面-きょう", run: "go('きょう')" },
  { key: "画面-記録", run: "go('記録')" },
  { key: "画面-ふりかえる-並べる", run: "go('ふりかえる');setFk('並べる')" },
  { key: "画面-ふりかえる-さかのぼる", run: "go('ふりかえる');setFk('さかのぼる')" },
  { key: "画面-ふりかえる-くらべる", run: "go('ふりかえる');setFk('くらべる')" },
  { key: "画面-ふりかえる-かぞえる", run: "go('ふりかえる');setFk('かぞえる')" },
  { key: "画面-ノート-稽古", run: "go('ノート');S.note='稽古';draw()" },
  { key: "画面-ノート-レパートリー", run: "go('ノート');S.note='レパートリー';draw()" },
  { key: "画面-ノート-連絡", run: "go('ノート');S.note='連絡';draw()" },
  { key: "画面-ノート-1枚", run: "go('ノート');S.note='1枚';draw()" }
];

/**
 * ★どの タブから 開くか。
 *
 *   ★★「戻る」の 行き先が 正しく 出るように します。
 *     ★見本の bk('くらべる') は、★字を 書くだけです。
 *     ★けれど 下の 帯は、★いま どの タブかで 変わります。
 *   ★★分からない ものは「きょう」から 開きます。
 */
const HOME_OF = [
  [/ならべ|並べ|さかのぼ|くらべ|かぞえ|順番|重なり|調べる|前3日|開いた記録/, "ふりかえる"],
  [/ノート|稽古|曲|レパート|連絡|受診|たぶん|宛先|未送信|さがす|日を選ぶ/, "ノート"],
  [/たな|置ける枠|全部|まだ|店|したく|ひつじ/, "ひつじ"],
  [/記録|休む|きまり/, "記録"]
];
function homeOf(name) {
  const f = HOME_OF.find(([re]) => re.test(name));
  return f ? f[1] : "きょう";
}

(async () => {
  const { chromium } = require("playwright");
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch({ channel: "chrome" });
  const ctx = await browser.newContext({
    viewport: { width: 460, height: 1000 }, deviceScaleFactor: 3,
    locale: "ja-JP", timezoneId: "Asia/Tokyo"
  });
  const page = await ctx.newPage();
  await page.goto("file://" + MIHON, { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(600);

  // ★★名前は 見本 自身から 取ります。★私が 書き写しません。
  //   ★書き写すと、★見本が 増えたとき 片方だけ 古く なります。
  const names = await page.evaluate(() => ({
    sc: Object.keys(window.SC || {}),
    sh: Object.keys(window.SH || {})
  }));
  console.log("★見本の 数　SC " + names.sc.length + " ／ SH " + names.sh.length
    + " ／ 帯 " + TABS.length);

  /**
   * ★引数の 要る 画面。★0 では 空に なるか、★落ちます。
   *
   *   ★★見本の 中の 呼び出しから、★そのまま 写しました。
   *     ★SC['前3日']　　　 push('前3日', DAY.indexOf(x))　★日の 番号
   *     ★SC['組織']　　　 push('組織','gakubu')　　　　　 ★欄の 名前
   *     ★SC['授業を入れる'] push('授業を入れる', key)　　　★"曜-コマ" の 形
   *     ★SC['予定の中身']　同じ 形
   *     ★SC['自分のコマの時間'] push(…, i)　★KOMA_MY[ME] が 要ります
   *     ★SC['受診プレビュー'] ★S.ju（★選んだ 欄）が 先に 要ります
   *     ★SH['したく']　　　★S.k1／S.k2 が 先に 要ります（★openDr）
   */
  const ARG = {
    "SC-前3日": { arg: "12", before: "" },
    "SC-組織": { arg: "'gakubu'", before: "" },
    "SC-授業を入れる": { arg: "'1-0'", before: "KOMA_MY[ME]=KOMA_MY[ME]||MST.koma;" },
    "SC-予定の中身": { arg: "'1-0'", before: "KOMA_MY[ME]=KOMA_MY[ME]||MST.koma;" },
    "SC-自分のコマの時間": { arg: "0", before: "KOMA_MY[ME]=KOMA_MY[ME]||MST.koma.slice();" },
    "SC-受診プレビュー": { arg: "0",
      before: "S.ju={};JU_MIN.forEach(function(k){S.ju[k]=1});JU_OPT.forEach(function(k){S.ju[k]=0});" },
    "SH-したく": { arg: "0", before: "S.k1='きるもの';S.k2='全部';S.ord=0;S.picked=0;" }
  };

  const shots = [];
  TABS.forEach((t) => shots.push({ key: t.key, run: t.run }));
  names.sc.forEach((n) => {
    const key = "SC-" + n;
    const a = ARG[key] || { arg: "0", before: "" };
    shots.push({
      key,
      run: "go('" + homeOf(n) + "');" + a.before + "S.stack=[];push('"
        + n.replace(/'/g, "\\'") + "'," + a.arg + ")"
    });
  });
  names.sh.forEach((n) => {
    const key = "SH-" + n;
    const a = ARG[key] || { arg: "0", before: "" };
    shots.push({
      key,
      run: "go('" + homeOf(n) + "');" + a.before + "S.stack=[];openSheet('"
        + n.replace(/'/g, "\\'") + "'," + a.arg + ")"
    });
  });
  console.log("★撮る コマ　" + shots.length);

  const missed = [];
  const blank = [];
  for (const sc of shots) {
    try {
      await page.goto("file://" + MIHON, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(260);
      await page.evaluate(sc.run);
      await page.waitForTimeout(260);
      await page.evaluate(() => {
        const ph = document.querySelector(".ph");
        const bd = document.querySelector("#bd");
        if (ph) { ph.style.height = "auto"; ph.style.overflow = "visible"; }
        if (bd) { bd.style.overflow = "visible"; bd.style.height = "auto"; }
        const sheet = document.querySelector("#sheet");
        if (sheet && sheet.classList.contains("on")) {
          sheet.style.position = "static";
          sheet.style.transform = "none";
          sheet.style.maxHeight = "none";
          const mask = document.querySelector("#mask");
          if (mask) mask.style.display = "none";
        }
        document.querySelectorAll("h1, p.lead").forEach((e) => { e.style.display = "none"; });
      });
      await page.waitForTimeout(200);
      const dump = await page.evaluate(() => {
        const root = document.querySelector(".ph");
        const out = [];
        const walk = (e) => {
          const st = window.getComputedStyle(e);
          if (st.display === "none" || st.visibility === "hidden") return;
          const tag = e.tagName.toLowerCase();
          const own = [...e.childNodes].filter((n) => n.nodeType === 3)
            .map((n) => n.textContent.trim()).join(" ").trim();
          if (own) out.push({ tag, text: own.replace(/\s+/g, " ").slice(0, 60) });
          [...e.children].forEach(walk);
        };
        if (root) walk(root);
        return out;
      });
      const safe = sc.key.replace(/[\/\\:*?"<>|]/g, "_");
      await (await page.locator(".ph").first())
        .screenshot({ path: path.join(OUT, safe + ".png") });
      fs.writeFileSync(path.join(OUT, safe + ".json"),
        JSON.stringify(dump, null, 1), "utf8");
      // ★★中身が ほとんど 無い コマは、★印を つけます。
      //   ★★引数が 要る 画面に 0 を 渡して、★空に なった かも しれません。
      //   ★黙って「撮れた」に しません。
      if (dump.length < 8) blank.push(sc.key + "（" + dump.length + "件）");
      console.log("  ✓ " + sc.key + (dump.length < 8 ? "　★中身が わずか" : ""));
    } catch (e) {
      missed.push(sc.key + "  " + String(e.message).split("\n")[0].slice(0, 70));
      console.log("  ✗ " + sc.key);
    }
  }
  await browser.close();

  const lines = [];
  lines.push("★見本を ぜんぶ 撮りました（" + (shots.length - missed.length)
    + " / " + shots.length + "）");
  lines.push("");
  lines.push("★撮れなかった もの（" + missed.length + "件）");
  missed.forEach((m) => lines.push("  " + m));
  lines.push("");
  lines.push("★中身が わずかな もの（" + blank.length + "件）");
  lines.push("　★引数の 要る 画面に 0 を 渡して、★空に なった かも しれません。");
  blank.forEach((b) => lines.push("  " + b));
  fs.writeFileSync(path.join(OUT, "見本の撮影メモ.txt"), lines.join("\n") + "\n", "utf8");
  console.log("\n★撮れなかった もの " + missed.length
    + " 件 ／ 中身が わずか " + blank.length + " 件");
})().catch((e) => { console.error(String(e).slice(0, 400)); process.exit(1); });
