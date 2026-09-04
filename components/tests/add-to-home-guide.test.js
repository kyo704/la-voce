// ホーム画面に置く案内（2026-09-04）
//
//   ★★iOS では、ホーム画面版と Safari で保存場所が別です。
//   ★だから、置いてから登録します。
//   ★★この画面は、自動で次に進めません。
//     ★追加したかどうかを、アプリは知りません。
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const p = (...a) => path.join(__dirname, "..", "..", ...a);
const raw = fs.readFileSync(p("components", "AddToHomeGuide.jsx"), "utf8");
const code = stripComments(raw);

console.log("\n① ★実物のスクリーンショットを使うこと");
["ios-1.png", "ios-2.png", "ios-3.png"].forEach((n) => {
  ok(`★${n} がある`, fs.existsSync(p("public", "onboarding", n)));
  ok(`★${n} を使っている`, code.includes(`/onboarding/${n}`));
});
// ★重いと、案内の画面が遅くなります。★1枚 500KB を超えないこと。
["ios-1.png", "ios-2.png", "ios-3.png"].forEach((n) => {
  const size = fs.statSync(p("public", "onboarding", n)).size;
  ok(`★${n} が重すぎない（${Math.round(size / 1024)}KB）`, size < 500 * 1024);
});

console.log("\n② ★言葉の決まり");
// ★「インストール」と書くと、ストアを探されます。
ok("★★「インストール」と書いていない", !/インストール/.test(code));
// ★追加したかどうかを、アプリは知りません。
ok("★★「ありがとう」と書いていない", !/ありがとう/.test(code));
ok("★「ホーム画面に置く」と言っている", /ホーム画面に置き/.test(code));
// ★共有ボタンの位置は、Safari の設定で上にも下にもなります。
//   ★だから、言葉では場所を断定しません。
// ★2026-09-04：★運営者の判断で、位置を書くことにしました。
//   ★「上向きの矢印」だけでは、★分かりにくい、というご指摘です。
//   ★★ただし、位置は Safari の設定で変わります。
//     ★だから、★位置を書くなら★断りも一緒に置くこと。
//     ★★「書かない」から「書くなら、必ず添える」へ変えました。
if (/画面の下の/.test(code)) {
  ok("★★位置を書くなら、断りも置いている",
    /設定によっては、画面の上に出ていることもあります/.test(code));
  ok("★断りを出す仕掛けがある", /step\.note && \(/.test(code));
} else {
  ok("★位置を書いていない（それも可）", true);
}
// ★「共有ボタン」と、名前で呼ぶこと。★形だけで説明しないこと。
ok("★★共有ボタンと名前で呼んでいる", /共有ボタン/.test(code));

console.log("\n③ ★出口があること");
ok("★「あとで」がある", /あとで/.test(code));
ok("★onSkip を呼んでいる", /onClick=\{onSkip\}/.test(code));
ok("★「もどる」がある", /もどる/.test(code));
// ★★自動で次に進めないこと。★追加したかは分かりません。
ok("★★自動で進む仕掛けが無い", !/setTimeout|setInterval|router\.push/.test(code));

console.log("\n④ ★段の数を見せること");
ok("★段の印を出している", /STEPS\.map/.test(code));
ok("★3段ある", (code.match(/src: "\/onboarding\/ios-/g) || []).length === 3);

console.log("\n⑤ ★アイコンの絵を出すこと（★探せない人がいます）");
// ★★2026-09-05、絵を差し替えました（案A・顔アップ）。
//   ★名前を変えています（-2609）。★上書きすると、古い絵が端末に残ります。
//   ★★だから、この確かめも★名前ごと追います。
ok("★アイコンを出している", /icons\/icon-120-2609\.png/.test(code));
ok("★アイコンのファイルがある", fs.existsSync(p("public", "icons", "icon-120-2609.png")));

console.log("\n⑥ ★目の見えない方にも届くこと");
const alts = raw.match(/alt: "([^"]+)"/g) || [];
ok("★3枚とも alt がある", alts.length === 3);
ok("★alt が中身を言っている（★「画像」だけにしない）",
  alts.every((a) => a.length > 20));
ok("★アイコンにも alt がある", /alt="Woolsong のアイコン/.test(raw));

console.log("\n⑦ ★1画面に収まること");
// ★★写真は縦に長いです（828×1792）。
//   ★幅いっぱいに出すと、★高さが800pxを超え、★画面に入りません。
//   ★★2026-09-04、実機で「①だけ空に見える」と報告されました。
//     ★空だったのではなく、★写真の淡いところだけが見えていました。
//     ★下の説明も、★画面の外にありました。
ok("★写真の高さを、画面に合わせている", /maxHeight: "46svh"/.test(code));
ok("★切らずに全体を入れる", /objectFit: "contain"/.test(code));
ok("★★幅いっぱいで高さを決めていない", !/width: "100%", borderRadius: 14, border/.test(code));
// ★余白を二重に持つと、★画面が縦に伸びます。
ok("★内側で余白を持っていない", !/padding: "24px 20px 40px"/.test(code));

console.log("\n⑨ ★老眼の方に届く大きさであること");
// ★★お客さまには、年配の声の professional がいらっしゃいます。
//   ★読めない案内は、★無いのと同じです。
//   ★2026-09-04、実機で「小さい」とご指摘をいただきました。
{
  const sizes = [...code.matchAll(/fontSize: (\d+)/g)].map((m) => Number(m[1]));
  ok(`★文字の大きさを取り出せた（${sizes.length}か所）`, sizes.length > 0);
  const 小さい = sizes.filter((n) => n < 14);
  ok(`★★14px 未満が無い（いま ${小さい.join(", ") || "なし"}）`, 小さい.length === 0);
  // ★押せるものは、指の大きさぶん。
  const taps = [...code.matchAll(/minHeight: (\d+)/g)].map((m) => Number(m[1]));
  ok("★押せるものに、高さを与えている", taps.length > 0 && taps.every((n) => n >= 44));
}

console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
process.exit(否 ? 1 : 0);
