// ============================================================================
// ブランド名（ブランド名の改名（La Voce→Woolsong）v2.md Phase 0）
//
// ★名前を1か所にまとめます。次の改名を1行で終わらせるためです。
//
// ★訳しません。9言語すべてで Woolsong のままです。
//   翻訳の文面では、名前を直書きせず {brand} で差し込みます。
//   翻訳者が名前を訳せない形にすることが、目的そのものです。
//
// ★表記は1形だけ（§2）:
//     ○ Woolsong
//     ✗ WoolSong / WOOLSONG / Wool Song / woolsong（文中）
//     ✗ ウールソング（★UIでは使わない）
//
//   カタカナは、日本語の本文の★初出で読み方を一度示すためだけに使います。
//   画面のラベルには使いません。
// ============================================================================

export const BRAND = {
  name: "Woolsong",
  nameJaReading: "ウールソング",
  domain: "woolsong.app"
};

/**
 * ★運営者への連絡先。画面から見えるアドレスは、ここだけに書きます。
 *
 *   ★これは画面に出るアドレスです。mailto: のリンクとして、
 *     ソースを見れば誰にでも読めます。だから★運営専用のものを使います。
 *     坂本さん個人のアドレス（問い合わせの届け先 app/api/feedback/route.js）は、
 *     server の側だけに置いて、画面には出しません。混ぜないこと。
 *
 *   ★お返事の期日を画面に書いています（3日以内）。
 *     アドレスを変えるときは、そちらが確実に届くことを必ず確かめてください。
 *     10月中旬から坂本さんはイタリアです。時差のある場所でも読める先にすること。
 *
 *   ★差し替えるのはこの1行だけです。ほかに書いてある場所はありません。
 */
export const OPERATOR_CONTACT_EMAIL = "woolsong.app@gmail.com";

/**
 * 日本語の本文で、初出のときだけ読み方を添える形。
 * ★画面のラベルには使わないこと（§2-1）。
 */
export const BRAND_WITH_READING = `${BRAND.name}（${BRAND.nameJaReading}）`;

/**
 * 翻訳の文面に名前を差し込む。
 * ★9言語すべてで同じ {brand} を使うこと。言語ごとに書き分けない。
 */
export function withBrand(template) {
  return String(template == null ? "" : template).replace(/\{brand\}/g, BRAND.name);
}

/**
 * ★使ってはいけない表記（§2）。検査がこの一覧を見ます。
 *   ここに足すことはあっても、消すことはありません。
 */
export const FORBIDDEN_BRAND_FORMS = [
  "WoolSong", "WOOLSONG", "Wool Song", "wool song"
];

/**
 * ★旧ブランド名。探すために持っています。置換のためではありません。
 *   配管（変数名・テーブル名・localStorage のキー）には残ります。
 *   残ってよいものと、直すものを分けるのが Phase 0 の仕事です。
 */
export const LEGACY_BRAND_FORMS = [
  "La Voce", "LaVoce", "la voce", "la-voce", "lavoce", "LA VOCE",
  "ラ・ヴォーチェ", "ラヴォーチェ", "ラ　ヴォーチェ", "ラ・ボーチェ", "ヴォーチェ"
];
