#!/usr/bin/env node
/**
 * ★正（docs/legal の md）と、画面（写し）が、字で合っていること（2026-09-05）
 *
 *   出どころ docs/legal/consent-scope-ja-2026-09-v1.md 末尾 ⑦
 *            docs/opus/lavoce-判断-第5項の書き直しと、写した先の台帳（9月4日）.md §6
 *
 *   ★★同じ約束が、★2か所に書いてあります。
 *     ・docs/legal/privacy-ja-2026-09-v1.md   ★こちらが正
 *     ・app/legal/privacy/page.js             ★写し
 *
 *   ★正だけ直して、写しを直し忘れる。★これが3回起きました。
 *   ★★だから、★思い出すのをやめて、★機械に見張らせます。
 *
 *   ★ここで見るのは「★正の行が、写しの中に在るか」だけです。
 *     ★写しに余分があっても、★落としません（★見出しや飾りが入るためです）。
 *
 *   実行  node components/tests/legal-copy-matches-source.test.js
 */

const { readRaw } = require("./_source");

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}

// ★空白・改行を落として比べます。★折り返しの違いで落ちないためです。
//
// ★★★（星）も落とします。★これは、こちらの中だけの印です。
//   ★正の md では「ここが大事」の目印に使っています。
//   ★★お客さまの画面には、★出しません。
//   ★だから、★星の有無で落ちてはいけません。
const squash = (t) => String(t).replace(/[\s★]+/g, "");

// ★md の中から、1つの節を取り出します。
function section(md, heading) {
  const i = md.indexOf(heading);
  if (i === -1) return "";
  // ★"### " と "## " の、どちらの見出しでも切れるようにします。
  const a = md.indexOf("\n### ", i + heading.length);
  const b = md.indexOf("\n## ", i + heading.length);
  const j = (a === -1) ? b : (b === -1 ? a : Math.min(a, b));
  return md.slice(i, j === -1 ? md.length : j);
}

// ★節の中の「本文の行」を集めます（★見出し・区切り・空行は除きます）。
function bodyLines(sec) {
  return sec.split("\n")
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith("#") && l !== "```" && l !== "---"
      && !l.startsWith("**") && l.length >= 6);
}

const PAIRS = [
  {
    name: "プライバシーポリシー 第5項",
    md: ["docs", "legal", "privacy-ja-2026-09-v1.md"],
    page: ["app", "legal", "privacy", "page.js"],
    heading: "### 5　だれが見られるか"
  },
  {
    // ★★2026-09-05 に作りました。★まだ公開していません。
    //   ★公開の前でも、★正と写しは合っていること。
    name: "特定商取引法に基づく表記",
    md: ["docs", "legal", "tokushoho-ja-2026-09-v1.md"],
    page: ["app", "legal", "tokushoho", "page.js"],
    heading: "## §3 販売価格"
  },
  {
    name: "利用規約 第5条",
    md: ["docs", "legal", "terms-ja-2026-09-v1.md"],
    page: ["app", "legal", "terms", "page.js"],
    heading: "### 第5条"
  }
];

for (const p of PAIRS) {
  console.log("\n■ " + p.name);
  const md = readRaw(...p.md);
  const page = squash(readRaw(...p.page));
  const sec = section(md, p.heading);
  if (!sec) {
    ok(`★正の中に「${p.heading}」がある`, false);
    continue;
  }
  const lines = bodyLines(sec);
  ok(`★正から、本文を取り出せた（${lines.length} 行）`, lines.length >= 3);
  const missing = lines.filter((l) => !page.includes(squash(l)));
  // ★★1行でも欠けたら、★そこが「直し忘れ」です。
  ok(`★正の行が、すべて画面に在る${missing.length ? "（★欠け: " + missing.slice(0, 3).join(" ／ ") + "）" : ""}`,
    missing.length === 0);
}

console.log("\n■ ★★第7条（免責）── 消費者契約法の急所（2026-09-05）");
{
  const md = readRaw("docs", "legal", "terms-ja-2026-09-v1.md");
  const page = squash(readRaw("app", "legal", "terms", "page.js"));
  // ★★この一句が無いと、★上限そのものが無効になります（消費者契約法8条3項）。
  const 急所 = "故意または重大な過失があるときを除き";
  ok("★正に、故意・重過失を除く一句がある", md.includes(急所));
  ok("★画面にも、その一句がある", page.includes(squash(急所)));
  // ★★体のことを、数千円で切らないこと（消費者契約法10条）。
  const 生命 = "利用者の生命または身体に生じた損害については";
  ok("★正に、生命・身体は上限の対象外とある", md.includes(生命));
  ok("★画面にも、それがある", page.includes(squash(生命)));
  // ★上限は12か月分。★1か月分にしないこと（★低すぎると10条で無効の危険）。
  ok("★上限が12か月分である", md.includes("12か月間"));
  // ★医療ではない、と言い続けること。
  ok("★医療行為ではない、と書いてある", md.includes("医療行為、診断、治療または医学的助言"));
  // ★★変更履歴を残すこと。
  ok("★変更履歴がある", /変更履歴/.test(md) && /2026-09-05/.test(md));
  ok("★画面にも、変更履歴がある", page.includes(squash("変更履歴")));
  // ★★弁護士待ちの但し書きが、残っていないこと（★もう埋まりました）。
  ok("★「弁護士に確認してください」が、第7条に残っていない",
    !/軽過失の場合の責任の上限をどう定めるかは/.test(md));
}

console.log("\n■ ★写した先の一覧が、正の側にあること（裁定 §6）");
const scope = readRaw("docs", "legal", "consent-scope-ja-2026-09-v1.md");
// ★★「思い出す」をやめるための一覧です。★消さないこと。
ok("★一覧の見出しがある", /この文書を写している場所/.test(scope));
for (const need of ["利用規約 第5条", "プライバシーポリシー §5", "linkConsent",
  "app/legal/terms/page.js", "app/legal/privacy/page.js"]) {
  ok(`★一覧に「${need}」が載っている`, scope.includes(need));
}
// ★★ここで直接直さないこと、と書いてあること。
ok("★画面で直接直さない、と書いてある", /ここで直接直さないこと/.test(scope));
// ★★台帳を8本目にしないこと（裁定 §6）。★既存の文書の末尾です。
ok("★新しい台帳を作っていない（docs/ledgers は07まで）",
  !require("fs").existsSync(require("path").join(__dirname, "..", "..", "docs", "ledgers", "08-写した先.md")));

console.log("\n■ ★禁止形（lib/linkConsent.js）が、正の文にも入っていないこと");
const forbidden = ["見えません", "一切", "決して", "安全です", "守られています"];
for (const p of PAIRS) {
  const sec = section(readRaw(...p.md), p.heading);
  const hit = forbidden.filter((w) => sec.includes(w));
  ok(`${p.name}：★禁じた言い方が無い${hit.length ? "（★" + hit.join(" ") + "）" : ""}`,
    hit.length === 0);
}

console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
process.exit(fail === 0 ? 0 : 1);
