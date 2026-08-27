#!/usr/bin/env node
/**
 * 一時的な認証エラーからの復帰テスト。
 *
 * 【なぜ要るか】
 * 画面を開いた瞬間、7つの useEffect が12本のクエリを並行して投げる。
 * Supabase 側で一時的な認証エラー（PGRST303 など）が起きると、その全部が
 * 同時に失敗する。以前は、失敗したクエリそれぞれが refreshSession() を
 * 呼んでいたので、1回のつまずきで6回の更新が立て続けに走っていた。
 *
 * Supabase はセッションを更新するたびにリフレッシュトークンを作り替える。
 * 同時に何度も更新すると、後から届いた更新が「もう使われたトークン」として
 * 弾かれ、最悪の場合そのままログアウトになる。
 *
 * 【このテストが固定していること】
 *  1. 再試行は1回だけ（無限ループにならない）
 *  2. 同時に何本失敗しても、セッションの更新は1回だけ
 *  3. 認証と関係ないエラーでは、更新も再試行もしない
 */
const fs = require("fs");
const path = require("path");
let passCount = 0, failCount = 0;
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}`); console.log(`      期待値: ${JSON.stringify(b)}`); console.log(`      実際値: ${JSON.stringify(a)}`); failCount++; }
}
function assertTrue(c, label) { if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; } }

// VocalTracker.jsx から、認証リトライまわりの一続きの部分をそのまま取り出す。
// （実装をコピーせず、本物のソースを読んで動かす）
//
// ★取り出した部分が import している名前は、ここで渡してやる必要がある。
//   new Function の中には import が届かないため。
//   新しい import を使い始めたら、ここに足すこと。足し忘れると ReferenceError で落ちる。
async function loadAuthRetry() {
  const timeoutSrc = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "withTimeout.js"), "utf-8");
  const timeoutMod = await import("data:text/javascript;base64," + Buffer.from(timeoutSrc, "utf-8").toString("base64"));
  return buildAuthRetry(timeoutMod);
}
function buildAuthRetry(timeoutMod) {
  const src = fs.readFileSync(path.join(__dirname, "..", "VocalTracker.jsx"), "utf-8");
  const start = src.indexOf("function isTransientAuthError(error)");
  if (start < 0) throw new Error("isTransientAuthError が見つかりません");
  const endMarker = "async function runQueryWithAuthRetry(supabase, queryFn, label) {";
  const endStart = src.indexOf(endMarker);
  if (endStart < 0) throw new Error("runQueryWithAuthRetry が見つかりません");
  // runQueryWithAuthRetry の閉じ括弧まで
  let depth = 0, i = endStart + endMarker.length - 1, end = -1;
  for (; i < src.length; i++) {
    if (src[i] === "{") depth++;
    else if (src[i] === "}") { depth--; if (depth === 0) { end = i + 1; break; } }
  }
  if (end < 0) throw new Error("runQueryWithAuthRetry の終わりが見つかりません");
  const body = src.slice(start, end);
  // eslint-disable-next-line no-new-func
  return new Function(
    "withTimeout", "QUERY_TIMEOUT_MS", "AUTH_TIMEOUT_MS",
    `${body}\nreturn { isTransientAuthError, runQueryWithAuthRetry };`
  )(timeoutMod.withTimeout, timeoutMod.QUERY_TIMEOUT_MS, timeoutMod.AUTH_TIMEOUT_MS);
}

// refreshSession() が何回呼ばれたかを数える、偽の supabase
function makeFakeSupabase() {
  const calls = { refresh: 0 };
  return {
    calls,
    auth: {
      refreshSession: async () => {
        calls.refresh++;
        await new Promise((r) => setTimeout(r, 50)); // 実際の通信のように少し待つ
        return { data: {}, error: null };
      }
    }
  };
}

const JWT_FUTURE = { code: "PGRST303", message: 'JWT issued at future' };

async function main() {
  const { isTransientAuthError, runQueryWithAuthRetry } = await loadAuthRetry();

  console.log("=== テスト1: 一時的な認証エラーの見分け ===");
  assertEqual(isTransientAuthError(JWT_FUTURE), true, "PGRST303 は一時的な認証エラー");
  assertEqual(isTransientAuthError({ status: 401 }), true, "401 も一時的な認証エラー");
  assertEqual(isTransientAuthError({ message: "JWT expired" }), true, "JWT を含むメッセージも");
  assertEqual(isTransientAuthError({ code: "42501", message: "permission denied" }), false,
    "★権限不足は一時的ではない（再試行してはいけない）");
  assertEqual(isTransientAuthError({ code: "23505", message: "duplicate key" }), false,
    "★入力の誤りも一時的ではない");
  assertEqual(isTransientAuthError(null), false, "エラーが無ければ false");

  console.log("\n=== テスト2: 再試行は1回だけ（無限ループにならない） ===");
  {
    const supabase = makeFakeSupabase();
    let attempts = 0;
    const result = await runQueryWithAuthRetry(supabase, async () => {
      attempts++;
      return { data: null, error: JWT_FUTURE }; // 何度やっても失敗し続ける
    }, "テスト");
    assertEqual(attempts, 2, "★最初の1回＋再試行1回で、2回で打ち切る");
    assertEqual(result.error.code, "PGRST303", "最後のエラーはそのまま返る");
  }

  console.log("\n=== テスト3: 成功したら再試行しない ===");
  {
    const supabase = makeFakeSupabase();
    let attempts = 0;
    const result = await runQueryWithAuthRetry(supabase, async () => {
      attempts++;
      return { data: [1], error: null };
    }, "テスト");
    assertEqual(attempts, 1, "1回で済む");
    assertEqual(supabase.calls.refresh, 0, "セッションの更新も走らない");
    assertEqual(result.data, [1], "データはそのまま返る");
  }

  console.log("\n=== テスト4: 権限不足では、更新も再試行もしない ===");
  {
    const supabase = makeFakeSupabase();
    let attempts = 0;
    await runQueryWithAuthRetry(supabase, async () => {
      attempts++;
      return { data: null, error: { code: "42501", message: "permission denied" } };
    }, "テスト");
    assertEqual(attempts, 1, "★再試行しない（権限は待っても増えない）");
    assertEqual(supabase.calls.refresh, 0, "セッションの更新も走らない");
  }

  console.log("\n=== テスト5: ★同時に6本失敗しても、セッションの更新は1回だけ ===");
  {
    // 別モジュールとして読み直し、更新の回数をまっさらな状態から数える
    const { runQueryWithAuthRetry: run } = await loadAuthRetry();
    const supabase = makeFakeSupabase();
    // 画面を開いた瞬間の6本を、同時に投げる。全部が認証エラーで返る想定。
    const labels = ["記録データ", "質問票", "テッシトゥーラ", "役マスタ", "案件マスタ", "プロフィール"];
    const results = await Promise.all(labels.map((label) =>
      run(supabase, async () => ({ data: null, error: JWT_FUTURE }), label)
    ));
    // 6本すべてが1回目に失敗したあと、更新は1回だけ走っているはず
    assertEqual(supabase.calls.refresh, 1,
      "★6本が同時に失敗しても、refreshSession() は1回しか呼ばれない");
    assertEqual(results.length, 6, "6本ぶんの結果が返る");
  }

  console.log("\n=== テスト6: 直後にもう1本失敗しても、更新を重ねない ===");
  {
    const { runQueryWithAuthRetry: run } = await loadAuthRetry();
    const supabase = makeFakeSupabase();
    await run(supabase, async () => ({ data: null, error: JWT_FUTURE }), "1本目");
    assertEqual(supabase.calls.refresh, 1, "1本目で1回だけ更新する");
    await run(supabase, async () => ({ data: null, error: JWT_FUTURE }), "2本目");
    assertEqual(supabase.calls.refresh, 1,
      "★続けて失敗しても、更新は増えない（更新したてのトークンで再試行すれば足りる）");
  }

  console.log("\n=== テスト7: 呼び出し側がクエリを組み立て直せること ===");
  {
    const { runQueryWithAuthRetry: run } = await loadAuthRetry();
    const supabase = makeFakeSupabase();
    const built = [];
    let firstRound = true;
    await run(supabase, async () => {
      built.push("組み立て");
      if (firstRound) { firstRound = false; return { data: null, error: JWT_FUTURE }; }
      return { data: [], error: null };
    }, "テスト");
    assertEqual(built.length, 2,
      "★再試行のたびにクエリを組み立て直している（使い回すと古いトークンのまま飛ぶ）");
  }

  console.log("\n=== テスト8: ★返ってこないクエリは打ち切る（画面が止まらない） ===");
  {
    // 制限時間だけ短くして、実際の待ち時間をテスト用に縮める
    const timeoutSrc = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "withTimeout.js"), "utf-8");
    const real = await import("data:text/javascript;base64," + Buffer.from(timeoutSrc, "utf-8").toString("base64"));
    const { runQueryWithAuthRetry: run } = buildAuthRetry({
      withTimeout: real.withTimeout, QUERY_TIMEOUT_MS: 120, AUTH_TIMEOUT_MS: 120
    });
    const supabase = makeFakeSupabase();
    const started = Date.now();
    // いつまでも返ってこないクエリ（Supabase が応答しない状態）
    const result = await run(supabase, () => new Promise(() => {}), "記録データの取得");
    const elapsed = Date.now() - started;
    assertTrue(result && result.error, "★永久に待たず、エラーとして返る");
    assertTrue(elapsed < 2000, `打ち切りまで ${elapsed}ms（永久に待たない）`);
    assertEqual(supabase.calls.refresh, 0,
      "時間切れは認証エラーではないので、セッションの更新は走らない");
  }

  console.log("\n=== テスト9: 遅いだけのクエリは、待って成功させる ===");
  {
    const timeoutSrc = fs.readFileSync(path.join(__dirname, "..", "..", "lib", "withTimeout.js"), "utf-8");
    const real = await import("data:text/javascript;base64," + Buffer.from(timeoutSrc, "utf-8").toString("base64"));
    const { runQueryWithAuthRetry: run } = buildAuthRetry({
      withTimeout: real.withTimeout, QUERY_TIMEOUT_MS: 500, AUTH_TIMEOUT_MS: 500
    });
    const supabase = makeFakeSupabase();
    const result = await run(supabase, async () => {
      await new Promise((r) => setTimeout(r, 100));
      return { data: [1, 2], error: null };
    }, "記録データの取得");
    assertEqual(result.data, [1, 2], "★少し遅いだけなら、ちゃんと待って結果を返す");
  }

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
