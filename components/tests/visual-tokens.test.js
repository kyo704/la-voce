// ============================================================================
// ★見た目の 土台の 見張り（★裁定 その78・その81・2026-09-18）
//
//   ★★見る の は 4つ です。
//     ★【一】★裁定の 数と、★手元の 数が 合って いる か
//     ★【二】★門の 外に こぼれて いない か（★`:root` に 置いて いない か）
//     ★【三】★読める か（★比を **その場で 測ります**。★書き写しません）
//     ★【四】★表の 貼り付けが 出て いる か
//
//   ★★★比は 測ります。★覚えません（★2026-09-16 の 決まり）。
//     ★★測った 数を 見張りに 書き写すと、★色を 直した 日に 古い 数が 残ります。
// ============================================================================

const { readCode, readRaw, loadLib } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

// ---------------------------------------------------------------------------
// ★比を 測る（★WCAG 2.x の 式。★W3C の 勧告 そのまま）
// ---------------------------------------------------------------------------
function 明るさ(hex) {
  const h = String(hex).replace("#", "");
  const 全 = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  const 値 = [0, 2, 4].map((i) => parseInt(全.slice(i, i + 2), 16) / 255)
    .map((c) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4)));
  return 0.2126 * 値[0] + 0.7152 * 値[1] + 0.0722 * 値[2];
}
function 比(a, b) {
  const x = 明るさ(a), y = 明るさ(b);
  return (Math.max(x, y) + 0.05) / (Math.min(x, y) + 0.05);
}

