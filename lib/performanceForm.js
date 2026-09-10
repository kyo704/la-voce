// ============================================================================
// 本番の かたち ── ソロ か、合唱・アンサンブルか
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     の SH['honban'] の 5札 ──
//     本番（ソロ）／本番（合唱・アンサンブル）／レッスン／リハーサル／なし
//
//   ★★2026-09-11、★坂本さんの お決め（★F-2 ㋐「分ける」）。
//     「ソロと 合唱・アンサンブルは、★声への 負荷が 異なるため、
//       ★区別できる 方が 良いです」
//
//   ★★新しい 列を 作りません。
//     ★本番の かたまり（activities[]）の detail に しまいます。
//     ★activities は もとから 1つの まとまりとして 保存されている 欄です。
//     ★★だから、★書き出しにも、★退会の 消しこみにも、★もう 入っています。
//
//   ★★「なし」を ここに 置きません。
//     ★見本の 5札の うち「なし」は、★本番でも レッスンでも ない 日の ことです。
//     ★この家では、★本番の かたまりを 作らなければ「なし」です。
//     ★★選ばせると、★「なし」という 本番の かたまりが できてしまいます。
//
//   ★★出来ばえを 聞きません。★かたちを 聞くだけです（★見本の 但し書き）。
//
//   ★見張り components/tests/performance-form.test.js
// ============================================================================

/** ★2つだけ。★見本の 並びの ままです。 */
export const PERFORMANCE_FORMS = Object.freeze(["ソロ", "合唱・アンサンブル"]);

/** ★見出し。 */
export const PERFORMANCE_FORM_LABEL = "本番の かたち";

/**
 * ★但し書き。
 *
 *   ★★「どちらが 大変か」を 書きません。★事実を 分けるだけです。
 *   ★★分ける 理由は 書きます。★黙って 増やすと、★何のための 欄か 分かりません。
 */
export const PERFORMANCE_FORM_NOTE =
  "声の 使い方が ちがうので、分けて 残します。どちらが よい・わるい では ありません。";

/** ★しまってよい 値か。★知らない 値を 通しません。 */
export function isPerformanceForm(v) {
  return PERFORMANCE_FORMS.includes(v);
}

/**
 * ★その日の 本番の かたち（★複数 あれば 先に 書いたもの）。
 *
 *   ★★読む 側が 1か所で 済むように、★ここに 置きます。
 *   ★★本番の かたまりが 無い日は null です。
 */
export function performanceFormOf(entry) {
  const acts = entry && entry.activities;
  if (!Array.isArray(acts)) return null;
  const hit = acts.find((a) => a && a.kind === "本番"
    && a.detail && isPerformanceForm(a.detail.performanceForm));
  return hit ? hit.detail.performanceForm : null;
}
