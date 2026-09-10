// ============================================================================
// ★レパートリー ── 直す・消すの 見張り（★2026-09-11）
//
//   ★出どころ docs/design/pack-final/裁定-9月11日の12点… §13
//     「★曲を ひらく → 右上の「…」→ ★直す ／ ★消す
//       ★消す　★確認を 1回 出します
//       ★★毎日の 記録は 消えません（★記録は 曲とは 別に 残ります）
//       ★稽古の メモも 残ります」
//
//   ★★確かめること
//     ① 入口（「…」）が あること。
//     ② 消す 前に、★確認が 1回 出ること（★2回 聞かないこと）。
//     ③ 消しても、★毎日の 記録が 消えないこと（★曲名を 外すだけ）。
//     ④ 仕組みを 作り直していないこと（★前から ある 2つを 呼ぶ）。
//     ⑤ ★無い 欄を 出していないこと（★作曲家・ようす・はじめて記録した日）。
// ============================================================================

const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

const v = readRaw("components", "VocalTracker.jsx");
const vCode = readCode("components", "VocalTracker.jsx");

console.log("① 入口");
ok(/setRepMenu\(repMenu === it\.name \? null : it\.name\)/.test(v), "★「…」で 開く・閉じる");
ok(/aria-label=\{it\.name \+ "を 直す・消す"\}/.test(v), "★読み上げの 名前が ある");
ok(/minWidth: 44, minHeight: 44/.test(v), "★押せる 大きさ");

console.log("② 消す 前の 確認は 1回");
ok(/repConfirmDelete === it\.name \?/.test(v), "★確認の 段が ある");
// ★★2回 聞いていないこと。★confirm() も 使っていないこと。
{
  const at = vCode.indexOf("async function handleDeleteRepertoire");
  const fn = vCode.slice(at, at + 1600);
  ok(!/window\.confirm|confirm\(/.test(fn), "★消す 仕組みに 確認窓が 無い");
  const ui = vCode.slice(vCode.indexOf("repMenu === it.name &&"),
    vCode.indexOf("repMenu === it.name &&") + 2600);
  ok(!/window\.confirm|confirm\(/.test(ui), "★画面の 側にも 確認窓が 無い（★画面の中で 聞く）");
}
const menu = v.slice(v.indexOf("setRepConfirmDelete(it.name)") - 3000, v.indexOf("setRepConfirmDelete(it.name)") + 500);
ok((menu.match(/repConfirmDelete/g) || []).length <= 6, "★確認の 段は 1つだけ");

console.log("③ 消しても、毎日の 記録は 消えない");
// ★★曲名を 外すだけで、★分数は そのまま。★前から そう なっています。
const del = vCode.slice(vCode.indexOf("async function handleDeleteRepertoire"),
  vCode.indexOf("async function handleDeleteRepertoire") + 1600);
ok(/items: \(a\.items \|\| \[\]\)\.filter/.test(del), "★曲名だけを 外している");
ok(!/delete\(\)\.eq\("user_id", userId\)\s*$/.test(del), "★記録の 行を 消していない");
ok(/練習の分数はそのまま残っています/.test(v), "★そう 書いてある");
// ★★画面にも、★消す 前に そう 伝えること。
ok(/練習の 分数は そのまま 残ります/.test(v), "★確認の 文にも 書いてある");

console.log("④ 作り直していない");
ok(/handleRenameRepertoire\(it\.name, repRenameTo\.trim\(\)\)/.test(v), "★直すは 前からの 仕組み");
ok(/handleDeleteRepertoire\(it\.name\)/.test(v), "★消すも 前からの 仕組み");
ok((vCode.match(/async function handleDeleteRepertoire/g) || []).length === 1, "★消すは 1つだけ");
ok((vCode.match(/async function handleRenameRepertoire/g) || []).length === 1, "★直すも 1つだけ");

console.log("⑤ 無い 欄を 出していない");
// ★★見本には「作曲家・役 ／ ようす ／ はじめて 記録した日」も ありますが、
//   ★いまの 記録に その欄が ありません。★打っても 残りません。
//   ★★無い 欄を 出しては いけません。★今後の 課題に 残しました。
const panel = vCode.slice(vCode.indexOf("repMenu === it.name &&"),
  vCode.indexOf("repMenu === it.name &&") + 2600);
["作曲家", "ようす", "はじめて 記録した日"].forEach((w) => {
  ok(!panel.includes(w), "★「" + w + "」の 欄を 出していない");
});
ok(/今後の 課題に 残しました/.test(v.slice(v.indexOf("repMenu === it.name &&") - 2000, v.indexOf("repMenu === it.name &&") + 2600))
  || /今後の 課題/.test(v), "★なぜ 出さないかが 書いてある");

console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
process.exit(failed === 0 ? 0 : 1);
