#!/usr/bin/env node
/**
 * ⑫ 無料と有料の線 ── ★案B の見張り（2026-09-05 夜）
 *
 *   出どころ docs/opus/lavoce-判断-週次のふりかえりを売るか（9月5日・夜）.md §6
 *
 *   ★★判定の一行
 *     ★記録は取り上げない。★見方だけを売る。
 *     ★本人が書いた数を、そのまま見せる画面は、★期間を問わず無料。
 *     ★こちらが計算した数を見せる画面は、★売ってよい。
 *
 *   ★★§6 の5つを、★そのまま見張ります。
 *     ★とくに4番 ──「課金が切れたあと、過去の記録は1件も消えない」。
 *     ★解約した瞬間に過去が消えるのが、★この手のアプリで最も嫌われる事故です。
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

  // ★門が開いている状態を作って、そのうえで確かめます。
  const OPEN = { gateEnabled: true, gateStartsAt: "2026-10-19" };
  const 無課金 = { ...OPEN, profile: { is_tester: false }, subscribed: false };

  console.log("\n■ §6-1 ★無課金の方が、1年前の日をカレンダーから開けること");
  // ★★本人が書いた数です。★期間を問わず、無料です。
  ok("★記録を見るのは、いつでも自由", m.mayViewRecord() === true);
  ok("★その日の生の値は、門を開けても見られる",
    m.mayViewSummary({ ...無課金, scope: "day" }) === true);
  // ★★カレンダーに、遡りの制限を付けないこと。
  //   ★制限を付けると「何日まで」を説明することになり、そこが不満の種になります。
  ok("★カレンダーの遡りに、制限が無い", m.calendarOldestDate() === null);
  ok("★カレンダーは、売らないものに入っている", !m.isPaidFeature("calendar"));

  console.log("\n■ §6-2 ★無課金の方が、全期間の CSV を書き出せること");
  // ★★法定の権利です。★お支払いの有無に、関わりません。
  ok("★書き出しは、いつでも無条件", m.mayExport() === true);
  ok("★書き出しは、売らないものに入っている", !m.isPaidFeature("export"));

  console.log("\n■ §6-3 ★無課金の方に、まとめの数は返らないこと");
  for (const sc of ["week", "month", "year", "compare"]) {
    ok(`★${sc} のまとめは、返らない`, m.mayViewSummary({ ...無課金, scope: sc }) === false);
  }
  // ★★ですが、★記録一覧は返ること（★上の §6-1）。
  ok("★同じ画面でも、その日の値は返る",
    m.mayViewSummary({ ...無課金, scope: "day" }) === true);
  ok("★直近7日は、無料のまま", m.mayViewSummary({ ...無課金, scope: "last7" }) === true);

  console.log("\n■ §6-4 ★★課金が切れても、過去の記録は1件も消えない／見えなくならない");
  // ★★これが、いちばん大事な見張りです。
  //   ★解約した瞬間に過去が消えるのが、★この手のアプリで最も嫌われる事故です。
  const 解約後 = { ...OPEN, profile: { is_tester: false }, subscribed: false };
  ok("★解約後も、記録は見られる", m.mayViewRecord() === true);
  ok("★解約後も、その日の値は見られる", m.mayViewSummary({ ...解約後, scope: "day" }) === true);
  ok("★解約後も、カレンダーに制限がつかない", m.calendarOldestDate() === null);
  ok("★解約後も、書き出せる", m.mayExport() === true);
  // ★★消す処理が、この module に無いこと。
  const src = readCode("lib", "freeTier.js");
  ok("★この module は、消す処理を持たない",
    !/delete|remove|purge|truncate/i.test(src));
  // ★★お支払いを理由に、データを消す処理が、どこにも無いこと。
  const offenders = [];
  const walk = (d) => {
    for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk(p); continue; }
      if (!/\.(js|jsx)$/.test(e.name)) continue;
      if (p.includes(path.join("components", "tests"))) continue;
      const t = readCode(p);
      if (/(subscribed|subscription)[\s\S]{0,160}\.(delete|remove)\(/.test(t)) offenders.push(p);
    }
  };
  ["app", "components", "lib"].forEach(walk);
  ok(`★支払いを理由に消す処理が、どこにも無い${offenders.length ? "（★" + offenders.join(" ") + "）" : ""}`,
    offenders.length === 0);

  console.log("\n■ §6-5 ★禁じた言い方が、1つも出ないこと");
  const all = [...m.GATE_LINES, ...m.GATE_CLOSING_LINES].join(" ");
  for (const w of m.FORBIDDEN_GATE_PHRASES) {
    ok(`★「${w}」と書いていない`, !all.includes(w));
  }
  // ★★画面に出す言葉にも、無いこと。
  const screens = [];
  const walk2 = (d) => {
    for (const e of fs.readdirSync(path.join(ROOT, d), { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) { walk2(p); continue; }
      if (!/\.(js|jsx)$/.test(e.name)) continue;
      if (p.includes(path.join("components", "tests"))) continue;
      const t = readCode(p);
      // ★お金の話をしている画面にだけ、かけます。
      if (!/freeTier|GATE_LINES|mayViewSummary/.test(t)) continue;
      for (const w of ["見られません", "できません"]) if (t.includes(w)) screens.push(p + "：" + w);
    }
  };
  ["app", "components"].forEach(walk2);
  ok(`★門の画面に、禁じた言い方が無い${screens.length ? "（★" + screens.join(" ") + "）" : ""}`,
    screens.length === 0);

  console.log("\n■ ★ずっと無料の方（★運営者の判断）");
  ok("★is_tester の方は、まとめも見られる",
    m.mayViewSummary({ ...OPEN, scope: "month", profile: { is_tester: true } }) === true);
  ok("★is_tester でない方には、門がかかる",
    m.mayViewSummary({ ...OPEN, scope: "month", profile: { is_tester: false } }) === false);
  // ★★分からないときは、★無料の側に倒すこと。
  ok("★profile が読めないときは、無料に倒す",
    m.mayViewSummary({ ...OPEN, scope: "month", profile: null }) === true);
  ok("★お支払いの方は、見られる",
    m.mayViewSummary({ ...OPEN, scope: "month", profile: { is_tester: false }, subscribed: true }) === true);

  console.log("\n■ ★門は、2枚で止まっていること");
  ok("★門が切ってある", m.PAID_GATE_ENABLED === false);
  ok("★開ける日も、まだ決まっていない", m.GATE_STARTS_AT === null);
  ok("★切ってあれば、全部見られる",
    m.mayViewSummary({ scope: "year", profile: { is_tester: false } }) === true);

  console.log("\n■ ★お支払いの状態を、手元に持たないこと（線引き §2-2）");
  ok("★localStorage を使っていない", !/localStorage/.test(src));

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
