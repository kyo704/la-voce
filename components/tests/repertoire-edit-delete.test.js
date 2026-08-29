#!/usr/bin/env node
/**
 * 曲目の「直す」「名前を変える」「消す」（2026-08-29）
 *
 * ★なぜ要るか
 *   一度登録した最高音を直す手立てが、アプリのどこにもありませんでした。
 *
 * ★坂本さんの判断（2026-08-29）
 *   消すときは、曲名だけを外します。★活動ブロック（分・種別）は残します。
 *   ブロックごと消すと、過去の負荷やACWRの数字が、訂正のついでに
 *   黙って変わります。
 *
 * ★試験用の記録を自分で組み立てて確かめます。
 *   坂本さんのアカウントには、まだ曲目つきの記録が1件もありません
 *   （2026-08-29 の実測：両方の集計クエリが0行）。
 *   手で確かめられないので、ここで作った記録で確かめます。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}\n      期待:${JSON.stringify(b)}\n      実際:${JSON.stringify(a)}`); failCount++; }
}
const code = readCode("components", "VocalTracker.jsx");
const raw = readRaw("components", "VocalTracker.jsx");

// ---------------------------------------------------------------------------
// 試験用の記録（★複数日・複数ブロック・1日に複数曲）
// ---------------------------------------------------------------------------
function fixture() {
  return {
    // 1日に2曲。★片方を消しても、もう片方が残ること。
    "2026-08-01": { date: "2026-08-01", activities: [
      { id: "a1", kind: "自主練習", minutes: 60, items: [
        { repertoireName: "椿姫", minutesOverride: null, order: 0 },
        { repertoireName: "蝶々夫人", minutesOverride: null, order: 1 }
      ] }
    ] },
    // 1日に2ブロック、どちらにも同じ曲。★両方から外れること。
    "2026-08-02": { date: "2026-08-02", activities: [
      { id: "a2", kind: "レッスン", minutes: 45, items: [{ repertoireName: "椿姫", minutesOverride: null, order: 0 }] },
      { id: "a3", kind: "本番",     minutes: 90, items: [{ repertoireName: "椿姫", minutesOverride: null, order: 0 }] }
    ] },
    // その曲を含まない日。★触られないこと。
    "2026-08-03": { date: "2026-08-03", activities: [
      { id: "a4", kind: "自主練習", minutes: 30, items: [{ repertoireName: "蝶々夫人", minutesOverride: null, order: 0 }] }
    ] },
    // 曲目のない日（休養）。★落ちないこと。
    "2026-08-04": { date: "2026-08-04", activities: [], recovery: { methods: [], note: "" } }
  };
}
// 画面の処理をそのまま写す（:handleRenameRepertoire / :handleDeleteRepertoire）
const affectedDates = (entries, name) => Object.keys(entries).filter((d) =>
  (entries[d].activities || []).some((a) => (a.items || []).some((it) => it.repertoireName === name)));
const renameIn = (entry, from, to) => ({ ...entry, activities: (entry.activities || []).map((a) => ({
  ...a, items: (a.items || []).map((it) => (it.repertoireName === from ? { ...it, repertoireName: to } : it)) })) });
const stripIn = (entry, from) => ({ ...entry, activities: (entry.activities || []).map((a) => ({
  ...a, items: (a.items || []).filter((it) => it.repertoireName !== from) })) });

console.log("=== 触る日を、正しく選べているか ===");
const fx = fixture();
assertEqual(affectedDates(fx, "椿姫").sort(), ["2026-08-01", "2026-08-02"], "椿姫がある2日だけを選ぶ");
assertEqual(affectedDates(fx, "蝶々夫人").sort(), ["2026-08-01", "2026-08-03"], "蝶々夫人がある2日だけを選ぶ");
assertEqual(affectedDates(fx, "無い曲"), [], "無い曲では、どの日も触らない");

console.log("\n=== ★消しても、活動ブロックは残る（坂本さんの判断） ===");
const afterDelete = {};
affectedDates(fx, "椿姫").forEach((d) => { afterDelete[d] = stripIn(fx[d], "椿姫"); });
const d2 = afterDelete["2026-08-02"];
assertEqual(d2.activities.length, 2, "★ブロックの数が変わっていない（2つのまま）");
assertEqual(d2.activities.map((a) => a.minutes), [45, 90], "★分数がそのまま残っている");
assertEqual(d2.activities.map((a) => a.kind), ["レッスン", "本番"], "★活動の種別が残っている");
assertEqual(d2.activities.flatMap((a) => a.items).length, 0, "曲名だけが外れている");
// 1日に2曲あった日
const d1 = afterDelete["2026-08-01"];
assertEqual(d1.activities[0].items.map((i) => i.repertoireName), ["蝶々夫人"],
  "★同じ日のもう1曲は残る（消した曲だけが外れる）");
assertEqual(d1.activities[0].minutes, 60, "★その日の分数も変わらない");
// 触らない日
assertTrue(!afterDelete["2026-08-03"], "★その曲を含まない日は、書き込みもしない");
assertTrue(!afterDelete["2026-08-04"], "★曲目のない日も、書き込みもしない");

console.log("\n=== 名前を変える ===");
const afterRename = {};
affectedDates(fx, "椿姫").forEach((d) => { afterRename[d] = renameIn(fx[d], "椿姫", "ラ・トラヴィアータ"); });
assertEqual(afterRename["2026-08-02"].activities.flatMap((a) => a.items).map((i) => i.repertoireName),
  ["ラ・トラヴィアータ", "ラ・トラヴィアータ"], "★同じ日の2ブロックとも、つなぎ直る");
assertEqual(afterRename["2026-08-01"].activities[0].items.map((i) => i.repertoireName),
  ["ラ・トラヴィアータ", "蝶々夫人"], "★同じ日のもう1曲は、そのまま");
assertEqual(afterRename["2026-08-02"].activities.map((a) => a.minutes), [45, 90], "分数は変わらない");

console.log("\n=== つながっている先を、全部たどっているか ===");
["repertoire_tessitura", "role_master", "project_master"].forEach((tbl) => {
  const at = code.indexOf("async function handleDeleteRepertoire");
  const body = code.slice(at, at + 2200);
  assertTrue(body.includes(`from("${tbl}")`), `消すときに ${tbl} も見ている`);
});
assertTrue(/entryToRow\(userId, updatedEntry\)/.test(code.slice(code.indexOf("async function handleDeleteRepertoire"))),
  "★旧列（entries.repertoire）は entryToRow が作り直す");
// ★ブロックを消す書き方が、どこにも無いこと。
const delBody = code.slice(code.indexOf("async function handleDeleteRepertoire"), code.indexOf("async function handleDeleteRepertoire") + 2200);
assertTrue(!/activities\)\.filter\(/.test(delBody), "★活動ブロックそのものを間引いていない");
assertTrue(/\(a\.items \|\| \[\]\)\.filter\(/.test(delBody), "外しているのは items だけ");

console.log("\n=== 消すのは2段階（指1本で起きない） ===");
assertTrue(/deleteRepertoireConfirming/.test(code), "確認の段がある");
assertTrue(/findAffectedDatesForRepertoire\(editRepertoireName\)\.length/.test(code),
  "★確認の画面に、触る日数を実数で出している");
assertTrue(/本当に消す（取り消せません）/.test(raw), "2段目でだけ、実際に消せる");
assertTrue(/練習した分数と活動の種別は残ります/.test(raw), "★何が残るかを、消す前に書いてある");

console.log("\n=== その場で直す（最高音・テッシトゥーラ） ===");
assertTrue(/const \[editingPitch, setEditingPitch\] = useState\(false\);/.test(code), "直している最中か、を持っている");
assertTrue(/\{name && \(!hasPitch \|\| editingPitch\) && \(\(\) => \{/.test(code), "登録済みでも、直すときは欄が開く");
assertTrue(/replace: editingPitch/.test(code), "★直すときは置き換えて保存する（空にできる）");
assertTrue(/if \(replace && !topNote && !tessituraNote && dOverride == null\) return;/.test(code),
  "★ただし、全部空にはできない（行の意味が無くなる）");
assertTrue(/if \(!editingPitch && \(!duplicateWarning \|\| !duplicateWarning\.confirmed\)\) \{/.test(code),
  "直しているときは、似た曲の確認を出さない");
// ★「やめる」で、飛ばした印を付けないこと。付けると欄が二度と出なくなる。
const cancelAt = raw.indexOf("if (editingPitch) {");
assertTrue(cancelAt > 0 && raw.slice(cancelAt, cancelAt + 260).includes("setEditingPitch(false)"),
  "★やめても、飛ばした印は付かない");

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
