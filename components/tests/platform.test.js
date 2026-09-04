// 端末の見分けと、導線の段（2026-09-04）
//
//   ★★iOS では、ホーム画面版と Safari で保存場所が別です。
//     ★ブラウザで登録させると、ホーム画面から開いたとき★ログアウトしています。
//   ★★だから iOS だけ、順番を入れ替えます（置いてから登録）。
//   ★ここを間違えると、★いちばん嬉しい瞬間に、いちばん冷たいことが起きます。
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "platform.js"), "utf8");

// ★実物の User-Agent です。★作ったものではありません。
const UA = {
  iPhone: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  iPhoneChrome: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/126.0 Mobile/15E148 Safari/604.1",
  iPadOS: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15",
  mac: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Safari/537.36",
  android: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36"
};

(async () => {
const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
const { OS, STEP } = m;

console.log("\n① OS の見分け");
ok("iPhone は ios", m.osOf({ userAgent: UA.iPhone }) === OS.IOS);
ok("iPhone の Chrome も ios", m.osOf({ userAgent: UA.iPhoneChrome }) === OS.IOS);
ok("Android は android", m.osOf({ userAgent: UA.android }) === OS.ANDROID);
// ★iPadOS 13 以降は、Mac だと名乗ります。★指で触れる Mac は、いまありません。
ok("★iPad は（Mac と名乗っても）ios",
  m.osOf({ userAgent: UA.iPadOS, maxTouchPoints: 5 }) === OS.IOS);
ok("★本物の Mac は ios ではない",
  m.osOf({ userAgent: UA.mac, maxTouchPoints: 0 }) === OS.OTHER);
ok("★UA が無くても落ちない", m.osOf() === OS.OTHER);
ok("★UA が無くても落ちない（空）", m.osOf({}) === OS.OTHER);

console.log("\n② ホーム画面版かどうか");
ok("navigator.standalone で分かる",
  m.isStandaloneFrom({ navigatorStandalone: true }) === true);
ok("display-mode でも分かる",
  m.isStandaloneFrom({ displayModeStandalone: true }) === true);
ok("どちらも無ければ false", m.isStandaloneFrom({}) === false);
ok("★引数が無くても落ちない", m.isStandaloneFrom() === false);

console.log("\n③ Safari のガワかどうか");
ok("iPhone の Safari は true", m.isIosSafari({ userAgent: UA.iPhone }) === true);
ok("★iPhone の Chrome は false", m.isIosSafari({ userAgent: UA.iPhoneChrome }) === false);
ok("Android は false", m.isIosSafari({ userAgent: UA.android }) === false);

console.log("\n④ ★★次の段（ここがいちばん大事です）");
// ★iOS ＆ ホーム画面版でない → ★まず置いてもらいます。
//   ★ここでブラウザの登録画面を出すと、★あとでログアウトします。
ok("★★iOS ＆ ブラウザ → ホーム画面に置く",
  m.nextStep({ os: OS.IOS, standalone: false }) === STEP.IOS_ADD_TO_HOME);
ok("★★iOS ＆ ブラウザ → ★登録ではない",
  m.nextStep({ os: OS.IOS, standalone: false }) !== STEP.REGISTER);
ok("iOS ＆ ホーム画面版 → 登録",
  m.nextStep({ os: OS.IOS, standalone: true }) === STEP.REGISTER);
ok("Android → 登録（★順番はそのまま）",
  m.nextStep({ os: OS.ANDROID, standalone: false }) === STEP.REGISTER);
ok("パソコン → 登録",
  m.nextStep({ os: OS.OTHER, standalone: false }) === STEP.REGISTER);
// ★「あとで」を押した方には、ブラウザでも始められる道を出します。
ok("★iOS で「あとで」を押したら、登録へ進める",
  m.nextStep({ os: OS.IOS, standalone: false, skippedAddToHome: true }) === STEP.REGISTER);

console.log("\n⑤ ★案内を出してよいか（★断られたら、二度と出さない）");
ok("iOS ＆ ブラウザ → 出す",
  m.mayShowIosAddToHome({ os: OS.IOS, standalone: false }) === true);
ok("★ホーム画面版なら、もう出さない",
  m.mayShowIosAddToHome({ os: OS.IOS, standalone: true }) === false);
ok("★★一度断られたら、二度と出さない",
  m.mayShowIosAddToHome({ os: OS.IOS, standalone: false, dismissedAt: "2026-09-04" }) === false);
ok("Android には出さない", m.mayShowIosAddToHome({ os: OS.ANDROID, standalone: false }) === false);

console.log("\n⑥ ★Android の案内");
const base = { os: OS.ANDROID, standalone: false, hasDeferredPrompt: true, enteredFirstRecord: true };
ok("★記録を1つ入れたあとに出す", m.mayShowAndroidInstall(base) === true);
ok("★記録の前には出さない",
  m.mayShowAndroidInstall({ ...base, enteredFirstRecord: false }) === false);
// ★押せないボタンを、見せないこと。
ok("★★イベントが来ていなければ、出さない",
  m.mayShowAndroidInstall({ ...base, hasDeferredPrompt: false }) === false);
ok("★一度断られたら、二度と出さない",
  m.mayShowAndroidInstall({ ...base, dismissedAt: "2026-09-04" }) === false);
ok("★ホーム画面版なら出さない", m.mayShowAndroidInstall({ ...base, standalone: true }) === false);
ok("iOS には出さない", m.mayShowAndroidInstall({ ...base, os: OS.IOS }) === false);

console.log("\n⑦-0 ★アプリの中のブラウザ（★いちばん置けない道）");
// ★★LINE・Instagram・X の中では、ホーム画面に置く道が★1つもありません。
//   ・iOS  … 共有のシートが出ません
//   ・Android … beforeinstallprompt が来ません
// ★★これは、いちばん使いそうな配り方に当たります。
const UA2 = {
  line: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Line/14.5.0",
  instagram: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 Instagram 300.0",
  androidLine: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 Chrome/126.0 Mobile Safari/537.36 Line/14.5.0"
};
ok("LINE を見分ける", m.inAppBrowserOf({ userAgent: UA2.line }) === "line");
ok("Instagram を見分ける", m.inAppBrowserOf({ userAgent: UA2.instagram }) === "instagram");
ok("★Safari は null（★分からない、ではなく当たらない）",
  m.inAppBrowserOf({ userAgent: UA.iPhone }) === null);
ok("名前を出せる", m.inAppBrowserLabel("line") === "LINE");
ok("★知らない key は null", m.inAppBrowserLabel("なにか") === null);

// ★★押せないものを、見せないこと。
ok("★★LINE の中では、置く案内を出さない",
  m.canAddToHome({ os: OS.IOS, userAgent: UA2.line }) === false);
ok("★★Android の LINE の中でも、出さない",
  m.canAddToHome({ os: OS.ANDROID, userAgent: UA2.androidLine }) === false);
ok("Safari なら出す", m.canAddToHome({ os: OS.IOS, userAgent: UA.iPhone }) === true);
ok("Android の Chrome なら出す",
  m.canAddToHome({ os: OS.ANDROID, userAgent: UA.android }) === true);
ok("★もう置いてあるなら、出さない",
  m.canAddToHome({ os: OS.IOS, userAgent: UA.iPhone, standalone: true }) === false);
ok("★パソコンには出さない", m.canAddToHome({ os: OS.OTHER, userAgent: UA.mac }) === false);

// ★代わりに「ふつうのブラウザで開いてください」と伝えます。
ok("★LINE の中では、開き直しを伝える",
  m.shouldAskToOpenInBrowser({ userAgent: UA2.line }) === true);
ok("★Safari では伝えない", m.shouldAskToOpenInBrowser({ userAgent: UA.iPhone }) === false);
ok("★ホーム画面版では伝えない",
  m.shouldAskToOpenInBrowser({ userAgent: UA2.line, standalone: true }) === false);

console.log("\n⑦ ★言葉の決まり");
const code = stripComments(src);
// ★「インストール」と書くと、ストアを探されます。
ok("★★「インストール」と書いていない", !/インストール/.test(code));
// ★追加したかどうかを、アプリは知りません。
ok("★「ありがとう」と書いていない", !/ありがとう/.test(code));
// ★.mobileconfig（構成プロファイル）は採りません。
//   ★「この構成プロファイルは、あなたの端末を管理できます」と出ます。
//   ★★体調のアプリで、その画面を出させないこと。
ok("★★構成プロファイルの道を作っていない",
  !/mobileconfig|configuration profile/i.test(code));

console.log("\n⑧ ★判断と、window を読むところを分けていること");
ok("★判断する関数は window を読まない",
  !/window\./.test(code.slice(0, code.indexOf("export function readPlatform"))));
ok("★readPlatform は、サーバでも落ちない",
  /typeof window === "undefined"/.test(code));

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
})();
