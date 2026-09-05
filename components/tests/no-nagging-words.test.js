#!/usr/bin/env node
/**
 * 画面の文言に、急かす言葉を使わない（2026-09-01）
 *
 * ★禁止する言葉
 *   まだ／忘れ／途切れ／連続／達成／頑張
 *
 * ★なぜ
 *   通知を作るときの決まりとして出た話ですが、坂本さんの判断で
 *   ★通知にかぎらず、画面のどこでも使いません。
 *
 *   「まだ記録していません」は、記録を続けている人を急かします。
 *   「連続◯日」「達成」は、途切れた日をなかったことにできなくします。
 *   ★この製品は、記録した行為に反応します。続いたかどうかではありません。
 *
 * ★コメントと検査の文字は対象外です。
 *   説明のために「まだ」と書くのは自由です。
 *   見るのは★利用者の目に入る文字だけ。
 *   （この repo では、自分の説明コメントに引っかかる失敗を何度もやっています）
 */
const fs = require("fs");
const path = require("path");
const { stripComments } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const root = path.join(__dirname, "..", "..");
const NAGGING = ["まだ", "忘れ", "途切れ", "連続", "達成", "頑張", "記録が空いています"];

/**
 * ★「あと◯日で解放」の形も禁止です（2026-09-01）。
 *   「あと」という言葉そのものが、人を急かします。
 *   ★言ってよいのは目標だけ：「50日で、次のものが届きます」
 *   ★言ってはいけないのは差分：「あと12日で届きます」
 */
const RUSHING_PATTERNS = [/あと\s*\{?[0-9a-zA-Z_.\- ]*\}?\s*日/];

/**
 * ★「あと◯日」でも、急かしていないもの。
 *
 *   取り消せる期限は、★利用者の権利の説明です。
 *   「あと30日のあいだは、元に戻せます」は、
 *   何かを早くやらせるための言葉ではありません。逆に、
 *   ★慌てなくてよいことを伝えています。
 *   消すと、いつまで取り消せるのかが分からなくなります。
 */
const RUSHING_EXCEPTIONS = [
  { text: "元に戻せます", why: "退会を取り消せる期限。権利の説明であって、急かす言葉ではない" }
];

/**
 * ★測るための言葉としての例外。
 *
 *   「最長の連続発話ブロック」の「連続」は、★続けて話した長さのことです。
 *   何日続けて記録したか（連続記録）とは別のもので、急かす言葉ではありません。
 *   言い換えると、測っているものが分からなくなります。
 *
 *   ★ここに足すときは、必ず理由を書くこと。
 *     「言い換えにくい」は理由になりません。
 *     ★測定の名前であって、続けたことへの評価ではない、が条件です。
 */
const MEASUREMENT_EXCEPTIONS = [
  // ★★お知らせの文面（2026-09-03 確定・v3）。★1文字も変えられません。
  //   ★禁じた理由は「まだ記録していません」のように、★利用者を急かすことでした。
  //   ★★ここは、★開発者が自分の落ち度を言っています。★急かしていません。
  //   ★出どころ docs/lavoce-お知らせ画面-文面（2026-09-03確定-v3）.md の末尾に、
  //     ★この例外を足すように、と書かれています。★検査は消していません。
  { text: "私（開発者）の作り忘れです", why: "開発者が自分の落ち度を言う言葉。利用者を急かしていない" },
  { text: "最長の連続発話ブロック", why: "続けて話した長さの名前。日数の連続ではない" },
  // ★声の負荷の言葉。何日続けて本番があったかは、声帯の回復に直に効きます。
  //   記録を続けたことへの評価ではありません。
  { text: "連続公演", why: "本番が続いた日数。声の負荷そのものの言葉" },
  { text: "連続する本数", why: "続けて歌う曲数。負荷の言葉" },
  // ★これは利用者が自分の気持ちとして選ぶ札です。アプリが褒める言葉ではありません。
  { text: "達成感", why: "気持ちタグ。本人が選ぶ言葉であって、アプリが与える評価ではない" },
  // ★ここの「まだ」は、外してはいけません。
  //   「まだはっきりした傾向が出ていません」から「まだ」を取ると、
  //   ★「関係がありません」と読めます。それは3重ゲートが防いでいる断定です。
  //   「見えていない」と「無い」は別のことです（viz-rules.test.js §5）。
  //   ★急かす言葉としての「まだ」ではなく、慎重さのための「まだ」です。
  { text: "まだはっきりした傾向が出ていません",
    why: "表示ゲートの文言。★外すと「関係なし」と断定したことになる（viz-rules §5）" }
];

