// ============================================================================
// ★写真を 見せる 道 ── ★署名つき（★裁定199 ③・坂本さんの お決め 2026-09-25）
//
//   ★★★入れものは 公開では ありません（`public = false`）。
//     ★だから 道を 知って いても 開けません。★ここで 署名を 付けます。
//
//   ★★★見せて よいかを **ここでは 決めません**。
//     ★`portfolio_photos_read`（★sql/83）が 決めます ──
//       ★本人 …… ぜんぶ ／ ★他人 …… 印が 立って いて 公開の 範囲が 合う とき だけ。
//     ★★だから **その方の 鍵で 行を 引きます**。
//       ★引けた ＝ 見て よい。★引けなかった ＝ 見て はいけない。
//     ★★★同じ 判じを 2か所に 書きません。★書くと 片方が 古く なります。
//
//   ★★★`id` だけ 受け取ります。★`path` を 受け取りません ──
//     ★`path` を 受け取ると、★他人の 道を 渡されて しまいます。
//
//   ★★署名の 長さは `lib/photoExif.js` が 持ちます（★10分）。
// ============================================================================
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getUserWithTimeout } from "@/lib/withTimeout";
import { BUCKET, SIGNED_URL_SECONDS, COLS_PHOTO } from "@/lib/photoExif";

/** ★一度に 頼める 枚数。★1ページ ぶん で 足ります。 */
const MAX_IDS = 20;

export async function POST(request) {
  const supabase = createClient();
  const { user, unreachable } = await getUserWithTimeout(supabase, "写真の 道を 作る ときの 確かめ");
  if (unreachable) {
    return Response.json({ ok: false, line: "いまは つながりません。" }, { status: 503 });
  }
  if (!user) {
    return Response.json({ ok: false, line: "もう一度 お入りください。" }, { status: 401 });
  }

  let body;
  try { body = await request.json(); }
  catch (e) { return Response.json({ ok: false, line: "受け取れませんでした。" }, { status: 400 }); }

  const ids = Array.isArray(body && body.ids) ? body.ids.filter((x) => typeof x === "string") : [];
  if (ids.length === 0 || ids.length > MAX_IDS) {
    return Response.json({ ok: false, line: "枚数が 合いません。" }, { status: 400 });
  }

  // ★★★その方の 鍵で 引きます。★決まりが 通した 行 だけ 返ります。
  //   ★★印の 立って いない 他人の 写真は、★ここで 1行も 返りません。
  const { data, error } = await supabase
    .from("portfolio_photos").select(COLS_PHOTO).in("id", ids);
  if (error) {
    return Response.json({ ok: false, line: "読めませんでした。" }, { status: 500 });
  }

  const rows = data || [];
  if (rows.length === 0) {
    // ★★「ありません」と だけ 言います。★なぜ 見えないかを 言いません ──
    //   ★★★「印が 立って いない」と 言うと、★その 方の 事情を 漏らします。
    return Response.json({ ok: true, urls: {} });
  }

  // ★★署名を 付けるのは 管理の 鍵 です。★入れものに 決まりが 無い ため です。
  const admin = createAdminClient();
  const urls = {};
  for (const r of rows) {
    if (!r || !r.path) continue;
    const s = await admin.storage.from(BUCKET)
      .createSignedUrl(r.path, SIGNED_URL_SECONDS);
    // ★★作れなかった 1枚で 全部を 止めません。★その 1枚だけ 出ません。
    if (!s.error && s.data && s.data.signedUrl) urls[r.id] = s.data.signedUrl;
  }

  return Response.json({ ok: true, urls });
}
