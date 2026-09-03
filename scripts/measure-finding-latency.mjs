// ============================================================================
// 見つかるまでの日数を測る（2026-09-03・案A）
//
//   ★これは★読むだけの道具です。★1行も書き換えません。
//   ★坂本さんが、ご自身の端末で、ご自身の鍵で走らせます。
//     ★私（Claude）は、データベースに触れません。
//
//   ★出すのは、1人につき★3つだけです。
//       利用者のid ／ 何日目で最初の発見が出たか ／ 記録した日数
//   ★★体調の値そのものは、1つもファイルに出しません。
//     ★睡眠時間も、喉の状態も、湿度も、出しません。
//     ★出るのは「日数」だけです。
//   ★★人数は、この道具では数えません（2026-09-02 の凍結）。
//     ★行が何行あるかは、見れば分かります。★私が数を書きません。
//
//   ★判定は、画面と★同じコードを使います。★書き写していません。
//       lib/analysisCore.js      … 相関・効果量・FDR
//       lib/analysisFamilies.js  … どの組を比べるか
//       lib/displayGates.js      … 3つの門（n≥10 / |g|≥0.4 / q<0.10）
//     ★書き写すと、★測った結果と画面が食い違っても、誰も気づけません。
//
//   ★数え方
//     ・その人の★いちばん古い記録の日を 0 日目とします。
//     ・1日ずつ増やしながら、★その日までの記録で分析をやり直します。
//     ・★どれか1つでも3つの門を通った日を「最初の発見」とします。
//     ・最後まで通らなければ「まだ」と書きます。
//       ★「まだ」は「出ない」ではありません。★記録が足りないだけです。
//
// ---------------------------------------------------------------------------
// 使い方（★1行）
//
//   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/measure-finding-latency.mjs
//
//   ★鍵は、.env.local にあるものと同じです。
//   ★走らせると docs/reports/2026-09-03-finding-latency.md ができます。
//   ★出来たファイルを、そのまま見てください。★私に貼る必要はありません。
// ============================================================================

import { createClient } from "@supabase/supabase-js";
import { writeFileSync, readFileSync } from "node:fs";