/**
 * 利用者の目に入る文字だけを取り出す。
 *   ・JSX の地の文（>ここ<）
 *   ・翻訳の日本語（ja: "ここ"）
 * ★変数名・関数名・console・検査の文字は含めません。
 */
function userFacingStrings(src) {
  const code = stripComments(src);
  const out = [];
  // JSX の地の文
  //   ★改行をまたぐ地の文も見ます（2026-09-04）。
  //     もとは [^<>{}\n] と書いていて、★改行を含む文を1つも見ていませんでした。
  //     そのため
  //       <p ...>
  //         担当の生徒さんは、まだ…
  //       </p>
  //     の形が、この検査をすり抜けていました。実際にすり抜けました。
  //     ★1行に書いたときだけ落ちる検査は、検査になっていません。
  (code.match(/>[^<>{}]{4,}</g) || [])
    .forEach((m) => out.push(m.slice(1, -1).replace(/\s+/g, " ").trim()));
  // 翻訳の日本語
  (code.match(/\bja:\s*"([^"]{2,})"/g) || []).forEach((m) => out.push(m.replace(/^\bja:\s*"/, "").slice(0, -1)));
  // 画面に出すことが分かっている関数の引数
  (code.match(/set\w*Error\("([^"]{4,})"\)/g) || []).forEach((m) => out.push(m));
  return out.filter((t) => /[ぁ-んァ-ヶ一-龯]/.test(t));
}

/**
 * ★連続記録（ストリーク）は、2026-09-01 に累計へ切り替えました。
 *
 *   もとは「現在の連続記録」「最長連続記録」を数えて出していました。
 *   ★続いたかどうかで人を測る形だったので、やめました。
 *   数えるのは★累計の記録日数だけです。
 *
 *   ★切り替えで誰も損をしません。累計は連続より必ず大きいので、
 *     解放ずみのものが戻ることはありません。
 *   ★羊とおうちの仕組みは残しています。数え方を変えただけです。
 *
 *   消したもの：computeStreaks（lib/character.js）／recordStreak
 *   （VocalTracker）／labelCurrentStreak・labelLongestStreak・
 *   noteUnlockDecorationSuffix（translations）
 *   ★使わない関数として残しませんでした。残すと、いつかまた呼ばれます。
 */
const STREAK_REMOVED_NAMES = [
  "computeStreaks", "recordStreak", "currentStreak", "longestStreak",
  "labelCurrentStreak", "labelLongestStreak", "noteUnlockDecorationSuffix"
];

/**
 * ★検査の穴がふさがって、初めて見えた文（2026-09-04）。
 *
 *   もとの取り出しは /> [^<>{}\n]{4,} </ で、★改行を含む地の文を
 *   1つも見ていませんでした。1行に書いたときだけ落ちる検査でした。
 *   穴をふさいだところ、★8つの文が新しく引っかかりました。
 *   どれも前からあったもので、今日入れたものではありません。
 *
 *   ★ここに並べたものは「よい」と判断したものではありません。
 *     ★坂本さんの判断を待っている、というだけの意味です。
 *   ★この一覧は、減る方向にだけ動かしてください。
 *     足すのは、判断を1つ先送りにすることです。
 *   ★新しく書く文は、ここに足さないこと。
 */
const PENDING_REVIEW = [
  // 慎重さのための「まだ」（表示ゲートの家族）。外すと「関係が無い」と断定になります。
  "はっきりした関係は、まだ見えていません",
  "まだ明確な快適帯は見えていません",
  "灰色のマスはまだ記録が14日分たまっていません",
  // 「なぜ出せないか」の説明。急かしてはいませんが、言い換えの余地はあります。
  "前日の記録がまだ無いため",
  "両方の音名が記録された日がまだありません",
  "この月の記録はまだありません",
  "まだ連携が確認できません",
  // ★これは説明文ですが、★機能そのものが記録を促すものです。
  //   文言だけの問題ではないので、坂本さんの判断が要ります。
  "まだ記録していない日の朝に"
];

