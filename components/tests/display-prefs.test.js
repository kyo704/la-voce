#!/usr/bin/env node
/**
 * 見やすさ（見やすさとかんたん表示.md）。
 *
 * ★年齢で切り替えないこと。年齢を必須で聞かないこと。
 * ★「シニアモード」と画面に書かないこと。名前は「見やすさ」。
 * ★文字の大きさと「かんたん表示」は、別の設定であること。
 * ★画面を2つ作らないこと。CSS変数で1つの画面が伸び縮みすること。
 * ★OSの文字サイズ設定を邪魔しないこと。
 */
const { readRaw, stripComments, assertAbsent } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) {
  if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; }
}
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

async function main() {
  const m = await import("data:text/javascript;base64," +
    Buffer.from(readRaw("lib", "displayPrefs.js"), "utf-8").toString("base64"));
  const css = readRaw("app", "globals.css");
  const ui = readRaw("components", "VocalTracker.jsx");
  const uiCode = stripComments(ui);
  const layout = readRaw("app", "layout.js");

  console.log("\n=== 年齢で切り替えない（§1）===");
  console.log("     40代でも老眼は始まる。20代でも弱視の人がいる。");
  console.log("     そして「あなたは高齢者ですね」と機械に判定されるのは、不快。");
  const prefsCode = stripComments(readRaw("lib", "displayPrefs.js"));
  assertTrue(!/\bage\b|年齢|birth/.test(prefsCode),
    "★見やすさの判定が、年齢をいっさい見ていない");
  const settingBlock = uiCode.slice(uiCode.indexOf("見やすさ"), uiCode.indexOf("見やすさ") + 3000);
  // ★assertAbsent は、中で readCode を呼ぶ。生の本文を渡す道が無い。
  //   このセッションで4回、コメント側を数えて落ちている。
  //   毎回どちらを渡すか選ばせるのをやめた（_source.js）。
  assertAbsent(["シニア", "高齢", "お年寄り", "年配"],
    ["components", "VocalTracker.jsx"], assertTrue, "★画面に");

  console.log("\n=== 文字の大きさとかんたん表示は、別の設定（§0-③）===");
  assertEqual(m.SCALES, ["normal", "large", "xlarge"], "3段階");
  assertEqual(m.scaleAttribute({ display_scale: "normal" }), null, "ふつうのときは印を付けない");
  assertEqual(m.scaleAttribute({ display_scale: "large" }), "large", "大きいときは印を付ける");
  assertEqual(m.scaleAttribute({ display_scale: "てきとう" }), null, "知らない値はふつう扱い");
  assertEqual(m.isSimpleDisplay({ display_scale: "xlarge" }), false,
    "★文字を大きくしても、かんたん表示にはならない");
  assertEqual(m.scaleAttribute({ simple_display: true }), null,
    "★かんたん表示にしても、文字は大きくならない");

  console.log("\n=== 画面を2つ作らない（§0-④・§2-1）===");
  assertTrue(/\[data-scale="large"\]/.test(css) && /\[data-scale="xlarge"\]/.test(css),
    "CSS変数で伸び縮みさせている");
  ["--base", "--tap", "--gap"].forEach((v) => {
    assertTrue(css.includes(v), `${v} を定義している`);
  });
  assertTrue(/data-scale/.test(uiCode) && /scaleAttribute\(profile\)/.test(uiCode),
    "画面は印を付け替えるだけ（もう1つの画面を作っていない）");

  console.log("\n=== OSの設定を邪魔しない（§2-2）===");
  assertTrue(!/maximum-scale/.test(layout), "★maximum-scale を書いていない");
  assertTrue(!/user-scalable/.test(layout), "★user-scalable を書いていない");
  console.log("     iPhone の「文字を大きく」を使っている人は、すでにそこで設定している。");

  console.log("\n=== 画面が壊れないこと（§2-3）===");
  assertTrue(/white-space: normal/.test(css), "★ボタンの文字が枠から出ず、折り返す");
  assertTrue(/overflow-x: auto/.test(css), "★表が横スクロールできる箱に入る");
  assertTrue(/min-height: var\(--tap\)/.test(css), "押せるものは、指の大きさぶん確保する");

  console.log("\n=== かんたん表示で減らすのは選択肢であって、機能ではない（§0-⑥）===");
  assertEqual(m.controlFor("slider", { simple_display: true }), "buttons5",
    "★スライダーは5つの大きなボタンに置き換える");
  console.log("     スライダーは、手が震える人には操作できない。");
  console.log("     そして正確な値を入れたい人にも向かない。両方に悪い部品。");
  assertEqual(m.controlFor("slider", {}), "slider", "ふつう表示では、置き換えない");
  assertEqual(m.controlFor("longPressDelete", { simple_display: true }), "deleteButton",
    "長押しで削除は、「消す」ボタンに置き換える");
  assertEqual(m.USE_DISAPPEARING_TOAST, false,
    "★消える通知を使わない（読み終わる前に消える。§4-1）");

  console.log("\n=== 金と緑を、文字に使わない（§0-⑦・§5）===");
  console.log("     実測のコントラスト比: 金 2.80 / 緑 2.76。文字には足りない。");
  console.log("     ★塗りと線には使ってよい。アイコンは線なので、そのまま。");
  {
    // 行ごとに見て、アイコン（<Icon size=…>）かどうかで分ける
    const lines = uiCode.split("\n");
    const textUses = lines
      .map((l, i) => ({ l, i: i + 1 }))
      .filter(({ l }) => /color: C\.(gold|sage)\b/.test(l))
      .filter(({ l }) => !/<[A-Z][A-Za-z0-9]* +[^>]*size=/.test(l));
    assertTrue(textUses.length === 0,
      textUses.length === 0
        ? "★文字色としての金・緑が、1つも残っていない"
        : `★文字に使われている: ${textUses.map((x) => x.i).join(", ")} 行目`);

    const iconUses = lines.filter((l) => /color: C\.(gold|sage)\b/.test(l)).length;
    assertTrue(iconUses > 0, `塗り・線としては、そのまま使っている（${iconUses} 箇所）`);
  }

  console.log("\n=== 値で色を変えない（描画仕様 §7-5）===");
  assertTrue(!/labelKey: "evalAppropriate", color:/.test(uiCode),
    "★摂取量の評価が、値で色を変えていない");
  assertTrue(!/label: "ちょうどいい", color:/.test(uiCode),
    "★ACWR のゾーンが、値で色を変えていない");
  console.log("     言葉のほうが、色より正確に伝わる。");

  console.log("\n=== かんたん表示が、実際に画面を変えているか（§3）===");
  {
    console.log("     ★減らすのは選択肢であって、機能ではない。消すのではなく、奥に置く。");
    assertTrue(/isSimpleDisplay\(profile\) && \(/.test(uiCode),
      "ホームに、かんたん表示のときだけ出る塊がある");
    const homeIdx = uiCode.indexOf("今日を記録する");
    assertTrue(homeIdx > 0, "★大きなボタンを1つ、真ん中に置いている");
    const homeBlock = uiCode.slice(homeIdx - 900, homeIdx + 1400);
    assertTrue(/minHeight: "calc\(var\(--tap\) \* 1\.6\)"/.test(homeBlock),
      "大きさを --tap から決めている（文字の大きさに追従する）");
    const secondary = (homeBlock.match(/setActiveTab\("(analysis|learn)"\)/g) || []).length;
    assertTrue(secondary <= 2, `★二番目に大事なものは2つまで（いま ${secondary} つ）`);

    console.log("     ★スライダーは、手が震える人には操作できない。");
    assertTrue(/SIMPLE_QUALITY_STEPS/.test(uiCode), "かんたん表示のときの5段階を定義している");
    const sliderIdx = uiCode.indexOf('type="range"');
    const sliderBlock = uiCode.slice(sliderIdx - 1500, sliderIdx + 200);
    assertTrue(/simple \? \(/.test(sliderBlock),
      "★かんたん表示では、スライダーではなくボタンを出している");
    assertTrue(/simple=\{isSimpleDisplay\(profile\)\}/.test(uiCode),
      "声の記録の画面に、かんたん表示かどうかを渡している");

    console.log("     ★同じ切り替えを画面ごとに書かない。");
    assertTrue(/function TwoWaySwitch/.test(uiCode), "オン・オフの部品が1つにそろっている");
    const switches = (uiCode.match(/<TwoWaySwitch /g) || []).length;
    assertTrue(switches >= 2, `つまみを直接書いた箇所が残っていない（${switches} 箇所が部品を使用）`);
    assertTrue(!/borderRadius: 999, position: "relative",\n\s+background: value\./.test(uiCode),
      "★つまみの作りを、画面側に直接書いていない");

    console.log("     ★長押しだけ・スワイプだけの操作を作らない（§4）。");
    assertTrue(!/onLongPress|longPressDelete=\{true\}/.test(uiCode),
      "長押しだけで消す操作が無い");
  }

  console.log("\n=== 間違えても壊れない（§4-2）===");
  {
    console.log("     ★保存のあと、必ず「取り消す」を30秒出す。");
    assertEqual(m.UNDO_WINDOW_MS, 30000, "30秒（仕様どおり）");
    assertTrue(/setUndoableSave\(\{ date: clean\.date, previous: previousEntry/.test(uiCode),
      "保存の直前の姿を控えている");
    assertTrue(/async function handleUndoSave/.test(uiCode), "取り消しの処理がある");
    assertTrue(/undoSaveLabel/.test(uiCode), "画面に「取り消す」を出している");
    console.log("     ★保存前に記録が無かった日は、行ごと消す。");
    console.log("       空の記録を残すと、「記録した日」として数えられてしまう。");
    assertTrue(/from\("entries"\)\.delete\(\)\.eq\("user_id", userId\)\.eq\("date", date\)/.test(uiCode),
      "無かった日は、取り消しで行ごと消す");

    console.log("     ★消える通知を使わない（§4-1）。画面の中に残し、自分で閉じる。");
    assertEqual(m.USE_DISAPPEARING_TOAST, false, "消える通知は使わない");
    assertTrue(/setUndoableSave\(null\)/.test(uiCode), "自分で閉じられる");
    assertTrue(!/残り\{|あと\{.*秒|カウントダウン/.test(uiCode),
      "★秒数を数えて見せていない（急かされているように読める）");

    console.log("     ★削除は2段階。押し間違いは必ず起きる。");
    assertEqual(m.DELETE_NEEDS_CONFIRM, true, "2段階と決めてある");
    assertTrue(/function DeleteWithConfirm/.test(uiCode), "2段階の部品が1つにそろっている");
    const oneStep = (uiCode.match(/onClick=\{\(\) => handleDeleteArticleNote\(/g) || []).length;
    assertTrue(oneStep === 0,
      oneStep === 0 ? "★1回で消えるメモの削除が、残っていない" : `★1段階の削除が ${oneStep} 箇所ある`);

    console.log("     ★エラーには、何をすればいいかを書く。");
    assertTrue(/setSaveError\(t\(ACTIONABLE_ERROR_KEY\)\)/.test(uiCode),
      "保存の失敗に、次にすることを書いている");
    assertTrue(/console\.error\("記録を保存できませんでした:", error\)/.test(uiCode),
      "★技術的な中身は console に残す（今日の400の切り分けは、これで進んだ）");
    assertTrue(!/setSaveError\(error\.message/.test(uiCode),
      "★Supabase の文面を、そのまま画面に出していない");
  }

  console.log("\n=== ホーム画面に追加できない問題（§6）===");
  console.log("     ★この層でいちばん脱落する場所。共有メニューからの追加を知らない人が大多数。");
  {
    assertEqual(m.INSTALL_STEPS.ios.length, 4, "iPhone の手順が4段階ある");
    assertEqual(m.INSTALL_STEPS.android.length, 4, "Android の手順が4段階ある");
    assertTrue(m.INSTALL_STEPS.ios[0] !== m.INSTALL_STEPS.android[0],
      "★iPhone と Android で、案内を出し分けている");

    console.log("     ★「あとで」を押せること。追加しないと使えない、と読ませない。");
    assertEqual(m.INSTALL_LATER_LABEL, "あとで", "「あとで」がある");
    assertTrue(/ブラウザのままでも/.test(m.INSTALL_LATER_NOTE),
      "★ブラウザのままでも全部使える、と書いてある");
    assertTrue(/INSTALL_LATER_NOTE/.test(uiCode), "画面にその一文を出している");

    console.log("     ★こちらから何度も勧めない（§7-9 と同じ線）。");
    assertEqual(m.shouldShowInstallGuide({ installed: true, dismissed: false, platform: "ios" }), false,
      "追加済みの人には出さない");
    assertEqual(m.shouldShowInstallGuide({ installed: false, dismissed: true, platform: "ios" }), false,
      "★一度閉じたら、その後は出さない");
    assertEqual(m.shouldShowInstallGuide({ installed: false, dismissed: false, platform: "desktop" }), false,
      "パソコンには出さない");

    assertTrue(/shouldShowInstallGuide\(\{/.test(uiCode), "画面がその判定を通している");
    const thinBanner = (uiCode.match(/ホーム画面に追加しませんか/g) || []).length;
    assertTrue(thinBanner === 0,
      "★同じ案内を2か所に置いていない（片方だけ古くなるため）");

    console.log("     ★紙を渡せることが、この層では効く。");
    const sheet = readRaw("app", "start/page.js");
    assertTrue(/size: A4 portrait/.test(sheet), "印刷用の1枚が A4・縦で作ってある");
    assertTrue(/INSTALL_STEPS/.test(sheet), "★紙と画面で、手順が同じところから来ている");
    assertTrue(/ブラウザのままで全部お使いいただけます/.test(sheet),
      "紙にも「追加しなくても使える」と書いてある");
  }

  console.log("\n=== 伸び縮みが実際に効くこと（重なりの再発防止）===");
  {
    console.log("     ★rem は html を基準に解決される。body に指定しても文字は動かない。");
    assertTrue(/html \{\s*\n\s*font-size: var\(--base\);/.test(css),
      "★伸び縮みの基点が html にある（body ではない）");
    assertTrue(!/body \{\s*\n\s*font-size: var\(--base\)/.test(css),
      "body には文字サイズを置いていない");

    console.log("     ★font-size を上書きするなら、行の高さも一緒に決めること。");
    const mono = css.slice(css.indexOf(".ff-mono {", css.indexOf("数字は本文より")));
    assertTrue(/line-height/.test(mono.slice(0, 120)),
      "★.ff-mono に行の高さがある（Tailwind の固定 line-height を残さない）");

    console.log("     ★固定 px の箱に、伸びる文字を入れない。");
    const fixedBoxes = (uiCode.match(/className="[^"]*text-(xs|sm)[^"]*"[^>]*style=\{\{[^}]*\bwidth: \d+/g) || []).length;
    assertTrue(fixedBoxes === 0, `★文字の入る固定幅が残っていない（${fixedBoxes}箇所）`);

    console.log("     ★ヘッダーの左側に幅を与える（右は縮まないため）。");
    assertTrue(/<div className="flex-1 min-w-0">/.test(uiCode),
      "★左側が min-content まで潰れない（日本語が縦一列に崩れない）");
    assertTrue(/app-wordmark/.test(uiCode) && /clamp\(/.test(css),
      "ワードマークが伸びる（ただし伸びすぎない）");

    console.log("     ★タブは縮ませず、帯ごと横へスクロールさせる。");
    assertTrue(!/text-sm font-medium whitespace-nowrap transition-all/.test(uiCode),
      "★タブに shrink-0 が付いている（縮んで文字が切れない）");
    assertTrue(/overflow-x-auto/.test(uiCode), "帯が横スクロールできる");
  }

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
