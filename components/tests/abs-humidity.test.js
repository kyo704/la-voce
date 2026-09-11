#!/usr/bin/env node
const fs = require("fs");
const { readRaw } = require("./_source");
let failed = 0;
const ok = (v, s) => { if (v) console.log("  ✓ " + s); else { console.log("  ✗ " + s); failed++; } };
const src = readRaw("components", "VocalTracker.jsx");
ok(/function computeAbsoluteHumidity\(tempC, rhPercent\)/.test(src), "絶対湿度の関数がある");
ok(/typeof tempC !== "number" \|\| typeof rhPercent !== "number"\) return null/.test(src), "不足値はnull");
ok(/216\.7 \* es \* rhPercent \/ 100/.test(src), "Magnus式で換算");
ok(/computeAbsoluteHumidity\(formData\.temperature, formData\.humidity\)/.test(src), "入力画面で使う");
ok(/label: "絶対湿度"/.test(src), "時差検定の項目として表示");
process.exit(failed ? 1 : 0);
