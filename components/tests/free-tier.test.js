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
  // ★★門の画面に出す言葉にも、無いこと。
  //   ★★見る範囲を、★門の画面だけに絞ります（2026-09-05 夜に直しました）。
  //     ★はじめ「mayViewSummary を使っているファイル」を丸ごと見ていました。
  //     ★VocalTracker が引っかかりました ── ★マイクのエラー文
  //       （「このブラウザではマイクを使用できません」）です。
  //     ★★門とは関係のない文まで見ていました。★広すぎました。
  const gateCopy = [
    readCode("components", "GateNotice.jsx"),
    m.GATE_LINES.join(" "),
    m.GATE_CLOSING_LINES.join(" ")
  ].join("\n");
  const bad = ["見られません", "できません", "無料期間", "制限されました"]
    .filter((w) => gateCopy.includes(w));
  ok(`★門の画面に、禁じた言い方が無い${bad.length ? "（★" + bad.join(" ") + "）" : ""}`,
    bad.length === 0);

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

  console.log("\n■ ★★門は、いま開いています（★2026-09-05・試しのため）");
  // ★★開けた狙いは、★運営者ご自身が、本物のお金で
  //   ★申し込み → 契約 → 解約 まで通すことです。
  // ★★ほかの方に、★門をかけないための鍵が、★もう1つあります。
  //   ★NEXT_PUBLIC_GATE_TEST_USER_IDS（①-2）。
  //   ★★あれが空になると、★門は全員にかかります。★同時に決めること。
  ok("★門が開いている", m.PAID_GATE_ENABLED === true);
  ok("★開けた日が、書いてある", typeof m.GATE_STARTS_AT === "string" && m.GATE_STARTS_AT.length === 10);
  // ★一覧が在るあいだは、★その中の方だけに門がかかること。
  const 試し = { NEXT_PUBLIC_GATE_TEST_USER_IDS: "aaa-111" };
  ok("★★一覧に居ない方は、いまも全部見られる",
    m.mayViewSummary({ scope: "year", profile: { is_tester: false }, userId: "zzz", env: 試し }) === true);
  ok("★一覧に居る方には、門がかかる",
    m.mayViewSummary({ scope: "year", profile: { is_tester: false }, userId: "aaa-111", env: 試し }) === false);
  // ★★is_tester の方は、★どちらにしても、そのままです。
  ok("★is_tester の方は、一覧に居ても見られる",
    m.mayViewSummary({ scope: "year", profile: { is_tester: true }, userId: "aaa-111", env: 試し }) === true);

  console.log("\n■ ★期間 → まとめの単位（★1か所で対応させること）");
  ok("★last7 だけが、無料の側", m.scopeForPeriod("last7") === "last7");
  for (const p of ["week", "month", "year"]) {
    ok(`★${p} は、そのままの単位`, m.scopeForPeriod(p) === p);
  }
  // ★★知らない値を、無料側に倒さないこと。★増やした人が、門を素通りします。
  for (const p of ["all", "custom", "aroundPerformance", "なぞの値"]) {
    ok(`★${p} は、まとめ扱い`, m.scopeForPeriod(p) === "compare");
  }

  console.log("\n■ ★画面につながっていること（2026-09-05 夜・第1段）");
  const vt = readCode("components", "VocalTracker.jsx");
  ok("★分析タブが、判定を通している", /mayViewSummary\(\{[\s\S]{0,120}scopeForPeriod\(analysisPeriod\)/.test(vt));
  ok("★期間の札に「直近7日」がある", /"last7", "week", "month", "year"/.test(vt));
  ok("★お支払いの状態を、サーバから取っている", /from\("subscriptions"\)[\s\S]{0,80}status/.test(vt));
  // ★★localStorage に持たないこと（線引き §2-2）。
  ok("★お支払いを localStorage に持っていない",
    !/localStorage[\s\S]{0,80}subscri/i.test(vt));
  // ★★読めないときは、門をかけないこと（★渡しすぎる側に倒す）。
  ok("★読めないときは false にしていない", /setSubscribed\(null\)|useState\(null\)/.test(vt));
  // ★★カードを消さないこと。★札を1枚、置くだけです。
  ok("★カードを消していない（★札を置くだけ）", /<GateNotice/.test(vt));
  const gate = readCode("components", "GateNotice.jsx");
  ok("★文言は lib から取っている", /GATE_LINES/.test(gate));
  ok("★締めの2行も出している", /GATE_CLOSING_LINES/.test(gate));
  // ★★画面を覆うモーダルにしないこと（線引き §6-3）。
  ok("★画面を覆っていない", !/fixed inset-0/.test(gate));
  ok("★閉じるボタンを置いていない", !/閉じる|onClose/.test(gate));
  // ★★「直近7日」と「1週間」を、1つにまとめないこと。★門が消えます。
  ok("★last7 と week を、絞り込みで分けて扱っている",
    /analysisPeriod === "last7" \|\| analysisPeriod === "week"/.test(vt));

  console.log("\n■ ★★試すあいだ、自分にだけ門をかけること（2026-09-05 夜）");
  // ★本物のお金で、申し込み → 契約 → 解約 まで通す必要があります。
  //   ★そのあいだ、★ほかの方に門をかけたくありません。
  const E = { NEXT_PUBLIC_GATE_TEST_USER_IDS: "aaa-111, bbb-222" };
  const 門あり = { ...OPEN, scope: "month", profile: { is_tester: false } };
  ok("★一覧が空なら、ふだんどおり（★門がかかる）",
    m.mayViewSummary({ ...門あり }) === false);
  ok("★一覧に居る方には、門がかかる",
    m.mayViewSummary({ ...門あり, env: E, userId: "aaa-111" }) === false);
  ok("★★一覧に居ない方には、門がかからない",
    m.mayViewSummary({ ...門あり, env: E, userId: "zzz-999" }) === true);
  ok("★2人目も、ちゃんと拾う",
    m.mayViewSummary({ ...門あり, env: E, userId: "bbb-222" }) === false);
  ok("★試す方が買えば、見られる",
    m.mayViewSummary({ ...門あり, env: E, userId: "aaa-111", subscribed: true }) === true);
  // ★★お客さまのIDを、リポジトリに書かないこと。
  const src2 = readCode("lib", "freeTier.js");
  ok("★IDを、コードに書いていない",
    !/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/.test(src2));
  ok("★環境変数から読んでいる", /NEXT_PUBLIC_GATE_TEST_USER_IDS/.test(src2));
  // ★★空・壊れた値で、誰も止めないこと。
  ok("★空の文字なら、ふだんどおり",
    m.gateAppliesTo("aaa-111", { NEXT_PUBLIC_GATE_TEST_USER_IDS: "" }) === null);
  ok("★カンマだけなら、ふだんどおり",
    m.gateAppliesTo("aaa-111", { NEXT_PUBLIC_GATE_TEST_USER_IDS: " , , " }) === null);
  ok("★渡し忘れても、ふだんどおり", m.gateAppliesTo("aaa-111", null) === null);
  // ★画面から、ちゃんと渡していること。
  const vt2 = readCode("components", "VocalTracker.jsx");
  ok("★画面が、userId を渡している", /userId,\s*\n\s*env: \{ NEXT_PUBLIC_GATE_TEST_USER_IDS/.test(vt2));

  console.log("\n■ ★お支払いの画面（/billing）── ★門から来た方が着く先");
  const bill = readCode("app", "billing", "page.js");
  // ★★REQUIRE_SUBSCRIPTION と PAID_GATE_ENABLED は、★別の決めです。
  //   REQUIRE_SUBSCRIPTION … 払わないと、アプリそのものが使えない（★休止中）
  //   PAID_GATE_ENABLED    … アプリは無料。★まとめだけが有料（⑫）
  ok("★2つの決めを、分けて見ている",
    /PAID_GATE_ENABLED && !!GATE_STARTS_AT/.test(bill));
  ok("★REQUIRE_SUBSCRIPTION と混ぜていない",
    /!requireSubscription && paidGateOpen/.test(bill));
  // ★★何が無料で、何が有料かを、★画面で並べ直さないこと。
  ok("★無料の一覧を、lib から出している", /NEVER_PAID\.map/.test(bill));
  ok("★有料の一覧を、lib から出している", /PAID_FEATURES\.map/.test(bill));
  ok("★名前も lib から取っている", /featureLabel\(k\)/.test(bill));
  // ★★先に「無料のもの」、★あとで「増えるもの」。
  ok("★無料のほうが、先に出る",
    bill.indexOf("NEVER_PAID.map") < bill.indexOf("PAID_FEATURES.map"));
  // ★★締めの2行を、必ず添えること。
  ok("★締めの2行を出している", /GATE_CLOSING_LINES\.map/.test(bill));
  // ★★年齢の帯の門を、通していること。
  ok("★年齢の帯の門を通している", /<MinorConsentGate band=\{band\}/.test(bill));
  // ★★禁じた言い方が無いこと。
  const billBad = ["見られません", "できません", "無料期間", "制限されました"]
    .filter((w) => bill.includes(w));
  ok(`★禁じた言い方が無い${billBad.length ? "（★" + billBad.join(" ") + "）" : ""}`,
    billBad.length === 0);
  // ★鍵の名前を、そのまま画面に出していないこと。
  ok("★鍵の名前に、全部見せる名前がある",
    [...m.PAID_FEATURES, ...m.NEVER_PAID].every((k) => !!m.FEATURE_LABELS[k]));

  console.log("\n■ ★お支払いの状態を、手元に持たないこと（線引き §2-2）");
  ok("★localStorage を使っていない", !/localStorage/.test(src));

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
