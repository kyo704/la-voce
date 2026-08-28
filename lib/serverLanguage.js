// ============================================================================
// 言語の決め方を1か所にする（多言語対応（伊英中）.md §4）
//
// ★これまで、言語の選び方が2系統ありました。
//     ① アプリ本体   createTranslator ＋ localStorage["la-voce-language"]
//     ② 入口と理論ページ  各ファイルが自前の LANGS を持ち、?lang= で切替
//   ②で日本語以外を選んで登録しても、ログインした先は日本語に戻ります。
//   選んだ言語が、境目で落ちていました。
//
// ★このファイルは「どの言語で出すか」だけを決めます。
//   訳文は持ちません。訳文は lib/translations.js です。
//
// ★サーバー側では localStorage が読めません。cookie を使います。
//   優先順位:  ?lang=  →  cookie  →  ja
//   ?lang= を先にするのは、配ったリンクを必ず効かせるためです。
// ============================================================================

/** 対応している言語。★lib/translations.js と同じ9つ。 */
export const SUPPORTED_LANGUAGES = ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"];

/** 言語の選択肢（★その言語自身の名前で出す。訳さないこと）。 */
export const LANGUAGE_OPTIONS = [
  { code: "ja", label: "日本語" },
  { code: "en", label: "English" },
  { code: "zh", label: "中文" },
  { code: "it", label: "Italiano" },
  { code: "de", label: "Deutsch" },
  { code: "fr", label: "Français" },
  { code: "es", label: "Español" },
  { code: "ko", label: "한국어" },
  { code: "ru", label: "Русский" }
];

/** cookie の名前。★localStorage の鍵と同じ名前にして、混乱を避けます。 */
export const LANGUAGE_COOKIE = "la-voce-language";

export function isSupportedLanguage(code) {
  return typeof code === "string" && SUPPORTED_LANGUAGES.includes(code);
}

/**
 * サーバー側で言語を決める。
 * @param {object} searchParams  ページが受け取る searchParams
 * @param {object} cookieStore   next/headers の cookies()
 */
export function resolveLanguage(searchParams, cookieStore) {
  const fromQuery = searchParams && searchParams.lang;
  if (isSupportedLanguage(fromQuery)) return fromQuery;
  try {
    const c = cookieStore && cookieStore.get(LANGUAGE_COOKIE);
    if (c && isSupportedLanguage(c.value)) return c.value;
  } catch { /* cookie が読めない環境でも、日本語で出します */ }
  return "ja";
}

/**
 * ?lang= を保ったままのリンク先。
 * ★入口で言語を選んだ人が、登録・ログインへ進んでも同じ言語で見られるように。
 */
export function withLang(href, lang) {
  if (!isSupportedLanguage(lang) || lang === "ja") return href;
  return `${href}${href.includes("?") ? "&" : "?"}lang=${lang}`;
}
