#!/usr/bin/env node
// ============================================================================
// ★共通部品（UiV2）の 字 ── ★門の 中だけ 6段（★2026-09-19・お決め D63(b)）
//
//   ★★坂本さんの お指図 ──
//     ★「今の 個人画面と 開発中の 個人画面は 別。★開発中の 画面だけ 変える」。
//
//   ★★★確かめる こと
//     ①決めは `lib/visualTokens.js` が 1つ だけ 持つ（★画面で 判じない）
//     ②既定は「いまの まま」── ★包み忘れた ところは 変わらない
//     ③6段の ときは 12 以上、★かつ 6段の 中
//     ④8つの 部品が、★自分で 数を 書かず、★`字(…)` を 通る
//     ⑤`layoutV2` の とき だけ 包む（★古い 画面は 包まない）
//     ⑥運営の 画面は 包む（★あちらは 6段 済み）
//
//   ★★較正 ── ★知らない 名は 止まる こと。★黙って 既定を 返さない こと。
// ============================================================================

const assert = require("assert");
const { readRaw, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "visualTokens.js");
  const 段 = m.TYPE_STEPS.map((x) => x.px);
  const 名 = Object.keys(m.UIV2_TYPE);

  見る("道具の 較正 ── ★知らない 名は 止まる", () => {
    assert.throws(() => m.uiv2FontPx("ありません", true), /知らない 部品/);
    assert.throws(() => m.uiv2FontPx("ありません", false), /知らない 部品/);
    // ★当たり ── ★在る 名は 数を 返します。
    assert.strictEqual(typeof m.uiv2FontPx("Li", true), "number");
  });

  見る("①決めは 1か所（★8つ 揃って いる）", () => {
    assert.strictEqual(名.length, 8, "★8つ の はず です");
    ["Li", "Note", "EmptyBox", "Pill", "Seg", "FieldLabel", "Tag", "Lock"]
      .forEach((n) => assert.ok(名.includes(n), "★" + n + " が ありません"));
  });

  見る("②既定は いまの まま（★38人の 字は 変わらない）", () => {
    名.forEach((n) => {
      assert.strictEqual(m.uiv2FontPx(n, false), m.UIV2_TYPE[n].いま);
      assert.ok(m.uiv2FontPx(n, false) < 12,
        "★" + n + " の いまの 大きさが 12 以上に なって います");
    });
  });

  見る("③6段の ときは 12 以上 かつ 6段の 中", () => {
    名.forEach((n) => {
      const v = m.uiv2FontPx(n, true);
      assert.ok(v >= m.MIN_FONT_PX, "★" + n + " が 12 未満 です: " + v);
      assert.ok(段.includes(v), "★" + n + " が 6段の 外 です: " + v);
    });
  });

  const ui = readRaw("components", "UiV2.jsx");

  見る("④8つの 部品が `字(…)` を 通る", () => {
    名.forEach((n) => {
      const re = new RegExp("const 大きさ = 字\\(\"" + n + "\"\\);");
      assert.ok(re.test(ui), "★" + n + " が 門を 通って いません");
    });
    // ★★数を 直に 書いて いない こと（★8つの もとの 大きさ）。
    const もと = 名.map((n) => m.UIV2_TYPE[n].いま);
    もと.forEach((v) => {
      const 直 = new RegExp("fontSize: rem\\(" + String(v).replace(".", "\\.") + "\\)");
      assert.ok(!直.test(ui),
        "★まだ 直に 書いて います: rem(" + v + ")");
    });
  });

  const vt = readRaw("components", "VocalTracker.jsx");

  見る("⑤個人の 画面は `layoutV2` の とき だけ 包む", () => {
    assert.ok(/<TypeStepsOn on=\{layoutV2\}>/.test(vt),
      "★`on={layoutV2}` で 包んで いません");
    // ★★★`on` を 書かずに 包むと、★38人にも かかります。
    assert.ok(!/<TypeStepsOn on=\{true\}>/.test(vt), "★いつも 6段に して います");
  });

  見る("⑥運営の 画面は 包む", () => {
    const i = vt.indexOf("<TypeStepsOn>");
    assert.ok(i > 0, "★運営を 包んで いません");
    const j = vt.indexOf("<OpsShell", i);
    assert.ok(j > i && j - i < 400, "★包みが `OpsShell` から 離れて います");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
