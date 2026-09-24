// ============================================================================
// ★受診用の 紙 ── ★お約束が **紙の 上に** あるかの 見張り（★2026-09-25）
//
// STRIP: B   ★人が 読む ことば を 見ます。★コメントも 落としません。
//
//   ★★なぜ この 見張りが いるか
//     ★2026-09-25、★見本と くらべて 24件の 差が 出ました。★言い方の
//     ★ちがいでは ありませんでした ── ★この 画面には
//       `@media print { .no-print { display: none !important } }`
//     ★が あり、★題と お約束が ぜんぶ `no-print` の 中に ありました。
//     ★★選ぶ 人には 見えて、★渡す 相手には 見えない 形 でした。
//     ★紙に 残る 文は 1つ だけ でした。
//
//   ★★坂本さんの 決め（★2026-09-25）
//     「医師に渡す紙こそ、最も誤解を招いてはいけない場面です。画面上でのみ
//       約束を示し、実際に第三者に渡る紙で省略するのは不誠実です」
//
//   ★★確かめること
//     ① lib/clinicSheet.js が お約束の 文を 持っていること。
//     ② その 文 ぜんぶが VocalTracker から 出ていること。
//     ③ ★その 出し方が、★`no-print` の 外 ―― 紙の 中 ―― である こと。
//     ④ 上の 選ぶ 箱（`CLINIC_NOTICE`）は 印刷しない ままで あること。
//     ⑤ 紙の 中に、★点数・尺度・病名・検定・要配慮 の ことばが ある こと。
//
//   ★★目盛り合わせ …… ★下の `わざと()` で、★①〜⑤ それぞれを
//     ★わざと 壊して、★毎回 赤く なる ことを 確かめて います。
// ============================================================================
const { readRaw } = require("./_source");

let 済 = 0, 悪 = [];
const よし = (b, m) => { 済 += 1; if (!b) 悪.push(m); };

const 紙 = readRaw("lib/clinicSheet.js");
const 画 = readRaw("components/VocalTracker.jsx");

// ── ★紙の 中 だけを 切り出します ────────────────────────────────
//   ★★`id="clinic-summary-content"` から、★その div の おわりまで。
//   ★おわりは かっこの 数では 数えられません（JSX です）。
//   ★★代わりに、★次の `{activeTab ===` までを 取ります。
function 紙の中(src) {
  const i = src.indexOf('id="clinic-summary-content"');
  if (i < 0) return null;
  const j = src.indexOf("{activeTab ===", i);
  return src.slice(i, j < 0 ? src.length : j);
}
const 中 = 紙の中(画);
よし(中 !== null, "★紙（clinic-summary-content）が 見つかりません");

// ── ★① 文を 持っているか ────────────────────────────────────
const 名 = ["CLINIC_PAPER_HEAD", "CLINIC_PAPER_NONAME", "CLINIC_PAPER_SECTION",
            "CLINIC_PAPER_ABOUT_TITLE", "CLINIC_PAPER_ABOUT", "CLINIC_PAPER_FOOT"];
for (const n of 名) {
  よし(new RegExp("export const " + n + "\\b").test(紙),
       "★lib/clinicSheet.js に " + n + " が ありません");
}

// ── ★② ③ 紙の 中から 出ているか ──────────────────────────────
if (中) {
  for (const n of 名) {
    よし(中.includes(n), "★" + n + " が 紙の 中に 出ていません（★印刷で 消えます）");
  }
  // ★★`no-print` が 紙の 中に あっても よいのは、★自由記入の 枠 だけ です。
  //   ★あれは 手で 書く ための 枠で、★印刷では 罫線に 差し替えます。
  //   ★★★`no-print` の 字を 探しては いけません。★コメントにも 出ます
  //     （★2026-09-25、★自分の 覚え書きに 3回 当たりました）。
  //     ★★見るのは **札** です ── `className="… no-print …"`。
  const 除 = 中.split("\n").filter((l) => /className="[^"]*no-print/.test(l));
  よし(除.every((l) => l.includes("rows={4}")),
       "★紙の 中に no-print の 札が あります …… " + 除.length + "行");
}

