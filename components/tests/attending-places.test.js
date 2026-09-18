#!/usr/bin/env node

// ============================================================================
// ★通っている ところ（★見本 `SC['通っているところ']`／★裁定その68）
//
//   ★★この 見張りの 芯は、★**列の 名**です。
//
//     ★★2026-09-16、★私は `enrollment.joined_at` を 読む コードを 書きました。
//       ★★そんな 列は ありません。★正しくは `enrolled_at` です。
//       ★★画面は 壊れません でした ── ★無い ものは 飛ばす 作りな ので、
//         ★添え字が **空**に なって いた だけ です。
//       ★★壊れて いれば 気づけます。★空は 気づけません。
//     ★★だから、★台帳に 在る 列だけ を 使って いるかを 見ます。
//
//   ★★列は 台帳で 確かめた ものです（★2026-09-16）──
//     enrollments … id / org_id / student_id / status / enrolled_at / left_at / grade_label
//     organizations … id / name / kind / created_by / created_at
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  for (const f of ["lib/attendingPlaces.js", "components/VocalTracker.jsx"]) {
    if (!fs.existsSync(path.join(ROOT, f))) {
      console.log("★★ありません: " + f);
      console.log("　★数えません。★止まります。");
      process.exit(1);
    }
  }
  const src = fs.readFileSync(path.join(ROOT, "lib/attendingPlaces.js"), "utf8");
  const m = await import("data:text/javascript;base64,"
    + Buffer.from(src, "utf8").toString("base64"));
  const vt = readRaw("components", "VocalTracker.jsx");
  const vtCode = readCode("components", "VocalTracker.jsx");

  // ★★画面の かたまり だけ を 見ます。★ほかの 画面の 字を 拾わない ため。
  const at = vt.indexOf('data-v2-attending="1"');
  const blk = at < 0 ? "" : vt.slice(Math.max(0, at - 1200), at + 4200);

  console.log("① ★台帳に 在る 列だけ を 使って いること");
  const ENROLL = ["id", "org_id", "student_id", "status", "enrolled_at",
    "left_at", "grade_label"];
  const ORG = ["id", "name", "kind", "created_by", "created_at"];
  t(/en\.enrolled_at/.test(blk), "★`enrolled_at` を 読んで いる");
  t(!/en\.joined_at/.test(vtCode), "★★`joined_at` を 読んで いない（★無い 列）");
  t(!/\.joined_at/.test(vtCode), "★どこでも `joined_at` を 読んで いない");
  // ★★`en.○○` の 形を 拾い、★一覧に 無い ものが あれば 教えます。
  const used = [...blk.matchAll(/\ben\.([a-z_]+)/g)].map((x) => x[1]);
  const strange = [...new Set(used)].filter((k) => !ENROLL.includes(k) && k !== "org");
  t(strange.length === 0, "★在籍に 無い 列を 読んで いない"
    + (strange.length ? "（★" + strange.join(", ") + "）" : ""));
  const usedOrg = [...blk.matchAll(/en\.org(?:\s*&&\s*en\.org)?\.([a-z_]+)/g)].map((x) => x[1]);
  const strangeOrg = [...new Set(usedOrg)].filter((k) => !ORG.includes(k));
  t(strangeOrg.length === 0, "★教室に 無い 列を 読んで いない"
    + (strangeOrg.length ? "（★" + strangeOrg.join(", ") + "）" : ""));
  // ★★引く ときに `kind` を 頼んで いる こと。★頼まなければ 空の ままです。
  t(/select\("id, name, kind"\)/.test(vtCode), "★★`kind` を 引いて いる");

  console.log("\n② 添え字（★読めない ところは 飛ばす）");
  // ★★★教室の 種類は 出さなく なりました（★Opus の 裁定・2026-09-16）。
  //   ★★台帳は solo 19件／studio 0件。★19件とも 同じ 値 です。
  //   ★★出しても、★全員に 同じ 字が 並ぶ だけ で、★何も 伝えて いません。
  t(m.placeSubtitle({ teacher: "斎藤 めぐみ", since: "2026年4月1日" })
    === "斎藤 めぐみ 先生　／　2026年4月1日から", "★見本と 同じ 形（★種類は 出さない）");
  t(m.placeSubtitle({ since: "2026年4月1日" }) === "2026年4月1日から", "1つでも 出る");
  t(m.placeSubtitle({ kind: "大学" }) === "", "★★種類だけ では 何も 出ない");
  t(m.placeSubtitle({}) === "", "★何も 無ければ 空（★「不明」と 書かない）");
  t(m.placeSubtitle({ teacher: "鈴木" }) === "鈴木 先生", "先生だけ でも 出る");
  t(m.joinedLabel("2026-04-01T00:00:00Z") === "2026年4月1日", "日付の 形");
  t(m.joinedLabel(null) === null, "★無ければ null（★きょうで 埋めない）");
  t(m.joinedLabel("こわれた") === null, "★読めなければ null");

  console.log("\n②-2 ★内側の 合図を、そのまま 出さないこと");
  // ★★2026-09-16、★画面に `solo` と 出て いました。★利用者に 通じません。
  //   ★★`kind` は 内側の 合図 です。★見本の 字は「大学」「音楽教室」── 日本語 です。
  //   ★★知らない 値は 出しません。★埋めも しません
  //     （★「その他」と 書くと、★分かって いない ことが 隠れます）。
  // ★★★`kind` は、★画面に 1つも 出しません（★裁定・2026-09-16）。
  //   ★★はじめ、★生の `solo` が 出て いました。★通じません でした。
  //   ★★つぎに「知らない 値は 出さない」に しました。
  //   ★★そして 裁定で ── ★**種類は 出さない**。★教室名 だけ。
  //     ★★決め打ちで「個人レッスン」と 書くと、★こちらが 名乗り方を 決めます。
  //       ★★声優養成所・合唱団が 入って きた とき、★誤りに なります。
  t(!/kindLabel\(/.test(blk), "★★画面が 種類を 出して いない");
  t(!/kind:/.test(blk), "★種類を 渡して いない");
  t(!/en\.org\.kind/.test(blk), "★生の 合図を 読んで いない");

  console.log("\n③ さがす 口を 作って いないこと（★見本の 決め）");
  // ★★「こちらから 教室を さがす ことは できません」── ★注記の 1行目 です。
  //   ★★さがせると、★誰が どこに 通って いるかが 分かります。
  t(!/organizations[\s\S]{0,80}\.ilike\(/.test(vtCode), "★教室を 名前で 探して いない");
  t(!/organizations[\s\S]{0,80}\.textSearch\(/.test(vtCode), "★全文 検索を して いない");
  t(m.ATTENDING_NOTE[0].includes("さがすことは できません"), "★注記に 書いて ある");

  console.log("\n④ 数え方（★0を 責めない）");
  t(/myEnrollments\.length > 0 \?/.test(blk), "★0の ときは 札を 出さない");
  const mm = readCode("lib", "moreMenu.js");
  t(/orgCount > 0 \?/.test(mm), "★もっとの 行も、0の ときは 数を 出さない");

  console.log("\n⑤ 招かれて いる ところを、置いて いないこと");
  // ★★お決め ㋑（★2026-09-16）。★「誰あて」の 中身が 台帳に ありません。
  //   ★★押せない 札を 置きません。★作る までは 行ごと 出しません。
  // ★★「無いこと」は、★注記を 外した 本文で 数えます。
  //   ★★私の 覚え書きに「招かれて いる ところ の 行は 置いて いません」と
  //     ★書いて あります。★生の 本文で 見ると、★それを 拾って しまいます。
  //   ★★見張りの 見張り（`_meta-absence-checks`）が、★きょう 2度目に 教えました。
  t(!/招かれている ところ/.test(vtCode), "★★行を 置いて いない");
  const ex = JSON.parse(fs.readFileSync(path.join(ROOT, "tools/excluded_by_design.json"), "utf8"));
  const rows = ex["通っているところ"] || [];
  t(rows.some((r) => String(r.text).includes("招かれている")),
    "★台帳（3つめの組）に 登録して ある");
  t(rows.every((r) => r.trigger), "★引き金が 書いて ある");

  console.log("\n⑥ 中身の 1枚（★見本 `SC['通っているところの中身']`）");
  t(m.SEE_YES.length === 6, "★見える もの 6つ");
  t(m.SEE_NO.length === 7, "★見えない もの 7つ");
  t(m.SEE_NO.includes("声と からだの 記録"), "★声と からだの 記録は **見えない** 側");
  t(m.SEE_NO.includes("ほかの 教室に 通っていること そのもの"),
    "★★ほかの 教室に 通って いる ことも 見えない");
  t(m.SEE_YES.includes("あなたが「あき」と 入れた 時間（あきか どうかだけ）"),
    "★あきか どうか **だけ** が 見える");
  t(!m.SEE_YES.some((x) => x.includes("時間割の 中身")),
    "★★時間割の 中身は 見える 側に **入って いない**");
  const inside = vt.indexOf('data-v2-inside="1"');
  t(inside > 0, "中身の 1枚が ある");
  // ★★★窓を 3000字 と 決め打ちに して いました（★2026-09-19 に 落ちました）。
  //   ★★中身の 1枚に 出席の 分母を 足したら、★下の 3行が 窓の 外に 出ました。
  //   ★★★見張りが 数えるのは、★**その 1枚の 終わり まで** です。
  //     ★★次の 1枚（`data-v2-plan`）が 始まる ところ で 切ります。
  //     ★★字数では ありません。★形で 切ります。
  const 次 = vt.indexOf('data-v2-', inside + 10);
  const ib = inside < 0 ? "" : vt.slice(inside, 次 > 0 ? 次 : vt.length);
  // ★★★2026-09-19、★「見えないもの」の 一覧を 外しました（★裁定 その90 §6-6）。
  //   ★★坂本さんの お言葉 ──
  //     ★「見えなければ、★何が 見えないかを 知る 必要は ありません」
  //   ★★★合言葉で 入る 画面の ほうは **残って います**（★`passcode-join` が 見ます）。
  //     ★★あちらは 入る 前 です。★何に 同意するかを 決める 材料 です。
  //     ★★こちらは 入った あと です。★役目が ちがいます。
  t(/SEE_YES\.map/.test(ib), "★見える ものは 出して いる");
  t(!/SEE_NO\.map/.test(ib), "★見えない ものの 一覧は 出して いない");
  // ★★★字 そのものは 消して いない こと（★入る 前の 画面が 読みます）。
  t(m.SEE_NO.length === 7, "★字は 残って いる（★入る 前の 画面の ため）");
  // ★★代わりに 出席が 出て いる こと（★裁定 その90 §6-5）。
  t(/ATTEND_HEAD/.test(ib), "★出席を 出して いる");
  t(/ATTEND_OTHERS_LINE/.test(ib), "★ほかの 方は 見えない、と 書いて いる");
  t(/NO_RATE_LINE/.test(ib), "★率を 出さない、と 書いて いる");
  t(/en\.enrolled_at/.test(ib), "★入った日を 出して いる");
  t(/teacher \? <Li/.test(ib), "★★担当が 無い ときは 行ごと 出さない");

  console.log("\n⑦ やめる の 1枚（★裁定その54 の 字）");
  t(m.LEAVE_LINES.some((x) => x.includes("1つも 消えません")),
    "★記録は 消えない、と 言って いる");
  // ★★見本の 字 ──「調べるが この教室の 束で ついていた場合は、止まります」。
  //   ★★裁定その54 で、★束は もう ありません。★そのままだと 事実と ちがいます。
  t(!m.LEAVE_LINES.some((x) => x.includes("束")), "★★「束」と 言って いない");
  t(m.LEAVE_LINES.some((x) => x.includes("ご自分で お選びいただく")),
    "★裁定その54 の 字に なって いる");
  t(m.leaveTitle("○○音楽大学") === "○○音楽大学 を やめる", "題の 形");
  const lv = vt.indexOf('data-v2-leave="1"');
  t(lv > 0, "やめる の 1枚が ある");
  const lb = lv < 0 ? "" : vt.slice(lv, lv + 2000);
  // ★★戻せない ほうを、★先に 置きません。★「やめない」が 先 です（★見本）。
  t(lb.indexOf("LEAVE_CANCEL") > 0 && lb.indexOf("LEAVE_CANCEL") < lb.indexOf("LEAVE_CONFIRM"),
    "★★「やめない」が 先");
  t(/Btn ghost onClick=\{\(\) => setAttendingLeaving\(false\)\}/.test(lb),
    "★「やめない」は 枠（★塗りに しない）");
  // ★★行を 消しません。★`left` に します。★また 入れる ためです。
  // ★★2026-09-16、★この 決まりは **台帳の 関数**に 移りました。
  //   ★★画面が `enrollments` を 直に 書くのを やめた ため です
  //     （★RLS は 行に 効き、★列には 効かない ── ★Opus の 裁定）。
  //   ★★字は `supabase/migration_leave_enrollment.sql` に あります。
  t(/status = 'left'/.test(
      require("fs").readFileSync(
        require("path").join(__dirname, "..", "..",
          "supabase", "migration_leave_enrollment.sql"), "utf8")),
    "★行を 消さず left に して いる（★台帳の 関数の 中）");
  t(!/\.from\("enrollments"\)[\s\S]{0,60}\.delete\(/.test(vtCode),
    "★★在籍の 行を 消して いない");
  // ★★画面が 確かめ です。★窓を 重ねません。
  t(/async function leaveOrgNow/.test(vtCode), "★窓を 出さない 手が ある");
  // ★★★何行 直したかを 見る こと（★2026-09-16・実機の ご報告）。
  //   ★★`.select()` を 付けないと、★**0行に 当たっても 成功に 見えます**。
  //     ★★決まり（RLS）が 書き換えを 許して いない とき、
  //       ★PostgREST は 誤りを 返さず、★「0行 直した」と 返します。
  //   ★★実機で そう なりました ── ★やめた はずの 教室が 一覧に 残って いました。
  //   ★★きょう 何度も 見た 形 です ── ★「無い」と「書けない」を 同じに して しまう。
  const lo = vtCode.indexOf("async function leaveOrgNow");
  const loEnd = vtCode.indexOf("async function", lo + 10);
  const loBlk = vtCode.slice(lo, loEnd > 0 ? loEnd : lo + 900);
  t(/rpc\(\s*"leave_enrollment"/.test(loBlk),
    "★★台帳の 関数を 呼んで いる（★画面から 直に 書かない）");
  t(/if\s*\(\s*!data\s*\)/.test(loBlk), "★0行なら 失敗に して いる");
  t(/return false/.test(loBlk), "★失敗を 返して いる");
  // ★★黙って 一覧へ 戻しません。★やめた つもりに させない ため。
  t(/setLeaveFailed\(true\)/.test(vtCode), "★★できなかった ことを 画面に 出す");
  // ★★★窓の 幅を 決め打ちに しません（★きょう 2度目 です）。
  //   ★★700字に すると、★すぐ 次の `handleLeaveOrg` まで 届きます。
  //     ★★あちらは 門の 外の 道 で、★`window.confirm` を 出します。
  //     ★★別の 手の 中身を、★この 手の ものとして 読んで いました。
  //   ★★次の 手が 始まる ところ まで を 見ます。
  const ln = vtCode.indexOf("async function leaveOrgNow");
  const lnEnd = vtCode.indexOf("async function", ln + 10);
  t(!/window\.confirm/.test(vtCode.slice(ln, lnEnd > 0 ? lnEnd : ln + 700)),
    "★★やめる の 手は 窓を 出さない（★画面が 確かめ）");

  // ==========================================================================
  // ★分母（★裁定 その92・2026-09-19）
  //
  //   ★★★学生も 型（`lesson_presets`）を 読める ように しました。
  //     ★★けれど、★どの 型が ご自分の ものかは 分かりません ──
  //       ★★型と 先生の 結びつき（`lesson_preset_targets`）は お見せしません。
  //     ★★★だから 型が **1つ の とき だけ** 分母を 出します。
  //   ★★ここは 数え直します。★測った 数を 写しません。
  // ==========================================================================
  const 型 = (n, org) => Array.from({ length: n }, (_, i) =>
    ({ id: "p" + i, org_id: org, name: "型" + i, total_count: 30 + i }));

  t(m.totalForStudent(型(1, "A"), "A") === 30, "★型が 1つ ── ★分母を 出す");
  t(m.totalForStudent(型(2, "A"), "A") === null, "★型が 2つ ── ★分母を 出さない");
  t(m.totalForStudent([], "A") === null, "★型が 無い ── ★分母を 出さない");
  t(m.totalForStudent(型(1, "B"), "A") === null, "★よその 学校の 型は 使わない");
  t(m.totalForStudent(型(1, "A"), null) === null, "★学校が 決まって いない ── ★出さない");
  t(m.totalForStudent([{ org_id: "A", total_count: 0 }], "A") === null,
    "★回数が 0 ── ★出さない（★分母に なりません）");
  t(m.totalForStudent([{ org_id: "A", total_count: null }], "A") === null,
    "★回数が 空 ── ★出さない（★`Number(null)` は 0 です）");

  // ★★★2026-09-19（★裁定 その93）── ★表を 直に 読むのを やめました。
  //   ★★列を 頼まない だけ では 足りません。★頼めば 渡ります。
  //     ★★決まり（RLS）は **行** を 選びます。★**列** は 選びません。
  //   ★★★読み道（`get_lesson_preset_for_student`）は、
  //     ★★`name` と `total_count` の 2つ **しか** 返しません。
  const 殻頭 = vtCode.indexOf("const [attendingPresets");
  t(殻頭 > 0, "★学生の 殻が ある");
  const 型読み = vtCode.slice(殻頭, vtCode.indexOf("[layoutV2, attendingOrgId]", 殻頭) + 30);
  t(/rpc\("get_lesson_preset_for_student"/.test(型読み), "★読み道を 通して いる");
  t(/p_org_id/.test(型読み), "★学校を 1つ 渡して いる");
  t(!/from\("lesson_presets"\)/.test(型読み), "★★表を 直に 読んで いない");
  t(!/note/.test(型読み), "★`note` を 触って いない");
  t(!/need_count/.test(型読み), "★`need_count` を 触って いない");

  // ★★★較正 ── ★わざと 外した 字で、★この 見張りが 動く ことを 確かめます。
  t(/note/.test('rpc("x", { p_org_id: id, note: 1 })'),
    "★道具の 較正（★`note` 入りを 見つけられる）");

  // ★★画面に 出て いる こと。★言葉は `lib/` が 持ちます。
  t(/totalForStudent/.test(vtCode), "★画面が 分母の 決めを 呼んで いる");
  t(/progressWord\(heldCount\(/.test(vtCode), "★行われた 回数で 出して いる");
  t(/SO_FAR_LABEL/.test(vtCode), "★札の 字を `lib/` から 取って いる");
  t(!/12回目/.test(vtCode), "★★数を 画面に 書き込んで いない");

  // ★★率を 作れる 形に しない。
  t(/NO_RATE_LINE/.test(vtCode), "★率を 出さない と 書いて ある");
  // ★★★禁じた 字は、★註を 外した もとで 探します（★蔵の 決め）。
  //   ★★註に「率では ありません」と 書いて あるので、
  //     ★★外さずに 探すと、★自分の 説明に 当たって 落ちます。
  const 素 = readCode("lib", "attendingPlaces.js");
  t(!/％/.test(素) && !/パーセント/.test(素), "★もとに 率の 字が ない");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
