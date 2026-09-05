#!/usr/bin/env node
/**
 * ⑫ 無料と有料の線（2026-09-05）
 *
 *   出どころ docs/opus/lavoce-判断-無料の線を引き直す（9月5日）.md
 *            docs/opus/lavoce-判断-無料期間は0でよい（9月5日・訂正）.md
 *
 *   ★★1行で言うと ── ★記録は取り上げない。★見方だけを売る。
 *
 *   実行  node components/tests/free-tier.test.js
 */

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}

(async () => {
  const b64 = Buffer.from(fs.readFileSync(path.join(ROOT, "lib", "freeTier.js"))).toString("base64");
  const m = await import("data:text/javascript;base64," + b64);
  const T = "2026-09-05";

  console.log("\n① ★★いまは、まだ誰にも効かせないこと");
  // ★決めていただくことが1つ残っています（③のグランドファザリング）。
  ok("★門が、切ってある", m.PAID_GATE_ENABLED === false);
  ok("★切ってあるあいだは、何年前でも見られる",
    m.mayReviewDate({ dateISO: "2020-01-01", todayISO: T }) === true);

  console.log("\n② ★線は、今日と直近7日");
  ok("★今日は無料", m.isWithinFreeWindow(T, T));
  ok("★7日前は無料", m.isWithinFreeWindow("2026-08-29", T));
  ok("★8日前は有料", !m.isWithinFreeWindow("2026-08-28", T));
  // ★★先の予定を、隠さないこと。
  ok("★未来の日付は、隠さない", m.isWithinFreeWindow("2026-09-10", T));
  ok("★読めない日付で、落ちない", !m.isWithinFreeWindow("こわれた", T));
  ok("★日数の決めが、1か所にある", m.FREE_DAYS === 7);

  console.log("\n③ ★★一度あげたものを、取り上げないこと");
  // ★線を引く前から使っておられる方は、★これまでどおりです。
  const on = { gateEnabled: true, todayISO: T, dateISO: "2020-01-01" };
  ok("★日が決まっていなければ、誰も取り上げない",
    m.mayReviewDate({ ...on, createdAt: "2026-09-01T00:00:00Z" }) === true);
  ok("★線より前から使っている方は、そのまま",
    m.mayReviewDate({ ...on, createdAt: "2026-09-01T00:00:00Z", gateStartsAt: "2026-10-19" }) === true);
  ok("★線より後に始めた方には、線が効く",
    m.mayReviewDate({ ...on, createdAt: "2026-11-01T00:00:00Z", gateStartsAt: "2026-10-19" }) === false);
  // ★★分からないときは、★取り上げない側に倒すこと。
  ok("★いつ始めたか分からないときは、取り上げない",
    m.mayReviewDate({ ...on, createdAt: null, gateStartsAt: "2026-10-19" }) === true);
  ok("★お支払いの方は、いつでも見られる",
    m.mayReviewDate({ ...on, subscribed: true, createdAt: "2026-11-01T00:00:00Z", gateStartsAt: "2026-10-19" }) === true);

  console.log("\n③-2 ★★記録そのものは、いつでも見られること");
  // ★権利と課金の線引き §3「過去の記録の閲覧と編集と削除」＝絶対にゲートしない。
  //   ★9月5日の裁定も同じ ──「記録は取り上げない。見方だけを売る。」
  //   ★★この関数は、呼ばれていなくても置いておきます。
  //     ★「記録は無料」を、コードの上で言い切っている場所が、要ります。
  ok("★記録を見るのは、いつでも自由", m.mayViewRecord() === true);
  const src = readCode("lib", "freeTier.js");
  ok("★危ない名前（mayViewDate）を、使っていない", !/mayViewDate/.test(src));
  ok("★売るのは「ふりかえり」だと、名前で分かる", /mayReviewDate/.test(src));

  console.log("\n④ ★★安全に関わるものを、売らないこと");
  // ★「金を払わない人には黙っている」形を、★絶対に作らないこと。
  for (const key of ["record", "symptom_gate", "referral", "export", "sheep", "keepsake", "today", "last7"]) {
    ok(`★${key} は、売らない`, !m.isPaidFeature(key));
  }
  ok("★売るのは4つだけ", m.PAID_FEATURES.length === 4);
  for (const key of ["review", "compare", "stage_mode", "today_guide"]) {
    ok(`★${key} は、売ってよい`, m.isPaidFeature(key));
  }
  // ★2つの一覧が、重なっていないこと。
  const overlap = m.PAID_FEATURES.filter((k) => m.NEVER_PAID.includes(k));
  ok(`★売るものと、売らないものが重なっていない${overlap.length ? "（★" + overlap.join(" ") + "）" : ""}`,
    overlap.length === 0);

  console.log("\n⑤ ★言い方（★壁ではなく、育ちとして）");
  const lines = m.GATE_LINES.join("\n");
  // ★★先に「見られるもの」を言ってから、★「増えたもの」を言うこと。
  ok("★1行目が、見られるもの", /^きのうまでの7日間は、いつでもご覧いただけます。/.test(lines));
  ok("★増えた、という言い方", /たまってきました/.test(lines));
  ok("★値段が書いてある", /月580円/.test(lines));
  const all = lines + "\n" + m.GATE_CLOSING_LINES.join("\n");
  ok("★「終わりました」と書いていない", !/終わりました/.test(all));
  ok("★「見られなくなりました」と書いていない", !/見られなくなり/.test(all));
  ok("★「制限」と書いていない", !/制限/.test(all));
  // ★★この2行を、必ず添えること。
  ok("★記録は残る、と書いてある", /記録は、これまでどおり残ります/.test(all));
  ok("★書き出しは無料、と書いてある", /書き出しは、いつでも無料です/.test(all));

  console.log("\n⑥ ★催促しないこと");
  // ★8日目に払う方は、多くありません。★それでよいのです。
  //   ★壁は毎日そこにあります。★40日目に見返したくなったとき、同じ場所にあります。
  ok("★催促しない、と決めている", m.mayNagAboutPaying() === false);

  console.log("\n⑦ ★この判断が、1か所にあること");
  const offenders = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(js|jsx)$/.test(e.name)) continue;
      if (p.includes(path.join("components", "tests"))) continue;
      if (p === path.join("lib", "freeTier.js")) continue;
      // ★★次の3つは、★門ではありません。★除きます。
      //   ・特商法の表記   … ★法律で求められている「説明」です
      //   ・entitlements   … ★「開発中かどうか」で、★課金ではありません
      //                      （★あのファイルの頭に、そう書いてあります）
      //   ・学ぶの記事     … ★読みもので、★出し分けていません
      //   ★★除いたものは、★下で中身を見ます。★素通しにしません。
      if ([
        path.join("app", "legal", "tokushoho", "page.js"),
        path.join("lib", "entitlements.js"),
        path.join("lib", "learnContent.js")
      ].includes(p)) continue;
      const t = readCode(p);
      // ★7日の線を、よそで組み立てていないか。
      if (/8日前より前|直近7日/.test(t) && !/freeTier/.test(t)) offenders.push(p);
    }
  };
  ["app", "components", "lib"].forEach(walk);
  ok(`★よそで組み立てていない${offenders.length ? "（★" + offenders.join(" ") + "）" : ""}`,
    offenders.length === 0);

  console.log("\n⑦-2 ★★除いた3つは、★門になっていないこと（★素通しにしない）");
  const ent = readCode("lib", "entitlements.js");
  // ★★entitlements は「開発中かどうか」です。★課金ではありません。
  //   ★もし課金の判定を持ちはじめたら、★決めが2か所になります。
  ok("★entitlements が、支払いを見ていない",
    !/subscribed|subscription|plan ===|課金状態/.test(ent));
  ok("★entitlements が、日付で切っていない",
    !/isWithinFreeWindow|FREE_DAYS|8日前/.test(ent));
  const toku = readCode("app", "legal", "tokushoho", "page.js");
  ok("★特商法は、説明だけ（★判定を持たない）",
    !/function |=>/.test(toku.replace(/export default function TokushohoPage\(\) \{/, "")));

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
