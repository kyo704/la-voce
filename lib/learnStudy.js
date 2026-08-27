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