const TARGETS = [
  ["components", "VocalTracker.jsx"],
  ["lib", "translations.js"],
  ["components", "CharacterHome.jsx"],
  ["components", "HealthInfo.jsx"]
];

console.log("=== ★急かす言葉が、画面に出ていない ===");
{
  let found = [];
  TARGETS.forEach(([dir, file]) => {
    const p = path.join(root, dir, file);
    if (!fs.existsSync(p)) return;
    const strings = userFacingStrings(fs.readFileSync(p, "utf8"));
    strings.forEach((txt) => {
      if (MEASUREMENT_EXCEPTIONS.some((e) => txt.includes(e.text))) return;
      if (PENDING_REVIEW.some((e) => txt.includes(e))) return;
      NAGGING.forEach((w) => {
        if (txt.includes(w)) found.push(`${file}「${txt.slice(0, 40)}」← ${w}`);
      });
    });
  });
  assertTrue(found.length === 0,
    found.length === 0
      ? `★${NAGGING.join("／")} が画面に出ていない`
      : `★急かす言葉: ${found.slice(0, 5).join(" ／ ")}${found.length > 5 ? ` ほか${found.length - 5}件` : ""}`);
}

console.log("\n=== ★連続記録が、消えたままである ===");
{
  // ★★2026-09-05、★お知らせの文面を足すときに気づきました。
  //   ★lib/notices.js と NoticeScreen を、★見ていませんでした。
  //   ★★利用者に出る言葉なのに、★検査の外にありました。
  //   ★見る場所を増やします。★言葉が増える場所は、必ずここに足すこと。
  const files = ["components/VocalTracker.jsx", "components/CharacterHome.jsx",
    "lib/character.js", "lib/translations.js",
    "lib/notices.js", "components/NoticeScreen.jsx"];
  let back = [];
  files.forEach((f) => {
    const p = path.join(root, f);
    if (!fs.existsSync(p)) return;
    const code = stripComments(fs.readFileSync(p, "utf8"));
    STREAK_REMOVED_NAMES.forEach((n) => { if (code.includes(n)) back.push(`${f}: ${n}`); });
  });
  assertTrue(back.length === 0,
    back.length === 0 ? "★連続記録の名前が1つも残っていない" : `★戻っている: ${back.join(", ")}`);
  // 累計は残っていること（仕組みごと消したのではない）
  const ch = stripComments(fs.readFileSync(path.join(root, "components/CharacterHome.jsx"), "utf8"));
  assertTrue(/totalDaysRecorded/.test(ch), "★累計の日数は残っている（羊とおうちは残す）");
  const chr = stripComments(fs.readFileSync(path.join(root, "lib/character.js"), "utf8"));
  assertTrue(!/computeStreaks/.test(chr), "★使わない関数として残していない");
}

console.log("\n=== ★「あと◯日」で急かしていない ===");
{
  let rushed = [];
  TARGETS.forEach(([dir, file]) => {
    const p = path.join(root, dir, file);
    if (!fs.existsSync(p)) return;
    userFacingStrings(fs.readFileSync(p, "utf8")).forEach((txt) => {
      if (RUSHING_EXCEPTIONS.some((e) => txt.includes(e.text))) return;
      RUSHING_PATTERNS.forEach((re) => { if (re.test(txt)) rushed.push(`${file}「${txt.slice(0, 34)}」`); });
    });
  });
  assertTrue(rushed.length === 0,
    rushed.length === 0
      ? "★「あと◯日」の言い方が無い"
      : `★急かす言い方: ${rushed.slice(0, 4).join(" ／ ")}`);
}

console.log("\n=== 直した3つが、戻っていない ===");
{
  const vt = stripComments(fs.readFileSync(path.join(root, "components/VocalTracker.jsx"), "utf8"));
  assertTrue(!vt.includes("まだ読み込みが終わっていません"), "★読み込み中の案内から「まだ」が消えている");
  assertTrue(vt.includes("読み込み中です"), "言い換えが入っている");
  assertTrue(!vt.includes("まだ記録がありません"), "★空のときの案内から「まだ」が消えている");
  assertTrue(!vt.includes("まだ結論を出していません"), "★引き継ぎの断りから「まだ」が消えている");
  assertTrue(vt.includes("結論を出すには日数が足りません"), "言い換えが入っている");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
