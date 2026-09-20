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

// ============================================================================
// ★2段で 分けます（★裁定 その124・2026-09-21）
//
//   ★★★これまで、★名ざしの 一覧（`NOT_THREADS`）に 手で 足して いました。
//     ★★`org_posts`（役職）／`post_change_log`／`org_message_drafts`
//     ★★2026-09-21、★`postings` と `application_messages` で **2度 続けて** 落ちました。
//     ★★★手で 足す 検査は、★いずれ 無視されます。★3度目が 必ず 来ます。
//
//   ★★★段1 ── ★広く 拾います。★網は 狭めません。★むしろ 広げます。
//     ★名に thread / message / post / note / comment / chat を 含む
//     ★**または** 自由に 書ける 列（body / text / content …）を 持つ
//     ★★名だけで 拾って いた ものを、★列でも 拾う ように しました。
//
//   ★★★段2 ── ★実質で 分けます。★3つ すべてを 満たす ものだけ「先生どうしの 連絡」。
//     ★① 自由に 書ける 列が ある
//     ★② `org_id` を 持つ（★学校の もの）
//     ★③ 既読 か 参加者の 列を 持つ、★または `org_messages` と 同じ 形
//         （★`author_id` と `org_id` と 自由文）
//
//   ★★★外した ものを **黙って 落としません**。★わけを 1行で 並べます。
//     ★★毎回 目で 見られます。★手で 足す ところは 1つも ありません。
// ============================================================================

/** ★自由に 書ける 列（★名前で 見ます。★型だけでは 決まりません）。 */
const JIYUU = /^\s*(body|text|content|message|comment|memo|free_\w+)\s+text\b/mi;
/** ★既読。 */
const YOMI = /^\s*(read_at|read_by|reader\w*)\b/mi;
/** ★参加者（★§6-2 の 分かれ目。★誰が 入るかを 表が 持つ か）。 */
const SANKA = /^\s*(participant\w*|member_ids|member_user_ids)\b/mi;
/** ★添付（★どの 表でも 作りません）。 */
const TENPU = /\b(attachment|file_url|image_url|media|file_path)\b/i;
/** ★段1 で 拾う 名。 */
const NA = /thread|message|post|note|comment|chat/i;

