// ============================================================================
// 段（tier）── 無料／¥580／¥1,280（2026-09-08 夜）
//
//   ★★守ること
//     ・★段は 3つだけ
//     ・★決めるのは Stripe の 値段の鍵（★契約時の申告では ない）
//     ・★知らない鍵なら null（★無料に 落とさない）
//     ・★null は「まだ決めていない」＝無料として 読む（★埋めない）
//     ・★契約が 生きていなければ 無料
//     ・★年払いは 申し込みの日から1年（★1月1日では ない）
// ============================================================================

const fs = require("fs");
const path = require("path");
const { readCode } = require("./_source");

const ROOT = path.join(__dirname, "..", "..");
let failed = 0;
function ok(name, cond, extra) {
  if (cond) { console.log("  ○ " + name); return; }
  failed++; console.log("  ✗ " + name + (extra ? "\n      " + extra : ""));
}

(async () => {
  const src = fs.readFileSync(path.join(ROOT, "lib", "tiers.js"), "utf-8");
  const m = await import("data:text/javascript;base64," + Buffer.from(src).toString("base64"));

  console.log("■ ★段");
  ok("★3つだけ", m.TIERS.length === 3);
  ok("★年の点数 56／108／244",
    m.YEARLY_ITEMS[m.FREE] === 56 && m.YEARLY_ITEMS[m.BASIC] === 108
    && m.YEARLY_ITEMS[m.FULL] === 244);
  ok("★たなの数 2／4／えらばない",
    m.SHELVES[m.FREE] === 2 && m.SHELVES[m.BASIC] === 4 && m.SHELVES[m.FULL] === 0);

  console.log("■ ★値段の鍵から 段を 決める");
  const env = {
    STRIPE_PRICE_ID_MONTHLY: "price_580",
    STRIPE_PRICE_ID_ANNUAL: "price_4800",
    STRIPE_PRICE_ID_FULL: "price_1280"
  };
  ok("★¥1,280 は full", m.tierFromPriceId("price_1280", env) === m.FULL);
  ok("★¥580 は basic", m.tierFromPriceId("price_580", env) === m.BASIC);
  ok("★年払い（¥4,800）も basic", m.tierFromPriceId("price_4800", env) === m.BASIC);
  // ★★知らない鍵で、★無料に 落とさないこと。
  ok("★★知らない鍵は null（★無料に 落とさない）",
    m.tierFromPriceId("price_なにこれ", env) === null);
  ok("★鍵が 無ければ null", m.tierFromPriceId("", env) === null);
  // ★★環境変数が 入っていなければ、★その段に しないこと。
  ok("★★環境変数が 空なら、段に しない",
    m.tierFromPriceId("price_1280", {}) === null);

  console.log("■ ★いま 効いている 段");
  ok("★契約が 無ければ 無料", m.effectiveTier(null) === m.FREE);
  ok("★止まっていれば 無料",
    m.effectiveTier({ status: "canceled", tier: "full" }) === m.FREE);
  ok("★生きていれば その段",
    m.effectiveTier({ status: "active", tier: "full" }) === m.FULL
    && m.effectiveTier({ status: "trialing", tier: "basic" }) === m.BASIC);
  // ★★null は「まだ決めていない」。★無料として 読みます。
  ok("★★段が null なら 無料として 読む",
    m.effectiveTier({ status: "active", tier: null }) === m.FREE);
  ok("★知らない段なら 無料",
    m.effectiveTier({ status: "active", tier: "きんいろ" }) === m.FREE);

  console.log("■ ★買い切り（★2026-09-09）");
  const soon = "2027-09-09T00:00:00.000Z";
  ok("★生きている", m.purchaseAlive({ status: "active", ends_at: soon }, "2026-10-01T00:00:00.000Z"));
  // ★★status だけを 見ないこと。★期限が 過ぎても active の ままです。
  ok("★★期限が 過ぎたら 生きていない",
    !m.purchaseAlive({ status: "active", ends_at: "2026-01-01T00:00:00.000Z" }, "2026-10-01T00:00:00.000Z"));
  ok("★終わっていれば 生きていない",
    !m.purchaseAlive({ status: "expired", ends_at: soon }, "2026-10-01T00:00:00.000Z"));
  ok("★終わる日が 無ければ 生きていない", !m.purchaseAlive({ status: "active" }));
  ok("★何も 渡さなくても 落ちない", !m.purchaseAlive(null));
  // ★★弱いほうで 上書きしないこと。★取り上げることに なります。
  ok("★★契約と 買い切りの、強いほうを 見る",
    m.effectiveTierWith({ status: "canceled" },
      [{ status: "active", tier: "full", ends_at: soon }], "2026-10-01T00:00:00.000Z") === m.FULL);
  ok("★買い切りが 切れていれば、契約のほう",
    m.effectiveTierWith({ status: "active", tier: "basic" },
      [{ status: "active", tier: "full", ends_at: "2026-01-01T00:00:00.000Z" }],
      "2026-10-01T00:00:00.000Z") === m.BASIC);
  ok("★どちらも 無ければ 無料", m.effectiveTierWith(null, [], "2026-10-01T00:00:00.000Z") === m.FREE);

  console.log("■ ★webhook が 買い切りを 残すこと");
  const wh2 = readCode("app/api/stripe", "webhook/route.js");
  ok("★payment のときに 残す", /if \(session\.mode === "payment"\) \{\s*\n\s*await recordPurchase\(session\);/.test(wh2));
  ok("★purchases に 入れる", /admin\.from\("purchases"\)\.insert\(/.test(wh2));
  // ★★同じ知らせが 2度 来ても、★誤りとして 騒がないこと。
  ok("★★2度目（23505）を 誤りに しない", /error\.code !== "23505"/.test(wh2));
  ok("★終わる日は お申し込みから1年", /ends_at: oneYearFrom\(startedAt\)/.test(wh2));
  // ★★持ち主が 分からないまま 通り過ぎないこと。
  ok("★★持ち主が 分からなければ、黙らずに 書き残す",
    /★買い切りの持ち主が分かりませんでした/.test(fs.readFileSync(
      path.join(ROOT, "app", "api", "stripe", "webhook", "route.js"), "utf-8")));

  console.log("■ ★2色目");
  ok("★¥1,280 だけ", m.mayChooseSecondColorByTier({ status: "active", tier: "full" }) === true
    && m.mayChooseSecondColorByTier({ status: "active", tier: "basic" }) === false
    && m.mayChooseSecondColorByTier(null) === false);

  console.log("■ ★年払いの 終わりの日");
  ok("★★申し込みの日から 1年（★1月1日では ない）",
    m.oneYearFrom("2026-09-08T00:00:00.000Z").slice(0, 10) === "2027-09-08");
  ok("★おかしな日なら null", m.oneYearFrom("なんでもない") === null);

  console.log("■ ★webhook");
  const wh = readCode("app/api/stripe", "webhook/route.js");
  ok("★段を lib から もらっている", /tierFromPriceId\(/.test(wh));
  // ★★webhook で 段を 判じないこと。
  ok("★★webhook の中で 段を 決めていない",
    !/=== "price_/.test(wh) && !/tier: "(free|basic|full)"/.test(wh));
  // ★★知らない鍵で、★段を 書き換えないこと。
  ok("★★分からないときは、いまの値を そのままに する",
    /if \(!t\) \{/.test(wh) && /return priceId \? \{ stripe_price_id: priceId \} : \{\};/.test(wh));

  console.log("■ ★2色目の 判定が、段に 切り替わっていること");
  const sc = readCode("lib", "secondColorChoice.js");
  ok("★段を 見ている", /mayChooseSecondColorByTier\(subscription\)/.test(sc));
  const vt = readCode("components", "VocalTracker.jsx");
  ok("★契約を 渡している", /\}, subscription\);/.test(vt));
  ok("★段も 読んでいる", /select\("status, tier"\)/.test(vt));
  // ★★列が まだ無い環境でも 落ちないこと。
  ok("★★列が 無くても 落ちない（★status だけで 進む）",
    /select\("status"\)\.eq\("user_id", userId\)\.maybeSingle\(\);\s*\n\s*subRow = r2\.data/.test(vt));

  console.log(failed === 0 ? "\n✅ すべて通りました" : "\n❌ " + failed + " 件");
  process.exit(failed === 0 ? 0 : 1);
})();