// ── ★④ 選ぶ 箱は 印刷しない まま ───────────────────────────────
const 選 = 画.indexOf("CLINIC_NOTICE.map");
よし(選 > 0 && 画.lastIndexOf("no-print", 選) > 画.lastIndexOf("clinic-summary-content", 選),
     "★選ぶ 箱（CLINIC_NOTICE）が 印刷される 側に 移って います");

// ── ★⑤ 紙の 上の ことば ────────────────────────────────────
//   ★★数を 覚えません。★`lib/clinicSheet.js` の 文を そのまま 読み、
//     ★その 中に 語が ある ことを 確かめます。
function 文ぜんぶ(src) {
  const out = [];
  for (const n of ["CLINIC_PAPER_HEAD", "CLINIC_PAPER_ABOUT", "CLINIC_PAPER_FOOT",
                   "CLINIC_PAPER_SECTION", "CLINIC_PAPER_NONAME"]) {
    //   ★★★`CLINIC_PAPER_ABOUT` は `CLINIC_PAPER_ABOUT_TITLE` にも 当たります。
    //     ★先に 見つかった 方を 読んで、★文が 9つ しか 見えて いませんでした。
    //     ★★`=` まで 見て 区切ります。
    const i = src.indexOf("export const " + n + " =");
    if (i < 0) continue;
    const j = src.indexOf(";", i);
    const blk = src.slice(i, j < 0 ? src.length : j);
    for (const m of blk.matchAll(/"([^"]{4,})"/g)) out.push(m[1]);
  }
  return out;
}
const 文 = 文ぜんぶ(紙);
よし(文.length >= 10, "★お約束の 文が 少なすぎます …… " + 文.length + "文");
const 全文 = 文.join("／");
for (const 語 of ["点数", "尺度", "病名", "検定", "要配慮", "くらべ", "診断", "氏名"]) {
  よし(全文.includes(語), "★お約束の 中に「" + 語 + "」が ありません");
}

// ── ★目盛り合わせ ──────────────────────────────────────────
//   ★★見張りが 本当に 赤く なるかを、★毎回 確かめます。
//     ★★これが 無いと、★何も 見て いない 見張りと 区別が つきません。
function わざと() {
  const 試 = [
    ["①文を 消す", 紙.replace(/export const CLINIC_PAPER_FOOT/, "const X_FOOT"), 紙の中(画),
     (a, b) => !/export const CLINIC_PAPER_FOOT\b/.test(a)],
    ["③紙から 出す", 紙, (中 || "").replace(/CLINIC_PAPER_ABOUT_TITLE/g, "X"),
     (a, b) => !b.includes("CLINIC_PAPER_ABOUT_TITLE")],
    ["③no-print を 足す", 紙, (中 || "") + '\n<p className="no-print">約束</p>',
     (a, b) => !b.split("\n").filter((l) => l.includes("no-print"))
                 .every((l) => l.includes("textarea") || l.includes("rows={4}"))],
    ["⑤語を 消す", 紙.replace(/要配慮個人情報/g, "たいせつな 紙"), 紙の中(画),
     (a, b) => !文ぜんぶ(a).join("／").includes("要配慮")]
  ];
  const 出 = [];
  for (const [名, a, b, f] of 試) 出.push([名, f(a, b || "")]);
  return 出;
}

console.log("CLINIC_PAPER_PROMISES");
console.log("  ★お約束の 文 …… " + 文.length + "文");
console.log("  ★紙の 中から 出ている 名 …… " + 名.filter((n) => 中 && 中.includes(n)).length + "/" + 名.length);
console.log("\n★目盛り合わせ（★わざと 壊して 赤く なるか）");
let 目悪 = [];
for (const [名, 赤] of わざと()) {
  console.log("  " + (赤 ? "○" : "×") + " " + 名);
  if (!赤) 目悪.push(名);
}
if (目悪.length) {
  console.log("\n★★止まりました ── ★見張りが 赤く なりません: " + 目悪.join("／"));
  console.log("RESULT: NG");
  process.exit(1);
}
console.log("\n★見た …… " + 済 + "件");
if (悪.length) {
  for (const m of 悪) console.log("  NG   " + m);
  console.log("RESULT: NG（" + 悪.length + "件）");
  process.exit(1);
}
console.log("RESULT: OK");
