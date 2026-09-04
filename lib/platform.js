// ============================================================================
// どの端末で、どう開かれているか（2026-09-04）
//
//   出どころ docs/opus/lavoce-仕様-ホーム画面までの動線・画面と文言（9月4日）.md
//            docs/opus/lavoce-設計-ホーム画面までの導線（9月4日）.md
//
//   ★★いちばん大事な事実
//     ★iOS では、★ホーム画面から開いた PWA と Safari で、
//       ★cookie も localStorage も IndexedDB も★共有されません。
//     ★ブラウザで登録させると、★ホーム画面から開いたとき
//       ★★ログアウトした状態になります。
//     ★だから iOS だけ、★順番を入れ替えます（★置いてから登録）。
//
//   ★ここは★判断だけをします。★画面を持ちません。
//     ★window を直に読みません。★引数で受け取ります。
//     ★★そうしないと、検査できません（★サーバ側でも呼べません）。
//   ★window を読むのは、★呼ぶ側の薄い層です（readPlatform）。
//
//   ★このファイルは、ほかの lib を読み込みません。
// ============================================================================

export const OS = {
  IOS: "ios",
  ANDROID: "android",
  OTHER: "other"
};

/**
 * どの OS か。
 *
 *   ★iPadOS 13 以降は、★Mac だと名乗ります。
 *     ★指で触れる Mac は、いまのところありません。
 *     ★だから maxTouchPoints で見分けます。★これを落とすと、
 *       ★★iPad の方に Android の道を出してしまいます。
 */
export function osOf({ userAgent, maxTouchPoints, platform } = {}) {
  const ua = String(userAgent || "");
  if (/iPad|iPhone|iPod/.test(ua)) return OS.IOS;
  // ★iPadOS 13 以降
  const isMacLike = /Macintosh|Mac OS X/.test(ua) || /Mac/.test(String(platform || ""));
  if (isMacLike && Number(maxTouchPoints || 0) > 1) return OS.IOS;
  if (/Android/.test(ua)) return OS.ANDROID;
  return OS.OTHER;
}

/**
 * ホーム画面から開かれているか。
 *
 *   ★iOS は navigator.standalone、★そのほかは display-mode で分かります。
 *   ★どちらかが true なら、★ホーム画面版です。
 */
export function isStandaloneFrom({ navigatorStandalone, displayModeStandalone } = {}) {
  return navigatorStandalone === true || displayModeStandalone === true;
}

/**
 * Safari か。
 *
 *   ★iOS では、Chrome も Firefox も★中身は Safari です。
 *     ★ですが、★「ホーム画面に追加」ができるかは、★ガワによって違います。
 *   ★iOS 16.4 以降なら、対応しているブラウザからも追加できます。
 *     ★対応していないものもあるので、★案内の1行を用意します。
 *   ★ここでは「Safari のガワか」だけを見ます。
 */
export function isIosSafari({ userAgent } = {}) {
  const ua = String(userAgent || "");
  if (!/iPad|iPhone|iPod/.test(ua)) return false;
  // ★CriOS = Chrome、FxiOS = Firefox、EdgiOS = Edge、OPiOS = Opera
  return !/CriOS|FxiOS|EdgiOS|OPiOS|Mercury/.test(ua);
}

/** 導線の段。★画面の名前ではありません。★どこへ進むか、です。 */
export const STEP = {
  LANDING: "landing",           // ① 着地
  IOS_ADD_TO_HOME: "addToHome", // ② iOS：ホーム画面に置く
  REGISTER: "register",         // 登録（メール）
  CODE: "code",                 // 6桁の数字
  OCCUPATION: "occupation",     // 職業（1問）
  FIRST_ENTRY: "firstEntry",    // 今日の記録
  DONE: "done"
};

/**
 * ★次に出す段を決めます。
 *
 *   ★iOS ＆ ホーム画面版でない → ★まず置いてもらいます
 *     ★★ここでブラウザの登録画面を出さないこと。
 *       ★出すと、ホーム画面から開いたときログアウトしています。
 *   ★iOS ＆ ホーム画面版        → 登録へ
 *   ★Android / そのほか        → 登録へ（★順番はそのまま）
 *
 *   ★「あとで」を押した方には、★ブラウザでも始められる道を出します。
 *     ★ただし★先に伝えます（もう一度だけ数字を入れていただきます）。
 *     ★★不利なことを、先に書きます。あとで驚かせません。
 */
export function nextStep({ os, standalone, skippedAddToHome } = {}) {
  if (os === OS.IOS && !standalone && !skippedAddToHome) {
    return STEP.IOS_ADD_TO_HOME;
  }
  return STEP.REGISTER;
}

/**
 * ★Android で、ホーム画面の案内を出してよいか。
 *
 *   ★記録を1つ入れたあとに、★1回だけです。
 *   ★★beforeinstallprompt が来ていない端末には、★出しません。
 *     ★押せないボタンを、見せないこと。
 *   ★★一度断られたら、二度と出しません。★催促しません。
 */
export function mayShowAndroidInstall({ os, standalone, hasDeferredPrompt, dismissedAt, enteredFirstRecord } = {}) {
  if (os !== OS.ANDROID) return false;
  if (standalone) return false;
  if (!hasDeferredPrompt) return false;
  if (dismissedAt) return false;
  return enteredFirstRecord === true;
}

/**
 * ★iOS で、ホーム画面の案内を出してよいか。
 *
 *   ★ホーム画面版で開かれていたら、★もう要りません。
 *   ★★一度断られたら、二度と出しません。
 *     ★代わりに、設定の中に「ホーム画面に置く方法」を常設で置きます。
 */
export function mayShowIosAddToHome({ os, standalone, dismissedAt } = {}) {
  if (os !== OS.IOS) return false;
  if (standalone) return false;
  if (dismissedAt) return false;
  return true;
}

/**
 * ★window を読む、薄い層。
 *
 *   ★サーバ側では呼べません。★呼ぶ側が、画面の中で使ってください。
 *   ★★ここに判断を書かないこと。★判断は上の関数が持ちます。
 */
export function readPlatform() {
  if (typeof window === "undefined" || typeof navigator === "undefined") {
    return { os: OS.OTHER, standalone: false, iosSafari: false };
  }
  const input = {
    userAgent: navigator.userAgent,
    maxTouchPoints: navigator.maxTouchPoints,
    platform: navigator.platform
  };
  const displayModeStandalone =
    typeof window.matchMedia === "function" &&
    window.matchMedia("(display-mode: standalone)").matches;
  return {
    os: osOf(input),
    standalone: isStandaloneFrom({
      navigatorStandalone: navigator.standalone === true,
      displayModeStandalone
    }),
    iosSafari: isIosSafari(input)
  };
}
