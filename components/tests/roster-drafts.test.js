#!/usr/bin/env node
// ============================================================================
// ★名簿の 下書き（★裁定 その109）の 見張り
//
//   ★★★裁定 その109 の `VERIFY` を、★そのまま 見張りに します。
//     Q1 学籍番号を 知って いる だけ では 紐付かない
//     Q2 招待を 送る 前なら 取り消せる
//     Q3 招待を 送った あとは 取り消せない
//     Q4 学生が `roster_drafts` を 1行も 引けない
//     Q5 1年 経った 下書きが 消えて いない
//
//   ★★較正 ── ★当たる はずの ものと、★当たらない はずの もので 試します。
// ============================================================================

const assert = require("assert");
const { readCode, readRaw, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "rosterDrafts.js");
  const vt = readCode("components", "VocalTracker.jsx");
  const ui = readCode("components", "OpsRosterDrafts.jsx");
  const imp = readCode("components", "OpsImport.jsx");
  const 紙 = readRaw("supabase", "migration_roster_drafts.sql");
  const 無註 = 紙.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");
  const 道 = readCode("app/api/enrollment/accept", "route.js");

  見る("Q1 学籍番号だけ では 紐付かない", () => {
    // ★★紐付けの 根拠は 招待の `draft_id` です。
    assert.ok(/add column if not exists draft_id/.test(無註), "★招待に 印が ありません");
    assert.ok(/invitation\.draft_id/.test(道), "★招待の 印で 結んで いません");
    assert.ok(/draft_id: draft\.id/.test(vt), "★招く ときに 印を 持たせて いません");
    // ★★★番号や お名前で 照らし合わせる 仕掛けが 1つも 無い こと。
    const 全 = vt + ui + imp + readCode("lib", "rosterDrafts.js");
    assert.ok(!/eq\("student_number"/.test(全), "★番号で 引き当てて います");
    assert.ok(!/linked_user_id[^\n]*student_number/.test(全), "★番号で 結んで います");
    // ★★結ぶ ところで 見て いるのは `id` だけ で ある こと。
    const i = 道.indexOf('from("roster_drafts")');
    const 中 = 道.slice(i, i + 420);
    assert.ok(/eq\("id", invitation\.draft_id\)/.test(中), "★印で 結んで いません");
    assert.ok(!/student_number|name/.test(中), "★ほかの ことで 結んで います");
    // ★★較正 ── ★番号は 出す ため に 使って いる こと（★使って いない のでは ない）。
    assert.ok(/student_number/.test(ui), "★番号を 出して いません");
  });

  見る("Q2 送る 前なら 取り消せる", () => {
    const 束 = [
      { id: "1", imported_at: "t", imported_by: "u" },
      { id: "2", imported_at: "t", imported_by: "u" }
    ];
    assert.strictEqual(m.mayUndo(束), true);
    assert.strictEqual(m.undoBlockedLine(束), "");
    // ★★束は「入れた 人と 入れた とき」で 決まります。
    const 混 = m.batchOf([...束, { id: "3", imported_at: "s", imported_by: "u" }], "t", "u");
    assert.strictEqual(混.length, 2, "★よその 束を 混ぜて います");
    // ★★1件も 無ければ 取り消せません。
    assert.strictEqual(m.mayUndo([]), false);
  });

  見る("Q3 送った あとは 取り消せない", () => {
    const 招 = [{ id: "1", imported_at: "t" }, { id: "2", invited_at: "2026-09-20" }];
    assert.strictEqual(m.mayUndo(招), false, "★送った あとに 取り消せます");
    assert.ok(m.undoBlockedLine(招).includes("お送りしました"), "★わけを 言いません");
    // ★★入られた あとも 取り消せません。
    const 結 = [{ id: "1" }, { id: "2", linked_user_id: "u9" }];
    assert.strictEqual(m.mayUndo(結), false);
    assert.ok(m.undoBlockedLine(結).includes("入って います"));
    // ★★台帳の 側でも 守ります（★画面 だけ で 止めません）。
    const i = vt.indexOf("async function handleUndoImport");
    const 中 = vt.slice(i, vt.indexOf("async function", i + 20));
    assert.ok(/\.is\("invited_at", null\)/.test(中), "★台帳の 側で 止めて いません");
    assert.ok(/\.is\("linked_user_id", null\)/.test(中), "★台帳の 側で 止めて いません");
    assert.ok(/mayUndoImport\(/.test(中), "★決めを 画面で 判じて います");
  });

  見る("Q4 学生は 1行も 引けない", () => {
    assert.ok(/revoke all on table public\.roster_drafts[^\n]*from public, anon, authenticated/
      .test(無註), "★先に 取り上げて いません");
    const 決 = /create policy roster_drafts_all[\s\S]*?with check \(([^)]*\))\)/.exec(無註);
    assert.ok(決, "★決まりが ありません");
    assert.ok(/for all using \(public\.has_can\(org_id, 'meibo'\)\)/.test(無註),
      "★門が ちがいます");
    assert.ok(/with check \(public\.has_can\(org_id, 'meibo'\)\)/.test(無註),
      "★書く ほうの 門が ありません");
    // ★★★`auth.uid() = ` で 学生に 開ける 穴が 無い こと。
    assert.ok(!/roster_drafts[\s\S]{0,400}auth\.uid\(\) = /.test(無註),
      "★ご本人にも 開いて います");
    // ★★画面も 門の 中だけ で 出して いる こと。
    assert.ok(/canOps\(gate, "meibo"\) && \(drafts \|\| \[\]\)\.length/.test(vt),
      "★画面が 門を 見て いません");
  });

  見る("Q5 1年 経っても 消えない", () => {
    const 古 = { id: "1", imported_at: "2025-01-01T00:00:00Z" };
    const 新 = { id: "2", imported_at: "2026-09-01T00:00:00Z" };
    const いま = "2026-09-20T00:00:00Z";
    assert.strictEqual(m.isOld(古, いま), true);
    assert.strictEqual(m.isOld(新, いま), false);
    // ★★★畳むだけ です。★一覧から 落ちますが、★手元には 残ります。
    assert.strictEqual(m.visibleDrafts([古, 新], いま).length, 1);
    assert.strictEqual(m.oldDrafts([古, 新], いま).length, 1);
    assert.ok(/oldDrafts\(/.test(ui), "★畳んだ ものを 出して いません");
    // ★★紐付いた ものは、★1年 経っても「古い」に しません。
    assert.strictEqual(m.isOld({ ...古, linked_user_id: "u" }, いま), false);
    // ★★★消すのは、★人が 押した ときだけ（★自動で 消す 仕掛けが 無い こと）。
    const 全 = vt + readCode("lib", "rosterDrafts.js") + ui;
    assert.ok(!/delete[\s\S]{0,120}imported_at[\s\S]{0,60}<|older_than|自動で 消/.test(全),
      "★自動で 消す 仕掛けが あります");
    const i = vt.indexOf("async function handleDeleteDraft");
    assert.ok(i > 0, "★消す 手が ありません");
  });

  見る("★招くのは 人が 押した ときだけ（★自動で 送らない）", () => {
    // ★★★裁定 その109 ── ★自動送信は しません。
    assert.ok(/<Ask/.test(ui), "★確かめて いません");
    assert.ok(m.INVITE_ASK_NOTE.includes("取り消せません"), "★取り消せない ことを 言いません");
    assert.ok(m.inviteAllAsk(12).includes("12人"), "★人数を 言いません");
    // ★★取り込みの 手が、★そのまま 招いて いない こと。
    const i = vt.indexOf("async function handleRunImport");
    // ★★★註を 目じるしに しません（★`readCode` は 註を 落として います）。
    //   ★★2026-09-20、★見つからず -1 に なり、★終わりまで 見て いました。
    const 中 = vt.slice(i, vt.indexOf("async function ", i + 20));
    assert.ok(!/handleInviteDraft/.test(中), "★取り込みで 送って います");
    assert.ok(!/teacher_invitations/.test(中), "★取り込みで 合言葉を 作って います");
  });

  見る("★取り込みで、★お名前・門下・役職を 動かさない", () => {
    const i = vt.indexOf("async function handleRunImport");
    // ★★★註を 目じるしに しません（★`readCode` は 註を 落として います）。
    //   ★★2026-09-20、★見つからず -1 に なり、★終わりまで 見て いました。
    const 中 = vt.slice(i, vt.indexOf("async function ", i + 20));
    assert.ok(!/from\("profiles"\)/.test(中), "★お名前を 書き換えて います");
    assert.ok(!/from\("assignments"\)/.test(中), "★門下を 動かして います");
    assert.ok(!/from\("memberships"\)/.test(中), "★役職を 動かして います");
    // ★★直すのは 2つ だけ。
    assert.ok(/直し\.student_number/.test(中) && /直し\.grade_label/.test(中));
    assert.ok(!/status:/.test(中), "★在籍の 様子まで 書き換えて います");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
