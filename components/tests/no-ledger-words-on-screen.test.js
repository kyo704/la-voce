// ============================================================================
// ★見張り ── ★画面に 台帳の 言葉を 出さない（★2026-09-18・実機で 見つけました）
//
//   ★★行事の 画面に、★こう 出て いました ──
//     ★「台帳に 列は あります（start_time / end_time）。
//       ★create_org_event が 受け取りません。」
//   ★★★大学の 方が ご覧に なる 画面 です。
//     ★★表の 名も、★関数の 名も、★列の 名も、★その方の お役に 立ちません。
//     ★★「こちらの 支度が まだ」と だけ お伝えします。
//
//   ★★★これは 1か所の 話では ありません。
//     ★★同じ 形が、★生徒を 招く 画面にも ありました。
//     ★★だから、★束（lib）の 中の「画面に 出す 字」を ぜんぶ 見ます。
//
//   ★★較正 ── ★わざと 1件 混ぜて、★見つかる ことを 確かめます。
// ============================================================================

const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadLib } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");

// ★★台帳の 言葉 ── ★画面に 出しては いけない もの。
const 禁じ手 = [
  "org_events", "teacher_invitations", "org_invitations", "enrollments",
  "memberships", "assignments", "org_posts", "org_billing", "monka_read_log",
  "create_org_event", "accept_teacher_invitation", "has_can",
  "start_time", "end_time", "target_group", "monka_teacher_id",
  "RESEND", "API_KEY", "SUPABASE", "RLS", "uuid", "null"
];

// ★★見る 束と、★その 中の「画面に 出す 字」の 置き場。
const 見る = [
  ["lib/orgEventForm.js", "NOT_YET", "say"],
  ["lib/studentInvite.js", "NOT_YET", "say"],
  ["lib/orgBilling.js", "MISSING_ROWS", "label"]
];

let 数 = 0;
function ok(cond, 名) {
  数 += 1;
  assert.ok(cond, "★落ちました ── " + 名);
  console.log("  ok  " + 名);
}

function 当たり(字) {
  return 禁じ手.filter((w) => String(字 || "").includes(w));
}

(async () => {
  // ★★較正 ── ★わざと 混ぜた ものを 見つけられるか。
  ok(当たり("create_org_event が 受け取りません").length > 0,
    "★較正 ── 台帳の 言葉を 見つけられる");
  ok(当たり("まだ お入れいただけません。").length === 0,
    "★較正 ── ふつうの 字を 誤って 拾わない");

  for (const [道, 束名, 欄] of 見る) {
    if (!fs.existsSync(path.join(ROOT, 道))) {
      console.error("★止まりました ── 束が ありません: " + 道);
      process.exit(1);
    }
    const M = await loadLib(道);
    const 並び = M[束名];
    assert.ok(Array.isArray(並び),
      "★止まりました ── " + 道 + " に " + 束名 + " が ありません。");
    並び.forEach((x) => {
      数 += 1;
      const 字 = x[欄];
      assert.ok(typeof 字 === "string" && 字.length > 0,
        "★落ちました ── " + 道 + " の " + (x.key || x.label) + " に 画面の 字が ありません");
      const 見つけた = 当たり(字);
      assert.ok(見つけた.length === 0,
        "★落ちました ── " + 道 + " の 画面の 字に 台帳の 言葉: " + 見つけた.join("、")
        + "\n　　" + 字);
    });
    console.log("  ok  " + 道 + " の " + 束名 + "（" + 並び.length + "件）");
  }

  console.log("\n★" + 数 + "件 通りました ── 画面に 台帳の 言葉を 出さない");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
