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
  t(m.placeSubtitle({ kind: "大学", teacher: "斎藤 めぐみ", since: "2026年4月1日" })
    === "大学　／　斎藤 めぐみ 先生　／　2026年4月1日から", "★見本と 同じ 形");
  t(m.placeSubtitle({ kind: "大学" }) === "大学", "1つでも 出る");
  t(m.placeSubtitle({}) === "", "★何も 無ければ 空（★「不明」と 書かない）");
  t(m.placeSubtitle({ teacher: "鈴木" }) === "鈴木 先生", "先生だけ でも 出る");
  t(m.joinedLabel("2026-04-01T00:00:00Z") === "2026年4月1日", "日付の 形");
  t(m.joinedLabel(null) === null, "★無ければ null（★きょうで 埋めない）");
  t(m.joinedLabel("こわれた") === null, "★読めなければ null");

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

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
