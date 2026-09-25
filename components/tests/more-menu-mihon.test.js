#!/usr/bin/env node

// ============================================================================
// もっと 画面 ── ★見本に そろって いること（★2026-09-15）
//
//   ★出どころ 見本 `SC['もっと']`（★動く見本・全画面）
//   ★坂本さんの お決め（2026-09-15）── ㋐ 右の 字 ／ 注記 4行
//
//   ★★㋑「通っている ところ」は **入って いません**。
//     ★新しい 機能 なので、★今回の 範囲の 外、と お決めに なりました。
//     ★★だから、★この 見張りも 求めません。
//     ★★求めると、★「わざと 入れて いない もの」で 毎回 落ちます。
//
//   ★★注記は **4行 ひと続き** です。★3行だけ 入れる 形に しません。
//     ★1度 3・4行目 だけ の ご指示 でしたが、★1つの 塊 です、と
//     ★お伝えして、★4行 ぜんぶに なりました。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
const MI = path.join(ROOT, "docs", "design", "pack-final",
  "00-動く見本（さわれる・全画面）.html");

let ok = 0;
let ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

// ★★★2026-09-25、★design-v63 で 見本の「もっと」が 変わりました ──
//   ★19行の 平らな 一覧 → ★7つの 束の 入口。
//   ★★★だから 4行の 注記は、★いまの 見本の「もっと」に ありません。
//
//   ★★★けれど 4行は **生きて いる 約束** です ──
//     ★38名の 方の「もっと」は 平らな 一覧の まま です（★`layoutV2` の 外）。
//     ★★見本が 先に 進んだ から といって、★出して いる 約束を 消しません。
//
//   ★★★出どころは 残します ── ★`docs/opus/pack-2026-09-21_52`（★design-v51）。
//     ★「私の 造語で ない」ことを 確かめる のが この 行の 仕事 です。
//     ★★その 仕事は 古い 束でも できます。★消さずに 向きを 変えます。
const MI_OLD = path.join(ROOT, "docs", "opus", "pack-2026-09-21_52", "pack",
  "00-動く見本（さわれる・全画面）.html");

const mihon = fs.readFileSync(MI, "utf8");
const 旧 = fs.readFileSync(MI_OLD, "utf8");
const i = 旧.indexOf("SC['もっと']=function()");
const seg = 旧.slice(i, 旧.indexOf("\nSC['設定']", i));
const flat = seg.replace(/<[^>]*>/g, "");

// ★★いまの 見本の「もっと」は 7つの 束に なって いる こと（★確かめ）。
const iNow = mihon.indexOf("SC['もっと']=function()");
const segNow = mihon.slice(iNow, iNow + 1600);
t(/しらべる機能[\s\S]{0,900}アカウントと設定/.test(segNow),
  "★いまの 見本の「もっと」は 7つの 束（★design-v63）");

const lib = readCode("lib", "moreMenu.js");
const ui = readCode("components", "VocalTracker.jsx");

console.log("① ★注記 4行 ── ★見本の 字の まま");

