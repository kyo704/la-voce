// カレンダーに渡すものが、増えていないか（2026-09-03・Opus の裁定 §6）
//
//   ★これは漂流の見張りです。
//     いま正しいことではなく、★あとから誰かが足せないことを確かめます。
//     題名の引数を消したのが直しの本体なので、
//     ★引数が復活していないかを見ます。
const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));

const 根 = path.join(__dirname, "..", "..");
const 読む = (p) => fs.readFileSync(path.join(根, p), "utf8");
const 取込 = (p) =>
  import("data:text/javascript;base64," + Buffer.from(読む(p)).toString("base64"));

/** 関数の本体を、波かっこを数えて取り出す。★正規表現では境界を決めません。 */
function 本体(src, 見出し) {
  const i = src.indexOf(見出し);
  if (i === -1) return null;
  const 開き = src.indexOf("{", i + 見出し.length);   // ★引数リストの後ろの { から数えます
  let 深さ = 0;
  for (let j = 開き; j < src.length; j++) {
    if (src[j] === "{") 深さ++;
    else if (src[j] === "}") { 深さ--; if (深さ === 0) return src.slice(開き, j + 1); }
  }
  return null;
}

(async () => {
  const C = await 取込("lib/calendarExport.js");
  const VT = readCode("components/VocalTracker.jsx");

  console.log("\n① 渡してよいものの一覧");
  ok("日時と題名だけ", JSON.stringify(C.CALENDAR_ALLOWED) === JSON.stringify(["start", "end", "title"]));
  ok("禁じるものの一覧がある", C.CALENDAR_FORBIDDEN.length >= 6);
  ok("メモを禁じている", C.CALENDAR_FORBIDDEN.includes("note"));
  ok("★先生のお名前を禁じている", C.CALENDAR_FORBIDDEN.includes("teacherName"));
  ok("★ほかの生徒さんのお名前を禁じている", C.CALENDAR_FORBIDDEN.includes("studentName"));

  console.log("\n② 題名に、誰の名前も入らないこと");
  const ev = C.buildCalendarEvent(
    { scheduled_at: "2026-09-10T10:00:00Z", duration_minutes: 45,
      note: "喉の調子が悪いとのこと", teacher_id: "x" },
    null
  );
  ok("題名は「レッスン」", ev.title === "レッスン");
  ok("★組み立てた結果に、日時と題名しかない",
    JSON.stringify(Object.keys(ev).sort()) === JSON.stringify(["end", "start", "title"]));
  ok("★メモが混ざっていない", !JSON.stringify(ev).includes("喉の調子"));
  ok("終わりは開始＋所要時間", ev.end - ev.start === 45 * 60000);
  ok("所要時間が無ければ60分", (() => {
    const e = C.buildCalendarEvent({ scheduled_at: "2026-09-10T10:00:00Z" }, null);
    return e.end - e.start === 60 * 60000;
  })());

  console.log("\n③ ★題名の引数が、復活していないこと");
  ok("buildGoogleCalendarUrl は題名を受け取らない",
    /function buildGoogleCalendarUrl\(lesson, t\)/.test(VT));
  ok("downloadLessonICS は題名を受け取らない",
    /function downloadLessonICS\(lesson, t\)/.test(VT));
  ok("AddToCalendarButtons は題名を受け取らない",
    /function AddToCalendarButtons\(\{ lesson, t \}\)/.test(VT));
  ok("★どの呼び出し元も title を渡していない",
    !/<AddToCalendarButtons[^>]*title=/.test(VT));

  console.log("\n④ ★組み立ての中身に、渡してはいけないものが無いこと");
  const google = 本体(VT, "function buildGoogleCalendarUrl(");
  const ics = 本体(VT, "function downloadLessonICS(");
  ok("Google のURLを組み立てる本体が取り出せた", !!google);
  ok("★Google のURLに lesson.note が入っていない", google && !google.includes("lesson.note"));
  ok("★Google のURLに details が無い", google && !google.includes("details"));
  ok(".ics の本体が取り出せた", !!ics);
  ok("★.ics に DESCRIPTION が無い", ics && !ics.includes("DESCRIPTION"));
  ok("★.ics に lesson.note が入っていない", ics && !ics.includes("lesson.note"));
  for (const 語 of ["teacherWithHonorific", "getStudentName", "throat", "symptom"]) {
    ok(`★組み立ての中に ${語} が無い`,
      google && ics && !google.includes(語) && !ics.includes(語));
  }

  console.log("\n⑤ 訳が9言語そろっていること");
  const 訳 = 読む("lib/translations.js");
  const 行 = 訳.split("\n").find((l) => l.includes("calendarEventTitle:"));
  ok("calendarEventTitle がある", !!行);
  for (const 語 of ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"]) {
    ok(`${語} がある`, 行 && new RegExp(`\\b${語}:`).test(行));
  }

  console.log("\n⑥ 台帳と食い違っていないこと");
  const O = await 取込("lib/outboundRoutes.js");
  const g = O.OUTBOUND_ROUTES.find((r) => r.host === "calendar.google.com");
  ok("台帳に載っている", !!g);
  ok("★origin は client（利用者が押したときだけ）", g && g.origin === "client");

  console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
  process.exit(否 ? 1 : 0);
})();
