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
const { stripComments, readCode } = require("./_source");

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
// ★★2026-09-07、★案C を採りました（坂本さんの決め）。
//   ★★18歳未満の方には、★何もお売りしません。
//   ★以前は 15〜17歳に月額だけをお出ししていました。★やめました。
//   ★理由：★「保護者の同意を得た」を、こちらは確かめられないため。
ok("★15〜17歳には、1つも出さない", m.offeredPlans(B.TEEN).length === 0);
ok("★15〜17歳は、決済の画面に入れない", m.mayReachCheckout(B.TEEN) === false);
ok("★同意の画面を、もう出さない", m.needsMinorConsentScreen(B.TEEN) === false);
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
// ★★案C。★入れません。
ok("★15〜17歳は、もう入れない", m.mayReachCheckout(B.TEEN) === false);
ok("18歳以上は、入れる", m.mayReachCheckout(B.ADULT) === true);

console.log("\n③ 同意画面は、もう出さない（★案C・2026-09-07）");
// ★★売らないので、★同意をいただく相手がいません。
ok("★どの帯にも、出さない",
  [B.ADULT, B.TEEN, B.UNDER_15, null].every((b) => m.needsMinorConsentScreen(b) === false));
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
// ★2026-09-04 の追補 §5。★同じチェックで、当てはまる条文が変わります。
//   ✕「この契約に同意します」… 民法5条1項。★あったことを証明しなければ効きません
//   ◯「毎月◯◯円まで使ってよいと認めます」… 民法5条3項。★目的を定めた処分の許可
ok("★★「認めます」の形になっている",
  /使ってよいと認めます/.test(m.minorConsentCheckbox(500)));
ok("★★「契約に同意します」と書いていない",
  !/契約に同意/.test(m.minorConsentCheckbox(500)));
ok("★金額の上限が入っている", /毎月500円まで/.test(m.minorConsentCheckbox(500)));
ok("★価格が未定なら、仮の数字を書かない", /毎月◯◯円まで/.test(m.minorConsentCheckbox(null)));

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

console.log("\n⑦-2 ★期間の制限を、書かないこと");
// ★未成年者の取消権は、成人してから5年です（民法126条）。
//   ★17歳の方の契約は、22歳まで取り消せます。
//   ★「30日以内に」と書くと、その権利を狭めたと読まれます。
ok("★★日数の制限を書いていない", !/日以内|以内にお申し出|期限/.test(m.REFUND_PROMISE));
ok("★区切っているのは金額（直近のお支払い）", /直近のお支払い/.test(m.REFUND_PROMISE));
ok("★★日割りにしていない", !/日割り|按分/.test(code));

console.log("\n⑦-3 ★「法律で決まっているため」と書かないこと");
// ★15〜17歳について、これは法律が求めているものではありません。
//   ★私たちの決まりです。★断言しないこと。
ok("★★「法律で決まっている」と書いていない",
  !/法律で決まって|法律上必要|法令により必要/.test(code));

console.log("\n⑦-4 ★2つの同意は、1つにまとめないこと");
ok("利用の同意は、前に出せる", m.mayFrontLoad(m.CONSENT_SCOPES.USAGE) === true);
ok("★★連携の同意は、前に出せない", m.mayFrontLoad(m.CONSENT_SCOPES.CONNECTION) === false);
ok("★知らない値でも、前に出さない", m.mayFrontLoad("なにか") === false);
ok("★★無料の利用は、止めない", m.mayBlockFreeUsage() === false);

console.log("\n⑦-5 ★フラグの名前");
// ★得たかどうかを、アプリは知りません。★申告されたことだけを知っています。
ok("★★declared という名前になっている",
  m.GUARDIAN_CONSENT_FLAG === "guardian_consent_declared");
ok("★★obtained という名前を使っていない", !/guardian_consent_obtained/.test(code));

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

console.log("\n⑨ ★画面（同意のゲート）");
const { readRaw } = require("./_source");
const gate = require("./_source").stripComments(readRaw("components", "MinorConsentGate.jsx"));
const billing = require("./_source").stripComments(readRaw("app/billing", "page.js"));

