#!/usr/bin/env node
/**
 * 絶対URLの出どころ（ドメイン切替（woolsong.app）.md Phase 0）。
 *
 * ★絶対URLを組み立てる場所を、1か所にまとめる。
 *   各所に散らすと、ドメインを変えるときに総当たりになります。
 *   そして必ず、どこか1つが古いまま残ります。
 *
 * ★Phase 0 は、まだ何も切り替えません。出どころを1つにするだけです。
 */
const { readRaw, stripComments } = require("./_source");
let passCount = 0, failCount = 0;
function assertTrue(c, label) {
  if (c) { console.log(`  ✓ ${label}`); passCount++; } else { console.log(`  ✗ ${label}`); failCount++; }
}
function assertEqual(a, b, label) {
  if (JSON.stringify(a) === JSON.stringify(b)) { console.log(`  ✓ ${label}`); passCount++; }
  else { console.log(`  ✗ ${label}  期待:${JSON.stringify(b)} 実際:${JSON.stringify(a)}`); failCount++; }
}

// ★getBaseUrl は、呼ばれたときに process.env を読む。
//   はじめは読み込みの前後で env を戻していて、どの場合も同じ結果になっていた。
//   環境変数は、呼ぶ直前に置いて、呼んだあとに片づける。
let mod = null;
async function loadOnce() {
  if (!mod) {
    mod = await import("data:text/javascript;base64," +
      Buffer.from(readRaw("lib", "baseUrl.js"), "utf-8").toString("base64"));
  }
  return mod;
}
function withEnv(env, fn) {
  const keys = ["NEXT_PUBLIC_SITE_URL", "VERCEL_ENV", "VERCEL_URL"];
  const saved = {};
  keys.forEach((k) => { saved[k] = process.env[k]; delete process.env[k]; });
  Object.entries(env).forEach(([k, v]) => { process.env[k] = v; });
  try { return fn(); }
  finally {
    keys.forEach((k) => { if (saved[k] === undefined) delete process.env[k]; else process.env[k] = saved[k]; });
  }
}

async function main() {
  console.log("\n=== 出どころが1か所であること ===");
  const m = await loadOnce();
  withEnv({ NEXT_PUBLIC_SITE_URL: "https://woolsong.app" }, () => {
    assertEqual(m.getBaseUrl(), "https://woolsong.app", "本番は NEXT_PUBLIC_SITE_URL を使う");
    assertEqual(m.absoluteUrl("/dashboard"), "https://woolsong.app/dashboard", "パスをつなげる");
  });
  withEnv({ NEXT_PUBLIC_SITE_URL: "https://woolsong.app/" }, () => {
    assertEqual(m.absoluteUrl("/dashboard"), "https://woolsong.app/dashboard",
      "★末尾のスラッシュを二重にしない（メールのリンクで // が出ると壊れて見える）");
    assertEqual(m.absoluteUrl("dashboard"), "https://woolsong.app/dashboard", "先頭のスラッシュが無くても同じ");
  });
  withEnv({ VERCEL_ENV: "preview", VERCEL_URL: "my-preview.vercel.app" }, () => {
    assertEqual(m.getBaseUrl(), "https://my-preview.vercel.app",
      "★プレビューは、自分のURLで動く（本番の住所を指さない）");
  });
  withEnv({}, () => {
    assertEqual(m.getBaseUrl(), "http://localhost:3000", "手元では localhost");
  });
  // ★設定し忘れの窓。本番で localhost を返すと、LINE のリマインドに
  //   http://localhost:3000/ というリンクが載って利用者の手元へ届く。
  withEnv({ VERCEL_ENV: "production", VERCEL_URL: "la-voce-abc.vercel.app" }, () => {
    assertEqual(m.getBaseUrl(), "https://la-voce-abc.vercel.app",
      "★本番で未設定でも、localhost を配らない");
  });

  console.log("\n=== 直書きの絶対URLが残っていないこと ===");
  const FILES = [
    ["app/api/cron/line-reminder/route.js", "LINEのリマインド"],
    ["app/api/stripe/checkout/route.js", "Stripe の checkout"],
    ["app/api/stripe/portal/route.js", "Stripe の portal"],
    ["app/start/page.js", "印刷用の1枚"]
  ];
  FILES.forEach(([rel, name]) => {
    const parts = rel.split("/");
    const code = stripComments(readRaw(parts[0], parts.slice(1).join("/")));
    assertTrue(!/https:\/\/la-voce|vercel\.app/.test(code),
      `★${name} に、直書きの絶対URLが無い`);
    assertTrue(/absoluteUrl\(|getBaseUrl\(/.test(code), `${name} が出どころを通している`);
  });

  console.log("\n=== metadataBase ===");
  const layout = stripComments(readRaw("app", "layout.js"));
  assertTrue(/metadataBase: new URL\(getBaseUrl\(\)\)/.test(layout),
    "★OG画像の基準を、出どころから決めている（Next.js に推測させない）");

  console.log("\n=== まだ何も切り替えていないこと（Phase 0 の範囲）===");
  {
    assertTrue(m.LEGACY_ORIGINS.includes("https://la-voce.vercel.app"),
      "★旧オリジンを消していない（Redirect URLs には新旧の両方を残す）");
    assertEqual(m.PRODUCTION_ORIGIN, "https://woolsong.app", "新しい住所を、名前としてだけ持っている");
  }

  console.log(`\n合計: ${passCount}件成功 / ${failCount}件失敗`);
  if (failCount > 0) { console.log("\n⚠ 失敗があります。"); process.exit(1); }
  console.log("\n✓ すべて成功しました。");
}
main().catch((e) => { console.error(e); process.exit(1); });
