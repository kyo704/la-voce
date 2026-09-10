// ============================================================================
// ★自動で 新しい版に する ── 見張り（★2026-09-11）
//
//   ★出どころ 坂本さんの お決め（2026-09-11）
//     「★書きかけが あるときは、★次に その画面を 離れるまで 待つ。
//       ★通知も 出さない」
//
//   ★★この 仕組みが 生まれた いきさつ。
//     ★きょう、★配信したのに 実機が 変わらない、が 起きました。
//     ★★Service Worker が、★覚えた 古い HTML を 配っていました。
//     ★★SW の 版を いくら 見ても、★見つかりません。
//     ★だから、★配信されている 版そのものを 見ます。
//
//   ★★確かめること
//     ① 書きかけが あるときは、★読み込み直さないこと。★いちばん 重い 決まり。
//     ② ループを 起こさないこと（★守り 4つ）。
//     ③ 通知を 出さないこと。
//     ④ 手元の 組み立て（dev）では 何も しないこと。
//     ⑤ つながらないときに 落ちないこと。
//     ⑥ 時計を 自分で 見ないこと（★受け取る）。
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode, readRaw } = require("./_source");

let failed = 0;
function ok(cond, label) {
  if (cond) { console.log("  ok  " + label); }
  else { console.log("  NG  " + label); failed++; }
}

(async () => {
  const ROOT = path.join(__dirname, "..", "..");
  const src = fs.readFileSync(path.join(ROOT, "lib", "autoUpdate.js"), "utf8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));
  const {
    shouldReload, isStale, fetchLiveSha, bakedSha,
    RELOAD_COOLDOWN_MS, POLL_MS, readLastReloadAt, markReloaded
  } = m;

  const base = { baked: "abc1234", live: "def5678", dirty: false, already: false, lastAt: 0, now: 9e9 };

  console.log("① 書きかけが あるときは しない");
  ok(shouldReload(base) === true, "★書きかけが 無ければ する");
  ok(shouldReload({ ...base, dirty: true }) === false, "★書きかけが あれば しない");
  // ★★これが 崩れると、★書いている ものが 消えます。★いちばん 重い 決まりです。
  ok(/if \(x\.dirty\) return false;/.test(src), "★書きかけの 守りが ある");

  console.log("② ループを 起こさない（★守り 4つ）");
  ok(shouldReload({ ...base, baked: null }) === false, "★①版が 分からなければ しない");
  ok(shouldReload({ ...base, live: null }) === false, "★配信が 返らなければ しない");
  ok(shouldReload({ ...base, already: true }) === false, "★②1ページ 1回だけ");
  ok(shouldReload({ ...base, lastAt: 9e9 - 1000 }) === false, "★③直前に していたら しない");
  ok(shouldReload({ ...base, lastAt: 9e9 - RELOAD_COOLDOWN_MS - 1 }) === true, "★時間が 経てば する");
  ok(shouldReload({ ...base, live: "abc1234" }) === false, "★同じ版なら しない");
  ok(shouldReload() === false, "★何も 渡さなくても 落ちない");
  ok(RELOAD_COOLDOWN_MS >= 10000, "★間を おく（" + RELOAD_COOLDOWN_MS + "ms）");

  console.log("③ 通知を 出さない");
  const v = readCode("components", "VocalTracker.jsx");
  const at = v.indexOf("const tryReload = ");
  const fn = v.slice(at, at + 700);
  ok(at > 0, "★読み込み直す ところが ある");
  ok(!/setToastMessage|confirm\(|alert\(/.test(fn), "★通知も 確認も 出さない");
  ok(/window\.location\.reload\(\)/.test(fn), "★黙って 新しく なる");

  console.log("④ 手元の 組み立てでは 何も しない");
  ok(bakedSha() === null || typeof bakedSha() === "string", "★版が 読める");
  ok(/v === "dev" \|\| v === "unknown"/.test(src), "★dev と unknown を 外している");
  ok(/if \(!baked\) return undefined;/.test(readRaw("components", "VocalTracker.jsx")),
    "★版が 分からなければ、★見張りを 始めない");

  console.log("⑤ つながらなくても 落ちない");
  const bad = await fetchLiveSha(async () => { throw new Error("つながりません"); }, 10);
  ok(bad === null, "★落ちずに null");
  const notOk = await fetchLiveSha(async () => ({ ok: false }), 10);
  ok(notOk === null, "★返事が 悪くても null");
  const weird = await fetchLiveSha(async () => ({ ok: true, json: async () => ({}) }), 10);
  ok(weird === null, "★中身が 無くても null");
  const unknown = await fetchLiveSha(async () => ({ ok: true, json: async () => ({ short: "unknown" }) }), 10);
  ok(unknown === null, "★unknown は 版と 見なさない");
  const good = await fetchLiveSha(async () => ({ ok: true, json: async () => ({ short: "def5678" }) }), 10);
  ok(good === "def5678", "★ふつうに 返れば 読める");
  ok(readLastReloadAt() === 0, "★覚え書きが 読めなくても 0");
  markReloaded(1); // ★落ちないこと

  console.log("⑥ 時計を 自分で 見ない");
  ok(!/Date\.now\(\)/.test(readCode("lib", "autoUpdate.js")), "★決めの ほうは 時計を 見ない");
  ok(/now: Date\.now\(\)/.test(readRaw("components", "VocalTracker.jsx")), "★画面が 渡している");

  console.log("⑦ 見る 間");
  ok(POLL_MS >= 5 * 60 * 1000, "★5分 より 短く しない（★問い合わせを 増やさない）");
  ok(/visibilitychange/.test(readRaw("components", "VocalTracker.jsx")), "★戻ったときにも 見る");
  ok(/cache: "no-store"/.test(src), "★覚え書きを 使わせない");

  console.log("⑧ 書きかけの 見分け");
  const raw = readRaw("components", "VocalTracker.jsx");
  ["saveStatus === \"saving\"", "characterDirty", "profileDraft != null",
   "unsentAttendance", "activeTab === \"today\""].forEach((w) => {
    ok(raw.includes(w), "★" + w + " を 見ている");
  });

  console.log(failed === 0 ? "\n全て ok" : "\n" + failed + "件 NG");
  process.exit(failed === 0 ? 0 : 1);
})();
