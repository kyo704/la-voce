#!/usr/bin/env node
/**
 * docs/音楽家の商い-第1章.md / 第2章.md を、アプリが読む記事の形へ変換する。
 *
 * ★原稿にすでに全部そろっています。書き足すのではなく、切り分けるだけです。
 *     読む前に        → prequestion（問い＋選択肢）
 *     本文            → bodyMd
 *     覚えておくこと  → keySentence（引用の1行）
 *     用語            → terms
 *     自分の場合を書く→ prompts（Q1・Q2 の2つ）
 *
 * ★14本すべて quizMode: "reflect"。ただし 14（確定申告）は制度の説明なので
 *   recall で構わない、と作業指示にあります（問いの形を記事ごとに分ける.md §2）。
 *   ただ 14 も原稿は Q1・Q2 の記述式で書かれているため、原稿に従って
 *   reflect のままにします。★原稿と指示が食い違うときは、勝手に決めません。
 *   坂本さんに報告して判断を仰ぐこと。
 *
 * ★選択式の3問は作りません。正解が土地と状況で変わる記事だからです。
 */
const fs = require("fs");
const path = require("path");
const ROOT = path.join(__dirname, "..");

const FILES = [
  { file: "docs/音楽家の商い-第1章.md", chapter: 8 },
  { file: "docs/音楽家の商い-第2章.md", chapter: 9 }
];

function sectionsOf(block) {
  // "## 見出し" で切る
  const out = {};
  const parts = block.split(/^## /m);
  parts.slice(1).forEach((p) => {
    const nl = p.indexOf("\n");
    out[p.slice(0, nl).trim()] = p.slice(nl + 1).trim();
  });
  return out;
}

function parsePrequestion(text) {
  if (!text) return null;
  // 選択肢は ``` で囲まれた ・ の行
  const fence = text.match(/```([\s\S]*?)```/);
  const choices = fence
    ? fence[1].split("\n").map((l) => l.replace(/^\s*・\s*/, "").trim()).filter(Boolean)
    : [];
  const stem = text.slice(0, fence ? text.indexOf("```") : text.length)
    .replace(/\*\*/g, "").split("\n").map((l) => l.trim()).filter(Boolean).join("");
  if (!stem) return null;
  // ★正解は持たせません。読む前に正解を出さないためです（§2-1）。
  return choices.length >= 3 ? { stem, choices } : { stem, choices: [] };
}

function parseKeySentence(text) {
  if (!text) return null;
  const line = text.split("\n").find((l) => l.trim().startsWith(">"));
  return line ? line.replace(/^>\s*/, "").replace(/\*\*/g, "").trim() : null;
}

function parseTerms(text) {
  if (!text) return [];
  // ★行頭の太字だけが用語。定義文の途中の強調まで拾うと
  //   「91枚ぶんの席が空いています。」のような文が用語として並ぶ。
  return text.split("\n")
    .map((l) => (l.trim().match(/^\*\*([^*]+)\*\*/) || [])[1])
    .filter(Boolean).map((s) => s.trim());
}

function parsePrompts(text) {
  if (!text) return [];
  return text.split(/\*\*Q\d\.\*\*/).slice(1)
    .map((p) => p.split(/^\s*\*\*※/m)[0].replace(/\*\*/g, "").split("\n").map((l) => l.trim()).filter(Boolean).join(""))
    .filter(Boolean);
}

const articles = [];
FILES.forEach(({ file, chapter }) => {
  const raw = fs.readFileSync(path.join(ROOT, file), "utf-8");
  const blocks = raw.split(/^# (?=\d\d　)/m).slice(1);
  blocks.forEach((block, i) => {
    const nl = block.indexOf("\n");
    const heading = block.slice(0, nl).trim();
    const num = heading.slice(0, 2);
    const title = heading.slice(2).replace(/^　/, "").trim();
    const s = sectionsOf(block);
    articles.push({
      id: `shobai-${num}`,
      professions: "all",
      chapter,
      order: i + 1,
      title,
      lead: (s["読む前に"] || "").replace(/\*\*/g, "").split("\n")[0].trim(),
      bodyMd: s["本文"] || "",
      readMinutes: Math.max(2, Math.round((s["本文"] || "").length / 500)),
      terms: parseTerms(s["用語"]),
      sources: [],
      quizMode: "reflect",
      keySentence: parseKeySentence(s["覚えておくこと"]),
      prequestion: parsePrequestion(s["読む前に"]),
      prompts: parsePrompts(s["自分の場合を書く"])
    });
  });
});

console.log("切り出した記事:", articles.length, "本\n");
articles.forEach((a) => {
  const warn = [];
  if (!a.keySentence) warn.push("1文なし");
  if (!a.prequestion) warn.push("読む前の問いなし");
  if (a.prompts.length !== 2) warn.push(`記述の問いが${a.prompts.length}つ`);
  if (!a.bodyMd) warn.push("本文なし");
  console.log(`${a.id}  ${a.title.slice(0, 24).padEnd(26)} 本文${String(a.bodyMd.length).padStart(5)}字  用語${a.terms.length}  ${warn.length ? "★" + warn.join(" / ") : "ok"}`);
});

fs.writeFileSync(path.join(ROOT, "docs/learn-content/shobai.json"),
  JSON.stringify({ articles }, null, 2) + "\n", "utf-8");
console.log("\ndocs/learn-content/shobai.json に書き出しました。");
