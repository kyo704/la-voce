// ============================================================================
// 絶対URLの出どころ（ドメイン切替（woolsong.app）.md Phase 0）
//
// ★絶対URLを組み立てる場所を、ここ1か所にまとめます。
//   各所に散らすと、ドメインを変えるときに総当たりになります。
//   このリポジトリでは「同じ決定が2か所にある」ことが繰り返し不具合になっており、
//   ドメインはその最たるものです（メール・招待・OG画像・通知に散らばるため）。
//
// ★このファイルは、まだ何も切り替えません。出どころを1つにするだけです。
//
// 環境変数（Vercel）
//   Production   NEXT_PUBLIC_SITE_URL = https://woolsong.app
//   Preview      ★設定しない（VERCEL_URL を使う。プレビューは自分のURLで動くべき）
//   Development  ★設定しない（localhost:3000）
// ============================================================================

export function getBaseUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL;
  if (process.env.VERCEL_ENV === "preview" && process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  // ★仕様書の版から1行だけ足しています（同書 §3）。
  //   仕様書どおりだと、本番で NEXT_PUBLIC_SITE_URL を設定するまでのあいだ
  //   localhost が返ります。その窓のあいだに LINE のリマインドが送られると、
  //   利用者の手元に http://localhost:3000/ というリンクが届きます。
  //   いま動いているものを壊さないため、本番では、せめてその配備自身のURLへ倒します。
  //   ★NEXT_PUBLIC_SITE_URL が設定されれば、この行は二度と使われません。
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

/**
 * パスをつないだ絶対URL。
 * ★末尾のスラッシュを二重にしないこと。メールのリンクで // が出ると、
 *   受け取った人には壊れて見えます。
 */
export function absoluteUrl(path = "/") {
  const base = getBaseUrl().replace(/\/+$/, "");
  const rest = String(path || "/");
  return `${base}${rest.startsWith("/") ? "" : "/"}${rest}`;
}

/**
 * ★旧オリジンは消しません（同書 §0）。
 *   Supabase の Redirect URLs には新旧の両方を残します。
 *   ここに置いておくのは、後始末（Phase 3）で「どれが旧か」を
 *   1か所から参照できるようにするためです。
 */
export const LEGACY_ORIGINS = ["https://la-voce.vercel.app"];

/** 本番のドメイン。★切り替えの判断はしません。名前を持つだけです。 */
export const PRODUCTION_ORIGIN = "https://woolsong.app";

/**
 * いま見ているホストが、旧オリジンかどうか。
 *
 * ★このアプリでは、新旧の2つのドメインが「同じ1つのデプロイ」を指しています。
 *   仕様書 §8-1① は「旧オリジンに最後のデプロイを1回行う」と書いていますが、
 *   配備が分かれていないため、そのとおりにはできません。
 *   代わりに、配られたコードの中で「どちらのホストで開かれたか」を見ます。
 *
 * @param {string} hostname  window.location.hostname
 */
export function isLegacyOrigin(hostname) {
  if (!hostname) return false;
  return LEGACY_ORIGINS.some((origin) => {
    try { return new URL(origin).hostname === hostname; } catch { return false; }
  });
}

/**
 * 旧オリジンから新オリジンへの移動先。★パスを落とさないこと（§10）。
 * 配った招待リンクが、トップに飛ばされて死にます。
 */
export function newOriginUrlFor(location) {
  if (!location) return PRODUCTION_ORIGIN + "/";
  const path = location.pathname || "/";
  const search = location.search || "";
  const hash = location.hash || "";
  return `${PRODUCTION_ORIGIN}${path}${search}${hash}`;
}
