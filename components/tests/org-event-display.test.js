#!/usr/bin/env node
/**
 * 組織の予定の見せ方（2026-09-02・Opus の裁定）
 *
 * ★写しを作りません。利用者が持つのは「出ます」という印だけです。
 *   だから、写しと元がずれることも、同期も、ありません。
 *   記録（entries）には★一切触れません。
 *
 * ★守ること
 *   ① 取り下げは行を消さない（withdrawn_at を入れる）
 *      消すと、出ると印をつけた人の画面から★黙って消えます。
 *   ② 日付が変わっても、印を自動で外さない
 *      外すと、出るつもりだった人が★外れたことに気づけません。
 *   ③ 過ぎた予定には、何も出さない
 *   ④ 文の主語は「予定」。人ではない
 */
const fs = require("fs");
const path = require("path");
const { readRaw, readCode } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const root = path.join(__dirname, "..", "..");
const sql = readRaw("supabase", "migration_org_events.sql");

(async () => {
  const m = await import("../../lib/orgEventDisplay.js");
  const TODAY = "2026-09-02";

  console.log("=== ★取り下げは、行を消さない ===");
  {
    assertTrue(/withdrawn_at timestamptz/.test(sql), "withdrawn_at の列がある");
    assertTrue(!/delete from public\.org_events/i.test(sql), "★予定の行を消す文が無い");
    const ev = { event_date: "2026-12-03", withdrawn_at: "2026-09-01T00:00:00Z" };
    assertTrue(m.orgEventState(ev, null, TODAY) === "withdrawn", "取り下げは、そう見える");
    // ★押すまで消えない
    assertTrue(m.orgEventState(ev, { dismissed_at: null }, TODAY) === "withdrawn",
      "★押すまでは消えない");
    assertTrue(m.orgEventState(ev, { dismissed_at: "2026-09-02T00:00:00Z" }, TODAY) === "hidden",
      "「表示から消す」を押したら消える");
  }

  console.log("\n=== ★日付が変わっても、印は残る ===");
  {
    const moved = { event_date: "2026-12-04", previous_date: "2026-12-03" };
    assertTrue(m.orgEventState(moved, { joined_at: "x" }, TODAY) === "moved", "変わったと分かる");
    assertTrue(m.isJoined({ joined_at: "x" }) === true, "★印はそのまま残る");
    // ★印を自動で外す処理が、どこにも無いこと
    const del = readCode("lib", "orgEventDisplay.js");
    assertTrue(!/delete|remove.*participant/i.test(del),
      "★印を自動で外す処理が無い（外すのは本人だけ）");
    assertTrue(m.movedMessage("12月3日", "12月4日") === "12月3日から12月4日に変わりました",
      "1行で、変わった事実だけを言う");
  }

  console.log("\n=== ★過ぎた予定には、何も出さない ===");
  {
    const past = { event_date: "2026-08-01", withdrawn_at: "2026-09-01T00:00:00Z" };
    assertTrue(m.orgEventState(past, null, TODAY) === "hidden",
      "★過ぎたあとに取り下げられても、何も出さない");
    const pastMoved = { event_date: "2026-08-01", previous_date: "2026-07-30" };
    assertTrue(m.orgEventState(pastMoved, null, TODAY) === "hidden", "過ぎた予定は流れていく");
  }

  console.log("\n=== ★文の主語は「予定」。人ではない ===");
  {
    assertTrue(m.WITHDRAWN_MESSAGE === "この予定は取り下げられました", "取り下げの文が指示どおり");
    const all = readCode("lib", "orgEventDisplay.js");
    m.FORBIDDEN_EVENT_PHRASES.forEach((phrase) => {
      // 定義の一覧そのものは除いて、実際の文言に混ざっていないこと
      const uses = all.split(phrase).length - 1;
      assertTrue(uses <= 1, `★「${phrase}」を文言に使っていない`);
    });
    assertTrue(!/先生が取り下げ|さんが取り下げ/.test(all),
      "★誰が取り下げたかを書いていない");
    assertTrue(!/確認してください/.test(m.WITHDRAWN_MESSAGE), "★急かしていない");
  }

  console.log("\n=== ★記録には触れない ===");
  {
    const all = readCode("lib", "orgEventDisplay.js");
    assertTrue(!/entries|lessons/.test(all), "★entries も lessons も触らない");
    assertTrue(!/source_event_id/.test(sql), "★写しの列を作っていない");
    // 提案は提案のまま（決めきれないときは決めない）
    assertTrue(m.suggestActivityKind([{ kind: "試験" }]) === "本番", "試験は本番として提案する");
    assertTrue(m.suggestActivityKind([{ kind: "試験" }, { kind: "練習" }]) === null,
      "★2つ以上あるときは決めない（勝手に選ばない）");
    assertTrue(m.suggestActivityKind([{ kind: "本番", withdrawn_at: "x" }]) === null,
      "取り下げられた予定からは提案しない");
  }

  console.log("\n=== 台帳・控え・書き出し・退会に入っている ===");
  {
    const d = await import("../../lib/accountDeletion.js");
    const r = await import("../../lib/authUserReferences.js");
    const b = await import("../../lib/backupTables.js");
    const e = await import("../../lib/exportData.js");
    assertTrue(d.USER_OWNED_TABLES.includes("org_event_participants"), "退会で印を消す");
    assertTrue(d.NULLED_REFERENCES.some((x) => x.table === "org_events" && x.column === "created_by"),
      "★予定の行は残し、作った人の名前だけ外す");
    const keys = r.AUTH_USER_REFERENCES.map((x) => `${x.table}.${x.column}`);
    assertTrue(keys.includes("org_event_participants.user_id"), "台帳にある（印）");
    assertTrue(keys.includes("org_events.created_by"), "台帳にある（作った人）");
    assertTrue(e.EXPORTED_TABLES.some((x) => x.table === "org_event_participants"),
      "★本人の書き出しに含める");
  }

  console.log("\n=== RLS：ほかの人の印は見えない ===");
  {
    assertTrue(/org_event_participants_own/.test(sql), "印は本人だけのポリシー");
    assertTrue(/auth\.uid\(\) = user_id/.test(sql), "本人の行だけ");
    assertTrue(/role in \('owner','admin'\)/.test(sql), "予定を作れるのは管理者だけ");
    assertTrue(/unique \(user_id, org_event_id\)/.test(sql), "同じ予定に二重の印を付けない");
  }

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
