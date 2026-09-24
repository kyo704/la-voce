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

  // ---------------------------------------------------------------------------
  // ★2026-09-24 ── ★見本 `SC['休む']` と 読みくらべて（★段3a A群）
  // ---------------------------------------------------------------------------
  ok(/体調を 書かせないためです/.test(m.NO_REASON_LINES.join("")),
    "★なぜ 理由の 欄が 無いかを 書いて いる");
  ok(m.WHICH_LESSON_HEAD === "どの レッスンですか", "★見本の 題");
  ok(/WHICH_LESSON_HEAD/.test(ui) && /TELL_NOTES/.test(ui), "★画面が 出して いる");
  {
    const 註 = m.TELL_NOTES.join("");
    ok(/連絡板への 配信は ありません。/.test(註), "★配信が 無い ことを 書いて いる");
    // ★★★「出欠の 記録には 残ります」とは 書かない こと。
    //   ★★伝えた ことは `student_notice`。★出欠の 印（`attendance`）とは 別の 列 です。
    //   ★★伝えても 出欠は つきません。★つけるのは 先生 です。
    ok(!/出欠の 記録には 残ります/.test(註), "★出欠が つく ように 読める 字を 書いて いない");
    ok(/出欠を つけるのは 先生です/.test(註), "★誰が つけるかを 書いて いる");
    // ★★本当に 別の 列で ある こと。
    const 親 = readCode("components", "VocalTracker.jsx");
    const i = 親.indexOf("async function handleTellTeacher");
    const 体 = 親.slice(i, i + 520);
    ok(/student_notice: notice/.test(体), "★較正 ── ★送り先が 読めて いる");
    ok(!/attendance/.test(体), "★出欠の 列に 触れて いない");
    // ★★連絡板に 出て いない こと。
    ok(!/org_messages|renraku|posts/.test(体), "★連絡板へ 書いて いない");
  }

  process.exit(failed ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(1); });
