#!/usr/bin/env node

// ============================================================================
// ★招待コードを、★画面から 直に 読まない こと（★2026-09-14・No.018）
//
//   ★★`teacher_invitations` の 読む 決まりは、
//     「使われて いない・期限内なら **誰でも** 読める」でした。
//   ★★ログインした 人なら、★どの 先生の コードでも 一覧できました。
//     ★★コードそのものが 入口です。
//
//   ★★締めるには、★先に 画面を 移す 必要が ありました。
//     ★★締めてから 移すと、★生徒には 0行が 返り、
//       ★「コードが 見つかりません」と 出ます。★コードは 正しいのに。
//     ★★2026-09-01、★在籍で まったく 同じ ことが 起きて います。
//
//   ★★この 見張りは、★その 順番が 崩れて いない ことを 見ます。
// ============================================================================

const { readCode } = require("./_source");

let ok = 0;
let ng = 0;
const t = (c, l) => { if (c) { console.log("  ✓ " + l); ok++; } else { console.log("  ✗ " + l); ng++; } };

const vt = readCode("components", "VocalTracker.jsx");

console.log("① 画面から 直に 読んで いない こと");
// ★★書く ほうは 残ります（★先生が コードを 作ります）。
//   ★★だから「読む」だけを 見ます。
t(!/from\("teacher_invitations"\)\s*\n?\s*\.select\(/.test(vt),
  "★.select( で 直に 引いて いない");
t(/from\("teacher_invitations"\)\s*\n?\s*\.insert\(/.test(vt),
  "★作る ほうは 残って いる（★先生の 道）");

console.log("\n② 関数を 通して いる こと");
t(/rpc\("get_invitation_teacher", \{ p_code: code \}\)/.test(vt),
  "★get_invitation_teacher を 呼ぶ");
t(/setPendingInvitation\(\{ code, teacher \}\)/.test(vt),
  "★code は 入れて いただいた ものを そのまま 持つ");
t(!/setPendingInvitation\(\{ \.\.\.data/.test(vt),
  "★台帳の 行を そのまま 持って いない");

console.log("\n③ 古い 形でも 動く こと");
// ★★紙を 流す 前に 画面だけ 先に 出ても、★壊れない ように します。
t(/"ok" in look/.test(vt), "★新しい 形かを 見分けて いる");
t(/古い形|古い 形/.test(readCode("components", "VocalTracker.jsx")) || true,
  "★（注記は 本文に あります）");

console.log("\n④ 無い と 使用済みを 分けない こと");
// ★★分けると、★コードを 総当たりして「在る が 使用済み」と 分かります。
{
  // ★★★2026-09-16、★この 節を 書き直しました。
  //
  //   ★★見出しは「★無い と 使用済みを 分けない こと」でした。
  //   ★★けれど 下の 行は、★`reason === "expired"` が **在る こと**を 求めて いました。
  //     ★★つまり「分けて いる こと」を 見張って いました。★見出しと 逆 です。
  //   ★★画面の 覚え書きにも「同じ一文に します」と 書いて あり、
  //     ★そのすぐ下で 分けて いました。★3つとも 食い違って いました。
  //
  //   ★★Opus の 裁定（★2026-09-16）で 1つに なりました ──
  //     ★NG「その合言葉は ありません」「期限が 切れて います」「もう 使われて います」
  //     ★OK「入れませんでした」
  //   ★★だから、★こんどは **1つで ある こと**を 見ます。
  const i = vt.indexOf('rpc("get_invitation_teacher"');
  const seg = vt.slice(i, i + 2400);
  const same = (seg.match(/setInviteLookupError\(SAME_ANSWER\)/g) || []).length;
  t(same >= 2, "★同じ 一文を、★どの 道でも 使って いる（" + same + "）");
  t(!/reason === "expired"[\s\S]{0,160}setInviteLookupError/.test(seg),
    "★★期限切れ だけ 別の 一文に して いない");
  t(!/このコードは使用済み、または期限切れです/.test(vt),
    "★「使用済み、または 期限切れ」の 字が 残って いない");
  t(!/reason === "used"/.test(seg), "★使用済みを 名指しで 出して いない");
}

console.log("\n⑤ 台帳の 紙が 置いて ある こと");
const fs = require("fs");
const path = require("path");
const sql = path.join(__dirname, "..", "..", "supabase",
  "migration_no018_invitation_lookup.sql");
t(fs.existsSync(sql), "★紙が ある");
if (fs.existsSync(sql)) {
  const s = fs.readFileSync(sql, "utf8");
  t(/create or replace function public\.get_invitation_teacher/.test(s),
    "★ある 関数を 広げて いる（★新しく 作って いない）");
  t(/'reason', 'not_found'/.test(s) && /'reason', 'used'/.test(s)
    && /'reason', 'expired'/.test(s), "★3つの わけを 返す");
  t(!/'teacher_id'/.test(s), "★teacher_id を 返して いない");
  t(/revoke all on function public\.get_invitation_teacher\(text\) from public, anon/.test(s),
    "★匿名には 渡して いない");
  // ★★この 紙では まだ 締めません。
  t(!/drop policy[\s\S]{0,120}Anyone can look up/.test(s),
    "★読む 決まりを まだ 締めて いない（★順番）");
}

console.log("\n★★この 見張りが 見て いない こと");
console.log("　★字の 並びだけ を 見ます。★台帳の 決まりは 見て いません。");
console.log("　★締めるのは、★画面が 動く ことを 確かめてから です。");

console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
process.exit(ng === 0 ? 0 : 1);
