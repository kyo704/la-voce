// ============================================================================
// 年齢の確認 — ★この判断の唯一の正
//
//   出典 作業指示-公開前の実装.md A-7 の1行目
//        作業指示-研究利用の同意.md §1-④「★未成年には出さない」・§3-3・§5
//        ★判断の回答-年齢確認とアカウント削除-20260830.md §1（論拠の差し替え）
//
//   ★これは配布前の暫定です（同 §1-4）。
//     一般公開のときに保護者同意（案D ⑤）を作ります。そのときに、
//     生年月日を含めて設計し直します。
//     ★「暫定である」と書かれていない暫定は、恒久になります。
//
// ---------------------------------------------------------------------------
// ★なぜ profiles.age を使わないのか（2026-08-30 に論拠を差し替えました）
// ---------------------------------------------------------------------------
//
//   ✗ 旧い理由：集める情報が最小限だから
//     → ★これはもう成り立ちません。profiles.age を既に集めています
//       （Mifflin-St Jeor の基礎代謝と、体脂肪率の推定に使っています）。
//
//   ○ ★新しい理由：安全に関わる判定を、他の目的の欄と混ぜないため
//
//     ① 間違えたときの害が、まったく違う
//          age を間違える       … 栄養計算がずれる。小さな害。あとで直せる
//          未成年判定を間違える … 未成年が教師と紐付く。★取り返しがつかない
//
//        ★読み取りをこのファイルに一元化しても、書き込みの危険は消えません。
//          「体重が変わったからプロフィールを更新した」つもりで年齢を直した
//          瞬間に、安全ゲートが静かに開きます。本人にも、こちらにも見えません。
//
//     ② 安全ゲートを、埋まっていない欄に依存させない
//          profiles.age は任意で、記入率が低い（2026-08-30 の充足率調査）。
//          フェイルクローズは効きますが、★成人のテスターも全員弾かれます。
//
//     ③ 生年月日は、このアプリでは特に危険
//          名前も住所も集めていないので、生年月日を足すと識別性が上がります。
//          周期の記録と組み合わさると、要配慮個人情報 ＋ 強い識別子になります。
//
//     ④ 「古くならない」は、この用途では利点ではない
//          17歳が18歳になった瞬間に、自動で教師と紐付けられるようになる。
//          ★勝手に開くゲートより、本人が開けるゲートのほうが安全です。
//          だから、設定で本人が変えられるようにしています（変更は記録に残します）。
//
// ---------------------------------------------------------------------------
//
//   ★答えていない人は、未成年として扱います（フェイルクローズ）。
//     「分からないから聞いてしまう」のが、いちばんしてはいけないことです。
//     そのため null と true は、どちらも未成年です。
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