(async () => {
  const m = await loadLib("lib", "visualTokens.js");

  // -------------------------------------------------------------------------
  // 【一】★裁定の 数と 合って いる か
  //
  //   ★★裁定の 紙を **そのまま 読みます**。★こちらに 写しません。
  //     ★★写すと、★裁定が 直った 日に 気づけません。
  // -------------------------------------------------------------------------
  console.log("【一】裁定 その81 §1 の 数と 合って いる");
  const 裁定 = readRaw("docs", "opus", "visual-2026-09-18", "pack",
    "ruling-81-visual-design.md");
  t(裁定.length > 1000, "裁定の 紙が ある");

  // ★★明るい ほうの 宣言を、★紙から 拾います。
  const 明るい節 = 裁定.slice(裁定.indexOf(":root{"), 裁定.indexOf("html[data-th"));
  const 紙の明 = {};
  String(明るい節).replace(/--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})/g,
    (_, k, v) => { 紙の明[k] = v; return ""; });
  t(Object.keys(紙の明).length >= 20, "紙から 明るい 色を 読めた（" + Object.keys(紙の明).length + "）");

  // ★★★動かして よい のは、★`RULING_DEVIATIONS` に **書いて ある もの だけ** です。
  //   ★★書かずに 動かすと、★ここで 落ちます。
  //   ★★書いて ある ものは、★裁定の 値まで 一致を 見ます（★写し間違いを 防ぎます）。
  function 突き合わせ(theme, 紙, 手元) {
    Object.keys(紙).forEach((k) => {
      const 異 = m.deviationOf(theme, k);
      if (異) {
        t(String(異.ruling).toLowerCase() === String(紙[k]).toLowerCase(),
          theme + " --" + k + " ★動かした 記しの「裁定の 値」が 紙と 合って いる");
        t(String(手元[k] || "").toLowerCase() === String(異.used).toLowerCase(),
          theme + " --" + k + " ★動かした 先が 記しの とおり（" + 異.used + "）");
        t(!!異.why && !!異.fix, theme + " --" + k + " ★わけと 直し方が 書いて ある");
        return;
      }
      t(String(手元[k] || "").toLowerCase() === String(紙[k]).toLowerCase(),
        theme + " --" + k + " ＝ " + 紙[k]);
    });
  }
  突き合わせ("light", 紙の明, m.TOKENS_LIGHT);

  const 暗い節 = 裁定.slice(裁定.indexOf('html[data-th="dark"]'));
  const 紙の暗 = {};
  String(暗い節.slice(0, 暗い節.indexOf("```", 10))).replace(
    /--([a-z0-9-]+)\s*:\s*(#[0-9A-Fa-f]{3,8})/g, (_, k, v) => { 紙の暗[k] = v; return ""; });
  t(Object.keys(紙の暗).length >= 20, "紙から 暗い 色を 読めた（" + Object.keys(紙の暗).length + "）");
  突き合わせ("dark", 紙の暗, m.TOKENS_DARK);

  // ★★★明と 暗で、★名の 数が 同じ こと。
  //   ★★片方に しか 無い 名が あると、★暗い 画面で その 名が 明の まま 残ります。
  t(Object.keys(m.TOKENS_LIGHT).length === Object.keys(m.TOKENS_DARK).length,
    "明と 暗で 名の 数が 同じ");

  // -------------------------------------------------------------------------
  // 【二】★文字の 段
  // -------------------------------------------------------------------------
  console.log("【二】文字は 6段。★12px より 小さい 字を 使わない");
  t(m.TYPE_STEPS.length === 6, "6段 ある");
  t(m.TYPE_STEPS.every((s) => s.px >= m.MIN_FONT_PX), "どの 段も 12px 以上");
  t(m.MIN_FONT_PX === 12, "下限は 12px");
  // ★★紙の 段と 合って いる か（★紙から 拾います）。
  const 段の節 = 裁定.slice(裁定.indexOf("## 2 文字の 大きさ"));
  const 紙の段 = [...new Set([...段の節.slice(0, 600)
    .matchAll(/^(\d+(?:\.\d+)?)px/gm)].map((x) => Number(x[1])))];
  t(紙の段.length >= 6, "紙から 段を 読めた（" + 紙の段.join("/") + "）");
  紙の段.slice(0, 6).forEach((px) => {
    t(m.TYPE_STEPS.some((s) => s.px === px), "段 " + px + "px が ある");
  });
  // ★★段の 名は、★大きさを 返せる こと。★知らない 名は null。
  t(m.stepRem("body") === (13.5 / 16) + "rem", "body は 13.5px");
  t(m.stepRem("しらない") === null, "知らない 名は null（黙って 既定に しない）");

  // -------------------------------------------------------------------------
  // 【三】★門の 外に こぼれて いない か
  //
  //   ★★★これが いちばん 大事 です。★38人の 画面を 変えません。
  // -------------------------------------------------------------------------
  console.log("【三】門の 外に こぼれて いない");
  const css = m.tokensCss();
  t(!/(^|[^.\w])\:root\s*\{/.test(css), "★`:root` に 置いて いない");
  t(css.split("\n").every((l) => !l.trim() || l.includes("." + m.SCOPE_CLASS)),
    "★どの 行も `." + m.SCOPE_CLASS + "` の 中 だけ");
  // ★★道具の 較正 ── ★わざと 1件 作って、★見つかる こと。
  t(/(^|[^.\w])\:root\s*\{/.test(":root{--ink:#000}"), "★わざとの 1件を 見つけられる");
  t(!"  .wsv .tblwrap{}".split("\n").every((l) => !l.trim() || l.includes(".xx")),
    "★わざとの 1件（外れた 行）を 見つけられる");

  // ★★`app/globals.css` に 混ぜて いない こと。
  const 全体 = readCode("app", "globals.css");
  t(!全体.includes("--enji-d"), "globals.css に 持ち込んで いない");

  // -------------------------------------------------------------------------
  // 【四】★読める か（★測ります。★書き写しません）
  // -------------------------------------------------------------------------
  console.log("【四】比を 測る（★WCAG 1.4.3 本文 4.5 ／ 部品 3.0）");
  // ★★★字が のる かも しれない 地を、★**ぜんぶ** 回ります。
  //   ★★2026-09-18、★`--card` だけ 見て「通った」と しかけました。
  //     ★★`--band2` と `--pick` の 上では、★4.5 に 足りて いません でした。
  //   ★★地を 1つ しか 見ない 見張りは、★見て いない のと 同じ です。
  const 地 = ["paper", "card", "card2", "band", "band2", "band3", "pick"];
  const 字 = ["ink", "ink2", "ink3", "ok", "warn", "err", "enji"];
  [["明", m.TOKENS_LIGHT], ["暗", m.TOKENS_DARK]].forEach(([名, T]) => {
    字.forEach((f) => {
      const 低い = 地.map((b) => ({ b, r: 比(T[f], T[b]) }))
        .sort((x, y) => x.r - y.r)[0];
      t(低い.r >= 4.5,
        `${名} --${f} ★いちばん 低い 地は --${低い.b}　${低い.r.toFixed(2)}`);
    });
  });
  // ★★`--ink4` は 別 です。★薄い こと 自体が 意味 です（★`FAINT_TOKEN`）。
  //   ★★4.5 は 求めません。★部品の 3.0 を 下回らない ことだけ 見ます。
  t(m.FAINT_TOKEN === "ink4", "薄い 字の 名が 決まって いる");
  [["明", m.TOKENS_LIGHT], ["暗", m.TOKENS_DARK]].forEach(([名, T]) => {
    const 低い = 地.map((b) => ({ b, r: 比(T[m.FAINT_TOKEN], T[b]) }))
      .sort((x, y) => x.r - y.r)[0];
    t(低い.r >= 3.0, `${名} --${m.FAINT_TOKEN} ★いちばん 低い 地は --${低い.b}　${低い.r.toFixed(2)}（3.0 の 側）`);
  });
  // ★★地に 使う えんじ。★白い 字を 載せます。
  t(比("#FFFDF8", m.TOKENS_LIGHT["enji-d"]) >= 4.5,
    `明 白字 / --enji-d ＝ ${比("#FFFDF8", m.TOKENS_LIGHT["enji-d"]).toFixed(2)}`);
  // ★★道具の 較正 ── ★わざと 読めない 組を 作って、★見つかる こと。
  t(比("#777777", "#7A7A7A") < 4.5, "★わざとの 1件（読めない 組）を 見つけられる");

  // -------------------------------------------------------------------------
  // 【五】★表の 貼り付け
  // -------------------------------------------------------------------------
  console.log("【五】表の 貼り付け（★§5-1）");
  t(css.includes("position:sticky;top:0"), "見出しの 行を 貼り付けて いる");
  t(css.includes("position:sticky;left:0"), "左の 列（錨）を 貼り付けて いる");
  t(css.includes(".tblwrap .stick") && css.includes(".tblwrap .anc"), "錨の 名は 2つ とも");
  t(css.includes("overflow:auto"), "中で すべる");
  // ★★★行の 高さは、★文字の つまみに 連動 させる。★別の つまみを 作らない。
  t(css.includes("calc(40px * var(--scale,1))"), "行の 高さは 文字の つまみに 連動");
  t(!css.includes("var(--z"), "★`--z` を 作って いない（★この 蔵の 名は `--scale`）");
  // ★★`--scale` が 本当に ある こと（★名を 間違えて いない か）。
  t(readRaw("app", "globals.css").includes("--scale:"), "★`--scale` は globals.css に ある");

  // -------------------------------------------------------------------------
  // 【六】★部品は 決めを 持たない
  // -------------------------------------------------------------------------
  console.log("【六】部品は 決めを 持たない");
  const 部品 = readCode("components", "VisualTokens.jsx");
  t(!/#[0-9A-Fa-f]{6}/.test(部品), "VisualTokens.jsx に 色を 直に 書いて いない");
  t(部品.includes("tokensCss"), "lib から もらって いる");

  // -------------------------------------------------------------------------
  // 【七】★敷いて ある か ── ★持って いても、★敷かなければ 効きません
  //
  //   ★★★2026-09-11 の 覚え ── ★`TYPE.note` が 無い のに、
  //     ★★6つの 画面が 読んで いました。★何も 起きず、★組み立ても 通りました。
  //   ★★★「書いた」と「効いて いる」は 別 です。★つなぎ目を 見ます。
  // -------------------------------------------------------------------------
  console.log("【七】運営の 殻に 敷いて ある");
  const 殻 = readRaw("components", "OpsShell.jsx");
  t(殻.includes("<VisualTokens />"), "★土台を 敷いて いる");
  t(殻.includes("className={SCOPE_CLASS}"), "★入れ物に 名を 付けて いる");
  t(殻.indexOf("className={SCOPE_CLASS}") < 殻.indexOf("<VisualTokens />"),
    "★名の 付いた 入れ物の 中に 敷いて いる");

  // ★★運営の 表は、★自分で 貼り付けを 持たない こと。
  //   ★★★同じ 決めが 2か所に ある ── ★この 蔵の 病い です。
  ["OpsRosterTable.jsx", "OpsPostMatrix.jsx"].forEach((f) => {
    const 本文 = readCode("components", f);
    t(本文.includes("TABLE_CLASS"), f + " ── `.tblwrap` を 使って いる");
    t(!本文.includes('position: "sticky"'), f + " ── 自分で 貼り付けを 持って いない");
    t(!/maxHeight:\s*"\d+vh"/.test(本文), f + " ── 自分で 高さを 決めて いない");
    t(!/#[0-9A-Fa-f]{6}/.test(本文), f + " ── 色を 直に 書いて いない");
  });
  // ★★道具の 較正。
  t(/#[0-9A-Fa-f]{6}/.test('background: "#F6E4E8"'), "★わざとの 1件（直の 色）を 見つけられる");
  t(/maxHeight:\s*"\d+vh"/.test('maxHeight: "62vh"'), "★わざとの 1件（直の 高さ）を 見つけられる");

  console.log(`\n○ ${ok}　✗ ${ng}`);
  process.exit(ng === 0 ? 0 : 1);
})();
