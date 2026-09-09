// ============================================================================
// ★見本と 実機を 左右に 並べた 1枚を 作ります（★A01「きょう ／ 生徒」）。
//
//   ★★私（Code）には ブラウザが ありません。★画面を 撮れません。
//     ★だから、★見本は HTML の まま 貼り、★実機は 坂本さんの 写真を 貼ります。
//   ★★1枚で 完結させます。★写真も 羊も、★中に 埋めます。
//     ★机の上に 写しても、★そのまま 開けます。
// ============================================================================
const fs = require("fs");
const path = require("path");

const ROOT = "/Users/sakamotokyou/Desktop/la-voce";
const SRC = path.join(ROOT, "docs/design/pack/screens/A01-きょう生徒.html");
const SHOT = path.join(ROOT, "docs/design/compare/A01-実機-2026-09-09.jpeg");
const OUT = path.join(ROOT, "docs/design/compare/A01-きょう-見本と実機.html");

const src = fs.readFileSync(SRC, "utf8");

// ★見本から、★形（style）と 中身（.ph）を そのまま 取り出します。
//   ★書き写しません。★写すと、★見本と ずれた 写しが もう1つ できます。
const sIdx = src.indexOf("<style>");
const eIdx = src.indexOf("</style>");
if (sIdx < 0 || eIdx < 0) throw new Error("見本の <style> が 見つかりません");
let css = src.slice(sIdx + "<style>".length, eIdx);
const body = src.slice(eIdx + "</style>".length).trim();
if (!body.startsWith('<div class="ph">')) throw new Error("見本の .ph が 見つかりません: " + body.slice(0, 40));

// ★見本の最後の1行は、★見本を 単体で 開くための 地の色です。
//   ★この1枚では 邪魔に なるので、★外します。
const tail = "body{margin:24px;background:#EFE7D6}";
if (!css.includes(tail)) throw new Error("見本の body 行が 見つかりません");
css = css.replace(tail, "");

