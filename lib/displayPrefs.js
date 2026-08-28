// ============================================================================
// 見やすさ（見やすさとかんたん表示.md）
//
// ★年齢で切り替えません。年齢を必須で聞きません。
//   40代でも老眼は始まります。20代でも弱視の人がいます。
//   80代でもスマホを速く使う人がいます。そして「あなたは高齢者ですね」と
//   機械に判定されるのは、不快です。
//   年齢は、必要な設定を推測するための代理変数にすぎません。
//   本人に直接、見え方を選んでもらえば足ります。
//
// ★「シニアモード」と画面に書きません。名前は「見やすさ」です。
//
// ★文字の大きさと「かんたん表示」は別の設定です。
//   大きい文字だけ欲しい人がいます。片方だけ変えられること。
//
// ★画面を2つ作りません。CSS変数で、1つの画面が伸び縮みします。
//   2つ作ると、片方だけ直す日が必ず来ます。
// ============================================================================

export const SCALES = ["normal", "large", "xlarge"];
export const DEFAULT_SCALE = "normal";

/** 設定画面に出す名前。★「シニア」「高齢者」と書かないこと。 */
export const SCALE_LABELS = {
  normal: "ふつう",
  large: "大きい",
  xlarge: "とても大きい"
};

/**
 * 見本の文字。★実寸で出すこと。
 * 「大きい」という言葉では伝わりません。選ぶ人が見て決められるように。
 */
export const SCALE_SAMPLE = "あいう";

export function normalizeScale(v) {
  return SCALES.includes(v) ? v : DEFAULT_SCALE;
}

/**
 * html 要素に付ける印。CSS 側の [data-scale="..."] がこれを見る。
 * ★ふつうのときは付けない（既定値を :root に置いてあるため）。
 */
export function scaleAttribute(profile) {
  const s = normalizeScale(profile && profile.display_scale);
  return s === DEFAULT_SCALE ? null : s;
}

/**
 * かんたん表示か。★文字の大きさとは独立して決まります。
 * 片方を選んだらもう片方も変わる、という作りにしないこと。
 */
export function isSimpleDisplay(profile) {
  return !!(profile && profile.simple_display);
}

/**
 * かんたん表示で減らすのは★選択肢であって、機能ではありません。
 * 消すのではなく、奥に置きます。押した先には全部あります。
 *
 * @returns ホームに出す二番目のボタンの上限
 */
export const SIMPLE_HOME_SECONDARY_MAX = 2;

/** かんたん表示のとき、この部品は使わない（§3-2） */
export const SIMPLE_FORBIDDEN_CONTROLS = ["slider", "toggle", "longPressDelete", "swipeOnly"];

/**
 * ★スライダーは、手が震える人には操作できません。
 *   そして正確な値を入れたい人にも向きません。両方に悪い部品です。
 *   かんたん表示では、5つの大きなボタンに置き換えます。
 */
export function controlFor(kind, profile) {
  if (!isSimpleDisplay(profile)) return kind;
  if (kind === "slider") return "buttons5";
  if (kind === "toggle") return "twoButtons";
  if (kind === "longPressDelete") return "deleteButton";
  if (kind === "swipeOnly") return "nextButton";
  return kind;
}

/**
 * ★消える通知を使わないこと（§4-1）。
 *   読み終わる前に消えます。そして「何か出たけど読めなかった」は不安を生みます。
 */
export const USE_DISAPPEARING_TOAST = false;

// ---------------------------------------------------------------------------
// 間違えても壊れない（§4-2）
// ---------------------------------------------------------------------------

/**
 * 保存のあと「取り消す」を出しておく時間。
 * ★消える通知（トースト）ではありません。画面の中に残し、自分で閉じます。
 *   読み終わる前に消えるのが、いちばん不安を生みます（§4-1）。
 */
export const UNDO_WINDOW_MS = 30000;

/**
 * 削除は2段階（§4-2）。「消しますか」→「消す」。
 * ★1回で消える削除を作らないこと。押し間違いは必ず起きます。
 */
export const DELETE_NEEDS_CONFIRM = true;

/**
 * ★エラーには、何をすればいいかを書くこと。
 *   ✗「エラーが発生しました」／「不明なエラー」
 *   ○「保存できませんでした。もう一度［保存］を押してください」
 *
 *   技術的な中身は console に出します。画面には出しません。
 *   利用者が読んで動けるのは、次にすることだけです。
 */
export const ACTIONABLE_ERROR_KEY = "errorSaveFailedRetry";

// ---------------------------------------------------------------------------
// ホーム画面に追加する案内（§6）
//
//   ★この層がいちばん脱落する場所です。
//     PWA は、ブラウザの共有メニューから「ホーム画面に追加」を押さないと
//     アプリになりません。この操作を知らない人が、大多数です。
//
//   ★「あとで」を押せるようにすること。
//     ブラウザのままでも全部使えます。そう書いてあること。
//     追加しないと使えない、と読ませないこと。
// ---------------------------------------------------------------------------

/** iPhone と Android で、案内を出し分ける（§6） */
export const INSTALL_STEPS = {
  ios: [
    "画面のいちばん下にある、□に↑ のボタンを押す",
    "出てきた一覧を下へたどり、「ホーム画面に追加」を押す",
    "右上の「追加」を押す",
    "羊のマークができたら、それを押して開く"
  ],
  android: [
    "画面の右上にある ⋮ のボタンを押す",
    "「ホーム画面に追加」または「アプリをインストール」を押す",
    "「追加」を押す",
    "羊のマークができたら、それを押して開く"
  ]
};

/** ★追加しなくても困らない、と必ず書く。 */
export const INSTALL_LATER_NOTE = "ブラウザのままでも、全部そのまま使えます。";
export const INSTALL_LATER_LABEL = "あとで";

/**
 * 案内を出してよいか。
 * ★もう追加済みの人には出さない。閉じた人にも、その後は出さない。
 * ★こちらから何度も勧めないこと（§7-9 と同じ考え方）。
 */
export function shouldShowInstallGuide({ installed, dismissed, platform }) {
  if (installed || dismissed) return false;
  return platform === "ios" || platform === "android";
}