const NOTE = [
  "法律の 行き先を、この 1か所に 集めています。",
  "退会を 隠しません。引き止めを 2回以上 出しません。",
  "この画面の 題は「もっと」です（規約が この語で 書かれています）。",
  "運営モードは、役割の ある方にだけ 出ます。"
];
NOTE.forEach((line) => {
  // ★★まず、★見本に ある こと。★私の 造語で ないこと。
  t(flat.includes(line), "★見本に ある「" + line.slice(0, 20) + "」");
  t(lib.includes(line), "★lib に ある「" + line.slice(0, 20) + "」");
});
// ★★4行 ぜんぶ。★3行に しない。
t(/MORE_NOTE = Object\.freeze\(\[/.test(lib), "★MORE_NOTE が ある");
{
  const m = lib.match(/MORE_NOTE = Object\.freeze\(\[([\s\S]*?)\]\)/);
  const n = m ? (m[1].match(/"/g) || []).length / 2 : 0;
  t(n === 4, "★注記は 4行（★実際 " + n + "）");
}

console.log("\n② ★右の 字 ── ★数と 矢印の 両方");

t(/export function rightOf/.test(lib), "★rightOf が lib に ある");
// ★★2026-09-16、★`rightOf` が 2つ目の 引数を 取る ように なりました。
//   ★★プランだけ、★右に いまの 状態を 出します（★見本 `paid()?'調べる':'無料'`）。
//   ★★判定は 画面が 渡します。★lib は 決めません。
//     ★★門の 決めを 2か所に しない ため です。
// ★★2026-09-24、★渡す ものが 3つに なり、★行が 折り返しました。
//   ★★あいだの 改行を またげる ように しました。★見る ものは 同じ です ──
//     ★「画面が `rightOf` を 通し、★いまの 状態を 渡して いる」。
t(/rightOf\(r,\s*\{[\s\S]{0,120}?paid:/.test(ui), "★画面は rightOf を 通し、★いまの 状態を 渡す");
t(/subscribed === true/.test(ui), "★渡して いるのは、★いま 払って いるか どうか");
t(!/r\.right \|\| "›"/.test(ui), "★`r.right || \"›\"` が 残って いない");
// ★★見本の 字 そのもの。
t(flat.includes("5つまで ›") || seg.includes("5つまで ›"),
  "★見本に「5つまで ›」が ある");

console.log("\n③ ★決めは lib が 持つ（★画面で 書かない）");

t(!/\+ " ›"/.test(ui), "★画面で 矢印を つないで いない");
t(/MORE_NOTE_BOLD/.test(lib), "★どこを 太くするかも lib が 持つ");
t(/MORE_NOTE_BOLD/.test(ui) && !/<b>役割の/.test(ui),
  "★画面に 太字の 字を 書き写して いない");

console.log("\n④ ★門の 外（38人）の もっとを 変えて いないこと");

// ★★注記も 右の 字も、★`layoutV2` の 中だけ に あること。
{
  // ★★2026-09-15、★ここを 1度 まちがえました。
  //   ★`ui.indexOf("<Note>")` は、★**ファイルの いちばん はじめ**の
  //     `<Note>` を 拾います。★私が 置いた ものでは ありません。
  //   ★★探すのは `MORE_NOTE.map` です。★1つ しか ありません。
  const at = ui.indexOf("MORE_NOTE.map");
  t(at > 0, "★注記を 描く ところが ある");
  // ★★★2026-09-15、★ここも まちがえて いました。
  //   ★★`at - 3000` と、★**目分量の 距離**で 見て いました。
  //     ★★行が 1つ 増えただけで 落ちます（★招待の 行を 足したら 落ちました）。
  //     ★★距離は 足場に なりません。★同じ 形を きょう 2度 踏みました。
  //   ★★見るのは「いちばん 近い 枝が どれか」です。★距離では ありません。
  const branchAt = ui.lastIndexOf("layoutV2 && moreSection === null", at);
  t(branchAt > -1 && branchAt < at, "★注記は 門の 中（layoutV2）だけ");
  // ★★その 枝と 注記の あいだに、★別の 枝が 始まって いないこと。
  //   ★★入れ子が 増えた ときに、★上の 1本だけ だと 気づけません。
  const between = ui.slice(branchAt, at);
  t(!/\}\s*\) : \(/.test(between), "★その 枝の 中に ある（★途中で 別の 枝に 移って いない）");
}

console.log("\n④-2 ★同意の とりけしは、★もっとから 1段 で 行ける こと");

// ★★2026-09-15、★足しました（★お決め）。
//   ★★画面は 前から ありました。★入口が プロフィールの 中で、★3段 奥 でした。
//   ★★きょう 足した 注記「★法律の 行き先を、この 1か所に 集めています。」と
//     ★食い違って いました。★約束の ほうに 合わせます。
t(/key: "同意", label: "同意を とりけす"/.test(readCode("lib", "moreMenu.js")),
  "★「同意を とりけす」の 行が lib に ある");
t(/if \(r\.key === "同意"\) \{ setActiveTab\("withdrawConsent"\); return; \}/.test(ui),
  "★押すと withdrawConsent へ 直に 行く");
// ★★プロフィールの 中の 入口も 残す こと。★2つ あって 困る ものでは ありません。
t(/setActiveTab\("withdrawConsent"\)/.test(ui)
  && (ui.match(/setActiveTab\("withdrawConsent"\)/g) || []).length >= 2,
  "★プロフィールの 中の 入口も 残って いる（★2か所 以上）");
t(/activeTab === "withdrawConsent"/.test(ui), "★行き先の 画面が ある");

console.log("\n⑤ ★入れて いない もの（★わざと）");

// ★★★2026-09-16、★逆に なりました（★裁定その68・坂本さん承認済み）。
//   ★★この 行は ずっと「★入れて いない こと」を 見張って いました。
//     ★★2026-09-15 の 時点では、★㋑ は 範囲の 外 だった から です。
//   ★★裁定その68 で「★10月の 最初の 学校の 前に **必須**」と 決まりました。
//     ★★生徒が 教室に 参加する、★ただ 1つの 道 です。
//   ★★だから いまは「★入って いる こと」を 見ます。
//     ★★消さずに 書き換えます ── ★いつ 向きが 変わったかが 残ります。
t(/通っている ところ/.test(lib), "★「通っている ところ」の 行が ある（★裁定その68）");
t(/moreSection === "通っているところ"/.test(ui), "★行き先の 画面が ある");
// ★★「招かれて いる ところ」は、★まだ 置きません（★お決め ㋑）。
//   ★★「誰あて」の 中身が 台帳に ありません。★押せない 札を 置きません。
t(!/招かれている ところ/.test(ui),
  "★★「招かれて いる ところ」は まだ 置いて いない（★台帳に 登録済み）");
console.log("　★★これは 落ちでは ありません。★お決めです（★2026-09-15）。");

console.log("\n⑥ ★この 見張りが 見て いない こと");
console.log("　★字が あるか だけ です。★並び・色・大きさは 見て いません。");
console.log("　★★行の 順番も 見て いません。★実機で お確かめ ください。");

(async () => {
  // ★★2026-09-15、★ここが 抜けて いました。
  //   ★★字が ある ことだけ 見て、★**何を 返すか** を 見て いません でした。
  //   ★★校正で 分かりました ── `rightOf` を 元に 戻しても、★落ちません でした。
  //     ★★1度も 落ちない 見張りは、★働くか 分かりません。
  console.log("\n★★中身を 動かして 確かめます");
  const src = readRaw("lib", "moreMenu.js");
  const m = await import("data:text/javascript;base64," +
    Buffer.from(src).toString("base64"));
  t(m.rightOf({ right: "5つまで" }) === "5つまで ›",
    "★rightOf({right:'5つまで'}) が「5つまで ›」（★得た値: "
    + JSON.stringify(m.rightOf({ right: "5つまで" })) + "）");
  t(m.rightOf({ right: null }) === "›", "★right が 無ければ 矢印だけ");
  t(m.rightOf(null) === "›", "★行が 無くても 落ちない");
  t(m.MORE_NOTE.length === 4, "★注記は 4行（★動かして 確かめ）");
  t(m.MORE_NOTE.some((x) => x.includes(m.MORE_NOTE_BOLD)),
    "★太字の 字が、★注記の どれかに 入って いる");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
