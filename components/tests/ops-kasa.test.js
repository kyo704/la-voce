#!/usr/bin/env node
// ============================================================================
// ★重なり（★見本 `P_kasa` ／ `P_kasaT` ／ `P_kasaFix`・裁定 その108 ③）の 見張り
//
//   ★★★裁定 その108 ──「`overlap_notices`、★3列 のみ」。
//     ★★だから、★列が 増えて いない ことを 見張ります。
//
//   ★★★確かめる こと
//     ①表は 3列 だけ（★`lesson_id` ／ `status` ／ `updated_at`）
//     ②重なり そのものを しまって いない（★コマから 数える）
//     ③姿は 3つ だけ。★全部の コマが そう の ときだけ 上がる
//     ④場所の 重なりも 数える（★きょうまで 先生 だけ でした）
//     ⑤先生には、★ご自分の ぶん だけ（★よその 重なりの 数も 出さない）
//     ⑥置いて いない 札を 出さない。★何を 置いて いないかを 書く
//     ⑦動かす 前に 一度 お尋ねする
//     ⑧書いた ものは 読まれて いる（★N-1）
//
//   ★★較正 ── ★当たる はずの ものと、★当たらない はずの もので 試します。
// ============================================================================

const assert = require("assert");
const { readCode, readRaw, loadLib } = require("./_source");
const fs = require("fs");
const path = require("path");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "opsKasa.js");
  const s = await loadLib("lib", "opsSchedule.js");
  const ui = readCode("components", "OpsKasa.jsx");
  const fix = readCode("components", "OpsKasaFix.jsx");
  const vt = readCode("components", "VocalTracker.jsx");
  const sql = readRaw("supabase", "migration_overlap_notices.sql");
  const 無註 = sql.split("\n").filter((l) => !/^\s*--/.test(l)).join("\n");

  見る("①表は 3列 だけ", () => {
    const 中 = /create table if not exists public\.overlap_notices \(([\s\S]*?)\n\);/
      .exec(無註);
    assert.ok(中, "★表を 作って いません");
    const 列 = 中[1].split("\n").map((l) => l.trim())
      .filter((l) => l && !/^(constraint|primary key|unique|check|foreign key)/i.test(l))
      .map((l) => l.split(/\s+/)[0]);
    assert.deepStrictEqual(列, ["lesson_id", "status", "updated_at"],
      "★3列で ありません: " + 列.join(","));
    // ★★較正 ── ★当たらない はずの 名。
    assert.ok(!列.includes("told_by"), "★較正が 効いて いません");
  });

  見る("②重なり そのものを しまって いない", () => {
    assert.ok(!/create table[^\n]*overlaps?\b/.test(無註), "★重なりの 表が あります");
    assert.ok(/overlapsOf/.test(vt), "★コマから 数えて いません");
    // ★★数える ところは 1か所（★2つ 作って いない）。
    const 蔵 = path.join(__dirname, "..", "..", "lib");
    const 数える = fs.readdirSync(蔵).filter((f) => f.endsWith(".js"))
      .filter((f) => /export function overlapsOf/
        .test(fs.readFileSync(path.join(蔵, f), "utf-8")));
    assert.deepStrictEqual(数える, ["opsSchedule.js"],
      "★数える ところが 2つ あります: " + 数える.join(","));
  });

  見る("③姿は 3つ。★全部の コマが そう の ときだけ 上がる", () => {
    assert.deepStrictEqual(m.KASA_STATES.slice(), ["まだ", "知らせた", "解決"]);
    // ★★台帳の `check` と 同じ 3つ か。
    m.KASA_STATES.forEach((v) => assert.ok(無註.includes(`'${v}'`), "★台帳に ない 姿: " + v));

    const 片方 = [{ lesson_id: "a", status: "知らせた" }];
    assert.strictEqual(m.statusOf(片方, ["a", "b"]), "まだ",
      "★片方 だけ で 上がって います");
    const 両方 = [{ lesson_id: "a", status: "知らせた" },
      { lesson_id: "b", status: "知らせた" }];
    assert.strictEqual(m.statusOf(両方, ["a", "b"]), "知らせた");
    const 片づけ = [{ lesson_id: "a", status: "解決" }, { lesson_id: "b", status: "解決" }];
    assert.strictEqual(m.statusOf(片づけ, ["a", "b"]), "解決");
    // ★★「解決」と「知らせた」が 混ざる ときは、★下 の ほう に します。
    assert.strictEqual(m.statusOf(
      [{ lesson_id: "a", status: "解決" }, { lesson_id: "b", status: "知らせた" }],
      ["a", "b"]), "知らせた");
    assert.strictEqual(m.statusOf([], ["a"]), "まだ", "★無ければ まだ");
  });

  見る("④場所の 重なりも 数える", () => {
    const L = [
      { id: "1", teacher_id: "t1", place_id: "p1", scheduled_at: "2026-09-21T10:00" },
      { id: "2", teacher_id: "t2", place_id: "p1", scheduled_at: "2026-09-21T10:00" },
      { id: "3", teacher_id: "t3", place_id: null, scheduled_at: "2026-09-21T11:00" },
      { id: "4", teacher_id: "t4", place_id: null, scheduled_at: "2026-09-21T11:00" }
    ];
    const ov = s.overlapsOf(L, "2026-09-21");
    assert.strictEqual(ov.length, 1, "★場所の 重なりを 数えて いません");
    assert.strictEqual(ov[0].kind, "場所");
    // ★★較正（★当たらない はず）── ★場所を 決めて いない コマ どうしは 重なりません。
    assert.ok(!ov.some((o) => o.lessons.some((l) => l.id === "3")),
      "★空の 場所を 同じ もの と 見て います");
  });

  見る("⑤先生には、★ご自分の ぶん だけ", () => {
    const 画面 = readRaw("components", "OpsSchedule.jsx");
    assert.ok(/数えるもと/.test(画面), "★出して いる ぶん から 数えて いません");
    assert.ok(/chipCount\(/.test(画面), "★数の 決めを 画面が 持って います");

    const 私の = [{ id: "a", teacher_id: "me", scheduled_at: "2026-09-21T10:00" }];
    const よその = { key: "先生:you@11:00", kind: "先生", at: "11:00",
      lessons: [{ id: "x", teacher_id: "you" }, { id: "y", teacher_id: "you" }] };
    assert.strictEqual(
      m.chipCount({ overlaps: [よその], notices: [], lessons: 私の, myId: "me", mine: true }),
      0, "★よその 重なりを 数えて います");
    // ★★事務が 知らせた ぶんは、★ご自分で 数えられなくても 出します。
    assert.strictEqual(
      m.chipCount({
        overlaps: [], notices: [{ lesson_id: "a", status: "知らせた" }],
        lessons: 私の, myId: "me", mine: true
      }), 1, "★知らせが 届いても 札が 出ません");
    // ★★片づいた ものは 出しません。
    assert.strictEqual(
      m.chipCount({
        overlaps: [], notices: [{ lesson_id: "a", status: "解決" }],
        lessons: 私の, myId: "me", mine: true
      }), 0, "★片づいた ものを 出して います");
    // ★★事務は その日の 重なりの 数 その まま。
    assert.strictEqual(
      m.chipCount({ overlaps: [よその], notices: [], lessons: [], myId: "x", mine: false }),
      1);
  });

  見る("⑥置いて いない 札を 出さない。★何を 置いて いないかを 書く", () => {
    // ★★★答えを しまう 列が ありません。★だから 札も 出しません。
    assert.ok(!/動かせません/.test(ui), "★しまえない 札を 出して います");
    assert.ok(!/事務に お願い/.test(ui), "★しまえない 札を 出して います");
    // ★★黙って 消して いない こと ── ★わけを 出して います。
    assert.ok(/KASA_NOT_YET/.test(ui), "★何を 置いて いないかを 書いて いません");
    const 鍵 = m.KASA_NOT_YET.map((x) => x.key);
    ["told_by", "closed_by", "teacher_answer", "other_side"].forEach((k) =>
      assert.ok(鍵.includes(k), "★書き残しが ありません: " + k));
    m.KASA_NOT_YET.forEach((x) => {
      assert.ok(x.why && x.needs, "★わけと、★要る ものが ありません: " + x.key);
    });
    // ★★引き金が コードに 埋まって いる こと。
    const 生 = readRaw("lib", "opsKasa.js");
    assert.ok(/08-27/.test(生), "★台帳の 番が ありません");
  });

  見る("⑦動かす 前に 一度 お尋ねする", () => {
    assert.ok(/<Ask/.test(fix), "★お尋ねして いません");
    assert.ok(/moveAsk\(/.test(fix), "★字を 画面で 作って います");
    assert.ok(m.MOVE_ASK_NOTE.includes("生徒"), "★相手にも 及ぶ ことを 書いて いません");
    // ★★押しただけ では 動かない、と 書いて ある こと。
    assert.ok(m.FIX_PICK_SUB.includes("押しただけでは 動きません"),
      "★押しただけ で 動く ように 読めます");
    // ★★枠は `openSlots` から（★2つ 作りません）。
    assert.ok(/openSlots/.test(readRaw("lib", "opsKasa.js")),
      "★枠を もう 1つ の やり方で 数えて います");
  });

  見る("⑧書いた ものは 読まれて いる（★N-1）", () => {
    ["OpsKasa", "OpsKasaFix"].forEach((名) =>
      assert.ok(new RegExp(`<${名}`).test(vt), "★置かれて いません: " + 名));
    ["handleKasaMark", "handleKasaMove", "handleKasaMoveRoom", "fetchKasaNotices"]
      .forEach((名) => {
        const n = (vt.match(new RegExp(名, "g")) || []).length;
        assert.ok(n >= 2, "★呼ばれて いません: " + 名);
      });
    // ★★書いた あと、★必ず 何行 変わったかを 見て いる こと。
    const 中 = vt.slice(vt.indexOf("async function handleKasaMark"),
      vt.indexOf("async function handleSetEnrollmentStatus"));
    const 書き = (中.match(/await supabase\.from\("(overlap_notices|lessons)"\)/g) || []).length;
    const 数え = (中.match(/data\.length === 0/g) || []).length;
    assert.ok(数え >= 3, "★0行でも 通って います: " + 書き + "／" + 数え);
  });

  見る("⑩コマを 動かすのは 道を 通す（★列を 渡さない）", () => {
    // ★★★`scheduled_at` を 列で 渡すと、★生徒 ご本人 も 自分の 時刻を 変えられます。
    //   ★★`lessons_student_notice` が「自分の 行」を 許して いるからです。
    assert.ok(/rpc\("move_lesson"/.test(vt), "★道を 通して いません");
    const 中 = vt.slice(vt.indexOf("async function handleKasaMove"),
      vt.indexOf("async function handleSetEnrollmentStatus"));
    assert.ok(!/from\("lessons"\)\s*\n?\s*\.update/.test(中), "★表を 直に 書いて います");
    const 紙 = readRaw("supabase", "migration_move_lesson.sql");
    assert.ok(/security definer/.test(紙), "★道に なって いません");
    assert.ok(/sched_all/.test(紙) && /sched_mine/.test(紙), "★門が ちがいます");
    assert.ok(/revoke all on function public\.move_lesson[^\n]*from public, anon/.test(紙),
      "★先に 取り上げて いません");
    // ★★較正 ── ★時刻と 場所 いがい を 書いて いない こと。
    const 体 = 紙.split("$$")[1] || "";
    ["attendance", "student_id", "teacher_id", "org_id ="].forEach((語) =>
      assert.ok(!new RegExp("set[\\s\\S]{0,120}" + 語).test(体), "★よその 列を 書いて います: " + 語));
  });

  見る("⑪レッスンの 列を 名ざしで 引く（★`*` を 使わない）", () => {
    // ★★★2026-09-20 の 実機 ── ★日程の 表が いつも 空 でした。
    //   ★★`lessons` は 列ごと の 渡し です。★渡して いない 列が 混ざると
    //     ★★**要求ごと** 落ちます。★0行では なく、★`data` が null に なります。
    //   ★★`place_id` `kind` を 足した 日から、★`select("*")` は 1度も 通って いません。
    assert.ok(!/from\("lessons"\)\.select\("\*"/.test(vt), "★`*` で 引いて います");
    assert.ok(/OPS_LESSON_COLUMNS/.test(vt), "★名ざしで 引いて いません");
    const shell = readCode("lib", "classroomShell.js");
    assert.ok(!/OPS_LESSON_COLUMNS[\s\S]{0,200}created_by/.test(shell),
      "★使わない 列を 引いて います");
    ["place_id", "kind"].forEach((列) =>
      assert.ok(new RegExp(列).test(shell.slice(shell.indexOf("OPS_LESSON_COLUMNS"))),
        "★足りない 列: " + 列));
    // ★★渡し（grant）も 一緒に 足して ある こと。
    const 渡し = readRaw("supabase", "migration_lessons_column_grant.sql");
    assert.ok(/grant select \(place_id, kind\) on table public\.lessons to authenticated/
      .test(渡し), "★渡しを 足して いません");
  });

  見る("⑫生徒の お名前を 読む 道が ある（★門は コマと 同じ）", () => {
    // ★★★`memberships` の 道 だけ では、★生徒は 1人も 返りません。
    //   ★★生徒は `enrollments` に 居ます。★2026-09-20 の 実機で 並びました。
    assert.ok(/rpc\("get_org_student_names"/.test(vt), "★生徒の 道を 通して いません");
    const 紙 = readRaw("supabase", "migration_org_student_names.sql");
    assert.ok(/security definer/.test(紙), "★道に なって いません");
    // ★★門は レッスンと 同じ もの（★2つの 決めを 作らない）。
    assert.ok(/can_view_ops_perm\(auth\.uid\(\), p_org_id, e\.student_id, 'sched_all'\)/
      .test(紙), "★門が ちがいます");
    assert.ok(/e\.status = 'active'/.test(紙), "★やめた 方も 返して います");
    assert.ok(/revoke all on function public\.get_org_student_names[^\n]*from public, anon/
      .test(紙), "★先に 取り上げて いません");
    // ★★返すのは お名前 だけ（★同じ 行に お薬・周期が あります）。
    const 体 = 紙.slice(紙.indexOf("returns table"), 紙.indexOf("$$", 紙.indexOf("as $$") + 6));
    ["allergies", "regular_medications", "is_under_18", "cycle", "vocal_profession"]
      .forEach((列) => assert.ok(!new RegExp(列).test(体), "★よその 列を 返して います: " + 列));
    // ★★空の お名前で 上書きしない こと。
    assert.ok(/n\.display_name\) \{[\s\S]{0,120}displayName: n\.display_name/.test(vt),
      "★空で 塗りつぶして います");
  });

  見る("⑬読めなかった ことを 画面に 出す", () => {
    // ★★★きょうまで、★読めなくても「この 日に コマは ありません」でした。
    //   ★★丸1日、★「置いて いない」のか「読めない」のか 分かりません でした。
    assert.ok(/error: lessonsError/.test(vt), "★引けたか どうかを 見て いません");
    assert.ok(/setOpsReadError\(readFailedLine\(lessonsError\)\)/.test(vt),
      "★わけを 出して いません");
    const 画面 = readRaw("components", "OpsSchedule.jsx");
    const i = 画面.indexOf("{readError ? (");
    const j = 画面.indexOf("isEmptyDay(lessons, dateISO)");
    assert.ok(i > 0 && j > i, "★読めなかった ときの ほうが 先で ありません");
  });

  見る("⑨しるしを 作らない（★読めない ときに 空を 埋めない）", () => {
    const 中 = vt.slice(vt.indexOf("async function fetchKasaNotices"),
      vt.indexOf("async function handleKasaMark"));
    assert.ok(/setKasaNotices\(\[\]\)/.test(中), "★空に して いません");
    assert.ok(/setKasaError/.test(中), "★読めなかった ことを 言って いません");
    assert.ok(!/status: "まだ"/.test(中), "★無い しるしを 作って います");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
