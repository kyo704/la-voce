#!/usr/bin/env node
// ============================================================================
// ★15歳未満は 登録できない（★お決め 6㋐・2026-09-20）の 見張り
//
//   ★★★坂本さんの お決め ── ★㋐（受け入れない。★登録の ときに 弾く）。
//     ★★㋑（保護者の 同意を 取る 仕組み）は 作りません。
//
//   ★★★確かめる こと
//     ①帯は 3つ（15歳未満／15〜17歳／18歳以上）
//     ②15歳未満 だけ 登録できない
//     ③答えて いない 方は 弾かない（★分からない ＝ 15歳未満 では ない）
//     ④押した あとで 断らない ── ★押す 前に 止める
//     ⑤断りの 字に「法律」を 書かない（★私たちの 決め です）
//     ⑥帯を `profiles` へ 移す 道が ある（★上書きしない）
//
//   ★★較正 ── ★弾く 帯と、★弾かない 帯の 両方で 試します。
// ============================================================================

const assert = require("assert");
const { readCode, loadLib } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const m = await loadLib("lib", "ageGate.js");
  const ui = readCode("components", "SignupForm.jsx");

  見る("①帯は 3つ", () => {
    assert.strictEqual(m.SIGNUP_BANDS.length, 3);
    assert.deepStrictEqual(m.SIGNUP_BANDS.map((b) => b.key),
      ["under15", "teen", "adult"]);
  });

  見る("②15歳未満 だけ 登録できない", () => {
    assert.strictEqual(m.maySignUp("under15"), false);
    assert.strictEqual(m.maySignUp("teen"), true);
    assert.strictEqual(m.maySignUp("adult"), true);
  });

  見る("③答えて いない 方は 弾かない", () => {
    assert.strictEqual(m.maySignUp(null), true);
    assert.strictEqual(m.maySignUp(undefined), true);
  });

  見る("④押す 前に 止める", () => {
    assert.ok(/disabled=\{status === "loading" \|\| !maySignUp\(form\.ageBand\)\}/.test(ui),
      "★押せない ように して いません");
    assert.ok(/SIGNUP_REFUSE_LINE/.test(ui), "★わけを 出して いません");
  });

  見る("⑤断りに「法律」を 書かない", () => {
    assert.ok(!/法律|法令|法で/.test(m.SIGNUP_REFUSE_LINE), "★断言して います");
    assert.ok(/私たちの 決まり/.test(m.SIGNUP_REFUSE_LINE), "★誰の 決めかを 書いて いません");
    assert.ok(/いま/.test(m.SIGNUP_REFUSE_LINE), "★いまの ことだと 書いて いません");
  });

  見る("⑥帯を 移す 道（★上書きしない）", () => {
    assert.strictEqual(typeof m.adoptSignupBand, "function");
    // ★★当たり ── ★まだ 帯が 無ければ 移します。
    const 出 = m.adoptSignupBand({ age_band: null }, "teen", "2026-09-20T00:00:00Z");
    assert.ok(出 && 出.age_band === "teen", "★移せて いません");
    // ★★外れ ── ★すでに 在れば 触りません。
    assert.strictEqual(m.adoptSignupBand({ age_band: "adult" }, "teen"), null,
      "★上書きして います");
    // ★★知らない 字は 受け取りません。
    assert.strictEqual(m.adoptSignupBand({ age_band: null }, "なんとか"), null,
      "★知らない 字を しまって います");
  });

  見る("⑦送る 中身に 帯が 入る", () => {
    assert.ok(/age_band: form\.ageBand/.test(ui), "★帯を 送って いません");
    assert.ok(/is_under_18: form\.ageBand !== "adult"/.test(ui),
      "★古い 道の ぶんを 送って いません");
  });

  console.log("\n★" + 数 + "つ 通りました。");
})();
