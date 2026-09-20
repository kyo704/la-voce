#!/usr/bin/env node
/**
 * スレッド機能を作るとき、先に守らせること（2026-09-02）
 *
 * ★いまスレッド機能はありません。作っていないので、この検査は
 *   ★「作り始めた瞬間」に効きます。
 *
 * ★なぜ先に置くか
 *   G5-35（生徒スレッド）の参加者は「担当の先生＋管理者」だけで、
 *   ★生徒を1人でも入れると、大人と未成年の自由記述の場になります。
 *   これは★あとから足せない性質のものです。
 *   作ってから「生徒を外そう」では、すでに書かれたものが残ります。
 *
 *   添付も同じです。画像を貼れるようにすると、
 *   ★分析画面の切り取りが渡せます。2026-09-01 に
 *   「記録の中身を先生に渡さない」と決めたことが、画像で迂回されます。
 *
 * ★空のテーブルを先に作る、という方法は採りませんでした。
 *   使われていないものは、いつか使われます。今日それを3回直しています
 *   （derivePrimaryActivityLegacy／活動の色の古い判定／AdminDashboard.jsx）。
 *   ★代わりに、作り始めたら落ちる検査を置きます。
 */
const fs = require("fs");
const path = require("path");
const { readRaw } = require("./_source");

let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

const root = path.join(__dirname, "..", "..");
const sqlFiles = fs.readdirSync(path.join(root, "supabase")).filter((f) => f.endsWith(".sql"));
const allSql = sqlFiles.map((f) => fs.readFileSync(path.join(root, "supabase", f), "utf8")).join("\n");

/** スレッドらしい表が作られたか。 */
// ★★名前に post が 入っていても、★連絡の 表とは 限りません。
//   ★2026-09-11、★org_posts（★役職と できること）を 作りました。
//     ★★「post」は「投稿」では なく「役職」です。
//     ★この 見張りが、★役職の 表を 連絡の 表と 読み違えて 落ちました。
//   ★★名前で 当てる 検査の 限界です。★除く ものを 名指しで 書きます。
// ★★名に「post」が 入って いても、★やりとり では ない もの。
//   ★★★`org_posts` …… ★役職 です。★「役職（post）」の post です。
//   ★★★`post_change_log` … ★役職を 変えた 記録 です（★2026-09-18）。
//     ★★本文の 列も、★参加する 人の 列も ありません。
//     ★★誰が・いつ・誰の 役職を 変えたか、だけ です。
//   ★★★ここに 足す ときは、★**本文が 無い こと**を 確かめて ください。
//     ★★本文が ある もの を 足すと、★この 見張りは 効かなく なります。
// ★★★名に `message` が 入って いても、★やりとり では ない もの（★2026-09-19）。
//   ★★`org_message_drafts` …… ★書いた ご本人 だけ の 下書き です。
//     ★★相手が いません。★参加者の 列も ありません。★誰にも 届きません。
//     ★★添付の 列も ありません（★字だけ です）。
//     ★★★決まりは 1つ（`auth.uid() = author_id`）── ★よその 方には 道が ありません。
//   ★★★外す ときは、★上の 3つを 確かめて から にして ください。
// ★★★`postings` を 外します（★2026-09-21・裁定 その122）。
//   ★★この 検査は 名に `post` を 含む 表を「やりとり」と 見なします。
//   ★★`postings` は **募集** です。★やりとりでは ありません。
//     ★★書き込みも、★読んだ 記録も、★参加者も ありません。
//   ★★★外しただけ では 足りません。★下で 中身を 確かめます。
// ★★★`application_messages` も 外します（★2026-09-21・裁定 その121 段4）。
//   ★★これは **さがす（マッチング）** の ことばの 往復 です。
//   ★★先生どうしの 連絡（★§6-2）では ありません。★別の 機能 です。
//   ★★守りも 別 です ── ★自由文を 持たない こと が 要 です。
//     ★★そちらは `matching-messages-gate.test.js` が 見ます。
//   ★★★ここでも 外しっぱなしに しません。★下で 中身を 確かめます。
const NOT_THREADS = ["org_posts", "post_change_log", "org_message_drafts",
  "postings", "application_messages"];

function threadTables() {
  const hits = [];
  const re = /create table (?:if not exists )?public\.(\w*(?:thread|message|post)\w*)/gi;
  let m;
  while ((m = re.exec(allSql)) !== null) {
    if (!NOT_THREADS.includes(m[1])) hits.push(m[1]);
  }
  return [...new Set(hits)];
}

