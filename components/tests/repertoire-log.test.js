// ============================================================================
// レパートリー（★歌った曲の控え）── 第1段（2026-09-07）
//
//   出どころ Opus「記録と分析を、楽しいものにする」§3
//
//   ★★これは「控え」であって、「分析」ではありません。
//     ★ゲートを掛けないこと。★体について何も言わないからです。
//   ★★褒めない・勧めない・責めない。★数えて、並べるだけです。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  // ★同じ曲かの判断は lib/repertoireTitle.js が持ちます。★埋めこんで読みます。
  let src = fs.readFileSync(path.join(ROOT, "lib", "repertoireLog.js"), "utf-8");
  const dep = fs.readFileSync(path.join(ROOT, "lib", "repertoireTitle.js"), "utf-8");
  const fn = dep.slice(dep.indexOf("export function repertoireKey")).split("\n\n")[0];
  src = src.replace(/import \{ repertoireKey \} from "@\/lib\/repertoireTitle";/, fn);
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  const entries = {
    "2026-09-04": { activities: [{ kind: "本番", items: [{ repertoireName: "Caro mio ben" }] }] },
    "2026-09-01": { activities: [{ kind: "レッスン", items: [
      { repertoireName: "caro mio  ben" },
      { repertoireName: "Lascia ch'io pianga" }] }] },
    "2026-08-20": { activities: [{ kind: "自主練習", items: [{ repertoireName: "Caro Mio Ben " }] }] },
    "2026-07-01": { activities: [{ kind: "本番", items: [{ repertoireName: "La ci darem, Zerlina" }] }] }
  };
  const log = m.repertoireLog(entries);

  console.log("■ 数え方");
  ok("曲の数が合っている", log.length === 3, "実際は " + log.length);
  // ★★書き方のゆらぎを、別の曲にしないこと。
  //   ★大文字小文字・全角半角・空白の数・末尾の空白。
  ok("★ゆらぎは、同じ曲としてまとまる", log[0].count === 3, "実際は " + log[0].count);
  // ★★表示は生の名前、★照合は正規化した鍵（レパートリー負荷パッチ §2.2）。
  ok("★綴りは、いちばん新しい書き方", log[0].name === "Caro mio ben", log[0].name);
  ok("最後に歌った日が出る", log[0].lastDate === "2026-09-04", log[0].lastDate);
  ok("回数の多い順", log[0].count >= log[1].count);
  ok("活動の種類も数えている", log[0].kinds && log[0].kinds["本番"] === 1);
  ok("曲名の無い記録で、落ちない",
    m.repertoireLog({ "2026-09-01": { activities: [{ kind: "休養", items: [] }] } }).length === 0);
  ok("記録が無くても、落ちない", m.repertoireLog(null).length === 0);

  console.log("■ 言い方");
  ok("1行の形が合っている",
    m.repertoireLine(log[0]) === "Caro mio ben — 3回 — 最後 9/4",
    m.repertoireLine(log[0]));
  const code = readCode("lib", "repertoireLog.js");
  // ★★褒めない・勧めない・責めない。
  ok("★褒めていない", !/すごい|さすが|よく歌って|えらい/.test(code));
  ok("★勧めていない", !/しましょう|そろそろ|おすすめ|してみては/.test(code));
  ok("★責めていない", !/ぶりです|久しぶり|忘れて|さぼ/.test(code));

  console.log("■ 書き出し");
  const csv = m.toCsv(log);
  ok("★Excel のために BOM を付けている", csv.charCodeAt(0) === 0xFEFF);
  // ★★カンマの入る曲名がある。★囲まないと、列がずれます。
  ok("★カンマ入りの曲名を、囲んでいる", csv.includes('"La ci darem, Zerlina"'));
  ok("見出しの行がある", csv.includes("曲名,回数,最後に歌った日"));
  ok("行の数が合っている", csv.trim().split("\r\n").length === log.length + 1);
  ok("ファイル名に日付が入る",
    m.exportFileName("2026-09-07") === "woolsong-レパートリー-2026-09-07.csv");

  console.log("■ 画面");
  const vt = readCode("components", "VocalTracker.jsx");
  ok("ノートの中に置いている", /notesSubTab === "repertoire"/.test(vt));
  // ★★分析ではありません。★ゲートを掛けないこと。
  ok("★ゲートを掛けていない",
    !/repertoire[\s\S]{0,300}gateAllows|gateAllows[\s\S]{0,200}repertoire/.test(vt));
  ok("書き出しの入口がある", /書き出す（CSV）/.test(vt));
  ok("何も無いときの言葉がある", /記録のときに曲名を入れると、ここに並びます/.test(vt));
  // ★★「まだ」と書かないこと（★no-nagging-words が見ています）。
  //   ★「まだ」は、★足りていない、と読めます。★急かす言い方です。
  ok("★「まだ」と書いていない", !/まだ曲名/.test(vt));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
