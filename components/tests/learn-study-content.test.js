#!/usr/bin/env node
/**
 * 記事の勉強パーツ（docs/learn-content/study.json）の検査。
 *
 * ★器（lib/learnStudy.js）ではなく、中身のほうを見ます。
 *   validate* を通ることに加えて、原稿づくりで実際にやった失敗を検査します。
 *     ・正解がいつも選択肢の先頭になっていた（位置を覚えてしまう）
 *     ・「覚えるべき1文」の使い回し
 *     ・本文に無い割合・効果量・出典の混入
 *
 *   ★数値の検査は、記事本文と突き合わせます。本文にある言い回しは引用であって
 *     捏造ではありません。「2回公演の日は、単純に2倍と考えるより」で
 *     一度落ちました。禁じているのは、根拠の無い数字のほうです。
 */
const fs = require("fs");
const path = require("path");
const { readRaw } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) {
  if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; }
}

async function main() {
  const S = await import("data:text/javascript;base64," +
    Buffer.from(readRaw("lib", "learnStudy.js"), "utf-8").toString("base64"));
  const L = await import("data:text/javascript;base64," +
    Buffer.from(readRaw("lib", "learnContent.js"), "utf-8").toString("base64"));

  const jsonPath = path.join(__dirname, "..", "..", "docs", "learn-content", "study.json");
  if (!fs.existsSync(jsonPath)) {
    console.log("  ・study.json がまだありません。中身の検査は飛ばします。");
    console.log("\n合計: 0件成功 / 0件失敗");
    return;
  }
  const parsed = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
  const data = parsed.articles || {};
  const skipped = parsed.skipped || {};
  const shobaiPath = path.join(__dirname, "..", "..", "docs", "learn-content", "shobai.json");
  const shobai = fs.existsSync(shobaiPath)
    ? (JSON.parse(fs.readFileSync(shobaiPath, "utf-8")).articles || []) : [];
  const shobaiIds = new Set(shobai.map((a) => a.id));
  const byId = Object.fromEntries(L.ARTICLES.map((a) => [a.id, a]));

  console.log(`\n=== 勉強パーツの検査（${Object.keys(data).length}記事）===`);

  const problems = [];
  const seenKeySentence = new Map();
  const answerPos = [0, 0, 0, 0];

  for (const [id, a] of Object.entries(data)) {
    const p = [];
    if (!byId[id]) p.push("記事IDが lib/learnContent.js に無い");
    p.push(...S.validateKeySentence(a.keySentence).problems);
    p.push(...S.validatePrequestion(a.prequestion).problems);
    p.push(...S.validateQuizSet(a.quiz).problems);
    p.push(...S.validateReflectionPrompt(a.reflectionPrompt).problems);

    // ★読む前の問いに正解を持たせない。隠すのではなく、持たない（§2-1）。
    if (a.prequestion && a.prequestion.answerIndex !== undefined) {
      p.push("★読む前の問いに answerIndex を置かない");
    }

    // ★原稿では正解をつねに先頭に書く。ばらけさせるのは出す直前（spreadQuizAnswers）。
    (a.quiz || []).forEach((q, i) => {
      if (q.answerIndex !== 0) p.push(`${i + 1}問目: 原稿では正解を先頭に書く`);
    });
    S.spreadQuizAnswers(id, a.quiz || []).forEach((q) => { answerPos[q.answerIndex] += 1; });

    // ★覚えるべき1文の使い回し
    if (a.keySentence) {
      if (seenKeySentence.has(a.keySentence)) p.push(`1文が ${seenKeySentence.get(a.keySentence)} と同じ`);
      else seenKeySentence.set(a.keySentence, id);
    }

    // ★本文に無い割合・効果量・出典
    const body = byId[id] ? byId[id].bodyMd : "";
    const all = [a.keySentence, a.reflectionPrompt,
      ...(a.quiz || []).flatMap((q) => [q.stem, q.explanation, ...(q.choices || [])])].join("　");
    (all.match(/\d+(\.\d+)?\s*(%|％)/g) || []).forEach((m) => {
      if (!body.includes(m)) p.push(`本文に無い割合: ${m}`);
    });
    (all.match(/\d+\s*(倍|人に1人)/g) || []).forEach((m) => {
      if (!body.includes(m)) p.push(`本文に無い効果量: ${m}`);
    });
    if (/(研究|論文|調査)によ|報告されています|エビデンス|有意差/.test(all)) {
      p.push("出典らしき言い回し");
    }

    // ★他人と比べるという考えを、否定する形でも文章に出さない。
    //   このアプリは他人との比較を「作らない」だけでなく「言わない」。
    //   選択肢の1つとして置くだけでも、その考えを持ち込むことになる。
    //   同じ思い違いは、時間軸のはずれ（昨日1日だけ、など）で試せる。
    //   C3-2 の「同じ職業の利用者全体」、C3-8 の「他の人の点数と比べる」で
    //   実際にやってしまい、坂本さんに指摘された。
    const CROSS_USER = /利用者全体|他の人の点数|他人と比べ|他の人と比べ|同じ職業の利用者|みんなの平均|平均的な利用者|ランキング|順位表/;
    if (CROSS_USER.test(all)) p.push("★他人と比べる言い回し（はずれの選択肢でも置かない）");

    if (p.length) problems.push(`${id}: ${p.join(" / ")}`);
  }

  assertTrue(problems.length === 0,
    problems.length === 0 ? "すべての記事が validate* と原稿の決まりを通る" : `問題あり\n     ${problems.join("\n     ")}`);

  // ★69本すべてが、どちらかに入っていること。
  //   「勉強パーツが無い」には二通りある。決めて置かなかったのと、忘れたの。
  //   区別できないと、決めたほうをあとから「抜けている」と思って埋めてしまう。
  {
    // ★原稿は2つある。study.json（69本）と shobai.json（音楽家の商い14本）。
    //   商いの記事は原稿そのものが勉強パーツを持っているので、
    //   study.json を見に行かない。ここで数えると、毎回14本欠けて見える。
    const covered = new Set(Object.keys(data).concat(Object.keys(skipped)));
    const missing = L.ARTICLES.map((a) => a.id)
      .filter((id) => !shobaiIds.has(id))
      .filter((id) => !covered.has(id));
    assertTrue(missing.length === 0,
      missing.length === 0
        ? `★69本すべてに答えが出ている（作った ${Object.keys(data).length} / 置かないと決めた ${Object.keys(skipped).length}）`
        : `★どちらにも入っていない記事: ${missing.join(", ")}`);
    const noReason = Object.entries(skipped).filter(([, why]) => !why || String(why).length < 20);
    assertTrue(noReason.length === 0,
      noReason.length === 0
        ? "置かないと決めた記事には、理由が書いてある"
        : `★理由が書かれていない: ${noReason.map(([id]) => id).join(", ")}`);
    Object.keys(skipped).forEach((id) => {
      assertTrue(!data[id], `★${id} は置かないと決めた記事。両方に入れない`);
    });
  }

  // ★原稿とアプリのつながり。合流を止めても、原稿の検査だけは通ってしまう。
  //   「原稿は正しいのに、画面には何も出ていない」を拾えるようにする。
  {
    const inApp = L.ARTICLES.filter((a) => a.keySentence && !shobaiIds.has(a.id)).length;
    const inManuscript = Object.keys(data).filter((id) => data[id].keySentence).length;
    assertTrue(inApp === inManuscript,
      `★原稿の勉強パーツが、そのままアプリにも入っている（原稿 ${inManuscript} / アプリ ${inApp}）`);

    // 回したあとも、正解の中身が変わっていないこと
    let moved = 0, withAnswer = 0;
    L.ARTICLES.forEach((a) => {
      const src2 = data[a.id];
      if (!src2 || !src2.quiz || !a.quiz) return;
      a.quiz.forEach((q, i) => {
        withAnswer += 1;
        const o = src2.quiz[i];
        if (q.choices[q.answerIndex] !== o.choices[o.answerIndex]) moved += 1;
      });
    });
    assertTrue(moved === 0, `★出すときに回しても、正解の中身は変わらない（${withAnswer}問）`);

    // ★読む前の問いに正解を持たせない。合流のときに足してしまわないこと。
    const leaked = L.ARTICLES.filter((a) => a.prequestion && a.prequestion.answerIndex !== undefined);
    assertTrue(leaked.length === 0,
      leaked.length === 0 ? "★アプリ側の読む前の問いにも、正解が入っていない"
        : `★読む前の問いに正解が入った: ${leaked.map((a) => a.id).join(", ")}`);
  }

  console.log("\n=== 音楽家の商い（記述式・14本）===");
  {
    assertTrue(shobai.length === 14, `原稿が14本ある（いま${shobai.length}本）`);
    const inApp = L.ARTICLES.filter((a) => shobaiIds.has(a.id));
    assertTrue(inApp.length === shobai.length,
      `★原稿がそのままアプリにも入っている（原稿 ${shobai.length} / アプリ ${inApp.length}）`);

    console.log("     ★正解が土地と状況で変わる記事。選択式を出さない（§7 受け入れ条件）。");
    const withQuiz = inApp.filter((a) => a.quiz && a.quiz.length);
    assertTrue(withQuiz.length === 0,
      withQuiz.length === 0 ? "★選択式の設問が1つも入っていない"
        : `★選択式が入った: ${withQuiz.map((a) => a.id).join(", ")}`);
    const notReflect = inApp.filter((a) => S.quizModeOf(a) !== "reflect");
    assertTrue(notReflect.length === 0,
      notReflect.length === 0 ? "14本とも quizMode が reflect"
        : `★reflect になっていない: ${notReflect.map((a) => a.id).join(", ")}`);
    const wrongCount = inApp.filter((a) => (a.prompts || []).length !== S.REFLECT_PROMPT_COUNT);
    assertTrue(wrongCount.length === 0,
      wrongCount.length === 0 ? `記述の問いが、どれも${S.REFLECT_PROMPT_COUNT}つある`
        : `★数が違う: ${wrongCount.map((a) => `${a.id}(${(a.prompts || []).length})`).join(", ")}`);

    console.log("     ★有料の記事。課金の線が引かれるまで、一覧にも本文にも出さない。");
    const F = require("fs").readFileSync(
      path.join(__dirname, "..", "..", "lib", "featureFlags.js"), "utf-8");
    assertTrue(/export function canSeeShobaiArticles/.test(F),
      "見せる相手の判定が lib/featureFlags.js にある");
    const uiCode = require("./_source").stripComments(
      require("./_source").readRaw("components", "VocalTracker.jsx"));
    assertTrue(/canSeeShobaiArticles\(profile\)/.test(uiCode), "画面がその判定を使っている");
    assertTrue(/ARTICLES\.filter\(visibleArticle\)/.test(uiCode), "★検索からも外している");
    assertTrue(/if \(!visibleArticle\(article\)\) return null;/.test(uiCode),
      "★本文の側でも止めている（入口が1つだと思い込まない）");
    assertTrue(!/\[1, 2, 3, 4, 5, 6, 7\]\.map\(\(chapter\)/.test(uiCode),
      "章の一覧を数字べた書きにしていない（8・9が漏れる形にしない）");
  }

  const total = answerPos.reduce((x, y) => x + y, 0);
  if (total > 0) {
    assertTrue(answerPos.slice(0, 3).every((n) => n > total / 6),
      `★出すときの正解が、どの位置にも散っている（1番目:${answerPos[0]} 2番目:${answerPos[1]} 3番目:${answerPos[2]}）`);
  }

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
