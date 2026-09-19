#!/usr/bin/env node
// ============================================================================
// 名簿と ご請求（第3便・見本③⑦）の 見張り
//
//   ★出どころ docs/opus/woolsong-教室機能の正（9月9日・最終稿）.md §10
//            坂本さん経由・Opus の裁定（2026-09-09・画面の作り方）
//
//   ★★確かめること
//     ① 先生・事務・休会中を 数えないこと。
//     ② 段の 境目で、★人数が 少ないほうが 高くならないこと。
//     ③ 見本③の 数（52人 → 20,800円）と 合うこと。
//     ④ 下限・初期費用・年の 前払い。
//     ⑤ 画面：★表で ない／★さがすが 前／★合計が 下に 固定／★44pt 以上。
//     ⑥ ％・連続日数を 出さないこと。
//     ⑦ 健康の 記録に たどりつけないこと。
//     ⑧ お金は 責任者だけ。
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
  const src = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "orgRoster.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const ui = readCode("components", "OpsRoster.jsx");
  const raw = readRaw("components", "OpsRoster.jsx");

  console.log("=== ① 数える人・数えない人（★§10） ===");
  eq(m.NOT_COUNTED_ROLES.slice().sort(), ["admin", "owner", "staff", "teacher"],
    "★先生・事務・責任者・管理者は 数えない");
  // ★★2026-09-13、★ここも 台帳に 無い 値で 書かれて いました。
  //   ★★`role:"student"` … ★台帳が 許すのは owner／admin／teacher／staff。
  //   ★★`status:"paused"／"invited"` … ★そんな 値は ありません。
  //   ★★別の 節を 直した ときに、★ここを 見落として いました。
  //     ★tools/schema_fixture_check.py が 拾いました。
  // ★★生徒は enrollments の 行です。★role を 持ちません。
  eq(m.rosterCount([
    { status: "active" }, { role: "teacher" }, { role: "staff" },
    { role: "owner" }, { role: "admin" }, { status: "active" }
  ]), 2, "★生徒だけ 数える");
  eq(m.rosterCount([{ status: "left" }]), 0, "★退会した 方は 数えない");
  eq(m.rosterCount([{ status: null }]), 1, "★ようすが 空なら 在籍と 見る");
  eq(m.rosterCount([]), 0, "空は 0");
  eq(m.rosterCount(null), 0, "無くても 落ちない");
  // ★★2026-09-13、★ここは 台帳に 無い 値で 書かれて いました。
  //   ★`role:"student"` … ★memberships_role_check が 許しません
  //     （★owner／admin／teacher／staff の 4つ だけ・NOT NULL）。
  //   ★`status:"paused"／"invited"` … ★そんな 列も 値も ありません。
  //   ★★作り物の 行だったので 見張りは 通り、★実物は 1行も 出ませんでした。
  // ★★いまは enrollments の 形で 書きます。
  //   ★★★2026-09-19 まで active／left の 2つ でした。★いまは paused も あります。
  eq(m.countsByStatus([
    { status: "active" }, { status: "active" },
    { status: "left" }, { status: null }
  ]), { counted: 3, left: 1, paused: 0, notCounted: 0 }, "ようす ごとに 数えられる（active／paused／left）");
  // ★★★2026-09-19 ── ★休会（`paused`）が 台帳に 入りました。
  //   ★★見本 `P_sonohito` の 3つ目 です。★きょうまで 置き場が ありません でした。
  //   ★★★数える 人数に 入りません。★お金に かかります。
  eq(m.countsByStatus([
    { status: "active" }, { status: "paused" }, { status: "paused" }, { status: "left" }
  ]), { counted: 1, left: 1, paused: 2, notCounted: 0 }, "★休会を 別に 数える");
  eq(m.rosterCount([
    { status: "active" }, { status: "paused" }, { status: "left" }
  ]), 1, "★★休会は ご請求の 人数に 入らない");
  eq(m.STATUSES.length, 3, "★ようすは 3つ（在籍・休会・退会）");
  eq(m.STATUSES.every((x) => !!x.note), true, "★どれにも 説明が ある");
  // ★★役割の 付いた 行（★memberships）は、★これまでどおり 数えません。
  eq(m.countsByStatus([{ role: "teacher" }, { role: "owner" }]),
    { counted: 0, left: 0, paused: 0, notCounted: 2 }, "役割の 付いた 行は 数えない");

  console.log("\n=== ② 段の 境目で 逆転しない（★§10「安いほうを 当てます」） ===");
  let bad = [];
  for (let n = 2; n <= 400; n++) {
    if (m.monthlyFee(n) < m.monthlyFee(n - 1)) bad.push(n);
  }
  eq(bad, [], "★人数が 増えて 安くなる 所が 無い");
  t(m.monthlyFee(95) <= m.monthlyFee(100), "★95人が 100人より 高くない");
  t(m.monthlyFee(299) <= m.monthlyFee(300), "★299人が 300人より 高くない");
  eq(m.monthlyFee(100), 35000, "100人 → 35,000（★350円の段）");
  eq(m.monthlyFee(300), 75000, "300人 → 75,000（★250円の段）");

  console.log("\n=== ③ 見本③の 数 ===");
  eq(m.monthlyFee(52), 20800, "★52人 → 20,800円（★見本③の とおり）");
  eq(m.perHead(52), 400, "★1人あたり 400円");

  console.log("\n=== ④ 下限・初期費用・年の 前払い ===");
  // ★★2026年9月13日、★下限を 12,800円 → 9,800円 に 改めました（★案A）。
  //   ★出どころ Opus の 裁定 その20（★坂本さん ご確認）。
  //   ★★変えたのは 下限 1つ だけ です。★段の 式は 触って いません。
  eq(m.MONTHLY_FLOOR, 9800, "★下限は 9,800（★2026-09-13・案A）");
  eq(m.monthlyFee(20), 9800, "★20人でも 下限");
  eq(m.monthlyFee(6), 9800, "★6人から 下限");
  // ★★境目（★案A と 案B の ちがいが いちばん 出る ところ）。
  //   ★★24人 … 24 × 400 ＝ 9,600円。★下限（9,800円）が 当たります。
  //   ★★25人 … 25 × 400 ＝ 10,000円。★下限を 越えるので、★そのまま。
  eq(m.monthlyFee(24), 9800, "★24人（9,600円 → 下限が 当たる）");
  eq(m.monthlyFee(25), 10000, "★25人（10,000円 → 下限を 越える）");
  // ★★32人は 32 × 400 ＝ 12,800円。
  //   ★★前は「下限ちょうど」でした。★いまは 段の 式の 値です。
  //   ★★同じ 数でも 意味が 変わりました。★書き残します。
  eq(m.monthlyFee(32), 12800, "★32人（★段の 式。★もう 下限では ない）");
  eq(m.monthlyFee(0), 0, "★0人なら 0円（★下限を 当てない）");
  eq(m.monthlyFee(5), 0, "★5人以下なら 0円（★無料枠）");
  eq(m.monthlyFee(500), 125000, "★500人 → 125,000円（★250円の段）");
  eq(m.monthlyFee(null), 0, "★人数が 無ければ 0円");
  eq(m.setupFee(49), 0, "★49人なら 初期費用 なし");
  eq(m.setupFee(50), 100000, "★50人から 100,000円");
  eq(m.yearlyFee(52), 20800 * 10, "★年は 2か月ぶん 引く");
  eq(m.yen(20800), "20,800", "読みやすく");

  console.log("\n=== ⑤ 画面の 作り方（★裁定） ===");
  t(!/<table|<thead|<tbody|<tr[ >]/.test(ui), "★表を 使っていない（★1行1カード）");
  {
    // ★★さがすが、★一覧より 前に あること
    const searchAt = raw.indexOf('type="search"');
    const listAt = raw.indexOf("list.map(");
    t(searchAt > 0 && listAt > 0 && searchAt < listAt, "★さがすが 一覧の 前に ある");
  }
  t(/position: "fixed"[\s\S]{0,120}bottom/.test(raw), "★合計が 下に 固定されている");
  t(/今月のご請求/.test(raw), "★合計に ご請求が ある");
  {
    // ★★★2026-09-19 ── ★形を 関数に まとめたら 落ちました。
    //   ★★`style={札の形(on)}` は、★字の 上に `minHeight` が 出て きません。
    //   ★★★見たいのは「44 以上か」で あって、★書き方では ありません。
    //     ★★関数に して ある ときは、★その 関数の 中を 見ます。
    const parts = raw.split("<button").slice(1);
    const 中 = (p) => p.slice(0, p.indexOf("</button>") + 1 || 400);
    const 形の名 = [...raw.matchAll(/function\s+([^\s(]+)\s*\([^)]*\)\s*\{[\s\S]{0,400}?minHeight/g)]
      .map((m) => m[1]);
    const noH = parts.filter((p) => {
      const t2 = 中(p);
      if (/minHeight/.test(t2)) return false;
      // ★★形を 作る 関数を 使って いる なら、★その 中に 44 が あります。
      return !形の名.some((n) => t2.includes(n + "("));
    });
    t(parts.length > 0 && noH.length === 0,
      `★押しどころは 44pt 以上（${parts.length}件・形の関数 ${形の名.length}）`);
    const mins = (raw.match(/minHeight: (\d+)/g) || []).map((x) => Number(x.replace(/\D/g, "")));
    t(mins.every((v) => v >= 44), `★最小 ${Math.min(...mins)}pt`);
  }
  // ★★操作は 下半分に
  {
    // ★★★字で 探して いました（「名簿に招く」）。
    //   ★★2026-09-18、★見本の 字（「＋ 招く」）に 合わせて 変えたら 落ちました。
    //   ★★★見張りが 古い 字を 抱えて いました。★字は 変わります。
    //     ★★変わらない のは「★`onInvite` の 札」で ある こと です。
    const inviteAt = raw.indexOf("{onInvite ? (");
    const halfway = raw.indexOf("list.map(");
    t(inviteAt > halfway, "★招く は、一覧の あとに ある（★下半分）");
  }

  console.log("\n=== ⑥ ％・連続日数を 出さない ===");
  ["％", "パーセント", "連続", "達成率", "順位", "平均"].forEach((w) => {
    t(!ui.includes(w), `★「${w}」を 出さない`);
  });
  {
    const shown = ui.replace(/`[^`]*%`/g, "").replace(/"\d+%"/g, "");
    t(!/%/.test(shown), "★読み手に ％を 見せない");
  }

  console.log("\n=== ⑦ 健康の 記録に たどりつけない（★見本⑦） ===");
  ["throatCondition", "voiceQuality", "sleepHours", "entries", "throat_symptoms", "ノート"]
    .forEach((w) => t(!ui.includes(w), `★「${w}」に 触れていない`));
  const imports = (ui.match(/^import[\s\S]*?from "[^"]+";/gm) || []).join("\n");
  ["VocalTracker", "HomeV2", "LookBackV2", "CompareV2", "CountV2"]
    .forEach((n) => t(!imports.includes(n), `★${n} を import して いない`));
  t(!/supabase|createClient/.test(ui), "★この画面じしんが データベースを 引かない");

  console.log("\n=== ⑧ お金は 責任者だけ（★§1-1） ===");
  t(/canSeeMoney \?/.test(ui), "★お金は、渡された ときだけ 出す");
  t(!/role === "owner"/.test(ui), "★役割の 判定を 画面で していない");
  {
    const vt = readCode("components", "VocalTracker.jsx");
    // ★★2026-09-11、★役職への 一本化の 3段目。
    //   ★役割（role）では なく、★できこと（gate）を 渡すように なりました。
    //   ★★見張るのは「lib に 尋ねている」ことです。★何を 渡すかでは ありません。
    t(/canSeeMoney=\{maySeeMoney\((role|gate)\)\}/.test(vt), "★呼ぶ側が lib に 尋ねている");
    // ★★★2026-09-18（★A2）、★受け皿（`|| role`）を 外しました。
    //   ★★きょうまで ──「役職が 無ければ、これまでどおり 役割で 分ける」。
    //     ★★切り替えた 日に 全員が タブを 失わない ため の 受け皿 でした。
    //   ★★台帳に 尋ねました ── ★落ちて いたのは **3人**、★どれも 試しの 口 です
    //     （はじめの1人テスト／実機テスト／teachertest の マイ教室）。
    //     ★★本当の お客さまは 1人も 落ちて いません。★受け皿は 役目を 終えました。
    //   ★★★いまの 決め ── ★役職が 無ければ、★運営の 画面に 入れません。
    //     ★★空の 運営画面を 出しません（★押せない 札を 置かない・§8⑤）。
    t(!/permsOfMember\(opsMembership, opsPostsById\) \|\| role/.test(vt),
      "★★受け皿（`|| role`）が 外れて いる");
    t(/const gate = permsOfMember\(opsMembership, opsPostsById\);/.test(vt),
      "★できこと だけ を 渡して いる");
  }

  console.log("\n=== 「席」と 呼ばない（★§10-1） ===");
  // ★★★2026-09-19 ── ★「出席」に 当たって 落ちました。
  //   ★★見本 `P_sonohito` の 字 ──「日程・出席・連絡が 届きます」。
  //   ★★★禁じて いるのは「席」＝ 人数の 言い方 です（★§10-1）。
  //     ★★「出席」は 別の 言葉 です。★レッスンに 来た こと です。
  //   ★★だから、★人数の 言い方に なる 形 だけ を 見ます。
  t(!/席数|空席|[0-9０-９]\s*席|席の 数/.test(raw),
    "★「席」と 呼んで いない（★名簿の人数）");
  t(!/(^|[^出欠])席[はをがのに]/.test(raw.replace(/出席|欠席/g, "")),
    "★「席」を 人数の 意味で 使って いない");
  t(!/席/.test(readRaw("lib", "orgRoster.js")) || /「席」とは 呼びません/.test(readRaw("lib", "orgRoster.js")),
    "★lib でも 使っていない（★注記で 断るのは 可）");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
