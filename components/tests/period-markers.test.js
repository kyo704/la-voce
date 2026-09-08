// ============================================================================
// 区切りマーカーの見張り（2026-09-08）
//
//   ★★★理由の欄を、作らないこと。
//     ★服薬・受診そのものを記録しない（★食事と就寝の設計 §9 の8番）。
//     ★何があったかは、ご本人だけが知っていれば足ります。
//
//   node components/tests/period-markers.test.js
// ============================================================================

const fs = require("fs");
const path = require("path");
const { pathToFileURL } = require("url");
const { readCode, readRaw } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let fail = 0;
function ok(c, m) { console.log((c ? "  ✓ " : "  ✗ ") + m); if (!c) fail++; }

async function load(rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), "utf8")
    .replace(/from\s+"@\/([^"]+)"/g, (m, r) => {
      const abs = path.join(ROOT, /\.[a-z]+$/.test(r) ? r : r + ".js");
      return `from "${pathToFileURL(abs).href}"`;
    });
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

(async () => {
  const M = await load("lib/periodMarkers.js");

  console.log("① ★理由の欄が、無いこと");
  ok(M.MARKER_COLUMNS.length === 3, "列は3つだけ（★" + M.MARKER_COLUMNS.join(", ") + "）");
  const bad = M.MARKER_COLUMNS.filter((c) =>
    M.FORBIDDEN_COLUMNS.some((f) => c.toLowerCase().includes(f)));
  ok(bad.length === 0, "★禁じた欄が、1つも無い");
  const row = M.markerRow({ userId: "u", dateISO: "2026-09-08", now: "2026-09-08T00:00:00Z" });
  ok(Object.keys(row).length === 3, "作る行も、3つだけ");
  ok(!("reason" in row) && !("note" in row) && !("kind" in row), "★理由・ひとこと・種類が、無い");

  console.log("② SQL にも、理由の欄が無いこと");
  const sql = readCode("supabase", "2026-09-08-区切りマーカー.sql");
  ok(/create table if not exists public\.period_markers/.test(sql), "表を作っている");
  // ★★create table の中だけを見ます。★確かめの select には、禁じた語が出ます。
  const body = sql.slice(sql.indexOf("create table if not exists public.period_markers"),
    sql.indexOf("create index"));
  ["reason", "note", "memo", "kind", "medication", "visit", "diagnosis"].forEach((w) => {
    ok(!new RegExp("^\\s+" + w, "mi").test(body), "★列に「" + w + "」が無い");
  });
  ok(/unique \(user_id, marked_on\)/.test(body), "同じ日に、2つ置けない");

  console.log("③ ★先生に、渡らないこと");
  ok(/enable row level security/.test(sql), "RLS を入れている");
  ok(/auth\.uid\(\) = user_id/.test(sql), "自分の行だけ");
  ok(/with check \(auth\.uid\(\) = user_id\)/.test(sql), "★WITH CHECK がある（★UPDATE を含むため）");
  ok(!/security definer/i.test(sql), "★SECURITY DEFINER の関数を、作っていない");
  ok(!/teacher|student|org_/i.test(sql), "★先生・教室のポリシーが、1つも無い");
  // ★★広い権限を、先に剥がしていること。
  ok(sql.indexOf("revoke all on public.period_markers from authenticated")
    < sql.indexOf("grant select, insert, delete"), "★剥がしてから、渡している");
  ok(!/grant .*update/i.test(sql), "★update を渡していない（★置くか、外すか、だけ）");

  console.log("④ 期間を分ける");
  const days = ["2026-09-01", "2026-09-02", "2026-09-03", "2026-09-04", "2026-09-05"];
  const one = M.splitByMarkers(days, []);
  ok(one.length === 1 && one[0].dates.length === 5, "印が無ければ、1つの期間");
  const two = M.splitByMarkers(days, [{ marked_on: "2026-09-03" }]);
  ok(two.length === 2, "印が1つなら、2つに分かれる");
  ok(two[0].to === "2026-09-02" && two[1].from === "2026-09-03",
    "★印の日は、あとの期間に入る");
  ok(M.splitByMarkers(days, [{ marked_on: "2026-09-01" }]).length === 1,
    "いちばん最初の日の印では、分かれない");
  ok(M.splitByMarkers(days, [{ marked_on: "2026-12-31" }]).length === 1,
    "範囲の外の印は、効かない");
  ok(M.splitByMarkers([], [{ marked_on: "2026-09-03" }]).length === 0, "日が無ければ、空");
  ok(M.splitByMarkers(null, null).length === 0, "null でも、落ちない");
  const three = M.splitByMarkers(days, [{ marked_on: "2026-09-04" }, { marked_on: "2026-09-02" }]);
  ok(three.length === 3, "★並びが逆でも、正しく3つに分かれる");

  console.log("⑤ ★判定を、返していない");
  const keys = new Set(two.flatMap((p) => Object.keys(p)));
  ["better", "worse", "score", "judgement", "改善", "悪化"].forEach((k) => {
    ok(!keys.has(k), "★" + k + " を、返していない");
  });

  console.log("⑥ ★画面の言葉");
  ok(/区切り/.test(M.COPY.add), "「ここから区切りをつける」がある");
  ok(/分けます/.test(M.COPY.note), "「記録の見方を分けます」がある");
  // ★★理由を尋ねないこと。
  ok(!/何が|理由|どうして|なぜ/.test(M.COPY.add + M.COPY.note),
    "★理由を、尋ねていない");
  ok(/書いていただかなくて/.test(M.COPY.whyNoReason), "★なぜ聞かないかを、書いてある");
  // ★★評価の語を、1つも使わないこと。
  const copy = Object.values(M.COPY).join(" ");
  M.FORBIDDEN_WORDS.forEach((w) => {
    ok(!copy.includes(w), "★「" + w + "」を、書いていない");
  });

  console.log("⑦ 日付の形");
  ok(M.markerRow({ userId: "u", dateISO: "2026-9-8" }) === null, "形の違う日付は、作らない");
  ok(M.markerRow({ userId: null, dateISO: "2026-09-08" }) === null, "誰か分からなければ、作らない");
  ok(M.hasMarker([{ marked_on: "2026-09-08" }], "2026-09-08") === true, "在るか、答えられる");
  ok(M.hasMarker([], "2026-09-08") === false, "無ければ false");
  ok(M.markerDates([{ marked_on: "2026-09-09" }, { marked_on: "2026-09-01" }])[0] === "2026-09-01",
    "古い順に並ぶ");

  console.log("⑧ 画面につながっているか");
  const vt = readRaw("components/VocalTracker.jsx");
  const btn = readRaw("components/PeriodMarkerButton.jsx");
  ok(/<PeriodMarkerButton/.test(vt), "記録の画面に、置いてある");
  ok(/handleTogglePeriodMarker/.test(vt), "置く・外すが、つながっている");
  ok(/from\("period_markers"\)\s*\.delete\(\)/.test(vt.replace(/\s+/g, " ")) ||
     /period_markers"\)\s*\.delete/.test(vt), "外す道が、ある");
  // ★★理由を、受け取っていないこと。
  ok(/async function handleTogglePeriodMarker\(dateISO, next\)/.test(vt),
    "★引数に、理由が無い");
  ok(!/reason|理由/.test(readCode("components", "PeriodMarkerButton.jsx").replace(/whyNoReason/g, "")),
    "★画面にも、理由の欄が無い");
  ok(!/<textarea|<input/.test(btn), "★書き込む欄が、1つも無い");
  // ★★update を、使っていないこと。
  ok(!/period_markers"\)[\s\S]{0,80}\.update\(/.test(vt), "★書き替えていない");
  // ★★消していないこと（★同意や記録に、ふれていないこと）。
  ok(!/delete[\s\S]{0,40}entries/.test(vt.slice(vt.indexOf("handleTogglePeriodMarker"),
    vt.indexOf("handleTogglePeriodMarker") + 1200)), "★記録には、ふれていない");

  console.log(fail === 0 ? "\n★すべて通りました" : "\n★" + fail + "件、落ちました");
  process.exit(fail === 0 ? 0 : 1);
})();
