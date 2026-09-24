// ============================================================================
// ★値段は 4か所 いっしょに ── ★突き合わせの 見張り（★裁定188・2026-09-25）
//
// STRIP: A   ★数（★動き）を 見ます。★コメントも 字の かたまりも 落とします。
//
//   ★★なぜ この 見張りが いるか
//     ★2026-09-25、★`PLANS`（月580円／年4,800円）が 古い のでは ないか と
//     ★見られました。★`tools/prices.json` の `zenbu` は 月980／年12,800 です。
//     ★★★ちがいました ── ★`PLANS` は **しらべる** です。
//       ★`tools/prices.json` の `shiraberu` は 月580／年4,800 で、★合って います。
//       ★Opus の 確定版（`docs/opus/woolsong-価格と課金の正（9月8日・確定版）.md`
//       ★§5）にも「個人プラン「しらべる」 月額 580円／年額 4,800円」と あります。
//     ★★★`ぜんぶ`（980／12,800）は **別の 品** です。★まだ 作って いません。
//       ★★書き換えたら、★しらべる を ぜんぶ の 値段で 売る ことに なります。
//       ★特商法の ページ（`docs/legal/tokushoho-ja-2026-09-v1.md` §3）も
//       ★580／4,800 と 書いて あります。★そこも 食いちがいます。
//     ★★だから この 見張りは、★`PLANS` を **しらべる** と 突き合わせます。
//       ★★`zenbu` を 売り はじめる 日が 来たら、★`PLANS` に 品を 足します。
//         ★その とき ここも 足して ください。
//
//   ★★覚えません。★`tools/prices.json` を その場で 読み、★それと 突き合わせます。
//     ★値段が 変わったら、★まず `tools/prices.json` を 直して ください。
//     ★★この 見張りは、★写し忘れた ところを 教えます。
//
//   ★★4か所（★裁定188）── ★①確定の 紙 ②売り物の 材 ③台帳（lib）④見本。
//     ★★ここで 見るのは ③ です。★①②は 紙 なので 道具では 見ません。
//     ★④見本は `tools/screen_b_compare.py` が 見ます。
// ============================================================================
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const 根 = path.join(__dirname, "..", "..");
const 正 = JSON.parse(fs.readFileSync(path.join(根, "tools/prices.json"), "utf8"));

let 済 = 0, 悪 = [];
const よし = (b, m) => { 済 += 1; if (!b) 悪.push(m); };

// ── ★台帳の 中の 数を、★その場で 読み出します ──────────────────
//   ★★`import` しません。★`lib/plans.js` は `next/font` などを 引く ことが
//     ★あり、★Node からは 読めない ことが あります。★字から 取ります。
//   ★★★書き方が 2つ あります ── `zenbu: 12800` と `SCHOOL_FLOOR = 12800`。
//     ★`:` だけを 見て いて、★orgRoster の 3つが ぜんぶ `null` に なりました。
//     ★★`null !== 12800` は 真 なので、★目盛り合わせも 素通り しました ──
//       ★「読めて いない」を「ちがう」と 数えて いました（★2026-09-25）。
//     ★★だから 読めなかった ときは、★その場で 止めます。
function 数(src, 名) {
  const m = src.match(new RegExp(名 + "\\s*[:=]\\s*(\\d+)"));
  if (!m) throw new Error("★台帳から「" + 名 + "」の 数が 読めません");
  return Number(m[1]);
}
function 節(src, 名) {
  const i = src.indexOf(名);
  if (i < 0) return "";
  const j = src.indexOf("}", i);
  return src.slice(i, j < 0 ? src.length : j);
}

const plans = readCode("lib", "plans.js");
const roster = readCode("lib", "orgRoster.js");

// ── ★① PLANS ── ★ぜんぶ の 月と 年 ────────────────────────
const 月 = 節(plans, 'key: "monthly"');
const 年 = 節(plans, 'key: "annual"');
よし(数(月, "priceYen") === 正.individual.shiraberu.monthly,
     "★PLANS monthly が prices.json の しらべる と ちがいます …… "
     + 数(月, "priceYen") + " ／ 正 " + 正.individual.shiraberu.monthly);
よし(数(年, "priceYen") === 正.individual.shiraberu.annual,
     "★PLANS annual が prices.json の しらべる と ちがいます …… "
     + 数(年, "priceYen") + " ／ 正 " + 正.individual.shiraberu.annual);

