#!/usr/bin/env node
/**
 * レッスンを何回やったかを数える（2026-09-02）
 *
 * ★出どころ：docs/lavoce-判断のまとめ-20260902.md §1（会話の裁定・文書なし）
 *
 * ★守ること
 *   ① null は「まだ答えていない」。実施にも未実施にも数えない
 *   ② 未回答の数を必ず一緒に返す（「3回」だけでは分からない）
 *   ③ 金額を1円も扱わない
 *   ④ 欠席の理由を持たない（要配慮個人情報）
 *   ⑤ 2択。「欠席」という値を作らない
 */
const { readCode } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

(async () => {
  const m = await import("../../lib/lessonCounts.js");
  const src = readCode("lib", "lessonCounts.js");
  const ui = readCode("components", "VocalTracker.jsx");

  const L = [
    { scheduled_at: "2026-09-03T10:00:00Z", held: true },
    { scheduled_at: "2026-09-10T10:00:00Z", held: true },
    { scheduled_at: "2026-09-17T10:00:00Z", held: false },
    { scheduled_at: "2026-09-24T10:00:00Z" },              // ★未回答
    { scheduled_at: "2026-09-25T10:00:00Z", held: null },  // ★未回答
    { scheduled_at: "2026-08-30T10:00:00Z", held: true }   // 別の月
  ];

  console.log("=== ★null は、どちらにも数えない ===");
  {
    const c = m.countHeldLessons(L, { year: 2026, month: 9 });
    assertTrue(c.held === 2, "実施は2回");
    assertTrue(c.notHeld === 1, "実施しなかったは1回");
    assertTrue(c.unanswered === 2, "★未回答は2件（undefined も null も）");
    assertTrue(c.total === 5, "9月の総数は5件（8月は入らない）");
    assertTrue(c.held + c.notHeld + c.unanswered === c.total,
      "★3つを足すと総数になる（どれかに寄せて丸めていない）");
  }

  console.log("\n=== 月の切れ目 ===");
  {
    const aug = m.countHeldLessons(L, { year: 2026, month: 8 });
    assertTrue(aug.total === 1 && aug.held === 1, "8月は1件だけ");
    const oct = m.countHeldLessons(L, { year: 2026, month: 10 });
    assertTrue(oct.total === 0 && oct.held === 0, "10月は0件");
    assertTrue(m.countHeldLessons([], { year: 2026, month: 9 }).total === 0, "空でも落ちない");
    assertTrue(m.countHeldLessons(null, { year: 2026, month: 9 }).total === 0, "null でも落ちない");
    assertTrue(m.countHeldLessons([{ scheduled_at: "こわれた日付", held: true }],
      { year: 2026, month: 9 }).total === 0, "★読めない日付は数えない");
  }

  console.log("\n=== ★未回答の数を、必ず見せる ===");
  {
    assertTrue(m.heldCountLine({ held: 2, notHeld: 1, unanswered: 2, total: 5 })
      === "実施 2回（未回答 2件）", "未回答があれば、かっこで出す");
    assertTrue(m.heldCountLine({ held: 3, notHeld: 0, unanswered: 0, total: 3 })
      === "実施 3回", "未回答が0なら、かっこは出さない");
    assertTrue(m.heldCountLine({ held: 0, notHeld: 0, unanswered: 0, total: 0 })
      === "実施 0回", "★0回も、そのまま出す（隠さない）");
  }

  console.log("\n=== ★お金を扱わない ===");
  {
    ["金額", "単価", "合計", "月謝", "price", "amount", "fee"].forEach((w) => {
      assertTrue(!src.includes(w) || m.NEVER_IN_LESSON_COUNTS.includes(w),
        `★「${w}」を計算していない`);
    });
    assertTrue(Array.isArray(m.NEVER_IN_LESSON_COUNTS), "作らないものの一覧がある");
  }

  console.log("\n=== ★欠席の理由を持たない／2択であること ===");
  {
    // ★NEVER_IN_LESSON_COUNTS の行そのものは除きます。
    //   禁止語の一覧に「欠席理由」と書いてあるので、素で探すと
    //   ★自分の禁止一覧に引っかかります（org-event-display.test.js と同じ形）。
    const withoutDenyList = src.split("\n")
      .filter((line) => !line.includes("NEVER_IN_LESSON_COUNTS")).join("\n");
    assertTrue(!/reason|理由/.test(withoutDenyList), "★理由の欄が無い");
    // 3値にしていないこと（「欠席」という値を作らない）
    assertTrue(!/"欠席"|'欠席'/.test(src), "★「欠席」という値を作っていない");
    assertTrue(/実施した/.test(ui) && /しなかった/.test(ui), "画面は2択");
    assertTrue(!/欠席理由/.test(ui), "★画面にも欠席理由が無い");
  }

  console.log("\n=== ★書き込みが0行だったら分かる ===");
  {
    assertTrue(/\.eq\("id", lessonId\)\s*\n\s*\.select\("id"\)/.test(ui),
      "★.select() で行数を見ている");
    assertTrue(/★実施の記録が0行でした/.test(ui), "0行なら、そう分かる");
    assertTrue(/on \? null : v/.test(ui), "★もう一度押すと未回答に戻せる");
  }

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
