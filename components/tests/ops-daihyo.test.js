#!/usr/bin/env node
// ============================================================================
// ★代表を 決める（★見本 `P_daihyo`）の 見張り
//
//   ★★★確かめる こと
//     ①2人まで（★画面は 早く 断る。★正は 台帳）
//     ②外す のは いつでも できる
//     ③押せない 札を 置かない ── ★3人目は 押せず、★わけが 出る
//     ④できる こと 8行（★できない ものを 隠さない）
//     ⑤但し書き 3つ（★役職の 外・先生だけ・中身は 見えない）
//     ⑥書く道は 台帳の 読み道（★`assignments` を 直に 書かない）
//     ⑦0行 返ったら 手もとを 書き換えない
//
//   ★★較正 ── ★当たり（0人・1人）と 外れ（2人）で 試します。
// ============================================================================

const assert = require("assert");
const { readCode, loadLib, readRaw} = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "opsDaihyo.js");
  const ui = readCode("components", "OpsDaihyo.jsx");
  const vt = readCode("components", "VocalTracker.jsx");
  const 行 = (n, 代表) => Array.from({ length: n }, (_, i) => ({
    studentId: "S" + i, assignmentId: "A" + i, name: "な" + i,
    isRepresentative: i < 代表
  }));

  見る("較正 ── ★数えられて いる", () => {
    assert.strictEqual(m.countOf(行(3, 0)), 0);
    assert.strictEqual(m.countOf(行(3, 2)), 2);
    assert.strictEqual(m.countOf(null), 0);
  });

  見る("①2人まで", () => {
    assert.strictEqual(m.MAX, 2);
    assert.strictEqual(m.mayToggle(行(3, 0), "S2"), true, "★0人の ときに 押せません");
    assert.strictEqual(m.mayToggle(行(3, 1), "S2"), true, "★1人の ときに 押せません");
    assert.strictEqual(m.mayToggle(行(3, 2), "S2"), false, "★3人目が 押せます");
  });

  見る("②外す のは いつでも できる", () => {
    assert.strictEqual(m.mayToggle(行(3, 2), "S0"), true, "★外せません");
  });

  見る("③押せない ときは わけが 出る", () => {
    assert.strictEqual(m.whyCannot(行(3, 2), "S2"), m.FULL_LINE);
    assert.strictEqual(m.whyCannot(行(3, 1), "S2"), "");
    assert.ok(/2人までです/.test(m.FULL_LINE));
    assert.ok(/whyCannot/.test(ui), "★画面が 出して いません");
    assert.ok(/mayToggle/.test(ui), "★画面が 判じて いません");
  });

  見る("④できる こと 8行", () => {
    assert.strictEqual(m.CAN_DO.length, 8);
    // ★★2026-09-24・裁定190 ── ★数を 覚えるのを やめました。
    //   ★★「できる 4つ／できない 4つ」と 数で 縛って いました。
    //     ★★裁定190 で 1つが `ok: false` に 移り、★この 行が 先に 落ちました。
    //     ★★落ちる べきは「中身が ちがう」ほう です。★数では ありません。
    //   ★★★裁定190 §2 の とおりに、★1行ずつ 見ます。
    const 表 = new Map(m.CAN_DO.map((x) => [x.label, x.ok]));
    const 見立 = [
      ["門下の 連絡に「重要」を 付ける", true],      // ★§2 ②
      ["門下の 投稿を 消す", true],                  // ★§2 ②
      ["時間割の 集まりを 見る", true],              // ★§2 ①（★sql/75 で 道が 出来ました）
      ["出して いない人に 1回だけ 知らせる", false], // ★§2 ✕ 催促を 送る
      ["ほかの人の 時間割の 中身を 見る", false],    // ★§2 ✕ 中身
      ["ほかの人の 空きコマを 見る", false],
      ["予定を 決める", false],
      ["生徒の 記録を 見る", false]                  // ★§2 ✕ 体調
    ];
    見立.forEach(([l, v]) => {
      assert.ok(表.has(l), "★" + l + " が ありません");
      assert.strictEqual(表.get(l), v,
        "★" + l + " は " + (v ? "できます" : "できません") + " の はず です（★裁定190 §2）");
    });
    const 字 = m.CAN_DO.map((x) => x.label).join("／");
    ["時間割の 中身", "空きコマ", "生徒の 記録"].forEach((v) =>
      assert.ok(字.includes(v), "★" + v + " が ありません"));
    assert.ok(/CAN_DO/.test(ui), "★画面が 出して いません");
  });

  見る("⑤但し書き 3つ", () => {
    assert.strictEqual(m.NOTES.length, 3);
    assert.ok(m.NOTES.join("").includes("役職の 仕組みの 外"));
    assert.ok(m.NOTES.join("").includes("中身は 見えません"));
  });

  見る("⑥書く道は 台帳の 読み道", () => {
    assert.ok(/rpc\("set_monka_representative"/.test(vt), "★読み道を 呼んで いません");
    // ★★★`is_representative` を 直に 書いて いない こと。
    //   ★★`ended_at` の 更新は 別 です ── ★そちらは 権限が あります
    //     （★担当を 終える 道・13708行）。★ひとまとめに 禁じません。
    assert.ok(!/\.update\(\{[^}]*is_representative/.test(vt),
      "★代表の 列を 直に 書いて います");
  });

  見る("⑦0行 返ったら 書き換えない", () => {
    assert.ok(/data\.length === 0\)\s*\{\s*\n?\s*throw/.test(vt)
      || /!Array\.isArray\(data\) \|\| data\.length === 0/.test(vt),
      "★0行を 成功に して います");
    assert.strictEqual(m.applyResult(行(2, 0), []), null, "★空でも 書き換えて います");
    // ★★当たり ── ★返り が あれば 揃います。
    const 後 = m.applyResult(行(2, 0),
      [{ student_id: "S1", is_representative: true }]);
    assert.strictEqual(後[1].isRepresentative, true);
  });

  見る("⑧入口が ある（★N-1）", () => {
    assert.ok(/<OpsDaihyo/.test(vt), "★置いて いません");
    assert.ok(/onGoDaihyo=/.test(vt), "★入口が ありません");
    assert.ok(/onGoDaihyo/.test(readCode("components", "OpsMonka.jsx")),
      "★一覧に 札が ありません");
  });

  // -------------------------------------------------------------------------
  // ★⑨「できます」と 書いた ことが、★台帳の 道でも できるか（★2026-09-24）
  //
  //   ★★段3a A群で 見つけました。★見本 `SC['集まり具合']` を 探して いて、
  //     ★画面が 無い ことに 気づき、★道を 読みに 行きました。
  //   ★★★`CAN_DO` の 2行が、★いま できません ──
  //     ★`get_timetable_submitted` は has_can('meibo') か 担当の 先生 だけ。
  //       ★★代表（学生）は **0行** です。★誤りにも なりません。★黙って 空 です。
  //     ★`nudge_timetable` は has_can('meibo') が 無ければ 弾きます。
  //   ★★字は 変えません ── ★裁定と ぶつかります。★見張りが 覚えて います。
  //     ★直った 日に、★この 見張りが 静かに なります。
  //     `docs/ledgers/08-保留している決め.md`
  // -------------------------------------------------------------------------
  見る("⑨『できます』が、★道でも できるか", () => {
    const f2 = readRaw("supabase", "migrations", "20260101000006_base_06_functions_2.sql");
    const f3 = readRaw("supabase", "migrations", "20260101000007_base_07_functions_3.sql");
    const 見 = (本, 名) => {
      const i = 本.indexOf("FUNCTION public." + 名);
      assert.ok(i > 0, "★較正 ── ★" + 名 + " が 読めて いません");
      return 本.slice(i, 本.indexOf("$function$;", i));
    };
    const 集 = 見(f2, "get_timetable_submitted");
    const 知 = 見(f3, "nudge_timetable");
    // ★★★2026-09-24・裁定190 ── ★代表の 道は **別の 関数** に なりました。
    //   ★★`get_timetable_submitted` は 変えません（★先生・事務に 効く ため）。
    //   ★★代わりに `rep_timetable_submitted` を 見ます。
    const 代 = readRaw("supabase", "migrations_pending",
      "20260924_75_rep_submitted.sql");
    const 集が代表を見る = /is_representative/.test(代)
      && /rep_timetable_submitted/.test(代);
    const 知が代表を見る = /monka_representative|is_representative/.test(知);
    // ★★★既存の 2本は 変わって いない こと（★裁定190 §4）。
    assert.ok(!/is_representative/.test(集), "★古い 関数を 広げて います");
    assert.ok(!/is_representative/.test(知), "★知らせの 関数を 広げて います");
    // ★★★代表の 道が、★同じ 門下だけ／真偽だけ で ある こと。
    assert.ok(/a2\.teacher_id = me\.teacher_id/.test(代), "★同じ 門下に 絞って いません");
    assert.ok(/returns table\(student_id uuid, submitted boolean\)/.test(代),
      "★返す 列が ちがいます（★名前や 中身を 返して います）");
    assert.ok(/revoke all on function public\.rep_timetable_submitted\(uuid\) from public, anon/.test(代),
      "★だれにでも 開いて います");
    const 約 = m.CAN_DO.filter((c) => c.ok).map((c) => c.label);
    const ずれ = [];
    // ★★鍵は `CAN_DO` の 字 そのもの です。★写しを 作りません ──
    //   ★字が 変われば 鍵も 変わり、★宣言が 外れて 落ちます。★それで 正しい。
    const 当 = (正規) => 約.find((l) => 正規.test(l)) || "";
    const 集約 = 当(/時間割の 集まりを 見る/);
    if (集約 && !集が代表を見る) {
      ずれ.push(集約 + " ── get_timetable_submitted は 代表を 見て いません");
    }
    const 知約 = 当(/1回だけ 知らせる/);
    if (知約 && !知が代表を見る) {
      ずれ.push(知約 + " ── nudge_timetable は has_can('meibo') だけ です");
    }
    // ★★直し方は 2つ あり、★どちらも 決めごと です。★だから ここでは 決めません。
    //   ★① 道に 代表を 足す　★② `CAN_DO` を「できません」に する
    // ★★だから **宣言**を 要ります。★`tools/promise_pending.json` に、
    //   ★わけと「いつ 外すか」を 書いた ものだけ が 通ります。
    // ★★★両方向に 落ちます ── ★宣言が 無ければ 落ち、
    //   ★宣言が 在る のに 直って いたら も 落ちます（★宣言を 消す 合図）。
    const 宣 = JSON.parse(readRaw("tools", "promise_pending.json"))["代表"] || {};
    ずれ.forEach((z) => {
      const 名 = z.split(" ── ")[0];
      const d = 宣[名];
      assert.ok(d, "★約束と 道が 食いちがって います …… " + z
        + "\n      ★`tools/promise_pending.json` に わけと when を 書いて ください");
      assert.ok(d.when && String(d.when).trim(), "★" + 名 + " に when が ありません");
    });
    Object.keys(宣).forEach((名) => {
      assert.ok(ずれ.some((z) => z.startsWith(名)),
        "★" + 名 + " は もう 食いちがって いません。"
        + "★`tools/promise_pending.json` から 消して ください（" + 宣[名].when + "）");
    });
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
