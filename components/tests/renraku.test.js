#!/usr/bin/env node
// ============================================================================
// 連絡（見本①〜⑥）の 見張り
//
//   ★出どころ docs/opus/woolsong-見本-連絡6画面（9月9日）.html
//            docs/opus/woolsong-見本-連絡-パソコンiPad（9月10日）.png
//            docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §6-1
//
//   ★★確かめること
//     ① 90日で **画面から 消える** こと（★台帳には 残ります・裁定 その77）。
//        ★取り消しは 1行 残ること。
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
const { readCode, readRaw, loadLib } = require("./_source");

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
  // ★★★2026-09-19、★`lib/renraku.js` が `@/lib/todayBand` を 取り込みました。
  //   ★★`whenWord` を ここへ 移した ため です（★ホームでも 同じ 字を 出します）。
  //   ★★★字を そのまま 読み込む 道では、★`@/` を 解けません。★落ちました。
  //     ★★`loadLib` は、★届く ところ まで 写して から 読みます。
  //     ★★★同じ 形の 落ち方は、★2026-09-18 にも ありました（★`_source.js` の 註）。
  const load = async (n) => loadLib("lib", n + ".js");
  const m = await load("renraku");
  const tt = await load("tellTeacher");
  const ui = readCode("components", "Renraku.jsx");
  const raw = readRaw("components", "Renraku.jsx");
  const vt = readCode("components", "VocalTracker.jsx");
  const raw_vt = readRaw("components", "VocalTracker.jsx");
  const sql = readRaw("supabase", "2026-09-10-連絡と、読んだ記録.sql");

  console.log("=== ① 90日 ===");
  // ★★★名を 変えました（★裁定 その77）── `KEEP_DAYS` → `HIDE_AFTER_DAYS`。
  //   ★★もとの 名は「そこまで 保つ（そのあと 消す）」と 読めます。
  //   ★★消す 仕掛けは どこにも ありません。★名が 嘘を 手伝って いました。
  eq(m.HIDE_AFTER_DAYS, 90, "90日");
  eq(m.KEEP_DAYS, undefined, "★古い 名は 残って いない");
  // ★★画面に 出す 1行も、★1か所で 持ちます（★4か所に ありました）。
  eq(typeof m.HIDE_LINE, "string", "画面に 出す 1行が ある");
  eq(m.HIDE_LINE.includes("画面から"), true, "★何が 消えるかを 言って いる");
  eq(m.ageInDays("2026-06-12", "2026-09-10"), 90, "日を 数えられる");
  eq(m.isExpired("2026-06-12", "2026-09-10"), true, "90日で 画面から 消える");
  eq(m.isExpired("2026-06-13", "2026-09-10"), false, "89日は まだ");
  eq(m.isVanishingSoon("2026-06-15", "2026-09-10"), true, "★まもなく 消えます");
  {
    const M = [
      { id: 1, created_at: "2026-09-08", body: "あたらしい" },
      { id: 2, created_at: "2026-06-01", body: "ふるい" },
      { id: 3, created_at: "2026-09-01", body: "取り消した", withdrawn_at: "2026-09-02" }
    ];
    const v = m.visibleMessages(M, "2026-09-10");
    eq(v.map((x) => x.id), [3, 1], "★古い順・90日超は 出さない（台帳には 残ります）");
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
  // ★★★2026-09-20、★できこと に 揃えました（★台帳 08-1e ①）。
  //   ★★役職の 名では なく `renraku_all` で 見ます。
  //   ★★学校が「広報」の 役職に 付けても 通る ように なりました。
  eq(m.mayPost({ perms: ["renraku_all"], isAnnouncement: true }), true,
    "★おしらせは `renraku_all` を 持つ 方が 書ける");
  eq(m.mayPost({ perms: ["meibo"], isAnnouncement: true }), false,
    "★持たない 方は 書けない");
  eq(m.mayPost({ perms: null, isAnnouncement: true }), false,
    "★役職が 無ければ 書けない");
  eq(m.mayPost({ role: null, isMember: true, isAnnouncement: true }), false, "★学生は おしらせを 書けない");
  // ★★★2026-09-18、★この 2つの 字を 外しました（★裁定 その88 Q1）。
  //   ★★出して いた 門が **役割の 名**（owner／admin）の まま でした。
  //   ★★裁定 その76・その77 で、★門下を 読むのは `monka_read` に なりました。
  //   ★★★同じ ことは `MONKA_READ_SELF_LINE`（★裁定 その87）が 言います。
  //   ★★だから ここも 移します ── ★「書けない」は `mayPost` が 見ます（上の 6行）。
  //     ★★「読める わけ」は 帯の ほうで 見ます。
  t(m.OPS_READ_ONLY_LINE === undefined, "★古い 断りの 字を 外した");
  t(m.OPS_READ_WHY_LINE === undefined, "★古い わけの 字も 外した");
  t(m.MONKA_READ_SELF_LINE.includes("確かめられる 役職"), "★新しい 帯に 移した");
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
  // ★★★2026-09-20、★できこと に 揃えました（★台帳 08-1e ②）。
  //   ★★残すのは「門下を 読む できこと」で 開いた とき です。
  eq(m.shouldLogRead({ perms: ["monka_read"] }), true, "★`monka_read` で 開いたら 残す");
  eq(m.shouldLogRead({ perms: ["renraku_all"] }), false, "★持たない 方は 残さない");
  eq(m.shouldLogRead({ role: null, isTeacher: true }), false, "★先生は 残さない（★自分の 門下）");
  eq(m.shouldLogRead({ role: null, isMember: true }), false, "★学生も 残さない");
  eq(m.shouldLogRead({ role: "owner", isTeacher: true }), false, "★自分の 門下なら 残さない");
  t(/開いた 記録/.test(raw), "★画面に 出る");
  // ★★★2026-09-22、★字が 変わりました（★仕様シート §3 ／ ★台帳 08-14）。
  //   ★★前 …… 「誰が・いつ・どの門下を、だけです。何を読んだかは 残しません。」
  //   ★★いま … 「誰が・いつ・どの門下を・理由 だけ。中身は 残しません。消せません。」
  //   ★★理由の 列が 増えた ので、★字も 変わりました。
  //   ★★字そのものは lib が 持ちます（`READ_LOG_NOTES`）。★画面は 並べる だけ です。
  t(/中身は 残しません/.test(readRaw("lib", "renraku.js")), "★中身は 残さない、と 書く");
  t(/何を 読んだか/.test(raw), "★列の 名が ある");
  {
    const sel = sql.slice(sql.indexOf("org_message_reads_select"), sql.indexOf("org_message_reads_select") + 700);
    t(/auth\.uid\(\) = teacher_id/.test(sel), "★先生も 見られる");
    t(/a\.student_id = auth\.uid\(\)/.test(sel), "★学生も 見られる");
  }
  // ★★★2026-09-21、★運営が 門下を 開く 道が 変わりました（★裁定159 S3）。
  //   ★★前 …… 画面が `org_messages` を 引き、★画面が `org_message_reads` に 書く
  //   ★★いま … 道（`open_monka_thread`）が 先に 書き、★書けたときだけ 中身を 返す
  //   ★★★`shouldLogRead` と `logRenrakuRead` は **残して あります**。
  //     ★★`org_message_reads` は 別の 表 で、★同じ 約束に 表が 2つ あります。
  //     ★★どちらを 正に するかは 決めの こと です（→ ★台帳 08-14）。
  //     ★★黙って 消させない ため、★在る ことを ここで 見張ります。
  t(/open_monka_thread/.test(vt), "★開く 道（RPC）を 通って いる");
  t(/p_reason_kind/.test(vt), "★理由を 渡して いる");
  // ★★★直に 引く 道は **残ります**。★先生ご本人と 門下の 学生 の 分 です。
  //   ★★S1 は その 枝を 1つも 触って いません（★裁定159）。
  //   ★★変わったのは「運営が よその 門下を 開く」ところ だけ です。
  //   ★★だから「どこにも 直に 引かない」とは 見ません。★運営の 口 を 見ます。
  {
    const i = vt.indexOf("onOpenStudio={(tid, kind, note)");
    t(i > 0, "★運営の 口が 理由を 受け取って いる");
    const 口 = vt.slice(i, i + 700);
    t(/openMonkaThread\(/.test(口), "★運営の 口は 道を 通る");
    // ★★★2026-09-22、★ここが 変わりました（★仕様シート §2・§5 ⑥）。
    //   ★★ご自分の 門下は、★いままで どおり **そのまま 読みます**。
    //     ★★§2「`monka_read` を 持ち、★かつ その 門下の 先生で ない ときだけ、この 流れ」
    //     ★★§5 ⑥「先生 ご本人が 自分の 門下を 押す → 理由を 聞かれない」
    //   ★★★2026-09-22 まで、★ここは **ぜんぶ** 道を 通して いました。
    //     ★★ご自分の 門下でも 理由が 無いので 道が 断り、★何も 起きません でした。
    //     ★★実機で 通して 見つけました（`tools/s3_monka_read_shot.py`・22/22）。
    //   ★★だから「直に 引かない」では なく、★**分かれて いる** ことを 見ます。
    t(/needsReadReason\(/.test(口), "★ご自分の 門下かを、lib に 聞いて いる");
    t(/openMonkaThread\(/.test(口), "★よその 門下は 道を 通る");
    t(/fetchRenraku\(opsOrgId, tid\)/.test(口), "★ご自分の 門下は そのまま 読む");
  }
  // ★★★2026-09-22、★決まりました（★台帳 08-14 ／ Opus）──
  //   ★★開いた 記録は `monka_read_log` **1本**。★`org_message_reads` は 廃める。
  //   ★★だから 古い 道（`logRenrakuRead`）は **消しました**。
  //   ★★この 見張りは 逆向きに なりました。★戻って きたら 気づきます。
  t(!/logRenrakuRead/.test(vt), "★古い 道は 消えて いる（★台帳 08-14）");
  t(/monka_read_log/.test(vt), "★新しい 出どころを 引いて いる");

  console.log("\n=== ⑦ 決まりB（★広い画面） ===");
  eq(m.BODY_WIDTH, 640, "★本文 640px");
  eq(m.isTwoPane(390), false, "狭い画面は 1つ");
  eq(m.isTwoPane(1024), true, "広い画面は 2ペイン");
  t(/maxWidth: BODY_WIDTH/.test(ui), "★本文の はばを 止めている");
  // ★★★2026-09-18、★左の 幅を 260 → 292 に しました（★裁定 その87）。
  //   ★★見本の `.lft` に 揃えました。
  //   ★★★数を 見張りに 書き写しません。★lib から 引きます。
  //     ★★書き写すと、★次に 変えた 日に ここだけ 古く なります。
  t(new RegExp("\\$\\{LIST_WIDTH\\}px").test(ui), "★左に 一覧（★幅は lib から）");
  eq(m.LIST_WIDTH, 292, "★左の 幅は 292（★見本の `.lft`）");
  // ★★一覧に、★本文の 抜粋を 出さないこと
  {
    // ★★決まりB の「抜粋を 出さない」は、★門下の 行の 話です。
    //   ★★学校からの おしらせは、★見本①で 本文が そのまま 出ています。
    //     ★あれは 一覧の 行では なく、★1枚の 札です。
    //   ★だから、★門下の 行だけを 見ます。
    const list = raw.slice(raw.indexOf("const list = ("), raw.indexOf("const body = ("));
    const studioRows = list.slice(list.indexOf("studios || []"), list.length);
    t(!/\.body/.test(studioRows), "★門下の 行に 本文を 出していない");
    // ★★★2026-09-19（★実機の ご報告・裁定 その99 F2）── ★決めが 変わりました。
    //   ★★一覧に 本文を 出して いました。★左の 列は 292px です。
    //     ★★書いた 字が ずっと 出た ままに なり、★読みにくい と 伺いました。
    //   ★★★いまは ── ★一覧は 題と いつ だけ。★押すと 右の 広い 面に 出ます。
    //     ★★狭い 画面では 1枚に なります（★門下と 同じ 形）。
    t(!/\{a\.body\}/.test(list), "★★一覧に 本文を 出して いない（学校からの お知らせも）");
    t(/announceRow/.test(list), "★題と いつ を lib から 取って いる");
    t(/\{a\.body\}/.test(raw.slice(raw.indexOf("const お知らせ本文"))),
      "★★押すと 本文が 出る（★右の 面）");
    t(/lastAt/.test(list), "★最終更新は 出す");
    t(/studioName/.test(list), "★名前も 出す");
  }

  console.log("\n=== ⑧ 門下の 表を 作っていない ===");
  t(!/create table[^;]*public\.(studios|monka|studio_members)/i.test(sql), "★門下の 表が 無い");
  t(/assignments/.test(vt.slice(vt.indexOf("fetchRenrakuStudios"), vt.indexOf("fetchRenrakuStudios") + 700)),
    "★assignments から 組み立てている");
  t(/is\("ended_at", null\)/.test(vt.slice(vt.indexOf("fetchRenrakuStudios"), vt.indexOf("fetchRenrakuStudios") + 700)),
    "★担当が 終わった 門下は 出さない");

  console.log("\n=== 教室が 2つ以上でも ずれない（★2026-09-10・直し） ===");
  {
    const blk = vt.slice(vt.indexOf("fetchRenrakuStudios"), vt.indexOf("fetchRenrakuStudios") + 1800);
    t(/select\("org_id, teacher_id, student_id"\)/.test(blk), "★門下ごとに org_id を 持つ");
    t(/orgId: mine\.get\(tid\)/.test(blk), "★その門下の 教室を 返す");
    // ★★書くときに myOrgs[0] を 使っていないこと
    // ★★呼んでいるか を 見るときは readCode（★注記の中の 名前を 拾わないため）。
    //   ★注記に「myOrgs[0] では ずれます」と 書いてあります。★今日 5度目です。
    const post = vt.slice(vt.indexOf("onPost={(body) => {"), vt.indexOf("onPost={(body) => {") + 400);
    t(/st && st\.orgId/.test(post), "★書くのは、その門下の 教室へ");
    t(!/myOrgs\[0\]/.test(post), "★myOrgs[0] を 使っていない");
  }

  console.log("\n=== 最終更新（★見本①） ===");
  {
    const blk = vt.slice(vt.indexOf("fetchRenrakuStudios"), vt.indexOf("fetchRenrakuStudios") + 1800);
    t(/lastAt: lastBy\.get\(tid\)/.test(blk), "★最終更新を 返す");
    t(/\.in\("teacher_id", ids\)/.test(blk), "★1つずつ 尋ねず、まとめて 引く");
    t(/is\("withdrawn_at", null\)/.test(blk), "★取り消したものを、最終更新に しない");
    t(/まだ ありません/.test(raw), "★無いときの 言葉が ある（★見本①）");
  }

  console.log("\n=== 添付は できない ===");
  t(m.NO_ATTACH_LINE.includes("添付は できません"), "★そう 書いてある");
  t(!/<input[^>]*type="file"/.test(ui), "★選ぶ口が 無い");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
