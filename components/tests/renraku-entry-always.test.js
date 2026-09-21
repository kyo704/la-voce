// STRIP: A（振る舞い）
//
// ★連絡：★一覧が 空でも「＋ おしらせを 書く」が 出る（★裁定120 ／ 実行ルート 5-3）。
//
//   ★★★もと …… 入口が `list` の 中に ありました。
//     ★★`list` は「お知らせ 0件 かつ 門下 0件」の とき、★丸ごと 出ません。
//     ★★だから 最初の 1件を 書き始める 口が ありません でした。
//     ★★画面には「＋ から 書けます」と 出て いて、★その ＋ が 無い。
//
//   ★★ここで 見るのは **形** です ── ★入口が 空の 判じより 先に、
//     ★かつ その 外に 置かれて いるか。
//   ★★★見た目そのもの（390px・1280px の 画像）は、★これでは 測れません。
//     ★★Playwright の 3件が 要ります（★実行ルート 5-3 の ①②③）。
//     ★★この 見張りは、★その 前に 形が 崩れたら 気づく ため の もの です。
const { readCode } = require("./_source");

let 数 = 0, 落 = 0;
const t = (名, ok, 註) => { 数 += 1; if (!ok) 落 += 1;
  console.log(`  ${ok ? "✓" : "✗"} ${名}${註 ? "  -- " + 註 : ""}`); };

const ui = readCode("components", "Renraku.jsx");

console.log("=== 一 入口が ある ===");
t("★入口を 組み立てて いる", /const 入口 = \(/.test(ui));
t("★「＋ おしらせを 書く」の 字が ある", /＋ おしらせを 書く/.test(readCode("components", "Renraku.jsx")));

console.log("\n=== 二 入口が 一覧の 外に ある ===");
{
  // ★`list` の 組み立ての 中に 入口が 入って いない こと。
  const i = ui.indexOf("const 入口 = (");
  const j = ui.indexOf("const list =");
  t("★入口は それ 自身で 組み立てられて いる", i > 0);
  if (i > 0 && j > 0) {
    t("★`list` の 中で 作られて いない", !/const 入口/.test(ui.slice(j, j + 2000)));
  } else {
    t("★`list` の 組み立てが 見つかる", j > 0);
  }
}

console.log("\n=== 三 空の ときでも 出す ===");
{
  // ★★2つの 姿（2ペイン／狭い 画面）の どちらでも、
  //   ★`{入口}` が `{空っぽ}` より **先** に 置かれて いる こと。
  const 出方 = [...ui.matchAll(/\{入口\}/g)].map((m) => m.index);
  t("★入口を 2か所で 出して いる（2ペイン と 狭い 画面）", 出方.length === 2,
    `${出方.length}か所`);
  for (const p of 出方) {
    const 後ろ = ui.slice(p, p + 400);
    t("★その 直後に 空の 判じが 来る（＝入口が 先）",
      /\{空っぽ\}|\{空っぽ \|\| list\}/.test(後ろ));
  }
  // ★★較正 ── ★入口が 空の 判じの **中** に 入って いたら 落ちる こと。
  const にせ = ui.replace(/\{入口\}\n/, "");
  t("★較正：入口を 外したら 見つからない", [...にせ.matchAll(/\{入口\}/g)].length < 出方.length);
}

console.log("\n=== 四 書ける 方だけ に 出す ===");
t("★`mayPost` で 決めて いる", /onCompose && mayPost\(\{ perms, isAnnouncement: true \}\)/.test(ui));
t("★決めを ここで 書き直して いない", !/role === "owner"|role === "admin"/.test(ui));

console.log(`\n  ${数 - 落} / ${数}`);
process.exit(落 ? 1 : 0);