// ★lib をそのまま読み込みます。★書き写しません。
//   ★lib の中の "@/lib/…" は Next.js の別名で、node には解決できません。
//     ★そこだけ相対の道に直して読み込みます。★中身は変えません。
//   ★検査（components/tests/*.test.js）と同じやり方です。
async function loadLib(name) {
  const src = readFileSync(new URL(`../lib/${name}.js`, import.meta.url), "utf8")
    .replace(/from ["']@\/lib\/(\w+)["']/g, 'from "./$1.js"');
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}
// ★displayGates は翻訳を読み込みますが、★使うのは効果量の判定だけです。
//   ★翻訳が要らない形で読めるように、その1行だけ外します。
async function loadGates() {
  const src = readFileSync(new URL("../lib/displayGates.js", import.meta.url), "utf8")
    .replace(/^import \{ createTranslator \}.*$/m, "const createTranslator = () => (k) => k;");
  return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
}

const { buildCoreGroups } = await loadLib("analysisFamilies");
const { computeHedgesG, benjaminiHochberg, tDistPValue } = await loadLib("analysisCore");
const { effectStateOf, EFFECT_SHOWN } = await loadGates();

// ★組み込みの URL を隠さない名前にします（★隠すと new URL が使えません）。
const dbUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const dbKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!dbUrl || !dbKey) {
  console.error("★鍵がありません。次の形で走らせてください：");
  console.error("  SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/measure-finding-latency.mjs");
  process.exit(1);
}
const db = createClient(dbUrl, dbKey, { auth: { persistSession: false } });

// ★読む列は、判定に要るものだけです。★メモも自由記述も読みません。
const COLUMNS = [
  "user_id", "date",
  "throat_condition",          // ← 結果（のどの状態）
  "sleep_hours",
  "non_performance_speech_minutes",
  "temperature", "humidity",
  "morning_edema",
  "activity_type"              // ← 前日が本番・レッスンだったか
].join(", ");

function toEntry(row) {
  return {
    date: row.date,
    throatCondition: row.throat_condition,
    sleepHours: row.sleep_hours,
    nonPerformanceSpeechMinutes: row.non_performance_speech_minutes,
    temperature: row.temperature,
    humidity: row.humidity,
    morningEdema: row.morning_edema,
    activityType: row.activity_type
  };
}

// ★その日までの記録で、3つの門を通るものがあるか。
function hasFinding(entriesByDate) {
  const groups = buildCoreGroups(entriesByDate, (e) =>
    e && typeof e.throatCondition === "number" ? e.throatCondition : null);
  if (groups.length === 0) return false;

  // ★効果量と p 値を、組ごとに出します。
  const results = groups.map(({ key, split }) => {
    const res = computeHedgesG(split.high, split.low);
    if (!res) return { key, res: null, p: null };
    // ★t 統計量から p 値を出します（Welch ではなく、g と同じ pooled の形）。
    const { n1, n0, g } = res;
    const t = g * Math.sqrt((n1 * n0) / (n1 + n0));
    return { key, res, p: tDistPValue(t, n1 + n0 - 2) };
  });

  // ★BH-FDR は、★その回に検定したものを1つの族として通します。
  const pass = benjaminiHochberg(results.map((r) => r.p), 0.10);
  return results.some((r, i) => {
    if (!r.res) return false;
    return effectStateOf({ ...r.res, fdrPass: pass[i] }) === EFFECT_SHOWN;
  });
}

const dayDiff = (a, b) =>
  Math.round((new Date(b + "T00:00:00Z") - new Date(a + "T00:00:00Z")) / 86400000);

async function main() {
  console.log("★記録を読み込んでいます（★読むだけです）…");
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await db.from("entries")
      .select(COLUMNS).order("user_id").order("date").range(from, from + PAGE - 1);
    if (error) { console.error("★読み込めませんでした:", error.message); process.exit(1); }
    rows.push(...data);
    if (data.length < PAGE) break;
  }

  const byUser = new Map();
  for (const r of rows) {
    if (!byUser.has(r.user_id)) byUser.set(r.user_id, []);
    byUser.get(r.user_id).push(r);
  }

  const out = [];
  for (const [userId, urows] of byUser) {
    const dates = [...new Set(urows.map((r) => r.date))].sort();
    const byDate = {};
    let found = null;
    for (const d of dates) {
      for (const r of urows) if (r.date === d) byDate[d] = toEntry(r);
      if (found === null && hasFinding(byDate)) found = dayDiff(dates[0], d);
    }
    out.push({ userId, found, recorded: dates.length });
  }
  out.sort((a, b) => (a.found ?? 99999) - (b.found ?? 99999));

  const lines = [];
  lines.push("# 見つかるまでの日数（2026-09-03 に測りました）");
  lines.push("PLACEHOLDER_HEADER");
  lines.push("");
  lines.push("★`scripts/measure-finding-latency.mjs` が作りました。★読むだけの道具です。");
  lines.push("★判定は、画面と同じコード（analysisCore / analysisFamilies / displayGates）を使っています。");
  lines.push("");
  lines.push("★「まだ」は「出ない」ではありません。★記録が足りない、という意味です。");
  lines.push("★★記録した日数を必ず並べて見てください。★日数を見ずに、発見の有無だけを読まないこと。");
  lines.push("");
  lines.push("    利用者のid                            何日目で最初の発見  記録した日数");
  lines.push("    ────────────────────────────────────────────────────────────────────");
  for (const r of out) {
    const f = r.found === null ? "まだ" : `${r.found} 日目`;
    lines.push(`    ${r.userId}  ${f.padStart(10, "　")}  ${String(r.recorded).padStart(6)} 日`);
  }
  lines.push("    ────────────────────────────────────────────────────────────────────");
  lines.push("");
  lines.push("★この表に、体調の値は1つも入っていません。★日数だけです。");
  lines.push("★人数は、この道具では数えていません（2026-09-02 の凍結）。");

  const n = lines.length;
  lines[1] = `全${n}行 / 末尾は「${[...lines].reverse().find((l) => l.trim())}」`;
  const path = "docs/reports/2026-09-03-finding-latency.md";
  writeFileSync(path, lines.join("\n") + "\n", "utf8");
  console.log(`★書き出しました： ${path}（全${n}行）`);
}

main();
