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
      env: process.env.VERCEL_ENV || "local",
      // ★★環境変数が入っているかどうかだけを、返します（★2026-09-07）。
      //   ★★値そのものは返しません。★入っているか、いないかだけです。
      //     ★中に入っているのは、★人を指す ID です。★外へ出しません。
      //   ★★なぜ要るか
      //     ★2026-09-07、★着せかえが「消えた」というご報告がありました。
      //     ★部品も配線も、★1つも欠けていませんでした。
      //     ★★NEXT_PUBLIC_WARDROBE_USER_IDS が空だっただけです。
      //     ★これは、★こちらからは見えません。★確かめる手段がありませんでした。
      //   ★★NEXT_PUBLIC_ の変数は、★組み立てのときに埋めこまれます。
      //     ★あとから足しても、★組み立て直すまで効きません。
      //     ★★だから「入れたのに出ない」が起きます。★ここで見分けられます。
      // ★★ここに並べてよいのは、★実際にコードが読んでいる変数だけです。
      //   ★2026-09-07、★NEXT_PUBLIC_PAID_GATE_USER_IDS を並べてしまいました。
      //     ★どこからも読まれていない名前です。★いつも false を返します。
      //     ★★「何か足りない」と読めて、★かえって迷わせます。
      //   ★足すときは、★その変数を読んでいる場所を、先に確かめること。
      flags: {
        wardrobeIds: (process.env.NEXT_PUBLIC_WARDROBE_USER_IDS || "").trim() !== "",
        gateTestIds: (process.env.NEXT_PUBLIC_GATE_TEST_USER_IDS || "").trim() !== ""
      }
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
