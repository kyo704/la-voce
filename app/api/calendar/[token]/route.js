import { createAdminClient } from "@/lib/supabase/admin";
import { itemsToIcs } from "@/lib/ics";

// ============================================================================
// ★★★カレンダーの 配り口（ICS）
//
//   ★出どころ 実行ルート …「カレンダー（ICS）｜my_calendar_items（サーバだけ）
//             ・calendar_tokens｜★体調の 記録を 1文字も 入れない」
//
//   ★★★ここは **ログインを 通りません**。★住所（token）そのものが 鍵 です。
//     ★★だから 住所は 長く します（★24バイト＝48字。`rotate_calendar_token`）。
//     ★★★漏れた ときは、★**住所を 取り替えます**（★回す）。
//       ★取り替えると、★前の 住所は その場で 効かなく なります。
//
//   ★★★合って いない 住所には、★**何も 返しません**。★理由も 返しません。
//     ★`my_calendar_items` が 空を 返します（★台帳の 側の 決め）。
//     ★★ここで 404 を 返すと、★「その 住所は 在る／無い」が 分かって しまいます。
//       ★★だから **空の カレンダー**を 200 で 返します。★数えられません。
//
//   ★★体の 記録は 1列も 通りません。★`my_calendar_items` が 返す 6列 だけ です
//     （uid ／ starts_at ／ ends_at ／ title ／ place ／ canceled）。
//
//   ★★覚えさせません（no-store）。★取り替えた あとに 古い ものが 出ると、
//     ★取り替えた 意味が ありません。
//
//   ★見張り components/tests/calendar-feed.test.js
// ============================================================================

export const dynamic = "force-dynamic";
export const revalidate = 0;

function 返す(text) {
  return new Response(text, {
    status: 200,
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Cache-Control": "no-store, max-age=0",
      "Content-Disposition": 'inline; filename="woolsong.ics"'
    }
  });
}

export async function GET(req, { params }) {
  const token = params && typeof params.token === "string" ? params.token : "";
  // ★★短すぎる 住所は、★台帳に 尋ねる までも ありません。
  //   ★★当てずっぽうを、★台帳の 手前で 止めます。
  if (token.length < 32) return 返す(itemsToIcs([], { name: "Woolsong" }).text);

  const admin = createAdminClient();
  const { data, error } = await admin.rpc("my_calendar_items", { p_token: token });
  if (error) {
    console.error("★カレンダーを 組み立てられませんでした:", error);
    // ★★★誤りの ときも、★空の カレンダーを 返します。
    //   ★500 を 返すと、★「在る 住所で 何かが 起きた」と 分かって しまいます。
    return 返す(itemsToIcs([], { name: "Woolsong" }).text);
  }
  const ics = itemsToIcs(Array.isArray(data) ? data : [], { name: "Woolsong" });
  if (ics.dropped > 0) console.error("★時の 読めない 予定を 落としました:", ics.dropped);
  return 返す(ics.text);
}
