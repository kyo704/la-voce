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
        gateTestIds: (process.env.NEXT_PUBLIC_GATE_TEST_USER_IDS || "").trim() !== "",
        // ★★鍵を出さない方の名簿（★2026-09-08）。
        //   ★★門（wardrobeIds）とは、★別の名簿です。
        //   ★入れたのに効かない、を★外から見分けられるようにします。
        //   ★読んでいる場所：lib/sheepWardrobe.js の mayWearEverything
        allItemsIds: (process.env.NEXT_PUBLIC_WARDROBE_ALL_ITEMS_USER_IDS || "").trim() !== "",
        // ★★新しい画面づくりの 門（★2026-09-09）。
        //   ★★NEXT_PUBLIC_ は 組み立てのときに 埋まります。
        //     ★あとから 足しても、★組み立て直すまで 効きません。
        //     ★★だから「入れたのに 出ない」が 起きます。★ここで 見分けられます。
        secondColorIds: (process.env.NEXT_PUBLIC_SECOND_COLOR_USER_IDS || "").trim() !== "",
        layoutV2Ids: (process.env.NEXT_PUBLIC_LAYOUT_V2_USER_IDS || "").trim() !== ""
      },
      // ★★何人ぶん入っているか（★2026-09-07）。
      //   ★★値そのものは、★決して出しません。★数だけです。
      //     ★利用者の id は、★それ自体が個人を指します。
      //   ★★なぜ数が要るのか。
      //     ★2026-09-07、「38人が219点すべてを着られる状態か」を
      //     ★確かめる手立てが、★外から1つもありませんでした。
      //     ★真偽（入っているか）だけでは、★1人なのか38人なのか分かりません。
      //     ★★管理画面を開かないと分からない、という状態を、なくします。
      //   ★1 なら、★お一人だけです。★門は、その方にしか開いていません。
      counts: {
        wardrobeIds: (process.env.NEXT_PUBLIC_WARDROBE_USER_IDS || "")
          .split(",").map((x) => x.trim()).filter(Boolean).length,
        gateTestIds: (process.env.NEXT_PUBLIC_GATE_TEST_USER_IDS || "")
          .split(",").map((x) => x.trim()).filter(Boolean).length,
        allItemsIds: (process.env.NEXT_PUBLIC_WARDROBE_ALL_ITEMS_USER_IDS || "")
          .split(",").map((x) => x.trim()).filter(Boolean).length,
        secondColorIds: (process.env.NEXT_PUBLIC_SECOND_COLOR_USER_IDS || "")
          .split(",").map((x) => x.trim()).filter(Boolean).length,
        layoutV2Ids: (process.env.NEXT_PUBLIC_LAYOUT_V2_USER_IDS || "")
          .split(",").map((x) => x.trim()).filter(Boolean).length
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
