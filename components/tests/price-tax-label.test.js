/**
 * ★値の 見せ方（★税別）を、★書いて いるか。
 *
 *   ★★2026-09-18、★見本に ある のに 実装に **1文字も** ありません でした。
 *     ★見本 `docs/design/pack-final/00-動く見本-PC・iPad（運営）.html`
 *     ★`stBill` の 料金の 決まり 5行目 …… `['表示','税別']`
 *   ★★★お金の 表示 です。★9,800円が 税込に 見えると、★ご請求と 食い違います。
 *     ★★見て いる 方は「これを 払えば よい」と 読みます。
 */
const { readCode, readRaw, loadLib } = require("./_source");

let 落ち = 0;
function t(名, 条件) {
  console.log((条件 ? "  ok   " : "  NG   ") + 名);
  if (!条件) 落ち++;
}

(async () => {
  const lib = await loadLib("lib", "orgRoster.js");
  const ui = readCode("components/OpsSettings.jsx");
  const mihon = readRaw("docs/design/pack-final/00-動く見本-PC・iPad（運営）.html");

  console.log("\n=== ① 字が lib に ある ===");
  t("★PRICE_TAX_LABEL が ある", typeof lib.PRICE_TAX_LABEL === "string");
  t("★PRICE_TAX_ROW_LABEL が ある", typeof lib.PRICE_TAX_ROW_LABEL === "string");
  t("★★空で ない", Boolean(lib.PRICE_TAX_LABEL) && Boolean(lib.PRICE_TAX_ROW_LABEL));

  console.log("\n=== ② 見本と 同じ 字 ===");
  t("★見本に「税別」が ある", mihon.includes("'税別'"));
  t("★見本に「表示」が ある", mihon.includes("'表示'"));
  t("★★lib の 字が 見本と 同じ", mihon.includes("'" + lib.PRICE_TAX_LABEL + "'"));

  console.log("\n=== ③ 画面が 出して いる ===");
  t("★画面が lib から 取って いる", /PRICE_TAX_LABEL/.test(ui) && /PRICE_TAX_ROW_LABEL/.test(ui));
  t("★★画面に 書き写して いない", !ui.includes("税別"));
  // ★★取り込みの 行にも 名が 出ます（★7行目）。★そちらを 数えません。
  //   ★★2026-09-18、★はじめ `indexOf` で 数えて、★取り込みに 当たりました。
  //   ★★見たいのは「★料金の 決まりの 札の **中**に 出て いるか」です。
  t("★料金の 決まりの 中に ある",
    ui.indexOf("料金の 決まり") < ui.lastIndexOf("PRICE_TAX_ROW_LABEL"));

  console.log("\n=== ★較正 ── ★無ければ 落ちる ===");
  // ★★わざと 空に した ものを 通して、★見分けが 効く ことを 確かめます。
  const 空 = { PRICE_TAX_LABEL: "", PRICE_TAX_ROW_LABEL: "" };
  t("★★空なら「空で ない」に 当たらない（★較正）",
    !(Boolean(空.PRICE_TAX_LABEL) && Boolean(空.PRICE_TAX_ROW_LABEL)));
  t("★★字を 書き写したら 見つかる（★較正）",
    "<span>税別</span>".includes("税別"));

  console.log("\n=== ④ お金の 数が、★字と 離れて いない ===");
  // ★★下限・段・初期費用と 同じ ファイルに ある こと。
  //   ★★別の ところに 置くと、★片方だけ 変わります。
  t("★lib に 下限が ある", typeof lib.MONTHLY_FLOOR === "number");
  t("★lib に 段が ある", Array.isArray(lib.TIERS));
  t("★★同じ ファイルに 置いて いる", typeof lib.PRICE_TAX_LABEL === "string");

  console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
  process.exit(落ち === 0 ? 0 : 1);
})();
