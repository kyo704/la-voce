// ============================================================================
// ★見本と 実機を 左右に 並べた 1枚を 作ります。
//
//   ★★私（Code）には ブラウザが ありません。★画面を 撮れません。
//     ★だから、★見本は HTML の まま 貼り、★実機は 坂本さんの 写真を 貼ります。
//   ★★1枚で 完結させます。★写真も 羊も、★中に 埋めます。
//     ★机の上に 写しても、★そのまま 開けます。
//
//   ★★使い方  node docs/design/compare/_A01.js
//     ★画面ごとの 小さな ファイル（_A01.js ／ _A03.js …）が、★これを 呼びます。
//     ★★見本の 中身を 書き写しません。★pack の HTML から 取り出します。
//       ★書き写すと、★見本と ずれた 写しが もう1つ できます。
//
//   ★★写真が まだ 無いときも 作れます。★右は「これから」の 枠に なります。
// ============================================================================
const fs = require("fs");
const path = require("path");

const HERE = __dirname;
const ROOT = path.join(HERE, "..", "..", "..");
const SCREENS = path.join(ROOT, "docs", "design", "pack", "screens");

function scopeMihonCss(css) {
  // ★見本の CSS は * と body に 効きます。★この1枚ぜんぶを 塗り替えてしまいます。
  //   ★だから、★見本の 決まりは .mihon の 中だけに 閉じ込めます。
  return css
    .replace(/(^|\})\s*\*\{/g, "$1 .mihon *{")
    .replace(/(^|\})\s*body\{/g, "$1 .mihon{")
    .replace(/(^|\})\s*:root\{/g, "$1 .mihon{")
    .split("\n")
    .map((line) => {
      const m = line.match(/^([.#a-zA-Z][^{@]*)\{(.*)$/);
      if (!m) return line;
      if (m[1].trim().startsWith(".mihon")) return line;
      return m[1].split(",").map((x) => ".mihon " + x.trim()).join(",") + "{" + m[2];
    })
    .join("\n");
}

function readMihon(base) {
  const src = fs.readFileSync(path.join(SCREENS, base + ".html"), "utf8");
  const a = src.indexOf("<style>");
  const b = src.indexOf("</style>");
  if (a < 0 || b < 0) throw new Error("見本の <style> が 見つかりません: " + base);
  let css = src.slice(a + "<style>".length, b);
  const body = src.slice(b + "</style>".length).trim();
  if (!body.startsWith('<div class="ph">')) throw new Error("見本の .ph が 見つかりません: " + base);
  // ★見本の 最後の1行は、★見本を 単体で 開くための 地の色です。★この1枚では 邪魔です。
  const tail = "body{margin:24px;background:#EFE7D6}";
  if (!css.includes(tail)) throw new Error("見本の body 行が 見つかりません: " + base);
  css = css.replace(tail, "");
  return { css: scopeMihonCss(css), body };
}

/**
 * @param o.id       画面の 番号（A01 など）
 * @param o.base     pack/screens の ファイル名（拡張子なし）
 * @param o.title    この1枚の 題
 * @param o.photo    実機の 写真（compare/ の 中の 名前）。★無ければ null
 * @param o.photoAt  写真を 撮った とき（★文字列）
 * @param o.device   端末の 大きさ（★文字列）
 * @param o.diffs    食い違いの 一覧
 * @param o.note     下の 註（★HTML 可）
 */
function build(o) {
  const { css, body } = readMihon(o.base);

  const shot = o.photo
    ? fs.readFileSync(path.join(HERE, o.photo)).toString("base64")
    : null;
  const shotType = o.photo && /\.png$/i.test(o.photo) ? "png" : "jpeg";

  const counts = { ng: 0, ask: 0, ok: 0 };
  o.diffs.forEach((d) => {
    counts[d.ng === true ? "ng" : d.ng === "ask" ? "ask" : "ok"]++;
  });

  const rows = o.diffs.map((d) => {
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

  const right = shot
    ? `<img class="shot" alt="実機の 画面" src="data:image/${shotType};base64,${shot}">`
    : `<div class="yet">★実機の 写真を いただければ、<br>ここに 並べます。<br><s>390×844 で 1枚 撮ってください</s></div>`;

  const rightLabel = shot
    ? `<div class="lab"><b>実機</b><s>${o.photoAt}</s></div>`
    : `<div class="lab"><b>実機</b><s>写真 待ち</s></div>`;

  const html = `<!doctype html><html lang="ja"><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${o.id} ${o.title}　見本と実機</title>
<style>
${css}

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
.yet{width:360px;height:812px;border-radius:30px;border:1px dashed #C9BCA2;
 background:#F6F1E4;display:flex;flex-direction:column;align-items:center;justify-content:center;
 text-align:center;font-size:13px;color:#6D5D50;line-height:2}
.yet s{text-decoration:none;font-size:11.5px;color:#8C6115}
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

<h1>${o.id}「${o.title}」　見本と 実機</h1>
<p class="sub">
 見本　<b>docs/design/pack/screens/${o.base}.html</b>（そのまま 埋めています。書き写して いません）<br>
 ${shot ? `実機　<b>${o.photoAt}</b>　坂本さんの 端末（${o.device}）<br>` : ""}
 ★私（Code）には ブラウザが ありません。画面を 撮れないので、見本は <b>HTML の まま</b>、実機は <b>いただいた 写真</b>を 並べています。
</p>

<div class="pair">
 <div class="col">
  <div class="lab"><b>見本</b><s>Opus ／ HTML が 正</s></div>
  <div class="mihon">${body}</div>
 </div>
 <div class="col">
  ${rightLabel}
  ${right}
 </div>
</div>

<h2 class="sec">食い違い　${o.diffs.length}点　── ★${counts.ng}点は 直しました${counts.ask ? `。★${counts.ask}点は ご判断` : ""}${counts.ok ? `。★${counts.ok}点は 差では ありません` : ""}</h2>
<table>
<tr><th></th><th>ところ</th><th>見本</th><th>実機／いま</th><th>どうするか</th></tr>
${rows}
</table>

<p class="note">${o.note}</p>

</div></html>`;

  const out = path.join(HERE, `${o.id}-${o.title}-見本と実機.html`);
  fs.writeFileSync(out, html);
  console.log("書きました " + out);
  console.log("大きさ " + (fs.statSync(out).size / 1024).toFixed(0) + " KB");
  return out;
}

module.exports = { build };
