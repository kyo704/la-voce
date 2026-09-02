// お知らせの宛先と、外へ出る道の台帳（2026-09-03）
//
//   ★見張るのは、次の3つです。
//     ① 名前で対象を決めていないこと（空の列で決めると、黙って届きません）
//     ② 試験用の器には、どの段でも出さないこと
//     ③ 外へ出る道の台帳が、コードの実態と合っていること
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let 通 = 0, 否 = 0;
function ok(名, 条件) {条件 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名)); }
function eq(名, 実, 期) { 実 === 期 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log(`  ✗ ${名}  実際=${JSON.stringify(実)} 期待=${JSON.stringify(期)}`)); }

const 根 = path.join(__dirname, "..", "..");
const 読む = (p) => fs.readFileSync(path.join(根, p), "utf8");
const 取込 = (p) =>
  import("data:text/javascript;base64," + Buffer.from(読む(p)).toString("base64"));

(async () => {
  const A = await 取込("lib/noticeAudience.js");
  const O = await 取込("lib/outboundRoutes.js");

  console.log("\n① 区分の割り当て");
  eq("試験用の器は internal", A.noticeGroupOf({ is_internal: true, cohort: "tester" }), "internal");
  eq("founder かつ試験用でない → operator", A.noticeGroupOf({ cohort: "founder" }), "operator");
  eq("tester", A.noticeGroupOf({ cohort: "tester" }), "tester");
  eq("それ以外", A.noticeGroupOf({ cohort: "general" }), "general");
  eq("cohort が空でも落ちない", A.noticeGroupOf({}), "general");
  eq("null でも落ちない", A.noticeGroupOf(null), "general");
  // ★is_internal が文字列 "false" でも、true 扱いにしないこと。
  eq('is_internal が "false" の文字列', A.noticeGroupOf({ is_internal: "false", cohort: "tester" }), "tester");

  console.log("\n② 配信の段");
  ok("段①で運営者に出す", A.shouldNotify({ cohort: "founder" }, A.NOTICE_ROLLOUT[0]));
  ok("段①ではテスターに出さない", !A.shouldNotify({ cohort: "tester" }, A.NOTICE_ROLLOUT[0]));
  ok("段②でテスターに出す", A.shouldNotify({ cohort: "tester" }, A.NOTICE_ROLLOUT[1]));
  ok("段②ではそれ以外に出さない", !A.shouldNotify({ cohort: "general" }, A.NOTICE_ROLLOUT[1]));
  ok("段③で全員に出す", A.shouldNotify({ cohort: "general" }, A.NOTICE_ROLLOUT[2]));
  // ★いちばん大事な一本。
  ok("★試験用の器には、段③でも出さない",
    !A.shouldNotify({ is_internal: true, cohort: "general" }, A.NOTICE_ROLLOUT[2]));
  ok("★数えるときも、試験用は外れる",
    A.notifiableProfiles([{ cohort: "general" }, { is_internal: true }]).length === 1);

  console.log("\n③ ★名前で対象を決めていないこと");
  const 宛先 = readCode("lib/noticeAudience.js");
  ok("display_name を判定に使っていない", !/display_name\s*[=!.]/.test(宛先));
  ok("name を判定に使っていない", !/\bprofile\.name\b/.test(宛先));
  ok("「テスター」の文字で照合していない", !/["'`]テスター["'`]/.test(宛先));
  ok("メールアドレスを直接書いていない", !/@[a-z0-9-]+\.(com|jp|app)/i.test(宛先));

  console.log("\n④ 外へ出る道の台帳");
  const 道 = O.OUTBOUND_ROUTES;
  ok("1件以上ある", 道.length >= 6);
  ok("すべてに id・host・where・what がある",
    道.every((r) => r.id && r.host && r.where && r.what));
  ok("国はまだ全部が空欄（憶測で書いていない）", O.routesMissingCountry().length === 道.length);

  // ★台帳とコードの突き合わせ。コードに fetch があるのに台帳に無い、を防ぎます。
  const 実際 = new Set();
  for (const f of ["lib/anthropic.js", "app/api/feedback/route.js",
                   "app/api/line-webhook/route.js", "app/api/cron/line-reminder/route.js"]) {
    // ★コメントを外してから探します。手順の覚え書きに書かれた URL は、
    //   通信ではありません（line-webhook/route.js:13 の設定手順がそれです）。
    //   ★同じ罠に6回かかっています。読むときは必ず readCode を通します。
    for (const m of readCode(f).matchAll(/https:\/\/([a-z0-9.-]+)\//g)) 実際.add(m[1]);
  }
  const 台帳 = new Set(道.map((r) => r.host));
  for (const h of 実際) ok(`コードの ${h} が台帳にある`, 台帳.has(h));
  ok("Stripe が台帳にある（いま使っていなくても）", 道.some((r) => r.id === "stripe"));
  ok("Google カレンダーが台帳にある（<a href> なので検索で出にくい）",
    道.some((r) => r.host === "calendar.google.com"));
  ok("Supabase 本体が台帳にある", 道.some((r) => r.id === "supabase"));
  ok("調べて外向きでなかったものも残している", O.CHECKED_NOT_OUTBOUND.length >= 3);

  console.log("\n④-2 ★「一度も送っていない」の根拠が、まだ成り立っているか");
  // 台帳は「鍵が無いので fetch に到達しない」と書いています。
  // ★その主張は、route.js の★順番に乗っています。順番が変われば嘘になります。
  const 助言 = readCode("app/api/advice/route.js");
  const 鍵の位置 = 助言.indexOf("ANTHROPIC_API_KEY");
  const 送信の位置 = 助言.indexOf("getAdvice(");
  const 読出の位置 = 助言.indexOf('.from("entries")');
  ok("鍵の確認がある", 鍵の位置 !== -1);
  ok("★鍵の確認は、外へ送るより前にある（順番が逆になれば台帳が嘘になる）",
    鍵の位置 !== -1 && 送信の位置 !== -1 && 鍵の位置 < 送信の位置);
  ok("★記録の読み出しは、鍵の確認より前にある（台帳の『読んではいる』の根拠）",
    読出の位置 !== -1 && 読出の位置 < 鍵の位置);
  const 麻 = O.OUTBOUND_ROUTES.find((r) => r.id === "anthropic");
  ok("台帳に、これまで通ったかどうかが記録されている",
    麻.history && 麻.history.everTransmitted === false && !!麻.history.confirmedOn);

  console.log("\n⑤ is_internal が、4つの台帳でどう扱われるか");
  ok("★書き出しには含める（本人の状態だから）",
    読む("lib/exportData.js").includes('"is_internal"'));
  ok("★削除の除外条件になっていない",
    !/is_internal/.test(readCode("lib/accountDeletion.js")));
  ok("★控えの除外条件になっていない",
    !/is_internal/.test(readCode("lib/backupTables.js")));

  console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
  process.exit(否 ? 1 : 0);
})();
