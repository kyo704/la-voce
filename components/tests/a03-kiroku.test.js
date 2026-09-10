// ============================================================================
// A03「記録 ／ 2タップで完成」を、★見本に そろえた ことの 見張り
//
//   ★出どころ docs/design/pack/screens/A03-記録2タップで完成.html（★HTML が 正）
//            docs/design/pack/screens/A03-記録2タップで完成.txt（★画面に 出る 文字）
//            docs/design/pack/screens/A03-記録2タップで完成.notes.md（★画面に 出ない 注記）
//
//   ★★確かめること
//     ① 画面に 出る 文字が、★見本の .txt と 食い違わないこと。
//        ★★とくに、★.notes.md の 注記を 画面に 写していないこと。
//     ② 折りたたみ 5つの 名前が、★見本の とおりであること。
//     ③ 3択の 形と 大きさが、★見本の CSS と 合っていること。
//     ④ 「完了」を 作らないこと。★数え上げを 出さないこと。
//     ⑤ 押せるところが 44px を 下回らないこと。
//     ⑥ 門の外（38人）の 記録画面が 1つも 変わらないこと。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  const dir = ["docs", "design", "pack", "screens"];
  const html = readRaw(...dir, "A03-記録2タップで完成.html");
  const txt = readRaw(...dir, "A03-記録2タップで完成.txt");
  const notes = readRaw(...dir, "A03-記録2タップで完成.notes.md");
  const head = readRaw("components", "RecordV2Head.jsx");
  const headText = readCode("components", "RecordV2Head.jsx");

  console.log("① 画面に 出る 文字（★見本の .txt が 正）");
  // ★★見本の .txt に 並ぶ 言葉が、★画面の 側にも あること。
  ["記録", "保存しました", "こえの ちょうし", "きょうは、書かない"].forEach((w) => {
    ok(headText.includes(w), "★「" + w + "」が 画面に ある");
  });
  // ★★3択の 言葉は、★画面に 書いてありません。★lib/recordV2.js が 持っています。
  //   ★★書く側（記録）と 読む側（きょう）で、★組が ずれないためです。
  //   ★はじめ、★画面の 本文で 数えて 落ちました。★数える 場所が ちがいました。
  ok(/CONDITION_CHOICES\.map/.test(headText), "★3択は 1か所の 組から 出している");
  // ★★注記は、★画面に 写さないこと。
  //   ★★design.zip の 決め ──「★で始まる行は、画面に出ない、実装への注記です」
  ok(/「完了」は ありません/.test(notes), "★注記の ほうに 但し書きが ある");
  ok(!/「完了」はありません/.test(txt), "★画面の 文の ほうには 無い");
  ok(!/ここでもう保存されて|「完了」はありません/.test(headText),
    "★注記を 画面に 写していない");

  const foldSrc = fs.readFileSync(path.join(ROOT, "lib", "recordV2.js"), "utf8");
  const folds = await import("data:text/javascript;base64," + Buffer.from(foldSrc).toString("base64"));
  // ★見本の 3択を、★HTML から 直に 拾って 突き合わせます。
  const marks = [...html.matchAll(/font-size:30px[^>]*>([◎○△])<\/div><div style="font-size:12px[^>]*>([^<]+)</g)]
    .map((m) => ({ mark: m[1], word: m[2] }));
  ok(marks.length === 3, "★見本に 3択が ある  （得た値: " + JSON.stringify(marks) + "）");
  ok(JSON.stringify(folds.CONDITION_CHOICES) === JSON.stringify(marks.map((x) => x.word)),
    "★3択の 言葉も 順も 見本と 同じ");
  ok(marks.every((x) => folds.CONDITION_MARKS[x.word] === x.mark),
    "★◎ ／ ○ ／ △ の 割り当ても 見本と 同じ");

  console.log("② 折りたたみ 5つの 名前");
  // ★見本から「＋ ◯◯」を 直に 拾います。★書き写しません。
  const want = [...html.matchAll(/＋\s*([^<›]+?)<\/span>/g)].map((m) => m[1].trim());
  ok(want.length === 5, "★見本に 折りたたみが 5つ  （得た値: " + JSON.stringify(want) + "）");
  ok(JSON.stringify(folds.RECORD_FOLDS.map((f) => f.label)) === JSON.stringify(want),
    "★名前も 順も 見本と 同じ");

  console.log("③ 3択の 形（★見本の CSS）");
  function inlineNum(needle, prop) {
    const i = html.indexOf(needle);
    if (i < 0) return null;
    const seg = html.slice(i, i + 260);
    const m = new RegExp(prop + ":\\s*([0-9.]+)").exec(seg);
    return m ? Number(m[1]) : null;
  }
  ok(inlineNum('class="two" style="gap:7px', "gap") === 7, "★3枚の あいだ 7px");
  ok(/gap: 7/.test(head), "★実装も 7px");
  ok(inlineNum('padding:16px 6px', "padding") === 16, "★カードの 内側 上下 16px");
  ok(/padding: "16px 6px"/.test(head), "★実装も 16px 6px");
  // ★★2026-09-11。★px から rem に 替えました（文字の大きさの 設定を 効かせるため）。
  //   ★数は 見本の まま。★包み方だけが rem(...) に なりました。
  ok(/font-size:30px/.test(html) && /fontSize: rem\(30\)/.test(head), "★印は 30px");
  ok(/font-size:12px;margin-top:5px/.test(html) && /fontSize: rem\(12\), marginTop: rem\(5\)/.test(head),
    "★言葉は 12px・上に 5px");
  ok(/border:2px solid var\(--enji\)/.test(html) && /2px solid \$\{C\.curtain\}/.test(head),
    "★選ばれたら 枠が 2px");
  // ★★色だけに 意味を 持たせないこと。★形（◎○△）が 先に あること。
  ok(/◎/.test(html) && /conditionMark/.test(head), "★印は 形で 分けている");

  console.log("④ 「完了」を 作らない・数えない");
  ok(!/>\s*完了\s*<|完了する|完了度|未入力/.test(headText), "★「完了」も「未入力」も 出さない");
  ok(!/あと\s*\d|あと[０-９]/.test(headText), "★「あと◯」と 数えない");
  ok(/きょうは、書かない/.test(headText), "★出口が ある");

  console.log("⑤ 押せるところ");
  ok(/minHeight: SPACE\.tapMin/.test(head), "★「書かない」は 44px 以上");
  // ★3択は 内側 16＋印30＋5＋12 で 44 を 越えます。★折りたたみは 12＋9×2＋13 で 越えます。
  ok(/padding: "9px 0"/.test(head), "★折りたたみの 行は 上下 9px（★見本 .li）");

  console.log("⑥ 見本に 無いものを、★門の中では 出さない（★2026-09-10・お決め）");
  {
    const v = readRaw("components", "VocalTracker.jsx");
    // ★★どれも「消して」いません。★門の中で 出さない、だけです。
    //   ★★消すと 38人から 取り上げることに なります。
    [
      ["!layoutV2 && isSimpleDisplay(profile) && formData", "★かんたん表示の 一問ずつ"],
      // ★★2026-09-10、★これは「門の中で 出さない」から「消す」に なりました
      //   （★坂本さんの お決め⑫）。★38人にも 出ていた ものです。
      //   ★★消えたことを 見ます。★戻ってきたら 気づけるように。
      ["{!layoutV2 && (\n                <div className=\"rounded-2xl p-3 border\"", "★かんたん／しっかり の 切替"],
      ["!layoutV2 && !!entries[addDays(selectedDate, -1)]", "★前日をコピー"],
      ["!layoutV2 && showCopiedNotice", "★コピーの 知らせ"],
      ["{!layoutV2 && dateBandNode}", "★日付の帯は 門の外だけ ここ"]
    ].forEach(([needle, label]) => ok(v.includes(needle), label + "が 門の中で 出ない"));
    // ★★⑫だけは、★門の中だけでなく、★誰にも 出さないことに なりました。
    // ★★注記を 外して 数えます。★上の 註に、★その語が 出てきます（★8回目）。
    const vCode = readCode("components", "VocalTracker.jsx");
    ok(!/もう少しで「/.test(vCode), "★「もう少しで◯◯が 加わります」が、もう 無い");
    ok(!/countedSectionTotal/.test(vCode), "★点8つの 分母も、もう 無い");
    ok(/dateBand=\{dateBandNode\}/.test(v), "★日付の帯は 門の中では 題の 近く");
    ok((v.match(/const dateBandNode = \(/g) || []).length === 1,
      "★日付の帯の 中身は 1つだけ（★2つ 作っていない）");
    // ★★切替を 出さないので、★中が 空に ならないよう しっかり として 読みます。
    ok(/const recordModeInUse = layoutV2 \? "full" : profile\.record_mode;/.test(v),
      "★門の中では しっかり として 読む（★折りたたみの 中が 空に ならない）");
    ok(/mode: recordModeInUse/.test(v), "★節の 出し分けが その 値を 使っている");
    // ★★保存の ボタンは、★開いている ときだけ。★消していません。
    ok(/\(!layoutV2 \|\| openFold\) && \(/.test(v),
      "★保存ボタンは、★折りたたみを 開いた ときだけ（★消していない）");
    // ★★節は 11 とも 折りたたみに 載っていること。
    //   ★載っていない節は、★閉じていても 出つづけます。
    const folds2 = require("fs").readFileSync(path.join(ROOT, "lib", "recordV2.js"), "utf8");
    const mapped = [...folds2.matchAll(/sections: \[([^\]]*)\]/g)]
      .flatMap((m) => m[1].split(",").map((x) => x.trim().replace(/"/g, ""))).filter(Boolean);
    const used = [...new Set([...v.matchAll(/fold="([a-zA-Z]+)"/g)].map((m) => m[1]))];
    ok(used.every((k) => mapped.includes(k)),
      "★節は ぜんぶ 折りたたみに 載っている  （載っていない: " +
      JSON.stringify(used.filter((k) => !mapped.includes(k))) + "）");
  }

  console.log("⑦ 門の外（38人）を 変えない");
  const v = readRaw("components", "VocalTracker.jsx");
  ok(/\{layoutV2 && formData && \(\s*<RecordV2Head/.test(v), "★新しい 頭は 門の中だけ");
  ok(/sectionIsOpen/.test(readRaw("lib", "recordV2.js")), "★節の 出し分けは 1か所");
  ok(/if \(!layoutV2\) return true;/.test(readRaw("lib", "recordV2.js")),
    "★門の外では、★節が ぜんぶ 出る");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
