// ============================================================================
// 用語辞書 — 同じ列、違う言葉
//
// 出典：docs/lavoce-作業指示-職業を声の型で切り直す.md §4
//
// 「収録」を「本番」と呼ばれた声優は、自分のためのアプリだと思いません。
// 逆に、言葉さえ合っていれば、中身は一言一句同じで構いません。
//
// ★変えるのは呼び名だけです。
//   列名・型・保存形式は、すべて同じままにします。
//   このアプリでは「本番」「リハーサル」「レッスン」が、画面の文字であると
//   同時に、保存される値そのものでもあります（activity_type / activity.kind）。
//   発声負荷の重み ACTIVITY_LOAD_WEIGHT も、この文字列を鍵にしています。
//   ★したがって、辞書は kind を書き換えません。表示のときだけ差し替えます。
//
// ★多言語の仕組みの上に載せます（§4）。
//   この辞書は日本語だけを持ちます。職業ごとの言い回しは日本語の語彙だから
//   です。日本語以外では、これまでどおり translations.js の訳語を使います。
//   辞書に無い職業・無い語は、声楽の言葉に落ちます。
//
// ★辞書は1ファイルにまとめます。画面のあちこちに文字列を散らさないこと。
// ============================================================================

// 差し替えられる語。★増やすときは、必ずこの一覧に足してから使うこと。
export const TERM_KEYS = [
  "performanceDay",          // 本番の日
  "rehearsalDay",            // 合わせ・稽古の日
  "lessonDay",               // レッスンの日
  "offStageVoiceMinutes",    // 舞台の外で声を使った時間
  "warmupDone",              // 声を温めたか
  "dayAfterPerformance"      // 本番の翌日
];

// 声楽の言葉。★これが既定です。辞書に無いものは、すべてここに落ちます（§4）。
const BASE = {
  performanceDay: "本番",
  rehearsalDay: "合わせ",
  lessonDay: "レッスン",
  offStageVoiceMinutes: "練習以外で話した時間",
  warmupDone: "発声",
  dayAfterPerformance: "本番の翌日"
};

// 声楽と違うところだけを書きます。書かなかった語は BASE に落ちます。
//
// ★仕様書の表の「同左」は、声楽の列と読みました。
//   表のすぐ左の欄と読むと、落語とポップスに「放送以外で話した時間」が
//   割り当たります。落語も音楽も放送ではないので、§4 が戒めている
//   「自分のためのアプリだと思えない言葉」そのものになります。
//   仕様書自身が「辞書に無い職業は声楽の列に落とす」と書いているので、
//   同じ規則を、書かれていない欄にも当てました。
//   ★ナレーター・落語・ポップスの3つは、より近い言葉に変えられます。
//     直すのは1行です。坂本さんの判断を待っています。
//
// ★俳優（映像）・司会・その他は、仕様書の表に列がありません。
//   §4 の規則どおり、まるごと声楽の言葉に落ちます。
const OVERRIDES = {
  musical: {
    rehearsalDay: "稽古",
    warmupDone: "ウォームアップ",
    dayAfterPerformance: "公演の翌日"
  },
  pops: {
    performanceDay: "ライブ",
    rehearsalDay: "リハ",
    warmupDone: "ウォームアップ",
    dayAfterPerformance: "ライブの翌日"
  },
  voiceActor: {
    performanceDay: "収録",
    rehearsalDay: "テスト",
    offStageVoiceMinutes: "収録以外で話した時間",
    warmupDone: "喉ならし",
    dayAfterPerformance: "収録の翌日"
  },
  narrator: {
    performanceDay: "収録",
    rehearsalDay: "下読み",
    warmupDone: "喉ならし",
    dayAfterPerformance: "収録の翌日"
  },
  announcer: {
    performanceDay: "生放送",
    rehearsalDay: "打ち合わせ",
    lessonDay: "研修",
    offStageVoiceMinutes: "放送以外で話した時間",
    dayAfterPerformance: "放送の翌日"
  },
  actorStage: {
    performanceDay: "公演",
    rehearsalDay: "稽古",
    lessonDay: "稽古",
    offStageVoiceMinutes: "稽古以外で話した時間",
    dayAfterPerformance: "公演の翌日"
  },
  rakugo: {
    performanceDay: "高座",
    rehearsalDay: "ネタ稽古",
    lessonDay: "稽古",
    warmupDone: "声出し",
    dayAfterPerformance: "高座の翌日"
  }
};

// 職業ごとの、埋まった表。
// ★このファイルは、ほかの lib を読み込みません。
//   lib の各モジュールは1つずつ独立して読めるようにしてあり（テストが
//   data: URL で1ファイルだけ読み込むため）、相対 import を足すと
//   その仕組みが壊れます。職業の一覧をここに写すこともしません。
//   写した瞬間に、同じ決めごとが2か所になるからです。
//   ★代わりに term() が、知らない職業を声楽の言葉に落とします。
//     一覧とのズレは components/tests/vocabulary.test.js が見張ります。
export const VOCAB = Object.keys(OVERRIDES).reduce(
  (acc, key) => { acc[key] = { ...BASE, ...OVERRIDES[key] }; return acc; },
  { classical: { ...BASE } }
);

/**
 * その職業での呼び名（日本語）。
 * ★知らない職業・知らない語は、声楽の言葉に落ちます。
 */
export function term(occupation, termKey) {
  const row = VOCAB[occupation] || BASE;
  return row[termKey] || BASE[termKey] || "";
}

/**
 * 画面に出す呼び名。
 *
 * 日本語のときだけ辞書を使い、それ以外の言語では、これまでどおり
 * translations.js の訳語をそのまま使います。
 * ★職業ごとの言い回しは日本語の語彙なので、機械的に他言語へ広げません。
 *
 * @param {string} occupation  職業キー
 * @param {string} termKey     TERM_KEYS のどれか
 * @param {string} language    表示中の言語
 * @param {function} t         createTranslator が返す t
 * @param {string} fallbackKey 日本語以外で使う translations.js のキー
 */
export function termLabel(occupation, termKey, language, t, fallbackKey) {
  if (language === "ja") return term(occupation, termKey);
  if (typeof t === "function" && fallbackKey) return t(fallbackKey);
  return term(occupation, termKey);
}
