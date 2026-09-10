// ============================================================================
// A01「きょう（生徒）」── 見本と 実機を 並べる 1枚を 作ります
//
//   ★出どころ docs/design/pack-final/screens/A01-きょう生徒.html
//
//   ★★見本を 書き写しません。★<style> も 中身も、ファイルから 取り出します。
//     ★書き写すと、★見本が 2つに なり、★片方だけ 直ります。
//
//   ★★実機の 写真は、私には 撮れません。
//     ★坂本さんに 撮っていただき、★docs/design/compare/a01-jikki.jpg に
//     ★置いてから、もう一度 これを 走らせます。★写真は 中に 埋め込みます
//     ★（★1枚で 完結させるため。★別ファイルだと 送るときに 外れます）。
//
//   使い方  node tools/compare-a01.js
// ============================================================================

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PACK = path.join(ROOT, "docs/design/pack-final/screens/A01-きょう生徒.html");
const OUT = path.join(ROOT, "docs/design/compare/A01-くらべる.html");
const PHOTO_CANDIDATES = ["a01-jikki.jpg", "a01-jikki.jpeg", "a01-jikki.png", "a01-jikki.PNG"];

const src = fs.readFileSync(PACK, "utf8");
const style = src.slice(src.indexOf("<style>") + 7, src.indexOf("</style>"));
const body = src.slice(src.indexOf("</style>") + 8).trim();

// ★見本の CSS から、★数を そのまま 取り出します。★目で 読みません。
function cssOf(sel, prop) {
  const re = new RegExp("\\" + sel + "\\s*\\{([^}]*)\\}");
  const m = re.exec(style);
  if (!m) return null;
  const n = new RegExp(prop.replace("-", "\\-") + "\\s*:\\s*([^;}]+)").exec(m[1]);
  return n ? n[1].trim() : null;
}

// ★実装の 側は lib/uiKit.js から。★rem を px に 戻して くらべます。
const kit = fs.readFileSync(path.join(ROOT, "lib/uiKit.js"), "utf8");
function kitPx(name) {
  const m = new RegExp(name + ":\\s*\\{[^}]*fontSize:\\s*rem\\(([0-9.]+)\\)").exec(kit);
  return m ? m[1] + "px" : "（見あたりません）";
}

const ROWS = [
  ["画面の題", ".hd h2", "font-size", kitPx("title"), "TYPE.title"],
  ["大きな数字", ".big", "font-size", kitPx("big"), "TYPE.big"],
  ["その単位", ".big s", "font-size", kitPx("bigUnit"), "TYPE.bigUnit"],
  ["カードの小見出し", ".mini", "font-size", kitPx("mini"), "TYPE.mini"],
  ["あなたのふだん", ".usu", "font-size", kitPx("usual"), "TYPE.usual"],
  ["小見出し", ".h3", "font-size", kitPx("h3"), "TYPE.h3"],
  ["主ボタン", ".btn", "font-size", kitPx("btn"), "TYPE.btn"],
  ["下のタブ", ".tb", "font-size", kitPx("tab"), "TYPE.tab"],
  ["帯の題", ".obi .t", "font-size", kitPx("obiTitle"), "TYPE.obiTitle"],
  ["本文", ".speak", "font-size", kitPx("body"), "TYPE.body"]
];

const rows = ROWS.map(([name, sel, prop, mine, where]) => {
  const theirs = cssOf(sel, prop);
  const same = theirs && mine && theirs.replace(/\s/g, "") === mine.replace(/\s/g, "");
  return { name, sel, theirs: theirs || "（見本に無し）", mine, where, same };
});

// ★画面に 出る 文字は .txt が 正です（★パックの 決め）。
const txt = fs.readFileSync(
  path.join(ROOT, "docs/design/pack-final/screens/A01-きょう生徒.txt"), "utf8");
const lines = txt.split("\n").map((s) => s.trim()).filter((s) => s.length > 1);

// ★写真が 置かれていたら、★1枚の 中に 埋め込みます。
let photo = null, photoName = null;
for (const f of PHOTO_CANDIDATES) {
  const p = path.join(ROOT, "docs/design/compare", f);
  if (fs.existsSync(p)) {
    const ext = f.split(".").pop().toLowerCase();
    photo = "data:image/" + (ext === "png" ? "png" : "jpeg") + ";base64,"
      + fs.readFileSync(p).toString("base64");
    photoName = f;
    break;
  }
}

const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

