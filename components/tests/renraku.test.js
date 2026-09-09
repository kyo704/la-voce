#!/usr/bin/env node
// ============================================================================
// 連絡（見本①〜⑥）の 見張り
//
//   ★出どころ docs/opus/woolsong-見本-連絡6画面（9月9日）.html
//            docs/opus/woolsong-見本-連絡-パソコンiPad（9月10日）.png
//            docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §6-1
//
//   ★★確かめること
//     ① 90日で 消えること。★取り消しは 1行 残ること。
//     ② 書く欄の 下に、★いつも 1行（★§6-1 の 対処①）。
//     ③ 運営の方は 読むだけ（★見本③）。
//     ④ 休むことを、★連絡板に 書かせない（★対処②）。
//     ⑤ 中身を、★サーバーが 検査しない（★対処③）。
//     ⑥ 開いた記録が、★読んだ側にも 読まれた側にも 見えること。
//     ⑦ 広い画面は 決まりB（★640px・2ペイン・抜粋を 出さない）。
//     ⑧ 門下の 表を 作っていないこと（★assignments が 持つ）。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}
function eq(a, b, label) {
  const ja = JSON.stringify(a), jb = JSON.stringify(b);
  t(ja === jb, label + (ja === jb ? "" : `  期待:${jb} 実際:${ja}`));
}

