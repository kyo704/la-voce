#!/usr/bin/env node
/**
 * docs/learn-content/articles.json（67本）を、アプリが読む形へ変換する。
 *
 * ★既存の10本を失わないこと。
 *   67本のうち8本は「既存記事を移動・統合する」という指示であって、本文を
 *   持っていません（10〜242字の覚え書き）。そこへ articles.json の body を
 *   そのまま入れると、記事が覚え書きに置き換わって中身が消えます。
 *   本文のある59本だけを取り込み、残りは既存の本文に結び付けます。
 *
 * ★結び付けられないものは、消さずに残して報告します。
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const src = JSON.parse(fs.readFileSync(path.join(ROOT, "docs/learn-content/articles.json"), "utf-8"));
const liveSrc = fs.readFileSync(path.join(ROOT, "lib/learnContent.js"), "utf-8");

// いまアプリに入っている記事を、そのまま読み出す（本文を守るため）
const liveMod = require("module")._load
  ? null : null;
const live = (() => {
  const start = liveSrc.indexOf("export const ARTICLES");
  const body = liveSrc.slice(liveSrc.indexOf("[", start));
  // eslint-disable-next-line no-new-func
  return new Function(`return ${body.slice(0, body.lastIndexOf("];") + 1)}`)();
})();
const liveByTitle = new Map(live.map((a) => [a.title, a]));

// 職業キーの対応（docs 側 → アプリ側）
const PROF = {
  "classical-musical": "singer",
  "announcer": "announcer",
  "voice-actor": "voice_actor",
  "pops-rock": "pop_musical"
};
const mapProfessions = (list) =>
  (list || []).includes("*") ? "all" : (list || []).map((p) => PROF[p]).filter(Boolean);

const HAS_PROSE = new Set(["new", "new_replacement"]);
const readMinutes = (text) => Math.max(1, Math.round((text || "").length / 400));

const out = [];
const unresolved = [];
const orderByChapter = {};

// ★実装者あての注記を、記事の本文として出さない。
//
//   原稿の一部は「※ここは実装者向け」で始まり、区切り線（---）のあとに
//   本文が続く形で書かれている。取り込みでそこを落としていなかったため、
//   利用者が記事を開くと、最初の段落が作業指示になっていた。
//     C4-8「※新規記事。既存の…を削除し、これに置き換えてください」
//     C6-4「※執筆・掲載にあたっての注意（実装者向け）」
//     C7-1「※実装メモ: 1記事にまとめ…」
//
//   ★条件を二つとも満たすときだけ切る。※で始まり、かつ区切り線があること。
//     区切り線だけを頼りにすると、本文中で区切りを使う記事を壊す。
//     いまは3記事だけが該当し、3記事とも※で始まる（確認済み）。
function stripImplementerNote(body) {
  const text = String(body || "");
  if (!/^\s*※/.test(text)) return text;
  const m = text.match(/^\s*-{3,}\s*$/m);
  if (!m) return text;
  return text.slice(m.index + m[0].length).replace(/^\s+/, "");
}

src.articles.forEach((a) => {
  orderByChapter[a.chapter] = (orderByChapter[a.chapter] || 0) + 1;
  const order = orderByChapter[a.chapter];
  const professions = mapProfessions(a.professions);

  if (HAS_PROSE.has(a.status)) {
    out.push({
      id: a.id, professions, chapter: a.chapter, order,
      title: a.title, lead: a.summary || "", bodyMd: stripImplementerNote(a.body),
      readMinutes: readMinutes(stripImplementerNote(a.body)), terms: [], sources: []
    });
    return;
  }
  // 本文を持たない指示。既存の本文に結び付ける。
  const existing = liveByTitle.get(a.title);
  if (existing) {
    out.push({
      ...existing, id: a.id, professions, chapter: a.chapter, order,
      title: a.title, lead: a.summary || existing.lead
    });
    return;
  }
  unresolved.push(a);
});

// 結び付かなかった既存記事は、消さずに残す（本文を失わないため）
const usedTitles = new Set(out.map((a) => a.title));
const kept = live.filter((a) => !usedTitles.has(a.title));
kept.forEach((a) => out.push(a));

out.sort((x, y) => x.chapter - y.chapter || (x.order || 99) - (y.order || 99));

console.log("取り込んだ記事      :", out.length, "本");
console.log("  本文のある新規    :", src.articles.filter((a) => HAS_PROSE.has(a.status)).length);
console.log("  既存に結び付けた  :", src.articles.filter((a) => !HAS_PROSE.has(a.status) && liveByTitle.has(a.title)).length);
console.log("  そのまま残した既存:", kept.length);
console.log("★結び付かなかった指示:", unresolved.length, "本");
unresolved.forEach((a) => console.log("   ", a.id, a.title, "／", a.status));

// ---- 勉強パーツ（docs/learn-content/study.json）を合流させる ----
//
//   ★原稿は正解をつねに選択肢の先頭に書いてある。人が読んで確かめやすいため。
//     そのまま出すと「いつも1番目」を覚えてしまうので、ここで回してから埋め込む。
//     回すのは lib/learnStudy.js の spreadQuizAnswers。記事IDと問番号から
//     決まるので、同じ問題はいつ開いても同じ並びになる。
//
//   ★勉強パーツを持たない記事があってよい（用語集など、形が合わないもの）。
//     studyReadiness が未設定を扱えるので、枠ごと出ない。
(async () => {
  const url = require("url");
  const studyPath = path.join(ROOT, "docs/learn-content/study.json");
  let study = { articles: {}, skipped: {} };
  if (fs.existsSync(studyPath)) study = JSON.parse(fs.readFileSync(studyPath, "utf-8"));
  const S = await import(url.pathToFileURL(path.join(ROOT, "lib/learnStudy.js")).href);

  // ★音楽家の商い（shobai-01〜14）を合流させる。
  //   原稿は docs/音楽家の商い-第1章.md / 第2章.md、
  //   切り出しは scripts/build-shobai-content.js が docs/learn-content/shobai.json へ。
  //   ★選択式の3問は作らない（quizMode: "reflect"）。正解が土地と状況で変わる。
  //   ★見せる相手は lib/featureFlags.js の canSeeShobaiArticles が決める。
  //     ここでは全部入れておき、画面側で絞る。
  const shobaiPath = path.join(ROOT, "docs/learn-content/shobai.json");
  if (fs.existsSync(shobaiPath)) {
    const shobai = JSON.parse(fs.readFileSync(shobaiPath, "utf-8")).articles || [];
    const already = new Set(out.map((a) => a.id));
    let added = 0;
    shobai.forEach((a) => {
      if (already.has(a.id)) return;
      out.push(a);
      added += 1;
    });
    console.log("音楽家の商い      :", added, "本（quizMode: reflect）");
  }

  let withStudy = 0;
  out.forEach((a) => {
    const s = (study.articles || {})[a.id];
    if (!s) return;
    withStudy += 1;
    a.keySentence = s.keySentence || null;
    a.prequestion = s.prequestion || null;
    a.quiz = S.spreadQuizAnswers(a.id, s.quiz || []);
    a.reflectionPrompt = s.reflectionPrompt || null;
    // ★問いの形（recall / reflect）。書いていなければ recall。
    if (s.quizMode) a.quizMode = s.quizMode;
  });

  const skipped = Object.keys(study.skipped || {});
  console.log("勉強パーツを入れた  :", withStudy, "本");
  console.log("  ★置かないと決めた:", skipped.length, "本", skipped.length ? `（${skipped.join(", ")}）` : "");
  // ★音楽家の商いは、原稿そのものが勉強パーツを持っている（shobai.json）。
  //   study.json を見に行かないので、ここでは数えない。
  const missing = out.filter((a) => !a.quizMode
    && !(study.articles || {})[a.id] && !(study.skipped || {})[a.id]);
  if (missing.length) console.log("  ★どちらにも無い   :", missing.map((a) => a.id).join(", "));

  // ---- ファイルを書き出す ----
  const esc = (t) => String(t == null ? "" : t).replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
  const q = (t) => JSON.stringify(String(t == null ? "" : t));

  const header = liveSrc.slice(0, liveSrc.indexOf("export const ARTICLES"));
  const footer = liveSrc.slice(liveSrc.indexOf("export function getArticlesForProfession"));

  // 勉強パーツを持つ記事にだけ、そのぶんの行を足す（持たない記事に空欄を作らない）
  const studyFields = (a) => {
    const parts = [];
    if (a.keySentence) parts.push(`    keySentence: ${q(a.keySentence)}`);
    if (a.prequestion) parts.push(`    prequestion: ${JSON.stringify(a.prequestion)}`);
    if (a.quiz && a.quiz.length) parts.push(`    quiz: ${JSON.stringify(a.quiz)}`);
    if (a.reflectionPrompt) parts.push(`    reflectionPrompt: ${q(a.reflectionPrompt)}`);
    if (a.prompts && a.prompts.length) parts.push(`    prompts: ${JSON.stringify(a.prompts)}`);
    if (a.quizMode) parts.push(`    quizMode: ${q(a.quizMode)}`);
    return parts.length ? ",\n" + parts.join(",\n") : "";
  };

  const body = out.map((a) => {
    const profs = a.professions === "all" ? '"all"' : JSON.stringify(a.professions);
    return `  {
      id: ${q(a.id)},
      professions: ${profs},
      chapter: ${a.chapter},
      order: ${a.order || 99},
      title: ${q(a.title)},
      lead: ${q(a.lead)},
      bodyMd: \`${esc(a.bodyMd)}\`,
      readMinutes: ${a.readMinutes || 2},
      terms: ${JSON.stringify(a.terms || [])},
      sources: ${JSON.stringify(a.sources || [])}${studyFields(a)}
    }`;
  }).join(",\n");

  const note = `// ★docs/learn-content/articles.json（67本）から生成しています。
  //   直接編集せず、articles.json を直してから
  //   node scripts/build-learn-content.js で作り直してください。
  //
  //   67本のうち5本は「健康情報から移してくる」という指示で、本文を持って
  //   いません。健康情報の記事を動かすかどうかは別の作業（並行トラックの
  //   「学ぶと健康情報の統合」）なので、ここには入れていません。
  //   入れていないもの: C2-1 / C2-2 / C4-1 / C4-6 / C4-7
  //
  //   既存の記事は1本も失っていません（結び付かなかった分はそのまま残す）。

  `;

  fs.writeFileSync(path.join(ROOT, "lib/learnContent.js"),
    header + note + "export const ARTICLES = [\n" + body + "\n];\n\n" + footer, "utf-8");
  console.log("");
  console.log("lib/learnContent.js を書き出しました:", out.length, "本");


})();
