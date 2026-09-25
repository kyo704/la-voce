#!/usr/bin/env node
// STRIP: A（振る舞い）
// ============================================================================
// 録画は YouTube の URL だけ（裁定157 T6）の見張り
//
//   確かめること
//     ①動画ファイルを受け取る口が、どこにも無い
//     ②通すのは YouTube だけ。Vimeo は通さない
//     ③https だけ。http は通さない
//     ④埋める前の4つの問いがあり、答えをしまわない
//     ⑤4つとも「はい」のときだけ足せる
// ============================================================================
const assert = require("assert");
const fs = require("fs");
const path = require("path");
const { loadLib, readCode, readRaw, ROOT } = require("./_source");

let 数 = 0;
function 見る(名, f) { f(); 数 += 1; console.log("  ○ " + 名); }

(async () => {
  const P = await loadLib("lib", "portfolio.js");

  見る("①動画ファイルを 受け取る 口が 無い", () => {
    // ★★画面ぜんぶを 見ます。★1つでも 在れば 止めます。
    const 見つかった = [];
    const 歩く = (d) => {
      for (const e of fs.readdirSync(d, { withFileTypes: true })) {
        const p = path.join(d, e.name);
        if (e.isDirectory()) {
          if (["node_modules", ".next", "tests"].includes(e.name)) continue;
          歩く(p);
          continue;
        }
        if (!/\.(js|jsx)$/.test(e.name)) continue;
        const s = readCode(...path.relative(ROOT, p).split(path.sep));
        // ★動画を 受け取る 形 ── ★`accept` に 動画、★storage への 置き。
        if (/accept=["'][^"']*video/i.test(s)) 見つかった.push(p + "（accept に video）");
        if (/accept=["'][^"']*\.(mp4|mov|avi|mkv|webm)/i.test(s)) 見つかった.push(p + "（accept に 動画の 形）");
        // ★★★2026-09-25 まで、★`.storage.from(` は どこに あっても 赤 でした。
        //   ★★Storage を 1度も 使って いなかった ので、★それで 足りて いました。
        //   ★★★裁定199 で 写真を 置く ことに なりました（★`portfolio-photos`）。
        //     ★このままだと、★写真の 口が「動画の 口」として 赤く なります。
        //   ★★★守る ものは 変わりません ──「動画そのものは お預かりしません」。
        //     ★だから 見る ものを、★**何を 受け取るか** に 直します。
        //     ★★置いて いても、★受け取る 形が 絵 だけ なら よい のです。
        if (/\.storage\.from\(/.test(s)) {
          // ★★★`mov` は `remove(` の 中に あります。★`avi` も 語の 中に よく 出ます。
          //   ★★2026-09-25、★`.remove([path])` が「動画」と 見られました。
          //     ★形の 名は **点の あと** か、★`video/` の 形で だけ 見ます。
          const 絵だけ = /ACCEPT_TYPES/.test(s)
            && !/video\//i.test(s)
            && !/["'.\/](mp4|mov|avi|mkv|webm)\b/i.test(s);
          if (!絵だけ) 見つかった.push(p + "（storage に 置いて います）");
        }
      }
    };
    for (const d of ["components", "lib", "app"]) 歩く(path.join(ROOT, d));
    // ★★★入れもの（bucket）の ほうも 見ます ── ★動画の 形を 受け取って いないか。
    //   ★★画面が 絵だけ でも、★入れものが 動画を 通すなら 口が 開いて います。
    const bucket = readRaw("supabase", "migration_portfolio_photos_bucket.sql");
    if (/video\//i.test(bucket) || /["'.\/](mp4|mov|avi|mkv|webm)\b/i.test(bucket)) {
      見つかった.push("supabase/migration_portfolio_photos_bucket.sql（入れものが 動画を 通します）");
    }
    if (!/allowed_mime_types/.test(bucket)) {
      見つかった.push("supabase/migration_portfolio_photos_bucket.sql（受け取る 形を 決めて いません）");
    }
    assert.deepStrictEqual(見つかった, [], "★動画を 受け取る 口が あります:\n" + 見つかった.join("\n"));
  });

  見る("②通すのは YouTube だけ（Vimeo は 通さない）", () => {
    assert.strictEqual(P.urlOk("https://www.youtube.com/watch?v=x"), true);
    assert.strictEqual(P.urlOk("https://youtu.be/x"), true);
    assert.strictEqual(P.urlOk("https://m.youtube.com/watch?v=x"), true);
    // ★Vimeo は 音楽の 権利の 扱いが 確かめられて いません（裁定157 T6）。
    assert.strictEqual(P.urlOk("https://vimeo.com/1"), false, "★Vimeo を 通して います");
    assert.strictEqual(P.urlOk("https://example.com/a.mp4"), false);
    assert.ok(P.ALLOWED_HOSTS.indexOf("vimeo.com") < 0);
  });

  見る("③https だけ", () => {
    assert.strictEqual(P.urlOk("http://www.youtube.com/watch?v=x"), false, "★http を 通して います");
    assert.strictEqual(P.urlOk(""), false);
    assert.strictEqual(P.urlOk(null), false);
    // ★★似た 名前で すり抜けない こと。
    assert.strictEqual(P.urlOk("https://youtube.com.example.jp/x"), false,
      "★名前の 頭が 同じ だけの ところを 通して います");
  });

  見る("④4つの 問いが あり、答えを しまわない", () => {
    assert.strictEqual(P.RECORDING_ASKS.length, 4);
    assert.ok(/残りません/.test(P.RECORDING_ASKS_NOTE), "★残らない ことを 言って いません");
    // ★★台帳に しまう 列を 作って いない こと。
    const src = readCode("lib", "portfolio.js");
    assert.ok(!/answers?\s*:/.test(src), "★答えを 持つ ところが あります");
    assert.ok(P.NEVER_STORED.length > 0);
  });

  見る("⑤4つとも「はい」の ときだけ", () => {
    assert.strictEqual(P.mayAddRecording([true, true, true, true]), true);
    // ★★1つずつ 否に して、★どれでも 止まる ことを 見ます。
    for (let i = 0; i < 4; i += 1) {
      const a = [true, true, true, true];
      a[i] = false;
      assert.strictEqual(P.mayAddRecording(a), false, `★${i + 1}つ目が 否でも 通りました`);
    }
    assert.strictEqual(P.mayAddRecording([]), false);
    assert.strictEqual(P.mayAddRecording(null), false);
    // ★★「はい」でない ものを「はい」と 読まない こと。
    assert.strictEqual(P.mayAddRecording(["yes", "yes", "yes", "yes"]), false);
    assert.strictEqual(P.mayAddRecording([1, 1, 1, 1]), false);
  });

  console.log("\n★" + 数 + "つ 通りました。");
})().catch((e) => { console.error("★止まりました ──", e.message); process.exit(1); });
