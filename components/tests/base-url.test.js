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

  console.log("\n=== OG（§4 ゲートA） ===");
  assertTrue(/openGraph: \{/.test(layout), "openGraph がある");
  assertTrue(/alternates: \{ canonical:/.test(layout), "canonical がある");
  assertTrue(/url: "\/"/.test(layout), "og:url を相対で書いている（絶対URLにしない）");
  assertTrue(/\/icons\/icon-1024\.png/.test(layout), "og:image が実在する画像を指している");
  // ★直書きすると、ドメインを変えるときに総当たりに戻る。Phase 0 の目的そのもの。
  assertTrue(!/https?:\/\//.test(layout),
    "★layout.js に絶対URLの直書きが無い（すべて metadataBase 由来）");
  assertTrue(require("fs").existsSync(
    require("path").join(__dirname, "..", "..", "public", "icons", "icon-1024.png")),
    "og:image のファイルが実在する");

  console.log("\n=== ★認証の戻り先は、わざと window.location.origin のまま（§5-3） ===");
  // ★これは「直し忘れ」ではありません。2026-08-28 に検討したうえで、
  //   このままにすると決めました。次に読む人が getBaseUrl() に
  //   「統一」しないように、理由ごとここに固定します。
  //
  //   理由: 新旧2つのドメインが同時に生きている期間があります（Phase 4 の
  //   308 転送を入れるまで）。window.location.origin は、その人がいま
  //   実際に見ているドメインを返します。旧URLから登録した人には旧URLの
  //   確認リンクが届き、そのまま完了できます。
  //   ここを getBaseUrl() に固定すると、旧URLにいる人に新URLのリンクを
  //   送ることになり、転送がまだ無い期間は手続きの途中で行き止まります。
  //
  //   ★getBaseUrl() に寄せてよいのは、Phase 4 の転送が入り、旧URLからの
  //     流入が無くなってからです。それまでは、この形が正しい。
  //
  //   ★前提: Supabase の Redirect URLs に新旧の両方が載っていること（§5-1）。
  //     載っていないほうから来た人は、Supabase 側で弾かれます。
  {
    const login = stripComments(readRaw("app", "login", "page.js"));
    const signup = stripComments(readRaw("components", "SignupForm.jsx"));
    assertTrue(/\$\{window\.location\.origin\}\/auth\/callback/.test(login),
      "パスワード再設定の戻り先が window.location.origin 由来");
    assertTrue(/\$\{window\.location\.origin\}\/auth\/callback/.test(signup),
      "新規登録の確認メールの戻り先が window.location.origin 由来");
    // ★ドメインの直書きだけは、いつでも間違いです。
    [["app/login/page.js", login], ["components/SignupForm.jsx", signup]].forEach(([name, code]) => {
      assertTrue(!/https?:\/\/(woolsong\.app|la-voce\.vercel\.app)/.test(code),
        `★${name} にドメインの直書きが無い`);
    });
  }

  console.log("\n=== 旧オリジンの後始末（§8-1①） ===");
  {
    assertEqual(mod.isLegacyOrigin("la-voce.vercel.app"), true, "旧オリジンを見分ける");
    assertEqual(mod.isLegacyOrigin("woolsong.app"), false, "★新オリジンでは働かない");
    assertEqual(mod.isLegacyOrigin(""), false, "空のホスト名で誤作動しない");
    // ★パスを落とさないこと（§10）。配った招待リンクが死にます。
    assertEqual(
      mod.newOriginUrlFor({ pathname: "/learn/xxx", search: "?a=1", hash: "#b" }),
      "https://woolsong.app/learn/xxx?a=1#b", "★移動先がパスを保つ");

    const notice = stripComments(readRaw("components", "LegacyOriginNotice.jsx"));
    assertTrue(/getRegistrations\(\)/.test(notice), "Service Worker を解除している");
    assertTrue(/\.unregister\(\)/.test(notice), "unregister を呼んでいる");
    assertTrue(/caches\.keys\(\)/.test(notice) && /caches\.delete\(/.test(notice),
      "キャッシュを全部消している");
    assertTrue(/新しいURLに移動しました/.test(notice), "案内の文言がある");
    assertTrue(/location\.replace\(/.test(notice),
      "★replace で移動する（戻るボタンで旧オリジンに戻らせない）");
    assertTrue(/<a[\s\S]{0,200}href=\{target\}/.test(notice),
      "★押せるボタンもある（自動で移動しなかった人のため）");
    // ★後始末が先、移動があと。逆だと解除する手段を失う。
    assertTrue(notice.indexOf("unregister") < notice.indexOf("location.replace("),
      "★解除してから移動している");

    const vt = stripComments(readRaw("components", "VocalTracker.jsx"));
    assertTrue(/isLegacyOrigin\(window\.location\.hostname\)\) return;/.test(vt),
      "★旧オリジンでは Service Worker を登録し直さない");

    const sw = readRaw("public", "sw.js");
    // ★2026-08-29: 画面への移動にはオフライン画面を返すようになったため、
    //   書き方が変わりました。確かめたいこと（undefined を返さない）は同じです。
    assertTrue(/return Response\.error\(\);/.test(sw),
      "★キャッシュに無いとき undefined を返さない");
    assertTrue(/caches\.match\(OFFLINE_URL\)/.test(sw),
      "★画面への移動なら、オフライン画面を返す");
    assertTrue(!/\.catch\(\(\) => caches\.match\(event\.request\)\)/.test(sw),
      "★落ちる書き方が残っていない");
    assertTrue(/CACHE_NAME = "woolsong-shell-v3"/.test(sw),
      "キャッシュ名を上げた（古い版が activate で消える）");
  }

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
