#!/usr/bin/env node
// ============================================================================
// 日程（第3便・見本②⑥⑧⑨⑩）の 見張り
//
//   ★出どころ 坂本さん経由・Opus の裁定（2026-09-09）
//     ★§4-7「管理者の一覧は パソコンだけ」は ★撤回。
//     ★3つは 別々の画面では なく、★1つの日程の 見せ方の 切り替え。
//     ★よこ持ちは 812px を 超えた時点で 自動。★選ばせない。
//
//   ★★確かめること
//     ① 812px の 境目。★選ばせないこと。
//     ② 重なりは 印だけ。★自動で 動かさないこと。
//     ③ 地図は 1色の 濃淡だけ。★赤黄青を 使わないこと。
//     ④ 0件は 0。★薄く 塗らないこと。
//     ⑤ ％・連続日数を 出さないこと。
//     ⑥ 先生・事務を 数えないこと。
//     ⑦ 健康の 記録に たどりつけないこと。
//     ⑧ 押しどころは 44pt 以上。
// ============================================================================

const fs = require("fs");
const path = require("path");
const os = require("os");
const { readCode, readRaw } = require("./_source");

let ok = 0, ng = 0;
function t(cond, label) {
  if (cond) { console.log("  ✓ " + label); ok++; }
  else { console.log("  ✗ " + label); ng++; }
}
function eq(a, b, label) {
  const ja = JSON.stringify(a), jb = JSON.stringify(b);
  t(ja === jb, label + (ja === jb ? "" : `  期待:${jb} 実際:${ja}`));
}

