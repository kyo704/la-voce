// ============================================================================
// ★見張り ── ★生徒を 招く（★裁定 その82・2026-09-18）
//
//   ★★測る のは 5つ です。
//     ★一 ★講師の 招待を 流用して いない（★台帳が 別）
//     ★二 ★名簿から 招ける（★`onInvite` が 渡されて いる）
//     ★三 ★注記が 4行 そろって いる（★1行も 減らさない）
//     ★四 ★まだ 作って いない ものを、★押せない 札に して いない
//     ★五 ★合言葉は 8文字
// ============================================================================

const assert = require("assert");
const { readCode, readRaw, loadLib } = require("./_source");

let 数 = 0;
function ok(cond, 名) {
  数 += 1;
  assert.ok(cond, "★落ちました ── " + 名);
  console.log("  ok  " + 名);
}

(async () => {
  const S = await loadLib("lib", "studentInvite.js");
  const 本体 = readCode("components", "VocalTracker.jsx");
  const 名簿 = readCode("components", "OpsRoster.jsx");
  const 生名簿 = readRaw("components", "OpsRoster.jsx");

  // ------------------------------------------------------------------------
  // ★一 ★流用して いない
  // ------------------------------------------------------------------------
  const i = 本体.indexOf("async function handleInviteStudentToOrg");
  ok(i > 0, "生徒を 招く 道が ある");
  // ★★★1200字で 切って いました。★次の 関数まで 入り、
  //   ★★`ensureOwnOrg`（★別の 関数の もの）に 当たって 落ちました。
  //   ★★見るのは **この 関数の 中** だけ です。★次の `async function` の 手前 まで。
  const 次 = 本体.indexOf("async function", i + 10);
  const 中 = 本体.slice(i, 次 > 0 ? 次 : i + 1200);
  ok(/teacher_invitations/.test(中), "生徒の 台帳（teacher_invitations）に 入れて いる");
  ok(!/org_invitations/.test(中), "★講師の 台帳（org_invitations）を 使って いない");
  ok(/org_id: orgId/.test(中), "いま 開いて いる 学校に 招いて いる");
  ok(!/ensureOwnOrg/.test(中), "★ご自分の 教室では なく、★開いて いる 学校");

  // ------------------------------------------------------------------------
  // ★二 ★名簿から 招ける
  // ------------------------------------------------------------------------
  // ★★★2026-09-19 ── ★招く ときに 学年・学科を 決めて おけます。
  //   ★★`() =>` から `(決め) =>` に なりました。★字で 見て いたので 落ちました。
  ok(/onInvite=\{\(決め\) => handleInviteStudentToOrg\(opsOrgId, 決め\)\}/.test(本体),
    "名簿に onInvite を 渡して いる（★決めも 一緒に）");
  ok(/onInvite \? \(/.test(名簿), "渡されて はじめて 札を 出す");

  // ------------------------------------------------------------------------
  // ★三 ★注記は 4行
  // ------------------------------------------------------------------------
  ok(S.INVITE_NOTES.length === 4, "注記は 4行（いま " + S.INVITE_NOTES.length + "）");
  ["ご請求に 入りません", "同意は ご本人から", "18歳未満", "承知するまで"].forEach((語) => {
    数 += 1;
    assert.ok(S.INVITE_NOTES.some((x) => x.includes(語)),
      "★落ちました ── 注記から 消えて います: " + 語);
  });
  console.log("  ok  4行 とも、★言うべき ことを 言って いる");
  // ★★太い ところが 本文の 中に あるか（★字を 変えた 日の 落とし忘れを 止めます）。
  S.INVITE_NOTES_BOLD.forEach((b) => {
    数 += 1;
    assert.ok(S.INVITE_NOTES.some((x) => x.includes(b)),
      "★落ちました ── 太い 字が 本文に ありません: " + b);
  });
  console.log("  ok  太い 字が、★ぜんぶ 本文の 中に ある");
  ok(/INVITE_NOTES\.map/.test(名簿), "画面が 注記を 書き写して いない");

  // ------------------------------------------------------------------------
  // ★四 ★まだ の ものを、★押せない 札に して いない
  // ------------------------------------------------------------------------
  // ★★★数を 覚えません（★2026-09-20 に 落ちました ── ★「2つ 以上」と 書いて いました）。
  //   ★★できた ものを 外したら、★見張りが 落ちました。
  //   ★★★「まだ」は 減って いく もの です。★減った ことを 落ち と しません。
  //   ★★見るのは ── ★書いて ある ものに わけと 引き金が ある こと（下）と、
  //     ★★**できる ように なった ものが 残って いない** こと。
  ok(!S.NOT_YET.some((x) => x.key === "grade"),
    "★できた ものが「まだ」に 残って いない（学年・学科は 2026-09-19 に できました）");
  ok(S.NOT_YET.every((x) => x.label && x.say),
    "どれにも、★札の 名と 画面に 出す 字が ある");
  S.NOT_YET.forEach((x) => {
    数 += 1;
    assert.ok(x.why && x.needs,
      "★落ちました ── 「" + x.label + "」に わけか 引き金が ありません");
  });
  console.log("  ok  どれにも、★わけと 引き金が ある");
  // ★★メールの 口を 置いて いない（★外へ 送る 道が まだ ありません）。
  ok(!/type="email"|<textarea/.test(生名簿),
    "★メールの 口を 置いて いない（送る 道が まだ ありません）");
  ok(!/送る/.test(名簿.slice(名簿.indexOf("INVITE_HEAD") - 200, 名簿.indexOf("INVITE_HEAD") + 2000)),
    "★「送る」の 札を 置いて いない");

  // ------------------------------------------------------------------------
  // ★五 ★合言葉は 8文字
  // ------------------------------------------------------------------------
  ok(S.CODE_LENGTH === 8, "合言葉は 8文字（見本の とおり）");
  ok(S.looksLikeCode("ABCD2345") === true, "8文字は 通る");
  ok(S.looksLikeCode("ABC234") === false, "6文字は 通らない（★古い 版の 形）");
  const 作る = 本体.slice(本体.indexOf("handleInviteStudentToOrg"), 本体.indexOf("handleInviteStudentToOrg") + 900);
  ok(/length: 8/.test(作る), "作る ほうも 8文字");

  // ------------------------------------------------------------------------
  // ★六 ★画面に 台帳の 言葉を 出して いない（★2026-09-18・実機で 見つけました）
  // ------------------------------------------------------------------------
  //   ★★行事の 画面に、こう 出て いました ──
  //     ★「create_org_event が 受け取りません」「start_time / end_time」
  //   ★★★大学の 方が ご覧に なる 画面 です。
  //     ★★表の 名も、★関数の 名も、★その方の お役に 立ちません。
  const 禁じ手 = [
    "teacher_invitations", "org_events", "create_org_event",
    "start_time", "end_time", "target_group", "RESEND", "API_KEY", "坂本"
  ];
  S.NOT_YET.forEach((x) => {
    数 += 1;
    assert.ok(typeof x.say === "string" && x.say.length > 0,
      "★落ちました ── 画面に 出す 字（say）が ありません: " + x.label);
    const 当たり = 禁じ手.filter((w) => x.say.includes(w));
    assert.ok(当たり.length === 0,
      "★落ちました ── 画面の 字に 台帳の 言葉が あります: " + 当たり.join("、"));
  });
  console.log("  ok  画面の 字に、★台帳の 言葉が 1つも ない");
  ok(/x\.say/.test(readRaw("components", "OpsRoster.jsx")),
    "画面が say を 出して いる（why では ない）");

  console.log("\n★" + 数 + "件 通りました ── 生徒を 招く");
})().catch((e) => { console.error(e.message || e); process.exit(1); });
