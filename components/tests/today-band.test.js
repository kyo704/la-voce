// ============================================================================
// 「きょう」の帯の見張り（★第2便・2026-09-08）
//
//   ★★「該当がなければ その行は出ない」（★§4-1）。
//     ★「今日のレッスンはありません」と、★書かないこと。
//     ★★無いことを毎朝 知らせるのは、★催促と同じです。
//   ★★羊のことばだけは、いつも出ます。★空の帯を作らないためです。
//
//   node components/tests/today-band.test.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let fail = 0;
function ok(c, m) { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fail++; }

async function load(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8");
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

(async () => {
  const B = await load("lib/todayBand.js");
  const Q = await load("lib/offlineQueue.js");
  const TODAY = "2026-09-08";

  console.log("① ★並び順（★§4-1）");
  ok(B.ROWS.join(",") === "lessonToday,performanceSoon,orgEventSoon,sheep", "1→2→3→4 の順");
  ok(B.PERFORMANCE_WITHIN_DAYS === 3 && B.ORG_EVENT_WITHIN_DAYS === 7, "3日 と 7日");

  console.log("② ★該当がなければ、その行を出さない");
  const empty = B.buildBand({ todayISO: TODAY });
  ok(empty.length === 1 && empty[0].key === "sheep", "★何も無ければ、羊のことばだけ");
  ok(!empty.some((r) => r.key === "lessonToday"), "★レッスンの行を、作らない");
  // ★★「ありません」と書く行を、作らないこと。
  const code = readCode("lib", "todayBand.js").replace(/FORBIDDEN_WORDS[\s\S]*?\]\);/, "");
  B.FORBIDDEN_WORDS.forEach((w) => ok(!code.includes(w), "★「" + w + "」を、書いていない"));

  console.log("③ 今日のレッスン");
  const lessons = [
    { id: "b", scheduled_at: "2026-09-08T02:00:00Z" },
    { id: "a", scheduled_at: "2026-09-08T01:00:00Z" },
    { id: "c", scheduled_at: "2026-09-09T01:00:00Z" }
  ];
  const les = B.lessonsOn(lessons, TODAY, "UTC");
  ok(les.length === 2, "今日のぶんだけ（★" + les.length + "）");
  ok(les[0].id === "a", "★時刻の早い順");
  ok(B.lessonsOn(null, TODAY, "UTC").length === 0, "null でも、落ちない");
  ok(B.timeOf("2026-09-08T01:30:00Z", "UTC") === "01:30", "時刻が出る");
  ok(B.timeOf("こわれた値") === null, "形の違う値は、null");

  console.log("④ 本番は3日以内、行事は7日以内");
  const perf = [
    { id: "p1", performed_on: "2026-09-10" },
    { id: "p2", performed_on: "2026-09-20" },
    { id: "p3", performed_on: "2026-09-01" }
  ];
  const ps = B.performancesSoon(perf, TODAY);
  ok(ps.length === 1 && ps[0].id === "p1", "★3日以内だけ（★過ぎたものは 入れない）");
  ok(ps[0].inDays === 2, "あと何日かを、持っている");
  const evs = B.orgEventsSoon([
    { id: "e1", event_date: "2026-09-12" },
    { id: "e2", event_date: "2026-09-30" },
    { id: "e3", event_date: "2026-09-12", withdrawn_at: "2026-09-07" }
  ], TODAY);
  ok(evs.length === 1 && evs[0].id === "e1", "★7日以内・★取り下げたものは 入れない");
  ok(B.daysBetween(TODAY, "2026-09-08") === 0, "今日は 0日");
  ok(B.daysBetween("こわれた値", TODAY) === null, "形が違えば、null");

  console.log("⑤ ★先生のときは、帯そのものが 出欠の表（★§4-2）");
  const band = B.buildBand({
    todayISO: TODAY, tz: "UTC", lessons, teaching: true, sheepLine: "おはよう"
  });
  ok(band[0].key === "lessonToday" && band[0].teaching === true, "いちばん上に出る");
  ok(band[0].count === 2, "人数を持っている（★点数でも順位でもありません）");
  ok(band[band.length - 1].key === "sheep", "★羊のことばは、いちばん下");

  console.log("⑥ ★出欠は3つだけ（★§4-2・§7-2）");
  ok(B.ATTENDANCE.length === 3, "3つ（★" + B.ATTENDANCE.map((a) => a.label).join("・") + "）");
  ok(B.ATTENDANCE_KEYS.join(",") === "came,absent,canceled", "鍵も3つ");
  ["遅刻", "早退", "見学"].forEach((w) => {
    ok(!B.ATTENDANCE.some((a) => a.label === w), "★「" + w + "」を、作っていない");
  });
  ok(B.UNDO_SECONDS === 3, "★もどす は3秒（★「よろしいですか」を出さない）");

  console.log("⑦ ★電波がなくても（★§7-1）");
  const e1 = { lessonId: "L1", status: "came", at: "2026-09-08T01:00:00Z" };
  const e2 = { lessonId: "L1", status: "absent", at: "2026-09-08T01:01:00Z" };
  const e3 = { lessonId: "L2", status: "came", at: "2026-09-08T01:02:00Z" };
  let q = Q.enqueue([], e1);
  ok(q.length === 1, "積める");
  q = Q.enqueue(q, e1);
  ok(q.length === 1, "★まったく同じ操作は、2つ積まない（★冪等）");
  q = Q.enqueue(q, e2);
  ok(q.length === 1 && q[0].status === "absent", "★押し直したら、あとが正");
  q = Q.enqueue(q, e3);
  ok(q.length === 2, "別のレッスンは、別に積む");
  ok(Q.unsentCount(q) === 2, "未送信の数が出る");
  const left = Q.dequeue(q, [Q.idemKey(e2)]);
  ok(left.length === 1 && left[0].lessonId === "L2", "★送れたものだけ、外す");
  ok(Q.dequeue(q, []).length === 2, "★送れなかったものは、残す");
  ok(Q.idemKey({}) === null, "壊れた値は、鍵にしない");
  ok(Q.enqueue([], {}).length === 0, "壊れた値は、積まない");
  // ★★冪等キーは lesson_id ＋ status ＋ 端末時刻（★§7-1 のとおり）。
  ok(Q.idemKey(e1) === "L1:came:2026-09-08T01:00:00Z", "★鍵の形が、仕様どおり");

  console.log("⑧ ★健康の記録に、触っていないか（★§7-7）");
  const sql = readCode("supabase", "2026-09-08-レッスンの出欠.sql");
  // ★★コメントは readCode で消えているので、★「-- ④」では区切れません。
  //   ★消えない目印（select 文）で区切ります。
  //   ★★確かめの select には、わざと entries と profiles が出てきます。
  //     ★そこまで含めると、★この検査は必ず落ちます。
  const body = sql.slice(sql.indexOf("alter table public.lessons"),
    sql.indexOf("select '④ 列'"));
  ok(!/entries|profiles/.test(body), "★entries にも profiles にも、列を足していない");
  ok(/attendance in \('came', 'absent', 'canceled'\)/.test(sql), "★3つ以外を、入れさせない");
  ok(/with check \(/.test(sql), "★WITH CHECK がある（★UPDATE のポリシー）");
  ok(sql.indexOf("revoke update on public.lessons from authenticated")
    < sql.indexOf("grant update (attendance"), "★剥がしてから、列だけ渡している");
  ok(/grant update \(attendance, attendance_at, attendance_by\)/.test(sql),
    "★渡すのは、その3列だけ");

  console.log("⑨ ★★held は、どこにも在りません（★2026-09-08 に分かりました）");
  // ★★lessons.held の列は、★一度も作られていませんでした。
  //   ★migration_lesson_held.sql は、★書かれないままでした。
  //   ★だから「実施した」を押すと 42703 で失敗し、
  //   ★★この画面は、★最初から動いていませんでした。
  //   ★★私は「私の SQL が壊した」と申し上げました。★誤りでした。
  const vt = readCode("components", "VocalTracker.jsx");
  ok(!/\{ held:/.test(vt), "★held を、書きに行っていない");
  ok(!/l\.held ===/.test(vt), "★held を、読みに行っていない");
  // ★★update する列が、★渡されている列に収まっていること。
  const updates = [...vt.matchAll(/from\("lessons"\)[\s\S]{0,400}?\.update\(/g)];
  const cols = [...vt.matchAll(/attendance(_at|_by)?:/g)].map((m) => m[0].replace(":", ""));
  const granted = ["attendance", "attendance_at", "attendance_by"];
  ok(updates.length >= 2, "★lessons を update するところが、★2か所ある");
  ok(cols.every((c) => granted.includes(c)),
    "★書きに行く列が、すべて渡されている列である");
  // ★★1つの決めを、★2つの列で持たないこと。
  const counts = readCode("lib", "lessonCounts.js");
  ok(/attendanceOf/.test(counts), "★数える側も、attendance を読む");

  console.log("⑩ ★私が足したポリシーを、消す（★坂本さんのご指摘）");
  // ★★RLS の「許す」ポリシーは OR で足されます。★狭められません。
  //   ★そのうえ「auth.uid() = teacher_id」が、★古い2枚に無い道でした。
  //   ★★org の行で、★can_view_ops を通らずに書けてしまいます。
  const fix2 = readCode("supabase", "2026-09-08-レッスンの出欠-直し2.sql");
  ok(/drop policy if exists lessons_attendance_teacher_update/.test(fix2),
    "★私のポリシーを、消している");
  ok(!/create policy/.test(fix2), "★新しいポリシーを、足していない");
  ok(!/add column/.test(fix2), "★列を、足していない");
  ok(!/^grant /m.test(fix2), "★権限を、これ以上 渡していない");
  // ★★1回目の直し（held を返す）は、★捨てたこと。
  ok(!fs.existsSync(path.join(ROOT, "supabase/2026-09-08-レッスンの出欠-直し.sql")),
    "★誤っていた1回目の直しを、残していない");

  console.log(fail === 0 ? "\n★すべて通りました" : "\n★" + fail + "件、落ちました");
  process.exit(fail === 0 ? 0 : 1);
})();
