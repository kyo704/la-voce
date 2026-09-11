#!/usr/bin/env node
// ============================================================================
// オフラインキューの見張り
// ============================================================================

const fs = require("fs");
const path = require("path");
let failed = 0;
function ok(condition, label) {
  if (condition) console.log("  ✓ " + label);
  else { console.log("  ✗ " + label); failed++; }
}
function eq(actual, expected, label) {
  ok(JSON.stringify(actual) === JSON.stringify(expected),
    label + `（実際: ${JSON.stringify(actual)}）`);
}

(async () => {
  const source = fs.readFileSync(
    path.join(__dirname, "..", "..", "lib", "offlineQueue.js"), "utf8"
  );
  const m = await import("data:text/javascript;base64," + Buffer.from(source).toString("base64"));
  const first = { lessonId: "l1", status: "欠席", at: "2026-09-11T10:00:00Z" };
  const later = { lessonId: "l1", status: "出席", at: "2026-09-11T10:05:00Z" };
  const other = { lessonId: "l2", status: "出席", at: "2026-09-11T10:05:00Z" };

  console.log("① 冪等キー");
  eq(m.idemKey(first), "l1:欠席:2026-09-11T10:00:00Z", "操作の鍵を作る");
  eq(m.idemKey({ lessonId: "l1" }), null, "不足した操作は積まない");
  eq(m.targetKey(first), "l1", "レッスンの鍵を作る");

  console.log("\n② 積む・押し直す");
  eq(m.enqueue([], first).length, 1, "新しい操作を積む");
  const same = m.enqueue([first], first);
  eq(same.length, 1, "同じ操作を二重に積まない");
  const replaced = m.enqueue([first], later);
  eq(replaced.length, 1, "同じレッスンは1件にする");
  eq(replaced[0].status, "出席", "押し直した新しい状態を残す");
  eq(m.enqueue(replaced, other).length, 2, "別レッスンは別に積む");

  console.log("\n③ 送信済みだけ外す");
  eq(m.dequeue([later, other], [m.idemKey(later)]), [other],
    "送れた鍵だけ列から外す");
  eq(m.dequeue([later], []), [later], "未送信は捨てない");
  eq(m.unsentCount([later, other]), 2, "未送信件数を数える");
  eq(m.unsentCount(null), 0, "壊れた一覧は0件");

  console.log("\n④ 圏外判定");
  const hadNavigator = Object.prototype.hasOwnProperty.call(globalThis, "navigator");
  const previousNavigator = globalThis.navigator;
  const navigatorObject = previousNavigator || {};
  globalThis.navigator = navigatorObject;
  const onLineDescriptor = Object.getOwnPropertyDescriptor(navigatorObject, "onLine");
  Object.defineProperty(navigatorObject, "onLine", { configurable: true, value: false });
  ok(m.surelyOffline(), "明らかな圏外を判定");
  Object.defineProperty(navigatorObject, "onLine", { configurable: true, value: true });
  ok(!m.surelyOffline(), "オンラインを圏外扱いしない");
  if (onLineDescriptor) Object.defineProperty(navigatorObject, "onLine", onLineDescriptor);
  else delete navigatorObject.onLine;
  if (hadNavigator) globalThis.navigator = previousNavigator;
  else delete globalThis.navigator;

  console.log(failed === 0 ? "\n★すべて通りました" : `\n★${failed}件、落ちました`);
  process.exit(failed ? 1 : 0);
})().catch((error) => {
  console.error(error);
  process.exit(1);
});
