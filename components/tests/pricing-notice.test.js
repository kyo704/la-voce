// ============================================================================
// 有料化のお知らせ ── 仕組みだけ作り、まだ出さない（2026-09-07）
//
//   ★★順番を逆にしないこと。
//     ★④有料を開ける を先にやると「知らないうちに有料になった」と言われます。
//     ★⑤規約を書き換える を先にやると、規約と実物が食い違います。
//
//   ★★日付が決まるまで、★何も出ませんし、★1通も送りません。
//     ★ここで、それを見張ります。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  // ★freeTier の GATE_CLOSING_LINES を埋めこんで読みます。
  let src = fs.readFileSync(path.join(ROOT, "lib", "pricingNotice.js"), "utf-8");
  const ft = fs.readFileSync(path.join(ROOT, "lib", "freeTier.js"), "utf-8");
  const seg = ft.slice(ft.indexOf("export const GATE_CLOSING_LINES"));
  src = src.replace(/import \{ GATE_CLOSING_LINES \} from "@\/lib\/freeTier";/,
    seg.slice(0, seg.indexOf("]);") + 3));
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ 日付が決まるまで、動かないこと");
  // ★★これが、いちばん大事です。★うっかり出さないための形です。
  ok("★開ける日が、まだ決まっていない", m.GO_LIVE_DATE === null);
  ok("★知らせ始める日も、決まらない", m.NOTICE_STARTS_AT === null);
  ok("★いつ聞かれても、知らせない", m.noticeIsDue("2099-12-31") === false);
  ok("30日前という決めがある", m.NOTICE_DAYS_BEFORE === 30);

  console.log("■ 送らない方");
  ok("★こちら側の口座には、送らない", m.mayMail({ is_internal: true }, "a@b.c") === false);
  ok("★退会を申し出た方には、送らない", m.mayMail({ deleted_at: "2026-09-01" }, "a@b.c") === false);
  ok("アドレスが無ければ、送らない", m.mayMail({}, "") === false);
  ok("ふつうの方には、送る", m.mayMail({}, "a@b.c") === true);

  console.log("■ 文");
  const paras = m.noticeParagraphs("10月19日");
  const all = paras.join("\n");
  // ★★必ず添える2行が、そのまま入っていること（lib/freeTier.js の決め）。
  ok("★「記録は、これまでどおり残ります。」が入っている",
    all.includes("記録は、これまでどおり残ります。"));
  ok("★「書き出しは、いつでも無料です。」が入っている",
    all.includes("書き出しは、いつでも無料です。"));
  ok("受診用のまとめにも触れている", all.includes("受診用のまとめ"));
  // ★★急かす言葉を、使わないこと。
  for (const w of ["まだ", "忘れ", "途切れ", "連続", "達成", "頑張"]) {
    ok(`★急かす言葉「${w}」が無い`, !all.includes(w));
  }
  // ★★禁じた言い方を、使わないこと（lib/freeTier.js）。
  for (const w of ["見られません", "できません", "無料期間が終わり", "制限されました"]) {
    ok(`★禁じた言い方「${w}」が無い`, !all.includes(w));
  }
  ok("件名が、急かしていない",
    !/重要|至急|お急ぎ|必ずお読み/.test(m.MAIL_SUBJECT));
  // ★★2か所に書かないこと。★freeTier から引いていること。
  const code = readCode("lib", "pricingNotice.js");
  ok("★決まりの2行を、書き写していない",
    !/記録は、これまでどおり残ります。/.test(code));
  ok("★freeTier から引いている", /GATE_CLOSING_LINES/.test(code));

  console.log("■ 送る道（app/api/cron/pricing-notice）");
  const route = readCode("app", "api", "cron", "pricing-notice", "route.js");
  // ★★既定は、数えるだけ。★送るには、はっきり書かせる。
  ok("★既定は、数えるだけ", /send=\"?1\"? ?\)?;?[\s\S]{0,40}reallySend|reallySend = url\.searchParams\.get\("send"\) === "1"/.test(route));
  ok("★日付が無ければ、送らない", /if \(!GO_LIVE_DATE\)/.test(route));
  ok("★知らせ始める日より前なら、送らない", /!noticeIsDue\(todayISO\)/.test(route));
  // ★★二度送らないこと。
  ok("★送った人を、覚えている", /MAIL_KEY/.test(route));
  ok("★覚えている人を、外している", /alreadySent\.has/.test(route));
  ok("★送れてから、残している",
    route.indexOf("res.ok") < route.indexOf("user_notices\")\n        .insert") ||
    /if \(!res\.ok\)[\s\S]{0,400}insert\(\{ user_id: t\.id, notice_key: MAIL_KEY/.test(route));
  // ★★認証は、閉じる方向に倒すこと。
  ok("★秘密が無ければ 503", /if \(!cronSecret\)[\s\S]{0,200}503/.test(route));
  ok("★合わなければ 401", /401/.test(route));
  // ★★黙らないこと。
  ok("★送れなかったら、記録に残す", /送れませんでした/.test(route));
  ok("★一度に送る数を、区切っている", /BATCH/.test(route));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
