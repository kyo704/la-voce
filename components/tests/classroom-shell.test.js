#!/usr/bin/env node

// ============================================================================
// ★生徒の 教室の 殻 ──「次の レッスン」
//
//   ★出どころ docs/opus/未決機能の設計書_第3版_2026-09-14.md §6
//   ★裁定 2026-09-15・坂本さん
//     「「次のレッスン」は 両方 拾う（★教室の レッスン・個人指導、
//       両方の lessons 行を 対象に する）」
//
//   ★★★この見張りの 芯は「両方 拾う」です。
//     ★★個人指導の レッスンは `student_id` を **持ちません**
//       （★`handleCreateLesson` が 入れるのは link_id・scheduled_at・note・created_by）。
//     ★★だから `.eq("student_id", …)` だけで 引くと、
//       ★個人指導の 方には 1件も 出ません。★**空の 画面**に なります。
//     ★★そして 誰も 気づきません ── ★エラーに ならないから です。
//       ★★片方だけに 戻されたら、★この 見張りが 止めます。
//
//   ★★もう1つ ── ★v1 では **既読を 書きません**。
//     ★出どころ [ACTION] Opus →「read-only. no read marks written in v1」
//
//   ★★見えたか どうかは、★これでは 分かりません。実機で お確かめください。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, loadLib } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

const NEED = [["lib", "classroomShell.js"], ["components", "VocalTracker.jsx"]];
const missing = NEED.filter((p) => !fs.existsSync(path.join(__dirname, "..", "..", ...p)));
if (missing.length) {
  missing.forEach((p) => console.log("★★ありません: " + p.join("/")));
  console.log("　★数えません。★止まります。");
  process.exit(1);
}

// ★★`@/lib/…` の 別名は、★data: で 読み込む ときに 解けません。
//   ★★解き方は `_source.js` の `loadLib` が 1か所で 持ちます。
//     ★★見張りごとに 書き写しません（★2026-09-16 に 2本 で 同じ ものを 書きました）。

