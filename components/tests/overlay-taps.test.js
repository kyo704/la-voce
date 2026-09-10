// ============================================================================
// ★重なった ものが、★下の 押しどころを 奪っていないか（★2026-09-11）
//
//   ★出どころ docs/design/pack-final/裁定-9月10日夜の7点（役職への一本化ほか）.md §8
//     「★画面の 下に 出る『知らせの 帯』（トースト）が、
//       ★消えるまでの 5秒間、その 場所の 押しごとを 受け取っていました。
//       ★.toast.on { pointer-events: auto } ←★これが 原因」
//     「★Code へ：この 直しは 羊の画面だけの 話では ありません。
//       ★帯と 重なる 位置に ある ボタンは、ぜんぶ 同じ 目に 遭っていました」
//
//   ★★うちも 同じでした。★2か所 ありました。
//     ① 知らせの 帯（★中に 押すものが 無い）→ ★帯ごと 素通し
//     ② 下の ぼかしの 帯（★中に 押すものが ある）→ ★外は 素通し・中だけ 受ける
//
//   ★★見つけにくい 不具合です。
//     ★間を おいて 押すと 効くので、★再現しません。
//     ★だから、★形で 見張ります。
//
//   ★★確かめること
//     ① 画面に 貼りついた もの（fixed）で、★中に 押すものが 無いものは 素通し。
//     ② 中に 押すものが あるものは、★外は 素通し・中だけ 受ける。
//     ③ 下の タブより 上に 出る ものが、★タブを 塞いでいないこと。
// ============================================================================

const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

const v = readRaw("components", "VocalTracker.jsx");
const vCode = readCode("components", "VocalTracker.jsx");

console.log("① 知らせの 帯（★中に 押すものが 無い）");
{
  const at = vCode.indexOf('className="fixed left-1/2 z-50 tab-panel"');
  ok(at > 0, "★知らせの 帯が ある");
  const near = vCode.slice(at, at + 300);
  ok(/pointerEvents: "none"/.test(near), "★帯ごと 素通し");
  // ★★中に 押すものを 増やしたら、★この 見張りが 教えます。
  //   ★そのときは「外は none・中だけ auto」に 変えてください。
  ok(!/<button/.test(vCode.slice(at, at + 600)), "★中に 押すものが 無い（★増えたら 作りを 変える）");
}

console.log("② 下の ぼかしの 帯（★中に 押すものが ある）");
{
  const at = vCode.indexOf('className="fixed left-0 right-0 bottom-0 z-40');
  ok(at > 0, "★ぼかしの 帯が ある");
  const near = vCode.slice(at, at + 420);
  ok(/pointerEvents: "none"/.test(near), "★外は 素通し");
  ok(/pointerEvents: "auto"/.test(near), "★中だけ 受ける");
  // ★★順番が 大事です。★外の none が 先、★中の auto が あと。
  ok(near.indexOf('pointerEvents: "none"') < near.indexOf('pointerEvents: "auto"'),
    "★外が 先、★中が あと");
}

console.log("③ 下の タブを 塞いでいないか");
// ★★下の タブは zIndex 20・高さ 56px。★z-40 と z-50 が その上に 来ます。
//   ★どちらも 素通しに したので、★指は タブに とどきます。
{
  const bar = readRaw("components", "TabBarV2.jsx");
  ok(/zIndex: 20/.test(bar), "★タブは zIndex 20");
  const fixedNoPass = [];
  vCode.split("\n").forEach((l, i) => {
    if (!/className="[^"]*\bfixed\b[^"]*"/.test(l)) return;
    if (/inset-0/.test(l)) return;              // ★画面ぜんぶを 覆う もの（★押して 閉じる 幕）は 別
    const seg = vCode.split("\n").slice(i, i + 8).join("\n");
    if (!/pointerEvents/.test(seg)) fixedNoPass.push((i + 1) + "  " + l.trim().slice(0, 80));
  });
  ok(fixedNoPass.length === 0,
    "★貼りついた もので、★素通しを 決めていない ものが ない"
    + (fixedNoPass.length ? "\n      " + fixedNoPass.join("\n      ") : ""));
}

console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
process.exit(failed === 0 ? 0 : 1);