// ── ★② 出す 字も 同じ 数 か ─────────────────────────────
//   ★★数だけ 直して、★札を 直し忘れる ことが あります。
//     ★★それが いちばん たち が 悪い ── ★画面には 古い 値段が 出ます。
function 札の数(節文) {
  const m = 節文.match(/priceLabel:\s*"([\d,]+)円/);
  return m ? Number(m[1].replace(/,/g, "")) : null;
}
よし(札の数(月) === 正.individual.shiraberu.monthly,
     "★monthly の priceLabel が 数と 合いません …… " + 札の数(月));
よし(札の数(年) === 正.individual.shiraberu.annual,
     "★annual の priceLabel が 数と 合いません …… " + 札の数(年));

// ── ★③ YEARLY_PRICE_155 ── ★品ごとの 年額 ──────────────────
const y = 節(plans, "YEARLY_PRICE_155");
const 品 = { zenbu: "zenbu", student: "gakusei", tsutaeru: "tsutaeru",
             shiraberu: "shiraberu", yosooi: "yosooi" };
for (const [台, 紙] of Object.entries(品)) {
  よし(数(y, 台) === 正.individual[紙].annual,
       "★YEARLY_PRICE_155." + 台 + " が ちがいます …… "
       + 数(y, 台) + " ／ 正 " + 正.individual[紙].annual);
}
よし(数(y, "classroom") === 正.org.kyoshitsu.annual,
     "★YEARLY_PRICE_155.classroom が ちがいます …… " + 数(y, "classroom"));

// ── ★④ orgRoster ── ★教室と 学校 ───────────────────────
よし(数(roster, "CLASSROOM_MONTHLY") === 正.org.kyoshitsu.monthly,
     "★CLASSROOM_MONTHLY が ちがいます …… " + 数(roster, "CLASSROOM_MONTHLY"));
よし(数(roster, "CLASSROOM_YEARLY") === 正.org.kyoshitsu.annual,
     "★CLASSROOM_YEARLY が ちがいます …… " + 数(roster, "CLASSROOM_YEARLY"));
よし(数(roster, "SCHOOL_FLOOR") === 正.org.gakko.floor,
     "★SCHOOL_FLOOR が ちがいます …… " + 数(roster, "SCHOOL_FLOOR"));

// ── ★目盛り合わせ ──────────────────────────────────────
//   ★★わざと 1つ ずらして、★赤く なる ことを 毎回 見ます。
function わざと() {
  const 出 = [];
  //   ★★読めなかった ときは `数()` が 投げます。★投げたら 赤 では なく **止まり** です。
  const 試 = (f) => { try { return f(); } catch (e) { return "throw:" + e.message; } };
  const p2 = plans.replace(/priceYen: 580/, "priceYen: 980");
  出.push(["①数を ずらす", 試(() => 数(節(p2, 'key: "monthly"'), "priceYen")) !== 正.individual.shiraberu.monthly]);
  const p3 = plans.replace(/priceLabel: "4,800円／年"/, 'priceLabel: "12,800円／年"');
  出.push(["②札だけ ずらす", 札の数(節(p3, 'key: "annual"')) !== 正.individual.shiraberu.annual]);
  const p4 = plans.replace(/tsutaeru: 6000/, "tsutaeru: 3600");
  出.push(["③品の 年額を ずらす",
           試(() => 数(節(p4, "YEARLY_PRICE_155"), "tsutaeru")) !== 正.individual.tsutaeru.annual]);
  const r2 = roster.replace(/SCHOOL_FLOOR = 12800/, "SCHOOL_FLOOR = 9800");
  出.push(["④学校の 下限を ずらす",
           試(() => 数(r2, "SCHOOL_FLOOR")) === 9800]);
  return 出;
}

console.log("PRICE_FOUR_PLACES");
console.log("  ★正 …… tools/prices.json（version " + 正.version + "）");
console.log("  ★PLANS が 売る もの …… しらべる 月 " + 正.individual.shiraberu.monthly
            + "／年 " + 正.individual.shiraberu.annual);
console.log("  ★まだ 売って いない もの …… ぜんぶ 月 " + 正.individual.zenbu.monthly
            + "／年 " + 正.individual.zenbu.annual);
console.log("\n★目盛り合わせ（★わざと ずらして 赤く なるか）");
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
