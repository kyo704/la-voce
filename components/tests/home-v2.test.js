// ============================================================================
// 「きょう」の画面（見本①）の 見張り
//
//   ★出どころ Woolsong 画面の見本（2026年9月9日）① きょう／生徒
//
//   ★★確かめること
//     ① lib/todayCard.js の 言葉と 数が、★見本のとおりであること。
//     ② 足りないときは、★null を返し、★「データ不足」と 書かないこと。
//     ③ HomeV2 が、★グラフを 1つも 置かないこと。
//     ④ HomeV2 が、★門（layoutV2）の 中でだけ 呼ばれていること。
//     ⑤ これまでの ホームが、★門の外に 残っていること（★38人の画面を変えない）。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}
function eq(a, b, label) { ok(a === b, label + "  （得た値: " + JSON.stringify(a) + "）"); }

(async () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "todayCard.js"), "utf8");
  const mod = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const { conditionWord, sleepWord, median, usualOf, USUAL_MIN_DAYS, USUAL_WINDOW_DAYS } = mod;

  console.log("① こえの調子の 言葉");
  eq(conditionWord(5), "出た", "5 は 出た");
  eq(conditionWord(4), "出た", "4 は 出た");
  eq(conditionWord(3), "ふつう", "3 は ふつう");
  eq(conditionWord(2), "出づらい", "2 は 出づらい");
  eq(conditionWord(1), "出づらい", "1 は 出づらい");
  eq(conditionWord(null), null, "無いときは null");
  eq(conditionWord("4"), null, "字は 数として 読まない");

  console.log("② ねむりの 言葉");
  eq(sleepWord(6.5), "6時間30分", "6.5 は 6時間30分");
  eq(sleepWord(7), "7時間0分", "7 は 7時間0分");
  eq(sleepWord(null), null, "無いときは null");

  console.log("③ まんなかの値");
  eq(median([1, 2, 3]), 2, "奇数個");
  eq(median([1, 2, 3, 4]), 2.5, "偶数個");
  eq(median([]), null, "空は null");

  console.log("④ あなたのふだん");
  const mk = (n, v) => {
    const out = {};
    for (let i = 1; i <= n; i++) {
      const d = new Date(Date.UTC(2026, 8, 9) - i * 86400000).toISOString().slice(0, 10);
      out[d] = { throatCondition: v };
    }
    return out;
  };
  eq(usualOf(mk(4, 3), "2026-09-09", (e) => e.throatCondition), null,
    "4日では 出しません（★" + USUAL_MIN_DAYS + "日 必要）");
  eq(usualOf(mk(5, 3), "2026-09-09", (e) => e.throatCondition), 3, "5日 あれば 出します");
  const withToday = mk(5, 3);
  withToday["2026-09-09"] = { throatCondition: 1 };
  eq(usualOf(withToday, "2026-09-09", (e) => e.throatCondition), 3, "きょうは 混ぜません");
  const tooOld = {};
  for (let i = 1; i <= 8; i++) {
    const d = new Date(Date.UTC(2026, 8, 9) - (i + 40) * 86400000).toISOString().slice(0, 10);
    tooOld[d] = { throatCondition: 3 };
  }
  eq(usualOf(tooOld, "2026-09-09", (e) => e.throatCondition), null,
    "★" + USUAL_WINDOW_DAYS + "日より 前は 数えません");

  console.log("⑤ 見本の 決まり");
  const home = readCode("components", "HomeV2.jsx");
  ok(!/データ不足|足りません|記録が少/.test(home), "「データ不足」と 書かない");
  ok(!/recharts|<svg|LineChart|BarChart|Sparkline/.test(home), "グラフを 1つも 置かない");
  ok(!/\/100|点\b|score/i.test(home.replace(/onRecord|records?/gi, "")), "点数を 出さない");
  ok(!/あと\s*\d|あと[０-９]/.test(home), "「あと◯」と 数えない");

  console.log("⑨ 見本①に そろえる（★2026-09-10・実機のご指摘）");
  {
    const v = readRaw("components", "VocalTracker.jsx");
    const h = readRaw("components", "HomeV2.jsx");
    // ★① 帯は 下に
    //   ★★前は、★VocalTracker の 中の 書き方を そのまま 見ていました。
    //     ★帯を 別の 部品（TabBarV2）に 出した とたん、★落ちました。
    //     ★★中身は 何も 悪く なっていないのに、★見張りが 落ちる ── ★見張りの ほうが
    //       ★「どう 書いてあるか」を 見て、★「どう なるか」を 見ていませんでした。
    //   ★★だから、★どの 部品に 書いてあっても 通るように 直します。
    const bar = readRaw("components", "TabBarV2.jsx");
    ok(/position: "fixed"/.test(bar) && /bottom: 0/.test(bar), "★帯は 画面の 下");
    ok(/paddingBottom: `calc\(\$\{TAB_BAR_HEIGHT \+ 16\}px \+ env\(safe-area-inset-bottom\)\)`/.test(v),
      "★最後の1枚が 帯に 隠れない");
    ok(/import \{ TAB_BAR_HEIGHT \} from "@\/lib\/uiKit"/.test(v),
      "★帯の 高さは 1か所（lib/uiKit.js）から 来る");
    // ★② 並び
    ok(/TABS_V2_ORDER = \["home", "today", "analysis", "notes", "garden"\]/.test(v),
      "★きょう／記録／ふりかえる／ノート／ひつじ の 順");
    // ★③ 羊の 大きさ
    //   ★★前は「120 であること」を 見ていました。
    //     ★2026-09-10、★坂本さんが「見本の サイズ（51.7%）に 合わせて」と
    //     ★お決めに なりました。★見張りが 古い 判断を 抱えたままでした。
    //   ★★数では なく、★「1か所から 来ていること」を 見ます。
    //     ★見本の 割合そのものは a01-kyou.test.js が 見本の HTML と 突き合わせます。
    ok(/SHEEP_WIDTH_RATIO/.test(h), "★羊の 大きさは lib/uiKit.js の 割合から 来る");
    ok(!/size=\{\d+\}/.test(h), "★px を 直に 書いていない");
    // ★★測っていないこと（★2026-09-10・3度目の 直し）。
    //   ★★1度目 useEffect、★2度目 callback ref ── ★どちらも 大きく なりませんでした。
    //   ★★SheepDressed の size は 1か所（外側の div の width/height）だけです。
    //     ★中の 品は ぜんぶ ％です。★だから "100%" で 足ります。
    //   ★★測る 手が 無ければ、★測り損ねる 道も ありません。
    // ★★4度目の 直しです（★2026-09-10）。
    //   ① useEffect で 測る　★入れ物より 先に 走った
    //   ② callback ref で 測る ★効かなかった
    //   ③ size="100%"　　　　★効かなかった
    //   ④ CSS 1つの 式　　　★親の 高さを 尋ねない・測らない・％も 使わない
    //   ★★①②③ とも、★組み上がった ものには 正しく 入っていました。
    //     ★配信も 一致していました。★連鎖の どこかで 高さが 決まらなかった、
    //     ★という ところまでしか 分かっていません。
    //   ★★だから、★連鎖そのものを 断ちました。
    ok(/size=\{sheepCssSize\(ratio\)\}/.test(h), "★羊の 大きさは 1つの 式から 来る");
    // ★★注記を 外して 数えます。★上の 注記に、★その語が 出てきます（★7回目）。
    const hCode = readCode("components", "HomeV2.jsx");
    ok(!/ResizeObserver|clientWidth|useEffect|useRef/.test(hCode), "★測る しかけを 持っていない");
    ok(!/aspectRatio/.test(hCode), "★親の 高さに 頼っていない");
    // ★★式そのものは lib/uiKit.js が 持ちます。★実際に 動かして 確かめます。
    {
      const src = readRaw("lib", "uiKit.js");
      const m = src.match(/export function sheepCssSize[\s\S]*?\n}/);
      ok(!!m, "★式が lib/uiKit.js に ある");
      const f = new Function("SHEEP_WIDTH_RATIO", m[0].replace("export ", "") + "; return sheepCssSize;")(186 / 330);
      // ★画面 390px の とき、★見本の 51.7% に なること。
      const px = (390 - 32) * (186 / 330);
      ok(Math.abs(px / 390 - 0.517) < 0.01,
        "★画面 390px で、★見本の 51.7%（" + (px / 390 * 100).toFixed(1) + "%）");
      ok(/^min\(calc\(\(100vw - 32px\) \* [0-9.]+\), \d+px\)$/.test(f(186 / 330)),
        "★幅も 高さも 同じ 式（" + f(186 / 330) + "）");
    }
    // ★⑤ みつけたこと
    ok(/みつけたこと/.test(h), "★みつけたこと の 見出しが ある");
    ok(/topDiscoveries\.map/.test(v), "★中身は 分析の 側から もらう");
    // ★★禁じた語は、★注記を 外した本文で（★CLAUDE.md）。
    //   ★注記に「まだ何もありませんとは書きません」と 書いてあります。
    ok(!/まだ 何も ありません/.test(readCode("components", "HomeV2.jsx")),
      "★無いときに 責める言葉を 出さない");
  }

  console.log("⑧ 上の帯を 出さない（★2026-09-10・見本のとおり）");
  {
    const v = readRaw("components", "VocalTracker.jsx");
    // ★★見本①〜⑨の どれにも、★上に「Woolsong」は ありません。
    // ★★2026-09-10、★<header> ごと 消して、★下のタブまで 消しました。
    //   ★★タブは、★この <header> の 中に あります。
    //   ★★入れ物では なく、★中身（名乗りの行）を 選んで 消すこと。
    ok(/display: layoutV2 \? "none" : undefined/.test(v), "★門の中では、名乗りの行を 出さない");
    {
      // ★★<header> そのものに display:none が 付いていないこと
      const h = v.slice(v.indexOf("<header"), v.indexOf("<header") + 900);
      ok(!/display: layoutV2 \? "none"/.test(h), "★★<header> ごと 消していない（★タブが 消えます）");
      ok(/paddingTop: layoutV2/.test(h), "★名乗りが 無いぶん、上の余白を 詰めている");
    }
    {
      // ★★タブが <header> の 中に あること（★消してはいけない わけ）
      const hs = v.indexOf("<header");
      const nav = v.indexOf("displayTabs.filter", hs);
      const close = v.indexOf("</header>", hs);
      ok(nav > hs && nav < close, "★★下のタブは <header> の 中に ある（★だから 帯ごと 消せない）");
    }
    // ★★門の外（38人）には、★これまでどおり あること
    ok(/app-wordmark/.test(v), "★名乗りそのものは 消していない（★門の外に 残る）");
    ok(/\{!layoutV2 \? \(\s*\n\s*<>\s*\n\s*<h1 className="ff-display italic app-wordmark/.test(v),
      "★名乗りは 門の外だけ");
    // ★★道を 消してから 作らないこと
    //   ★言語を 選ぶ 口が、★上の帯にしか ありませんでした。★先に 移しました。
    const more = v.slice(v.indexOf('activeTab === "more" && ('), v.indexOf('activeTab === "more" && (') + 1600);
    ok(/setLanguage/.test(more), "★ことばの選びが「もっと」に ある");
    ok(/minHeight: 44/.test(more), "★44pt 以上");
    // ★見出しと 歯車は、中の画面が 出すこと
    //   ★★頭の 形そのものは components/UiV2.jsx（★44画面で 同じ）です。
    //     ★出すことを 決めているのは HomeV2 の ままです。★そこを 見ます。
    const h = readRaw("components", "HomeV2.jsx");
    ok(/<ScreenHead title="きょう"/.test(h), "★見出し「きょう」は HomeV2 が 出す");
    ok(/label="もっとを開く"/.test(h), "★歯車も HomeV2 が 出す");
  }

  console.log("⑦ きょうの帯（★第2便・§3-2）");
  {
    const h = readRaw("components", "HomeV2.jsx");
    // ★★写しを 作らないこと。★帯は 1つです。
    ok(/<TodayBand/.test(h), "★門の中でも、同じ TodayBand を 呼んでいる");
    ok(!/todayLessons|upcoming/.test(h), "★手書きの 予定の 写しが 残っていない");
    ok(!/きょうの レッスンは ありません|予定は ありません/.test(readCode("components", "HomeV2.jsx")),
      "★無いことを 書かない（★催促に しない）");
    // ★★門の外と 同じ値を 渡していること
    const v = readRaw("components", "VocalTracker.jsx");
    const inner = v.slice(v.indexOf("activeTab === \"home\" && layoutV2"),
      v.indexOf("activeTab === \"home\" && !layoutV2"));
    ["lessons:", "teaching:", "performances", "orgEvents", "unsent:", "onAttend:"].forEach((k) => {
      ok(inner.includes(k), `★帯に「${k}」を 渡している`);
    });
    ok(/unsentQueue\.unsentCount/.test(inner), "★未送信の数も、門の中に 出る");
    ok(/handleAttendance/.test(inner), "★出欠を 押せる（★先生のとき）");
  }

  console.log("⑥ 門（★38人の画面を 変えない）");
  const vt = readRaw("components", "VocalTracker.jsx");
  ok(/activeTab === "home" && layoutV2 && \(\s*\n\s*<HomeV2/.test(vt),
    "HomeV2 は layoutV2 の 中でだけ 出る");
  ok(vt.includes('activeTab === "home" && !layoutV2 && (() => {'),
    "これまでの ホームが 門の外に 残っている");
  ok(!/import HomeV2[\s\S]{0,200}NEXT_PUBLIC_LAYOUT_V2_USER_IDS/.test(readCode("components", "HomeV2.jsx")),
    "HomeV2 じしんは 環境変数を 読まない（★決めるのは lib/layoutV2.js だけ）");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
