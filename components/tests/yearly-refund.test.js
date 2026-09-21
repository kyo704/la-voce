#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// 年払いを途中でやめたときに返す額（裁定155 C1・裁定110）の見張り
//
//   確かめること
//     ①裁定155 C1 の表と、1円も違わない
//     ②払った額より多く返さない（★切り上げのため、2つのプランで越えます）
//     ③244点は返さない（お渡し済み）
//     ④学校は入れない（事業者。契約書のとおり）
//     ⑤使った月は1日でも「使った」。日割りにしない
//     ⑥規約に置く字がある
// ============================================================================
const assert = require("assert");
const { loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const R = await loadLib("lib", "yearlyRefund.js");

  見る("①裁定155 C1 の表と 1円も違わない", () => {
    // 裁定の原文をそのまま写します。式から出しません。
    const 表 = { zenbu: 400, student: 200, tsutaeru: 300, shiraberu: 400,
      yosooi: 490, classroom: 2490 };
    for (const [k, v] of Object.entries(表)) {
      assert.strictEqual(R.MONTHLY_REFUND[k], v, k + " が 裁定と 違います");
    }
    // 1か月使ってやめたら、残り11か月ぶん。
    assert.strictEqual(R.refundYen("zenbu", 1), 400 * 11);
    assert.strictEqual(R.refundYen("student", 5), 200 * 7);
  });

  見る("②払った額より 多く 返さない", () => {
    for (const k of Object.keys(R.MONTHLY_REFUND)) {
      const 全 = R.refundYen(k, 0);
      assert.ok(全 <= R.YEARLY_PRICE[k],
        `${k} が 年額を 越えました（${全} > ${R.YEARLY_PRICE[k]}）`);
    }
    // ★越えるのは この2つ だけ です。★上限が 効いて いる ことを 名ざしで 見ます。
    //   ★★効いて いなければ 5,880 と 29,880 に なります。
    assert.strictEqual(R.refundYen("yosooi", 0), 5800);
    assert.strictEqual(R.refundYen("classroom", 0), 29800);
    assert.strictEqual(R.MONTHLY_REFUND.yosooi * 12, 5880, "★較正 ── 切り上げは 残って います");
  });

  見る("③244点は 返さない", () => {
    assert.ok(R.NOT_REFUNDED.includes("244点"));
    assert.ok(/お渡し済み/.test(R.NOT_REFUNDED_LINE), "わけを 書いて いません");
    assert.ok(/残ります/.test(R.NOT_REFUNDED_LINE), "取り上げない ことを 書いて いません");
  });

  見る("④学校は 入れない（事業者・契約書のとおり）", () => {
    assert.strictEqual(R.refundYen("school", 3), null, "★学校に 額を 出して います");
    assert.strictEqual(R.MONTHLY_REFUND.school, undefined);
    // ★0 と null は 別 です。★0 は「0円 返す」、★null は「ここでは 決めない」。
    assert.notStrictEqual(R.refundYen("school", 3), 0);
    // ★★わけが 註に 書いて あるか、は 見ません（★2026-09-21）。
    //   ★★この 検査は A（振る舞い）です。★`readCode` は 註を 落とします。
    //   ★★落ちた 字を 探すと、★いつまでも 見つかりません。
    //   ★★★見張りに 註を 数えさせない。★見るのは 振る舞い だけ です。
  });

  見る("⑤日割りに しない", () => {
    // 1日でも 使えば その月は「使った」。
    assert.strictEqual(R.monthsLeft(0), 12);
    assert.strictEqual(R.monthsLeft(0.9), 12, "★半端な 月を 削って います");
    assert.strictEqual(R.monthsLeft(1), 11);
    assert.strictEqual(R.monthsLeft(1.5), 11);
    assert.strictEqual(R.monthsLeft(12), 0);
    assert.strictEqual(R.monthsLeft(99), 0, "★使いすぎで 負に なって います");
    assert.strictEqual(R.monthsLeft(-1), 0);
    // ★★`null` は「分からない」です。★いちばん 多い 額に しません。
    //   ★★`Number(null)` は 0。★素通りさせると 12か月ぶん 出ます。
    assert.strictEqual(R.monthsLeft(null), 0, "★分からない ものに 満額を 出して います");
    assert.strictEqual(R.monthsLeft(undefined), 0);
    assert.strictEqual(R.monthsLeft(""), 0);
    // ★★0 は 答えです。★「1か月も 使って いない」── ★満額 です。
    assert.strictEqual(R.monthsLeft(0), 12);
  });

  見る("⑥規約に 置く 字が ある", () => {
    assert.ok(/自動で 更新しません/.test(R.YEARLY_TERMS_LINE));
    assert.ok(/未経過/.test(R.YEARLY_TERMS_LINE));
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
