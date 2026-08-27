#!/usr/bin/env node
/**
 * 学ぶ画面の器（作業指示-学ぶ画面を勉強できるものにする.md §3・§7・§9）。
 *
 * ★器だけの段階です。記事ごとの中身は、まだ入っていません。
 *   だから「中身が無くても、これまでどおり読めること」がいちばん大事です。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

async function main() {
  const raw = readRaw("lib", "learnStudy.js");
  const m = await import("data:text/javascript;base64," + Buffer.from(raw, "utf-8").toString("base64"));
  const learn = await import("data:text/javascript;base64," +
    Buffer.from(readRaw("lib", "learnContent.js"), "utf-8").toString("base64"));

  console.log("=== §3-1 間隔をあけて、また出す ===");
  assertEqual(m.REVIEW_BOXES, [0, 1, 7, 21, 30], "読了直後 → 1日 → 7日 → 21日 → 30日ごと");
  assertEqual(m.nextBox(1, true), 2, "正解したら次の段階へ");
  assertEqual(m.nextBox(3, false), 2, "★間違えたら1つ前に戻す");
  assertEqual(m.nextBox(1, false), 1, "★最初には戻さない（積み上げを消さない）");
  assertEqual(m.nextBox(4, true), 4, "いちばん上で止まる");
  assertEqual(m.nextDueAt(2, "2026-08-27"), "2026-09-03", "box2 は7日後");
  assertEqual(m.nextDueAt(1, "2026-08-31"), "2026-09-01", "月をまたいでも正しい");

  console.log("\n=== ★1回に出すのは3問まで（§3-1） ===");
  assertEqual(m.MAX_REVIEW_QUESTIONS, 3, "上限は3問");
  const list = [
    { articleId: "a", box: 2, nextDueAt: "2026-08-20" },
    { articleId: "b", box: 1, nextDueAt: "2026-08-25" },
    { articleId: "c", box: 3, nextDueAt: "2026-08-26" },
    { articleId: "d", box: 1, nextDueAt: "2026-08-27" },
    { articleId: "e", box: 0, nextDueAt: "2026-08-01" },
    { articleId: "f", box: 2, nextDueAt: "2026-09-10" }
  ];
  const due = m.dueReviews(list, "2026-08-27");
  assertEqual(due.length, 3, "★4件たまっていても3問まで");
  assertEqual(due.map((x) => x.articleId), ["a", "b", "c"], "期限の古いものから");
  assertTrue(!due.some((x) => x.box === 0), "未読は出さない");
  assertTrue(!due.some((x) => x.articleId === "f"), "まだ期限が来ていないものは出さない");

  console.log("\n=== ★覚えるべき1文は、1記事に1つだけ・60字以内（§2-2・§9-4） ===");
  assertEqual(m.KEY_SENTENCE_MAX, 60, "上限は60字");
  assertEqual(m.validateKeySentence("あ".repeat(60)).ok, true, "60字ちょうどは通る");
  assertEqual(m.validateKeySentence("あ".repeat(61)).ok, false, "61字は通らない");
  assertEqual(m.validateKeySentence("ひとつめ。ふたつめ。").ok, false, "★2文は通らない");
  assertEqual(m.validateKeySentence("").ok, true, "未設定は通る（まだ書いていない記事があるため）");
  assertEqual(m.validateKeySentence(null).ok, true, "未設定は通る");

  console.log("\n=== ★中身が無くても、記事は読めること ===");
  console.log("     器を入れたせいで、いまの69本が読めなくなってはいけません。");
  const first = learn.ARTICLES[0];
  const r = m.studyReadiness(first);
  assertTrue(typeof r.hasKeySentence === "boolean", "備わっているかを、記事ごとに答えられる");
  assertEqual(m.studyReadiness({}).hasQuiz, false, "何も無い記事でも落ちない");
  assertEqual(m.studyReadiness(null).hasKeySentence, false, "★記事が無くても落ちない");
  assertTrue(learn.ARTICLES.length >= 60, `記事は${learn.ARTICLES.length}本のまま`);
  assertTrue(learn.ARTICLES.every((a) => (a.bodyMd || "").length > 0), "★全記事に本文がある");

  console.log("\n=== §2-1 読む前の問い（★正解をここで出さない） ===");
  console.log("     当てさせるためではなく、考えさせるための問いです。");
  const pre = m.answerPrequestion();
  assertEqual(pre.showCorrectness, false, "★○×を付けない");
  assertEqual(pre.showAnswer, false, "★正解をこの時点で出さない（本文で明らかになる）");
  assertTrue(/当てなくて構いません/.test(pre.note), "★「当てなくて構いません」を必ず添える");
  // 正誤を返す道が無いこと（あとから足せてしまう形にしない）
  assertTrue(!("correct" in pre), "★正誤そのものを返していない");
  assertEqual(m.validatePrequestion(null).ok, true, "未設定は通る（まだ書いていない記事）");
  assertEqual(m.validatePrequestion({ stem: "q", choices: ["a", "b", "c"] }).ok, true, "3択は通る");
  assertEqual(m.validatePrequestion({ stem: "q", choices: ["a", "b"] }).ok, false, "2択は通らない");
  assertEqual(m.validatePrequestion({ stem: "q", choices: ["a", "b", "c"], explanation: "x" }).ok, false,
    "★解説を付けたら通らない（正解をここで出さないため）");

  console.log("\n=== §2-4 読んだ直後の3問 ===");
  assertEqual(m.QUIZ_SOURCE_ORDER, ["keySentence", "term", "mechanism"],
    "★1問目は覚えるべき1文、2問目は用語、3問目は機序");
  assertEqual(m.QUIZ_LENGTH, 3, "3問");
  const goodQuiz = m.QUIZ_SOURCE_ORDER.map((src, i) => ({
    stem: "q" + i, choices: ["a", "b", "c"], answerIndex: 0, explanation: "理由", source: src
  }));
  assertEqual(m.validateQuizSet(goodQuiz).ok, true, "規則どおりの3問は通る");
  const wrongOrder = [goodQuiz[1], goodQuiz[0], goodQuiz[2]];
  assertEqual(m.validateQuizSet(wrongOrder).ok, false, "★出どころの順番が違うと通らない");
  const noExp = goodQuiz.map((q, i) => (i === 0 ? { ...q, explanation: "" } : q));
  assertEqual(m.validateQuizSet(noExp).ok, false, "★解説の無い問いは通らない");
  assertEqual(m.validateQuizSet(null).ok, true, "未設定は通る");

  console.log("\n=== ★間違えても、点数や励ましを出さない（§2-4・§9-5） ===");
  console.log("     励ましは、次に間違えたときの落差を作ります。");
  const wrong = m.answerQuizQuestion({ answerIndex: 1, explanation: "理由" }, 0);
  assertEqual(wrong.correct, false, "正誤そのものは分かる（次にいつ出すかを決めるため）");
  assertEqual(wrong.showAnswer, true, "★答えたらすぐ正解を出す");
  assertEqual(wrong.explanation, "理由", "★解説も一緒に出す");
  assertEqual(wrong.encouragement, null, "★励ましを返さない");
  assertEqual(wrong.score, null, "★点数を返さない");
  const right = m.answerQuizQuestion({ answerIndex: 1, explanation: "理由" }, 1);
  assertEqual(right.encouragement, null, "正解でも励ましを返さない（差をつけない）");

  console.log("\n=== §3-2 復習の見せ方 ===");
  console.log("     ★催促しない。連続日数を数えない。やらなくても何も起きない。");
  const arts = {
    a: { title: "記事A", quiz: m.QUIZ_SOURCE_ORDER.map((src, i) => ({ stem: "q" + (i + 1), choices: ["x", "y", "z"], answerIndex: i % 3, explanation: "e", source: src })) },
    b: { title: "記事B", quiz: [] },
    c: { title: "記事C", quiz: [{ stem: "c1", choices: ["x", "y", "z"], answerIndex: 0, explanation: "e", source: "keySentence" }] }
  };
  const prog = [
    { articleId: "a", box: 2, nextDueAt: "2026-08-20" },
    { articleId: "b", box: 1, nextDueAt: "2026-08-21" },
    { articleId: "c", box: 1, nextDueAt: "2026-08-22" }
  ];
  const set = m.buildReviewSet(prog, arts, "2026-08-27");
  assertTrue(set.length <= m.MAX_REVIEW_QUESTIONS, `★${set.length}問（3問まで）`);
  assertTrue(!set.some((x) => x.articleId === "b"), "★問いの無い記事は出さない（まだ書いていない記事がある）");
  assertTrue(set.every((x) => x.question && x.question.stem), "問いの中身がある");
  assertEqual(m.buildReviewSet([], arts, "2026-08-27").length, 0, "たまっていなければ0問");
  assertEqual(m.buildReviewSet(prog, {}, "2026-08-27").length, 0, "記事が無くても落ちない");

  console.log("\n=== ★答えたあとに返すのは「次にいつ出すか」だけ ===");
  const after = m.afterReviewAnswer({ box: 2 }, true, "2026-08-27");
  assertEqual(after.box, 3, "正解したら次の段階へ");
  assertEqual(after.nextDueAt, "2026-09-17", "box3 は21日後");
  assertTrue(!("score" in after) && !("streak" in after) && !("rate" in after),
    "★点数・連続日数・達成率を返していない");
  const afterWrong = m.afterReviewAnswer({ box: 2 }, false, "2026-08-27");
  assertEqual(afterWrong.box, 1, "間違えたら1つ前へ");
  assertTrue(!("encouragement" in afterWrong), "★励ましも返さない");

  console.log("\n=== ★催促する道を、そもそも作らない ===");
  assertEqual(m.shouldPromptReview(), false, "催促してよいかは、常に false");
  assertEqual(m.shouldPromptReview({ due: 99 }), false, "★何件たまっていても false");

  console.log("\n=== ★§9 禁止事項を、仕組みとして守る ===");
  assertTrue(typeof m.summarizeAttempts === "function", "集計の入口はある（が、拒否する）");
  let threw = false;
  try { m.summarizeAttempts([]); } catch (e) { threw = /集計しません/.test(e.message); }
  assertTrue(threw, "★正答率を集計しようとすると、理由つきで止まる（§6-2・§9-5）");
  assertEqual(m.REVIEW_IS_FREE, true, "★復習は無料（§9-11）");
  const code = readCode("lib", "learnStudy.js");
  assertTrue(!/highlight|ハイライト|下線/.test(code), "★蛍光ペン・下線を作っていない（§9-1）");
  assertTrue(!/要約/.test(code), "★メモの見出しを「要約」にしていない（§9-2）");
  // ★禁じている語は、禁止を宣言する文（拒否のメッセージ）にも出てきます。
  //   そこを数えると、禁止を実装している箇所そのものが不合格になります。
  //   拒否のメッセージを除いてから調べます。
  const codeNoRefusal = code.replace(/throw new Error\([\s\S]*?\);/g, "");
  assertTrue(!/streak|連続日数|正答率|点数/.test(codeNoRefusal), "★点数・連続日数を扱っていない（§9-5）");
  assertTrue(!/ranking|順位|比較/.test(code), "★比較・順位を作っていない（§9-6）");
  // ★push は problems.push() にも当たります。語の一部で判定しないこと。
  assertTrue(!/notification|通知|sendBeacon|Notification\(/i.test(codeNoRefusal),
    "★通知で催促していない（§9-7）");
  assertTrue(!/premium|課金|subscription/i.test(code), "★復習に課金の判定が無い（§9-11）");

  console.log("\n=== 日付の扱い ===");
  assertTrue(!/toISOString\(\)\.slice\(0, 10\)/.test(code.replace(/fromISO \|\| new Date\(\)\.toISOString\(\)/g, "")),
    "★日付の組み立てに toISOString を使っていない（日本時間で前日に転がる）");

  console.log("\n=== §4 メモ欄の役割を変える（廃止しない） ===");
  const tr = readRaw("lib", "translations.js");
  const ui = readRaw("components", "VocalTracker.jsx");
  assertTrue(/yourNotesTitle: \{ ja: "自分の言葉で書いてみる"/.test(tr),
    "★見出しが「自分の言葉で書いてみる」になっている");
  assertTrue(!/yourNotesTitle: \{ ja: "[^"]*要約/.test(tr), "★見出しを「要約」にしていない（§9-2）");
  assertTrue(/あとで自分が読んで分かるように/.test(tr), "説明文も自己説明の役割になっている");
  // 9言語そろっていること
  const learnKeys = ["yourNotesTitle", "yourNotesDesc", "articleNotePlaceholder", "addNoteButton"];
  learnKeys.forEach((k) => {
    const mm = tr.match(new RegExp(`${k}: \\{([^}]*)\\}`));
    assertTrue(!!mm, `${k} がある`);
    if (mm) {
      const miss = ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"].filter((l) => !new RegExp(`\\b${l}:`).test(mm[1]));
      assertEqual(miss, [], `${k} が9言語そろっている`);
    }
  });

  console.log("\n=== ★既存のメモを消していない（§9-12） ===");
  assertTrue(/handleCreateArticleNote\(article\.id, "self_explanation"/.test(ui),
    "★新しく書くものは self_explanation として保存する");
  assertTrue(!/from\("article_notes"\)\.delete\(/.test(ui), "★メモを物理削除していない");
  assertTrue(/is\("deleted_at", null\)/.test(ui), "消したメモは伏せるだけ（行は残る）");
  // 読み出しが kind で絞られていないこと（古い kind のメモも読める）
  const fetchBlock = ui.slice(ui.indexOf("async function fetchArticleNotes"), ui.indexOf("async function fetchArticleNotes") + 500);
  assertTrue(!/eq\("kind"/.test(fetchBlock), "★kind で絞っていない（前に書いたメモも読める）");
  // 新しい表を作っていないこと
  const fs2 = require("fs");
  const path2 = require("path");
  const sqls = fs2.readdirSync(path2.join(__dirname, "..", "..", "supabase")).filter((f) => f.endsWith(".sql"));
  const madeTable = sqls.some((f) => /create table[^;]*self_explanation/i.test(fs2.readFileSync(path2.join(__dirname, "..", "..", "supabase", f), "utf-8")));
  assertTrue(!madeTable, "★新しい表を作っていない（移し損ねと、書き出し・削除への足し忘れを避ける）");

  console.log("\n=== §2-2 覚えるべき1文の見せ方 ===");
  assertEqual(m.KEY_SENTENCE_HEADING, "この記事で覚えておくこと", "見出しが決まっている");
  assertEqual(m.shouldShowKeySentence({ keySentence: "乾燥は摩擦を増やす" }), true, "1文があれば出す");
  assertEqual(m.shouldShowKeySentence({}), false, "★無い記事では、枠ごと出さない（空の枠を見せない）");
  const uiRaw2 = readRaw("components", "VocalTracker.jsx");
  assertTrue(/shouldShowKeySentence\(article\)/.test(uiRaw2), "画面が、その判定を使っている");
  // ★蛍光ペンのような装飾を使わない
  const keyBlock = uiRaw2.slice(uiRaw2.indexOf("KEY_SENTENCE_HEADING}</p>") - 700, uiRaw2.indexOf("KEY_SENTENCE_HEADING}</p>") + 400);
  assertTrue(!/background:\s*C\.gold|mark>|highlight/i.test(keyBlock), "★蛍光ペンのような装飾が無い（枠で囲むだけ）");

  console.log("\n=== §2-3 自分に当てはめる問い ===");
  assertEqual(m.REFLECTION_PRIVACY_NOTE, "これはあなただけが読みます。", "本人だけが読む、と書いてある");
  assertEqual(m.validateReflectionPrompt("乾いた場所で歌ったあと、最初に気づく変化は何ですか？").ok, true, "問いの形なら通る");
  assertEqual(m.validateReflectionPrompt("あなたの場合を書いてください").ok, false, "問いの形でないと通らない");
  assertEqual(m.validateReflectionPrompt(null).ok, true, "未設定は通る");
  console.log("     ★ここに記録の数値を差し込むと、3ゲートを通っていない主張になります。");
  ["あなたの平均は{{avg}}時間ですね？", "先週は${days}日でした？", "%sleep% 時間でしたね？"].forEach((bad) => {
    assertEqual(m.validateReflectionPrompt(bad).ok, false, `★数値の差し込みを弾く: ${bad.slice(0, 12)}…`);
  });
  assertTrue(/studyReadiness\(article\)\.hasReflection/.test(uiRaw2), "★問いが無い記事では、欄ごと出さない");
  assertTrue(/REFLECTION_PRIVACY_NOTE/.test(uiRaw2), "画面に「あなただけが読みます」を出している");
  // 自分に当てはめた答えも、メモと同じ表に残す（別の表を作らない）
  assertTrue(/handleCreateArticleNote\(article\.id, "reflection"/.test(uiRaw2),
    "★答えは article_notes に kind: reflection として残す（新しい表を作らない）");

  console.log("\n=== 正解の位置をばらけさせる ===");
  console.log("     原稿は正解をつねに先頭に書き、出す直前にここで回します。");
  {
    const q = { source: "term", stem: "問い", choices: ["正解", "はずれA", "はずれB"], answerIndex: 0, explanation: "解説" };
    const a = m.spreadAnswerPosition("C1-1", 0, q);
    const b = m.spreadAnswerPosition("C1-1", 0, q);
    assertEqual(a, b, "同じ記事・同じ問番号なら、いつ開いても同じ並びになる");
    console.log("     ★乱数にしないのは、復習で同じ問題に戻ったとき並びが変わると覚え直しの手がかりが消えるためです。");
    assertEqual(a.choices[a.answerIndex], "正解", "回しても、正解の中身は変わらない");
    assertEqual([...a.choices].sort(), [...q.choices].sort(), "選択肢が増えも減りもしない");
    assertEqual(q.answerIndex, 0, "★原稿そのものは書き換えない（純関数）");
    assertEqual(m.spreadAnswerPosition("C1-1", 0, { stem: "正解が決まっていない問い", choices: ["あ", "い"] }).choices,
      ["あ", "い"], "正解が決まっていない問いは、触らない");
    assertEqual(m.spreadQuizAnswers("C1-1", null), null, "3問がまだ無い記事でも落ちない");
  }
  {
    // ★偏りが実際に解けているか。1記事ぶんでは分からないので、まとめて見る。
    const ids = learn.ARTICLES.map((a) => a.id);
    const sample = { source: "keySentence", stem: "問い", choices: ["正解", "はずれA", "はずれB"], answerIndex: 0, explanation: "解説" };
    const pos = [0, 0, 0];
    ids.forEach((id) => [0, 1, 2].forEach((i) => { pos[m.spreadAnswerPosition(id, i, sample).answerIndex] += 1; }));
    const total = pos.reduce((x, y) => x + y, 0);
    assertTrue(pos.every((n) => n > total / 6),
      `★正解がどの位置にも散っている（1番目:${pos[0]} 2番目:${pos[1]} 3番目:${pos[2]}）`);
    console.log("     いつも1番目だと、中身ではなく位置を覚えてしまいます。");
  }

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
