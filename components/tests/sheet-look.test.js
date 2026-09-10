#!/usr/bin/env node

// ============================================================================
// 記録の 画面と、その 1枚の 中の 見た目の 見張り
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     .pill / .fl / .inp / .mini / .usu
//   ★決め　　docs/design/pack-final/古い機能の扱い-訂正.md §2 ①
//     「DotSelector（5段階の入力）★部品・入力・値 そのまま。★色・名前・並びだけ」
//   ★お決め　坂本さん（★2026-09-11）── ㋐「見本の 見た目に 作り直す」
//
//   ★★確かめること
//     ① 入力の 部品が、★門の中で 見本の 姿に なること
//     ② その 決めが 1か所に あること（★部品ごとに 書いていないこと）
//     ③ 門の外（38人）の 姿を 1つも 変えていないこと
//     ④ 生の <input> ほかを そろえる 決めが、★1か所に あること
//     ⑤ 欄を 1つも 減らしていないこと
//     ⑥ 同じ 列への 入口が 2つ 残っていないこと
//
//   ★★この見張りは 文字を 読みます。★画面は 見ていません。
//     ★★「見本と 同じ 見た目か」は、★実機でしか 確かめられません。
// ============================================================================

const { readCode, readRaw } = require("./_source");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

/**
 * ★関数の 本体を、★波かっこを 数えて 取り出します。
 *
 *   ★★「先頭から ◯文字」で 切ると、★次の 関数まで 混ざります。
 *     ★2026-09-11、★それで Chip が 落ちました。★数えて 切ります。
 *   ★★かっこの 対応から 端を 出す こと（★形で 当てないこと）。
 */
function bodyOf(src, name) {
  const start = src.indexOf("function " + name + "(");
  if (start < 0) return "";
  let i = src.indexOf("{", src.indexOf(")", start));
  let d = 0;
  for (; i < src.length; i++) {
    if (src[i] === "{") d++;
    else if (src[i] === "}") { d--; if (d === 0) return src.slice(start, i + 1); }
  }
  return "";
}

const VT = readCode("components", "VocalTracker.jsx");
const VT_RAW = readRaw("components", "VocalTracker.jsx");
const SHEETS = readCode("components", "RecordSheets.jsx");
const CSS = readRaw("app", "globals.css");

console.log("① 入力の 部品が、門の中で 見本の 姿に なる");
[
  ["Chip", "札（.pill）"],
  ["YesNoField", "あり／なし"],
  ["EdemaSelector", "むくみ"],
  ["DotSelector", "5段の 目盛り"],
  ["DynamicsSelector", "pp〜ff"],
  ["NumberField", "数の 欄"],
  ["SectionFeedback", "その場の 1行"]
].forEach(([name, label]) => {
  const body = bodyOf(VT, name);
  t(!!body && /const v2 = useRecordV2Look\(\);/.test(body),
    `${label}（${name}）が 見た目を 1か所に 尋ねている`);
});

console.log("\n② 決めが 1か所に ある");
t((VT.match(/function useRecordV2Look\(\)/g) || []).length === 1,
  "★見た目を 決める 関数は 1つだけ");
