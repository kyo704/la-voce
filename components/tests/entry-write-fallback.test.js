#!/usr/bin/env node
/**
 * 移行がまだの列があっても、保存が全部落ちないこと（2026-08-30）
 *
 * ★2026-08-30 に2回、これで本番の保存が止まりました。
 *   PostgREST は知らない列が1つあるだけでリクエスト全体を断るため、
 *   その項目を触っていない人の保存まで、全員ぶん落ちました。
 */
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function eq(a, b, label) { assertTrue(JSON.stringify(a) === JSON.stringify(b), `${label}（${JSON.stringify(a)}）`); }

const pgrst = (col) => ({ code: "PGRST204",
  message: `Could not find the '${col}' column of 'entries' in the schema cache` });

(async () => {
  const m = await import("../../lib/entryWriteFallback.js");

  console.log("=== エラーの見分け ===");
  assertTrue(m.isUnknownColumnError(pgrst("morning_edema")), "PGRST204 を見分ける");
  assertTrue(!m.isUnknownColumnError({ code: "23502", message: "null value" }), "★別のエラーは見分けない");
  assertTrue(!m.isUnknownColumnError(null), "エラーが無ければ false");
  eq(m.missingColumnFrom(pgrst("type_fields")), "type_fields", "列の名前を取り出せる");
  eq(m.missingColumnFrom({ message: "何か別の話" }), null, "★読み取れなければ null（当てずっぽうで消さない）");

  console.log("\n=== 足りない列だけ外して、やり直す ===");
  const run = async (missing, row) => {
    const calls = [];
    const write = async (r) => {
      calls.push(Object.keys(r));
      for (const c of Object.keys(r)) if (missing.has(c)) return { error: pgrst(c) };
      return { error: null };
    };
    const res = await m.writeWithMissingColumnFallback(write, row);
    return { ...res, calls };
  };
  const base = { user_id: "u", date: "2026-08-30", throat_condition: 3 };

  let r = await run(new Set(["morning_edema"]), { ...base, morning_edema: null });
  eq(r.error, null, "1つ足りなくても保存は成功する");
  eq(r.dropped, ["morning_edema"], "外した列を返す");
  assertTrue(r.calls[1].includes("throat_condition"), "★その日の記録は残る（他の列は落とさない）");

  r = await run(new Set(["morning_edema", "type_fields"]), { ...base, morning_edema: null, type_fields: {} });
  eq(r.error, null, "2つ足りなくても成功する");
  eq(r.dropped.sort(), ["morning_edema", "type_fields"], "2つとも外す");

  console.log("\n=== ★やりすぎない ===");
  r = await run(new Set(["a", "b", "c", "d", "e"]), { ...base, a: 1, b: 2, c: 3, d: 4, e: 5 });
  assertTrue(r.dropped.length <= 3, `★外す数に上限がある（${r.dropped.length}）`);
  assertTrue(r.error !== null, "★上限を超えたら、成功したふりをしない");

  // ★user_id / date は絶対に外さない
  r = await run(new Set(["user_id"]), { ...base });
  assertTrue(r.error !== null, "★user_id が無いと言われても外さず、エラーを返す");
  eq(r.dropped, [], "user_id は外していない");
  r = await run(new Set(["date"]), { ...base });
  assertTrue(r.error !== null, "★date も外さない");

  console.log("\n=== 別のエラーは、そのまま返す ===");
  const write = async () => ({ error: { code: "23502", message: "null value in column" } });
  r = await m.writeWithMissingColumnFallback(write, base);
  assertTrue(r.error && r.error.code === "23502", "★NOT NULL 違反などは、握りつぶさずそのまま返す");
  eq(r.dropped, [], "何も外していない");

  console.log("\n=== 元の行を書き換えない ===");
  const original = { ...base, morning_edema: null };
  await run(new Set(["morning_edema"]), original);
  assertTrue("morning_edema" in original, "★渡された行を壊さない");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
