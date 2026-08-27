// ============================================================================
// 学ぶ画面を「勉強できるもの」にするための器
// （作業指示-学ぶ画面を勉強できるものにする.md §3・§7・§9）
//
// ★この文書でいちばん反直感的なのは、次の2つです。
//   ・ハイライトとメモ（要約）は、効果が低い
//   ・読む前に、答えを知らないまま問いに答えさせると、記憶が伸びる
//
// ★ここは器だけです。記事ごとの中身（覚えるべき1文・問い・3問）は、
//   器ができてから1本ずつ足します（§10）。
//   ★中身が無い記事でも、これまでどおり読めること。器を入れたせいで
//     既存の69本が読めなくなる、ということが無いようにします。
// ============================================================================

// §3-1 間隔をあけて、また出す。
//   読了直後 → 1日後 → 7日後 → 21日後 → 以後は30日ごと
export const REVIEW_BOXES = [0, 1, 7, 21, 30];   // box 0 は未読
export const MAX_REVIEW_QUESTIONS = 3;           // 1回に出すのは全記事あわせて3問まで

/**
 * 次にこの記事を出す日。
 * ★正解したら次の段階へ、間違えたら1つ前へ戻す（最初には戻さない）。
 */
export function nextBox(box, correct) {
  const current = Math.max(0, Math.min(REVIEW_BOXES.length - 1, Number(box) || 0));
  if (correct) return Math.min(REVIEW_BOXES.length - 1, current + 1);
  return Math.max(1, current - 1);   // ★1より下に戻さない。積み上げを消さない
}

export function nextDueAt(box, fromISO) {
  const days = REVIEW_BOXES[Math.max(0, Math.min(REVIEW_BOXES.length - 1, Number(box) || 0))];
  const d = new Date((fromISO || new Date().toISOString()).slice(0, 10) + "T00:00:00");
  d.setDate(d.getDate() + days);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, "0");
  const da = String(d.getDate()).padStart(2, "0");
  return `${y}-${mo}-${da}`;   // ★toISOString() を使わない（日本時間で前日に転がる）
}

/**
 * いま出すべき問いを選ぶ。
 * ★出す場所は「学ぶ」の中だけ。ホームや通知に出さないこと（§9-7）。
 * ★1回に3問まで。期限の古いものから。
 */
export function dueReviews(progressList, todayISO, limit = MAX_REVIEW_QUESTIONS) {
  return (progressList || [])
    .filter((p) => p && p.box > 0 && p.nextDueAt && p.nextDueAt <= todayISO)
    .sort((a, b) => String(a.nextDueAt).localeCompare(String(b.nextDueAt)))
    .slice(0, Math.max(0, limit));
}

// ---------------------------------------------------------------------------
// §7 記事に後付けする項目。★無くても記事は読める。
// ---------------------------------------------------------------------------
export const KEY_SENTENCE_MAX = 60;   // §2-2 覚えるべき1文は60字以内

/** 記事が、勉強の形をどこまで備えているか。★足りなくても読めることが前提。 */
export function studyReadiness(article) {
  const a = article || {};
  return {
    hasKeySentence: typeof a.keySentence === "string" && a.keySentence.length > 0,
    hasTerms: Array.isArray(a.terms) && a.terms.length > 0,
    hasPrequestion: !!(a.prequestion && a.prequestion.stem),
    hasQuiz: Array.isArray(a.quiz) && a.quiz.length > 0,
    hasReflection: typeof a.reflectionPrompt === "string" && a.reflectionPrompt.length > 0
  };
}

/** ★1記事に「覚えるべき1文」を2つ置かない（§9-4）。長さの上限も見る。 */
export function validateKeySentence(text) {
  if (text == null || text === "") return { ok: true, problems: [] };   // 未設定は可
  const problems = [];
  if (typeof text !== "string") return { ok: false, problems: ["文字列にしてください"] };
  if (text.length > KEY_SENTENCE_MAX) problems.push(`${KEY_SENTENCE_MAX}字以内にしてください（いま${text.length}字）`);
  // 2文に分かれていたら、それは1文ではない
  const sentences = text.split(/[。\n]/).map((x) => x.trim()).filter(Boolean);
  if (sentences.length > 1) problems.push("★覚えるべき1文は、1記事に1つだけです");
  return { ok: problems.length === 0, problems };
}

// ---------------------------------------------------------------------------
// §2-1 読む前の問い（いちばん効く）
//
//   問いを出した部分だけ記憶が伸びます（問われた内容 g=.66／問われなかった g=.01）。
//   ★だから「覚えてほしいことを、そのまま問いにする」。
//
//   ★この時点で正解を出さないこと。○×も付けないこと。
//     当てさせるためではなく、考えさせるための問いです。
//     正解は本文の中で明らかになります。
// ---------------------------------------------------------------------------
export const PREQUESTION_NOTE = "当てなくて構いません。考えることに意味があります。";

/**
 * 読む前の問いに答えたあと、画面に返すもの。
 * ★正誤を返しません。返せるようにもしません。
 */
export function answerPrequestion() {
  return { showCorrectness: false, showAnswer: false, note: PREQUESTION_NOTE };
}