// ★★チェックそのものを、やめました（★案C・2026-09-07）。
//   ★「保護者の同意を得た」と申告していただく形が、無くなりました。
//   ★得たかどうかを、こちらは確かめられませんでした。
ok("★同意のチェックが、もう無い", !/useState\(false\)/.test(gate));
ok("★「保護者の方の同意」と書いていない", !/保護者の方の同意/.test(gate));
ok("★チェックが、もう無い", !/disabled=\{!checked/.test(gate));
// ★★「認めます」の形であること。
// ★★同意の文も、もう使いません（★案C）。
ok("★同意の文を、もう使っていない", !/minorConsentCheckbox\(/.test(gate));
ok("★「同意します」と直に書いていない", !/この契約に同意します/.test(gate));
// ★出せるプランが無い方には、★ボタンを出さないこと。
ok("★プランが0なら、ボタンを出さない", /plans\.length === 0/.test(gate));
// ★★禁じた言葉は、必ず★コメントを外したもので探すこと。
//   ★★このリポジトリで、これが3度目です（くり返す失敗の形 2）。
//   ★理由を説明するコメントに、★その言葉が出てくるためです。
ok("★「法律で決まっている」と書いていない",
  !/法律で決まって|法律上必要/.test(gate));
ok("★「私たちの決まりとして」と書いている", /私たちの決まりとして/.test(gate));
// ★保護者の方へのページは、★見せるだけ。★フォームにしないこと。
// ★★保護者の方へのページは、★同意をお願いする画面のためのものでした。
//   ★売らないので、★その画面ごと無くなりました（★案C）。
ok("★同意の画面が、もう無い", !/この契約に同意します/.test(gate));
// ★記録の4項目
// ★★同意の記録そのものを、書かなくなりました（★案C・2026-09-07）。
//   ★minor_billing_consents の行は、★消しません。★書くのをやめるだけです。
//   ★過去に申告してくださった記録です。★取り上げません。
ok("★同意の記録を、もう書いていない", !/minor_billing_consents/.test(gate));

// ★★金額を直書きしないこと。
ok("★★金額を直書きしていない", !/580/.test(gate));
ok("★lib/plans.js から引いている", /PLANS\.filter\(/.test(gate));
// ★列の名前は declared。
// ★★申告のしるしを、書かなくなりました（★案C）。
//   ★minor_billing_consents の行は消しません。★書くのをやめるだけです。
ok("★申告のしるしを、書いていない", !/guardian_consent_declared_at/.test(gate));
ok("★★obtained を使っていない", !/guardian_consent_obtained/.test(gate));
// ★保存で黙って失敗しないこと。
// ★★保存そのものが無くなったので、★その確かめも要らなくなりました（★案C）。
ok("★保存の処理が、もう無い", !/updated\.length === 0/.test(gate));

console.log("\n⑩ ★画面の側でも、帯で出し分けていること");
ok("★/billing が帯を読んでいる", /ageBandOf\(profForBand\)/.test(billing));
ok("★ゲートに渡している", /<MinorConsentGate band=\{band\}/.test(billing));
// ★★読めなかったときは、帯が分からない扱い（フェイルクローズ）。
ok("★読めなくても、大人にしない（ageBandOf が unknownMinor を返す）",
  m.offeredPlans("unknownMinor").length === 0);

console.log("\n⑪ ★よそおい（単発・季節ごと）");
// ★★道具より、飾りを高くしないこと。
//   ★月額（580円）と同じか、★それより安いこと。
const { PLANS } = await import("data:text/javascript;base64," +
  Buffer.from(require("fs").readFileSync(
    require("path").join(__dirname, "..", "..", "lib", "plans.js"), "utf8")).toString("base64"));
const monthlyYen = PLANS.find((x) => x.key === "monthly").priceYen;
ok("★値段は500円", m.SEASONAL_ITEM_YEN === 500);
ok("★★月額より高くない", m.SEASONAL_ITEM_YEN <= monthlyYen);

// ★★買う前に、中身が確定していること。
//   ★「あとから選べる」形にすると、★前払式支払手段になります（資金決済法）。
ok("★中身が決まっている", m.SEASONAL_ITEM_CONTENTS.length === 5);
ok("★数が合っている", m.SEASONAL_ITEM_PIECES === m.SEASONAL_ITEM_CONTENTS.length);
ok("★眺め・壁・床・服2つ",
  ["view", "wall", "floor", "clothes1", "clothes2"]
    .every((k) => m.SEASONAL_ITEM_CONTENTS.includes(k)));

console.log("\n⑫ ★季節ごとに1回（★みなさん同じ）");
ok("年に4回", m.SEASONS.length === 4);
ok("9月は autumn", m.seasonOf(new Date("2026-09-04")) === "autumn");
ok("1月は winter", m.seasonOf(new Date("2026-01-15")) === "winter");
// ★★未成年の方だけの上限では、ありません。
ok("★18歳以上も、今季1回まで",
  m.maySeasonalPurchase({ band: "adult", purchasesThisSeason: 0 }) === true &&
  m.maySeasonalPurchase({ band: "adult", purchasesThisSeason: 1 }) === false);
ok("★15〜17歳も、同じ上限",
  m.maySeasonalPurchase({ band: "teen", purchasesThisSeason: 0 }) === true &&
  m.maySeasonalPurchase({ band: "teen", purchasesThisSeason: 1 }) === false);
// ★売る相手が分からないうちは、売りません。
ok("★★帯が分からなければ、買えない",
  m.maySeasonalPurchase({ band: "unknownMinor", purchasesThisSeason: 0 }) === false);
ok("★15歳未満も、買えない",
  m.maySeasonalPurchase({ band: "under15", purchasesThisSeason: 0 }) === false);

console.log("\n⑬ ★年の上限（★同意の画面に出す数字ではありません）");
ok("★580×12 ＋ 500×4 ＝ 8,960", m.minorAnnualMaxYen(580) === 8960);
// ★★数字を直書きしないこと。★値段が変われば、自動で変わります。
ok("★★8960 を直書きしていない", !/8960|8,960/.test(code));
ok("★3Dセキュアを求める", m.THREE_D_SECURE === "any");

// ★★決めただけで終わっていないか（★2026-09-06）。
//   ★★規則：書いている値は、必ずどこかで読まれているか。
//     ★THREE_D_SECURE = "any" と決めてありましたが、
//     ★決済の呼び出しへ渡しておらず、★効いていませんでした。
//     ★弁護士への確認事項を書きながら、★見つけました。
//   ★★「決めた」と「効いている」は、別です。★ここで見張ります。
{
  const route = readCode("app", "api", "stripe", "checkout", "route.js");
  ok("★決済の呼び出しが、3Dセキュアを渡している",
    /payment_method_options[\s\S]{0,200}request_three_d_secure/.test(route));
  ok("★値は lib から引いている（書き写していない）",
    /request_three_d_secure: THREE_D_SECURE/.test(route));
  ok("★決済が、lib/minorBilling から読んでいる",
    /from "@\/lib\/minorBilling"/.test(route));
}

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
})();
