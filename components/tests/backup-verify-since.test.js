// 古い控えを検査したときに、嘘の異常が出ないこと（2026-09-03）
//
//   ★なぜ要るか
//     9/1 の控えを検査したら3つの表が「入っていない」と出て、
//     ★「このバックアップは使えません」になりました。
//     ですが link_consents は 9/1 17:01、org_events は 9/2 06:45 に
//     設計したもので、★控え（9/1 12:05）より後です。
//     存在しない表は pg_dump には入れられません。
//   ★これは見た目の問題ではありません。
//     復元の練習のたびに赤い ❌ が出ると、
//     ★本物の異常と見分けがつかなくなります。
const { readCode } = require("./_source");
const fs = require("fs");
const path = require("path");

let 通 = 0, 否 = 0;
const ok = (名, 条) => 条 ? (通++, console.log("  ✓ " + 名)) : (否++, console.log("  ✗ " + 名));
const 根 = path.join(__dirname, "..", "..");
const 取込 = (p) => import("data:text/javascript;base64," +
  Buffer.from(fs.readFileSync(path.join(根, p), "utf8")).toString("base64"));

(async () => {
  const B = await 取込("lib/backupTables.js");
  const V = readCode("scripts/backup-verify.js");

  console.log("\n① 台帳が「いつからか」を持っていること");
  const 遅い = B.BACKUP_TABLES.filter((t) => t.since);
  ok("since を持つ表がある", 遅い.length >= 3);
  for (const t of 遅い) {
    ok(`${t.table} の since が日付として読める`, !isNaN(new Date(t.since)));
  }
  // ★9/1 の控えより後にできた表が、ちゃんと印されているか。
  for (const 名 of ["link_consents", "org_events", "org_event_participants",
                    "notice_batches", "notice_targets"]) {
    const t = B.BACKUP_TABLES.find((x) => x.table === 名);
    ok(`${名} に since がある`, !!(t && t.since));
  }
  ok("★最初からある表には since が無い",
    !B.BACKUP_TABLES.find((t) => t.table === "entries").since);

  console.log("\n② 検査が、控えの日時を見ていること");
  ok("ファイル名から日時を読む関数がある", /function dumpTakenAt\(/.test(V));
  ok("その表があったかを判定する関数がある", /function existedAt\(/.test(V));
  ok("★日時が読めないときは、全部要るものとして測る",
    /if \(!takenAt\) return true;/.test(V));
  ok("★since が無ければ、最初からあるものとして扱う",
    /if \(!since\) return true;/.test(V));

  console.log("\n③ ★基準（baseline）を、古い控えで壊さないこと");
  ok("古い控えでは更新しない判定がある", /より古いためです/.test(V));
  // ★toISOString は UTC に直します。ファイル名の時刻は現地時刻なので、
  //   使うと日本では9時間ずれます。実際に 12:05 が 03:05 になっていました。
  ok("★現地時刻で書く関数がある", /function 現地時刻\(/.test(V));
  ok("★基準の書き込みに toISOString を使っていない",
    !/takenAt: .*toISOString/.test(V));
  ok("★控えの日時を書く（検査した日時ではない）",
    /takenAt: 現地時刻\(takenAt \|\| new Date\(\)\)/.test(V));

  console.log("\n④ 実物で確かめる");
  const 控え = path.join(根, "backups", "woolsong-20260901-120526.sql");
  if (!fs.existsSync(控え)) {
    console.log("  ・ 控えが手元にないので、この節はとばします");
  } else {
    const { execFileSync } = require("child_process");
    let 出力 = "";
    try {
      出力 = execFileSync("node", [path.join(根, "scripts", "backup-verify.js"), 控え],
        { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
    } catch (e) { 出力 = String(e.stdout || "") + String(e.stderr || ""); }
    ok("★9/1 の控えが、異常なしで通る", /問題ありません/.test(出力));
    ok("★後からできた表は「後にできた」と出る", /この控えより後にできた表/.test(出力));
    ok("★「使えません」と出ない", !/このバックアップは使えません/.test(出力));
  }

  console.log(`\n合計 ${通 + 否} 本：通過 ${通}／失敗 ${否}`);
  process.exit(否 ? 1 : 0);
})();
