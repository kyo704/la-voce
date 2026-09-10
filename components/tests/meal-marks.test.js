// ============================================================================
// 食事の印8つ（2026-09-07）
//
//   ★出どころ docs/opus/woolsong-仕様-分析機能の全体（9月7日・夜・Fableの査読を経て）.md §5-1
//
//   ★★守ること
//     ・★8つ。★脂／甘／辛／柑橘／チョコ／コーヒー／炭酸／酒
//     ・★AI を使わない。★外へ何も送らない
//     ・★本人が直したら、★機械が上書きしない
//     ・★null と 空の配列は、★別のこと
//     ・★いまある dinner_tags を、★1文字も書き替えない
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  const src = fs.readFileSync(path.join(ROOT, "lib", "mealMarks.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ 印は8つ、仕様どおり");
  ok("8つある", m.MEAL_MARKS.length === 8);
  const labels = m.MEAL_MARKS.map((x) => x.label).join("／");
  ok("並びも中身も仕様どおり", labels === "脂／甘／辛／柑橘／チョコ／コーヒー／酒".replace("／酒", "／炭酸／酒"), labels);
  ok("凍らせてある", Object.isFrozen(m.MEAL_MARKS));

  console.log("■ 書いた文から、印が立つ");
  const t = (text, want) => {
    const got = m.marksFromText(text).map(m.markLabel);
    ok(`「${text}」→ ${want.join("・") || "（なし）"}`,
      JSON.stringify(got) === JSON.stringify(want), got.join("・"));
  };
  t("からあげとビール", ["脂", "炭酸", "酒"]);
  t("チョコレートケーキとコーヒー", ["甘", "チョコ", "コーヒー"]);
  t("みかんを2つ", ["柑橘"]);
  t("カレーライス", ["辛"]);
  t("Fried chicken and beer", ["脂", "炭酸", "酒"]);
  t("パスタとサラダ", []);
  t("", []);

  console.log("■ ★短すぎる言葉で、ちがうものを拾わない");
  // ★「油」を入れると「醤油」に当たります。★だから料理の言葉で拾います。
  t("醤油をかけた冷奴", []);
  // ★「酒」を入れると「甘酒」「酒粕」に当たります。
  t("甘酒をのんだ", []);
  // ★★見るのは、★辞書の中だけです。
  //   ★2026-09-07、★ファイル全体を見て、★印の名前「酒」に当たりました。
  //   ★★名前と、★探す言葉は、★別のものです。
  const dictBlock = src.slice(src.indexOf("const DICTIONARY"), src.indexOf("});", src.indexOf("const DICTIONARY")));
  ok("★辞書に「油」だけの語が無い", !/"油"/.test(dictBlock));
  ok("★辞書に「酒」だけの語が無い", !/"酒"/.test(dictBlock));
  ok("★この見方が、辞書を本当に見ている", /"からあげ"/.test(dictBlock));

  console.log("■ 同じ言葉が、2つの印に入ってよい");
  // ★ビールは、炭酸でもあり、酒でもあります。★片方に決めません。
  ok("ビールは、炭酸と酒の両方",
    JSON.stringify(m.marksFromText("ビール")) === JSON.stringify(["soda", "alcohol"]));

  console.log("■ 並びは、いつも同じ");
  ok("見つかった順ではなく、決めた順",
    JSON.stringify(m.marksFromText("ビールとからあげ"))
    === JSON.stringify(m.marksFromText("からあげとビール")));

  console.log("■ 古いタグは、読むときだけ重ねる");
  ok("揚げ物 → 脂", JSON.stringify(m.marksFromLegacyTags(["揚げ物"])) === JSON.stringify(["fat"]));
  ok("カフェイン → コーヒー", JSON.stringify(m.marksFromLegacyTags(["カフェイン"])) === JSON.stringify(["coffee"]));
  // ★★当たる印が無いものを、★無理に当てないこと。
  ok("★トマト系は、どの印にも当てない", m.marksFromLegacyTags(["トマト系"]).length === 0);
  ok("★あっさりも、当てない", m.marksFromLegacyTags(["あっさり"]).length === 0);

  console.log("■ ★本人が直したら、機械は上書きしない");
  ok("直していなければ、文から立てる",
    m.resolveMealMarks({ mealNotes: "からあげ" }).length === 1);
  ok("★直したら、そちらが勝つ",
    JSON.stringify(m.resolveMealMarks({ mealMarks: ["sweet"], mealNotes: "からあげ" })) === JSON.stringify(["sweet"]));
  // ★★空の配列も、答えです。★「印は無い」と本人が決めた、という意味です。
  ok("★空の配列は「印は無い」という答え",
    m.resolveMealMarks({ mealMarks: [], mealNotes: "からあげとビール" }).length === 0);
  ok("null は「まだ直していない」",
    m.resolveMealMarks({ mealMarks: null, mealNotes: "からあげ" }).length === 1);

  console.log("■ AI を使っていない");
  ok("★外へ送る道が無い", !/fetch|anthropic|openai|http/i.test(src));

  console.log("■ 画面と、行のやり取り");
  const vt = readCode("components", "VocalTracker.jsx");
  ok("行から読んでいる", /mealMarks: Array\.isArray\(row\.meal_marks\) \? row\.meal_marks : null/.test(vt));
  ok("★触っていなければ null のまま書く",
    /meal_marks: Array\.isArray\(e\.mealMarks\) \? e\.mealMarks : null/.test(vt));
  ok("★空の配列に、初期化していない", !/mealMarks: \[\]/.test(vt));
  ok("押して直せる", /aria-pressed=\{on\}/.test(vt));
  ok("★判定は lib から取っている", /resolveMealMarks\(formData\)/.test(vt));
  // ★★数を出さないこと。
  ok("★「◯つ立ちました」と書いていない", !/[0-9０-９]\s*つ(立|つき|付)/.test(vt));

  console.log("■ ★いまある dinner_tags を、書き替えていない");
  // ★★2026-09-11、★見本の SH['tabe'] の 言葉を 4つ 足しました。
  //   ★★見張るのは「6つ ちょうど」では ありません。
  //     ★「もとの 6つが、★1つも 消えず、★順も 変わっていない」ことです。
  //     ★★消したり 並べ替えたり すると、★これまでの 記録が 読めなく なります。
  const dt = vt.slice(vt.indexOf("const DINNER_TAGS = ["));
  const head = dt.slice(0, dt.indexOf("]") + 1);
  ok("もとの6つが、順のまま先頭にある",
    /^const DINNER_TAGS = \["揚げ物", "あっさり", "炭酸", "トマト系", "カフェイン", "アルコール"/.test(head));
  // ★★足したものにも、必ず 鍵が あること。★鍵が 無いと events に 出ません。
  const keys = vt.slice(vt.indexOf("const DINNER_TAG_KEYS"));
  const keyHead = keys.slice(0, keys.indexOf("};") + 2);
  const tags = [...head.matchAll(/"([^"]+)"/g)].map((m) => m[1]);
  ok("足したものにも鍵がある",
    tags.every((t) => keyHead.includes(`"${t}":`)) && tags.length >= 6);

  console.log("■ SQL");
  const sql = readCode("supabase", "2026-09-07-食事の印8つ.sql");
  ok("列を足している", /add column if not exists meal_marks/.test(sql));
  ok("★いっせいに埋めていない", !/\bupdate public\.entries\b/.test(sql));
  ok("BEGIN / ROLLBACK に頼っていない", !/\bbegin\s*;/i.test(sql) && !/\brollback\b/i.test(sql));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
