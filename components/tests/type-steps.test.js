#!/usr/bin/env node

// ============================================================================
// ★見張り ── ★文字の 6段（★裁定 その81 §2 ／ その103・2026-09-19）
//
//   ★★★6段 …… 12 ／ 12.5 ／ 13 ／ 13.5 ／ 14.5 ／ 15.5（★16 以上は そのまま）
//   ★★決まり ──「12px より 小さい 字を 使わない」
//
//   ★★★画面ごとに 直して います（★裁定 その103 の 手順）。
//     ★★直し終えた 画面 だけ を 見ます。★まだの 画面は、★ここに 足しません。
//     ★★一度に 直しません。★平坦化（★§9 失敗①）を 繰り返しません。
//
//   ★★★寄せ方（★裁定 その103）
//     ★9〜10.5 → 12 ／ 11〜11.5 → 12.5
//     ★★役で 寄せます。★近い 値で 寄せません。
//
//   ★★較正 ── ★わざと 小さい 字を 作り、★見つかる ことを 確かめます。
// ============================================================================

const assert = require("assert");
const { readCode } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

// ★★直し終えた 画面（★増えたら ここに 足します）。
const 済んだ画面 = [
  ["components", "OpsShell.jsx"],
  ["components", "OpsHome.jsx"],
  ["components", "OpsRoster.jsx"],
  ["components", "OpsSchedule.jsx"],
  // ★★2026-09-19 ── ★運営の 残り 8画面（★裁定 その103 の D60）。
  ["components", "OpsMonka.jsx"],
  ["components", "OpsAttendance.jsx"],
  ["components", "OpsAttendanceBulk.jsx"],
  ["components", "OpsEvents.jsx"],
  ["components", "OpsPeople.jsx"],
  ["components", "OpsPostMatrix.jsx"],
  ["components", "OpsPresets.jsx"],
  ["components", "OpsSettings.jsx"]
];
const 段 = [12, 12.5, 13, 13.5, 14.5, 15.5];

function 大きさ(素) {
  const 出 = [];
  const r = /fontSize:\s*(?:rem\(([0-9.]+)\)|["'`]([0-9.]+)(rem|px))/g;
  let m;
  while ((m = r.exec(素)) !== null) {
    if (m[1]) 出.push(Number(m[1]));
    else 出.push(Number(m[2]) * (m[3] === "rem" ? 16 : 1));
  }
  return 出.map((x) => Math.round(x * 1000) / 1000);
}

見る("道具の 較正", () => {
  assert.deepStrictEqual(大きさ('fontSize: "0.6875rem"'), [11], "★道具が 壊れて います");
  assert.deepStrictEqual(大きさ("fontSize: rem(12.5)"), [12.5], "★道具が 壊れて います");
  assert.deepStrictEqual(大きさ("padding: rem(4)"), [], "★余白を 字と 数えて います");
});

for (const [d, f] of 済んだ画面) {
  見る(`★${f} ── ★12より 小さい 字が ない`, () => {
    const 小 = 大きさ(readCode(d, f)).filter((x) => x < 12);
    assert.deepStrictEqual(小, [], "★小さい 字が あります: " + 小.join("／"));
  });

  見る(`★${f} ── ★6段の 中 か、★16 以上`, () => {
    const 外 = 大きさ(readCode(d, f)).filter((x) => x < 16 && !段.includes(x));
    assert.deepStrictEqual(外, [], "★段の 外が あります: " + 外.join("／"));
  });

  if (f !== "OpsShell.jsx") continue;
  見る(`★${f} ── ★上下の 関係が 残って いる`, () => {
    // ★★★帯の 中 …… ★役職の 名（12.5）＞ 札の 字（12）。
    //   ★★寄せる 前は 11 ＞ 10 でした。★向きが 変わって いない ことを 見ます。
    const 素 = readCode(d, f);
    const 名 = 素.indexOf('opacity: 0.8');
    const 札 = 素.indexOf("C.onCurtainFaint");
    assert.ok(名 > 0 && 札 > 0, "★見る ところが ありません");
    const 近い = (i) => {
      const 前 = 素.slice(Math.max(0, i - 200), i + 200);
      const s = 大きさ(前);
      return s.length ? s[0] : null;
    };
    assert.ok(近い(名) >= 近い(札), "★上下が 入れ替わって います");
  });
}

見る("★段は 6つ の まま（★増やして いない）", () => {
  const t = readCode("lib", "visualTokens.js");
  const m = t.match(/TYPE_STEPS\s*=\s*Object\.freeze\(\[([\s\S]*?)\]\)/);
  assert.ok(m, "★段の 一覧が ありません");
  const n = (m[1].match(/\{/g) || []).length;
  assert.strictEqual(n, 6, "★段が 6つ で ありません（★いま " + n + "）");
});

console.log("\n★" + 数 + "つ 通りました。");
