// ============================================================================
// ★台帳の 門を できこと に 揃えた こと（★裁定 その86・2026-09-18）
//
//   ★★★この 見張りは、★台帳に 尋ねません。★書いた SQL の 字を 見ます。
//     ★★台帳の ふるまいは `tools/ask_ledger.py` で 確かめて、
//       ★★その 数を 覚え書き（docs/reports）に 残して あります。
//     ★★ここが 見るのは「決めが 2か所に 分かれて いない か」です。
//
//   ★★見る の は 4つ。
//     ★【一】★役割の 名（owner／admin）を、★門の 中で 使って いない こと
//     ★【二】★`sched_mine` の ときに、★そのコマの 先生で ある ことも 見て いる こと
//     ★【三】★戻し方が 残して ある こと
//     ★【四】★`has_can` が 1本に 委ねて いる こと
// ============================================================================

const { readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

const sql = readRaw("supabase", "migration_can_view_ops_perms.sql");

// ---------------------------------------------------------------------------
// 【一】★役割の 名で 通さない
// ---------------------------------------------------------------------------
console.log("【一】役割の 名で 通さない");
const 門 = sql.slice(sql.indexOf("create or replace function public.can_view_ops_perm"),
  sql.indexOf("-- 【二】"));
t(門.length > 200, "門の 字を 切り出せた");
t(!/is_org_owner_or_admin/.test(門), "★`is_org_owner_or_admin` を 呼んで いない");
t(/has_can/.test(門), "★できことで 通して いる");
// ★★道具の 較正 ── ★わざと 1件。
t(/is_org_owner_or_admin/.test("or is_org_owner_or_admin(viewer_id, p_org_id)"),
  "★わざとの 1件を 見つけられる");
// ★★受け持ちは 残す こと（★先生は 自分の 生徒を 見られます）。
t(/from assignments/.test(門), "★受け持ちの 道は 残って いる");
// ★★在籍が 要る こと（★退会した 方の コマを 開けません）。
t(/status = 'active'/.test(門), "★在籍が 要る");

// ---------------------------------------------------------------------------
// 【二】★`sched_mine` は「自分の コマ」
//
//   ★★★これを 落とすと、★`sched_mine` だけ の 先生に 学校 全部が 開きます。
//     ★★`can_view_ops_perm` は 先生の 番号を 受け取りません。
//     ★★だから 決まりの 中に 書きます。★書き忘れが いちばん 怖い ところ です。
// ---------------------------------------------------------------------------
console.log("【二】`sched_mine` は 自分の コマ だけ");
const 決まり = sql.slice(sql.indexOf("-- 【三】"));
// ★★★門を 呼んで いる ところ だけ を 数えます（★2026-09-18）。
//   ★★はじめ `'sched_mine'` を そのまま 数えて、★6件 と 出ました。
//   ★★1件は 下の 確かめの `select`（`p.perms ? 'sched_mine'`）でした。
//   ★★★数える 場所を まちがえると、★合わない のが 正しい ことに なります。
const 回数 = (決まり.match(/can_view_ops_perm\([^\n]*'sched_mine'\)/g) || []).length;
t(回数 >= 4, "`sched_mine` が 4つの 決まりに ある（" + 回数 + "）");
// ★★★`sched_mine` の すぐ 前に `teacher_id = auth.uid()` が ある こと。
// ★★★`[^)]*` では 足りません（★2026-09-18・ここで 0件 と 出ました）。
//   ★★`can_view_ops_perm(auth.uid(), org_id, …)` の 中に `)` が あります。
//   ★★★探しすぎない 形を 選ぶ より、★確かめて から 選びます。
const 組 = [...決まり.matchAll(
  /teacher_id = auth\.uid\(\)\s*\n\s*and public\.can_view_ops_perm\(auth\.uid\(\), org_id, student_id, 'sched_mine'\)/g)];
t(組.length === 回数,
  "★`sched_mine` は いつも `teacher_id = auth.uid()` と 一緒（" + 組.length + "／" + 回数 + "）");
// ★★`sched_all` の ほうには 先生の 縛りを 付けない こと（★学校 全部 です）。
t(/can_view_ops_perm\(auth\.uid\(\), org_id, student_id, 'sched_all'\)/.test(決まり),
  "`sched_all` は 学校 全部");

// ---------------------------------------------------------------------------
// 【三】★戻し方
// ---------------------------------------------------------------------------
console.log("【三】戻し方が 残して ある");
const 戻し = readRaw("supabase", "2026-09-18-戻し-can_view_ops-前の決まり.txt");
t(/can_view_ops\(auth\.uid\(\)/.test(戻し), "★前の 決まりの 字が 残って いる");
t(/enrollments_select/.test(戻し) && /Ops-visible lessons/.test(戻し),
  "★5つ とも 残って いる");

// ---------------------------------------------------------------------------
// 【四】★`has_can` は 1本に 委ねる
//
//   ★★★2026-09-18、★ここで つまずきました。
//     ★★`has_can` は 中で `auth.uid()` を 使います。★viewer を 受け取りません。
//     ★★`can_view_ops_perm(viewer, …)` の 中で 呼ぶと、★viewer と 食い違います。
//     ★★★編集の 窓では `auth.uid()` が 空 です。★学長でも False に なりました。
//       ★★決まりの 中では たまたま 同じ なので、★気づけません。
//     ★★だから `has_can_user(user, …)` を 出し、★`has_can` は それに 委ねます。
// ---------------------------------------------------------------------------
console.log("【四】`has_can` は 1本に 委ねる");
const 委ね = readRaw("supabase", "migration_can_view_ops_perms.sql")
  + readRaw("supabase", "migration_has_can_user.sql");
t(/create or replace function public\.has_can_user/.test(委ね), "`has_can_user` を 出して いる");
t(/select public\.has_can_user\(auth\.uid\(\)/.test(委ね), "`has_can` は それに 委ねて いる");
t(/has_can_user\(viewer_id/.test(委ね), "★門は viewer を そのまま 渡して いる");

// ---------------------------------------------------------------------------
// 【五】★安全の 決まり
// ---------------------------------------------------------------------------
console.log("【五】安全の 決まり");
// ★★★注の 中の 語を 数えません（★2026-09-18・ここで 落ちました）。
//   ★★この 紙は「`BEGIN` も `ROLLBACK` も 使って いません」と 書いて います。
//   ★★その 説明で 落ちました。★8回 目の 同じ 取り違え です。
//   ★★★数える のは、★注を 外した 字 だけ です。
const 素SQL = sql.replace(/^\s*--.*$/gm, "");
t(!/\bBEGIN\b/i.test(素SQL) && !/\bROLLBACK\b/i.test(素SQL),
  "★`BEGIN`／`ROLLBACK` を 使って いない（★2026-09-15 の 一件）");
t(/\bROLLBACK\b/i.test("rollback;"), "★わざとの 1件を 見つけられる");
t(/revoke all on function/i.test(委ね), "★先に 取り上げて いる");
const r = 委ね.indexOf("revoke all on function public.can_view_ops_perm");
const g = 委ね.indexOf("grant execute on function public.can_view_ops_perm");
t(r > 0 && g > r, "★取り上げが 先、★渡しが あと（★2026-09-13 の 決まり）");
t(/security definer/i.test(sql), "★門は SECURITY DEFINER");
t(/set search_path to 'public'/i.test(sql), "★探す 道を 決めて いる");

console.log(`\n○ ${ok}　✗ ${ng}`);
process.exit(ng === 0 ? 0 : 1);
