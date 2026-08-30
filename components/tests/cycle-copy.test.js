#!/usr/bin/env node
/**
 * 月経周期の「文言」を、誰にどう見せるか（2026-08-30）
 *
 * ★守りたいこと
 *   ① 機能そのものは、未成年にも止めない（記録も表示も、全部そのまま）
 *   ② 使っていない人の画面に、話題だけが出てこない
 *      （書き出しの説明・退会の一覧に「月経周期」が常に出ていました）
 *   ③ オプトインの説明文を、未成年にも★空にしない
 *      （消すと、切り替えだけがあって説明が無い状態になります）
 */
const { readCode } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

(async () => {
  const cc = await import("../../lib/cycleCopy.js");
  const tr = await import("../../lib/translations.js");
  const vt = readCode("components", "VocalTracker.jsx");

  console.log("=== ★① 機能は未成年にも止めていない ===");
  const cycleCode = readCode("lib", "cycleCopy.js");
  assertTrue(!/track_cycle\s*=\s*false|disableCycle|hideCycleFeature/.test(cycleCode),
    "★機能を止める仕組みを作っていない");
  // 記録の可否は track_cycle だけで決まり、年齢は混ぜない
  const gate = vt.slice(vt.indexOf("cycleFeatureApplies(value) && ("), vt.indexOf("cycleFeatureApplies(value) && (") + 200);
  assertTrue(!/isTreatedAsMinor|is_under_18/.test(gate),
    "★切り替えの表示条件に、年齢が入っていない");

  console.log("\n=== ★② 使っていない人には、話題を出さない ===");
  assertTrue(cc.mentionsCycleInDataLists({ track_cycle: true }) === true, "記録している人には出す");
  assertTrue(cc.mentionsCycleInDataLists({ track_cycle: false }) === false, "★記録していない人には出さない");
  assertTrue(cc.mentionsCycleInDataLists({}) === false, "★未設定でも出さない（フェイルクローズ）");
  assertTrue(cc.mentionsCycleInDataLists(null) === false, "プロフィールが無くても落ちない");
  // ★年齢では分けないこと。使っているかどうかで分けます。
  assertTrue(cc.mentionsCycleInDataLists({ track_cycle: true, is_under_18: true }) === true,
    "★未成年でも、記録していれば自分の書き出しには出る（取り出せなくならない）");

  console.log("\n=== 書き出しの説明から、周期を外してある ===");
  const LANGS = ["ja", "en", "zh", "it", "de", "fr", "es", "ko", "ru"];
  const re = /月経|周期|cycle|Zyklus|ciclo|цикл/i;
  LANGS.forEach((l) => {
    assertTrue(!re.test(tr.TRANSLATIONS.noteExportData[l]),
      `noteExportData（${l}）に周期の語が入っていない`);
  });
  assertTrue(Object.keys(tr.TRANSLATIONS.noteExportDataCycle).length === 9,
    "添える一文は9言語ある");
  assertTrue(/noteExportData"\)\}\{mentionsCycleInDataLists\(profile\)/.test(vt),
    "★画面の側で、記録している人にだけ添えている");
  assertTrue(/mentionsCycleInDataLists\(profile\) \? "・月経周期" : ""/.test(vt),
    "★退会の一覧も、記録している人にだけ出している");

  console.log("\n=== ★③ 説明文を、未成年にも空にしない ===");
  const forMinor = cc.cycleOptInDescription({ is_under_18: true });
  const forAdult = cc.cycleOptInDescription({ is_under_18: false });
  const forUnknown = cc.cycleOptInDescription({});
  assertTrue(typeof forMinor === "string" && forMinor.length > 0, "★未成年にも説明がある（空にしない）");
  assertTrue(forMinor !== forAdult, "未成年には短い言い方になっている");
  assertTrue(forMinor.length < forAdult.length, "★短いほうが未成年向け");
  assertTrue(/記録/.test(forMinor), "★何が起きるかは伝わる（記録できること）");
  assertTrue(/任意/.test(forMinor), "★任意であることは、未成年にも必ず伝える");
  assertTrue(forUnknown === forMinor, "★答えていない人は未成年として扱う（ageGate と同じ）");

  console.log(`\n${failCount === 0 ? "✅ 全て通りました" : "❌ 失敗あり"}  成功:${passCount} 失敗:${failCount}`);
  process.exit(failCount === 0 ? 0 : 1);
})();
