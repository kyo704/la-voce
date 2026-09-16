#!/usr/bin/env node

// ============================================================================
// ★合言葉の 回数の 制限と、★間違いを 教えない 返事
//
//   ★★出どころ　Opus の 裁定（★2026-09-16・坂本さん 転送）──
//     「1つの 合言葉に対して 10回で 止める
//       1つの IP に対して 1時間に 20回
//       止まったあと 24時間 開かない
//       合言葉そのものを 記録しない。ハッシュで
//       応答統一 ── ★『入れませんでした』だけ」
//
//   ★★この 見張りは 呼んで 試します。★字を 読むだけ では ありません。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  for (const f of ["lib/codeAttempts.js", "app/api/enrollment/accept/route.js",
    "supabase/migration_code_attempts.sql"]) {
    if (!fs.existsSync(path.join(ROOT, f))) {
      console.log("★★ありません: " + f);
      console.log("　★数えません。★止まります。");
      process.exit(1);
    }
  }
  process.env.CODE_ATTEMPT_PEPPER = process.env.CODE_ATTEMPT_PEPPER || "test-pepper";
  const src = fs.readFileSync(path.join(ROOT, "lib/codeAttempts.js"), "utf8");
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(src, "utf8").toString("base64"));

  const now = new Date("2026-09-16T12:00:00Z");
  const mk = (n, minAgo) => Array.from({ length: n },
    () => ({ at: new Date(now.getTime() - minAgo * 60000).toISOString() }));

  console.log("① 数（★裁定の とおりか）");
  t(m.MAX_PER_CODE === 10, "★1つの 合言葉に 10回");
  t(m.MAX_PER_IP_HOUR === 20, "★1つの IP に 1時間 20回");
  t(m.LOCK_HOURS === 24, "★止まったら 24時間");

  console.log("\n② 止まる／止まらない（★実際に 呼びます）");
  t(m.decideBlock(now, mk(9, 10), []).blocked === false, "9回目は 通る");
  t(m.decideBlock(now, mk(10, 10), []).blocked === true, "★10回目で 止まる");
  // ★★11回目 ── ★実機で 確かめる ことに なって います。★ここでも 数で 見ます。
  t(m.decideBlock(now, mk(11, 10), []).blocked === true, "★11回目も 止まる");
  t(m.decideBlock(now, mk(10, 60 * 23), []).blocked === true, "★23時間前の 10回は まだ 止まる");
  t(m.decideBlock(now, mk(10, 60 * 25), []).blocked === false, "25時間前の 10回は 開く");
  t(m.decideBlock(now, [], mk(19, 10)).blocked === false, "IP 19回は 通る");
  t(m.decideBlock(now, [], mk(20, 10)).blocked === true, "★IP 20回で 止まる");
  t(m.decideBlock(now, [], mk(20, 70)).blocked === false, "IP 70分前の 20回は 開く");

  console.log("\n③ 合言葉そのものを 残さない");
  const h = m.hashCode("ABCD1234");
  t(typeof h === "string" && h.length === 64, "ハッシュが 返る");
  t(!h.includes("ABCD1234"), "★★ハッシュに 合言葉が 入って いない");
  t(m.hashCode("abcd1234") === h, "★大小を そろえる（打ち方で 変わらない）");
  t(m.hashCode("ABCD1235") !== h, "ちがう 合言葉は ちがう ハッシュ");
  t(m.hashCode("") === null, "空は null");
  t(m.hashIp("1.2.3.4") !== "1.2.3.4", "★IP そのものを 残さない");
  // ★★塩が 効いて いること。★塩が 変われば ハッシュも 変わります。
  const before = m.hashCode("ABCD1234");
  process.env.CODE_ATTEMPT_PEPPER = "another-pepper";
  const src2 = fs.readFileSync(path.join(ROOT, "lib/codeAttempts.js"), "utf8");
  const m2 = await import("data:text/javascript;base64,"
    + Buffer.from(src2 + "\n//salt2", "utf8").toString("base64"));
  t(m2.hashCode("ABCD1234") !== before, "★★塩が 変われば ハッシュも 変わる");
  process.env.CODE_ATTEMPT_PEPPER = "test-pepper";

  console.log("\n④ 間違いを 教えない（★返事が 1つ）");
  const a = m.sameAnswer();
  t(a.ok === false && typeof a.error === "string", "同じ 形で 返す");
  ["ありません", "期限", "使われ", "見つかりません"].forEach((w) => {
    t(!m.SAME_ANSWER.includes(w), "★「" + w + "」と 言わない");
  });
  t(m.SAME_ANSWER.includes("入れませんでした"), "★「入れませんでした」と 言う");
  t(m.SAME_ANSWER.includes("しばらく"), "★続くと 止まる ことは 伝える");

  console.log("\n⑤ ★守りが、★守る ものの 中に あること");
  // ★★★はじめ `app/api/enrollment/accept` に 置きました。★誤り でした ──
  //   ★① あの 道が 呼ばれる ときには、★合言葉は **もう 通って います**。
  //     ★★見張り `enrollment-server-side` が 教えて くれました ──
  //       「★招待の 未使用を 権限の 根拠に しない（この時点では 使用済み）」
  //   ★② `get_invitation_teacher` は 画面から **じかに** 呼べます。
  //     ★★道に 置いても、★関数を 直に 叩けば 素通り できます。
  //   ★★だから、★数えるのは **関数の 中** です。
  const sqlSrc = fs.readFileSync(
    path.join(ROOT, "supabase/migration_code_attempts.sql"), "utf8");
  const fn = sqlSrc.slice(sqlSrc.indexOf("create or replace function public.get_invitation_teacher"));
  t(fn.length > 0, "★関数を 書き直して いる");
  t(/code_attempts/.test(fn), "★関数の 中で 数えて いる");
  t(/v_tries >= 10/.test(fn), "★10回で 止めて いる");
  t(/return null/.test(fn), "★止めた ことを 言わない（null）");
  // ★★当たっても 外れても 1行 残す。★外れだけ 数えると、当たりの 回が 漏れます。
  const iInsert = fn.indexOf("insert into public.code_attempts");
  const iSelect = fn.indexOf("from public.teacher_invitations");
  t(iInsert > 0 && iSelect > 0 && iInsert < iSelect,
    "★★引く 前に 残して いる（★当たりも 数える）");
  t(/revoke all on function public\.get_invitation_teacher\(text\) from public, anon/.test(sqlSrc),
    "★anon から 取り上げて いる");

  console.log("\n⑤-2 画面が、理由で 字を 分けない こと");
  const vt = readCode("components", "VocalTracker.jsx");
  t(/setInviteLookupError\(SAME_ANSWER\)/.test(vt), "★同じ 字を 使って いる");
  // ★★2026-09-16 まで、★覚え書きには「同じ一文に します」と 書いて あり、
  //   ★すぐ下で `look.reason === "expired"` を 見て 分けて いました。
  //   ★★書いて ある のに、して いません でした。
  t(!/このコードは使用済み、または期限切れです/.test(vt),
    "★★「使用済み、または 期限切れ」と 言わない");
  t(!/look\.reason === "expired"[\s\S]{0,120}setInviteLookupError/.test(vt),
    "★理由で 分けて いない");

  console.log("\n⑥ 表が、合言葉を 持たない こと");
  const sql = fs.readFileSync(path.join(ROOT, "supabase/migration_code_attempts.sql"), "utf8");
  const create = sql.slice(sql.indexOf("create table"), sql.indexOf(");"));
  t(/code_hash/.test(create), "code_hash が ある");
  t(!/\bcode\b\s+text/.test(create), "★★合言葉 そのものの 列が ない");
  t(!/\bip\b\s+text/.test(create), "★IP そのものの 列が ない");
  t(/enable row level security/.test(sql), "RLS を 立てて いる");
  t(!/create policy/.test(sql), "★policy を 作って いない");
  t(sql.indexOf("revoke all") < sql.indexOf("grant "), "★revoke が 先");
  t(/24 hours/.test(sql), "★24時間で 消す");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
