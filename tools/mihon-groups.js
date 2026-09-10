// ★見本の 71画面を、★群に 分けて 数えます（★2026-09-11）
const { SC, words } = require("./mihon-scan");
const fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "..");
let all = "";
["components", "lib", "app"].forEach((d) => (function walk(x) {
  for (const f of fs.readdirSync(x, { withFileTypes: true })) {
    const p = path.join(x, f.name);
    if (f.isDirectory()) { if (!/^(tests|node_modules|\.next)$/.test(f.name)) walk(p); }
    else if (/\.(js|jsx)$/.test(f.name)) all += fs.readFileSync(p, "utf8") + "\n";
  }
})(path.join(ROOT, d)));

const GROUPS = {
  "個人 ── もう ある 画面": ["もっと","設定","聞いてほしいこと","プラン","学ぶ","記事","書き出す","同意","退会","たな","台帳","全部","まだ","さがす","曲","曲を直す","曲を足す","稽古を書く","ノート本文","たぶん本文","本番の予定","本番の前後","調べる","前3日","順番","記録のきまり","日を選ぶ","集まり具合"],
  "個人 ── 新しい 画面": ["見やすさ","受診プレビュー","休む","レッスン","門下","自分の門下"],
  "生徒 × 教室（★まるごと 新しい）": ["通っているところ","通っているところの中身","やめるとどうなるか","招かれている","合言葉で入る","あなたの重なり","時間割","自分のコマ","自分のコマの時間","自分の予定","予定の名前","予定の中身","授業を入れる"],
  "運営 ── 人と 役職": ["役職の一覧","役職の中身","役職を変える","ひとの一覧","組織","その人","代表を決める","学科を決める"],
  "運営 ── 日程と 出欠": ["出欠つけ","日程を組む","置ける枠","自動の条件","コマの中身","コマを決める","コマの時間","場所を決める","重なり","重なりを直す","まだの人","門下の人","行事を出す"],
  "運営 ── 連絡": ["お知らせを書く","未送信","門下を開く","開いた記録"],
  "お金": ["支払い方法","宛先","領収書","請求書の宛名"]
};

const SAMPLE = /^(高木|井上|青木|柴田|黒田|服部|大西|斎藤|三浦|小林|田中|渡辺|佐藤|田村|坂本|山田|鈴木|加藤|中村|伊藤|松本|木村|清水|高橋)/;
const SAMPLEWORD = /ラ・ボエーム|冬の旅|からたちの花|プッチーニ|シューベルト|山田耕筰|ミミ|○○|第1ホール|音楽大学|声楽科|れい：/;
const isSample = (w) => SAMPLE.test(w) || SAMPLEWORD.test(w) || /^\d+$/.test(w)
  || (/^[0-9０-９]{1,2}[月日時分]/.test(w) && w.length <= 6) || /[;{}=]/.test(w);

const seen = new Set();
for (const [g, names] of Object.entries(GROUPS)) {
  let gTotal = 0, gHit = 0;
  const lines = [];
  names.forEach((n) => {
    seen.add(n);
    const body = SC.get(n);
    if (!body) { lines.push(`  ？ ${n}（見本に ありません）`); return; }
    const ws = words(body).filter((w) => !isSample(w));
    const hit = ws.filter((w) => all.includes(w)).length;
    gTotal += ws.length; gHit += hit;
    const pct = ws.length ? Math.round(hit / ws.length * 100) : 100;
    lines.push(`  ${pct >= 80 ? "◎" : pct >= 40 ? "○" : pct > 0 ? "△" : "×"} ${String(pct).padStart(3)}%  ${n}  (${hit}/${ws.length})`);
  });
  const pct = gTotal ? Math.round(gHit / gTotal * 100) : 0;
  console.log(`\n【${g}】 ${names.length}画面 ／ 言葉 ${gHit}/${gTotal} ＝ ${pct}%`);
  lines.forEach((l) => console.log(l));
}
const rest = [...SC.keys()].filter((n) => !seen.has(n));
console.log("\n【どの群にも 入れていない】", rest.length, "画面:", rest.join("／"));
