/**
 * ★合言葉を 渡す 前に、★4つ お伝えして いるか。
 *
 *   ★★2026-09-16、★見本と 突き合わせて 分かりました ──
 *     ★★この 画面には、★断りが **1行も** ありません でした。
 *   ★★見本 `SC['招く']` は 持って います。★あちらは メールで 招く 画面 です。
 *     ★★形は 違っても、★4つは **渡し方に よらず 同じ** こと を 言って います。
 *   ★★坂本さんの お決め（★最優先）──「構造の 選択に かかわらず 必ず 足す こと」。
 *
 *   ★★この 見張りが 守る こと ──
 *     ① 4つ とも ある
 *     ② 字は lib が 持つ（★画面に 書き写さない）
 *     ③ 画面が 出して いる
 *     ④ 見本の 字から 離れて いない
 */
const { readCode, readRaw, loadLib } = require("./_source");

let 落ち = 0;
function t(名, 条件) {
  console.log((条件 ? "  ok   " : "  NG   ") + 名);
  if (!条件) 落ち++;
}

(async () => {
  const lib = await loadLib("lib", "teacherInvite.js");
  const vt = readCode("components/VocalTracker.jsx");
  const mihon = readCode("docs/design/pack-final/00-動く見本（さわれる・全画面）.html");

  console.log("\n=== ① 4つ とも ある ===");
  t("★4行 ある", lib.INVITE_NOTICE.length === 4);
  const 要点 = [
    ["ご請求", "お代の こと"],
    ["同意は ご本人から", "同意は ご本人から"],
    ["18歳未満", "18歳未満の 方"],
    ["見えません", "押される まで 見えない こと"]
  ];
  要点.forEach(([鍵, 名]) => {
    t(`★${名}`, lib.INVITE_NOTICE.some((l) => l.includes(鍵)));
  });

  console.log("\n=== ★較正 ── ★当たらない ものが 当たらない ===");
  t("★★入って いない ことば は 当たらない",
    !lib.INVITE_NOTICE.some((l) => l.includes("メールアドレス")));
  t("★★「送る」は 入って いない（★こちらは メールで 招く 画面では ない）",
    !lib.INVITE_NOTICE.some((l) => l === "送る"));

  console.log("\n=== ② 字は lib が 持つ ===");
  lib.INVITE_NOTICE.forEach((line) => {
    t(`★画面に 書き写して いない …「${line.slice(0, 12)}…」`, !vt.includes(line));
  });

  console.log("\n=== ③ 画面が 出して いる ===");
  t("★INVITE_NOTICE を 読み込んで いる",
    /import \{ INVITE_NOTICE, INVITE_NOTICE_BOLD \} from "@\/lib\/teacherInvite"/.test(vt));
  t("★並べて いる", /INVITE_NOTICE\.map\(/.test(vt));
  t("★太字も 出して いる", /INVITE_NOTICE_BOLD\.find\(/.test(vt));
  // ★★出す 場所 ── ★合言葉の 折りたたみの 中。★別の 画面に 置いて いない。
  const i = vt.indexOf('t("inviteStudentTitle")');
  const j = vt.indexOf("INVITE_NOTICE.map(");
  t("★★合言葉の 1枚の 中に ある", i > 0 && j > i && j - i < 2600);
  t("★★押す 前に 出る（★発行の 札より 上）",
    j < vt.indexOf("handleGenerateTeacherInvite}", i));

  console.log("\n=== ④ 見本の 字から 離れて いない ===");
  // ★★見本の `SC['招く']` に、★同じ ことが 書いて ある か。
  //   ★★「学校」→「教室」の 1文字 だけ 変えて います（★lib に 書き残し あり）。
  const 見本にある = [
    "招待中は、ご請求に 入りません。",
    "同意は ご本人から",
    "18歳未満の方は、保護者の 同意も いただきます。",
    "承知するまで"
  ];
  見本にある.forEach((x) => t(`★見本に ある …「${x.slice(0, 10)}…」`, mihon.includes(x)));
  // ★★書き残しは **注記**の 中に あります。★`readCode` は 注記を 落とします。
  //   ★★だから ここだけ `readRaw` で 見ます（★2026-09-16）。
  t("★★「学校」を「教室」に した ことを 書き残して いる",
    readRaw("lib", "teacherInvite.js").includes("1文字 変えて います"));

  console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
  process.exit(落ち === 0 ? 0 : 1);
})();
