#!/usr/bin/env node
/**
 * 復旧の入口の画面と、変更のお知らせ（2026-09-05）
 *
 *   出どころ docs/reports/2026-09-05-復旧コードの使い方-設計.md §2・§4
 *            docs/opus/lavoce-判断-メールを失うこと（9月4日・夜）.md §3・§7
 *
 *   実行  node components/tests/recovery-entry-and-notice.test.js
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
  const page = readCode("app", "recovery", "page.js");
  const login = readCode("app", "login", "page.js");
  const redeem = readCode("app", "api", "recovery", "redeem", "route.js");

  console.log("\n① ★★たどり着けること（★どこからも行けない画面は、無いのと同じ）");
  ok("★ログインの画面から行ける", /href="\/recovery"/.test(login));
  ok("★何の道かが、言葉で分かる", /メールそのものが使えない方は/.test(login));

  console.log("\n② ★聞くのは3つだけ");
  ok("★いままでのアドレス", /oldEmail/.test(page));
  ok("★控えの番号", /isWellFormedRecoveryCode/.test(page));
  ok("★これから使うアドレス", /newEmail/.test(page));
  // ★★これ以上、聞かないこと。★確かめられないことを聞いても、意味がありません。
  ok("★生年月日や秘密の質問を聞いていない",
    !/生年月日|秘密の質問|母親の旧姓/.test(page));

  console.log("\n②-2 ★★新しいアドレスを、本当にお持ちであること（2026-09-05 夜）");
  // ★★以前は、ここが抜けていました。
  //   ★付け替えは admin の経路で、★番号を1通も送りません。
  //   ★つまり、★新しいアドレスを持っているかを、★誰も確かめていませんでした。
  //   ★画面には「番号をお送りしています」と出ていました。★嘘でした。
  ok("★画面が、実際に番号を送っている", /signInWithOtp/.test(page));
  ok("★新しいアカウントを作らない（shouldCreateUser: false）",
    /shouldCreateUser: false/.test(page));
  ok("★番号を入れる段に進む", /<OtpCodeStep/.test(page));
  // ★★番号を入れないと、中に入れないこと。
  ok("★番号が合ってから、中へ入る",
    /onVerified=\{\(\) => \{ window\.location\.href = "\/dashboard"; \}\}/.test(page));
  ok("★受け付けただけで、中へ入っていない",
    !/setDone\(true\)[\s\S]{0,200}location\.href = "\/dashboard"/.test(page));
  // ★★経路の側は、送っていないので「送りました」と言わないこと。
  ok("★経路が「送りました」と言っていない", !/番号をお送りしています/.test(redeem));

  console.log("\n②-3 ★★打ち間違いで、締め出さないこと");
  // ★間違えたアドレスに付け替わると、★二度と入れません。★控えも使い切っています。
  ok("★新しいアドレスを、2回聞いている", /newEmail2/.test(page));
  ok("★そろっていないと、進めない", /sameNew/.test(page));
  ok("★そろっていないことを、その場で伝える", /そろっていません/.test(page));

  console.log("\n③ ★調べる道具にしないこと");
  // ★★「そのアドレスは登録されていません」と言わないこと。
  ok("★登録の有無を、言い分けていない",
    !/登録されていません|見つかりません|そのアドレスは/.test(page));
  // ★★2026-09-05 夜に変えました。
  //   ★以前は「送りました」と書きながら、★1通も送っていませんでした。
  //   ★いまは、★本当に送ってから言います。★だから、言ってよいのです。
  //   ★見るのは「言っているか」ではなく、★「言う前に送っているか」です。
  ok("★言う前に、実際に送っている",
    page.indexOf("signInWithOtp") < page.indexOf("番号を送りました"));
  ok("★届かないときの理由を、断定していない", /可能性があります/.test(page));

  console.log("\n④ ★正直に書くこと");
  // ★★あとで「何とかしてください」が来ます。★そのとき、何ともできません。
  ok("★元に戻せない、と書いてある", /元に戻すことはできません/.test(page));
  ok("★記録は残っている、と書いてある", /記録は残っています/.test(page));

  console.log("\n⑤ ★入力欄（★老眼と、iOS の拡大）");
  ok("★本物の <form> である", /<form/.test(page));
  ok("★入力欄に 16px の下限がある", /fontSize: "max\(16px, [0-9.]+rem\)"/.test(page));
  ok("★アドレスに autocomplete がある", /autoComplete="email"/.test(page));
  // ★控えの番号は、★端末に覚えさせないこと。
  ok("★控えの番号は autocomplete を切っている",
    /name="recovery-code" autoComplete="off"/.test(page));

  console.log("\n⑥ ★変更のお知らせ（§7）");
  const b64 = Buffer.from(fs.readFileSync(path.join(ROOT, "lib", "securityMail.js"))).toString("base64");
  const m = await import("data:text/javascript;base64," + b64);
  // ★★新旧の両方に送ります。★古いほうが受け取れなくても、送ります。
  //   ★「古いアドレスがまだ生きていた」場合が、いちばん危ないからです。
  let tos = [];
  const fake = async (url, opt) => { tos.push(JSON.parse(opt.body).to); return { ok: true }; };
  const n = await m.sendEmailChangedNotice({
    fetchImpl: fake, apiKey: "k", from: "f", oldEmail: "old@ex.com", newEmail: "new@ex.jp",
    changedVia: "recovery"
  });
  ok("★2通、送っている", n === 2);
  ok("★古いほうにも送っている", tos.includes("old@ex.com"));
  ok("★新しいほうにも送っている", tos.includes("new@ex.jp"));
  // ★鍵が無いときは、黙って0通。★呼んだ側を止めません。
  ok("★鍵が無ければ、0通（★止めない）",
    (await m.sendEmailChangedNotice({ fetchImpl: fake, apiKey: "", oldEmail: "a@b.c" })) === 0);

  console.log("\n⑥-2 ★★止めないことと、黙ることは、別です（2026-09-05 夜）");
  // ★お知らせが1通も届かず、★理由がどこにも残っていませんでした。
  //   ★黙ると、★なぜ届かないのかを、★誰も追えません。
  const mailSrc = readCode("lib", "securityMail.js");
  ok("★鍵が無いときに、理由を残している", /RESEND_API_KEY が設定されていません/.test(mailSrc));
  ok("★断られたときに、理由を残している", /断られました status=/.test(mailSrc));
  ok("★断られた本文も残している", /res\.text\(\)/.test(mailSrc));
  // ★★それでも、★呼んだ側は止めないこと。
  let calls = 0;
  const refuse = async () => { calls += 1; return { ok: false, status: 403, text: async () => "no" }; };
  const n2 = await m.sendEmailChangedNotice({
    fetchImpl: refuse, apiKey: "k", oldEmail: "a@b.c", newEmail: "d@e.f", changedVia: "recovery"
  });
  ok("★断られても、2通とも試している", calls === 2);
  ok("★断られたら、0通と返す（★嘘をつかない）", n2 === 0);

  console.log("\n⑦ ★★お知らせの中身に、アドレスを全部書かないこと");
  // ★このメール自体が、★他人の手に渡ることがあります。
  ok("★アドレスを伏せている", m.maskEmail("sakamoto@example.com").includes("＊"));
  ok("★ドメインは残している（★本人には分かる）",
    m.maskEmail("sakamoto@example.com").endsWith("@example.com"));
  const lines = m.emailChangedLines({ oldEmail: "old@ex.com", newEmail: "new@ex.jp", changedVia: "recovery" }).join("\n");
  ok("★本文に、アドレスが丸ごと出ていない",
    !lines.includes("old@ex.com") && !lines.includes("new@ex.jp"));
  // ★★「ご確認ください」で終わらせないこと。★何をすればよいか分かりません。
  ok("★心当たりが無いときに、することが書いてある", /までお知らせください/.test(lines));
  ok("★記録は残っている、と添えている", /記録は、これまでどおり残っています/.test(lines));

  console.log("\n⑧ ★付け替えの経路から、呼ばれていること");
  ok("★redeem が、お知らせを送っている", /sendEmailChangedNotice/.test(redeem));
  // ★★送れなくても、付け替えは止めません。★入れないほうが重いです。
  ok("★送れなくても、止めていない", /notified === 0\) console\.error/.test(redeem));

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