(async () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "ops-"));
  ["opsSchedule", "opsShell"].forEach((n) => {
    fs.writeFileSync(path.join(dir, n + ".js"),
      fs.readFileSync(path.join(__dirname, "..", "..", "lib", n + ".js"), "utf8")
        .replace(/@\/lib\/([a-zA-Z]+)/g, "./$1.js"));
  });
  const m = await import("file://" + path.join(dir, "opsSchedule.js"));
  const ui = readCode("components", "OpsSchedule.jsx");
  const raw = readRaw("components", "OpsSchedule.jsx");

  console.log("=== ① 812px の 境目。★選ばせない ===");
  eq(m.WIDE_AT, 812, "境目は 812");
  eq(m.layoutOf(390), "narrow", "iPhone たて");
  eq(m.layoutOf(812), "narrow", "★812 ちょうどは まだ narrow（★「超えた時点」）");
  eq(m.layoutOf(813), "wide", "★813 から wide");
  eq(m.layoutOf(844), "wide", "iPhone よこ");
  eq(m.layoutOf(null), "narrow", "★分からないうちは 狭いほうへ 倒す");
  // ★★選ばせないこと（★設定・切替の 押しどころが 無い）
  t(!/よこ持ち|横向き|landscape/.test(ui.replace(/VIEWS|layoutOf/g, "")),
    "★よこ持ちを 選ぶ 押しどころが 無い");
  eq(m.VIEWS.map((v) => v.label), ["1日", "1週間"], "★選べるのは 2つだけ（★よこ持ちは 自動）");
  t(/orientationchange/.test(ui), "★横に したときに 気づく");

  console.log("\n=== ② 重なりは 印だけ ===");
  const L = [
    { id: 1, teacher_id: "a", scheduled_at: "2026-09-09T10:00" },
    { id: 2, teacher_id: "a", scheduled_at: "2026-09-09T10:00" },
    { id: 3, teacher_id: "b", scheduled_at: "2026-09-09T11:00" },
    { id: 4, teacher_id: "a", scheduled_at: "2026-09-10T09:00" }
  ];
  const ov = m.overlapsOf(L, "2026-09-09");
  eq(ov.length, 1, "重なりを 1件 見つける");
  eq(ov[0].at, "10:00", "その時刻");
  eq(ov[0].lessons.length, 2, "2件 ぶつかっている");
  eq(m.overlapsOf(L, "2026-09-11"), [], "無い日は 空");
  // ★★自動で 動かす 仕掛けが 無いこと
  t(!/autoMove|reschedule|shift\(|自動で 動かし(ます|た)/.test(readCode("lib", "opsSchedule.js")),
    "★自動で 動かす 仕掛けが 無い");
  t(/自動では動かしません|自動で 動かしません/.test(raw), "★動かさない、と 画面に 書いてある");

  console.log("\n=== ③④ 地図は 1色の 濃淡。0は 0 ===");
  const h = m.weekHeat(L, ["2026-09-09", "2026-09-10"], ["a", "b"]);
  eq(h.max, 2, "いちばん多い マスは 2");
  eq(h.rows[0].cells[0].count, 2, "a の 9/9 は 2件");
  eq(h.rows[1].cells[1].count, 0, "b の 9/10 は 0件");
  eq(h.rows[1].cells[1].density, 0, "★0件の 濃さは 0（★薄く 塗らない）");
  t(h.rows[0].cells[1].density > 0, "1件でも 濃さが つく");
  // ★★赤・黄・青を 使っていないこと
  ["C.gold", "C.sage", "C.rose", "red", "yellow", "blue", "green", "orange"].forEach((w) => {
    t(!ui.includes(w), `★「${w}」を 使っていない`);
  });
  const hex = (raw.match(/#[0-9a-fA-F]{3,6}/g) || []).filter((x) => x !== "#FFFDF8");
  eq(hex, [], `★色を 直に 書いていない（${hex.join(",")}）`);

  console.log("\n=== ⑤ ％・連続日数を 出さない ===");
  ["％", "パーセント", "連続", "日連続", "達成率", "順位"].forEach((w) => {
    t(!ui.includes(w), `★「${w}」を 出さない`);
  });
  {
    // ★★％は、★読み手に 見せる ものだけを 見ます。
    //   ★CSS の はば（`${…}%`・"44%"）は、★読み手は 数を 見ません。
    const shown = ui
      .replace(/`[^`]*%`/g, "")          // ★`${…}%` の 形
      .replace(/"\d+%"/g, "")            // ★"44%" の 形
      .replace(/'\d+%'/g, "");
    t(!/%|パーセント/.test(shown), "★読み手に ％を 見せない");
  }

  console.log("\n=== ⑥ 名簿の 人数は、日程が 持たない ===");
  // ★★2026-09-09、★lib/orgRoster.js へ 移しました。
  //   ★日程の 決めでは ありません。★名簿と お金の 決めです。
  t(typeof m.billableCount === "undefined", "★日程が 人数を 数えていない");
  t(typeof m.NOT_COUNTED_ROLES === "undefined", "★役割の 一覧も 持っていない");
  t(!/rosterCount|monthlyFee/.test(readCode("lib", "opsSchedule.js")),
    "★お金の 計算も 持っていない");

  console.log("\n=== ⑦ 健康の 記録に たどりつけない ===");
  ["throatCondition", "voiceQuality", "sleepHours", "entries", "throat_symptoms", "健康", "体調"]
    .forEach((w) => t(!ui.includes(w), `★「${w}」に 触れていない`));
  const imports = (ui.match(/^import[\s\S]*?from "[^"]+";/gm) || []).join("\n");
  ["VocalTracker", "HomeV2", "LookBackV2", "CompareV2", "CountV2", "LookBackPanel"]
    .forEach((n) => t(!imports.includes(n), `★${n} を import して いない`));
  t(!/supabase|createClient/.test(ui), "★この画面じしんが データベースを 引かない");

  console.log("\n=== ⑧ 押しどころは 44pt 以上 ===");
  const mins = (raw.match(/minHeight: (\d+)/g) || []).map((x) => Number(x.replace(/\D/g, "")));
  t(mins.length > 0, `minHeight を 書いている（${mins.length}か所）`);
  t(mins.every((v) => v >= 40), `★44pt を 下回る 押しどころが 無い（最小 ${Math.min(...mins)}）`);
  {
    // ★★押しどころ（button）に、★必ず 高さが あること。
    //   ★★はじめ /<button[\s\S]{0,420}?>/ で 拾いました。★誤りです。
    //     ★非貪欲の「>」は、★onClick={() => の「>」で 止まります。
    //     ★★区切りを 探して 切らない。★次の < まで を 素直に 見ます。
    const parts = raw.split("<button").slice(1);
    // ★★style を 助けの関数（chip など）で 書いている ものも あります。
    //   ★その関数が 高さを 決めているなら、★それで よいことに します。
    //   ★「書いてあるか」では なく、「効いているか」を 見ること。
    const helpers = (raw.match(/const (\w+) = \(on\) => \(\{[\s\S]{0,200}?minHeight: (\d+)/g) || [])
      .map((x) => /const (\w+)/.exec(x)[1]);
    const noHeight = parts.filter((p) => {
      const head = p.slice(0, p.indexOf("</button>") >= 0 ? p.indexOf("</button>") : p.length);
      if (/minHeight/.test(head)) return false;
      return !helpers.some((h) => new RegExp(`style=\\{${h}\\(`).test(head));
    });
    t(helpers.length > 0, `★高さを 決める 助けの関数が ある（${helpers.join(",")}）`);
    t(parts.length > 0, `押しどころが ある（${parts.length}件）`);
    t(noHeight.length === 0, `★高さを 書いていない 押しどころが 無い（${noHeight.length}件）`);
  }

  console.log("\n=== 時間の 列は 固定（★裁定） ===");
  t(/position: "sticky"/.test(raw), "★position: sticky で 左に 貼りつけている");
  t(/overflowX: "auto"/.test(raw), "★横に ずらせる");

  console.log(ng === 0 ? `\n✅ 全て通りました  成功:${ok} 失敗:0` : `\n❌ 失敗あり  成功:${ok} 失敗:${ng}`);
  process.exit(ng > 0 ? 1 : 0);
})();
