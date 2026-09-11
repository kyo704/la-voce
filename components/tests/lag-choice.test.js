#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
let failed = 0;
const ok = (v, s) => { if (v) console.log("  ✓ " + s); else { console.log("  ✗ " + s); failed++; } };
(async () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "lagChoice.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  ok(m.LAGS.length === 4, "時間差を4つ表示");
  ok(m.defaultLagOf("markAlcohol") === "prevNight", "夜の項目は前の夜");
  ok(m.defaultLagOf("sungMinutes") === "prevDay", "昼の項目は前の日");
  ok(m.defaultLagOf("humidity") === "sameMorning", "環境はその日の朝");
  ok(m.judgingLagOf("humidity", "twoDaysAgo") === "twoDaysAgo", "選択した時間差を使う");
  ok(m.judgingLagOf("humidity", "unknown") === "sameMorning", "未知の時間差は既定へ戻す");
  ok(m.testsPerItem() === 1, "1項目1回だけ検定");
  ok(m.needsRecount("prevDay", "prevNight") && !m.needsRecount("prevDay", "prevDay"), "時間差変更時だけ数え直す");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