(async () => {
  const load = async (n) => {
    const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", n + ".js"), "utf8");
    return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  };
  const m = await load("renraku");
  const tt = await load("tellTeacher");
  const ui = readCode("components", "Renraku.jsx");
  const raw = readRaw("components", "Renraku.jsx");
  const vt = readCode("components", "VocalTracker.jsx");
  const sql = readRaw("supabase", "2026-09-10-連絡と、読んだ記録.sql");

  console.log("=== ① 90日 ===");
  eq(m.KEEP_DAYS, 90, "90日");
  eq(m.ageInDays("2026-06-12", "2026-09-10"), 90, "日を 数えられる");
  eq(m.isExpired("2026-06-12", "2026-09-10"), true, "90日で 消える");
  eq(m.isExpired("2026-06-13", "2026-09-10"), false, "89日は まだ");
  eq(m.isVanishingSoon("2026-06-15", "2026-09-10"), true, "★まもなく 消えます");
  {
    const M = [
      { id: 1, created_at: "2026-09-08", body: "あたらしい" },
      { id: 2, created_at: "2026-06-01", body: "ふるい" },
      { id: 3, created_at: "2026-09-01", body: "取り消した", withdrawn_at: "2026-09-02" }
    ];
    const v = m.visibleMessages(M, "2026-09-10");
    eq(v.map((x) => x.id), [3, 1], "★古い順・90日超は 出さない");
    eq(v.find((x) => x.id === 3).body, null, "★取り消したら 中身を 出さない");
    eq(v.find((x) => x.id === 3).withdrawn, true, "★取り消した 印は 残る");
  }
  t(/取り消されました/.test(raw), "★1行だけ 残す（★見本②）");

  console.log("\n=== ② 書く欄の 下の 1行（★実際の 守り） ===");
  t(m.NOTICE_LINE.includes("門下の全員と先生、学校の運営の方が読みます"), "★誰が 読むかを 書く");
  t(m.NOTICE_LINE.includes("体調のことは、書かなくて構いません"), "★体調は 書かなくてよい");
  t(/\{NOTICE_LINE\}/.test(ui), "★画面が それを 出している");
  t(!ui.includes("門下の全員と先生"), "★画面に 書き写していない（★決めは lib 1か所）");
  // ★★書ける人にだけ 出ること（★出す ボタンと 一緒に）
  {
    // ★★import の 行では なく、★JSX で 出している所を 見ます。
    //   ★はじめ indexOf("NOTICE_LINE") で 探し、★import に 当たっていました。
    const at = raw.indexOf("{NOTICE_LINE}");
    const btn = raw.indexOf(">出す<", at);
    t(at > 0 && btn > at && btn - at < 900,
      `★1行は「出す」の すぐ 上に ある（${btn - at} 文字）`);
  }

  console.log("\n=== ③ 運営の方は 読むだけ ===");
  eq(m.mayPost({ role: "owner", isTeacher: false, isMember: false }), false, "★owner は 門下に 書けない");
  eq(m.mayPost({ role: "admin", isTeacher: false, isMember: false }), false, "★admin も 書けない");
  eq(m.mayPost({ role: null, isTeacher: true }), true, "先生は 書ける");
  eq(m.mayPost({ role: null, isMember: true }), true, "門下の 学生は 書ける");
  eq(m.mayPost({ role: "owner", isAnnouncement: true }), true, "★おしらせは owner が 書ける");
  eq(m.mayPost({ role: null, isMember: true, isAnnouncement: true }), false, "★学生は おしらせを 書けない");
  t(m.OPS_READ_ONLY_LINE.includes("読むだけです"), "★読むだけ、と 書く");
  t(m.OPS_READ_WHY_LINE.includes("苦情や 事故"), "★わけも 書く");
  // ★★門（RLS）が 本体であること
  t(/org_messages_insert/.test(sql), "★書ける人の 門が ある");
  {
    const ins = sql.slice(sql.indexOf("org_messages_insert"), sql.indexOf("org_messages_withdraw"));
    t(/teacher_id is null and exists/.test(ins), "★おしらせだけ 運営に 許す");
    t(/teacher_id is not null and \(/.test(ins), "★門下は 先生と 学生だけ");
  }

  console.log("\n=== ④ 休むことを、連絡板に 書かせない ===");
  eq(tt.NOTICES.map((n) => n.label), ["休みます", "遅れます", "行けるように なりました"], "★3つだけ");
  t(tt.ONLY_TEACHER_LINE.includes("おひとりに 届きます"), "★誰に 届くかを 書く");
  t(tt.ONLY_TEACHER_LINE.includes("門下のみなさんには 届きません"), "★門下には 届かない、と 書く");
  t(tt.ONLY_TEACHER_LINE.includes("学校の運営の方にも 届きません"), "★運営にも 届かない、と 書く");
  t(tt.NO_REASON_LINES.some((l) => l.includes("理由の欄は ありません")), "★理由の欄が 無い、と 書く");
  eq(tt.isNotice("うそ"), false, "★知らない 言葉を 通さない");
  eq(tt.isNotice(null), true, "★取り消しは 通す");
  {
    // ★★理由を 受け取る 欄が、★どこにも 無いこと
    const tui = readCode("components", "TellTeacher.jsx");
    t(!/<textarea|<input/.test(tui), "★自由に 書く欄が 無い");
    // ★★注記を 外した 本文で 調べます。★注記に「理由の欄は 作りません」と
    //   ★書いてあり、★確かめの 照会にも reason|理由 が 出ます。
    const tsql = readCode("supabase", "2026-09-10-先生に伝える.sql");
    const addCols = (tsql.match(/add column if not exists (\w+)/g) || []);
    t(addCols.length === 2, `★足した列は 2つだけ（${addCols.join(" / ")}）`);
    t(!addCols.some((x) => /reason|memo|note_text/.test(x)), "★理由の 列を 足していない");
    t(/student_notice in \('absent', 'late', 'coming'\)/.test(tsql), "★決まった 言葉だけ");
  }
  // ★★連絡板から、★休むへの 道が 無いこと
  t(!/休みます/.test(ui), "★連絡板に「休みます」が 無い");

  console.log("\n=== ⑤ 中身を 検査しない ===");
  t(!/create (or replace )?function[^;]*org_messages/i.test(sql), "★調べる 関数が 無い");
  t(!/create trigger[^;]*org_messages/i.test(sql), "★調べる 引き金が 無い");
  t(!/体調|喉|症状/.test(readCode("lib", "renraku.js").replace(/NOTICE_LINE[\s\S]{0,200}/, "")),
    "★lib が 語を 探していない");

  console.log("\n=== ⑥ 開いた記録 ===");
  eq(m.shouldLogRead({ role: "owner" }), true, "★運営が 開いたら 残す");
  eq(m.shouldLogRead({ role: "admin" }), true, "★管理者も 残す");
  eq(m.shouldLogRead({ role: null, isTeacher: true }), false, "★先生は 残さない（★自分の 門下）");
  eq(m.shouldLogRead({ role: null, isMember: true }), false, "★学生も 残さない");
  eq(m.shouldLogRead({ role: "owner", isTeacher: true }), false, "★自分の 門下なら 残さない");
  t(/開いた 記録/.test(raw), "★画面に 出る");
  t(/何を読んだかは 残しません/.test(raw), "★中身は 残さない、と 書く");
  {
    const sel = sql.slice(sql.indexOf("org_message_reads_select"), sql.indexOf("org_message_reads_select") + 700);
    t(/auth\.uid\(\) = teacher_id/.test(sel), "★先生も 見られる");
    t(/a\.student_id = auth\.uid\(\)/.test(sel), "★学生も 見られる");
  }
  t(/shouldLogRead\(/.test(vt), "★呼ぶ側が lib に 尋ねている");

  console.log("\n=== ⑦ 決まりB（★広い画面） ===");
  eq(m.BODY_WIDTH, 640, "★本文 640px");
  eq(m.isTwoPane(390), false, "狭い画面は 1つ");
  eq(m.isTwoPane(1024), true, "広い画面は 2ペイン");
  t(/maxWidth: BODY_WIDTH/.test(ui), "★本文の はばを 止めている");
  t(/flex: "0 0 260px"/.test(ui), "★左に 一覧");
  // ★★一覧に、★本文の 抜粋を 出さないこと
  {
    // ★★決まりB の「抜粋を 出さない」は、★門下の 行の 話です。
    //   ★★学校からの おしらせは、★見本①で 本文が そのまま 出ています。
    //     ★あれは 一覧の 行では なく、★1枚の 札です。
    //   ★だから、★門下の 行だけを 見ます。
    const list = raw.slice(raw.indexOf("const list = ("), raw.indexOf("const body = ("));
    const studioRows = list.slice(list.indexOf("studios || []"), list.length);
    t(!/\.body/.test(studioRows), "★門下の 行に 本文を 出していない");
    t(/\{a\.body\}/.test(list), "★学校からの おしらせは 本文を 出す（★見本①）");
    t(/lastAt/.test(list), "★最終更新は 出す");
    t(/studioName/.test(list), "★名前も 出す");
  }

  console.log("\n=== ⑧ 門下の 表を 作っていない ===");
  t(!/create table[^;]*public\.(studios|monka|studio_members)/i.test(sql), "★門下の 表が 無い");
  t(/assignments/.test(vt.slice(vt.indexOf("fetchRenrakuStudios"), vt.indexOf("fetchRenrakuStudios") + 700)),
    "★assignments から 組み立てている");
  t(/is\("ended_at", null\)/.test(vt.slice(vt.indexOf("fetchRenrakuStudios"), vt.indexOf("fetchRenrakuStudios") + 700)),
    "★担当が 終わった 門下は 出さない");

  console.log("\n=== 添付は できない ===");
  t(m.NO_ATTACH_LINE.includes("添付は できません"), "★そう 書いてある");
  t(!/<input[^>]*type="file"/.test(ui), "★選ぶ口が 無い");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
