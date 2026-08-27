// ============================================================================
// ★どの版が配信されているかを、画面から確かめられるようにする。
//
//   このセッションで「直したのに直っていない」を3回追いかけ、そのたびに
//   「git には入っている」と「端末で動いている」の差を確かめる手段が
//   ありませんでした。手元のコードをいくら読んでも、配信されている
//   bundle が古ければ意味がありません。
//
//   Vercel は VERCEL_GIT_COMMIT_SHA を渡してくれます。それを画面に埋めます。
//   利用者には見えません（DOM の属性と window の値だけ）。
// ============================================================================
const sha =
  process.env.VERCEL_GIT_COMMIT_SHA ||
  process.env.GITHUB_SHA ||
  "dev";

const nextConfig = {
  env: {
    NEXT_PUBLIC_BUILD_SHA: sha.slice(0, 7),
    NEXT_PUBLIC_BUILD_AT: new Date().toISOString()
  }
};

export default nextConfig;
