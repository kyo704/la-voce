// ============================================================================
// ★門下の やりとりは `monka_read` だけ（★裁定 その88 Q2・2026-09-18）
//
//   ★★★何が 起きて いたか
//     ★★`org_messages_select` の 枝が `has_can(org_id, 'renraku_all')` でした。
//     ★★`renraku_all` は「学校全部へ **お知らせを 出す**」できこと です。
//     ★★★それで、★門下の やりとりまで 読めて いました。
//     ★★裁定 その76 は「開いた 記録が 必ず 残る」ことを 条件に 監査を 許して います。
//       ★★`renraku_all` で 読んだ ぶんには、★その 記録が 残りません。
//
//   ★★この 見張りは、★書いた SQL の 字を 見ます。
//     ★★台帳の ふるまいは `tools/ask_ledger.py` で 較正つきで 確かめ、
//       ★★数を 覚え書きに 残して あります。
// ============================================================================

const { readCode, readRaw, loadLib } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

const sql = readRaw("supabase", "migration_org_messages_monka_gate.sql");

// ---------------------------------------------------------------------------
// 【一】★枝が 分かれて いる
// ---------------------------------------------------------------------------
console.log("【一】学校ぜんぶ と 門下 を 分けて いる");
const 素 = sql.replace(/^\s*--.*$/gm, "");
t(/teacher_id is null and has_can\(org_id, 'renraku_all'\)/.test(素),
  "★お知らせ（teacher_id が 空）は `renraku_all`");
t(/teacher_id is not null and has_can\(org_id, 'monka_read'\)/.test(素),
  "★門下（teacher_id が 入って いる）は `monka_read`");
// ★★★`renraku_all` が 門下に かからない こと。
t(!/teacher_id is not null[^\n]*renraku_all/.test(素),
  "★門下の 枝に `renraku_all` が ない");
// ★★道具の 較正。
t(/teacher_id is not null[^\n]*renraku_all/
  .test("or (org_messages.teacher_id is not null and has_can(org_id, 'renraku_all'))"),
  "★わざとの 1件を 見つけられる");

// ★★先生 ご本人と、★受け持ちの 生徒は これまで どおり。
t(/auth\.uid\(\) = teacher_id/.test(素), "★門下の 先生 ご本人は 読める");
t(/from public\.assignments a/.test(素), "★受け持ちの 生徒も 読める");
t(/a\.ended_at is null/.test(素), "★受け持ちが 終われば 読めない");

// ---------------------------------------------------------------------------
// 【二】★同じ 決めを 2つ 置いて いない
//
//   ★★決まりは `or` で つながります。★2つ ある と、★分け方が 効きません。
// ---------------------------------------------------------------------------
console.log("【二】決まりは 1本");
t(/drop policy if exists org_messages_select_monka_read/.test(素),
  "★2つ目の 決まりを 外して いる");

// ---------------------------------------------------------------------------
// 【三】★安全の 決まり
// ---------------------------------------------------------------------------
console.log("【三】安全の 決まり");
t(!/\bBEGIN\b/i.test(素) && !/\bROLLBACK\b/i.test(素),
  "★`BEGIN`／`ROLLBACK` を 使って いない");
t(/drop policy if exists org_messages_select on/.test(素), "★何度 走らせても 同じ");

// ---------------------------------------------------------------------------
// 【四】★画面から、★古い 断りを 外した（★裁定 その88 Q1）
// ---------------------------------------------------------------------------
(async () => {
  console.log("【四】古い 断りを 外した（★裁定 その88 Q1）");
  const R = await loadLib("lib", "renraku.js");
  const 画面 = readCode("components", "Renraku.jsx");
  t(R.OPS_READ_ONLY_LINE === undefined, "★`OPS_READ_ONLY_LINE` を 外した");
  t(R.OPS_READ_WHY_LINE === undefined, "★`OPS_READ_WHY_LINE` も 外した");
  t(!画面.includes("読める理由は"), "★画面に 残って いない");
  t(!画面.includes("運営の方は、読むだけです"), "★画面に 残って いない（その2）");
  // ★★★役割の 名で 断りを 出して いない こと。
  t(!/role === "owner" \|\| role === "admin"/.test(画面),
    "★役割の 名で 出し分けて いない");
  // ★★道具の 較正。
  t(/role === "owner" \|\| role === "admin"/
    .test('{!canWrite && (role === "owner" || role === "admin") ? ('),
    "★わざとの 1件を 見つけられる");
  // ★★★同じ ことを 言う 帯は 1つ だけ ある こと。
  t(R.MONKA_READ_SELF_LINE.includes("確かめられる 役職"), "★新しい 帯は ある");
  t(画面.includes("showMonkaReadSelfBanner"), "★その 門は できこと");

  // -------------------------------------------------------------------------
  // 【五】★できことの 名と 範囲（★裁定 その88 ROOT_CAUSE）
  // -------------------------------------------------------------------------
  console.log("【五】できことの 名と 範囲");
  const 覚え = readRaw("docs", "reports", "2026-09-18-できことの名と範囲.md");
  t(覚え.includes("できこと 14"), "★14の できことを 数えた");
  t(覚え.includes("org_messages_select"), "★見つけた 1件が 書いて ある");
  t(readRaw("tools", "perm_scope_audit.py").includes("止まりました"),
    "★道具は 知らない 名が 出たら 止まる");

  console.log(`\n○ ${ok}　✗ ${ng}`);
  process.exit(ng === 0 ? 0 : 1);
})();
