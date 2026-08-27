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

src.articles.forEach((a) => {
  orderByChapter[a.chapter] = (orderByChapter[a.chapter] || 0) + 1;
  const order = orderByChapter[a.chapter];
  const professions = mapProfessions(a.professions);

  if (HAS_PROSE.has(a.status)) {
    out.push({
      id: a.id, professions, chapter: a.chapter, order,
      title: a.title, lead: a.summary || "", bodyMd: a.body,
      readMinutes: readMinutes(a.body), terms: [], sources: []
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

// ---- ファイルを書き出す ----
const esc = (t) => String(t == null ? "" : t).replace(/\\/g, "\\\\").replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
const q = (t) => JSON.stringify(String(t == null ? "" : t));

const header = liveSrc.slice(0, liveSrc.indexOf("export const ARTICLES"));
const footer = liveSrc.slice(liveSrc.indexOf("export function getArticlesForProfession"));

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
    sources: ${JSON.stringify(a.sources || [])}
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

