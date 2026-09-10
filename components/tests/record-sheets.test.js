// ============================================================================
// 記録の 入力シート（★見本 SH['ねむり'] SH['こえ'] ほか）── 見張り
//
//   ★出どころ docs/design/pack-final/00-動く見本（さわれる・全画面）.html
//     「★＋の行を 押すと 下から シートが 出ます」
//
//   ★★見張るのは 5つ。
//     ① 長さの 計算（★日を またぐ・繰り上げ）
//     ② 新しい 欄を 作っていない（★しまう 先は これまでの 欄）
//     ③ 選択肢を 書き写していない（★見本と 同じ 4つ）
//     ④ 出口が ある（★暗いところ・ボタン・Esc）
//     ⑤ 但し書きを 1文字も 変えていない
// ============================================================================

const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) console.log("  ok  " + label);
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const src = readRaw("lib", "recordSheets.js");
  const R = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("① 眠った 長さ");
  ok(R.sleepLength("23:30", "7:00") === 7.5, "★23:30 → 7:00 は 7.5時間（★日を またぐ）");
  ok(R.sleepLength("22:00", "5:30") === 7.5, "★22:00 → 5:30 も 7.5時間");
  ok(R.sleepLength("0:30", "8:00") === 7.5, "★0:30 → 8:00 も 7.5時間");
  ok(R.sleepLength("こわれた", "7:00") === null, "★読めなければ null");
  ok(R.sleepWord(6.333) === "6時間20分", "★「6時間20分」の 形");
  // ★★60分に なったら 繰り上げます。★「6時間60分」を 出さない ため。
  ok(R.sleepWord(6.999) === "7時間0分", "★60分を 繰り上げる");
  ok(R.sleepWord(null) === "", "★数で なければ 空");

  console.log("② 起きた 時刻は、しまわずに 出し直す");
  // ★★欄を 増やしていません。★寝た 時刻と 長さから 出します。
  ok(R.wakeFromBed("23:30", 7.5) === "7:00", "★戻せる");
  ok(R.wakeFromBed("22:00", 7.5) === "5:30", "★日を またいでも 戻せる");
  ok(R.wakeFromBed("23:30", null) === null, "★長さが 無ければ null");

  console.log("③ 見本の 選択肢と 同じ");
  ok(R.NEMURI.BED.length === 8 && R.NEMURI.BED[0] === "22:00" && R.NEMURI.BED[7] === "1:30",
    "★寝た 時刻は 8つ（22:00〜1:30）");
  ok(R.NEMURI.WAKE.length === 8 && R.NEMURI.WAKE[0] === "5:30" && R.NEMURI.WAKE[7] === "9:00",
    "★起きた 時刻も 8つ（5:30〜9:00）");
  // ★★こえ の 4つは、★ここに 書き写していません。
  //   ★VocalTracker.jsx の SPEECH_MINUTE_CHOICES を そのまま 使います。
  const lib = readCode("lib", "recordSheets.js");
  ok(!/15分|2時間以上/.test(lib), "★こえ の 4つを 書き写していない");
  const vt = readCode("components", "VocalTracker.jsx");
  ok(/SPEECH_MINUTE_CHOICES/.test(vt), "★もとの 一覧が まだ ある");
  ok(/choices=\{SPEECH_MINUTE_CHOICES\}/.test(vt), "★それを 1枚に 渡している");

  console.log("④ 新しい 欄を 作っていない");
  // ★★ねむり は bedtime ＋ sleepHours。★起きた 時刻の 欄は ありません。
  ok(/bedtime: bed, sleepHours: hours/.test(vt), "★寝た 時刻と 長さに しまう");
  ok(!/wakeTime|wake_time|wakeAt/.test(vt), "★起きた 時刻の 欄を 作っていない");
  ok(/nonPerformanceSpeechMinutes: v/.test(vt), "★こえ は もとの 欄に しまう");
  const cols = readCode("lib", "entryColumns.js");
  ok(cols.includes("bedtime") && cols.includes("sleep_hours")
    && cols.includes("non_performance_speech_minutes"), "★3つとも もう ある 列");

  console.log("⑤ 出口が ある");
  const sheet = readCode("components", "BottomSheet.jsx");
  ok(/Escape/.test(sheet), "★Esc で 閉じられる");
  ok(/onClick=\{onClose\}/.test(sheet), "★後ろの 暗い ところで 閉じられる");
  ok(/closeLabel/.test(sheet), "★下の ボタンで 閉じられる");
  // ★★開いている あいだ、★後ろを 動かさない。
  ok(/document\.body\.style\.overflow = "hidden"/.test(sheet), "★後ろの スクロールを 止める");
  ok(/document\.body\.style\.overflow = before/.test(sheet), "★★閉じたら 戻す");
  ok(/aria-modal="true"/.test(sheet), "★読み上げに 1枚だと 伝える");

  console.log("⑥ 但し書きは 見本の まま");
  const raw = readRaw("lib", "recordSheets.js");
  [
    "歌ったぶんも、話したぶんも 合わせて",
    "毎日 数字を 打たせません。",
    "寝た時刻と 起きた時刻を 選ぶと、長さが 出ます",
    "きのうの値を 初めから 入れています。変わっていたら 直してください。",
    "記録の 催促は 設けていません。出しません。",
    "出来ばえでは ありません。いま どの段階かを、ご自分で 選ぶだけです。"
  ].forEach((w) => ok(raw.includes(w), `★「${w.slice(0, 18)}…」`));

  console.log("⑥-2 足した 言葉が、★古い ものを 消していない");
  // ★★これが いちばん 大事です。★消すと、★38人の 記録が 読めなく なります。
  const OLD_SYMPTOM = ["乾燥", "嗄れ", "痛み", "違和感", "鼻づまり", "咳", "裏返り", "喉の張り感"];
  const OLD_TABE = ["揚げ物", "あっさり", "炭酸", "トマト系", "カフェイン", "アルコール"];
  const symHead = vt.slice(vt.indexOf("const SYMPTOM_OPTIONS = ["));
  const symList = symHead.slice(0, symHead.indexOf("]") + 1);
  OLD_SYMPTOM.forEach((w) => ok(symList.includes(`"${w}"`), `★「${w}」が 残っている`));
  const tabeHead = vt.slice(vt.indexOf("const DINNER_TAGS = ["));
  const tabeList = tabeHead.slice(0, tabeHead.indexOf("]") + 1);
  OLD_TABE.forEach((w) => ok(tabeList.includes(`"${w}"`), `★「${w}」が 残っている`));
  // ★★同じ ことを 2つの 言葉で 聞かない こと。
  ok(!symList.includes("鼻が つまる"), "★「鼻が つまる」を 足していない（★「鼻づまり」が ある）");
  ok(!tabeList.includes("脂っこいもの"), "★「脂っこいもの」を 足していない（★「揚げ物」が ある）");
  ok(!tabeList.includes('"お酒"'), "★「お酒」を 足していない（★「アルコール」が ある）");
  // ★★足した ものが、★場所を 持っていること。
  const loc = readRaw("lib", "symptomLocations.js");
  ["のどが いがらっぽい", "せきばらい", "のどが 渇く", "胃が もたれる", "肩が こわばる"]
    .forEach((w) => {
      ok(symList.includes(`"${w}"`), `★「${w}」を 足した`);
      ok(loc.includes(`"${w}":`), `★★「${w}」に 場所が ある`);
    });
  ok(/LOCATION_ORDER = \["のど", "鼻・のどの奥", "おなか", "からだ"\]/.test(loc),
    "★場所が 4つに なった（★おなか・からだ を 足した）");

  console.log("⑥-3 数を 出さない");
  // ★★見本は「3つ」と 出しますが、★この家は 数を 出しません。
  ok(/\.length > 0 \? "あり" : null/.test(vt), "★入っているか どうかだけ 出す");
  ok(!/length \+ "つ"/.test(vt), "★「◯つ」と 書いていない");

  console.log("⑦ 色だけに 意味を 持たせていない");
  const rs = readCode("components", "RecordSheets.jsx");
  ok(/"✓" : "＋"/.test(rs), "★形（✓／＋）で 分けている");

  console.log("⑧ 押せる ところは 44 以上");
  ok((sheet.match(/minHeight: 44|minHeight: 48/g) || []).length >= 2, "★1枚の 中も 44 以上");
  ok((rs.match(/minHeight: 44|minHeight: 52/g) || []).length >= 2, "★行も ボタンも 44 以上");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