const html = `<!doctype html><meta charset="utf-8">
<title>A01 きょう（生徒）── 見本と 実機</title>
<style>
${style}
/* ---- ここから 下は、くらべる ための 囲いです（★見本の CSS では ありません） ---- */
body{margin:0;background:#EFE7D6;font-family:-apple-system,"Hiragino Sans",sans-serif;color:#241914}
.wrap{max-width:900px;margin:0 auto;padding:20px 16px 60px}
h1.t{font-size:19px;font-weight:700;margin:0 0 4px}
p.lead{font-size:13px;color:#6b5d52;line-height:1.8;margin:0 0 18px}
.panes{display:flex;gap:18px;flex-wrap:wrap;align-items:flex-start}
.pane{flex:1 1 330px;min-width:300px}
.pane h2.c{font-size:12px;letter-spacing:.08em;color:#6b5d52;margin:0 0 8px}
.slot{width:330px;min-height:600px;border:2px dashed #C9B79E;border-radius:22px;
  display:flex;align-items:center;justify-content:center;text-align:center;
  color:#8C6115;font-size:13px;line-height:1.9;padding:24px;background:#FBF6EA}
.shot{width:330px;border-radius:22px;border:1px solid #E4DCC9;display:block}
table.d{width:100%;border-collapse:collapse;margin-top:26px;font-size:13px}
table.d th,table.d td{border-bottom:1px solid #E4DCC9;padding:8px 6px;text-align:left;vertical-align:top}
table.d th{font-size:11px;letter-spacing:.06em;color:#6b5d52;font-weight:400}
.ok{color:#4F7562}.ng{color:#A8583F;font-weight:700}
ul.words{font-size:13px;line-height:1.9;padding-left:1.2em;color:#241914}
.note2{font-size:12px;color:#6b5d52;line-height:1.9;background:#F6F1E4;
  border:1px solid #E8DFC8;border-radius:12px;padding:12px 14px;margin-top:22px}
</style>
<div class="wrap">
<h1 class="t">A01「きょう（生徒）」── 見本と 実機</h1>
<p class="lead">
左が 見本です。<b>書き写していません。</b>
<code>docs/design/pack-final/screens/A01-きょう生徒.html</code> の
&lt;style&gt; と 中身を、そのまま 取り出して 貼っています。<br>
右が 実機です。${photo
  ? `<b>${esc(photoName)}</b> を 埋め込みました。`
  : "<b>まだ 写真が ありません。</b>"}
</p>

<div class="panes">
  <div class="pane">
    <h2 class="c">見本（design_4 ／ 360×812）</h2>
    ${body}
  </div>
  <div class="pane">
    <h2 class="c">実機（坂本さんの iPhone）</h2>
    ${photo
      ? `<img class="shot" src="${photo}" alt="実機の写真">`
      : `<div class="slot">ここに 実機の 写真が 入ります。<br><br>
         iPhone で「きょう」の 画面を 撮って、<br>
         <b>docs/design/compare/a01-jikki.jpg</b><br>として 置いてから<br>
         <b>node tools/compare-a01.js</b><br>を もう一度 走らせます。</div>`}
  </div>
</div>

<h2 class="c" style="margin-top:30px">① 数の 突き合わせ（★写真が なくても 分かるぶん）</h2>
<table class="d">
<tr><th>ところ</th><th>見本の CSS</th><th>見本の 値</th><th>実装の 値</th><th>どこ</th><th></th></tr>
${rows.map((r) => `<tr>
<td>${esc(r.name)}</td><td><code>${esc(r.sel)}</code></td>
<td>${esc(r.theirs)}</td><td>${esc(r.mine)}</td><td><code>${esc(r.where)}</code></td>
<td class="${r.same ? "ok" : "ng"}">${r.same ? "同じ" : "ちがう"}</td></tr>`).join("\n")}
</table>

<h2 class="c" style="margin-top:30px">② 画面に 出る 文字（★.txt が 正）</h2>
<ul class="words">${lines.map((l) => `<li>${esc(l)}</li>`).join("")}</ul>

<div class="note2">
★この 1枚は <code>tools/compare-a01.js</code> が 作ります。手で 直さないでください。<br>
★見本を 書き写していないので、パックを 差し替えれば、ここも 変わります。<br>
★①の 表は 数だけです。<b>余白・置きかた・色は、右の 写真と 見くらべて</b> 判じます。<br>
★実装は <code>rem</code> で 書いてあります。上の 表は 1rem＝16px に 戻した 値です。
</div>
</div>`;

fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, html, "utf8");
console.log("書きました:", path.relative(ROOT, OUT));
console.log("写真:", photo ? photoName : "★まだ ありません");
rows.forEach((r) => console.log(`  ${r.same ? "同じ" : "★ちがう"}  ${r.name}  見本 ${r.theirs} / 実装 ${r.mine}`));
