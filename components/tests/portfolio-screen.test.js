#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★経歴の 画面（★裁定 その94 §10 ①・2026-09-19）
//
//   ★★守る こと
//     ★① 入口が ある（★もっと の 行 ＋ 画面）
//     ★② 字の もの だけ（★録画・宣材写真の 札を 置かない ── ★§8⑤）
//     ★③ 決めは lib が 持つ（★画面で 判じない）
//     ★④ 読めなかった ときに 空の 紙を 出さない
//     ★⑤ 取る 列に、★置かない と 決めた ものが 無い
//
//   ★★★較正 ── ★わざと 1件 当たる ものを 作り、★見つかる ことを 確かめます。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw, loadLib } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const ROOT = path.join(__dirname, "..", "..");
for (const f of ["components/PortfolioV2.jsx", "lib/portfolio.js", "lib/moreMenu.js"]) {
  if (!fs.existsSync(path.join(ROOT, f))) {
    console.log("★★ありません: " + f);
    console.log("　★数えません。★止まります。");
    process.exit(1);
  }
}

(async () => {
  const 画面 = readCode("components", "PortfolioV2.jsx");
  const 生 = readRaw("components", "PortfolioV2.jsx");
  const 蔵 = readCode("components", "VocalTracker.jsx");
  const P = await loadLib("lib", "portfolio.js");
  const M = await loadLib("lib", "moreMenu.js");

  console.log("① 入口");
  t(M.MORE_ROWS.some((r) => r.key === "経歴"), "★もっと に 行が ある");
  t(/moreSection === "経歴"/.test(蔵), "★その 行で 画面が 出る");
  t(/<PortfolioV2/.test(蔵), "★画面を 呼んで いる");
  t(/data-v2-portfolio/.test(蔵), "★目印が ある（★あとで 見くらべる ため）");

  console.log("\n② 字の もの だけ（★録画・宣材写真は 後）");
  // ★★★較正 ── ★わざと 置いた 札を 見つけられる こと。
  t(/えらぶ/.test('<span class="btn g">えらぶ</span>'), "★道具の 較正");
  t(!/宣材|写真を えらぶ|<input[^>]*type="file"/.test(画面), "★写真の 札を 置いて いない");
  // ★★★2026-09-19（★裁定 その94 §4f）── ★録画は URL だけ に なりました。
  //   ★★預かりません。★ここで 再生しません。★外へ 移る だけ です。
  t(!/videoUpload|createObjectURL|<video/.test(画面), "★動画を 預かって いない・再生して いない");
  t(/RECORDING_HEAD/.test(画面), "★録画の まとまりが ある");
  t(/urlOk/.test(画面), "★https だけ を 通して いる（★lib の 判じ）");
  t(/rel="noopener noreferrer"/.test(画面), "★★外へ 移る ときの 守りが ある");
  t(/target="_blank"/.test(画面), "★別の 窓で 開く");
  t(/hostOf/.test(画面), "★どこへ 行くかを 押す 前に 出して いる");
  // ★★「まだ できない こと」は、★名ざしで 出します（★押せる 札には しません）。
  t(/NOT_YET/.test(画面), "★まだ できない ものを 名ざしで 出して いる");

  console.log("\n③ 決めは lib が 持つ");
  for (const k of ["SCOPES", "scopesFor", "inGivenOrder",
                   "NOTES", "SCOPE_NOTES", "BIO_MAX"]) {
    t(new RegExp("\\b" + k + "\\b").test(画面), `★${k} を lib から 取って いる`);
  }
  t(!/18歳/.test(画面), "★★18歳の 判じを 画面に 書いて いない");
  t(!/\.sort\(/.test(画面), "★並べ替えて いない");

  console.log("\n④ 読めなかった とき");
  t(/portfolioOk/.test(蔵), "★取れたか どうかを 持って いる");
  t(/書いた ものは 消えて いません/.test(蔵), "★読めなかった ことを 画面に 出す");

  console.log("\n⑤ 取る 列");
  t(/from\("portfolio_recordings"\)/.test(蔵), "★録画を 読んで いる");
  const 読み = 蔵.slice(蔵.indexOf('from("portfolios")'),
                     蔵.indexOf('from("portfolios")') + 260);
  t(読み.length > 0, "★経歴を 読んで いる");
  const 当 = P.NEVER_STORED.filter((c) => new RegExp("\\b" + c + "\\b").test(読み));
  t(当.length === 0, "★置かない と 決めた 列を 頼んで いない（" + 当.join(" ") + "）");
  t(!/select\("\*"\)/.test(蔵.slice(蔵.indexOf('from("portfolios")'),
                                  蔵.indexOf('from("portfolios")') + 120)),
    "★`*` で 取って いない");

  console.log("\n⑥ 0行を 成功に しない");
  const 書き = 蔵.slice(蔵.indexOf("async function handleSavePortfolio"),
                      蔵.indexOf("async function handleSavePortfolio") + 1400);
  t(/\.select\("user_id"\)/.test(書き), "★何行 直したかを 見て いる");
  t(/data\.length === 0/.test(書き), "★0行なら 失敗に して いる");
  t(/setPortfolioError/.test(書き), "★書けなかった ことを 画面に 出す");

  console.log("\n⑦ 「★」を 画面の 字に 出さない");
  // ★★★禁じた 字は、★註を 外した もとで 探します（★蔵の 決め）。
  //   ★★註に「★」を 使って 書いて いる ので、★外さないと 自分の 説明に 当たります。
  //   ★★`readCode` が 註を 外します。★`readRaw` は 並びを 見る ときに 使います。
  t(!/>[^<>]*★[^<>]*</.test(画面), "★地の 字に 「★」が 無い");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
