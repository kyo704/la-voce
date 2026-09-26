/**
 * ★合言葉で 入る（★見本 `SC['合言葉で入る']`／★裁定その68 ②）。
 *
 *   ★★この 見張りが 守る こと ──
 *     ① 8文字。★見本の `maxlength="6"` を 書き写して いない
 *     ② 引くのも 入るのも、★**すでに ある 手**を 使う（★写しを 作らない）
 *     ③ 合わない ときの 字は 1つ（★理由を 分けない）
 *     ④ 打ち終える まで、★押しどころを 出さない（★§8⑤）
 *     ⑤ 承知の 前に、★見えるもの／見えないものを 出す
 *     ⑥ 門の 中だけ（★38人の 画面を 変えない）
 *     ⑦ 戻る 道は 1つ
 */
const fs = require("fs");
const path = require("path");
const { stripComments, readCode, readRaw } = require("./_source");

let 落ち = 0;
function t(名, 条件) {
  console.log((条件 ? "  ok   " : "  NG   ") + 名);
  if (!条件) 落ち++;
}

(async () => {
  const vt = readCode("components/VocalTracker.jsx");
  const vtRaw = readRaw("components/VocalTracker.jsx");
  const libSrc = fs.readFileSync(
    path.join(__dirname, "..", "..", "lib", "attendingPlaces.js"), "utf8");
  const lib = await import(
    "data:text/javascript;base64," + Buffer.from(libSrc, "utf8").toString("base64"));

  console.log("\n=== ① 8文字 ===");
  t("★PASSCODE_LENGTH は 8", lib.PASSCODE_LENGTH === 8);
  t("★★見本の 6 を 書き写して いない",
    !/maxLength=\{6\}|maxlength="6"/.test(vt));
  t("★数は 決めうちに して いない", /maxLength=\{PASSCODE_LENGTH\}/.test(vt));
  t("★札の 字も 8文字", lib.PASSCODE_WARN.some((l) => l.includes("8文字")));

  console.log("\n=== ★整える 手（★較正つき）===");
  t("★大文字に 揃える", lib.normalizePasscode("ab12cd34") === "AB12CD34");
  t("★空白・記号を 落とす", lib.normalizePasscode(" ab-12 cd 34 ") === "AB12CD34");
  t("★★8文字を 超えたら 切る", lib.normalizePasscode("AB12CD34EF") === "AB12CD34");
  t("★空は 空", lib.normalizePasscode("") === "");
  t("★★8文字で 打ち終え（★較正）", lib.passcodeReady("AB12CD34") === true);
  t("★7文字では まだ", lib.passcodeReady("AB12CD3") === false);
  t("★記号を 混ぜても 数える", lib.passcodeReady("AB-12-CD-34") === true);

  console.log("\n=== ② すでに ある 手を 使う（★写しを 作らない）===");
  t("★引くのは handleLookupInviteCode",
    /handleLookupInviteCode\(inviteCodeInput\)/.test(vt));
  t("★入るのは handleAcceptInvitation",
    /await handleAcceptInvitation\(\)/.test(vt));
  t("★★get_invitation_teacher を 呼び直して いない",
    (vt.match(/rpc\(\s*"get_invitation_teacher"/g) || []).length === 1);
  t("★★accept_teacher_invitation を 呼び直して いない",
    (vt.match(/rpc\(\s*"accept_teacher_invitation"/g) || []).length === 1);
  t("★★/api/enrollment/accept を 呼び直して いない",
    (vt.match(/\/api\/enrollment\/accept/g) || []).length === 1);
  t("★★画面から enrollments を 作って いない",
    !/\.from\(\s*"enrollments"\s*\)[\s\S]{0,140}\.(insert|upsert)\(/.test(vt));
  t("★★画面から teacher_student_links を 作って いない",
    !/\.from\(\s*"teacher_student_links"\s*\)[\s\S]{0,140}\.(insert|upsert)\(/.test(vt));

  console.log("\n=== ③ 合わない ときの 字は 1つ ===");
  t("★SAME_ANSWER を 使って いる", /SAME_ANSWER/.test(vt));
  t("★★「使用済み」と 書いて いない", !/使用済み/.test(vt.split("moreSection === \"合言葉で入る\"")[1] || ""));
  t("★★「期限切れ」と 書いて いない", !/期限切れ/.test(vt.split("moreSection === \"合言葉で入る\"")[1] || ""));
  t("★★「見つかりません」と 分けて いない",
    !/見つかりませんでした/.test(vt.split("moreSection === \"合言葉で入る\"")[1] || ""));

  console.log("\n=== ④ 押せない 札を 置かない（★§8⑤）===");
  t("★打ち終えてから 出す", /passcodeReady\(inviteCodeInput\) \?/.test(vt));
  t("★★disabled の 札に して いない",
    !/disabled=\{!passcodeReady/.test(vt));
  t("★まだの ときは 案内を 出す", /PASSCODE_HINT/.test(vt));

  console.log("\n=== ⑤ 承知の 前に 見せる ===");
  t("★見えるものを 出す", /JOIN_YES_HEAD[\s\S]{0,400}SEE_YES\.map/.test(vt));
  t("★見えないものを 出す", /JOIN_NO_HEAD[\s\S]{0,400}SEE_NO\.map/.test(vt));
  t("★★一覧を 書き写して いない（★lib が 持つ）",
    !/声と からだの 記録/.test(vt));
  t("★断りを 出す", /JOIN_WL/.test(vt));
  t("★★「ことわる」が 先", vt.indexOf("JOIN_CANCEL") < vt.indexOf("JOIN_CONFIRM"));
  t("★「ことわる」は 枠", /Btn ghost onClick=\{\(\) => \{[\s\S]{0,260}\}\}>\{JOIN_CANCEL\}/.test(vt));
  t("★二度押しを 止めて いる", /disabled=\{acceptingInvitation\}/.test(vt));

  console.log("\n=== ⑥ 門の 中だけ ===");
  t("★★layoutV2 で 包んで いる",
    /layoutV2 && moreSection === "合言葉で入る"/.test(vt));

  console.log("\n=== ⑦ 戻る 道は 1つ ===");
  // ★★★2026-09-26、★決めの 場所が 移りました（★坂本さんの お決め・DECISION_1）。
  //   ★★前は 画面の 紙（`VocalTracker.jsx`）に 名を 書いて いました。
  //   ★★いまは `lib/moreCrumb.js` の `NO_CRUMB` が 持ちます。
  //     ★★新しい 画面が 増える たびに 画面の 紙が 長く なる のを やめました。
  t("★パンくずを 出さない（★`lib/moreCrumb.js` の `NO_CRUMB`）",
    /NO_CRUMB = Object\.freeze\(\["合言葉で入る"\]\)/
      .test(readRaw("lib", "moreCrumb.js")));
  t("★自分の 戻る 道は「通っている ところ」へ",
    /setMoreSection\("通っているところ"\)/.test(vt));
  t("★戻る とき 打ったものを 残さない",
    /setMoreSection\("通っているところ"\)[\s\S]{0,220}setInviteCodeInput\(""\)/.test(vt));

  console.log("\n=== ⑧ 字は lib が 持つ ===");
  ["PASSCODE_WARN", "PASSCODE_HINT", "PASSCODE_NOTE", "PASSCODE_CONFIRM",
   "JOIN_WL", "JOIN_NOTE", "JOIN_YES_HEAD", "JOIN_NO_HEAD"].forEach((k) => {
    t(`★${k} が ある`, typeof lib[k] !== "undefined");
  });
  t("★★教室を さがす 口を 作って いない",
    !/合言葉[\s\S]{0,4000}検索|教室を さがす/.test(
      vt.split('moreSection === "合言葉で入る"')[1] || ""));

  console.log(落ち === 0 ? "\n★すべて 通りました。" : `\n★${落ち}件 落ちました。`);
  process.exit(落ち === 0 ? 0 : 1);
})();
