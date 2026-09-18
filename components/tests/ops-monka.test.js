// ============================================================================
// ★門下の 画面（★見本 `P_monka` ／ ★裁定 その90・2026-09-18）
//
//   ★★★見る の は 6つ。
//     ★【一】★担当の 生徒だけ（★終わった 受け持ちを 出さない）
//     ★【二】★並びは 名前順（★出席では 並べない）
//     ★【三】★出席の 数（★率を 出さない）
//     ★【四】★★印は 線が 決まって いる ときだけ
//     ★【五】★型が 無ければ 分母を 出さない
//     ★【六】★出せない ものを、★引き金つきで 記して ある
// ============================================================================

const { readCode, readRaw, loadLib } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { ok++; console.log("  ○ " + label); }
  else { ng++; console.log("  ✗ " + label); }
}

(async () => {
  const M = await loadLib("lib", "opsMonka.js");
  const A = await loadLib("lib", "attendanceCount.js");
  const 本文 = readCode("components", "OpsMonka.jsx");
  const 生 = readRaw("components", "OpsMonka.jsx");
  const 親 = readRaw("components", "VocalTracker.jsx");

  const 受 = [
    { teacher_id: "t", student_id: "s2", ended_at: null },
    { teacher_id: "t", student_id: "s1", ended_at: null, is_representative: true },
    { teacher_id: "t", student_id: "s3", ended_at: "2026-01-01" },
    { teacher_id: "x", student_id: "s4", ended_at: null }
  ];
  const 名 = (i) => ({ s1: "あべ", s2: "いとう", s3: "うえだ", s4: "えのき" })[i] || "";
  const 学 = (i) => ({ s1: "2年", s2: "1年" })[i] || "";

  // -------------------------------------------------------------------------
  // 【一】★担当の 生徒だけ
  // -------------------------------------------------------------------------
  console.log("【一】担当の 生徒だけ");
  const r = M.monkaRows(受, "t", { gradeOf: 学, nameOf: 名 });
  t(r.length === 2, "2人（" + r.length + "）");
  t(!r.some((x) => x.studentId === "s4"), "★よその 先生の 生徒を 出さない");
  t(!r.some((x) => x.studentId === "s3"), "★★終わった 受け持ちを 出さない");
  t(M.monkaRows(null, "t") .length === 0, "★渡されなくても 落ちない");
  t(M.mayOpen(["monka_write"]) === true && M.mayOpen([]) === false, "門は `monka_write`");
  t(!/["']monka_write["']/.test(本文), "★画面が できことの 名を 直に 見て いない");

  // -------------------------------------------------------------------------
  // 【二】★並び
  // -------------------------------------------------------------------------
  console.log("【二】並びは 名前順（★裁定 その90 §4）");
  t(r[0].grade === "1年" && r[1].grade === "2年", "学年の 順");
  t(!/sort\([^)]*came|sort\([^)]*出席/.test(readCode("lib", "opsMonka.js")),
    "★出席で 並べて いない");
  t(!/\.sort\(/.test(本文), "★画面でも 並べ替えて いない");

  // -------------------------------------------------------------------------
  // 【三】★出席の 数
  // -------------------------------------------------------------------------
  console.log("【三】出席の 数（★率を 出さない）");
  const L = [
    { teacher_id: "t", student_id: "s1", attendance: "came" },
    { teacher_id: "t", student_id: "s1", attendance: "absent" },
    { teacher_id: "x", student_id: "s1", attendance: "came" },
    { teacher_id: "t", student_id: "s2", attendance: "came" }
  ];
  const 本 = M.lessonsOfStudent(L, "t", "s1");
  t(本.length === 2, "★よその 先生の コマを 混ぜない");
  t(A.cameWord(本) === "出席 1", "出席の 数（" + A.cameWord(本) + "）");
  t(本文.includes("NO_RATE_LINE"), "★率を 出さない、と 画面に 書いて いる");
  const 元 = readCode("lib", "opsMonka.js");
  ["％", "パーセント", "達成", "出席率"].forEach((w) => {
    t(!元.split("率（％）は 出しません").join("").includes(w), "lib に「" + w + "」が ない");
  });

  // -------------------------------------------------------------------------
  // 【四】★★印
  // -------------------------------------------------------------------------
  console.log("【四】足りない 見込みの 印（★線が 決まって いる ときだけ）");
  // ★★★見本は「★」ですが、★出荷できません（★2026-09-15 の お決め）。
  //   ★★「★」は 紙の 中の 印 です。★画面に 出しません。
  //   ★★★「※」に しました。★裁定 その90 §4 が 求める 3つ ──
  //     ★「色を 使わない」「印だけ」「責める 形に しない」── ★は みたします。
  t(A.SHORT_MARK === "※", "印は ※（★「★」は 出荷できません）");
  t(A.SHORT_MARK !== "★", "★『★』を 画面に 出して いない");
  t(A.SHORT_NOTE.startsWith(A.SHORT_MARK), "★注も 同じ 印から 始まる");
  // ★★★2026-09-19、★線を 型から 取る ように しました（★お決め Q1）。
  //   ★★入って いなければ null。★そのときは ★印が 1つも 出ません。
  t(親.includes("型 && 型.need_count ? 型.need_count : null"), "★線は 型から 取る");
  t(A.looksShort({ came: 1, held: 12, total: 30, need: null }) === false,
    "★線が 無ければ ★印は 出ない");
  t(親.includes("08-11"), "★引き金が その場に ある");
  t(本文.includes("SHORT_NOTE"), "★印の わけを 画面に 出して いる");
  // ★★色で 示して いない こと。
  t(!/color: C\.(curtain|rust)[^\n]*SHORT_MARK/.test(生), "★印を 色で 示して いない");

  // -------------------------------------------------------------------------
  // 【五】★型が 無ければ 分母を 出さない
  // -------------------------------------------------------------------------
  console.log("【五】型");
  t(M.presetOf([], "t") === null, "★無ければ null");
  t(M.presetOf([{ teachers: ["t"], name: "声楽実技" }], "t").name === "声楽実技", "当たって いれば 返す");
  t(M.presetCount([{ teachers: ["t"] }, { teachers: ["t"] }], "t") === 2, "★いくつ 当たって いるか 数える");
  t(M.MANY_PRESETS_LINE.includes("いくつも"), "★2つ 以上 なら 断りを 出す");
  t(M.NO_PRESET_LINE.includes("回数の 目安は 出ません"), "★無い ものを 見せない");
  t(A.progressWord(12, null) === "12回目", "★分母を 出さない");

  // -------------------------------------------------------------------------
  // 【六】★出せない もの
  // -------------------------------------------------------------------------
  console.log("【六】出せない もの（★引き金つき）");
  t(M.NOT_YET.length === 2, "2つ");
  M.NOT_YET.forEach((x) => {
    t(!!x.why && !!x.needs, x.key + " に わけと 要る ものが ある");
  });
  // ★★★2026-09-19、★「空いて いる コマ」は 通りました（★お決め Q2）。
  //   ★★残るのは「時間割が 出て いるか」と「レッスンの 枠」です。
  //   ★★★空きの 数だけ では、★出して いない 方と、ぜんぶ 埋まって いる 方を
  //     ★★分けられません。★どちらも 0 です。
  t(M.NOT_YET.some((x) => x.why.includes("分けられない")),
    "★なぜ まだ 出せないかを 書いて いる");
  t(readRaw("docs", "ledgers", "08-保留している決め.md").includes("## 08-11"), "台帳に ある");
  // ★★★空の 列を 並べて いない こと。
  t(!本文.includes("空いて いる コマ<"), "★空の 列を 並べて いない");
  t(本文.includes("まだ 出せません"), "★何が まだかを 書いて いる");

  // -------------------------------------------------------------------------
  // 【七】★呼ぶ 側
  // -------------------------------------------------------------------------
  console.log("【七】呼ぶ 側");
  t(親.includes('if (tabKey === "monka")'), "門下の 帯を 出して いる");
  t(親.includes("<OpsMonka"), "画面を 出して いる");
  t(親.includes("teacherId={userId}"), "★見て いる 方の 門下 です");
  t(親.includes("orgAssignments[opsOrgId]"), "受け持ちから 引いて いる");

  // -------------------------------------------------------------------------
  // 【八】★空いて いる コマ（★2026-09-19・お決め Q2）
  //
  //   ★★★返るのは **数 だけ** です。★中身も、★どの 時間かも 来ません。
  // -------------------------------------------------------------------------
  console.log("【八】空いている コマ（★数 だけ）");
  t(M.freeWord(3) === "3コマ", "数を 出す");
  t(M.freeWord(0) === "0コマ", "★0も 出す（★1つも 空いて いない）");
  t(M.freeWord(null) === M.FREE_UNKNOWN, "★まだ 分からない ときは —");
  t(M.freeWord(undefined) === M.FREE_UNKNOWN, "★0 と 区別して いる");
  t(本文.includes("freeCounts[r.studentId]"), "画面が 出して いる");
  // ★★★中身の 名を 1つも 持って いない こと。
  ["授業の 名前", "教室", "備考", "title", "room", "memo", "unavailable"].forEach((w) => {
    t(!readCode("lib", "opsMonka.js").includes(w), "lib に「" + w + "」が ない");
  });
  t(!/my_timetable/.test(本文), "★画面が 時間割の 表を 直に 読んで いない");
  // ★★呼ぶ 側 ── ★手続きで 引いて いる こと。
  t(親.includes('supabase.rpc("get_monka_free_counts")'), "★手続きで 引いて いる");
  t(!/from\("my_timetable"\)/.test(親), "★時間割の 表を 直に 引いて いない");
  // ★★★台帳の 関数が 返す もの が、★3つ／2つ だけ である こと。
  const sql = readRaw("supabase", "migration_preset_need_and_free_slots.sql");
  t(/returns table \(student_id uuid, free_count int\)/.test(sql), "★数 だけ を 返す");
  t(/returns table \(weekday smallint, period_ord smallint, is_free boolean\)/.test(sql),
    "★空きか どうか だけ を 返す");
  ["t.title", "t.room", "t.memo", "t.teacher"].forEach((w) => {
    t(!sql.includes(w), "★SQL が「" + w + "」を 返して いない");
  });
  // ★★門は 受け持ち だけ。★役職では ない こと。
  t(/a\.teacher_id = auth\.uid\(\)/.test(sql), "★受け持ちで 門を かけて いる");
  t(!/is_org_owner_or_admin|has_can/.test(sql.slice(sql.indexOf("get_monka_free_counts"))),
    "★役職で 通して いない");
  // ★★`my_timetable` の 決まりを 増やして いない こと。
  t(!/create policy[^;]*my_timetable/.test(sql), "★時間割の 決まりを 足して いない");

  // -------------------------------------------------------------------------
  // 【九】★足りると される 回数（★お決め Q1）
  // -------------------------------------------------------------------------
  console.log("【九】足りると される 回数");
  t(/add column if not exists need_count int/.test(sql), "★列を 足した");
  t(/need_count is null or \(need_count > 0 and need_count <= total_count\)/.test(sql),
    "★年間の 回数より 多く できない");
  t(親.includes("型 && 型.need_count ? 型.need_count : null"), "★型から 取って いる");
  t(親.includes("need_count"), "★読み書きして いる");
  // ★★★空なら ★印は 出ない こと。
  t(A.looksShort({ came: 1, held: 12, total: 30, need: null }) === false,
    "★空なら ★印は 出ない");

  console.log(`\n○ ${ok}　✗ ${ng}`);
  process.exit(ng === 0 ? 0 : 1);
})();
