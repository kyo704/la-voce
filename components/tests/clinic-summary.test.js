#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
let failed = 0;
const ok = (v, s) => { if (v) console.log("  ✓ " + s); else { console.log("  ✗ " + s); failed++; } };
(async () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "symptomLocations.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  ok(m.LOCATION_ORDER.join("|") === "のど|鼻・のどの奥|おなか|からだ", "場所の順序");
  ok(Object.keys(m.SYMPTOM_LOCATION).length >= 13, "症状に場所が付いている");
  const entries = {
    "2026-09-10": { throatSymptoms: ["咳", "咳", "胃が もたれる"] },
    "2026-09-11": { throatSymptoms: ["乾燥", "肩が こわばる"] }
  };
  const rows = m.symptomsByLocation(entries, "2026-09-10", "2026-09-11");
  ok(rows.map((r) => r.location).join("|") === "のど|鼻・のどの奥|おなか|からだ", "記録のある場所だけを順序どおり");
  ok(rows.find((r) => r.location === "鼻・のどの奥").items[0].days === 2, "症状の日数を数える");
  ok(m.symptomsByLocation({}, "2026-09-10", "2026-09-11").length === 0, "無い場所を出さない");
  const summary = m.dinnerToBedSummary({
    "2026-09-10": { dinnerTime: "19:00", bedtime: "23:00" },
    "2026-09-11": { dinnerTime: "20:00", bedtime: "23:00" }
  }, "2026-09-10", "2026-09-11", (d, b) => Number(b.slice(0, 2)) - Number(d.slice(0, 2)));
  ok(summary.days === 2 && summary.medianGapHours === 3.5, "夕食から就寝までをまとめる");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