/** ★`create table … public.X ( … );` を、★名と 中身の 組で 取り出します。 */
function 表たち(sql) {
  const 出 = [];
  const re = /create table (?:if not exists )?public\.(\w+)\s*\(/gi;
  let m;
  while ((m = re.exec(sql)) !== null) {
    let d = 0, k = m.index + m[0].length - 1;
    while (k < sql.length) {
      if (sql[k] === "(") d++;
      else if (sql[k] === ")") { d--; if (d === 0) break; }
      k++;
    }
    出.push({ 名: m[1], なか: sql.slice(m.index, k + 1) });
  }
  return 出;
}

/**
 * ★段1・段2（★裁定 その124）。
 *
 *   ★★返り `{ 検査, 対象外 }`。★`対象外` には わけを 添えます。
 */
function 分ける(sql) {
  const 検査 = [], 先生どうし = [], 門下 = [], 対象外 = [];
  表たち(sql).forEach((t) => {
    const 自由 = JIYUU.test(t.なか);
    const 名で = NA.test(t.名);
    // ★★段1 ── ★名 か 列 の どちらかで 拾います。
    if (!名で && !自由) return;
    const 学校 = /^\s*org_id\s+uuid/mi.test(t.なか);
    const 既読 = YOMI.test(t.なか);
    const 参加 = SANKA.test(t.なか);
    const 同じ形 = /^\s*author_id\s+uuid/mi.test(t.なか) && 学校 && 自由;
    // ★★段2 ── ★3つ すべて。
    if (自由 && 学校 && (既読 || 参加 || 同じ形)) {
      // ★★★どちらの 連絡か も、★実質で 分けます（★裁定 その124 SAME_PATTERN）。
      //   ★★これまで `STUDIO = ["org_messages", "org_message_reads"]` と
      //     ★★名ざしで 書いて いました。★これも 手で 足す 一覧 でした。
      //   ★★★分かれ目は **参加者の 列** です。
      //     ★★§6-2 先生どうしの 連絡 …… ★誰が 入るかを 表が 持ちます。
      //       ★★だから「生徒を 1人も 入れない」が 要に なります。
      //     ★★§6-1 門下の 連絡 …… ★誰が 読むかは `assignments` が 持ちます。
      //       ★★表は 参加者を 持ちません（★§6-1「新しい表を 作らない」）。
      if (参加) 先生どうし.push(t);
      else 門下.push(t);
      検査.push(t);
      return;
    }
    const わけ = [];
    if (!自由) わけ.push("自由に 書ける 列が ない");
    if (!学校) わけ.push("org_id を 持たない");
    if (自由 && 学校 && !既読 && !参加 && !同じ形) わけ.push("既読・参加者の 列が ない");
    対象外.push({ ...t, わけ: わけ.join(" ／ ") });
  });
  return { 検査, 先生どうし, 門下, 対象外 };
}

// ----------------------------------------------------------------------------
// ★較正（★裁定 その124 CALIBRATION）。★道具を 先に 試します。
//   ★★故意に 1件、★条件を 満たす 表を 作って 拾える か。
//   ★★故意に 1件、★名だけ message の 表を 作って「対象外」に 出る か。
// ----------------------------------------------------------------------------
{
  const 当 = `create table if not exists public.karibo_threads (
  id uuid primary key,
  org_id uuid not null,
  author_id uuid not null,
  body text not null,
  read_at timestamptz
);`;
  const 外 = `create table if not exists public.karibo_messages (
  id uuid primary key,
  application_id uuid not null,
  template_key text not null
);`;
  const 列で = `create table if not exists public.karibo_nanimo (
  id uuid primary key,
  body text not null
);`;
  const r1 = 分ける(当);
  assertTrue(r1.検査.length === 1 && r1.検査[0].名 === "karibo_threads",
    "★較正 ── ★3つ 満たす 表を 拾う");
  const r2 = 分ける(外);
  assertTrue(r2.検査.length === 0 && r2.対象外.length === 1
    && /自由に 書ける 列が ない/.test(r2.対象外[0].わけ),
    "★較正 ── ★名だけ message の 表は「対象外」に 出る（わけつき）");
  const r3 = 分ける(列で);
  assertTrue(r3.対象外.length === 1 && r3.対象外[0].名 === "karibo_nanimo",
    "★較正 ── ★名に 当たらなくても、★自由文の 列で 拾う（★網を 広げた）");
  const r4 = 分ける(`create table if not exists public.karibo_sanka (
  id uuid primary key,
  org_id uuid not null,
  participant_ids uuid[] not null,
  body text not null
);`);
  assertTrue(r4.先生どうし.length === 1 && r4.門下.length === 0,
    "★較正 ── ★参加者の 列が あれば §6-2（先生どうし）に 分かれる");
  const r5 = 分ける(`create table if not exists public.karibo_monka (
  id uuid primary key,
  org_id uuid not null,
  author_id uuid not null,
  body text not null
);`);
  assertTrue(r5.門下.length === 1 && r5.先生どうし.length === 0,
    "★較正 ── ★参加者の 列が 無ければ §6-1（門下）に 分かれる");
  assertTrue(分ける("create table if not exists public.karibo_kara (id uuid);").検査.length === 0
    && 分ける("create table if not exists public.karibo_kara (id uuid);").対象外.length === 0,
    "★較正 ── ★関わりの ない 表は、★どちらにも 出さない");
}

console.log("=== ★スレッドは、まだ作っていない ===");
const わけ = 分ける(allSql);
const tables = わけ.検査.map((t) => t.名);
console.log(`★検査した 表: ${tables.length}件` + (tables.length ? ` … ${tables.join(", ")}` : ""));
console.log(`★対象外と した 表: ${わけ.対象外.length}件（わけつき）`);
わけ.対象外.forEach((t) => console.log(`    · ${t.名} …… ${t.わけ}`));
assertTrue(true, tables.length === 0 ? "スレッドの表は無い" : `スレッドの表: ${tables.join(", ")}`);

// ★★★添付は、★段1 で 拾った **すべて** に 当てます（★裁定 その124「網を 狭めない」）。
//   ★★これまで、★名ざしで 外した 表には 当たって いませんでした。
//   ★★対象外に なった ものにも、★添付の 列は 作らせません。
console.log("\n=== ★添付を 作って いない（★段1 で 拾った ぜんぶ） ===");
[...わけ.検査, ...わけ.対象外].forEach((t) => {
  assertTrue(!TENPU.test(t.なか), `★${t.名} に 添付の 列が ない`);
});

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
  // ★★★名ざしを やめました（★裁定 その124 SAME_PATTERN・2026-09-21）。
  //   ★★分かれ目は 参加者の 列 です。★`分ける()` が 決めます。
  const teacherThreads = わけ.先生どうし.map((t) => t.名);
  const studioTables = わけ.門下.map((t) => t.名);
  console.log(`  ★§6-2 先生どうし: ${teacherThreads.length}件`
    + ` ／ ★§6-1 門下: ${studioTables.length}件`);

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
