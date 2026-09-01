#!/usr/bin/env node
/**
 * 画面に戻ってきたとき、つながりを取り直す（2026-09-02）
 *
 * ★何が起きていたか
 *   先生の生徒一覧は、★開いたときに1回だけ取っていました。
 *   生徒が招待コードを受け取って「つながる」を押しても、
 *   先生の画面はそのままです。手で読み込み直すまで増えません。
 *   ★先生には「招待が届いていない」ように見えます。
 *
 *   fetchTeacherLinks を呼ぶのは3か所しかなく、
 *   そのうち2つは★自分が動いたときでした（招待を受けた・解除した）。
 *   ほかの人が動いたときに取り直す道が、1本もありませんでした。
 *
 * ★Realtime（購読）は採りませんでした
 *   ・この repo に購読は1つもありません。最初の1つになります
 *   ・つなぎっぱなしの接続の後始末が要ります
 *   ・★購読は行が丸ごと届きます。列を絞る規律
 *     （get_student_entries でやっていたこと）が効きません
 *   見ている最中は更新されませんが、
 *   ★確かめようとタブに戻った時点では新しくなっています。
 */
const { readCode } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const vt = readCode("components", "VocalTracker.jsx");

console.log("=== ★戻ってきたときに、取り直している ===");
{
  assertTrue(/addEventListener\("visibilitychange", refresh\)/.test(vt),
    "★タブが見えるようになったとき");
  assertTrue(/addEventListener\("focus", refresh\)/.test(vt),
    "★窓が前に出たとき");
  const at = vt.indexOf('addEventListener("visibilitychange", refresh)');
  const block = vt.slice(Math.max(0, at - 900), at);
  assertTrue(/fetchTeacherLinks\(\)/.test(block), "★つながりを取り直している");
  assertTrue(/document\.visibilityState !== "visible"/.test(block),
    "★見えていないときは走らない");
}

console.log("\n=== ★後始末をしている ===");
{
  assertTrue(/removeEventListener\("visibilitychange", refresh\)/.test(vt),
    "★listener を外している（外し忘れると積もります）");
  assertTrue(/removeEventListener\("focus", refresh\)/.test(vt), "★もう片方も外している");
}

console.log("\n=== ★重ねて走らせない ===");
{
  const at = vt.indexOf("const refresh = async () =>");
  const body = vt.slice(at, at + 420);
  assertTrue(/if \(running\) return;/.test(body), "★走っている最中は、もう一度走らない");
  assertTrue(/finally/.test(body), "★失敗しても必ず戻す（戻し忘れると二度と走りません）");
}

console.log("\n=== ★購読（Realtime）を増やしていない ===");
{
  assertTrue(!/\.channel\(|postgres_changes/.test(vt),
    "★購読を作っていない（列を絞る規律が効かないため）");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
