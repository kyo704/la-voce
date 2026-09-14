#!/usr/bin/env node

// ============================================================================
// ★下の 帯を 押したら、★いちばん 上に 戻ること
//
//   ★出どころ 2026-09-14、★坂本さんの ご報告
//     「★『きょう』で 時間割を 開いた まま、★もう一度『きょう』を 押しても
//       ★時間割の ままで 戻らない」
//
//   ★★実際に 動かして 確かめました。★押す前と 押した後の 字が 完全に 同じ。
//
//   ★★わけ。★帯は 名札を 変えるだけ でした（`onSelect={setActiveTab}`）。
//     ★同じ 帯を 押すと、★名札は すでに その 値。★何も 起きません。
//
//   ★★決まりは `lib/tabReset.js` 1本に 置きます。
//     ★★画面に 書き並べると、★状態を 足した 日に 1つ 抜けます。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

let ok = 0;
let ng = 0;
const t = (c, l) => { if (c) { console.log("  ✓ " + l); ok++; } else { console.log("  ✗ " + l); ng++; } };

(async () => {
  const load = async (rel) => {
    const src = fs.readFileSync(path.join(__dirname, "..", "..", rel), "utf-8");
    return import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  };
  const m = await load("lib/tabReset.js");

  console.log("① 決まりが 1本に ある");
  t(Array.isArray(m.TAB_RESETS) && m.TAB_RESETS.length > 0,
    "★戻す ものの 並びが ある（" + m.TAB_RESETS.length + "）");
  t(typeof m.resetTabState === "function", "★戻す 関数が ある");
  t(typeof m.nextResetKey === "function", "★作り直す ための 数が ある");

  console.log("\n② 戻す ものに、★画面の 行き先が そろって いる");
  const keys = m.TAB_RESETS.map((r) => r.key);
  ["showTimetable", "recordSheet", "recordView", "tellLesson",
    "notesSubTab", "opsOrgId"].forEach((k) => {
    t(keys.includes(k), "★" + k + " を 戻す");
  });
  // ★★書いた ものは 戻しません。★消える ことに なります。
  ["formData", "entries", "myNotes", "profile"].forEach((k) => {
    t(!keys.includes(k), "★" + k + " は 戻さない（★書いた もの）");
  });

  console.log("\n③ 実際に 戻る");
  const seen = {};
  m.resetTabState({
    showTimetable: (v) => { seen.tt = v; },
    recordView: (v) => { seen.rv = v; },
    homeState: (v) => { seen.hs = v; }
  }, "view");
  t(seen.tt === false, "★時間割を 閉じる");
  t(seen.rv === "voice", "★記録の はじめの 節へ");
  t(seen.hs === "view", "★ひつじの はじめの 姿へ（★値は 外から）");
  // ★★渡されなかった ものが あっても 落ちない。
  let threw = false;
  try { m.resetTabState({}, undefined); } catch (e) { threw = true; }
  t(!threw, "★何も 渡さなくても 落ちない");

  console.log("\n④ 作り直す ための 数は 増えるだけ");
  t(m.nextResetKey(3) === 4, "★1つ 増える");
  t(m.nextResetKey(undefined) === 1, "★はじめても 落ちない");
  t(m.nextResetKey("x") === 1, "★数で なくても 落ちない");

  console.log("\n⑤ 画面が、★この 1本に 尋ねて いる");
  const ui = readCode("components", "VocalTracker.jsx");
  t(/from "@\/lib\/tabReset"/.test(ui), "★取り寄せて いる");
  t(/onSelect=\{goTab\}/.test(ui), "★帯が goTab を 呼ぶ");
  t(!/onSelect=\{setActiveTab\}/.test(ui), "★名札を 変えるだけ では ない");
  t(/resetTabState\(\{/.test(ui), "★1本に 尋ねて いる");
  t(/key=\{"notes-" \+ tabResetKey\}/.test(ui),
    "★NotesV2 を 作り直して いる（★中に 状態を 持つ ため）");

  console.log("\n★★この 見張りが 見て いない こと");
  console.log("　★字の 並びだけ を 見ます。★実際に 戻るかは 見て いません。");
  console.log("　★V2 の 帯だけ です。★門の 外（38人）の 帯は 変えて いません。");

  console.log(ng === 0 ? `\n★すべて 通りました（${ok}）` : `\n★${ng} 件 落ちました`);
  process.exit(ng === 0 ? 0 : 1);
})();
