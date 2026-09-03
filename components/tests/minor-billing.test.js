// 未成年の方に売る形（2026-09-04）
//
//   ★考え方（Opus）
//     ★★取り消されないようにするのではなく、
//       ★取り消されても困らないようにすること。
//   ★同意画面は、取消権を封じません。
//     ★★いちばん効くのは、返金の約束です。
const fs = require("fs");
const path = require("path");
// ★禁じた言葉を探すときは、★必ずコメントを外した文字列で見ること。
//   ★このリポジトリで2度やった失敗です（くり返す失敗の形 2）。
//   ★仕様や理由を説明するコメントに、その言葉が出てくるためです。
const { stripComments } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));

const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "minorBilling.js"), "utf8");
// ★コメントを外したもの。★禁じた言葉は、こちらで探します。
const code = stripComments(src);

(async () => {
const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
const B = m.AGE_BAND, P = m.PLANS;

console.log("\n① ★帯ごとに、出すプランが決まること");
ok("18歳以上には、3つとも出す", m.offeredPlans(B.ADULT).length === 3);
ok("★15〜17歳には、月額の1つだけ",
  m.offeredPlans(B.TEEN).length === 1 && m.offeredPlans(B.TEEN)[0] === P.MONTHLY_INDIVIDUAL);
ok("★15〜17歳に、年払いを出さない", !m.offeredPlans(B.TEEN).includes(P.ANNUAL_INDIVIDUAL));
ok("★15〜17歳に、教室のプランを出さない", !m.offeredPlans(B.TEEN).includes(P.ORGANIZATION));
ok("★15歳未満には、1つも出さない", m.offeredPlans(B.UNDER_15).length === 0);

console.log("\n② ★帯が分からないときは、売らないこと（フェイルクローズ）");
// ★いまのアプリは2択しか持っていません。★15歳未満と15〜17歳を見分けられません。
//   ★見分けられないうちは、売らないほうへ倒します。
ok("★帯が分からなければ、1つも出さない", m.offeredPlans(B.UNKNOWN_MINOR).length === 0);
ok("★帯が分からなければ、課金の画面に入れない", m.mayReachCheckout(B.UNKNOWN_MINOR) === false);
ok("★知らない値でも、売らない", m.mayReachCheckout("なにか") === false);
ok("★undefined でも、売らない", m.mayReachCheckout(undefined) === false);
ok("15歳未満は、課金の画面に入れない", m.mayReachCheckout(B.UNDER_15) === false);
ok("15〜17歳は、入れる", m.mayReachCheckout(B.TEEN) === true);
ok("18歳以上は、入れる", m.mayReachCheckout(B.ADULT) === true);

console.log("\n③ 同意画面を出す相手");
ok("★15〜17歳にだけ出す", m.needsMinorConsentScreen(B.TEEN) === true);
ok("★18歳以上には出さない", m.needsMinorConsentScreen(B.ADULT) === false);
ok("★15歳未満には出さない（そもそも到達しない）", m.needsMinorConsentScreen(B.UNDER_15) === false);

console.log("\n④ ★返金の約束");
ok("理由を聞かないと書いてある", /理由は伺いません/.test(m.REFUND_PROMISE));
ok("直近の支払いを返すと書いてある", /直近のお支払いを返金/.test(m.REFUND_PROMISE));
ok("すぐ解約すると書いてある", /すぐに解約/.test(m.REFUND_PROMISE));
ok("保護者からの申し出も受けると書いてある", /保護者の方からお申し出/.test(m.REFUND_PROMISE));
// ★通信販売に、クーリング・オフはありません。★無いものの名前を使わないこと。
ok("★★クーリング・オフと書いていない", !/クーリング|cooling/i.test(code));

console.log("\n⑤ ★同意画面の決めごと");
const lines = m.minorConsentLines(500);
ok("価格を出す", lines.some((l) => /毎月500円/.test(l)));
ok("★価格が未定なら、仮の数字を書かない",
  m.minorConsentLines(null).some((l) => /（未定）/.test(l)));
ok("★年払いが無いと書く", lines.some((l) => /年ごとのお支払いはありません/.test(l)));
ok("解約できると書く", lines.some((l) => /いつでも、ここから解約/.test(l)));
ok("★返金の約束が入っている", lines.includes(m.REFUND_PROMISE));
ok("連絡先が入っている", lines.some((l) => /woolsong\.app@gmail\.com/.test(l)));
ok("★「この画面を見てもらい」が入っている",
  /この画面を見てもらい/.test(m.MINOR_CONSENT_CHECKBOX));

console.log("\n⑥ ★常設の1行は、1つだけであること");
// ★3か所に出しますが、★文は1つです。★書き分けると、片方だけが古くなります。
ok("常設の1行がある", /保護者の方の同意が必要です/.test(m.MINOR_NOTICE_LINE));
ok("★出す場所が3つ書いてある", m.MINOR_NOTICE_PLACES.length === 3);
ok("★価格のページ・規約・決済の直前", 
  ["pricing","terms","checkout"].every((p) => m.MINOR_NOTICE_PLACES.includes(p)));

console.log("\n⑦ ★更新の知らせは、催促にしないこと");
ok("起きたことを言っている", /お支払いがありました/.test(m.RENEWAL_NOTICE_LINE));
ok("やめ方を添えている", /やめるときは/.test(m.RENEWAL_NOTICE_LINE));
// ★急かす言葉（no-nagging-words）を、ここにも通します。
for (const w of ["まだ", "忘れ", "途切れ", "連続", "達成", "頑張"]) {
  ok(`★「${w}」を使っていない`,
    !m.RENEWAL_NOTICE_LINE.includes(w) && !m.MINOR_NOTICE_LINE.includes(w) &&
    !m.REFUND_PROMISE.includes(w));
}

console.log("\n⑧ ★記録するもの（4つ）");
const rec = m.buildMinorBillingRecord({ userId: "u1", band: B.TEEN, monthlyYen: 500, now: "2026-09-04T00:00:00.000Z" });
ok("15〜17歳のときだけ作る", rec !== null);
ok("★18歳以上では作らない",
  m.buildMinorBillingRecord({ userId: "u1", band: B.ADULT, monthlyYen: 500 }) === null);
m.MINOR_BILLING_RECORD_FIELDS.forEach((f) => {
  ok(`★${f} が入っている`, Object.prototype.hasOwnProperty.call(rec, f));
});
ok("★表示していた価格が数字で入る", rec.displayed_price_yen === 500);
ok("★生年月日を持っていない", !/birth|生年月日/.test(code));
ok("★帯だけを持つ", rec.age_band === B.TEEN);

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
})();