(async () => {
  const S = await loadLib("lib", "classroomShell.js");
  const vt = readCode("components", "VocalTracker.jsx");

  console.log("① ★★レッスンを、★2つの 道で 引いて いること");
  // ★★ここが 落ちたら、★個人指導の 方の 画面が 空に なります。
  // ★★殻の 塊を 切り出します。
  //   ★★★1400字 という 目分量で 切って いました。★誤りです。
  //     ★★`readCode` は コメントを 外すので、★同じ 字数が 先まで 届きます。
  //     ★★2026-09-15、★それで 関わりの ない `.select(` を 1つ 数えました。
  //   ★★終わりは 印で 決めます ── ★`setClassroom({ … });` まで。
  const fetchAt = vt.indexOf("const [byStudent, byLink");
  const endAt = vt.indexOf("});", vt.indexOf("setClassroom({", fetchAt < 0 ? 0 : fetchAt));
  const blk = (fetchAt > -1 && endAt > fetchAt) ? vt.slice(fetchAt, endAt + 3) : "";
  t(fetchAt > -1, "レッスンの 2つの 道を まとめて 引いて いる");
  t(/\.eq\("student_id", userId\)/.test(blk), "① 教室の レッスン（student_id で 当たる）");
  t(/teacher_student_links!inner\(student_id\)/.test(blk), "② 個人指導（link_id 経由）");
  t(/\.eq\("link\.student_id", userId\)/.test(blk), "② の 当て方が link.student_id");
  t(/mergeLessons\(byStudent\.data, byLink\.data\)/.test(vt), "2つを 混ぜて いる");

  console.log("\n②「個人指導は student_id を 持たない」── ★前提の 確かめ");
  // ★★見張りが 前提を 自分で 確かめない と、★前提が 崩れた ときに 気づけません。
  //   ★★もし 将来 student_id も 入れる ように なったら、★ここが 落ちます。
  //     ★落ちて 正しい です。★そのとき ① の わけを 書き直して ください。
  const ins = vt.indexOf('from("lessons").insert(');
  const insLine = ins < 0 ? "" : vt.slice(ins, vt.indexOf(")", vt.indexOf("insert(", ins) + 200));
  t(ins > -1, "レッスンを 作る ところが ある");
  t(/link_id:/.test(insLine), "作る ときに link_id を 入れて いる");
  t(!/student_id:/.test(insLine), "★作る ときに student_id を 入れて いない（★だから ② が 要る）");

  console.log("\n③ `select(\"*\")` に して いないこと");
  const shellBlk = blk;
  // ★★RLS は 行を 隠します。★列は 隠しません。
  //   ★`select("*")` は、★出さない 列も 通信に 載せます。
  // ★★2026-09-15、★この 1本が 較正で 落ちませんでした。
  //   ★★「LESSON_COLUMNS が どこかに 在る か」を 見て いました。
  //     ★★片方を `select("*")` に 戻しても、★もう片方に 名前が 残るので 通ります。
  //   ★★見るのは「殻の 中の すべての select が 名前で 並べて いるか」です。
  //     ★★同じ 取り違えを 何度か して います ── ★在るか、では なく、
  //       ★**どこに 付いて いるか**を 見る こと。
  // ★★`[^)]*` では 切れます ── ★中に `(student_id)` が 入って いるからです。
  //   ★★括弧の 釣り合いで 取ります。★2026-09-15、★これで 幻の 3つ目を 数えました。
  const shellSelects = [];
  for (let i = shellBlk.indexOf(".select("); i > -1; i = shellBlk.indexOf(".select(", i + 1)) {
    let d = 0, j = i + ".select".length;
    for (; j < shellBlk.length; j++) {
      if (shellBlk[j] === "(") d++;
      else if (shellBlk[j] === ")") { d--; if (d === 0) break; }
    }
    shellSelects.push(shellBlk.slice(i, j + 1));
  }
  console.log("    ★殻の 中の select: " + shellSelects.length + " 件");
  // ★★2026-09-15、★「近い 行事」を 足したので 3つに なりました。
  //   ★★レッスンの 2つ ＋ 行事の 1つ。★増えたら ここも 直して ください。
  // ★★2026-09-15、★3つ そろいました ── ★レッスン2・行事1・連絡1。
  // ★★★2026-09-19、★5つ目（★授業の 型）が 増えました。
  //   ★★数を 写して いたので、★増やした その日に 落ちました。
  //   ★★★数では なく、★**どの 表を 読むか** を 見ます。
  //     ★★読む 表が 増える ことは、★決めの 変わり です。★黙って 通しません。
  //     ★★けれど「4」という 数 そのものには、★意味が ありません。
  const 読む表 = [];
  for (let i = shellBlk.indexOf('from("'); i > -1; i = shellBlk.indexOf('from("', i + 1)) {
    読む表.push(shellBlk.slice(i + 6, shellBlk.indexOf('"', i + 6)));
  }
  const 決めた表 = ["lessons", "lessons", "org_events", "org_messages", "lesson_presets"];
  t(JSON.stringify(読む表.sort()) === JSON.stringify(決めた表.slice().sort()),
    "殻が 読む 表 ── " + 決めた表.join(" / ") + "（★いま: " + 読む表.join(" / ") + "）");
  t(shellSelects.length === 読む表.length,
    "★表の 数と select の 数が 合って いる（" + shellSelects.length + "）");
  shellSelects.forEach((sel, i) => {
    // ★★★列は 名前で 並べます ── ★`*` では ありません。
    //   ★★決まり（RLS）は **行** を 選びます。★**列** は 隠せません。
    //   ★★だから「頼まない」ことで しか、★列を 止められません。
    t(/LESSON_COLUMNS|EVENT_COLUMNS|MESSAGE_COLUMNS|"[a-z_]+(, [a-z_]+)+"/.test(sel),
      (i + 1) + "つ目の select が 列を 名前で 並べて いる");
    t(!/["'`]\s*\*\s*["'`]/.test(sel), (i + 1) + "つ目の select が * では ない");
  });
  // ★★★型から `note` と `need_count` を 頼んで いない こと（★裁定 その92）。
  const 型sel = shellSelects.find((x) => /total_count/.test(x)) || "";
  t(型sel.length > 0, "★型の select が ある");
  t(!/note/.test(型sel), "★型 ── ★`note` を 頼んで いない");
  t(!/need_count/.test(型sel), "★型 ── ★`need_count` を 頼んで いない");
  t(!S.LESSON_COLUMNS.includes("*"), "LESSON_COLUMNS に * が ない");
  t(!S.LESSON_COLUMNS.includes("teacher_note"),
    "teacher_note を 引いて いない（★先生が 自分の ために 書いた もの）");
  t(!S.LESSON_COLUMNS.includes("student_notice"),
    "student_notice を 引いて いない（★この 節では 使いません）");

  console.log("\n④ ★v1 では 既読を 書かないこと");
  // ★★出どころ「read-only. no read marks written in v1」
  //
  // ★★★はじめ、★ファイル 全体を 見て いました。★それは 誤りです。
  //   ★★`org_message_reads` も `org_events` も、★先生・事務の 画面が
  //     ★前から 使って います（★:9942・:11863 ほか）。
  //   ★★見るべきは **殻の 中** だけ です。
  //     ★★語を 数えると、★関わりの ない 正しい コードが 落ちます。
  //       ★落ちない ものは 直されません。★見張りが 嘘に なります。
  //   ★★同じ 取り違えを、★同じ日に 管理画面の 見張りでも しました。
  const shell = blk;
  t(!/org_message_reads/.test(shell), "殻が org_message_reads に 触れて いない");
  const shellSrc = readCode("lib", "classroomShell.js");
  t(!/insert|update|upsert|delete/.test(shellSrc), "この 一枚は 書く 道を 1つも 持たない");

  console.log("\n④-2 ★★渡した 子が、★本当に 出て いること");
  // ★★★2026-09-15、★ここで つまずきました。
  //   ★★3節を `HomeV2` の 子として 渡しました。
  //   ★★`HomeV2` は `children` を **受け取って** いました（★44行目）。
  //     ★★けれど、★どこにも `{children}` が ありません でした。
  //     ★★渡した ものは 黙って 捨てられ、★画面に 何も 出ません でした。
  //     ★★エラーに なりません。★lint も build も 通ります。
  //   ★★「受け取って いる」は、★「出して いる」では ありません。
  //     ★★きょう 2度目の 形 です
  //       （★`research.anonymized` ── ★定義は ある。★読む人が いない）。
  const home = readCode("components", "HomeV2.jsx");
  t(/\bchildren\b/.test(home), "HomeV2 が children を 受け取って いる");
  t(/\{children\}/.test(home), "★HomeV2 が children を **出して** いる");
  // ★★渡す 側も 見ます。★両方 そろって はじめて 画面に 出ます。
  const passAt = vt.indexOf("<HomeV2");
  const pass = passAt < 0 ? "" : vt.slice(passAt, vt.indexOf("</HomeV2>", passAt));
  t(passAt > -1, "VocalTracker が HomeV2 を 呼んで いる");
  t(/SECTION_TITLES\.lesson/.test(pass), "★3節を、★HomeV2 の 子として 渡して いる");

  console.log("\n⑤ ★門の 中だけ に 出して いること");
  // ★★38名の 画面を 1つも 変えません。
  t(/if \(!layoutV2 \|\| !userId\) return;/.test(vt), "引くのも 門の 中だけ");
  t(/\{layoutV2 && classroom && classroom\.lessonsOk && \(\(\) => \{/.test(vt),
    "描くのも 門の 中だけ");

  console.log("\n⑥ 出さない ものを 引いて いないこと（★N-1）");
  // ★★「近い 行事」と「先生からの 連絡」は、★まだ 作って いません。
  //   ★★だから 引きません。★読まれない 値を 運ばない ── No.019.5 と 同じ 決め。
  //   ★★見るのは 殻の 中だけ です（★④ と 同じ わけ）。
  t(/from\("org_messages"\)/.test(shell), "連絡を 引いて いる");
  t(!/EMPTY_TEXT/.test(vt), "まだ 使わない 名前を 読み込んで いない");

  console.log("\n⑥-2 ★近い 行事（★2026-09-15）");
  // ★★読むだけ です。★「出ます」の 印を つける 道を 置いて いません。
  t(/from\("org_events"\)/.test(shell), "行事を 引いて いる");
  t(!/org_event_participants/.test(shell), "★出欠の 表に 触れて いない（★no RSVP）");
  // ★★字は lib が 持ちます。★画面は 読むだけ です。
  //   ★★だから 画面に 字は ありません。★あったら 2か所に なります。
  t(/\{EVENT_NOTE\}/.test(vt), "★「出欠は 集めません」の 1行を 画面が 描いて いる");
  t(!vt.includes(S.EVENT_NOTE), "★画面側に 直書きして いない");
  t(S.EVENT_NOTE === "行事の 出欠は 集めません。知らせるだけです。", "その 字は 見本の まま");
  // ★★日づけの まま。★残りを 数えません。
  t(!/あと\s*\{?\w*\}?\s*日/.test(shellSrc), "★「あと◯日」と 書いて いない（★no countdown）");
  t(/eventDateLabel/.test(vt), "日づけを そのまま 出して いる");
  // ★★曜日×コマ の 型紙に 重ねて いない こと。
  t(!/myTimetable|weekday|cellKey/.test(shellSrc), "★曜日×コマ の しくみに 触れて いない");
  // ★★1件も 無ければ 節ごと 出さない こと。
  t(/if \(soon\.length === 0\) return null;/.test(vt), "1件も 無ければ 節を 出さない");

  console.log("\n⑥-3 ★先生からの 連絡（★2026-09-15）");
  // ★★★v1 では 既読を 書きません。★これが この 節の 芯 です。
  //   ★★「読んだ か」を 集め 始めると、
  //     ★「読んで いない 人」を 数えられる ように なります。
  //   ★★この 家に、★そういう ものは 置きません。
  // ★★★ここで 3度目 です ── ★`vt`（ファイル 全体）で 見て いました。
  //   ★★`org_message_reads` は、★先生・事務の 画面が 前から 使って います
  //     （★:9942・:9950）。★殻の 話では ありません。
  //   ★★見るのは **殻の 中**だけ です。
  //   ★★語を 数えると、★関わりの ない 正しい コードが 落ちます。
  //     ★落ちない ものは 直されません。★見張りが 嘘に なります。
  t(!/org_message_reads/.test(shell), "★殻が org_message_reads に 触れて いない");
  t(/recentMessages\(/.test(vt), "連絡を 出して いる");
  t(!/未読|既読/.test(shellSrc), "★「未読」「既読」と 書いて いない");
  t(/if \(recent\.length === 0\) return null;/.test(vt), "1件も 無ければ 節を 出さない");

  console.log("\n⑦ ★実際に 動かして みる");
  const now = new Date("2026-09-15T10:00:00Z");
  // ★★混ぜる ── 同じ 行が 2度 来ても 1つに なること。
  const merged = S.mergeLessons(
    [{ id: "a", scheduled_at: "2026-09-20T02:00:00Z" }],
    [{ id: "a", scheduled_at: "2026-09-20T02:00:00Z" }, { id: "b", scheduled_at: "2026-09-16T02:00:00Z" }]);
  t(merged.length === 2, "同じ 行が 2度 来ても 1つ（★教室と 個人で 重なる ことが あります）");
  t(S.mergeLessons(null, undefined).length === 0, "null が 来ても 落ちない");

  // ★★次の 1件。
  t(S.nextLesson(merged, now).id === "b", "いちばん 近い ものを 返す");
  t(S.nextLesson([{ id: "p", scheduled_at: "2026-09-01T02:00:00Z" }], now) === null,
    "過ぎた ものは 返さない");
  // ★★★2026-09-16。★`held` という 列は 台帳に ありません。
  //   ★★この 見張りは 1日 半、★在りもしない 列で 通って いました。
  //     ★★`select` に 混ざって いた ため、★2つの 読みが 400 で 落ち、
  //       ★「次のレッスンは、いま 読めませんでした」が 出て いました。
  //   ★★出欠は `attendance` が 正 です ── "came" / "absent" / "canceled" / null。
  t(S.nextLesson([{ id: "h", scheduled_at: "2026-09-20T02:00:00Z", attendance: "came" }], now) === null,
    "済んだ もの（attendance: came）は 返さない");
  t(S.nextLesson([{ id: "h", scheduled_at: "2026-09-20T02:00:00Z", attendance: "absent" }], now) === null,
    "休んだ もの（absent）も 返さない");
  t(S.nextLesson([{ id: "h", scheduled_at: "2026-09-20T02:00:00Z", attendance: "canceled" }], now) === null,
    "取りやめ（canceled）も 返さない");
  t(S.nextLesson([{ id: "h", scheduled_at: "2026-09-20T02:00:00Z", attendance: null }], now) !== null,
    "★まだ 答えの 無い もの（★較正）は 返す");
  // ★★★引く 列に、★台帳に 無い 名を 混ぜない。
  t(!/\bheld\b/.test(S.LESSON_COLUMNS), "★★引く 列に held が 入って いない");
  ["id", "scheduled_at", "org_id", "attendance"].forEach((c) => {
    t(S.LESSON_COLUMNS.split(",").map((x) => x.trim()).includes(c),
      `★${c} を 引いて いる`);
  });
  t(S.nextLesson([{ id: "n", scheduled_at: null }], now) === null, "時刻の 無い 行は 返さない");
  // ★★無い ほうを 見ます。★「有る」だけ 試すと、★無い日が 落ちます。
  t(S.nextLesson([], now) === null, "1件も 無ければ null");
  t(S.nextLesson(null, now) === null, "null が 来ても 落ちない");
  // ★★境（ちょうど いま）は、★これから 扱い。
  t(S.nextLesson([{ id: "x", scheduled_at: now.toISOString() }], now).id === "x",
    "ちょうど いまの ものは 出す");

  console.log("\n⑦-2 ★行事も 動かして みる");
  const evs = [
    { id: 1, event_date: "2026-09-15" },
    { id: 2, event_date: "2026-09-20", previous_date: "2026-09-18" },
    { id: 3, event_date: "2026-09-21", withdrawn_at: "x" },
    { id: 4, event_date: "2026-12-01" },
    { id: 5, event_date: "2026-09-01" }
  ];
  const soon = S.upcomingEvents(evs, "2026-09-15", 3);
  t(soon.map((e) => e.id).join(",") === "1,2", "きょうを 含み、★過ぎた ものと 取り下げを 外す");
  t(!soon.some((e) => e.id === 4), "30日より 先は 出さない");
  t(S.upcomingEvents([], "2026-09-15").length === 0, "1件も 無ければ 空");
  t(S.upcomingEvents(null, "2026-09-15").length === 0, "null が 来ても 落ちない");
  t(S.eventDateLabel({ event_date: "2026-09-20", start_time: "14:30:00" }) === "9月20日　14:30",
    "時刻が あれば 添える");
  t(S.eventDateLabel({ event_date: "2026-09-20" }) === "9月20日", "時刻が 無くても 落ちない");
  t(S.eventDateLabel({}) === "", "日づけが 無ければ 空");
  t(S.eventMoved({ event_date: "2026-09-20", previous_date: "2026-09-18" }) === "9月18日 から 変わりました",
    "日づけが 変わった ことを 言う");
  t(S.eventMoved({ event_date: "2026-09-20" }) === "", "変わって いなければ 何も 言わない");

  console.log("\n⑦-3 ★連絡も 動かして みる");
  const msgs = [
    { id: 1, body: "あ", created_at: "2026-09-10T00:00:00Z" },
    { id: 2, body: "い", created_at: "2026-09-14T00:00:00Z" },
    { id: 3, body: "う", created_at: "2026-09-13T00:00:00Z", withdrawn_at: "x" },
    { id: 4, body: "", created_at: "2026-09-15T00:00:00Z" },
    { id: 5, body: "え", created_at: "2026-09-12T00:00:00Z" }
  ];
  const got = S.recentMessages(msgs, 3);
  t(got.map((r) => r.id).join(",") === "2,5,1", "★新しい 順（★取り消しと 空を 外す）");
  t(!got.some((r) => r.id === 3), "取り消された ものを 出さない");
  t(!got.some((r) => r.id === 4), "中身の 無い ものを 出さない");
  t(S.recentMessages([], 3).length === 0, "1件も 無ければ 空");
  t(S.recentMessages(null, 3).length === 0, "null が 来ても 落ちない");
  t(S.recentMessages(msgs, 1).length === 1, "数を 絞れる");

  console.log("\n⑧ 1件も 無い ときは、★節ごと 出さないこと");
  // ★★教室に 通って いない 方に、★空の 札を 見せません。
  t(/if \(!next\) return null;/.test(vt), "次が 無ければ 節を 出さない");
  // ★★取れなかった ときは 黙りません。★「0件」と 別の こと です。
  t(/!classroom\.lessonsOk/.test(vt), "取れなかった ときは そう 書く");
  t(vt.includes("いま 読めませんでした"), "その 字が ある");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
