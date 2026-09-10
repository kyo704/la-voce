// ============================================================================
// 手に入れた日の台帳（★J05・J06）── 見張り
//
//   ★出どころ docs/design/pack-final/screens/J05-台帳.txt / .notes.md
//            docs/design/pack-final/screens/J06-まだ見えていないもの.txt / .notes.md
//            supabase/2026-09-11-手に入れた日の台帳.sql
//
//   ★★何を 見張るか。
//     ① 台帳が 足すだけで あること（★書き換える 道が どこにも 無い）
//     ② 数が 揃わない ときに、片方だけ 入れない こと
//     ③ 日が 無い ものを、きょうの 日で 埋めていない こと
//     ④ 「あと◯日」を 書いていない こと
//     ⑤ 3つの 道（買う・贈られる・開く）が、★ぜんぶ 台帳に 残す こと
//     ⑥ 退会・書き出し・控え・外部参照の 4つの 一覧に 入っている こと
// ============================================================================

const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) console.log("  ok  " + label);
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const load = async (...parts) => {
    const src = readRaw(...parts)
      .replace(/from "@\/lib\/([a-zA-Z0-9]+)"/g, (m, n) => `from "${
        "file://" + path.join(__dirname, "..", "..", "lib", n + ".js")}"`);
    return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  };
  const L = await load("lib", "itemLedger.js");

  console.log("① 見本の 1行に なる");
  ok(L.ledgerLine({ acquired_on: "2026-09-08", count_kind: "record_days", count_value: 60 })
    === "9月8日　記録 60日", "★「9月8日　記録 60日」");
  ok(L.ledgerLine({ acquired_on: "2026-08-24", count_kind: "performances", count_value: 3 })
    === "8月24日　本番 3回", "★「8月24日　本番 3回」");
  // ★年を 出しません（★見本のとおり）。
  ok(!/2026/.test(L.ledgerLine({ acquired_on: "2026-09-08" })), "★年を 出さない");
  ok(L.ledgerLine(null) === L.NO_DATE_TEXT, "★日が 無ければ、そう 言う");
  ok(L.ledgerLine({ acquired_on: "こわれた" }) === L.NO_DATE_TEXT, "★読めない 日も、そう 言う");

  console.log("② 数は、揃ったときだけ 入れる");
  const both = L.buildAcquisition({
    userId: "u", itemKey: "k", acquiredBy: "shop",
    countKind: "record_days", countValue: 60, now: new Date("2026-09-11T02:00:00Z") });
  ok(both.count_value === 60 && both.count_kind === "record_days", "★揃えば 入る");
  const half = L.buildAcquisition({
    userId: "u", itemKey: "k", acquiredBy: "shop",
    countValue: 60, now: new Date("2026-09-11T02:00:00Z") });
  // ★★「60」だけ 残っても、★何の 60か 分かりません。
  ok(half.count_kind === null && half.count_value === null, "★片方だけなら、どちらも 入れない");
  ok(L.buildAcquisition({ userId: "u", itemKey: "k", acquiredBy: "しらない" }) === null,
    "★知らない 道は、書かない");
  ok(L.buildAcquisition({ itemKey: "k", acquiredBy: "shop" }) === null, "★人が 無ければ 書かない");

  console.log("③ 日は 日本時間");
  // ★★UTC の 夜は、★日本では 次の日です。
  //   ★current_date（UTC）で 決めると、★前の日に なります。
  ok(L.buildAcquisition({ userId: "u", itemKey: "k", acquiredBy: "gift",
    now: new Date("2026-09-11T16:00:00Z") }).acquired_on === "2026-09-12",
    "★UTC 9/11 25時 は、日本の 9/12");

  console.log("④ まだ 見えていないもの");
  ok(L.unseenKeys({ arrivingKeys: ["a", "b", "c"], ownedKeys: ["b"] }).join(",") === "a,c",
    "★持っている ものを 除く");
  ok(L.unseenKeys({ arrivingKeys: ["a", "a", "b"], ownedKeys: [] }).length === 2, "★重なりを 数えない");
  ok(L.unseenKeys({}).length === 0, "★何も 渡されなければ 0");
  ok(L.UNSEEN_HINTS.length === 3, "★きっかけは 3行");
  ok(L.UNSEEN_HINTS.map((h) => h.label).join("／")
    === "記録した 日が たまる／本番を 記録する／季節・行事", "★見本の 3行と 同じ");

  console.log("⑤ 並びは 新しい順");
  const sorted = L.sortLedger([
    { acquired_on: "2026-07-28" }, { acquired_on: "2026-09-08" }, { acquired_on: "2026-08-24" }
  ]);
  ok(sorted[0].acquired_on === "2026-09-08" && sorted[2].acquired_on === "2026-07-28",
    "★新しいものが 上");

  console.log("⑥ 足すだけ ── 書き換える 道が どこにも ない");
  const server = readCode("lib", "itemLedgerServer.js");
  ok(!/\.update\(/.test(server) && !/\.delete\(/.test(server), "★書き換え・消しを 呼んでいない");
  ok(/ignoreDuplicates: true/.test(server), "★2度目は 静かに 落ちる");
  // ★★upsert を 呼ぶなら、★必ず ignoreDuplicates を 付けること。
  //   ★付け忘れると、★2度目が 上書きに なり、★日が 動きます。
  const upserts = (server.match(/\.upsert\(/g) || []).length;
  const guarded = (server.match(/ignoreDuplicates: true/g) || []).length;
  ok(upserts === 1 && guarded === 1,
    `★upsert は 1か所（${upserts}）で、★どれにも 上書きしない 印が ある（${guarded}）`);
  const sql = readRaw("supabase", "2026-09-11-手に入れた日の台帳.sql");
  ok(/grant select on public\.item_acquisitions to authenticated/.test(sql), "★画面には select だけ");
  ok(!/grant (insert|update|delete)[^;]*to authenticated/i.test(sql), "★画面に 書く 権限を 渡していない");
  ok(/revoke all[\s\S]*grant select/.test(sql), "★先に 取り上げ、あとで 渡している");
  ok(/for select/.test(sql) && !/for (insert|update|delete)/i.test(sql), "★面は 読むぶんだけ");
  ok(/unique \(user_id, item_key\)/.test(sql), "★1つの品は 1度だけ");

  console.log("⑦ 埋め戻していない");
  // ★★分からない 日を、きょうで 埋めると 嘘の 台帳に なります。
  ok(!/insert into public\.item_acquisitions/i.test(sql), "★いまある 行に、日を 入れていない");
  ok(!/default current_date/i.test(sql), "★日の 既定を 置いていない（★UTC に なる）");

  console.log("⑧ 「あと◯」を 書いていない");
  const screen = readCode("components", "OwnedLedger.jsx");
  // ★★禁じているのは「★ごほうびまでの 距離」です。
  //   ★★「残ります」「残っていません」は、★動詞です。★数えません。
  //     ★はじめ「残り」で 数えて、★自分の 本文で 落ちました（★同じ 誤りの 6回目）。
  [/あと\s*[0-9０-９]/, /残り\s*[0-9０-９]/, /[0-9０-９]\s*点で/, /まであと/].forEach((re) => {
    ok(!re.test(screen), `★「${re.source}」の 形が 画面に 出ない`);
  });
  ok(!/順位|点数|ランキング/.test(screen), "★順位・点数を 出さない");

  console.log("⑨ 3つの 道が、ぜんぶ 台帳に 残す");
  [["buy", "shop"], ["gift", "gift"], ["unlock", "unlock"]].forEach(([dir, by]) => {
    const r = readCode("app", "api", "character", dir, "route.js");
    ok(/writeAcquisition/.test(r), `★${dir} が 台帳に 書く`);
    ok(new RegExp("ACQUIRED_BY\\.(SHOP|GIFT|UNLOCK)").test(r), `★${dir} が 道を 名乗る`);
  });
  const unlock = readCode("app", "api", "character", "unlock", "route.js");
  // ★★画面から「開きました」を 受け取らないこと。
  ok(!/request\.json\(\)/.test(unlock), "★開いた側から、中身を 受け取らない");
  ok(/unlockSummaryFromRows/.test(unlock) && /unlockedFromSummary/.test(unlock),
    "★こちらで 数え直している");

  console.log("⑩ 決めは 1か所");
  const ch = readCode("lib", "character.js");
  const thresholds = (ch.match(/performances >= \d+/g) || []).length;
  ok(thresholds === 2, "★本番の しきい値は、1か所に 2つだけ（いまは " + thresholds + "）");
  ok((ch.match(/fieldKinds\) \|\| 0\) >= 10/g) || []).length === 1, "★種類の しきい値も 1つだけ");

  console.log("⑪ 4つの 一覧に 入っている");
  [["accountDeletion.js", "退会の 消し込み"], ["exportData.js", "書き出し"],
   ["backupTables.js", "控え"], ["authUserReferences.js", "外の 参照"]].forEach(([f, name]) => {
    ok(readCode("lib", f).includes("item_acquisitions"), "★" + name + " に 入っている");
  });

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