/** 読む前の問いが、規則どおりか。 */
export function validatePrequestion(q) {
  if (q == null) return { ok: true, problems: [] };   // 未設定は可（まだ書いていない記事）
  const problems = [];
  if (!q.stem) problems.push("問いの文がありません");
  const choices = q.choices || [];
  if (choices.length < 3 || choices.length > 4) problems.push("選択肢は3〜4つにしてください");
  // ★この時点では正解を出さないので、解説を持たせないこと（出す場所が無い）
  if (q.explanation) problems.push("★読む前の問いに解説を付けないでください（正解をここで出さない）");
  return { ok: problems.length === 0, problems };
}

// ---------------------------------------------------------------------------
// §2-4 読んだ直後の3問
//
//   ★1問目は「覚えるべき1文」から、2問目は用語、3問目は機序。
//   ★答えたらすぐ正解と、1〜2行の解説を出す。
//   ★間違えても、点数や励ましを出さない。正解と理由だけ。
//     励ましは、次に間違えたときの落差を作ります。
// ---------------------------------------------------------------------------
export const QUIZ_SOURCE_ORDER = ["keySentence", "term", "mechanism"];
export const QUIZ_LENGTH = 3;

export function validateQuizSet(quiz) {
  if (quiz == null || quiz.length === 0) return { ok: true, problems: [] };   // 未設定は可
  const problems = [];
  if (quiz.length !== QUIZ_LENGTH) problems.push(`3問にしてください（いま${quiz.length}問）`);
  quiz.forEach((q, i) => {
    const choices = (q && q.choices) || [];
    if (choices.length < 3 || choices.length > 4) problems.push(`${i + 1}問目: 選択肢は3〜4つ`);
    if (!q || typeof q.answerIndex !== "number") problems.push(`${i + 1}問目: 正解が決まっていません`);
    if (!q || !q.explanation) problems.push(`${i + 1}問目: ★解説（1〜2行）が要ります`);
    const want = QUIZ_SOURCE_ORDER[i];
    if (want && q && q.source !== want) problems.push(`${i + 1}問目は ${want} から出してください（いま ${q.source || "未設定"}）`);
  });
  return { ok: problems.length === 0, problems };
}

/**
 * 直後の3問に答えたあと、画面に返すもの。
 * ★正解と解説だけ。点数も励ましも返しません。
 */
export function answerQuizQuestion(question, chosenIndex) {
  const correct = !!question && chosenIndex === question.answerIndex;
  return {
    correct,                       // 次にいつ出すか（box）を決めるためだけに使う
    showAnswer: true,
    answerIndex: question ? question.answerIndex : null,
    explanation: question ? question.explanation : "",
    // ★点数・励まし・連続日数は返しません（§2-4・§9-5）。
    //   間違えた人に「おしい」と言うのは、次に間違えたときの落差を作ります。
    encouragement: null,
    score: null
  };
}

// ---------------------------------------------------------------------------
// §3-2 復習の見せ方
//
//   ★「復習しましょう」と催促しないこと。開いたときに出るだけ。
//   ★連続日数を数えないこと。やらなくても、何も起きないこと。
//     記録の催促をしない方針と同じです。
//     勉強もまた、罪悪感で続くものではありません。
// ---------------------------------------------------------------------------

/**
 * 復習として出す問いを組み立てる。
 * ★出す場所は「学ぶ」の中だけ。ホームや通知には渡しません。
 *
 * @param progressList article_progress の行
 * @param articlesById 記事（quiz を持っているものだけが対象になる）
 */
export function buildReviewSet(progressList, articlesById, todayISO, limit = MAX_REVIEW_QUESTIONS) {
  const due = dueReviews(progressList, todayISO, limit * 3);   // 多めに拾ってから絞る
  const out = [];
  for (const p of due) {
    const article = articlesById && articlesById[p.articleId];
    const quiz = (article && article.quiz) || [];
    if (quiz.length === 0) continue;          // ★問いが無い記事は、まだ出さない
    // その記事から1問だけ。同じ記事で3問続けて出さない（間隔の意味が薄れる）
    const q = quiz[(Number(p.box) || 1) % quiz.length];
    out.push({ articleId: p.articleId, articleTitle: article.title, question: q, box: p.box });
    if (out.length >= limit) break;
  }
  return out;
}

/**
 * 復習を1問終えたあとの、次の予定。
 * ★ここで返すのは「次にいつ出すか」だけです。
 *   点数も、連続日数も、達成率も返しません。
 */
export function afterReviewAnswer(progress, correct, todayISO) {
  const box = nextBox(progress && progress.box, correct);
  return {
    box,
    nextDueAt: nextDueAt(box, todayISO),
    lastAnsweredAt: new Date().toISOString()
  };
}

/**
 * 復習の催促を出してよいか。★常に false。
 *   「やっていない人に知らせる」経路を、そもそも作らないための関数です。
 */
export function shouldPromptReview() {
  return false;
}

// ---------------------------------------------------------------------------
// §6-2・§9 クイズを判定に使わない
//
//   ★正答率・点数・連続日数を表示しないこと。
//   ★他人との比較・ランキングを作らないこと。
//   記録した行為に反応し、記録の中身で人を並べない、という
//   このアプリ全体の原則（羊のおうち仕様 §1）と同じ線です。
// ---------------------------------------------------------------------------
export function summarizeAttempts() {
  throw new Error(
    "クイズの正答率は集計しません（学ぶ画面を勉強できるものにする.md §6-2・§9-5）。" +
    "点数で人を並べないための線です。集計が要る場面が出たら、まず坂本さんに相談してください。"
  );
}

/** 復習は無料（§9-11）。ここで課金の判定をしないこと。 */
export const REVIEW_IS_FREE = true;