// ★★★外した 表が、★本当に「やりとりで ない」か を 確かめます。
//   ★★外しただけ では、★次の 人が 中身を 変えた 日に 気づけません。
{
  const 下書き = allSql.slice(allSql.indexOf("create table if not exists public.org_message_drafts"));
  const なか = 下書き.slice(0, 下書き.indexOf(");"));
  assertTrue(/author_id uuid not null/.test(なか), "★下書きは ご本人の ものである");
  assertTrue(!/attachment|file_url|image/.test(なか), "★下書きに 添付の 列が ない");
  assertTrue(!/participant|member_ids/.test(なか), "★下書きに 参加者の 列が ない");
}

// ★★★`postings` が、★本当に「やりとりで ない」か（★2026-09-21・裁定 その122）。
//   ★★もし ここに 書き込みの 列が 増えたら、★やりとりに なって います。
//   ★★そのときは 外しっぱなしに せず、★この 検査に 戻します。
{
  const い = allSql.indexOf("create table if not exists public.postings");
  if (い >= 0) {
    const なか = allSql.slice(い, allSql.indexOf(");", い));
    assertTrue(!/\bbody\b|\bmessage\b|\breply\b/.test(なか),
      "★募集に 書き込みの 列が ない（★やりとりでは ない）");
    assertTrue(!/participant|member_ids|read_at/.test(なか),
      "★募集に 参加者・既読の 列が ない");
    assertTrue(!/attachment|file_url|image_url|media|file_path/.test(なか),
      "★募集に 添付の 列が ない");
  }
}

// ★★★`application_messages` が、★本当に「先生どうしの 連絡」で ない か
//   （★2026-09-21・裁定 その121 段4）。
//   ★★こちらは **ことばの 往復** ですが、★中身が ちがいます ──
//     ★★自由に 書ける 列を 持ちません。★決まった 名（template_key）だけ です。
//   ★★もし ここに 自由文の 列が 増えたら、★別の ものに なって います。
{
  const い = allSql.indexOf("create table if not exists public.application_messages");
  if (い >= 0) {
    const なか = allSql.slice(い, allSql.indexOf(");", い));
    assertTrue(/application_id uuid not null/.test(なか),
      "★応募に ぶら下がって いる（★学校の 連絡では ない）");
    assertTrue(/template_key text not null/.test(なか),
      "★ことばは 決まった 名 だけ");
    assertTrue(!/^\s*(body|message|text|comment|memo)\s+text/m.test(なか),
      "★自由に 書ける 列が ない");
    assertTrue(!/attachment|file_url|image_url|media|file_path/.test(なか),
      "★添付の 列が ない");
    assertTrue(!/student_id/.test(なか), "★生徒の 列を 持って いない");
  }
}

console.log("=== ★スレッドは、まだ作っていない ===");
const tables = threadTables();
assertTrue(true, tables.length === 0 ? "スレッドの表は無い" : `スレッドの表: ${tables.join(", ")}`);

