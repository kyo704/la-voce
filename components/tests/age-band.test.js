// 年齢の3つの帯（2026-09-04）
//
//   ★これは★新しい問いです。★2択の答えを、★移し替えません。
//     ★「18歳未満です」と答えた方が、15歳未満か15〜17歳かは★分かりません。
//     ★推測で埋めると、★本人が答えた値と見分けがつかなくなります。
const fs = require("fs");
const path = require("path");
const { stripComments, readCode } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));

const p = (...a) => path.join(__dirname, "..", "..", ...a);
const gateSrc = fs.readFileSync(p("lib", "ageGate.js"), "utf8");
const billSrc = fs.readFileSync(p("lib", "minorBilling.js"), "utf8");

(async () => {
const g = await import("data:text/javascript;base64," + Buffer.from(gateSrc).toString("base64"));
const b = await import("data:text/javascript;base64," + Buffer.from(billSrc).toString("base64"));
const B = g.AGE_BANDS;

console.log("\n① ★2択の答えを、移し替えないこと");
// ★これがいちばん大事です。★推測で埋めない。
ok("★「18歳未満です」は unknownMinor のまま",
  g.ageBandOf({ is_under_18: true }) === B.UNKNOWN_MINOR);
ok("★★under15 に倒していない",
  g.ageBandOf({ is_under_18: true }) !== B.UNDER_15);
ok("★★teen にも倒していない",
  g.ageBandOf({ is_under_18: true }) !== B.TEEN);
ok("未回答も unknownMinor", g.ageBandOf({}) === B.UNKNOWN_MINOR);
ok("profile が無くても落ちない", g.ageBandOf(null) === B.UNKNOWN_MINOR);

console.log("\n② ★「18歳以上です」の方には、聞き直さないこと");
ok("18歳以上と答えていれば adult",
  g.ageBandOf({ is_under_18: false }) === B.ADULT);
ok("★問いを出さない", g.shouldAskAgeBand({ is_under_18: false }) === false);
ok("未回答には出す", g.shouldAskAgeBand({}) === true);
ok("★18歳未満と答えた方には出す", g.shouldAskAgeBand({ is_under_18: true }) === true);
ok("帯が決まっていれば出さない", g.shouldAskAgeBand({ age_band: "teen" }) === false);

console.log("\n③ ★帯が答えられたら、それを使うこと");
[B.UNDER_15, B.TEEN, B.ADULT].forEach((band) => {
  ok(`${band} をそのまま返す`, g.ageBandOf({ age_band: band }) === band);
});
// ★2択と食い違っていても、★新しい答え（帯）を使います。
ok("★帯が2択より新しい", g.ageBandOf({ age_band: "adult", is_under_18: true }) === B.ADULT);
ok("★知らない値は、答えとして扱わない",
  g.ageBandOf({ age_band: "なにか" }) === B.UNKNOWN_MINOR);

console.log("\n④ ★フェイルクローズ");
ok("★未回答は、未成年として扱う", g.isTreatedAsMinorByBand({}) === true);
ok("★18歳未満と答えた方も、未成年", g.isTreatedAsMinorByBand({ is_under_18: true }) === true);
ok("★15歳未満も、未成年", g.isTreatedAsMinorByBand({ age_band: "under15" }) === true);
ok("★15〜17歳も、未成年", g.isTreatedAsMinorByBand({ age_band: "teen" }) === true);
ok("18歳以上だけ、未成年ではない", g.isTreatedAsMinorByBand({ age_band: "adult" }) === false);
// ★「15歳未満と分かっている」と「分からない」は、別です。
ok("★★未回答を、15歳未満と決めつけない", g.isUnder15Confirmed({}) === false);
ok("★18歳未満と答えただけでも、決めつけない",
  g.isUnder15Confirmed({ is_under_18: true }) === false);
ok("はっきり答えた方だけ true", g.isUnder15Confirmed({ age_band: "under15" }) === true);

console.log("\n⑤ ★保存する形");
const t = g.ageBandToProfilePatch("teen", "T");
ok("帯を書く", t.age_band === "teen");
ok("★2択もそろえて書く（食い違いを作らない）", t.is_under_18 === true);
ok("18歳以上なら is_under_18 は false",
  g.ageBandToProfilePatch("adult", "T").is_under_18 === false);
ok("答えた時刻を残す", !!t.age_band_answered_at);
ok("★unknownMinor は保存しない（答えではない）",
  g.ageBandToProfilePatch("unknownMinor", "T") === null);
ok("★知らない値も保存しない", g.ageBandToProfilePatch("なにか", "T") === null);
ok("★保存してよい帯は3つだけ", g.STORABLE_AGE_BANDS.length === 3);

console.log("\n⑥ ★minorBilling と、帯の文字列がそろっていること");
// ★2つのファイルに同じ文字列があります。★片方だけ変えたら、ここで落ちます。
["UNDER_15", "TEEN", "ADULT", "UNKNOWN_MINOR"].forEach((k) => {
  ok(`★${k} が一致している`, g.AGE_BANDS[k] === b.AGE_BAND[k]);
});
ok("★帯の数も一致している",
  Object.keys(g.AGE_BANDS).length === Object.keys(b.AGE_BAND).length);

console.log("\n⑦ ★生年月日を、取らないこと");
const code = stripComments(gateSrc);
ok("★生年月日の列を持っていない", !/birth|生年月日/.test(code));
ok("★年齢そのものを、判定に使っていない", !/profile\.age\b/.test(code));

console.log("\n⑧ ★門が読む列が、select に入っていること");
// ★2026-09-03 の不具合と同じ形。★取ってこない列は undefined です。
const VT = readCode("components/VocalTracker.jsx");
const cols = (VT.match(/const PROFILE_BASE_COLUMNS = "([^"]+)"/) || [])[1] || "";
// ★宣言が改行をまたぐことがあります。★1行だけを見ないこと。
const consentCols = (VT.match(/const PROFILE_CONSENT_COLUMNS\s*=\s*"([^"]+)"/) || [])[1] || "";
const 全列 = (cols + ", " + consentCols).split(",").map((x) => x.trim());
ok("★age_band が select に入っている", 全列.includes("age_band"));
ok("★age_band_answered_at が select に入っている", 全列.includes("age_band_answered_at"));

console.log("\n⑨ ★聞く場面（連携の手前だけ）");
const VTraw = require("./_source").readRaw("components", "VocalTracker.jsx");
const VTcode = VT;
// ★ふだんの画面では聞きません。★答えを迫ることになります。
ok("★連携の手前で聞いている", /setAskAgeBandFor\("connection"\)/.test(VTcode));
ok("★聞く場面は1つだけ",
  (VTcode.match(/setAskAgeBandFor\("/g) || []).length === 1);
// ★shouldAskAgeBand を通すこと。★profile.age_band を直に見ないこと。
const idx = VTcode.indexOf('setAskAgeBandFor("connection")');
const 手前 = idx === -1 ? "" : VTcode.slice(Math.max(0, idx - 400), idx);
ok("★shouldAskAgeBand を通している", /shouldAskAgeBand\(profile\)/.test(手前));
ok("★profile.age_band を直に見ていない", !/profile\.age_band\s*===/.test(VTcode));

console.log("\n⑩ ★言い方");
ok("★生年月日を聞かないと書いてある", /生年月日はお聞きしません/.test(VTraw));
ok("★あとから変えられると書いてある", /いつでも変えられます/.test(VTraw));
// ★15〜17歳について、これは法律が求めているものではありません。
//   ★私たちの決まりです。★断言しないこと。
ok("★★「法律で決まっている」と書いていない",
  !/法律で決まって|法律上必要|法令により必要/.test(VTcode));
ok("★私たちの決まりとして、と書いている", /私たちの決まりとして/.test(VTraw));
// ★3つとも押せること。★片方だけボタン、はしません。
const 画面 = VTraw.slice(VTraw.indexOf('askAgeBandFor === "connection"'),
                         VTraw.indexOf('askAgeBandFor === "connection"') + 2000);
["15歳未満です", "15歳から17歳です", "18歳以上です"].forEach((l) => {
  ok(`★「${l}」が押せる`, 画面.includes(l));
});

console.log("\n⑪ ★保存で、黙って失敗しないこと");
const h = VTcode.indexOf("async function handleAnswerAgeBand");
const 保存 = h === -1 ? "" : VTcode.slice(h, VTcode.indexOf("\n  }", h));
ok(".select() を付けている", /\.select\("id"\)/.test(保存));
ok("★0行も見ている", /length === 0/.test(保存));
ok("★失敗を画面に出す", /setInviteLookupError/.test(保存));
ok("★勝手に続けない（もう一度押していただく）",
  /もう一度「確認」を押してください/.test(VTraw));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
})();