t((VT.match(/function lookPill\(/g) || []).length === 1,
  "★札の 形を 作る 所は 1つだけ");
// ★★部品ごとに layoutV2 を 直に 見ていないこと。
//   ★見ると、★1つ 直しても ほかが 揃いません。
[
  "Chip", "YesNoField", "EdemaSelector", "DotSelector", "DynamicsSelector", "NumberField"
].forEach((name) => {
  t(!/layoutV2/.test(bodyOf(VT, name)), `${name} が layoutV2 を 直に 見ていない`);
});

console.log("\n③ 門の外（38人）の 姿を 変えていない");
[
  ["Chip", 'className="px-3 py-1.5 rounded-full text-xs font-medium transition-all border"'],
  ["DotSelector", 'className="text-xs ff-mono w-14"'],
  ["NumberField", 'className="w-full text-center rounded-lg border py-1.5 ff-mono"'],
  ["SectionFeedback", 'className="text-xs mt-3 rounded-xl p-2.5"']
].forEach(([name, needle]) => {
  t(VT.includes(needle), `${name} の これまでの 姿が 残っている`);
});
t(/className=\{layoutV2 \? "space-y-5 record-v2" : "space-y-5"\}/.test(VT),
  "★印（record-v2）は 門の中だけに 付く");

console.log("\n④ 生の 欄を そろえる 決めが 1か所に ある");
t(/\.record-v2 input\[type="time"\]/.test(CSS), "生の 時刻の 欄");
t(/\.record-v2 select/.test(CSS), "生の えらぶ 欄");
t(/\.record-v2 textarea/.test(CSS), "生の 書く 欄");
t(/\.record-v2 label/.test(CSS), "欄の 名前（.fl）");
t(/font-size: 16px !important;/.test(CSS), "★iOS で 拡大しない 大きさ");
t(/className="record-v2" ref=\{ctx \? ctx\.setNode : null\}/.test(SHEETS),
  "★1枚の 中の 差し込み口にも 印が 付く");

console.log("\n⑤ 欄を 1つも 減らしていない");
// ★★見た目を 変えただけで、★書ける ものが 減っていないこと。
[
  "labelSleepQuality", "labelTodayWeight", "labelMentalEase",
  "labelMentalTags", "labelMentalReason", "labelTotal",
  "labelDinnerTags", "labelDinnerTime", "labelSleepHours", "labelBedtime"
].forEach((k) => {
  t(VT.includes(`t("${k}")`), `${k} の 欄が 残っている`);
});
t(VT.includes("<EdemaSelector"), "むくみの 欄が 残っている（★門の外に）");
t(VT.includes("SPEECH_MINUTE_CHOICES.map"), "声を使った 時間の 4択が 残っている");

console.log("\n⑥ 同じ 列への 入口が 2つ 残っていない");
// ★★門の中で、★節の 側の 欄が 出ないこと。
//   ★★出ると、★片方で 書いて もう片方で 上書きされます。
const lines = VT_RAW.split("\n");
function guardedAbove(needle, within = 14) {
  let hit = false;
  lines.forEach((l, i) => {
    if (!l.includes(needle)) return;
    const above = lines.slice(Math.max(0, i - within), i).join("\n");
    if (/!layoutV2/.test(above)) hit = true;
  });
  return hit;
}
[
  ['t("labelSleepHours")', "睡眠時間"],
  ['t("labelBedtime")', "就寝時刻"],
  ['t("labelDinnerTime")', "夕食の 時刻"],
  ['t("labelDinnerTags")', "夕食の 札"],
  ["<EdemaSelector value={formData.morningEdema}", "むくみ"],
  ["本番外の発話（レッスン・会議・電話・授業・打合せなど）", "声を使った 時間"]
].forEach(([needle, label]) => {
  t(guardedAbove(needle), `${label} は 門の中で 出さない`);
});
t(/hideSymptoms=\{layoutV2\}/.test(VT), "場面ごとの 印の 欄は 門の中で 出さない");
// ★★隠すのでは なく、★描かないこと（★「隠したものは 動き続けます」）。
const rec = (() => {
  const a = lines.findIndex((l) => l.includes("<RecordSectionHost layoutV2="));
  const b = lines.findIndex((l, i) => i > a && l.includes("</RecordSectionHost>"));
  return lines.slice(a, b + 1).join("\n");
})();
t(!/display: layoutV2 \? "none"/.test(rec),
  "★記録の 中で「隠す」を 使っていない（★描かない ことで 外す）");

console.log("\n⑦ 狭い 枠で 字が 切れないこと");
{
  // ★★2026-09-11、★実機で 気温の「25」が「2」に 見えていました。
  //   ★★値は 正しく、★欄が 狭すぎて 切れていただけです。
  //     ★① 湿度の 欄を 出さなく したのに、★2列の 枠が 残っていた
  //     ★② flex の 中の 欄は、★既定では 中身より 小さく なれない
  //   ★★どちらも「見張りが 文字を 読むだけ」では 見つかりません。
  //     ★写真で 初めて 分かりました。★せめて 戻らない ようにします。
  const nf = bodyOf(VT, "NumberField");
  t(/minWidth: 0/.test(nf), "★数の 欄が つぶれない（minWidth: 0）");
  t(/padding: "12px 8px"/.test(nf), "★左右の 余白を 狭くしている");
  t(/\.record-v2 input\[type="number"\] \{/.test(CSS), "★生の 数の 欄も 同じ 決め");
  // ★★片方を 出さなく した 枠が、★2列の ままに なっていないこと。
  t(/className=\{layoutV2 \? "grid grid-cols-1 gap-4" : "grid grid-cols-2 gap-4"\}/.test(VT),
    "★湿度を 出さない 枠は、門の中では 1列");
}

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
console.log("★★これは「見本と 同じ 見た目か」の 証しでは ありません。");
process.exit(ng === 0 ? 0 : 1);
