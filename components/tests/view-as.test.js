// ============================================================================
// ★「どちらとして 見るか」の 見張り（★2026-09-10）
//
//   ★出どころ 坂本さんの ご提案（2026-09-10）
//     「★自動判定によって、★どちらの画面を 見ているか、
//       ★坂本さん自身も 分かりにくく なる、という 問題が あったため」
//
//   ★★確かめること
//     ① 選んで あれば、★その とおりに なること。
//     ② 「じどう」のときだけ、★その日の レッスンを 見ること。
//     ③ ★いま どちらかが、★言葉で 出ていること（★これが 作った 理由です）。
//     ④ 知らない 値・読めない 端末でも、★落ちないこと。
//     ⑤ 門の外（38人）には、★この 選びが 出ないこと。
//     ⑥ ★権限では ないこと ── ★見え方だけを 変えること。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  const src = fs.readFileSync(path.join(ROOT, "lib", "viewAs.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const { resolveTeaching, normalizeViewAs, viewAsWord, VIEW_AS_MODES, readViewAs, writeViewAs } = m;

  console.log("① 選んで あれば、★その とおり");
  ok(resolveTeaching({ mode: "teacher", hasTeachingToday: false }) === true,
    "★先生として ── ★レッスンが 無い日でも 先生の 画面");
  ok(resolveTeaching({ mode: "student", hasTeachingToday: true }) === false,
    "★生徒として ── ★レッスンが ある日でも 生徒の 画面");

  console.log("② 「じどう」のときだけ、★その日の レッスンを 見る");
  ok(resolveTeaching({ mode: "auto", hasTeachingToday: true }) === true, "★じどう ＋ 教える日 → 先生");
  ok(resolveTeaching({ mode: "auto", hasTeachingToday: false }) === false, "★じどう ＋ 教えない日 → 生徒");

  console.log("③ ★いま どちらかが、★言葉で 出る");
  // ★★これが、★この 仕組みを 作った 理由です。
  //   ★勝手に 決めるなら、★せめて どちらに 決めたかが 見えなければ なりません。
  ok(/いまは 先生/.test(viewAsWord({ mode: "auto", hasTeachingToday: true })),
    "★じどうでも、★どちらに なったかを 言う  （" + viewAsWord({ mode: "auto", hasTeachingToday: true }) + "）");
  ok(/いまは 生徒/.test(viewAsWord({ mode: "auto", hasTeachingToday: false })),
    "★教えない日も 言う  （" + viewAsWord({ mode: "auto", hasTeachingToday: false }) + "）");
  ok(viewAsWord({ mode: "teacher" }) === "先生として", "★選んだ ときは そのまま");

  console.log("④ 知らない 値でも 落ちない");
  ["", null, undefined, "boss", 7, {}].forEach((v) => {
    ok(normalizeViewAs(v) === "auto", "★" + JSON.stringify(v) + " → じどう");
  });
  ok(resolveTeaching() === false, "★何も 渡さなくても 落ちない");
  // ★★localStorage が 無い ところ（★サーバー側）でも 落ちないこと。
  ok(readViewAs() === "auto", "★端末が 無いときは じどう");
  ok(writeViewAs("teacher") === "teacher", "★覚えられなくても、★その場では 効く");
  ok(VIEW_AS_MODES.length === 3, "★選びは 3つ");

  console.log("⑤ 門の外（38人）には 出ない");
  const home = readRaw("components", "HomeV2.jsx");
  ok(/canChooseViewAs && onViewAs \? \(/.test(home), "★選べる ときだけ 出す");
  ok(/canChooseViewAs = false/.test(home), "★既定は 出さない");
  const v = readRaw("components", "VocalTracker.jsx");
  // ★★2026-09-11、★条件を 1つ 足しました（★Opus の 裁定 その15 ㋐ の ④）。
  //   ★「役職のない人には、切替を出さない」
  //   ★★門の中に いる だけでは 出しません。★教える 立場の 方だけです。
  //     ★★それまでは、★生徒の 方にも「先生として」が 見えて いました。
  ok(/const mayChooseViewAs = layoutV2 && canTeachLessons;/.test(v),
    "★門の中の、★教える 立場の 方だけに 渡している");
  ok(/canChooseViewAs=\{mayChooseViewAs\}/.test(v), "★それを 渡している");
  ok(/if \(layoutV2\) setViewAs\(readViewAs\(\)\)/.test(v), "★端末から 読むのも 門の中だけ");

  console.log("⑥ ★権限では ない ── ★見え方だけ");
  // ★★先生として 見ても、★その日の レッスンが 無ければ 出欠の 帯は 出ません。
  //   ★lessons を 増やしていないことを 見ます。
  ok(/lessons: myTeachingLessons\.length > 0 \? myTeachingLessons : myAllLessons/.test(v),
    "★見せる レッスンを 増やしていない");
  ok(!/viewAs[\s\S]{0,80}(teacher_beta_access|is_admin|canTeach)/.test(readCode("components", "VocalTracker.jsx")),
    "★権限の 判定に 混ぜていない");
  // ★★サーバーに 送っていないこと。
  ok(!/supabase[\s\S]{0,120}view_as|view_as[\s\S]{0,120}update/.test(readCode("components", "VocalTracker.jsx")),
    "★サーバーに 送っていない（★端末ごと）");

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