// ★見本の CSS は、★* と body に 効きます。★この1枚ぜんぶを 塗り替えてしまいます。
//   ★だから、★見本の 決まりは .mihon の 中だけに 閉じ込めます。
const scoped = css
  .replace(/(^|\})\s*\*\{/g, "$1 .mihon *{")
  .replace(/(^|\})\s*body\{/g, "$1 .mihon{")
  .replace(/(^|\})\s*:root\{/g, "$1 .mihon{")
  .split("\n")
  .map((line) => {
    // ★.xxx / h1 などの 選び方に、★前置きを 付けます。
    const m = line.match(/^([.#a-zA-Z][^{@]*)\{(.*)$/);
    if (!m) return line;
    if (m[1].trim().startsWith(".mihon")) return line;
    const sel = m[1].split(",").map((s) => ".mihon " + s.trim()).join(",");
    return sel + "{" + m[2];
  })
  .join("\n");

const shot = fs.readFileSync(SHOT).toString("base64");

// ============================================================================
// ★食い違いの 一覧。
//   ★「なぜ」を 書きます。★どこが 違うか だけでは、★直せません。
// ============================================================================
const DIFFS = [
  { n: 1, where: "下のタブ", ng: true,
    mihon: "5つ 等分。絵の印なし。選ばれた所の 上に 2px の 線。文字 10px（選ばれたら 700）。高さ 56px。はみ出しません。",
    jikki: "横に 流れる 丸い札。絵の印つき。いちばん右の「ひつじ」が 切れています。",
    naosi: "門の中だけの 帯（components/TabBarV2.jsx）に 分けました。★38人の 帯は 触っていません。" },
  { n: 2, where: "大きな数字の 書体", ng: true,
    mihon: "ゴシック 26px 700。",
    jikki: "明朝（Cormorant）。★0 が o に 見えます ──「6時間o分」。",
    naosi: "ff-display を 外し、★HomeV2 で 書体を ゴシックに 押さえました。tokens.md §2「アプリは 全部ゴシック。明朝は 使いません」。" },
  { n: 3, where: "数字の 単位", ng: true,
    mihon: "6<s>時間</s>20<s>分</s> ── 数は 26px 700、単位は 12px 400。",
    jikki: "「6時間0分」が ぜんぶ 同じ 大きさ。",
    naosi: "lib/todayCard.js の sleepParts が、数と 単位に 分けて 返します。" },
  { n: 4, where: "画面の題「きょう」", ng: true,
    mihon: "ゴシック 17px 400、字間 .06em。",
    jikki: "明朝の 斜体、24px。",
    naosi: "ff-display italic を 外し、17px・字間 .06em に しました。" },
  { n: 5, where: "羊の 大きさ", ng: "ask",
    mihon: "幅 186px ／ 画面 360px ＝ <b>51.7%</b>。高さ 247px。",
    jikki: "幅 92px ／ 画面 414px ＝ <b>約 22%</b>。",
    naosi: "★ご判断を いただきたい 1点です。以前「180 は 大きすぎる」と 伺い、120 に しました。見本は それより 大きいです。" },
  { n: 6, where: "右上の 歯車", ng: true,
    mihon: "26px の 丸。1px の 枠。⚙ は 12px。",
    jikki: "40px の 丸。色つきの 絵文字。",
    naosi: "見た目は 26px、★押せる所は 44px（透明な 余白）。「どの段でも 44 以上」を 守っています。" },
  { n: 7, where: "「きょうを 記録する」", ng: true,
    mihon: "角 13。上下 15px。16px 700、字間 .06em。影 0 3px 10px。",
    jikki: "角 10。高さ 52。600。下だけ 3px の 線。",
    naosi: "見本に 合わせました（lib/uiKit.js の primaryButtonStyle）。" },
  { n: 8, where: "カードと すき間", ng: true,
    mihon: "角 14。内側 12/13。カードどうし 9px。2枚の あいだ 9px。",
    jikki: "内側 14。あいだ 12px。2枚の あいだ 10px。",
    naosi: "見本に 合わせました（lib/uiKit.js の cardStyle と SPACE）。" },
  { n: 9, where: "きょうの予定 ／ 近い本番の 帯", ng: false,
    mihon: "2本 出ています（15:00 レッスン ／ 9月14日 実技試験）。",
    jikki: "出ていません。",
    naosi: "★不具合では ありません。その日に 予定が 無いからです。見本の 決まり「該当が なければ、その行を 出しません。空の枠を 置きません」。" },
  { n: 10, where: "みつけたこと", ng: "ask",
    mihon: "「あなたが いちばんよく書くのは、木曜の夜です。」",
    jikki: "見出しだけ。中身は ありません。",
    naosi: "★見本の 文は<b>「書く 習慣」</b>についての 気づきです。いまの 中身は<b>「からだ」</b>の 気づきを 流しています。<b>別のもの</b>で、書く習慣の ほうは まだ ありません。" },
  { n: 11, where: "色（えんじ・紙・線）", ng: false,
    mihon: "--enji #840C24 ／ --paper #FBF6EA ／ --card #FFFFFF",
    jikki: "curtain #7A1F2B ／ paper #F6F1E7 ／ card #FFFDF8",
    naosi: "★直しません。「実際に 画面に 出ている 値を 正とし、仕様書の <em>役割</em>だけを 割り当てる」── 既に いただいた お決めです（lib/tokens.js）。色を 変えるなら、この作業の ついででは なく、独立した ご判断で。" }
];

const rows = DIFFS.map((d) => {
  const badge = d.ng === true
    ? '<span class="bd ng">直しました</span>'
    : d.ng === "ask"
      ? '<span class="bd ask">ご判断</span>'
      : '<span class="bd ok">差では ありません</span>';
  return `<tr>
    <td class="num">${d.n}</td>
    <td class="wh">${d.where}<br>${badge}</td>
    <td>${d.mihon}</td>
    <td>${d.jikki}</td>
    <td class="na">${d.naosi}</td>
  </tr>`;
}).join("\n");

const html = `<!doctype html><html lang="ja"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>A01 きょう／生徒　見本と実機</title>
<style>
${scoped}

/* ---- この1枚じたいの 形（★見本の 決まりとは 別です） ---- */
html,body{margin:0;padding:0}
body{background:#EFE7D6;color:#261913;
 font-family:"Hiragino Sans","Noto Sans JP",system-ui,sans-serif;
 -webkit-font-smoothing:antialiased;line-height:1.8}
.wrap{max-width:1180px;margin:0 auto;padding:28px 20px 60px}
h1{font-size:22px;letter-spacing:.04em;margin:0 0 6px}
.sub{font-size:12.5px;color:#6D5D50;margin:0 0 26px}
.sub b{color:#261913}
.pair{display:flex;gap:26px;flex-wrap:wrap;align-items:flex-start;margin-bottom:34px}
.col{width:360px}
.lab{font-size:13px;margin-bottom:9px;letter-spacing:.04em}
.lab b{font-size:14.5px}
.lab s{color:#6D5D50;text-decoration:none;font-size:12px;margin-left:6px}
.shot{width:360px;border-radius:30px;border:1px solid #DFD4BE;display:block;
 box-shadow:0 1px 0 rgba(0,0,0,.03),0 6px 18px rgba(90,72,48,.07);background:#FBF6EA}
h2.sec{font-size:15px;letter-spacing:.04em;margin:34px 0 10px}
table{border-collapse:collapse;width:100%;background:#FFFDF8;
 border:1px solid #E4DAC4;border-radius:12px;overflow:hidden}
th,td{text-align:left;vertical-align:top;padding:10px 12px;font-size:12.5px;
 border-bottom:1px solid #F0E9DA;line-height:1.75}
th{background:#F6F1E4;font-size:11.5px;letter-spacing:.08em;color:#6D5D50;font-weight:400}
tr:last-child td{border-bottom:none}
td.num{width:26px;color:#6D5D50}
td.wh{width:112px}
td.na{width:290px;color:#6D5D50}
.bd{display:inline-block;border-radius:99px;padding:2px 9px;font-size:10.5px;margin-top:5px;
 border:1px solid #E4DAC4;background:#fff;color:#6D5D50;white-space:nowrap}
.bd.ng{background:#840C24;color:#fff;border-color:#840C24}
.bd.ask{background:#fff;color:#8C6115;border-color:#8C6115}
.note{font-size:12px;color:#6D5D50;line-height:1.9;margin-top:14px;
 background:#F6F1E4;border:1px solid #E8DFC8;border-radius:12px;padding:12px 14px}
.note b{color:#261913}
</style>
<div class="wrap">

<h1>A01「きょう ／ 生徒」　見本と 実機</h1>
<p class="sub">
 見本　<b>docs/design/pack/screens/A01-きょう生徒.html</b>（そのまま 埋めています。書き写して いません）<br>
 実機　<b>2026年9月9日 19:59</b>　坂本さんの 端末（828×1792 ＝ 414×896）<br>
 ★私（Code）には ブラウザが ありません。画面を 撮れないので、見本は <b>HTML の まま</b>、実機は <b>いただいた 写真</b>を 並べています。
</p>

<div class="pair">
 <div class="col">
  <div class="lab"><b>見本</b><s>Opus ／ HTML が 正</s></div>
  <div class="mihon">${body}</div>
 </div>
 <div class="col">
  <div class="lab"><b>実機</b><s>2026-09-09 19:59</s></div>
  <img class="shot" alt="実機の きょう画面" src="data:image/jpeg;base64,${shot}">
 </div>
</div>

<h2 class="sec">食い違い　11点　── ★7点は 直しました。★2点は ご判断。★2点は 差では ありません</h2>
<table>
<tr><th></th><th>ところ</th><th>見本</th><th>実機</th><th>どうするか</th></tr>
${rows}
</table>

<p class="note">
<b>数え方について。</b>見本の 画面は 360px 幅、実機の 写真は 414px 幅です。
そのまま px で くらべると ずれるので、<b>画面の 幅に 対する 割合</b>で 数えています（5番）。<br>
<b>9番と 11番は、直すところでは ありません。</b>9番は その日に 予定が 無いだけ、11番は 既に いただいた お決めです。<br>
<b>5番と 10番だけ、ご判断を お願いします。</b>ほかの 7点は、見本の とおりに 直しました（★右の 写真は 直す 前の 姿です）。
</p>

</div></html>`;

fs.writeFileSync(OUT, html);
console.log("書きました " + OUT);
console.log("大きさ " + (fs.statSync(OUT).size / 1024).toFixed(0) + " KB");