if (tables.length === 0) {
  console.log("\n=== 作り始めたときに守ること（いまは対象なし） ===");
  console.log("  ・参加者は担当の先生と管理者だけ。★生徒を1人も入れない");
  console.log("  ・添付の列を作らない（画像・ファイル・URL）");
  console.log("  ・スレッドを作る画面に、開示請求の断り書きを出す");
  assertTrue(true, "★作り始めたら、この検査が中身を見ます");
} else {
  console.log("\n=== ★参加者に生徒が入っていない ===");
  tables.forEach((tbl) => {
    const block = (allSql.match(new RegExp(`create table[^;]*public\\.${tbl}[\\s\\S]*?;`, "i")) || [""])[0];
    assertTrue(!/student_id/.test(block),
      `★${tbl} に student_id が無い（生徒を参加者にしない）`);
  });

  console.log("\n=== ★添付を作っていない ===");
  tables.forEach((tbl) => {
    const block = (allSql.match(new RegExp(`create table[^;]*public\\.${tbl}[\\s\\S]*?;`, "i")) || [""])[0];
    ["attachment", "file_url", "image_url", "media", "file_path"].forEach((col) => {
      assertTrue(!new RegExp(col, "i").test(block), `★${tbl} に ${col} が無い`);
    });
  });

  console.log("\n=== ★どちらの 連絡かで、要る 断り書きが ちがう ===");
  // ★★2026-09-10、★門下の連絡（§6-1）の 表を 作りました。
  //   ★★この検査は、もともと ★先生どうしの連絡（§6-2）のために 書いたものです。
  //     ★あちらは「生徒を 1人も 入れない」が 要で、
  //     ★★書かれたものを ご本人が 開示請求できる、という 断りが 要ります。
  //   ★★門下の連絡（§6-1）は、★生徒が 入るのが 正しい姿です。
  //     ★★だから「student_id が 無い」を、★門下の表に 当ててはいけません。
  //     ★★要る 断りも ちがいます。★見本⑤の 1行です。
  //       「ここに書いたことは、門下の全員と先生、学校の運営の方が読みます。」
  //   ★どちらの 守りも 弱めません。★当てる先を 分けるだけです。
  const STUDIO = ["org_messages", "org_message_reads"];   // ★§6-1 門下の連絡
  const teacherThreads = tables.filter((t) => !STUDIO.includes(t));
  const studioTables = tables.filter((t) => STUDIO.includes(t));

  if (teacherThreads.length > 0) {
    // ★★§6-2。★生徒を 1人も 入れないこと。★開示の 断りが 要ること。
    teacherThreads.forEach((tbl) => {
      const block = (allSql.match(new RegExp(`create table[^;]*public\\.${tbl}[\\s\\S]*?;`, "i")) || [""])[0];
      assertTrue(!/student_id/.test(block), `★${tbl} に student_id が無い（生徒を参加者にしない）`);
    });
    const vt = readRaw("components", "VocalTracker.jsx");
    assertTrue(/ご本人から開示を求められた場合/.test(vt),
      "★先生どうしの連絡に、開示請求の断り書きがある");
  } else {
    assertTrue(true, "★先生どうしの連絡（§6-2）は、まだ作っていない");
  }

  if (studioTables.length > 0) {
    // ★★門下の 表にも、★student_id を 置きません。★わけが ちがいます。
    //   ★★§6-1「★assignments で すでに 表現できている。
    //     ★新しいテーブルを 作らないでください」。
    //   ★★student_id を 置くと、★誰が 門下かを 2か所で 持つことに なります。
    //     ★担当が 終わった 人が、★片方にだけ 残ります。
    studioTables.forEach((tbl) => {
      const block = (allSql.match(new RegExp(`create table[^;]*public\\.${tbl}[\\s\\S]*?;`, "i")) || [""])[0];
      assertTrue(!/student_id/.test(block),
        `★${tbl} に student_id が無い（★門下は assignments が 持つ）`);
    });

    // ★★§6-1。★書く画面が できたら、★見本⑤の 1行が 要ります。
    //   ★★いまは 表だけです。★画面は これから 作ります。
    //   ★画面が できた ときに、★この検査が 中身を 見ます。
    const LINE = "ここに書いたことは、門下の全員と先生、学校の運営の方が読みます。";
    const files = fs.readdirSync(path.join(root, "components"))
      .filter((f) => /^Renraku|^Threads|^OpsThreads/.test(f));
    if (files.length === 0) {
      assertTrue(true, "★門下の連絡の画面は、まだ作っていない（★できたら 中身を見ます）");
    } else {
      const body = files.map((f) => fs.readFileSync(path.join(root, "components", f), "utf8")).join("\n");
      // ★★言葉そのものは lib/renraku.js が 持ちます（★1か所）。
      //   ★画面は、★それを 出しているか どうかを 見ます。
      //   ★★画面に 書き写させません。★写すと、★片方だけ 直ります。
      const libBody = fs.readFileSync(path.join(root, "lib", "renraku.js"), "utf8");
      assertTrue(libBody.includes(LINE), "★1行の 言葉が lib に ある（★見本⑤）");
      assertTrue(/体調のことは、書かなくて構いません/.test(libBody),
        "★体調は 書かなくてよい、と lib に 書いてある");
      assertTrue(/NOTICE_LINE/.test(body), "★書く欄の 下に、★その1行を 出している");
      assertTrue(!body.includes(LINE), "★画面に 書き写していない（★決めは lib 1か所）");
    }
    // ★★中身を サーバーが 検査していないこと（★§6-1 の 対処③）
    assertTrue(!/create (or replace )?function[^;]*org_messages/i.test(allSql),
      "★書いたものを 調べる 関数が 無い");
    assertTrue(!/create trigger[^;]*org_messages/i.test(allSql),
      "★書いたものを 調べる 引き金が 無い");
  }
}

console.log("\n=== 憲章に、決まりが書いてある ===");
{
  const charter = readRaw("docs", "lavoce-設計憲章.md");
  assertTrue(/生徒についてのスレッドに、生徒を1人も入れない/.test(charter),
    "★参加者の決まりが書いてある");
  assertTrue(/やりとりに、画像やファイルを添付できるようにしない/.test(charter),
    "★添付の禁止が書いてある");
}

console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
process.exit(failCount === 0 ? 0 : 1);
