#!/usr/bin/env node
/**
 * 解除したあと、同じ先生とつなぎ直せること（2026-09-01）
 *
 * ★何があったか
 *   teacher_student_links_teacher_id_student_id_key は
 *   (teacher_id, student_id) の一意制約で、status を見ていませんでした。
 *   解除は行を消さず status を 'revoked' にするだけなので、
 *   ★一度解除した組み合わせは二度とつなぎ直せませんでした。
 *
 * ★ここが守るのは、3つの「変えてはいけないこと」です。
 *   ① 解除は★行を消さない（消すと書き出しの共有履歴が空になる）
 *   ② 書き出しは、解除ずみの行を履歴として使っている
 *   ③ 一意索引は★部分索引（status = 'active' のときだけ）
 *
 * ★①と③は、どちらか片方だけだと壊れます。
 *   行を消さないのに全体を一意にすると、つなぎ直せません。
 *   部分索引にしたのに行を消すと、履歴が消えます。
 */
const { readCode, readRaw } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const vt = readCode("components", "VocalTracker.jsx");
const ex = readCode("lib", "exportData.js");
const sql = readRaw("supabase", "migration_teacher_link_reconnect.sql");

console.log("=== ★解除は、行を消さない ===");
{
  const at = vt.indexOf("async function handleRevokeLink");
  assertTrue(at > 0, "解除の処理がある");
  const body = vt.slice(at, at + 700);
  assertTrue(/status: "revoked"/.test(body), "status を revoked にする");
  assertTrue(/revoked_at/.test(body), "解除した時刻を残す");
  // ★行を消していないこと。消すと、書き出しの共有履歴が空になります。
  assertTrue(!/\.delete\(\)/.test(body),
    "★解除で行を消していない（消すと共有履歴が失われる）");
}

console.log("\n=== ★書き出しが、解除ずみの行を履歴として使っている ===");
{
  assertTrue(/SHARE_HISTORY_SAFE_COLUMNS/.test(ex), "共有履歴の列が定義されている");
  ["status", "revoked_at", "revoked_by", "accepted_at", "share_scope"].forEach((c) => {
    assertTrue(new RegExp(`"${c}"`).test(ex), `履歴に ${c} が入る`);
  });
  // 書き出しは status で絞っていないこと（絞ると解除ずみが落ちます）
  const at = vt.indexOf("tables.share_history");
  const before = vt.slice(Math.max(0, at - 400), at);
  assertTrue(/teacher_student_links"\)\.select\("\*"\)\.eq\("student_id", userId\)/.test(before),
    "★書き出しは status で絞らない（絞ると解除ずみの履歴が落ちる）");
}

console.log("\n=== ★一意索引は、部分索引であること ===");
{
  assertTrue(/create unique index/i.test(sql), "一意索引を作っている");
  assertTrue(/where status = 'active'/.test(sql),
    "★status = 'active' の条件つき（これが無いと、つなぎ直せない）");
  assertTrue(/drop constraint teacher_student_links_teacher_id_student_id_key/.test(sql),
    "★古い一意制約を外している");
  assertTrue(/\(teacher_id, student_id\)/.test(sql),
    "守るのは組み合わせ（★student_id 単独ではない）");
  // ★仕様：1人の生徒は複数の先生につく（教室プラン仕様 §38）
  assertTrue(!/unique index[\s\S]{0,120}\(student_id\)\s*$/im.test(sql),
    "★student_id 単独の一意にしていない（仕様 §38 に反する）");
  // 実行前に、重複が無いことを確かめる手順があること
  assertTrue(/having count\(\*\) > 1/.test(sql),
    "★作る前に、有効な行の重複が無いか確かめている");
}

console.log("\n=== ★409 を、読める言葉にしている ===");
{
  assertTrue(/23505/.test(vt), "重複のエラーを見分けている");
  assertTrue(/すでにつながっています/.test(vt),
    "★生の 409 のままにしない");
  // ★部分索引にしたあと、teacher_student_links の 23505 は
  //   「いま有効な紐付けがすでにある」だけを意味します。
  //   解除ずみの行はもうぶつからないので、
  //   ★「以前つながっていた記録が…」は事実に反します。
  //   実際は二度押しで起きます（1回目が成功し、2回目がぶつかる）。
  assertTrue(!/以前つながっていた記録が残っています/.test(vt),
    "★確かめていない原因を、画面で断定していない");
  assertTrue(/acceptingInvitation/.test(vt), "★二度押しを止める仕組みがある");
  const at = vt.indexOf("async function handleAcceptInvitation");
  const head = vt.slice(at, at + 400);
  assertTrue(/if \(acceptingInvitation\) return/.test(head), "送信中は、もう一度走らない");
  assertTrue(/finally/.test(head),
    "★失敗しても必ず戻す（戻し忘れると、二度と押せなくなる）");
}

console.log("\n=== ★失敗の理由が、同意画面にも出る ===");
{
  // ★これが無いと「ボタンが反応しない」に見えます。
  //   inviteLookupError は、以前は招待コードを入れる側にしか出ていませんでした。
  const at = vt.indexOf("{pendingInvitation ? (");
  assertTrue(at > 0, "同意画面がある");
  const consent = vt.slice(at, vt.indexOf("handleDeclineInvitation", at));
  assertTrue(/inviteLookupError/.test(consent),
    "★同意画面にも理由が出る（出ないと『反応しない』に見える）");
}

console.log("\n=== ★「読み込み中」と「未成年」を分けている ===");
{
  const at = vt.indexOf("async function handleAcceptInvitation");
  const body = vt.slice(at, at + 1400);
  const iLoading = body.indexOf("まだ読み込みが終わっていません");
  const iMinor = body.indexOf("isTreatedAsMinor(profile)");
  assertTrue(iLoading > 0, "読み込み中の案内がある");
  assertTrue(iLoading < iMinor,
    "★読み込みの確認が先（profile が無いだけの人に、未成年の文言を出さない）");
  // ★年齢の判定そのものは、閉じる側に倒したまま変えていないこと
  const gate = readCode("lib", "ageGate.js");
  assertTrue(/hasAnsweredAgeQuestion\(profile\)\) return true/.test(gate),
    "★答えていない人を未成年として扱う設計は、変えていない");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
