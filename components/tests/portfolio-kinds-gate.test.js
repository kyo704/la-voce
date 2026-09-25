// ============================================================================
// ★経歴の 種 ── ★出す ものを 増やして いないか（★2026-09-25・Opus の 同意）
//
// STRIP: A   ★動き（★何を 出すか）を 見ます。
//
//   ★★★Opus の 同意（2026-09-25）──
//     「enabled_at 列を 持たせ、★有効化するまでは 表示しない 形に する ことで、
//       ★既存38名の 画面は 1文字も 変わらない」
//
//   ★★★だから ここで 見るのは 1つ です ──
//     ★`ENTRY_KINDS`（★経歴の 画面が 出す もの）が **増えて いない** こと。
//     ★★増やす ときは `enabledAt` に 日付を 書きます。
//       ★★その 日に この 見張りが 赤く なります。★それが 合図 です。
//
//   ★★数を 覚えません ── ★`enabledAt` が 入って いる ものの 数を 数えます。
// ============================================================================
const fs = require("fs");
const path = require("path");

let 済 = 0, 悪 = [];
const よし = (b, m) => { 済 += 1; if (!b) 悪.push(m); };

const 根 = path.join(__dirname, "..", "..");
const src = fs.readFileSync(path.join(根, "lib/portfolio.js"), "utf8")
  .replace(/^import[^\n]*\n/gm, "").replace(/export /g, "");
const M = {};
new Function("M", "ageBandOf", "AGE_BANDS",
  src + "; Object.assign(M, { ENTRY_KINDS, KINDS_BY_FIELD, kindsOfField, enabledKinds });")
  (M, () => "adult", { ADULT: "adult" });

// ── ★① `ENTRY_KINDS` は `enabledAt` の ある ものだけ ──────────────
const 出す = M.enabledKinds("music");
よし(M.ENTRY_KINDS.length === 出す.length,
     "★ENTRY_KINDS が enabledKinds と ちがいます …… "
     + M.ENTRY_KINDS.length + " ／ " + 出す.length);
for (const k of M.ENTRY_KINDS) {
  よし(!!k.enabledAt, "★`enabledAt` の 無い 種が 出て います …… " + k.key);
}

// ── ★② いままでの 3つ から 増えて いない（★38名の 画面が 変わらない）────
//   ★★数を 覚えません ── ★`enabledAt` が 入って いる ものを 数えます。
//     ★★増やす ときは ここが 赤く なります。★それが 合図 です。
const 日付つき = M.kindsOfField("music").filter((k) => k.enabledAt).map((k) => k.key);
よし(日付つき.join(",") === "school,teacher,award",
     "★出す 種が 変わりました …… " + 日付つき.join(",")
     + "（★増やす なら、この 見張りの 字も 直して ください）");

// ── ★③ 台帳が 通す 種 だけ を 並べて いる ────────────────────
//   ★★`portfolio_entries.kind` の 縛り（★2026-09-25・本番）。
const 台帳の種 = ["school", "award", "teacher", "education", "performance",
  "repertoire", "recording", "role", "skill", "physical", "news", "press",
  "lesson", "faq", "management", "link"];
for (const f of Object.keys(M.KINDS_BY_FIELD)) {
  for (const k of M.KINDS_BY_FIELD[f]) {
    よし(台帳の種.includes(k.key),
         "★台帳が 通さない 種が あります …… " + f + " / " + k.key);
  }
}

// ── ★④ 分野が 分からない ときは music に 倒す ────────────────
よし(M.kindsOfField("xxx") === M.KINDS_BY_FIELD.music, "★知らない 分野で music に 倒して いません");
よし(M.kindsOfField(null) === M.KINDS_BY_FIELD.music, "★分野が 無い ときに music に 倒して いません");

// ── ★⑤ 数を 出して いない ──────────────────────────────
const raw = fs.readFileSync(path.join(根, "lib/portfolio.js"), "utf8");
よし(!/あと[0-9０-９]|残り[0-9０-９]|\/\s*9種/.test(raw),
     "★数を 出して います（★「あと◯種」を 出しません）");

// ── ★目盛り合わせ ──────────────────────────────────────
function わざと() {
  const s2 = src.replace('{ key: "performance", label: "演奏・出演", hint: "曲・会場と、その 年", enabledAt: null }',
                         '{ key: "performance", label: "演奏・出演", hint: "曲・会場と、その 年", enabledAt: "2026-10-01" }');
  const N = {};
  new Function("M", "ageBandOf", "AGE_BANDS",
    s2 + "; Object.assign(M, { kindsOfField });")(N, () => "adult", { ADULT: "adult" });
  const 増 = N.kindsOfField("music").filter((k) => k.enabledAt).map((k) => k.key);
  return [
    ["②種を 増やす", 増.join(",") !== "school,teacher,award"],
    ["③台帳に 無い 種", !台帳の種.includes("xxxxx")]
  ];
}

console.log("PORTFOLIO_KINDS_GATE");
console.log("  ★music 全 " + M.kindsOfField("music").length
            + " ／ 出す " + 出す.length + "（" + 日付つき.join(" ") + "）");
console.log("  ★voice 全 " + M.kindsOfField("voice").length
            + " ／ 出す " + M.enabledKinds("voice").length);
console.log("  ★stage 全 " + M.kindsOfField("stage").length
            + " ／ 出す " + M.enabledKinds("stage").length);
console.log("\n★目盛り合わせ");
let 目悪 = [];
for (const [名, ok] of わざと()) {
  console.log("  " + (ok ? "○" : "×") + " " + 名);
  if (!ok) 目悪.push(名);
}
if (目悪.length) {
  console.log("\n★★止まりました ── " + 目悪.join("／"));
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
