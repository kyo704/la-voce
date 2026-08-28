// 配信されている版を、外から確かめるための入口。
//
// 出典 docs/lavoce-作業指示-配信と更新の確認.md §2・§4
//
// ★なぜ公開の場所に置くか
//   仕様書は「もっと画面のいちばん下に出す」と書いていますが、そこは
//   ログインの内側で、外から確かめられません。2026-08-28 に、配信されて
//   いるかどうかを判断できず、動いているデプロイを「失敗した」と誤って
//   報告しました。逆に、古い版が配られていることに気づけないこともあります。
//   ★版の番号だけを公開します。中身は何も含めません。
//
// ★キャッシュしないこと。古い版の番号を返したら、この入口の意味がありません。
export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  const sha =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    "unknown";
  return new Response(
    JSON.stringify({
      commit: sha,
      short: sha === "unknown" ? "unknown" : sha.slice(0, 7),
      builtAt: process.env.VERCEL_GIT_COMMIT_MESSAGE ? undefined : undefined,
      env: process.env.VERCEL_ENV || "local"
    }),
    {
      status: 200,
      headers: {
        "content-type": "application/json",
        // ★どの層にも溜めさせない
        "cache-control": "no-store, no-cache, must-revalidate, max-age=0"
      }
    }
  );
}
