#!/usr/bin/env node
/**
 * 行動ログ（計測とユーザー調査仕様.md §3）。G2-13。
 *
 * ★守っているのは1本の線です。
 *   「どの項目を入れたか」＝行動ログ（軽い）
 *   「その項目の値」      ＝健康データ（重い）
 *   入れた瞬間に、この表全体が要配慮個人情報になります。
 *   仕様も「実装時のレビュー観点にしてください」と書いています。
 *   人が見るだけでは漏れるので、実行時に弾き、テストで固定します。
 */
const { readCode, readRaw } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

async function main() {
  const raw = readRaw("lib", "events.js");
  const m = await import("data:text/javascript;base64," + Buffer.from(raw, "utf-8").toString("base64"));
  const ui = readCode("components", "VocalTracker.jsx");
  const sql = readCode("supabase", "migration_events.sql");

  console.log("=== §3.2 イベントは15種類まで ===");
  assertTrue(m.EVENT_NAMES.length <= m.MAX_EVENT_NAMES,
    `${m.EVENT_NAMES.length}種類（上限${m.MAX_EVENT_NAMES}）。★多く取ると、どれも見なくなる`);
  assertEqual(new Set(m.EVENT_NAMES).size, m.EVENT_NAMES.length, "重複が無い");
  ["record_saved", "record_abandoned", "analysis_opened"].forEach((n) =>
    assertTrue(m.isKnownEvent(n), `${n} が定義されている`));
  assertTrue(!m.isKnownEvent("record_save"), "★表に無い名前は受け付けない（旧 record_save も含めて）");

  console.log("\n=== §3.3 ★props に健康の値を入れない ===");
  assertEqual(m.validateEventProps({ fieldsFilled: ["sleep", "hydration"], durationMs: 47000, mode: "quick" }).ok,
    true, "項目名の配列と所要時間は入れてよい");
  [
    ["throatCondition", { throatCondition: 2 }],
    ["symptoms", { symptoms: ["乾燥"] }],
    ["weightKg", { weightKg: 58 }],
    ["cycleStart", { cycleStart: true }],
    ["notes", { notes: "つらい" }]
  ].forEach(([label, props]) => {
    assertEqual(m.validateEventProps(props).ok, false, `★${label} は弾く`);
  });
  assertEqual(m.validateEventProps({ lastSection: "x".repeat(200) }).ok, false,
    "★長い文字列も弾く（本文を入れていないか）");
  assertEqual(m.validateEventProps(null).ok, true, "props 無しは問題ない");

  console.log("\n=== 弾いたときは、送らずに落とす（黙って送らない） ===");
  let sent = null;
  const fake = { from: () => ({ insert: (row) => { sent = row; return { then: (a, b) => {} }; } }) };
  const quiet = console.error, quietWarn = console.warn;
  console.error = () => {}; console.warn = () => {};
  m.trackEvent(fake, "u1", "record_saved", { throatCondition: 2 });
  assertEqual(sent, null, "★健康の値が入っていたら、1件も送らない");
  m.trackEvent(fake, "u1", "知らないイベント", {});
  assertEqual(sent, null, "★知らない名前も送らない");
  m.trackEvent(fake, "u1", "record_saved", { fieldsFilled: ["sleep"] });
  console.error = quiet; console.warn = quietWarn;
  assertTrue(sent && sent.name === "record_saved", "正しいものは送る");
  assertTrue(sent && sent.user_id === "u1" && sent.at, "user_id と時刻が入る");
  assertEqual(sent && sent.props, { fieldsFilled: ["sleep"] }, "props はそのまま");

  console.log("\n=== 画面が、直接 insert していない ===");
  assertTrue(/trackEvent\(supabase, userId, "record_saved"/.test(ui), "★モジュールを経由している");
  assertTrue(!/from\("events"\)\.insert/.test(ui), "★画面から直接 events に insert していない");
  assertTrue(/fieldsFilled: filledFieldNames/.test(ui), "★項目名の配列を送っている（値ではない）");
  assertTrue(/function filledSectionNames/.test(ui), "項目名を作る関数がある");
  // ★その関数が、値を返していないこと
  const fn = ui.slice(ui.indexOf("function filledSectionNames"), ui.indexOf("function filledSectionNames") + 1200);
  assertTrue(!/names\.push\(e\./.test(fn), "★項目の値を名前として送っていない");

  console.log("\n=== §3.5 13か月で消す ===");
  assertEqual(m.EVENT_RETENTION_MONTHS, 13, "保持は13か月");
  const cron = readCode("app", "api", "cron", "purge-events", "route.js");
  assertTrue(/EVENT_RETENTION_MONTHS/.test(cron), "★削除ジョブが同じ定数を見ている");
  assertTrue(/if \(!cronSecret\)/.test(cron) && /503/.test(cron), "未設定なら 503 で止まる");
  const guardAt = cron.indexOf("if (!cronSecret)"), queryAt = cron.search(/\.from\(/);
  assertTrue(guardAt >= 0 && guardAt < queryAt, "★DBに触る前に認証している");
  const vercel = JSON.parse(readRaw("vercel.json"));
  assertTrue(vercel.crons.some((c) => c.path === "/api/cron/purge-events"), "毎日走るように登録されている");

  console.log("\n=== ★既にある表に、あとから足せる形になっている ===");
  console.log("     create table if not exists は、表があると黙って何もしません。");
  console.log("     列は古いまま、続く create index が新しい列名を指して落ちます。");
  assertTrue(/add column if not exists/.test(sql), "★足りない列を足す形になっている");
  const addCols = (sql.match(/add column if not exists/g) || []).length;
  assertTrue(addCols >= 5, `新しい列を${addCols}件、個別に足している`);
  // 索引は、列を足したあとに作ること（順序が逆だと落ちる）
  const addAt = sql.lastIndexOf("add column if not exists");
  const idxAt = sql.indexOf("create index");
  assertTrue(addAt < idxAt, "★列を足してから索引を作っている（順序）");
  // 古い列の中身を写していること。★消していないこと。
  assertTrue(/set name = event_type/.test(sql), "古い event_type を name へ写している");
  assertTrue(/set props = payload/.test(sql), "古い payload を props へ写している");
  assertTrue(!/drop column/.test(sql), "★古い列を消していない（写し違いがあったとき戻せる）");
  assertTrue(/information_schema\.columns/.test(sql),
    "★列の有無を確かめてから写している（無い環境でも落ちない）");
  assertTrue(/set name = 'record_saved' where name = 'record_save'/.test(sql),
    "旧 record_save を、仕様の名前に合わせている");

  console.log("\n=== 表の作り ===");
  assertTrue(/create index if not exists events_user_at_idx/.test(sql), "(user_id, at) の索引");
  assertTrue(/create index if not exists events_name_at_idx/.test(sql), "(name, at) の索引");
  assertTrue(/enable row level security/.test(sql), "RLS が有効");
  assertTrue(/for insert/.test(sql) && !/for select/.test(sql),
    "★本人は書けるが、読めない（読むのは管理画面だけ）");

  console.log("\n=== §1.2 外部の分析ツールへ送っていない ===");
  // ★語の一部で判定しないこと。consecutiveSegments のような正当な項目名が
  //   "segment" に引っかかります（実際に引っかかりました）。
  //   見るべきは「外部へ送っているか」なので、読み込みと送信先で判定します。
  const analyticsImport = /(from|require)\s*\(?["'][^"']*(google-analytics|gtag|mixpanel|amplitude|posthog|segment\.com|analytics)[^"']*["']/i;
  assertTrue(!analyticsImport.test(raw + ui), "★第三者の分析ツールを読み込んでいない");
  const externalSend = /(fetch|sendBeacon)\s*\(\s*["'`]https?:\/\/(?!.*supabase)/i;
  assertTrue(!externalSend.test(raw), "★行動ログを外部の宛先へ送っていない");
  assertTrue(/from\("events"\)/.test(raw), "自前の events 表に入れている（§1.2）");

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
