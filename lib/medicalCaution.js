// ============================================================================
// 「これは診断ではありません」という注意書きの、唯一の正
//
//   ★同じ注意が、言い回しだけ変えて4か所にありました（2026-08-30）。
//
//     ① 健康情報のいちばん上   「医学的な診断や治療の代わりになるものではありません」
//     ② 対策の見出し           「診断や治療の代わりにはなりません」
//     ③ 症状の節の下           「診断ではありません」
//     ④ 声のスコアの下         「医学的な診断や絶対的な評価を示すものではなく」
//
//   ★これは表記ゆれではなく、安全にかかわる問題です。
//     一番弱い言い方（③「診断ではありません」）だけを読んだ人が、
//     「では治療の代わりにはなるのか」と受け取る余地を残します。
//     ★4か所のうち1か所を直して、他を直し忘れる形にしないこと。
//
//   ★受診の案内（耳鼻咽喉科・2週間）は、注意書きとは別の情報です。
//     こちらは消さずに、注意書きのあとに足します。中身が違うためです。
// ============================================================================

export const CAUTION_LANGS = ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"];

/**
 * ★どの画面でも、これと一字一句同じ文を出します。
 *   言い換えないこと。弱めないこと。
 */
export const MEDICAL_CAUTION = {
  ja: "これは医学的な診断や治療の代わりになるものではありません。",
  en: "This is not a substitute for medical diagnosis or treatment.",
  zh: "这不能替代医学诊断或治疗。",
  it: "Questo non sostituisce una diagnosi o un trattamento medico.",
  de: "Dies ersetzt keine ärztliche Diagnose oder Behandlung.",
  fr: "Ceci ne remplace pas un diagnostic ou un traitement médical.",
  es: "Esto no sustituye un diagnóstico ni un tratamiento médico.",
  ko: "이것은 의학적 진단이나 치료를 대신하지 않습니다.",
  ru: "Это не заменяет медицинскую диагностику или лечение."
};

/** その言語の注意書き。★知らない言語でも空にしないこと。 */
export function medicalCaution(lang) {
  return MEDICAL_CAUTION[lang] || MEDICAL_CAUTION.ja;
}

/**
 * 注意書きのうしろに、その場所だけの案内を足す。
 *
 * ★注意書きそのものは書き換えません。足すだけです。
 */
// 日本語・中国語・韓国語は、文の間に空白を入れません。
const NO_SPACE_LANGS = ["ja", "zh", "ko"];
function join(lang, a, b) {
  if (!b) return a;
  return NO_SPACE_LANGS.includes(lang) ? `${a}${b}` : `${a} ${b}`;
}

export function cautionWith(extraByLang) {
  const out = {};
  CAUTION_LANGS.forEach((l) => {
    out[l] = join(l, medicalCaution(l), (extraByLang && extraByLang[l]) || "");
  });
  return out;
}

/**
 * その場所だけの案内を先に置き、注意書きをうしろに足す。
 *
 * ★「一般的に言われている対策です」のように、先に主題が来る文で使います。
 *   注意書きが先に来ると、何についての注意なのか分からなくなるためです。
 */
export function cautionAfter(introByLang) {
  const out = {};
  CAUTION_LANGS.forEach((l) => {
    out[l] = join(l, (introByLang && introByLang[l]) || "", medicalCaution(l));
  });
  return out;
}
