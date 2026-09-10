// ============================================================================
// A01「きょう ／ 生徒」を、★見本に そろえた ことの 見張り
//
//   ★出どころ docs/design/pack/screens/A01-きょう生徒.html（★HTML が 正）
//            docs/design/pack/tokens.md（tokens-2026-09-10）
//
//   ★★確かめること
//     ① 見本の 値（大きさ・太さ・角・間）が lib/uiKit.js に 1か所だけ あること。
//     ② 門の中の 画面で、★明朝（.ff-display）を 使っていないこと。
//     ③ ねむりが、★数と 単位に 分かれていること。
//     ④ 下の タブが、★5つ 等分・流れない・絵の印なし であること。
//     ⑤ 押せるところが 44px を 下回らないこと。
//     ⑥ 門の外（38人）の 画面が 1つも 変わっていないこと。
//
//   ★★見本の 側も 一緒に 読みます。
//     ★見本の 数が 変わったのに 実装が 変わらない、★その 逆、★どちらも 見つけます。
//     ★★数を この見張りに 書き写すだけでは、★写した 時点で 2か所に なります。
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
  const MIHON = path.join(ROOT, "docs", "design", "pack", "screens", "A01-きょう生徒.html");

  console.log("⓪ 見本が 手元に ある");
  ok(fs.existsSync(MIHON), "★A01 の HTML が docs/design/pack/screens/ に ある");
  const mihon = fs.readFileSync(MIHON, "utf8");

  const src = fs.readFileSync(path.join(ROOT, "lib", "uiKit.js"), "utf8");
  // ★★lib/tokens.js を 取り込んでいるので、★そのまま import できません。
  //   ★色は 形の 話に 効かないので、★C を 差し替えて 読みます。
  const stub = src.replace(
    'import { C } from "@/lib/tokens";',
    'const C = { ink: "#000", inkSoft: "#666", card: "#fff", line: "#ccc", curtain: "#7A1F2B", gold: "#8C6115" };'
  );
  const kit = await import("data:text/javascript;base64," + Buffer.from(stub).toString("base64"));

  console.log("① 見本の 値と、lib/uiKit.js が 合っている");
  // ★見本の CSS から 直に 取り出します。★書き写しません。
  function cssNum(sel, prop) {
    const re = new RegExp("\\" + sel + "\\{([^}]*)\\}");
    const m = re.exec(mihon);
    if (!m) return null;
    const n = new RegExp(prop + ":\\s*(-?[0-9.]+)").exec(m[1]);
    return n ? Number(n[1]) : null;
  }
  // ★★2026-09-11。★TYPE の 文字の 大きさを rem に 替えました。
  //   ★理由は「文字の大きさ」の 設定が px では 1つも 効かなかったからです。
  //   ★見張りは「見本の 数と 合っているか」を 見ます。★書き方は 見ません。
  //     ★"1.625rem" → 26 に 直してから くらべます（1rem ＝ 16px）。
  function px(v) {
    if (typeof v === "number") return v;
    const m = /^([0-9.]+)rem$/.exec(String(v));
    return m ? Number(m[1]) * 16 : null;
  }
  ok(cssNum(".big", "font-size") === px(kit.TYPE.big.fontSize), "★大きな数字 26px");
  ok(cssNum(".big s", "font-size") === px(kit.TYPE.bigUnit.fontSize), "★その 単位 12px");
  ok(cssNum(".h3", "font-size") === px(kit.TYPE.h3.fontSize), "★小見出し 10.5px");
  ok(cssNum(".btn", "font-size") === px(kit.TYPE.btn.fontSize), "★主ボタン 16px");
  ok(cssNum(".mini", "font-size") === px(kit.TYPE.mini.fontSize), "★カードの 小見出し 11.5px");
  ok(cssNum(".usu", "font-size") === px(kit.TYPE.usual.fontSize), "★あなたのふだん 11px");
  ok(cssNum(".card", "border-radius") === kit.RADIUS.card, "★カードの 角 14");
  ok(cssNum(".btn", "border-radius") === kit.RADIUS.btn, "★主ボタンの 角 13");
  ok(cssNum(".speak", "border-radius") === kit.RADIUS.speak, "★ひとことの 角 16");
  ok(cssNum(".card", "margin-bottom") === kit.SPACE.cardGap, "★カードどうし 9px");
  const tabsFlex = /\.tabs\{[^}]*flex:\s*0\s+0\s+([0-9.]+)px/.exec(mihon);
  ok(tabsFlex && Number(tabsFlex[1]) === kit.TAB_BAR_HEIGHT, "★下の タブ 56px");
  ok(kit.SPACE.tapMin === 44, "★押せるところは 44 以上（tokens.md §5）");
  // ★★羊の 割合を、★見本の CSS から 直に 出します（★書き写しません）。
  //   .sheep{width:186px} ／ .ph{width:360px} ／ .bd{padding:0 15px}
  //   ★羊が 入っているのは 本文の 列＝360 − 15×2 ＝ 330 です。
  {
    const sheepW = cssNum(".sheep", "width");
    const phW = cssNum(".ph", "width");
    const bdPad = /\.bd\{[^}]*padding:\s*0\s+([0-9.]+)px/.exec(mihon);
    ok(sheepW && phW && bdPad, "★見本から 羊と 画面の 幅が 読めた");
    const colW = phW - Number(bdPad[1]) * 2;
    ok(Math.abs(kit.SHEEP_WIDTH_RATIO - sheepW / colW) < 1e-9,
      "★羊の 割合が 見本と 合っている（★列に 対して " + (sheepW / colW * 100).toFixed(1) + "%）");
    ok(Math.abs(sheepW / phW - 0.517) < 0.001,
      "★画面に 対しては 51.7%（★坂本さんの お決めの 数）");
  }

  console.log("② 明朝を 使わない（tokens.md §2）");
  // ★★2026-09-09 の 実機で、★ねむりが「6時間o分」と 出ていました。
  //   ★Cormorant の 0 は 背の低い 旧式数字で、★小文字の o に 見えます。
  //   ★★.ff-display を 画面の 数字に 使ったのが 原因でした。
  ["HomeV2.jsx", "TabBarV2.jsx"].forEach((f) => {
    ok(!/ff-display/.test(readCode("components", f)), "★" + f + " に .ff-display が ない");
  });
  ok(/Hiragino Sans/.test(readRaw("lib", "uiKit.js")), "★書体は ゴシックで 決めてある");
  ok(/FONT_STACK/.test(readRaw("components", "HomeV2.jsx")),
    "★HomeV2 が 書体を 押さえている（★親から 明朝が 降りてこない）");

  console.log("③ ねむりが 数と 単位に 分かれる");
  const cardSrc = fs.readFileSync(path.join(ROOT, "lib", "todayCard.js"), "utf8");
  const card = await import("data:text/javascript;base64," + Buffer.from(cardSrc).toString("base64"));
  const parts = card.sleepParts(6.34);
  ok(Array.isArray(parts) && parts.length === 2, "★2つに 分かれる");
  ok(parts[0].n === "6" && parts[0].u === "時間", "★6 ／ 時間");
  ok(parts[1].n === "20" && parts[1].u === "分", "★20 ／ 分");
  ok(card.sleepParts(5.999)[0].n === "6" && card.sleepParts(5.999)[1].n === "0",
    "★59分59秒を「5時間60分」と 書かない");
  ok(card.sleepWord(6.34) === "6時間20分", "★言葉の ほうは これまでどおり");
  ok(card.sleepParts(0) === null && card.sleepParts(null) === null, "★無ければ null");

  console.log("④ 下の タブ（★A01〜A09 の .tabs）");
  const bar = readRaw("components", "TabBarV2.jsx");
  ok(/flex: "1 1 0"/.test(bar), "★5つ 等分");
  ok(!/overflow-x|overflowX/.test(bar), "★横に 流れない");
  ok(/whiteSpace: "nowrap"/.test(bar), "★2行に 折り返さない");
  // ★★見本の .tb には 絵の印が ありません（★tokens.md §8「アイコンは まだ ありません」）。
  ok(!/tab\.icon|<[A-Z][A-Za-z]* size=/.test(readCode("components", "TabBarV2.jsx")),
    "★絵の印を 置かない");
  ok(/TAB_BAR_HEIGHT/.test(bar), "★高さは lib/uiKit.js から もらう");
  // ★★選ばれていない ときも、★線の 場所を 取ります。
  //   ★取らないと、★押すたびに 文字が 上下に 跳ねます。
  ok(/background: on \? C\.curtain : "transparent"/.test(bar), "★選ばれた 印は 線の 色だけ");

  console.log("⑤ 歯車 ── 見た目 26px ／ 押せるところ 44px");
  //   ★★丸そのものは components/UiV2.jsx の HeadRound です（★44画面で 同じ）。
  //     ★A01・A06・A07・A09 が、★⚙ ／ ＋ ／ × を 差し替えて 使います。
  const home = readRaw("components", "HomeV2.jsx");
  const round = readRaw("components", "UiV2.jsx");
  ok(/<HeadRound mark="⚙"/.test(home), "★A01 の 頭に 歯車が ある");
  ok(/width: SPACE\.tapMin, height: SPACE\.tapMin/.test(round), "★押せるところは 44");
  ok(/width: 26, height: 26, borderRadius: "50%"/.test(round), "★見えるのは 26 の 丸");

  console.log("⑥ 門の外（38人）を 変えない");
  const v = readRaw("components", "VocalTracker.jsx");
  ok(/if \(layoutV2\) \{[\s\S]{0,600}?<TabBarV2/.test(v), "★新しい 帯は 門の中だけ");
  ok(/max-w-3xl mx-auto mt-5 flex items-center gap-1/.test(v),
    "★門の外の 帯は これまでどおり 上に ある");
  ok(/overflow-x-auto nav-scroll/.test(v), "★門の外の 帯は これまでどおり 流れる");
  const band = readRaw("components", "TodayBand.jsx");
  ok(/sheepFirst = false, v2 = false/.test(band), "★帯の 見本の服は 既定で 着ない");
  ok(/if \(v2\) return renderV2\(r\)/.test(band), "★v2 のときだけ 見本の服");
  // ★★出す行を 決めているのは、★どちらの 服でも buildBand です。
  //   ★決めが 2つに 割れていないこと。
  ok((band.match(/buildBand\(/g) || []).length === 1, "★出す行の 決めは 1か所（buildBand）");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
