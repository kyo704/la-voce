// ============================================================================
// 年齢の確認 — ★この判断の唯一の正
//
//   出典 作業指示-公開前の実装.md A-7 の1行目
//        作業指示-研究利用の同意.md §1-④「★未成年には出さない」・§3-3・§5
//
//   ★A-7 は「生年月日、または『18歳未満か』を登録時に聞く」と書いています。
//     坂本さんの判断で はい/いいえ にしました。必要なのは「18歳未満か」だけで、
//     生年月日はそれ以上を集めてしまいます。
//
//   ★答えていない人は、未成年として扱います（フェイルクローズ）。
//     「分からないから聞いてしまう」のが、いちばんしてはいけないことです。
//     そのため null と true は、どちらも未成年です。
//
//   ★profiles.age は使いません。
//     あれは体組成の推定のために入れてもらう任意の数値で、目的が違います。
//     同じ判断が2か所に住むと、片方だけ変わります。年齢の確認は
//     is_under_18 だけを見ます。
//
//   ★この場所で答えを出すこと。呼ぶ側で `profile.is_under_18 === false` と
//     書かないでください。フェイルクローズの向きが、そこだけ逆になります。
//
//   ★このファイルは、ほかの lib を読み込みません。
//     試験が1本ずつ切り離して読み込むためです。
// ============================================================================

/** 大人と見なす年齢。★A-7 の「18歳未満」に対応します。 */
export const ADULT_AGE = 18;

/**
 * この質問に答えたか。
 * ★飛ばした人は「答えていない」です（＝未成年として扱われます）。
 */
export function hasAnsweredAgeQuestion(profile) {
  return !!profile && typeof profile.is_under_18 === "boolean";
}

/**
 * ★未成年として扱うか。
 *   答えていない人も、ここでは未成年です。安全な側へ倒しています。
 */
export function isTreatedAsMinor(profile) {
  if (!hasAnsweredAgeQuestion(profile)) return true;
  return profile.is_under_18 === true;
}

/**
 * 「18歳以上です」と本人がはっきり答えた人だけ true。
 * ★年齢に関わる出し分けは、すべてこれを見てください。
 */
export function isAdultConfirmed(profile) {
  return hasAnsweredAgeQuestion(profile) && profile.is_under_18 === false;
}

/**
 * この質問を出すか。
 * ★一度出したら、飛ばされていても二度と出しません。
 *   何度も出すのは、答えを迫るのと同じことになります。
 */
export function shouldAskAgeQuestion(profile) {
  if (!profile) return false;
  if (hasAnsweredAgeQuestion(profile)) return false;
  return !profile.age_question_shown_at;
}

/**
 * ★任意の同意を求めてよい相手か（研究利用の同意 §1-④）。
 *   未成年には求めません。保護者同意の設計が別に要るためです（A-7）。
 */
export function mayAskForConsent(profile) {
  return isAdultConfirmed(profile);
}

/**
 * 答えを保存する形にする。
 * ★答えると同時に「出した」も記録します。二度たずねないためです。
 */
export function answerToProfilePatch(isUnder18, now) {
  return {
    is_under_18: isUnder18 === true ? true : false,
    age_question_shown_at: now || new Date().toISOString()
  };
}

/**
 * 「あとで」を選んだときの形。
 * ★is_under_18 は null のままにします。答えていないので、未成年として扱われます。
 */
export function skipToProfilePatch(now) {
  return {
    is_under_18: null,
    age_question_shown_at: now || new Date().toISOString()
  };
}

/**
 * 登録画面の答え（auth の user_metadata 経由）を、保存する形にする。
 *
 * ★登録の時点では、まだログインしていません（確認メールの前）。
 *   そのため profiles には書けず、いったん auth の user_metadata に預けます。
 *   初回ログインのときに、ここで受け取って profiles へ移します。
 * ★受け取れなかったときは、何も返しません。アプリの中の質問が出るだけです。
 *   取りこぼしても、未成年として扱われるほうへ倒れます。
 */
export function adoptSignupAnswer(profile, signupAnswer, now) {
  if (!profile) return null;
  if (hasAnsweredAgeQuestion(profile)) return null;
  if (typeof signupAnswer !== "boolean") return null;
  return answerToProfilePatch(signupAnswer, now);
}
