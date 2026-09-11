#!/usr/bin/env node
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");
let failed = 0;
const ok = (v, s) => { if (v) console.log("  ✓ " + s); else { console.log("  ✗ " + s); failed++; } };
(async () => {
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "tellTeacher.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  ok(m.NOTICES.length === 3, "定型連絡は3つ");
  ok(m.noticeLabel("absent") === "休みます", "休みます");
  ok(m.noticeLabel("late") === "遅れます", "遅れます");
  ok(m.noticeLabel("coming") === "行けるように なりました", "行けるようになりました");
  ok(m.noticeLabel("unknown") === null && m.isNotice("unknown") === false, "未知の連絡を拒否");
  ok(m.isNotice(null), "連絡を取り消せる");
  ok(m.ONLY_TEACHER_LINE.includes("おひとり") && m.ONLY_TEACHER_LINE.includes("門下のみなさんには 届きません"), "届く相手を明記");
  ok(m.NO_REASON_LINES.length === 2, "理由欄を持たない");
  const ui = readCode("components", "TellTeacher.jsx");
  ok(!/textarea|TextArea|理由を入力/.test(ui), "自由記述欄を置かない");
  ok(/aria-pressed=\{on\}/.test(ui) && /disabled=\{busy \|\| !picked\}/.test(ui), "選択状態と送信条件");
  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
