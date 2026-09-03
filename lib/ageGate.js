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
/**
 * 嗜好品（たばこ・お酒）の欄を出してよいか。
 * 出典 docs/lavoce-用語辞書の拡張と嗜好品の記録.md §7-2
 *
 * ★未成年には項目ごと出しません。灰色にするのでも、押せなくするのでもなく、
 *   ★欄そのものを出しません（先行公開 §4「隠すのではありません。無いのです」）。
 *
 * ★フェイルクローズ：年齢に答えていない人にも出しません。
 *   isTreatedAsMinor が null と true の両方を未成年として扱います。
 *
 * ★これは「本人の記録を止める」話ではなく、
 *   ★未成年に飲酒・喫煙を前提とした問いを見せない、という話です。
 *   周期の記録（誰にも止めない）とは、性質が違います。
 */
export function mayShowLuxuryFields(profile) {
  return isAdultConfirmed(profile);
}

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

// ============================================================================
// ★3つの帯（2026-09-04）
//
//   出どころ docs/opus/lavoce-判断-2択から3帯へ（9月4日・追補）.md
//            docs/opus/lavoce-判断-未成年に売ること（9月4日）.md §13
//
//   ★これは★新しい問いです。★2択の答えを、★移し替えません。
//     ★「18歳未満です」と答えた方が、★15歳未満なのか15〜17歳なのかは
//       ★分かりません。★推測で埋めると、
//       ★★本人が答えた値と、見分けがつかなくなります。
//     ★「選んだ」と「既定のまま」を分ける、という決まりと同じ線です。
//
//   ★聞く相手  ★「18歳未満です」と答えた方、★まだ答えていない方
//   ★聞かない  ★「18歳以上です」と答えた方。★聞き直しません
//   ★聞く場面  ★必要になったときだけ（★連携しようとしたとき、
//              ★有料の機能に進もうとしたとき）。★それ以外では聞きません
//
//   ★生年月日は、これからも取りません。★帯だけです。
//     ★名前も住所も集めていないので、生年月日を足すと識別性が上がります。
//
//   ★年齢の変更を、止めません。★記録するだけです（age_answer_changes）。
//     ★止めると、★正しく直そうとした人まで止まります。
// ============================================================================

/**
 * 帯の値。★lib/minorBilling.js の AGE_BAND と、★同じ文字列にしてあります。
 *
 *   ★2つのファイルに同じ文字列があります。★意図してそうしています。
 *     ★minorBilling は「売る形」を決める場所で、
 *     ★ageGate は「年齢をどう知るか」を決める場所です。
 *     ★★役割が違うので、読み込み合わせません（検査が1本ずつ切り離すため）。
 *   ★★片方だけ変えないこと。★検査が、食い違ったら落とします。
 */
export const AGE_BANDS = {
  UNDER_15: "under15",
  TEEN: "teen",
  ADULT: "adult",
  UNKNOWN_MINOR: "unknownMinor"
};

/** 保存してよい帯（★UNKNOWN_MINOR は保存しません。答えではありません）。 */
export const STORABLE_AGE_BANDS = [
  AGE_BANDS.UNDER_15, AGE_BANDS.TEEN, AGE_BANDS.ADULT
];

/**
 * ★いまの帯。
 *
 *   ① age_band に答えがあれば、それ
 *   ② 無くても「18歳以上です」と答えていれば ADULT
 *      ★聞き直さないためです。★2択の答えを、そのまま活かします。
 *      ★★これは移し替えではありません。★同じことを言っているだけです。
 *        ★「18歳以上」は、3帯でも ADULT の1つしかありません。
 *   ③ それ以外は ★UNKNOWN_MINOR
 *      ★「18歳未満です」と答えた方も、まだ答えていない方も、ここです。
 *      ★★15歳未満なのか15〜17歳なのかは、★分かりません。
 *      ★分からないので、★安全な側（＝売らない・つながせない）へ倒します。
 */
export function ageBandOf(profile) {
  const b = profile && profile.age_band;
  if (STORABLE_AGE_BANDS.includes(b)) return b;
  if (isAdultConfirmed(profile)) return AGE_BANDS.ADULT;
  return AGE_BANDS.UNKNOWN_MINOR;
}

/** 帯が決まっているか（★UNKNOWN_MINOR は決まっていません）。 */
export function hasAgeBand(profile) {
  return ageBandOf(profile) !== AGE_BANDS.UNKNOWN_MINOR;
}

/**
 * 3帯の問いを出すか。
 *
 *   ★出すのは、★帯が決まっていない方だけです。
 *   ★★「18歳以上です」と答えた方には、★出しません。
 *   ★★いつ出すかは、★呼ぶ側が決めます。
 *     ★連携しようとしたとき、有料の機能に進もうとしたとき。
 *     ★★ふだんの画面では出しません。★答えを迫ることになります。
 */
export function shouldAskAgeBand(profile) {
  return !hasAgeBand(profile);
}

/**
 * 3帯の答えを、保存する形にする。
 *
 *   ★is_under_18 も、そろえて書きます。
 *     ★古い判定（mayShowLuxuryFields など）が、そちらを見ているためです。
 *     ★★2つの列が食い違うことを、作らないためです。
 *   ★答えていない帯は、保存しません。
 */
export function ageBandToProfilePatch(band, now) {
  if (!STORABLE_AGE_BANDS.includes(band)) return null;
  return {
    age_band: band,
    is_under_18: band !== AGE_BANDS.ADULT,
    age_band_answered_at: now || new Date().toISOString()
  };
}

/**
 * ★未成年として扱うか（★3帯の版）。
 *
 *   ★ADULT だけが false です。
 *   ★UNKNOWN_MINOR も、★未成年として扱います。フェイルクローズ。
 */
export function isTreatedAsMinorByBand(profile) {
  return ageBandOf(profile) !== AGE_BANDS.ADULT;
}

/**
 * ★15歳未満として扱うか。
 *
 *   ★はっきり UNDER_15 と答えた方だけ true です。
 *   ★★UNKNOWN_MINOR は false を返します。
 *     ★「15歳未満だと分かっている」わけではないためです。
 *     ★★止めるかどうかは、★hasAgeBand で見てください。
 *       ★帯が分からない方は、★どのみち先へ進めません。
 */
export function isUnder15Confirmed(profile) {
  return ageBandOf(profile) === AGE_BANDS.UNDER_15;
}

