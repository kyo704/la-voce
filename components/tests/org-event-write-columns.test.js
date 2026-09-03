// 予定に書く列は、権限のある列だけであること（2026-09-04）
//
//   ★org_events の UPDATE は、列ごとに権限を出しています。
//     ★1つでも権限の無い列が混ざると、文ごと 42501 で落ちます。
//     ★一部だけ通る、ということがありません。
//
//   ★実際に起きたこと
//     取り下げ   … withdrawn_at ＋ ★updated_at → 落ちた
//     日付の変更 … event_date ＋ ★previous_date ＋ ★updated_at → 落ちた
//     ★どちらも「権限がありません」と画面に出ていました。
//       .select() と0行の確認は正しく働いていました。
//       ★壊れていたのは、書こうとした列のほうです。
//
//   ★updated_at と previous_date は、サーバが入れます
//     （trg_org_events_bookkeeping）。★権限は与えていません。
//     ★列ごとの権限は、UPDATE 文が名指しした列だけを見ます。
//       トリガーが入れる列に、権限は要りません。
const { readCode } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const VT = readCode("components/VocalTracker.jsx");

// ★書いてよい列。本番の grant と、そろえてあります。
const 書ける列 = ["end_time", "event_date", "kind", "start_time", "target_group", "title", "withdrawn_at"];
// ★書いてはいけない列。サーバが入れます。
const 禁じた列 = ["updated_at", "previous_date", "org_id", "id", "created_at", "created_by"];

// ★.from("org_events").update({ … }) を、すべて拾います。
const 書き込み = [];
const re = /from\("org_events"\)\s*\n?\s*\.update\(\{([^}]*)\}\)/g;
let m;
while ((m = re.exec(VT)) !== null) 書き込み.push(m[1]);

console.log("\n① 予定への書き込みを、ぜんぶ見つけられること");
ok(`.update が2か所ある（いま ${書き込み.length}）`, 書き込み.length === 2);

console.log("\n② ★権限の無い列を書いていないこと");
書き込み.forEach((中身, i) => {
  const 列 = (中身.match(/(\w+)\s*:/g) || []).map((x) => x.replace(/\s*:$/, ""));
  ok(`${i + 1}つめの列を読み取れた（${列.join(", ")}）`, 列.length > 0);
  禁じた列.forEach((c) => {
    ok(`  ★${i + 1}つめに ${c} を書いていない`, !列.includes(c));
  });
  列.forEach((c) => {
    ok(`  ${i + 1}つめの ${c} は、権限のある列`, 書ける列.includes(c));
  });
});

console.log("\n③ ★落ちたときに、黙らないこと");
// ★0行の確認を外すと、権限が足りなくても無音になります（#004 と同じ形）。
["handleMoveOrgEvent", "handleWithdrawOrgEvent"].forEach((名) => {
  const i = VT.indexOf("async function " + 名);
  const 本体 = i === -1 ? "" : VT.slice(i, VT.indexOf("\n  }", i));
  ok(`${名}：.select("id") を付けている`, /\.select\("id"\)/.test(本体));
  ok(`${名}：error を見ている`, /if \(error\)/.test(本体));
  ok(`${名}：★0行も見ている`, /length === 0/.test(本体));
});

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
