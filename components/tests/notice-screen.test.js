#!/usr/bin/env node
/**
 * お知らせ画面（v3）── ★文面が、正と1文字も違わないこと（2026-09-05）
 *
 *   出どころ docs/lavoce-お知らせ画面-文面（2026-09-03確定-v3）.md
 *
 *   ★★文面は、★1文字も変えません。
 *     ★要約も、言い換えも、丁寧にすることも、しません。
 *     ★正の md と、★1段落ずつ突き合わせます。
 *
 *   実行  node components/tests/notice-screen.test.js
 */

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");

let pass = 0;
let fail = 0;
function ok(label, cond) {
  if (cond) { pass += 1; console.log("  ✓ " + label); }
  else { fail += 1; console.log("  ✗ " + label); }
}

// ★空白・改行・全角の空白を落として比べます。★折り返しの違いで落ちないためです。
const squash = (t) => String(t).replace(/[\s　]+/g, "");

(async () => {
  const b64 = Buffer.from(fs.readFileSync(path.join(ROOT, "lib", "notices.js"))).toString("base64");
  const m = await import("data:text/javascript;base64," + b64);
  const md = readRaw("docs", "lavoce-お知らせ画面-文面（2026-09-03確定-v3）.md");
  const paras = m.NOTICE_PARAGRAPHS.consentApology2026;

  console.log("\n① ★★文面が、正のとおりであること");
  ok(`★段落が5つある（いま ${paras.length}）`, paras.length === 5);
  const mdFlat = squash(md);
  paras.forEach((p, i) => {
    ok(`★${i + 1}つめの段落が、正のとおり`, mdFlat.includes(squash(p)));
  });
  ok("★見出しが、正のとおり", mdFlat.includes(squash(m.NOTICE_TEXT.consentApology2026)));

  console.log("\n② ★★落としてはいけない段落");
  const all = squash(paras.join(""));
  // ★いちばん心配されるところです。★落とさないこと。
  ok("★「外部に渡ったということではありません」がある",
    all.includes(squash("記録が外部に渡ったということではありません")));
  // ★v2 から足した1段落（Opus・運営者の承認ずみ）。
  ok("★規約とポリシーを直した、の段落がある",
    all.includes(squash("利用規約とプライバシーポリシーの書き方を")));
  // ★撤回のボタンを作っていなかった、という自分の落ち度。
  ok("★撤回のボタンの件がある", all.includes(squash("撤回するためのボタンを作っていませんでした")));
  ok("★要配慮個人情報にあたる、と言っている", all.includes(squash("要配慮個人情報")));

  console.log("\n③ ★言い換えていないこと");
  // ★★丁寧にしたり、短くしたりしないこと。
  ok("★「ご迷惑」を足していない", !/ご迷惑/.test(all));
  ok("★「申し訳ございません」を足していない", !/申し訳ございません/.test(all));
  ok("★「〜させていただ」を足していない", !/させていただ/.test(all));

  console.log("\n④ ★画面の作り");
  const sc = readCode("components", "NoticeScreen.jsx");
  // ★★文面を、画面に書き写さないこと。★2か所になります。
  ok("★文面は lib から取っている", /NOTICE_PARAGRAPHS/.test(sc));
  ok("★画面に、本文を直に書いていない", !/要配慮個人情報/.test(sc));
  // ★★出口を必ず置くこと。
  ok("★「あとで」がある", /あとで/.test(sc));
  ok("★「同意の画面へ」がある", /同意の画面へ/.test(sc));
  // ★2つの文書へ行けること。
  ok("★プライバシーポリシーへ行ける", /\/legal\/privacy/.test(sc));
  ok("★利用規約へ行ける", /\/legal\/terms/.test(sc));
  // ★お詫びの画面です。★明るくしないこと。
  ok("★羊や点を出していない", !/羊|pt|ポイント|おめでとう/.test(sc));

  console.log("\n⑤ ★出し方");
  const vt = readCode("components", "VocalTracker.jsx");
  ok("★1度だけの仕掛けを通している", /shouldShowNotice\(noticeState, "consentApology2026"\)/.test(vt));
  // ★★「あとで」を押した方には、★次にまた出ます。★責めません。
  ok("★「あとで」で既読にしている", /onLater=\{\(\) => markNoticeShown\("consentApology2026"\)\}/.test(vt));
  // ★同意し直した方には、二度と出ないこと。
  ok("★同意のあとに、既読にしている",
    /markNoticeShown\("consentApology2026"\)[\s\S]{0,80}setRenewingConsent\(false\)/.test(vt));
  // ★★onboarding_completed を false に戻さないこと。
  //   ★戻すと、プロフィールの設定からやり直しになります。
  ok("★onboarding_completed を戻していない",
    !/onboarding_completed: false/.test(vt));
  ok("★同意だけの1段を借りている", /<OnboardingFlow existingUser onComplete/.test(vt));

  console.log("\n⑥ ★禁じた言葉の検査が、この文面も見ていること");
  const nag = readRaw("components", "tests", "no-nagging-words.test.js");
  ok("★lib/notices.js を見ている", /"lib\/notices\.js"/.test(nag));
  ok("★NoticeScreen を見ている", /"components\/NoticeScreen\.jsx"/.test(nag));
  // ★★検査を消していないこと。★例外に、理由が書いてあること。
  ok("★例外に、理由が書いてある", /開発者が自分の落ち度を言う言葉/.test(nag));

  console.log(`\n★とおった ${pass} ／ ★落ちた ${fail}`);
  process.exit(fail === 0 ? 0 : 1);
})();
