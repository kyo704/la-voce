// ============================================================================
// かんたん表示の「1画面に1つ」（見やすさとかんたん表示.md §3-3）
//
// ★1画面に1つだけ聞き、「つぎへ」で進みます。残り何問かを必ず出します。
//
// ★「とばす」を必ず置くこと。
//   答えられない項目で止まると、その日の記録が丸ごと消えます。
//   とばした項目は「未入力」ではありません。答えなかっただけです。
//   ★「未入力」「不足」「完了度◯%」を出さないこと（統合実行ルート v4 §11）。
//   かんたん記録は劣った記録ではなく、悪い日でも開ける道です。
//
// ★書き込む先は、ふつうの記録とまったく同じ項目です。
//   別の保存先を作ると、分析から見えない記録ができます。
//   粗いのは選択肢の刻みだけで、記録される場所は変わりません。
// ============================================================================

/**
 * 手順。★ここが唯一の定義です。画面に順番を書かないこと。
 *
 * value は、ふつうの記録と同じ尺度に合わせてあります
 * （喉・声・心の余裕は1〜5、睡眠は時間）。
 * ★粗い選択肢を、細かい尺度の真ん中あたりへ置いています。
 *   端（1や5）に寄せると、あとで平均が引っぱられます。
 */
export const SIMPLE_STEPS = [
  {
    key: "throatCondition",
    question: "いまの喉は、どんな感じですか",
    choices: [
      { label: "良い", value: 4 },
      { label: "ふつう", value: 3 },
      { label: "よくない", value: 2 }
    ]
  },
  {
    key: "sleepQuality",
    question: "昨日は、よく眠れましたか",
    choices: [
      { label: "よく眠れた", value: 4 },
      { label: "ふつう", value: 3 },
      { label: "あまり眠れなかった", value: 2 }
    ]
  },
  {
    key: "sleepHours",
    question: "何時間くらい眠りましたか",
    choices: [
      { label: "5時間より少ない", value: 4.5 },
      { label: "5〜7時間", value: 6 },
      { label: "7時間より多い", value: 8 }
    ]
  },
  {
    key: "ease",
    question: "今日の心の余裕は、どうですか",
    choices: [
      { label: "余裕がある", value: 4 },
      { label: "ふつう", value: 3 },
      { label: "余裕がない", value: 2 }
    ]
  }
];

export const SIMPLE_STEP_COUNT = SIMPLE_STEPS.length;

/** 残り何問か。★「あと◯つ」と出すために使います。 */
export function remainingSteps(index) {
  const i = Math.max(0, Math.min(SIMPLE_STEP_COUNT, Number(index) || 0));
  return Math.max(0, SIMPLE_STEP_COUNT - i);
}

/** その手順を、いまの記録に当てはめた結果 */
export function applyStep(entry, stepKey, value) {
  return { ...(entry || {}), [stepKey]: value };
}

/**
 * ★とばした項目には、何も書きません。
 *   0 や既定値を入れると、「答えなかった」が「そう答えた」に化けます。
 *   このセッションで、既定値を答えとして数える不具合を実際に直しています。
 */
export function skipStep(entry) {
  return { ...(entry || {}) };
}

/** ★とばした数を数えない。数えると、いつか画面に出ます。 */
export function countSkipped() {
  throw new Error(
    "とばした数は数えません（見やすさとかんたん表示.md §3-3・統合実行ルート v4 §11）。" +
    "「未入力」「不足」「完了度」を出さないための線です。"
  );
}

/** 進む・もどる。★最初より前、最後より後へは行かない。 */
export function nextIndex(index) {
  return Math.min(SIMPLE_STEP_COUNT, (Number(index) || 0) + 1);
}
export function prevIndex(index) {
  return Math.max(0, (Number(index) || 0) - 1);
}
export function isFinished(index) {
  return (Number(index) || 0) >= SIMPLE_STEP_COUNT;
}

/** 画面に出す固定の文言。★催促にしないこと。 */
export const SIMPLE_SKIP_LABEL = "とばす";
export const SIMPLE_BACK_LABEL = "もどる";
export const SIMPLE_DONE_TEXT = "ここまでで保存できます。あとから足せます。";
